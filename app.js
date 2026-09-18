/* ============================================================
   CTG — shared data layer (Firebase Firestore + Auth)

   Every page loads firebase-config.js first, then this file.
   Nothing here needs editing during setup — only firebase-config.js
   and the Firestore rules in the Firebase console. See SETUP.md.
   ============================================================ */

/* ---------- Turning Firebase error codes into plain English ---------- */

function describeFirebaseError(err) {
  const code = (err && err.code) || '';

  if (code === 'permission-denied' || code === 'auth/insufficient-permission') {
    return {
      title: "The database refused the request",
      body: "Firestore is connected, but its security rules are blocking this. " +
            "This is almost always because the rules from step 4 of SETUP.md " +
            "were never published, or the admin UID list in them is empty.",
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
      fix: "Firebase console \u2192 Build \u2192 Firestore Database \u2192 Create database (step 3 of SETUP.md)."
    };
  }
  if (code === 'auth/invalid-api-key' || code === 'auth/api-key-not-valid' ||
      code === 'invalid-argument') {
    return {
      title: "The project keys look wrong",
      body: "Firebase rejected the keys in firebase-config.js.",
      fix: "Re-copy the config block from Project settings \u2192 Your apps (step 7 of SETUP.md)."
    };
  }
  return {
    title: "Something went wrong talking to the database",
    body: (err && err.message) ? err.message : String(err),
    fix: "Open the browser console (right-click \u2192 Inspect \u2192 Console) for the full message."
  };
}

/* Paint an error into a .trouble element, if the page has one. */
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
   PrayerBoard — the whole data layer
   ============================================================ */

const PrayerBoard = {

  /* ---------------- Submissions (questions + prayers) ---------------- */

  addSubmission({ type, name, message }) {
    return db.collection('submissions').add({
      type,                                  // 'ask' | 'prayer'
      name: (name || '').trim(),
      message: (message || '').trim(),
      date: firebase.firestore.FieldValue.serverTimestamp(),
      seen: false,                           // ticked off by admin once read
    });
  },

  // Live updates. callback(list) runs now and on every change.
  // onError(err) runs if Firestore refuses. Returns an unsubscribe function.
  onSubmissions(callback, onError) {
    return db.collection('submissions').orderBy('date', 'desc').onSnapshot(
      snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      err => onError && onError(err)
    );
  },

  deleteSubmission(id) {
    return db.collection('submissions').doc(id).delete();
  },

  // Prayer requests stay private. Admin can only mark them seen/unseen.
  setSubmissionSeen(id, seen) {
    return db.collection('submissions').doc(id).update({ seen: !!seen });
  },

  // Turns an 'ask' submission into a public board entry, then removes the
  // original. Prayer requests never pass through here.
  async publishSubmissionToBoard(id, answer) {
    const doc = await db.collection('submissions').doc(id).get();
    if (!doc.exists) return;
    const item = doc.data();
    if (item.type !== 'ask') throw new Error('Only questions can be posted to the board.');
    await db.collection('board').add({
      question: item.message,
      answer: (answer || '').trim(),
      date: firebase.firestore.FieldValue.serverTimestamp(),
    });
    await db.collection('submissions').doc(id).delete();
  },

  /* ---------------- Board (public, answered questions) ---------------- */

  onBoard(callback, onError) {
    return db.collection('board').orderBy('date', 'desc').onSnapshot(
      snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      err => onError && onError(err)
    );
  },

  addBoardEntry({ question, answer }) {
    return db.collection('board').add({
      question: question.trim(),
      answer: answer.trim(),
      date: firebase.firestore.FieldValue.serverTimestamp(),
    });
  },

  updateBoardEntry(id, { question, answer }) {
    const data = {};
    if (question !== undefined) data.question = question.trim();
    if (answer !== undefined) data.answer = answer.trim();
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

  // Fires immediately with the current user (or null), then on every
  // sign-in/sign-out. Returns an unsubscribe function.
  onAuthChange(callback) {
    return auth.onAuthStateChanged(callback);
  },

  currentUid() {
    return auth.currentUser ? auth.currentUser.uid : null;
  },
};

/* ============================================================
   Small helpers used by every page
   ============================================================ */

// Firestore Timestamp (or null, in the moment between writing and the
// server value arriving) -> readable local date/time.
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
