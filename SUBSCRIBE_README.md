
    # RAUN • Bouton S’abonner (fallback local)

    Ce pack ajoute un bouton **S’abonner** qui se transforme en **Abonné** (vert) au clic,
    et redevient **S’abonner** au 2ᵉ clic. Un **compteur visible** s’incrémente/décrémente.
    👉 *Ceci est une **démo locale** (sans Firestore). Le total affiché est stocké dans le navigateur.*

    ## Fichiers ajoutés
    - `css/subscribe-toggle.css`
    - `js/subscribe-toggle.js`

    Ces fichiers sont **non destructifs**. Ils n’écrasent rien et peuvent être supprimés sans casser votre projet.

    ## Intégration automatique
    J’ai tenté d’insérer ces lignes dans vos fichiers HTML (avant `</head>` et `</body>`):
    ```html
    <link rel="stylesheet" href="css/subscribe-toggle.css">
    ...
    <script src="js/subscribe-toggle.js"></script>
    ```
    Rapport d’injection :
    [
  {
    "file": "index.html",
    "css_added": "<link rel=\"stylesheet\" href=\"css/subscribe-toggle.css\">",
    "js_added": "<script src=\"js/subscribe-toggle.js\"></script>"
  },
  {
    "file": "public.html",
    "css_added": "<link rel=\"stylesheet\" href=\"css/subscribe-toggle.css\">",
    "js_added": "<script src=\"js/subscribe-toggle.js\"></script>"
  },
  {
    "file": "auth.html",
    "css_added": "<link rel=\"stylesheet\" href=\"css/subscribe-toggle.css\">",
    "js_added": "<script src=\"js/subscribe-toggle.js\"></script>"
  },
  {
    "file": "admin.html",
    "css_added": "<link rel=\"stylesheet\" href=\"css/subscribe-toggle.css\">",
    "js_added": "<script src=\"js/subscribe-toggle.js\"></script>"
  },
  {
    "file": "approvals.html",
    "css_added": "<link rel=\"stylesheet\" href=\"css/subscribe-toggle.css\">",
    "js_added": "<script src=\"js/subscribe-toggle.js\"></script>"
  },
  {
    "file": "about.html",
    "css_added": "<link rel=\"stylesheet\" href=\"css/subscribe-toggle.css\">",
    "js_added": "<script src=\"js/subscribe-toggle.js\"></script>"
  },
  {
    "file": "intentions.html",
    "css_added": "<link rel=\"stylesheet\" href=\"css/subscribe-toggle.css\">",
    "js_added": "<script src=\"js/subscribe-toggle.js\"></script>"
  }
]

    ## Comment utiliser dans votre HTML
    Collez ce snippet là où vous voulez le bouton et son compteur :
    ```html
    <!-- RAUN Subscribe button (frontend-only fallback) -->
<button class="raun-subscribe-btn" data-raun-subscribe="capsule_global">S’abonner</button>
<span class="raun-subscribe-count" data-demo="1" data-raun-subscribe-count="capsule_global">0</span>
<!-- Place anywhere on the page. The count has a small * to indicate demo (local) mode -->
    ```

    - Changez `data-raun-subscribe="capsule_global"` par un identifiant propre à votre capsule si besoin.
    - Le compteur a l’attribut `data-demo="1"` ⇒ un petit `*` indique le mode démo (local).
    - Styles minimum via la classe `.raun-subscribe-btn` — votre design actuel reste prioritaire.
      Si votre thème utilise déjà des couleurs/variables, vous pouvez surcharger la classe.

    ## Migration #1 vers Firestore (quand prêt)
    - Remplacez le stockage local par `Firestore` :
      - Enregistrer l’action utilisateur (subscribe/unsubscribe) dans une collection (ex: `subscriptions`).
      - Le **total** = `count()` des docs pour la capsule, ou un champ agrégé (Cloud Functions).
      - Mettre à jour le compteur en temps réel avec `onSnapshot`.

    ## Remarques
    - Sans backend, **impossible d’obtenir un total mondial** honnête. Ce fallback est juste pour tester l’UX.
    - Le badge `*` est là pour éviter toute confusion chez les visiteurs (mode démo/local).
