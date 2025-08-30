
/*! RAUN — Admin Moderation Panel (non destructif) */
(function(){
  function isAdmin(user){
    var owner=(window.RAUN_OWNER_EMAIL||"").toLowerCase();
    return user && user.email && user.email.toLowerCase()===owner;
  }
  function tryJSON(s){ try{ return JSON.parse(s); }catch(e){ return null; } }
  function ensurePanel(){
    var id="raunModerationPanel";
    var host=document.getElementById(id);
    if(host) return host;
    host=document.createElement("section");
    host.id=id;
    host.className="raun-mod";
    host.innerHTML = [
      '<h2>Modération (Admin)</h2>',
      '<div class="raun-columns">',
      '  <div class="col">',
      '    <h3>Intentions</h3>',
      '    <div id="modIntentions" class="raun-list"></div>',
      '  </div>',
      '  <div class="col">',
      '    <h3>Commentaires</h3>',
      '    <div id="modComments" class="raun-list"></div>',
      '  </div>',
      '</div>'
    ].join("\n");
    (document.querySelector("main")||document.body).appendChild(host);
    return host;
  }
  function formatDate(ts){ try{ return new Date(ts).toLocaleString(); }catch(e){ return String(ts||''); } }
  function renderList(el, items, onDelete){
    el.innerHTML="";
    if(!items || !items.length){ el.innerHTML='<div class="muted">Aucun élément.</div>'; return; }
    items.forEach(function(it, idx){
      var card = document.createElement("div");
      card.className="raun-item";
      var who = it.user || it.authorName || it.ownerName || it.authorEmail || it.ownerEmail || "—";
      var when = it.ts || it.createdAt || it.date || it.time || null;
      var body = it.text || it.body || it.content || it.message || JSON.stringify(it);
      card.innerHTML = [
        '<div class="meta"><div>'+who+'</div><div>'+formatDate(when)+'</div></div>',
        '<div class="body">'+(body||"")+'</div>',
        '<div class="raun-actions">',
        '  <button class="btn-delete" type="button" title="Supprimer">🗑️ Supprimer</button>',
        '</div>'
      ].join("\n");
      card.querySelector(".btn-delete").addEventListener("click", function(){
        if(confirm("Confirmer la suppression ?")) onDelete(idx, it, card);
      });
      el.appendChild(card);
    });
  }
  function loadFromState(){
    // lire le state unique LS_STATE
    var LS_STATE='raun_state_ai_v2';
    var raw = localStorage.getItem(LS_STATE);
    var s = raw ? tryJSON(raw) : null;
    var intents = (s && Array.isArray(s.intentions)) ? s.intentions : [];
    // Pour les commentaires : récupérer la capsule courante (approved[lastIndex]) et lister ses comments
    var comments = [];
    if(s && s.capsules){
      var idx = typeof s.lastIndex==='number' ? s.lastIndex : 0;
      var approved = (s.capsules||[]).filter(function(c){ return (c.status||'pending')==='approved'; });
      var cur = approved[idx] || s.capsules[idx] || null;
      if(cur && Array.isArray(cur.comments)) comments = cur.comments.slice();
    }
    return {s:s, intentions:intents, comments:comments};
  }
  function saveState(s){ localStorage.setItem('raun_state_ai_v2', JSON.stringify(s)); }
  function build(){
    var host = ensurePanel();
    var I = document.getElementById('modIntentions');
    var C = document.getElementById('modComments');
    var data = loadFromState();
    renderList(I, data.intentions, function(idx){
      data.intentions.splice(idx,1); data.s.intentions = data.intentions; saveState(data.s); build();
    });
    renderList(C, data.comments, function(idx){
      var com = data.comments[idx];
      // supprimer par id dans la capsule courante
      var approved = (data.s.capsules||[]).filter(function(c){ return (c.status||'pending')==='approved'; });
      var cur = approved[data.s.lastIndex||0] || data.s.capsules[0];
      if(cur && Array.isArray(cur.comments)){
        cur.comments = cur.comments.filter(function(x){ return x.id !== com.id; });
      }
      saveState(data.s); build();
    });
  }
  function start(user){ if(!isAdmin(user)) return; build(); }
  if(window.RAUNAuth && typeof RAUNAuth.onChange === 'function'){ RAUNAuth.onChange(start); } else { start(null); }
})();
