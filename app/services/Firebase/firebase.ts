// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// import { getFirestore } from "firebase/firestore";
// import { getStorage } from "firebase/storage";
// import { getFunctions } from "firebase/functions";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCFPA8fl_sS6vRWe3uvf5MpN95xesK_J3M",
  authDomain: "dooit-5c76d.firebaseapp.com",
  projectId: "dooit-5c76d",
  storageBucket: "dooit-5c76d.firebasestorage.app",
  messagingSenderId: "477979903432",
  appId: "1:477979903432:web:3c6d87a5dc4424887cecfd",
  measurementId: "G-12ZZX5PBG0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);