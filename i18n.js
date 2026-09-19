/* ============================================================
   CTG — i18n (UI text only; user-submitted content is a
   separate concern handled by translateText() in app.js)

   Usage: give any element a data-i18n="key" attribute for text
   content, or data-i18n-placeholder="key" for an input/textarea
   placeholder. applyLanguage() fills them in from DICT below and
   remembers the choice in localStorage so it holds across pages.
   ============================================================ */

const DICT = {
  en: {
    nav_home: "Home",
    nav_answers: "Answers",
    site_tagline1: "Closer To God",
    site_eyebrow: "17th Student Council",
    door_ask_title: "Ask the Pastor",
    door_ask_sub: "Private Q&A",
    door_prayer_title: "Send Your Prayer",
    door_prayer_sub: "Private request",
    new_heading: "New this week",
    badge_new: "New",
    new_empty: "Nothing new this week \u2014",
    new_empty_link: "browse all answers",
    answers_heading: "Answered",
    search_placeholder: "Search…",
    answers_empty: "Nothing posted yet \u2014 check back soon.",
    back: "\u2190 Back",
    back_home: "\u2190 Back to home",
    ask_title: "Ask the Pastor",
    ask_hint: "Sent privately. The pastor may post the answer to the board.",
    ask_label: "Your question",
    ask_placeholder: "What would you like to ask?",
    name_label: "Your name (optional)",
    name_placeholder: "Leave blank to stay anonymous",
    send_question: "Send question",
    cancel: "Cancel",
    ask_confirm: "Sent privately to the pastor. Thank you.",
    prayer_title: "Send Your Prayer",
    prayer_hint: "Sent privately to the pastor and prayer team only. It is never shown publicly or answered on the board.",
    prayer_label: "Your prayer request",
    prayer_placeholder: "What would you like prayer for?",
    send_prayer: "Send prayer",
    prayer_confirm: "Sent privately. You are held in thought.",
    admin_login_title: "Student Council Login",
    admin_note: "Accounts are created in the Firebase console. There is no public sign-up.",
    admin_enter: "Enter",
    admin_db: "Database",
    admin_logout: "Log out",
    tab_questions: "Questions",
    tab_prayers: "Prayer requests",
    tab_board: "Board",
    back_public: "\u2190 Back to public site",
  },
  ko: {
    nav_home: "\ud648",
    nav_answers: "\ub2f5\ubcc0",
    site_tagline1: "\ud558\ub098\ub2d8\uaed8 \ub354 \uac00\uae4c\uc774",
    site_eyebrow: "\uc81c17\ub300 \ud559\uc0dd\ud68c",
    door_ask_title: "\ubaa9\uc0ac\ub2d8\uaed8 \uc9c8\ubb38",
    door_ask_sub: "\ube44\uacf5\uac1c Q&A",
    door_prayer_title: "\uae30\ub3c4 \uc694\uccad",
    door_prayer_sub: "\ube44\uacf5\uac1c \uc694\uccad",
    new_heading: "\uc774\ubc88 \uc8fc \uc0c8 \uae00",
    badge_new: "\uc0c8 \uae00",
    new_empty: "\uc774\ubc88 \uc8fc \uc0c8 \uae00\uc774 \uc5c6\uc5b4\uc694 \u2014",
    new_empty_link: "\uc804\uccb4 \ub2f5\ubcc0 \ubcf4\uae30",
    answers_heading: "\ub2f5\ubcc0 \uc644\ub8cc",
    search_placeholder: "\uac80\uc0c9…",
    answers_empty: "\uc544\uc9c1 \uac8c\uc2dc\ub41c \uae00\uc774 \uc5c6\uc5b4\uc694 \u2014 \ub098\uc911\uc5d0 \ub2e4\uc2dc \ud655\uc778\ud574 \uc8fc\uc138\uc694.",
    back: "\u2190 \ub4a4\ub85c",
    back_home: "\u2190 \ud648\uc73c\ub85c",
    ask_title: "\ubaa9\uc0ac\ub2d8\uaed8 \uc9c8\ubb38",
    ask_hint: "\ube44\uacf5\uac1c\ub85c \uc804\ub2ec\ub429\ub2c8\ub2e4. \ubaa9\uc0ac\ub2d8\uc774 \ub2f5\ubcc0\uc744 \uac8c\uc2dc\ud310\uc5d0 \uc62c\ub9b4 \uc218 \uc788\uc2b5\ub2c8\ub2e4.",
    ask_label: "\uc9c8\ubb38 \ub0b4\uc6a9",
    ask_placeholder: "\ubb34\uc5c7\uc744 \uc5ec\uCC0D\uACE0 \uc2f6\uc73c\uc2e0\uac00\uc694?",
    name_label: "\uc774\ub984 (\uc120\ud0dd)",
    name_placeholder: "\ube44\uc6cc\ub450\uba74 \uc775\uba85\uc73c\ub85c \ucc98\ub9ac\ub429\ub2c8\ub2e4",
    send_question: "\uc9c8\ubb38 \ubcf4\ub0b4\uae30",
    cancel: "\ucde8\uc18c",
    ask_confirm: "\ubaa9\uc0ac\ub2d8\uaed8 \ube44\uacf5\uac1c\ub85c \uc804\ub2ec\ub418\uc5c8\uc2b5\ub2c8\ub2e4. \uac10\uc0ac\ud569\ub2c8\ub2e4.",
    prayer_title: "\uae30\ub3c4 \uc694\uccad",
    prayer_hint: "\ubaa9\uc0ac\ub2d8\uacfc \uae30\ub3c4\ud300\uc5d0\uac8c\ub9cc \ube44\uacf5\uac1c\ub85c \uc804\ub2ec\ub429\ub2c8\ub2e4. \uacf5\uac1c\ub418\uac70\ub098 \uac8c\uc2dc\ud310\uc5d0 \uc62c\ub77c\uac00\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4.",
    prayer_label: "\uae30\ub3c4 \uc694\uccad \ub0b4\uc6a9",
    prayer_placeholder: "\ubb34\uc5c7\uc744 \uc704\ud574 \uae30\ub3c4\ud574 \ub4dc\ub9b4\uae4c\uc694?",
    send_prayer: "\uae30\ub3c4 \ubcf4\ub0b4\uae30",
    prayer_confirm: "\ube44\uacf5\uac1c\ub85c \uc804\ub2ec\ub418\uc5c8\uc2b5\ub2c8\ub2e4. \ud568\uaed8 \uae30\uc5b5\ud558\uaca0\uc2b5\ub2c8\ub2e4.",
    admin_login_title: "\ud559\uc0dd\ud68c \ub85c\uadf8\uc778",
    admin_note: "\uacc4\uc815\uc740 Firebase \ucf58\uc194\uc5d0\uc11c \uc0dd\uc131\ub429\ub2c8\ub2e4. \uacf5\uac1c \uac00\uc785\uc740 \uc9c0\uc6d0\ub418\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4.",
    admin_enter: "\ub85c\uadf8\uc778",
    admin_db: "\ub370\uc774\ud130\ubca0\uc774\uc2a4",
    admin_logout: "\ub85c\uadf8\uc544\uc6c3",
    tab_questions: "\uc9c8\ubb38",
    tab_prayers: "\uae30\ub3c4 \uc694\uccad",
    tab_board: "\uac8c\uc2dc\ud310",
    back_public: "\u2190 \uacf5\uac1c \uc0ac\uc774\ud2b8\ub85c",
  },
};

const LANG_KEY = 'ctg-lang';

function getLang() {
  return localStorage.getItem(LANG_KEY) === 'ko' ? 'ko' : 'en';
}

function setLang(lang) {
  localStorage.setItem(LANG_KEY, lang === 'ko' ? 'ko' : 'en');
  applyLanguage();
}

function toggleLang() {
  setLang(getLang() === 'en' ? 'ko' : 'en');
}

function applyLanguage() {
  const lang = getLang();
  const dict = DICT[lang];

  document.documentElement.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) el.textContent = dict[key];
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict[key] !== undefined) el.placeholder = dict[key];
  });

  document.querySelectorAll('.lang-toggle').forEach(btn => {
    btn.querySelectorAll('[data-code]').forEach(span => {
      span.classList.toggle('is-active', span.getAttribute('data-code') === lang);
    });
  });

  // Let the page re-render anything language-dependent that isn't
  // plain static text (e.g. bilingual board entries from Firestore).
  document.dispatchEvent(new CustomEvent('ctg-lang-changed', { detail: { lang } }));
}

document.addEventListener('DOMContentLoaded', () => {
  applyLanguage();
  document.querySelectorAll('.lang-toggle').forEach(btn => {
    btn.addEventListener('click', toggleLang);
  });
});
