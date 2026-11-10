import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
const firebaseConfig = {
  apiKey: "AIzaSyCSFXCrO036T5b7QbPt45mUToFJmsMsW1s",
  authDomain: "jj-hodl.firebaseapp.com",
  projectId: "jj-hodl",
  storageBucket: "jj-hodl.firebasestorage.app",
  messagingSenderId: "481861193988",
  appId: "1:481861193988:web:8a659502c46f6e16638051"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
export { auth, db };