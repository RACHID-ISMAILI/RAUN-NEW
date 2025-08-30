// Script spécifique à la page publique
document.addEventListener('DOMContentLoaded', function() {
  // États UI (mémoire volatile)
  window.__raunQuery = window.__raunQuery || '';
  window.__raunSort  = window.__raunSort  || 'recent';
  
  // Charger les données
  const s = loadState();
  const me = getMe();
  
  // Initialiser l'interface
  initPublicInterface(s, me);
  initRail(s, me);
  
  // Configurer les événements
  const input = document.getElementById('railQuery');
  if(input) {
    const onInput = debounce(e => {
      window.__raunQuery = e.target.value;
      updateRail(s, me);
      const cbtn = document.getElementById('clearSearchBtn');
      if(cbtn) cbtn.style.display = window.__raunQuery ? 'block' : 'none';
    }, 120);
    input.addEventListener('input', onInput);
  }
  
  const sel = document.getElementById('railSort');
  if(sel) {
    sel.value = window.__raunSort;
    sel.addEventListener('change', e => {
      window.__raunSort = e.target.value;
      updateRail(s, me);
    });
  }
  
  // Pré-remplir le nom d'utilisateur
  const cUser = document.getElementById('cUser');
  if (cUser && me.name) {
    cUser.value = me.name;
  }
});

function initPublicInterface(s, me) {
  // Filtrer pour n'afficher que les capsules approuvées
  const approvedCapsules = s.capsules.filter(c => c.status === 'approved');
  
  if(approvedCapsules.length > 0) {
    if(s.lastIndex >= approvedCapsules.length) s.lastIndex = approvedCapsules.length - 1;
    if(s.lastIndex < 0) s.lastIndex = 0; 
    saveState(s);
  }
  
  const has = approvedCapsules.length > 0;
  const cur = has ? approvedCapsules[s.lastIndex] : null;
  
  if(cur) { 
    (cur.viewsBy ||= {}); 
    if(!cur.viewsBy[me.userId]) { 
      cur.viewsBy[me.userId] = true; 
      saveState(s);
    } 
  }
  
  const {ups, downs} = cur ? voteCounts(cur) : {ups: 0, downs: 0};
  
  // Mettre à jour l'interface
  if(document.getElementById('capsuleTitle')) document.getElementById('capsuleTitle').textContent = has ? cur.title : '—';
  if(document.getElementById('capsuleBody')) document.getElementById('capsuleBody').textContent = has ? cur.body : '—';
  if(document.getElementById('upCount')) document.getElementById('upCount').textContent = ups;
  if(document.getElementById('downCount')) document.getElementById('downCount').textContent = downs;
  if(document.getElementById('capsuleCounter')) document.getElementById('capsuleCounter').textContent = `${approvedCapsules.length ? (s.lastIndex + 1) : 0} / ${approvedCapsules.length}`;
  
  // Gérer les boutons de navigation
  if(document.getElementById('prevBtn')) document.getElementById('prevBtn').disabled = s.lastIndex <= 0;
  if(document.getElementById('nextBtn')) document.getElementById('nextBtn').disabled = s.lastIndex >= approvedCapsules.length - 1;
  
  // Afficher les commentaires
  const commentsContainer = document.getElementById('comments');
  if (commentsContainer && cur) {
    commentsContainer.innerHTML = (cur.comments||[]).slice().reverse().map(cm => commentHTML(cm, me)).join('');
  }
}

function initRail(s, me) {
  updateRail(s, me);
}

function updateRail(s, me) {
  // Filtrer pour n'afficher que les capsules approuvées
  const approvedCapsules = s.capsules.filter(c => c.status === 'approved');
  
  const q = (window.__raunQuery || '').trim();
  let list = approvedCapsules.map((c, idx) => ({c, idx})).filter(({c}) => {
    if(!RAUN_FEATURES.search || !q) return true;
    const hay = ((c.title || '') + ' ' + (c.body || '')).toLowerCase();
    return hay.includes(q.toLowerCase());
  });
  
  if(RAUN_FEATURES.sort) { 
    list = sortCapsules(list, window.__raunSort); 
  }
  
  const rail = list.map(({c, idx}) => {
    const vc = voteCounts(c), cc = commentCount(c);
    return `<button class="thumb ${idx === s.lastIndex ? 'active' : ''}" onclick="selectCapsule(${idx})" title="${escapeHtml(c.title)}">
      <div class="thumb-title">${RAUN_FEATURES.search ? highlight(c.title || 'Sans titre', q) : escapeHtml(c.title || 'Sans titre')}</div>
      <div class="thumb-excerpt">${RAUN_FEATURES.search ? highlight(excerpt(c.body || '', 90), q) : escapeHtml(excerpt(c.body || '', 90))}</div>
      <div class="thumb-meta">
        <span>⚡ ${vc.score >= 0 ? '+' : ''}${vc.score}</span>
        <span>💬 ${cc}</span>
        <span>${new Date(c.createdAt || Date.now()).toLocaleDateString()}</span>
      </div>
    </button>`;
  }).join('');
  
  const railScroll = document.getElementById('railScroll');
  if (railScroll) {
    railScroll.innerHTML = rail || '<div class="thumb-empty">Aucune capsule ne correspond</div>';
  }
  
  const railInfo = document.getElementById('railInfo');
  if (railInfo) {
    railInfo.textContent = `${list.length} / ${approvedCapsules.length} visibles`;
  }
  
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  if (clearSearchBtn) {
    clearSearchBtn.style.display = (q ? 'block' : 'none');
  }
}

function sortCapsules(arr, mode) {
  const copy = arr.slice();
  if(mode === 'recent') { 
    copy.sort((a, b) => (b.c.createdAt || 0) - (a.c.createdAt || 0)); 
  }
  else if(mode === 'voted') {
    copy.sort((a, b) => { 
      const A = voteCounts(a.c).score, B = voteCounts(b.c).score; 
      return B !== A ? B - A : (b.c.createdAt || 0) - (a.c.createdAt || 0); 
    });
  } else if(mode === 'commented') {
    copy.sort((a, b) => { 
      const A = commentCount(a.c), B = commentCount(b.c); 
      return B !== A ? B - A : (b.c.createdAt || 0) - (a.c.createdAt || 0); 
    });
  }
  return copy;
}

function selectCapsule(i) { 
  const s = loadState(); 
  // i est l'index dans la liste approuvée
  s.lastIndex = i;
  saveState(s); 
  location.reload();
}

function clearRailSearch() { 
  window.__raunQuery = ''; 
  const inp = document.getElementById('railQuery');
  if(inp) inp.value = '';
  const cbtn = document.getElementById('clearSearchBtn');
  if(cbtn) cbtn.style.display = 'none';
  const s = loadState();
  const me = getMe();
  updateRail(s, me);
}
