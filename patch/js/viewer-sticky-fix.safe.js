/*! viewer-sticky-fix.safe.js — idempotent wrapper to avoid HierarchyRequestError */
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
    if (el.closest && el.closest('.viewer-sticky-wrap')) return;
    var parent = el.parentNode;
    if (!parent || isAncestor(el, parent)) return;
    var wrap = document.createElement('div');
    wrap.className = 'viewer-sticky-wrap';
    wrap.style.position = 'sticky';
    wrap.style.top = '0';
    wrap.style.zIndex = '10';
    try { parent.insertBefore(wrap, el); wrap.appendChild(el); }
    catch (e) { console.warn('[viewer-sticky-fix.safe] skip element due to', e); el.__viewerStickyFixed = false; }
  }
  function run(){ var nodes = document.querySelectorAll('.viewer-sticky, [data-sticky="true"], [data-sticky]'); nodes.forEach(enhanceOne); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
  try { var mo = new MutationObserver(function(m){ for (var i=0;i<m.length;i++){ var x=m[i]; if ((x.addedNodes && x.addedNodes.length) || (x.attributeName && x.attributeName.indexOf('sticky')>=0)) { run(); break; }}}); mo.observe(document.documentElement, { childList:true, subtree:true, attributes:true }); } catch(_){}
})();