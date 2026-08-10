import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";
import { getMessaging, Messaging } from "firebase-admin/messaging";

/**
 * Variables d'environnement requises (à définir sur Vercel) :
 * - FIREBASE_PROJECT_ID
 * - FIREBASE_CLIENT_EMAIL
 * - FIREBASE_PRIVATE_KEY (avec les \n échappés)
 *
 * Initialisation VOLONTAIREMENT paresseuse : Next.js importe les fichiers de
 * route pendant `next build` pour collecter leurs métadonnées, même sur des
 * routes marquées `dynamic = "force-dynamic"`. Si on initialisait Firebase
 * Admin au niveau module (top-level), le build échouerait dès que les
 * variables d'environnement Firebase ne sont pas présentes au moment du
 * build (ex: build local sans .env, ou build CI séparé du déploiement).
 * Ici, rien ne s'exécute tant qu'on n'appelle pas réellement db()/auth()/messaging().
 */
let _app: App | null = null;

function getFirebaseApp(): App {
  if (_app) return _app;
  const apps = getApps();
  if (apps.length > 0) {
    _app = apps[0];
    return _app;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Variables Firebase Admin manquantes (FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY). Vérifie tes variables d'environnement Vercel."
    );
  }

  _app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
  return _app;
}

let _db: Firestore | null = null;
let _auth: Auth | null = null;
let _messaging: Messaging | null = null;

function getDb(): Firestore {
  if (!_db) _db = getFirestore(getFirebaseApp());
  return _db;
}
function getAdminAuth(): Auth {
  if (!_auth) _auth = getAuth(getFirebaseApp());
  return _auth;
}
function getAdminMessaging(): Messaging {
  if (!_messaging) _messaging = getMessaging(getFirebaseApp());
  return _messaging;
}

/**
 * Proxies : permettent d'écrire `db.collection(...)`, `auth.verifyIdToken(...)`,
 * `messaging.send(...)` exactement comme avant dans tout le reste du code,
 * sans rien initialiser tant qu'aucune méthode n'est réellement appelée.
 */
export const db: Firestore = new Proxy({} as Firestore, {
  get(_target, prop) {
    const real = getDb() as any;
    const value = real[prop];
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export const auth: Auth = new Proxy({} as Auth, {
  get(_target, prop) {
    const real = getAdminAuth() as any;
    const value = real[prop];
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export const messaging: Messaging = new Proxy({} as Messaging, {
  get(_target, prop) {
    const real = getAdminMessaging() as any;
    const value = real[prop];
    return typeof value === "function" ? value.bind(real) : value;
  },
});
