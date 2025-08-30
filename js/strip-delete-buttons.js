
/*! RAUN — Hard guard: remove any delete buttons in Public & Intentions pages */
(function(){
  function strip(){
    document.querySelectorAll('.btn-delete, .delete-btn, button[title="Supprimer"], button[data-action="delete"]').forEach(function(el){
      el.remove();
    });
    // Also sanitize leftover click handlers that might target deletes
    document.querySelectorAll('[onclick*="delete"], [data-action*="delete"]').forEach(function(el){
      if(el.closest('body')) el.removeAttribute('onclick');
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', strip);
  else strip();
  // Also observe late DOM injections
  var obs = new MutationObserver(strip);
  obs.observe(document.documentElement, {childList:true, subtree:true});
})();
