import { initializeApp, getApps } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG || '{}');

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export { app };
export const getFirebaseMessaging = async () => {
  if (await isSupported()) {
    return getMessaging(app);
  }
  return null;
}; 