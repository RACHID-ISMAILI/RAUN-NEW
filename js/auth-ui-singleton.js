
/*! RAUN Auth UI singleton — supprime tout doublon de formulaire au runtime */
(function(){
  function cleanup(){
    // supprimer tout bloc avec "Démo locale"
    document.querySelectorAll('section,div').forEach(function(n){
      if(/démo\s+locale/i.test(n.textContent||'')) n.remove();
    });
    var forms = Array.from(document.querySelectorAll('form'));
    // sélectionner les formulaires qui ressemblent à un login
    var candidates = forms.filter(function(f){
      var hasEmail = f.querySelector('input[type="email"], #email');
      var hasPass  = f.querySelector('input[type="password"], #password');
      var hasBtn   = /Se\s*connecter/i.test(f.textContent||'') || f.querySelector('button[type="submit"]');
      return (hasEmail && hasPass) || hasBtn;
    });
    if(candidates.length <= 1) return;
    // garder celui qui est dans .auth-card avec #loginForm
    var keep = candidates.find(function(f){ return f.id==='loginForm' && f.closest('.auth-card'); }) ||
               candidates.find(function(f){ return f.closest('.auth-card'); }) ||
               candidates[candidates.length-1];
    candidates.forEach(function(f){
      if(f !== keep){
        var box = f.closest('.auth-card, section, article, div') || f;
        box.remove();
      }
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', cleanup);
  else cleanup();
})();
