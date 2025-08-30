/*! RAUN Capsule Expand v1.1
 *  - 80% viewport (80vw x 80vh)
 *  - Vertical scrollbar INSIDE the capsule (not on the page)
 *  - Non-destructive (auto-detects capsules; no HTML changes required)
 */
(function(){
  function isCapsuleCandidate(el){
    const cls = el.className || "";
    return el.hasAttribute("data-raun-capsule") ||
           /\bcapsule(-window|-card|-box)?\b/i.test(cls) ||
           /\braun-capsule\b/i.test(cls);
  }

  function ensureScrollWrapper(box){
    // Create one scrollable wrapper to hold the existing content (except the expand button)
    let wrap = box.querySelector(":scope > .raun-capsule-scroll");
    if(!wrap){
      wrap = document.createElement("div");
      wrap.className = "raun-capsule-scroll";
      // move existing children into wrap, but keep expand button at first position
      const expandBtn = box.querySelector(":scope > .raun-expand-btn");
      const nodes = Array.from(box.childNodes).filter(n => n !== expandBtn);
      nodes.forEach(n => wrap.appendChild(n));
      if(expandBtn){
        expandBtn.insertAdjacentElement("afterend", wrap);
      }else{
        box.insertAdjacentElement("afterbegin", wrap);
      }
    }
    return wrap;
  }

  function ensureExpandButton(box){
    let btn = box.querySelector(":scope > .raun-expand-btn");
    if(!btn){
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "raun-expand-btn";
      btn.setAttribute("aria-label","Agrandir la capsule");
      box.insertAdjacentElement("afterbegin", btn);
    }
    btn.addEventListener("click", function(ev){
      ev.stopPropagation();
      ev.preventDefault();
      const expanded = box.classList.toggle("is-expanded");
      document.body.classList.toggle("raun-capsule-locked", expanded);
      if(expanded){ try{ btn.focus(); }catch(e){} }
    });
    return btn;
  }

  function upgradeCapsules(root){
    root.querySelectorAll("*").forEach(function(el){
      if(isCapsuleCandidate(el)){
        el.classList.add("raun-capsule-expandable");
        ensureExpandButton(el);
        ensureScrollWrapper(el);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function(){
    upgradeCapsules(document);
  });
})();