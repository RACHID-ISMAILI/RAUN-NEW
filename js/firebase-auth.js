
/*! RAUN Firebase Auth — compat CDN, non destructif */
(function(){
  if(!window.RAUN_FIREBASE_CONFIG){
    console.error("[RAUN] Manque RAUN_FIREBASE_CONFIG. Remplis js/firebase-config.js");
    return;
  }
  if(!window.firebase || !firebase.app){
    console.error("[RAUN] Firebase CDN (compat) absent. Ajoute app-compat + auth-compat dans <head>.");
    return;
  }

  // Init unique
  var app = (firebase.apps && firebase.apps.length)
    ? firebase.app()
    : firebase.initializeApp(window.RAUN_FIREBASE_CONFIG);
  var auth = firebase.auth();

  try { auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL); } catch(e){}

  function signIn(email, password){
    return auth.signInWithEmailAndPassword(email, password);
  }
  function signOut(){
    return auth.signOut();
  }
  function onChange(cb){
    return auth.onAuthStateChanged(cb);
  }

  function adminGate(){
    var owner = window.RAUN_OWNER_EMAIL || "";
    onChange(function(user){
  /*SYNC_LS_ME_START*/
  try{
    var LS_ME='raun_me_ai_v1';
    if(user){
      var owner = window.RAUN_OWNER_EMAIL || '';
      var isAdmin = !owner || String(user.email).toLowerCase()===String(owner).toLowerCase();
      var meRaw = localStorage.getItem(LS_ME);
      var me = meRaw ? JSON.parse(meRaw) : { userId: (Math.random().toString(36).slice(2)) };
      me.authed = true; me.isAdmin = isAdmin; me.name = user.email;
      localStorage.setItem(LS_ME, JSON.stringify(me));
    }else{
      localStorage.removeItem(LS_ME);
    }
  }catch(e){}
  /*SYNC_LS_ME_END*/
      if(!user){
        var ret = encodeURIComponent(location.pathname + location.search);
        location.href = "auth.html?returnTo=" + ret;
        return;
      }
      if(owner && String(user.email).toLowerCase() !== String(owner).toLowerCase()){
        location.href = "index.html";
        return;
      }
      // ok admin
    });
  }

  // Auto-bind: login form, logout btn, admin button visibility
  function bindUI(){
    var form = document.getElementById("loginForm");
    if(form){
      form.addEventListener("submit", function(e){
        e.preventDefault();
        var email = (document.getElementById("email")||{}).value || "";
        var pass  = (document.getElementById("password")||{}).value || "";
        var errEl = document.getElementById("loginError");
        (errEl&&(errEl.textContent=""));
        signIn(email, pass).then(function(){
          var qp = new URLSearchParams(location.search);
          var ret = qp.get("returnTo");
          location.href = ret ? decodeURIComponent(ret) : "admin.html";
        }).catch(function(err){
          if(errEl){ errEl.textContent = err && err.message ? err.message : "Connexion impossible."; }
          console.error(err);
        });
      });
    }

    var logoutBtn = document.getElementById("logoutBtn");
    if(logoutBtn){
      logoutBtn.addEventListener("click", function(){
        signOut().then(function(){ location.href = "index.html"; });
      });
    }

    var adminBtn = document.getElementById("adminBtn");
    if(adminBtn){
      onChange(function(user){
  /*SYNC_LS_ME_START*/
  try{
    var LS_ME='raun_me_ai_v1';
    if(user){
      var owner = window.RAUN_OWNER_EMAIL || '';
      var isAdmin = !owner || String(user.email).toLowerCase()===String(owner).toLowerCase();
      var meRaw = localStorage.getItem(LS_ME);
      var me = meRaw ? JSON.parse(meRaw) : { userId: (Math.random().toString(36).slice(2)) };
      me.authed = true; me.isAdmin = isAdmin; me.name = user.email;
      localStorage.setItem(LS_ME, JSON.stringify(me));
    }else{
      localStorage.removeItem(LS_ME);
    }
  }catch(e){}
  /*SYNC_LS_ME_END*/
        var owner = window.RAUN_OWNER_EMAIL || "";
        var ok = !!(user && (!owner || String(user.email).toLowerCase() === String(owner).toLowerCase()));
        adminBtn.style.display = ok ? "inline-block" : "none";
      });
    }
  }

  // Auto-run
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", bindUI)
    : bindUI();

  // Auto-protect if current page looks like admin
  (function autoProtect(){
    var path = (location.pathname||"").toLowerCase();
    if(path.endsWith("/admin.html") || path.endsWith("admin.html")){
      adminGate();
    }
  })();

  // Expose minimal API
  window.RAUNAuth = { signIn:signIn, signOut:signOut, onChange:onChange, adminGate:adminGate };
})();
