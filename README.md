# RAUN (refactor multi-fichiers)

**Style conservé : Matrix Premium / glow.**  
**Démo locale, sans Firebase pour l’instant.**

## Structure
```
index.html        → Accueil
public.html       → Capsules publiques (viewer + rail + votes + commentaires)
intentions.html   → Intentions
about.html        → À propos (photo sauvegardée en localStorage)
auth.html         → Page d’auth (démo locale)
admin.html        → CRUD capsules + photo
approvals.html    → File d’attente (brouillons) avec Approuver/Rejeter
style.css         → Styles communs
main.js           → État, helpers, matrice, IA démo, CRUD
public.js         → Logique de la page Publique
intentions.js     → Logique Intentions
about.js          → Logique À propos
admin.js          → Logique Admin
index.js          → Logique Accueil (vide)
```

## Lancer en local (recommandé)
1. Ouvre un terminal dans ce dossier.
2. Installe un petit serveur statique (une seule fois) :
   ```bash
   npm i -g http-server
   ```
3. Démarre :
   ```bash
   http-server -p 5500
   ```
4. Ouvre **http://127.0.0.1:5500/index.html** dans le navigateur.

> ⚠️ **Ne change pas les noms des fichiers** (ex: `auth.html`, pas `auth-login.html`) et lance toujours depuis la racine du projet.

## Connexion Admin (démo locale)
- **login**: `admin`
- **password**: `raun2025`
- Après connexion, tu arrives sur **admin.html**.
- Le bouton **Approuver capsules** ouvre **approvals.html** (pour valider les brouillons).

## Notes
- Données stockées en **localStorage** (capsules, intentions, photo, profil).
- Aucune API externe activée (Firebase/Cloudinary **désactivés** pour l’instant).
- Quand on passera à Firebase, on remplacera `localStorage` par Firestore/Storage, tranquillement.

## Astuces
- Si tu vois “page introuvable”, vérifie bien l’URL exacte (majuscules/minuscules) et que tu es à la racine `http://127.0.0.1:5500/`.
- Pour repartir à zéro : ouvrir les DevTools → Application → Local Storage → `Clear`.
