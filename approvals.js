document.addEventListener('DOMContentLoaded', () => {
  const me = getMe();
  if (!me.isAdmin) { location.href = 'auth.html'; return; }
  const s = loadState();
  const pending = s.capsules.filter(c => (c.status||'pending') === 'pending');
  const container = document.getElementById('pendingList');
  if (!container) return;
  if (pending.length === 0) {
    container.innerHTML = '<div class="thumb-empty">Aucune capsule en attente.</div>';
    return;
  }
  container.innerHTML = pending.map(c => `
    <div class="item">
      <div style="display:flex;justify-content:space-between;color:#a6e8ff;margin-bottom:6px">
        <span>ID: <b>${c.id}</b></span>
        <span>${new Date(c.createdAt).toLocaleString()}</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span><b>${escapeHtml(c.title)}</b></span>
        <span class="status-badge status-${c.status || 'pending'}">${c.status || 'pending'}</span>
      </div>
      <div style="white-space:pre-wrap;margin-top:6px">${escapeHtml(c.body)}</div>
      ${c.researchData ? `<div class="approval-panel">
        <div class="sub">Recherche intelligente (démo)</div>
        <div class="research-results">${escapeHtml(c.researchData)}</div>
      </div>` : ''}
      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
        <button class="btn btn-green" onclick="approveCapsule('${c.id}')"><i class="fa fa-check"></i> Approuver</button>
        <button class="btn btn-red" onclick="rejectCapsule('${c.id}')"><i class="fa fa-xmark"></i> Rejeter</button>
      </div>
    </div>
  `).join('');
});
