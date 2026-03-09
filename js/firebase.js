import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js';
import { getFirestore, collection, getDocs,
         addDoc, orderBy, query } from 'https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey:            "AIzaSyB1oD68tVFQ68UPW_vnrrzj_DUYdW_esx4",
  authDomain:        "employee-portal-de4a9.firebaseapp.com",
  projectId:         "employee-portal-de4a9",
  storageBucket:     "employee-portal-de4a9.firebasestorage.app",
  messagingSenderId: "938523807304",
  appId:             "1:938523807304:web:3406a994d22eb62e4a127d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export { collection, getDocs, addDoc, orderBy, query };