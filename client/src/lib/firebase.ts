import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.***REMOVED***,
  authDomain: import.meta.env.***REMOVED***,
  projectId: import.meta.env.***REMOVED***,
  storageBucket: import.meta.env.***REMOVED***,
  messagingSenderId: import.meta.env.***REMOVED***,
  appId: import.meta.env.***REMOVED***
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app; 