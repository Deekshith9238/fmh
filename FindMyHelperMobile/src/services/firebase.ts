import authInstance from '@react-native-firebase/auth';

// Export the auth instance
export const auth = authInstance();

// Google provider
export const googleProvider = authInstance.GoogleAuthProvider;

export default auth; 