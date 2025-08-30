/*! viewer-sticky-fix.safe.js — idempotent wrapper to avoid HierarchyRequestError
   Usage: include this script instead of the old viewer-sticky-fix.js
   or AFTER it to override/short-circuit if the old one throws.
*/
(function(){
  if (window.__VIEWER_STICKY_SAFE__) return;
  window.__VIEWER_STICKY_SAFE__ = true;

  function isAncestor(ancestor, node){
    try { return ancestor && node && ancestor !== node && ancestor.contains(node); }
    catch(_){ return false; }
  }

  function enhanceOne(el){
    if (!el || el.__viewerStickyFixed) return;
    el.__viewerStickyFixed = true;

    // If a previous buggy wrapper exists, do nothing
    if (el.closest && el.closest('.viewer-sticky-wrap')) return;

    var parent = el.parentNode;
    if (!parent || isAncestor(el, parent)) return; // safety: avoid cycles

    // Create a wrapper and insert it BEFORE the element, then move el inside it.
    var wrap = document.createElement('div');
    wrap.className = 'viewer-sticky-wrap';
    wrap.style.position = 'sticky';
    wrap.style.top = '0';
    wrap.style.zIndex = '10';

    try {
      parent.insertBefore(wrap, el); // put wrapper in the DOM at el's position
      wrap.appendChild(el);          // move el inside wrapper (safe direction)
    } catch (e) {
      console.warn('[viewer-sticky-fix.safe] skip element due to', e);
      // rollback flag so we might retry later if DOM changes
      el.__viewerStickyFixed = false;
    }
  }

  function run(){
    var nodes = document.querySelectorAll('.viewer-sticky, [data-sticky="true"], [data-sticky]');
    nodes.forEach(enhanceOne);
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  // Re-run if the page dynamically loads content
  var mo;
  try {
    mo = new MutationObserver(function(muts){
      var need = false;
      for (var i=0;i<muts.length;i++){
        var m = muts[i];
        if ((m.addedNodes && m.addedNodes.length) || (m.attributeName && m.attributeName.indexOf('sticky')>=0)) { need = true; break; }
      }
      if (need) run();
    });
    mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
  } catch (_){ /* ignore */ }
})();