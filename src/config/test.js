// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCn8U-VLwUaZ-4K8zLmCfe14OPX0Cnej74",
  authDomain: "dacn-714e1.firebaseapp.com",
  projectId: "dacn-714e1",
  storageBucket: "dacn-714e1.firebasestorage.app",
  messagingSenderId: "580030039264",
  appId: "1:580030039264:web:1b49421c26376d3465fc85",
  measurementId: "G-Z8G3G4W0DM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
