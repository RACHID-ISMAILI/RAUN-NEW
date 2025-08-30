/*! viewer-sticky-fix.js (patched) — avoids HierarchyRequestError by wrapping safely.
   - Idempotent: won't double-wrap.
   - Works on .viewer-sticky or [data-sticky] elements.
*/
(function(){
  if (window.__VIEWER_STICKY_FIX_PATCHED__) return;
  window.__VIEWER_STICKY_FIX_PATCHED__ = true;

  function isAncestor(ancestor, node){
    try { return !!(ancestor && node && ancestor !== node && ancestor.contains(node)); }
    catch(_){ return false; }
  }

  function enhanceOne(el){
    if (!el || el.__viewerStickyFixed) return;
    el.__viewerStickyFixed = true;

    // If already wrapped, skip
    if (typeof el.closest === 'function' && el.closest('.viewer-sticky-wrap')) return;

    var parent = el.parentNode;
    if (!parent) return;

    // Safety: DO NOT append parent into its own child → guard against cycles
    if (isAncestor(el, parent)) return;

    var wrap = document.createElement('div');
    wrap.className = 'viewer-sticky-wrap';
    wrap.style.position = 'sticky';
    wrap.style.top = '0';
    wrap.style.zIndex = '10';

    try {
      // Correct order: insert wrapper BEFORE the element, then move element inside wrapper.
      parent.insertBefore(wrap, el);
      wrap.appendChild(el);
    } catch (e) {
      console.warn('[viewer-sticky-fix] skipped element due to:', e);
      el.__viewerStickyFixed = false; // allow retry if DOM changes
    }
  }

  function run(){
    try{
      var nodes = document.querySelectorAll('.viewer-sticky, [data-sticky="true"], [data-sticky]');
      nodes.forEach(enhanceOne);
    } catch(e){
      console.warn('[viewer-sticky-fix] run() error:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  // Re-run if DOM mutates (dynamic pages)
  try {
    var mo = new MutationObserver(function(muts){
      for (var i=0;i<muts.length;i++){
        var m = muts[i];
        if ((m.addedNodes && m.addedNodes.length) || (m.attributeName && m.attributeName.indexOf('sticky')>=0)) {
          run(); break;
        }
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
  } catch(_){ /* ignore */ }
})();