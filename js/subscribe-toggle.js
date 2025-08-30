
/*! RAUN Subscribe Toggle v1.1 (frontend-only fallback)
 *  - Toggles button state and a visible count (demo/local until Firestore)
 *  - Non-destructive: attach by [data-raun-subscribe] attribute or class="raun-subscribe"
 */
(function(){
  const KEY_PREFIX = "raun_subscribe:";
  const COUNT_KEY  = KEY_PREFIX + "count_demo"; // demo until Firestore
  const UID_KEY    = KEY_PREFIX + "uid";

  function uid(){
    let u = localStorage.getItem(UID_KEY);
    if(!u){
      u = "u-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(UID_KEY, u);
    }
    return u;
  }
  const myUid = uid();

  function getCount(){
    const raw = localStorage.getItem(COUNT_KEY);
    return raw ? parseInt(raw,10) || 0 : 0;
  }
  function setCount(n){
    localStorage.setItem(COUNT_KEY, String(Math.max(0, n|0)));
  }

  function getMyState(targetId){
    const k = KEY_PREFIX + "state:" + (targetId||"global") + ":" + myUid;
    return localStorage.getItem(k) === "1";
  }
  function setMyState(targetId, val){
    const k = KEY_PREFIX + "state:" + (targetId||"global") + ":" + myUid;
    if(val){ localStorage.setItem(k, "1"); } else { localStorage.removeItem(k); }
  }

  function format(n){ return new Intl.NumberFormat().format(n); }

  function ensureCountEl(targetId, afterEl){
    let countEl = document.querySelector(`[data-raun-subscribe-count="${targetId}"]`);
    if(!countEl){
      countEl = document.createElement("span");
      countEl.className = "raun-subscribe-count";
      countEl.setAttribute("data-raun-subscribe-count", targetId);
      countEl.setAttribute("data-demo", "1");
      countEl.style.marginLeft = "0.5rem";
      afterEl.insertAdjacentElement("afterend", countEl);
    }
    return countEl;
  }

  function renderBtn(el){
    const targetId = el.getAttribute("data-raun-subscribe") || "global";
    const mine  = getMyState(targetId);
    const count = getCount();
    el.classList.toggle("is-subscribed", mine);
    el.setAttribute("aria-pressed", mine ? "true" : "false");
    el.textContent = mine ? "Abonné" : "S’abonner";

    const countEl = document.querySelector(`[data-raun-subscribe-count="${targetId}"]`);
    if(countEl){
      countEl.textContent = format(count);
    }
  }

  function bind(el){
    const targetId = el.getAttribute("data-raun-subscribe") || "global";
    el.removeEventListener("click", el.__raunSubHandler || (()=>{}));
    const handler = function(){
      let count = getCount();
      const mine = getMyState(targetId);
      if(mine){
        setMyState(targetId, false);
        setCount(Math.max(0, count-1));
      }else{
        setMyState(targetId, true);
        setCount(count+1);
      }
      renderBtn(el);
    };
    el.__raunSubHandler = handler;
    el.addEventListener("click", handler);
    renderBtn(el);
  }

  function upgradeLegacy(){
    document.querySelectorAll(".raun-subscribe").forEach(function(btn, idx){
      if(!btn.hasAttribute("data-raun-subscribe")){
        btn.setAttribute("data-raun-subscribe", btn.id || "global");
      }
      if(!btn.classList.contains("raun-subscribe-btn")){
        btn.classList.add("raun-subscribe-btn");
      }
      ensureCountEl(btn.getAttribute("data-raun-subscribe") || "global", btn);
    });
  }

  function initAll(){
    upgradeLegacy();
    document.querySelectorAll("[data-raun-subscribe]").forEach(function(btn){
      // Ensure count element exists
      ensureCountEl(btn.getAttribute("data-raun-subscribe") || "global", btn);
      // Ensure button style class present
      if(!btn.classList.contains("raun-subscribe-btn")){
        btn.classList.add("raun-subscribe-btn");
      }
      bind(btn);
    });
  }

  document.addEventListener("DOMContentLoaded", initAll);
})();
