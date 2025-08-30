/*! admin-auth-gate.safe.v2.js — force login via auth.html si non connecté */
(function(){
  if (window.__RAUN_ADMIN_AUTH_GATE__) return; window.__RAUN_ADMIN_AUTH_GATE__ = true;
  try { document.documentElement.style.visibility = 'hidden'; } catch(_) {}

  function load(src){
    return new Promise(function(res, rej){
      var s = document.createElement('script');
      s.src = src; s.async = false;
      s.onload = function(){ res(); };
      s.onerror = function(){ rej(new Error('load fail '+src)); };
      (document.head || document.documentElement).appendChild(s);
    });
  }

  function ensureConfig(){
    // si déjà init, ok. sinon essaye de charger js/firebase-config.js si dispo
    if (window.firebaseConfig || (window.firebase && firebase.apps && firebase.apps.length)) return Promise.resolve();
    return load('js/firebase-config.js').catch(function(){ /* ignore */ });
  }

  function ensureFirebaseCompat(){
    var p = Promise.resolve();
    if (!(window.firebase && firebase.app)) {
      p = p.then(function(){ return load('https://www.gstatic.com/firebasejs/10.12.3/firebase-app-compat.js'); });
    }
    return p.then(function(){
      if (!(window.firebase && firebase.auth)) {
        return load('https://www.gstatic.com/firebasejs/10.12.3/firebase-auth-compat.js');
      }
    });
  }

  function redirect(){
    try {
      var next = location.pathname + location.search + location.hash;
      location.replace('auth.html?next=' + encodeURIComponent(next));
    } catch(e){ location.href = 'auth.html'; }
  }

  Promise.resolve()
    .then(ensureConfig)
    .then(ensureFirebaseCompat)
    .then(function(){
      try{
        if (!firebase.apps.length && window.firebaseConfig) firebase.initializeApp(window.firebaseConfig);
        firebase.auth().onAuthStateChanged(function(user){
          if (!user) redirect();
          else { try { document.documentElement.style.visibility = 'visible'; } catch(_) {} }
        });
      } catch(e){ redirect(); }
    })
    .catch(redirect);
})();