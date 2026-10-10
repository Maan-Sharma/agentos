import {
  applicationDefault,
  cert,
  getApp,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId) {
  throw new Error("Missing Firebase project ID");
}

const credential =
  clientEmail && privateKey
    ? cert({ projectId, clientEmail, privateKey })
    : applicationDefault();

const app = getApps().length
  ? getApp()
  : initializeApp({ credential, projectId });

export const firebaseAdminAuth = getAuth(app);