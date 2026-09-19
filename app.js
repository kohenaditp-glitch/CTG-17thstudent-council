/* ============================================================
   CTG — shared data layer (Firebase Firestore + Auth)

   Every page loads firebase-config.js, then this file (and, on
   pages with translated text, i18n.js). Nothing here needs
   editing during setup — only firebase-config.js and the
   Firestore rules in the console. See SETUP.md.
   ============================================================ */

/* ---------- Turning Firebase error codes into plain English ---------- */

function describeFirebaseError(err) {
  const code = (err && err.code) || '';

  if (code === 'permission-denied' || code === 'auth/insufficient-permission') {
    return {
      title: "The database refused the request",
      body: "Firestore is connected, but its security rules are blocking this. " +
            "Usually the rules were never published, or the admin UID list in " +
            "them is empty.",
      fix: "Firebase console \u2192 Firestore Database \u2192 Rules \u2192 paste firestore.rules \u2192 Publish."
    };
  }
  if (code === 'unavailable' || code === 'auth/network-request-failed') {
    return {
      title: "Couldn't reach Firebase",
      body: "The browser couldn't connect. Usually this is the internet connection, " +
            "or an extension or school network blocking googleapis.com.",
      fix: "Check your connection, then reload the page."
    };
  }
  if (code === 'not-found' || code === 'failed-precondition') {
    return {
      title: "No Firestore database found in this project",
      body: "The project exists, but Firestore itself hasn't been created yet, " +
            "or it was created as \u201cDatastore mode\u201d rather than Native mode.",
      fix: "Firebase console \u2192 Build \u2192 Firestore Database \u2192 Create database."
    };
  }
  if (code === 'auth/invalid-api-key' || code === 'auth/api-key-not-valid' ||
      code === 'invalid-argument') {
    return {
      title: "The project keys look wrong",
      body: "Firebase rejected the keys in firebase-config.js.",
      fix: "Re-copy the config block from Project settings \u2192 Your apps."
    };
  }
  return {
    title: "Something went wrong talking to the database",
    body: (err && err.message) ? err.message : String(err),
    fix: "Open the browser console (right-click \u2192 Inspect \u2192 Console) for the full message."
  };
}

function showTrouble(elId, err) {
  const el = document.getElementById(elId);
  console.error('[CTG]', err);
  if (!el) return;
  const d = describeFirebaseError(err);
  el.innerHTML =
    '<strong>' + escapeHtml(d.title) + '</strong>' +
    escapeHtml(d.body) +
    '<p class="fix">' + escapeHtml(d.fix) +
    (err && err.code ? ' <code>' + escapeHtml(err.code) + '</code>' : '') +
    '</p>';
  el.classList.add('show');
}

function hideTrouble(elId) {
  const el = document.getElementById(elId);
  if (el) el.classList.remove('show');
}

/* ---------- Guard: did firebase-config.js actually run? ---------- */

const CONFIG_OK = (typeof db !== 'undefined' && typeof auth !== 'undefined');

if (!CONFIG_OK) {
  console.error('[CTG] firebase-config.js did not initialise. ' +
                'Check that the file exists in this folder and has no typos.');
}

/* ============================================================
   Language detection + machine translation

   Detection is a cheap Hangul-range check — no network needed.
   Translation calls MyMemory's free REST API directly from the
   browser (no key, no backend, CORS-enabled). Quality is good
   enough for a first draft; the admin reviews and can edit the
   result before anything is published. See SETUP.md for the
   optional free-tier quota note.
   ============================================================ */

function detectLang(text) {
  return /[\uAC00-\uD7A3]/.test(text || '') ? 'ko' : 'en';
}

async function translateText(text, sourceLang, targetLang) {
  const clean = (text || '').trim();
  if (!clean) return '';
  if (sourceLang === targetLang) return clean;

  const url = 'https://api.mymemory.translated.net/get?q=' +
    encodeURIComponent(clean) + '&langpair=' + sourceLang + '|' + targetLang;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Translation service unavailable (' + res.status + ')');
  const data = await res.json();
  const out = data && data.responseData && data.responseData.translatedText;
  if (!out) throw new Error('Translation service returned no result');
  return out;
}

// Given one piece of text in whichever language it was written, return
// { en, ko, sourceLang } with a machine-translated draft for the other.
async function draftBilingual(text) {
  const sourceLang = detectLang(text);
  const targetLang = sourceLang === 'en' ? 'ko' : 'en';
  const translated = await translateText(text, sourceLang, targetLang);
  return sourceLang === 'en'
    ? { en: text.trim(), ko: translated, sourceLang }
    : { en: translated, ko: text.trim(), sourceLang };
}

/* ============================================================
   PrayerBoard — the whole data layer
   ============================================================ */

const PrayerBoard = {

  /* ---------------- Submissions (questions + prayers) ---------------- */
  // Submitted as written, in whichever language — never translated on
  // the way in. Translation only happens when an admin publishes a
  // question to the public board.

  addSubmission({ type, name, message }) {
    return db.collection('submissions').add({
      type,                                  // 'ask' | 'prayer'
      name: (name || '').trim(),
      message: (message || '').trim(),
      date: firebase.firestore.FieldValue.serverTimestamp(),
      seen: false,
    });
  },

  onSubmissions(callback, onError) {
    return db.collection('submissions').orderBy('date', 'desc').onSnapshot(
      snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      err => onError && onError(err)
    );
  },

  deleteSubmission(id) {
    return db.collection('submissions').doc(id).delete();
  },

  setSubmissionSeen(id, seen) {
    return db.collection('submissions').doc(id).update({ seen: !!seen });
  },

  // question_* / answer_* are the bilingual pairs the admin has already
  // reviewed (see the "translate & review" step in admin.html).
  async publishSubmissionToBoard(id, { question_en, question_ko, answer_en, answer_ko }) {
    const doc = await db.collection('submissions').doc(id).get();
    if (!doc.exists) return;
    const item = doc.data();
    if (item.type !== 'ask') throw new Error('Only questions can be posted to the board.');
    await db.collection('board').add({
      question_en: (question_en || '').trim(),
      question_ko: (question_ko || '').trim(),
      answer_en: (answer_en || '').trim(),
      answer_ko: (answer_ko || '').trim(),
      date: firebase.firestore.FieldValue.serverTimestamp(),
    });
    await db.collection('submissions').doc(id).delete();
  },

  /* ---------------- Board (public, bilingual, answered questions) ---------------- */

  onBoard(callback, onError) {
    return db.collection('board').orderBy('date', 'desc').onSnapshot(
      snap => callback(snap.docs.map(d => ({ id: d.id, ...normalizeBoardEntry(d.data()) }))),
      err => onError && onError(err)
    );
  },

  addBoardEntry({ question_en, question_ko, answer_en, answer_ko }) {
    return db.collection('board').add({
      question_en: (question_en || '').trim(),
      question_ko: (question_ko || '').trim(),
      answer_en: (answer_en || '').trim(),
      answer_ko: (answer_ko || '').trim(),
      date: firebase.firestore.FieldValue.serverTimestamp(),
    });
  },

  updateBoardEntry(id, { question_en, question_ko, answer_en, answer_ko }) {
    const data = {};
    if (question_en !== undefined) data.question_en = question_en.trim();
    if (question_ko !== undefined) data.question_ko = question_ko.trim();
    if (answer_en !== undefined) data.answer_en = answer_en.trim();
    if (answer_ko !== undefined) data.answer_ko = answer_ko.trim();
    return db.collection('board').doc(id).update(data);
  },

  deleteBoardEntry(id) {
    return db.collection('board').doc(id).delete();
  },

  /* ---------------- Admin auth ---------------- */

  signIn(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
  },
  signOut() {
    return auth.signOut();
  },
  onAuthChange(callback) {
    return auth.onAuthStateChanged(callback);
  },
  currentUid() {
    return auth.currentUser ? auth.currentUser.uid : null;
  },
};

// Older board entries (from before the bilingual redesign) only have
// plain `question` / `answer` fields. Show that same text in both
// languages rather than leaving one blank.
function normalizeBoardEntry(data) {
  if (data.question_en !== undefined || data.question_ko !== undefined) return data;
  return {
    ...data,
    question_en: data.question || '',
    question_ko: data.question || '',
    answer_en: data.answer || '',
    answer_ko: data.answer || '',
  };
}

/* ============================================================
   Small helpers used by every page
   ============================================================ */

function formatDate(ts) {
  if (!ts) return 'Just now';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = (str === undefined || str === null) ? '' : String(str);
  return div.innerHTML;
}

// True if a Firestore Timestamp is within the last `days` days.
function isWithinDays(ts, days) {
  if (!ts || !ts.toDate) return false;
  const ms = Date.now() - ts.toDate().getTime();
  return ms >= 0 && ms < days * 24 * 60 * 60 * 1000;
}
