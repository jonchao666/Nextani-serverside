const firebaseAdmin = require("firebase-admin");
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
});

const firebase = require("firebase/app");
require("firebase/auth");

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "nextani-415707.firebaseapp.com",
  projectId: "nextani-415707",
  storageBucket: "nextani-415707.appspot.com",
  messagingSenderId: "774743828666",
  appId: "1:774743828666:web:4dcb5b70e55a11407a7a83",
  measurementId: "G-CPPXNF5TG0",
};
firebase.initializeApp(firebaseConfig);

module.exports = { firebaseAdmin, firebase };
