# NexoPay — Plateforme d'automatisation Mobile Money marchand

Système complet : app mobile client (Flutter) + backend & dashboard admin (Next.js, Vercel) + bot Android d'automatisation USSD (Kotlin) + Firestore.

---

## ⚠️ À lire avant tout

Ce projet a été écrit intégralement mais **vérifié de façon inégale** selon l'environnement disponible :

| Partie | Vérification effectuée |
|---|---|
| Backend + dashboard admin (Next.js) | ✅ `npm run build` exécuté avec succès, TypeScript strict sans erreur |
| App mobile (Flutter) | ⚠️ Code écrit avec soin mais **non compilé** (pas de SDK Flutter disponible dans l'environnement de génération) — à vérifier avec `flutter pub get && flutter analyze` |
| Bot Android (Kotlin) | ⚠️ Code écrit avec soin mais **non compilé** (pas d'Android SDK disponible) — à ouvrir et builder dans Android Studio |

Le bot Android en particulier **doit être calibré sur ton téléphone réel** (voir section dédiée) : les libellés de boutons USSD ("OK"/"Envoyer") et le nom du paquet système qui affiche la fenêtre USSD varient selon le fabricant (Tecno, Infinix, Samsung...). Aucun test ne remplace un essai réel avec tes SIM.

---

## 1. Structure du projet

```
lfd-momo-automation/
├── backend/          Next.js — API + dashboard admin (déployer sur Vercel)
├── mobile-app/        Flutter — app cliente "NexoPay"
├── android-bot/       Android natif (Kotlin) — bot exécuteur USSD
└── firestore.rules    Règles de sécurité Firestore
```

---

## 2. Mise en place Firebase (commun aux 3 parties)

1. Crée un projet sur console.firebase.google.com
2. Active **Authentication > Numéro de téléphone**
3. Active **Firestore Database** (mode production)
4. Déploie `firestore.rules` : `firebase deploy --only firestore:rules`
5. Active **Cloud Messaging** (FCM) pour les notifications push
6. Génère une clé de compte de service : Paramètres du projet > Comptes de service > Générer une nouvelle clé privée → utilisée par le backend
7. Ajoute une app Android (package `com.lfd.momobot`) → télécharge `google-services.json` → remplace le fichier placeholder dans `android-bot/app/google-services.json`
8. Ajoute une app Flutter : `dart pub global activate flutterfire_cli` puis `flutterfire configure` à la racine de `mobile-app/`

---

## 3. Backend + dashboard admin (`backend/`)

```bash
cd backend
npm install
vercel
```

### Variables d'environnement Vercel

| Variable | Description |
|---|---|
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Depuis le compte de service Firebase |
| `ADMIN_EMAIL` | Email de connexion au dashboard |
| `ADMIN_PASSWORD_HASH` | `node -e "console.log(require('./src/lib/simpleHash').hashPassword('TonMotDePasse'))"` |
| `ADMIN_PASSWORD_SALT` | Chaîne aléatoire longue, secrète |
| `ADMIN_JWT_SECRET` | Chaîne aléatoire longue (32+ caractères) |
| `INTERNAL_API_KEY` | Clé partagée avec le bot Android |
| `FEEXPAY_API_KEY`, `FEEXPAY_SHOP_ID` | Depuis ton dashboard FeexPay |
| `PUBLIC_BASE_URL` | URL finale du déploiement Vercel |

### ⚠️ À vérifier avec la vraie doc FeexPay

`src/lib/feexpay.ts` contient mon estimation du format d'appel API v2 (endpoint, noms de champs). Compare-la à https://docs.feexpay.me/?section=api-rest-status&version=v2 et ajuste si nécessaire.

**Pas de secret de signature webhook** : FeexPay ne fournissant pas de secret HMAC sur cette offre, le webhook (`/api/feexpay/webhook`) ne fait **jamais confiance** au contenu du payload reçu — il ne s'en sert que comme déclencheur, puis rappelle activement l'API FeexPay (`verifyTransactionStatus`) pour connaître le vrai statut avant de créer un job. Vérifie que l'endpoint `GET /api/transactions/public/status/{shopId}/{reference}` dans `src/lib/feexpay.ts` correspond bien à l'endpoint réel de vérification de statut FeexPay — c'est mon estimation, à confirmer avec leur doc ou leur support.

### Premier lancement

1. Connexion sur `/admin/login`
2. Les codes USSD et messages se pré-remplissent automatiquement au premier accès à `/admin/ussd-codes`
3. Renseigne les vrais soldes SIM dans `/admin/sims`
4. Renseigne tes vrais numéros dans `/admin/contact`
5. Configure le cron anti-blocage sur cron-job.org : URL `/api/cron/check-stuck-jobs`, toutes les 5 min, header `x-internal-api-key`

---

## 4. App mobile (`mobile-app/`)

```bash
cd mobile-app
flutter pub get
flutterfire configure
```

Édite `lib/services/app_config.dart` avec l'URL du backend. Édite `main.dart` pour utiliser `DefaultFirebaseOptions.currentPlatform`.

```bash
flutter analyze
flutter build apk
```

---

## 5. Bot Android (`android-bot/`)

1. Ouvre `android-bot/` dans Android Studio
2. Remplace `app/google-services.json` par le vrai fichier
3. Renseigne `BACKEND_BASE_URL` et `INTERNAL_API_KEY` dans `BotConfig.kt`
4. Build & installe l'APK sur le téléphone dédié

### Configuration sur le téléphone

1. Accorder les permissions
2. Activer le service d'accessibilité (obligatoire, non automatisable par sécurité Android)
3. Lister les SIM détectées
4. Associer chaque slot à MTN/Moov/Celtiis
5. Saisir les codes secrets marchands (stockés chiffrés localement, jamais envoyés au serveur)

### ⚠️ Calibrage obligatoire

Les libellés de boutons USSD varient selon le fabricant. Compose un code simple, observe les logs (`adb logcat | grep UssdAccessibilityService`), ajuste `CONFIRM_LABELS` si besoin, puis teste une vraie séquence avec un petit montant avant la prod.

---

## 6. Points à confirmer avant mise en prod

1. Bloc "Forfait Illimité Semaine/Mois" (`*889*123*4*Numéro#`) désactivé par défaut — origine Moov ou Celtiis à confirmer
2. Transfert d'argent Celtiis : code "Dépôt" utilisé par défaut, à confirmer
3. Messages de succès/échec dans `/admin/messages` : valeurs génériques à remplacer par les vrais textes de chaque opérateur
4. Remboursement automatique : logique activée mais appel FeexPay réel à implémenter (`// TODO`)

---

## 7. Prochaines étapes

1. Déployer le backend sur Vercel
2. Calibrer le bot Android avec de petits montants réels
3. Corriger les 4 points ci-dessus
4. Publier NexoPay en test interne avant diffusion publique
