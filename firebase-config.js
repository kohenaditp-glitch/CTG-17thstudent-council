/* ============================================================
   Your Firebase project keys.

   These are already filled in for the project
   "ctg17thstudentcouncil". If you ever create a NEW Firebase
   project, replace this whole block with the one from:
   Firebase console > Project settings (gear) > General >
   Your apps > the web app (</>) > SDK setup and configuration.

   Note: these keys are meant to be public. They identify the
   project, they don't grant access. What actually protects the
   data is the Firestore rules (see firestore.rules).
   ============================================================ */
const firebaseConfig = {
  apiKey: "AIzaSyC_bn3OqX1zKol3-ehBWuyUEzOnPpdzbhs",
  authDomain: "ctg17thstudentcouncil.firebaseapp.com",
  projectId: "ctg17thstudentcouncil",
  storageBucket: "ctg17thstudentcouncil.firebasestorage.app",
  messagingSenderId: "735440333259",
  appId: "1:735440333259:web:ef117b68a62070b16b6e4e"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
