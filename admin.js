// Script spécifique à la page d'administration
document.addEventListener('DOMContentLoaded', function() {
  // Priorité: Firebase Auth (évite les faux négatifs du localStorage)
  if (window.RAUNAuth && typeof RAUNAuth.onChange === 'function') {
    RAUNAuth.onChange(function(user){
      var owner = window.RAUN_OWNER_EMAIL || '';
      if(!user){
        location.href = 'auth.html?returnTo=/admin.html'; return;
      }
      if(owner && String(user.email).toLowerCase() !== String(owner).toLowerCase()){
        location.href = 'index.html'; return;
      }
      // Compat: synchroniser le flag local 'isAdmin' pour les scripts existants
      try{
        var LS_ME='raun_me_ai_v1';
        var meRaw = localStorage.getItem(LS_ME);
        var me = meRaw ? JSON.parse(meRaw) : { userId: (Math.random().toString(36).slice(2)), name: user.email };
        me.authed = true; me.isAdmin = true; me.name = user.email;
        localStorage.setItem(LS_ME, JSON.stringify(me));
      }catch(e){}
      // Charger données
      var s = loadState();
      updateCapsuleList(s);
    });
    return; // on ne passe pas par la vérif locale
  }
  // Fallback (si RAUNAuth absent) : vérification locale
  const me = getMe();
  if (!me.isAdmin) {
    location.href = 'auth.html';
    return;
  }// Charger les données
  const s = loadState();
  
  // Afficher la liste des capsules
  updateCapsuleList(s);
});

function updateCapsuleList(s) {
  const listContainer = document.getElementById('alist');
  if (!listContainer) return;
  
  listContainer.innerHTML = s.capsules.slice().reverse().map(c => `
    <div class="item">
      <div style="display:flex;justify-content:space-between;color:#a6e8ff;margin-bottom:6px">
        <span>ID: <b>${c.id}</b></span>
        <span>${new Date(c.createdAt).toLocaleString()}</span>
      </div>
      <div style="display:flex;align-items:center">
        <span><b>${escapeHtml(c.title)}</b></span>
        <span class="status-badge status-${c.status || 'pending'}">${c.status || 'pending'}</span>
      </div>
      <div>${escapeHtml((c.body || '').slice(0, 200))}${(c.body || '').length > 200 ? '…' : ''}</div>
      <div style="margin-top:8px">
        <button class="btn" onclick="prefill('${c.id}')"><i class="fa fa-pen"></i> Éditer</button>
      </div>
    </div>
  `).join('');
}
