// Firebase SDK Funktionen
// Verfügbare Firebase Libs: https://firebase.google.com/docs/web/learn-more#available-libraries
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.8/firebase-app.js';
// Firebase Authentifizierung
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithRedirect, signOut } from 'https://www.gstatic.com/firebasejs/9.6.8/firebase-auth.js';
// Firestore Datenbank
import { getFirestore, collection, query, onSnapshot, doc, getDoc, setDoc, deleteDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/9.6.8/firebase-firestore.js';

// Firebase Konfiguration
import firebaseConfig from './config/firebase-web.mjs';
import localFirebaseConfig from './config/firebase-local.mjs';

const firebaseConfigToUse = localFirebaseConfig ?? firebaseConfig; // Wenn lokale API Settings vorhanden sind, sollen diese anstelle der öffentlichen Schlüssel verwendet werden
let tasks = [];

// Wird jedesmal aufgerufen, wenn sich was am Anmeldezustand ändert
async function handleauthstatechange(user) {
    if (user) {
        loadtasks(user);
    } else {
        // Benutzer ist noch nicht angemeldet, also Anmeldefenster anzeigen
        // Müssen wir mit Redirect machen, weil Popup in PWA-App nicht funktioniert
        await signInWithRedirect(getAuth(), googleAuthProvider);
    }
}

async function loadtasks(user) {
    // Die Taskliste wird überwacht und live aktualsiert.
    // Siehe https://firebase.google.com/docs/firestore/query-data/listen#listen_to_multiple_documents_in_a_collection
    onSnapshot(query(collection(getFirestore(), 'users', user.uid, 'tasks')), (querySnapshot) => {
        tasks = [];
        querySnapshot.forEach((document) => {
            const task = document.data();
            tasks.push(task);
        });
        console.log(tasks);
    });
}


initializeApp(firebaseConfigToUse);
const googleAuthProvider = new GoogleAuthProvider();

onAuthStateChanged(getAuth(), handleauthstatechange.bind(this));
