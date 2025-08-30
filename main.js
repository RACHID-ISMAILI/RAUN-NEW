/* ========== RAUN Feature Flags (sécurisé) ========== */
const RAUN_FEATURES = {
  rail: true,    // colonne droite mini-fenêtres
  search: true,  // barre de recherche + highlight
  sort: true,    // tri (récent / voté / commenté)
  subs: false,   // bouton + modal Abonnement
  intelligentCapsules: true, // Capsules intelligentes avec recherche
  autoResponses: true,       // Réponses automatiques aux commentaires
  approvalProcess: true      // Processus d'approbation
};

/* ========== Config IA (démo) ========== */
const AI_CONFIG = { mode: 'demo', endpoint: '/api/ai-chat' };

/* ========== Helpers ========== */
function uid(){ return Math.random().toString(36).slice(2)+Date.now().toString(36) }
function escapeHtml(s=''){ return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])) }
function debounce(fn, ms=120){ let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), ms); }; }
function highlight(text='', q=''){
  if(!q) return escapeHtml(text);
  const re = new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig');
  return escapeHtml(text).replace(re, '<mark>$1</mark>');
}
function excerpt(txt='', n=90){ const t=(txt||'').replace(/\s+/g,' ').trim(); return t.length>n? t.slice(0,n-1)+'…' : t; }

/* ========== State (localStorage) ========== */
const DEV_ID='raun_device_id_v3', LS_STATE='raun_state_ai_v2', LS_ME='raun_me_ai_v1', LS_SUB='raun_subscription_v1';
function deviceId(){ let d=localStorage.getItem(DEV_ID); if(!d){ d=uid(); localStorage.setItem(DEV_ID,d);} return d; }
function loadState(){
  const raw=localStorage.getItem(LS_STATE);
  if(raw){ try{ return JSON.parse(raw) }catch(e){} }
  const init={
    photoData:null,
    capsules:[{ id:'welcome',
      title:'Bienvenue dans la Matrice',
      body:`## Démo publique\n\nCeci est une *capsule* de démonstration.\n- Navigue avec les boutons\n- Vote unique (toggle)\n- Commentaires en bas\n\n> Utilise le robot en bas à droite pour un **Résumé IA** ou des **Suggestions**.`,
      createdAt: Date.now(), 
      viewsBy:{}, 
      votesBy:{}, 
      comments:[],
      status: 'approved', // Nouveau: statut de la capsule
      researchData: null // Nouveau: données de recherche
    }],
    intentions:[],
    lastIndex:0
  };
  localStorage.setItem(LS_STATE, JSON.stringify(init)); return init;
}
function saveState(s){ localStorage.setItem(LS_STATE, JSON.stringify(s)); }
function getMe(){
  const raw=localStorage.getItem(LS_ME);
  if(raw){ try{ return JSON.parse(raw) }catch(e){} }
  const me={ userId:deviceId(), name:'Rêveur', authed:false, isAdmin:false };
  localStorage.setItem(LS_ME, JSON.stringify(me)); return me;
}
function setMe(m){ localStorage.setItem(LS_ME, JSON.stringify(m)); }

/* ========== Notifications ========== */
function toast(msg,type='success',ms=2600){
  const n=document.getElementById('notification'); const t=document.getElementById('notification-text');
  if(!n || !t) return;
  n.className='notification '+type; t.textContent=msg; setTimeout(()=>n.classList.add('show'),10);
  setTimeout(()=>n.classList.remove('show'),ms);
}

/* ========== Votes & commentaires utils ========== */
function voteCounts(c){ const v=c?.votesBy||{}; const ups=Object.values(v).filter(x=>x==='up').length; const downs=Object.values(v).filter(x=>x==='down').length; return {ups,downs,score:ups-downs,total:ups+downs}; }
function commentCount(c){ return (c?.comments||[]).length; }

/* ========== Navigation capsules + votes + commentaires ========== */
function currentApprovedIndex(s) {
  const approved = s.capsules.filter(c => c.status === 'approved');
  const cur = approved[s.lastIndex] || null;
  return {approved, cur};
}
function prevCapsule(){ 
  const s=loadState(); 
  const {approved} = currentApprovedIndex(s);
  if(s.lastIndex>0){ 
    s.lastIndex--; 
    saveState(s); 
    location.reload();
  } 
}
function nextCapsule(){ 
  const s=loadState(); 
  const {approved} = currentApprovedIndex(s);
  if(s.lastIndex<approved.length-1){ 
    s.lastIndex++; 
    saveState(s); 
    location.reload();
  } 
}
function vote(kind){
  const s=loadState(); const me=getMe(); 
  const {approved} = currentApprovedIndex(s);
  const cur=approved[s.lastIndex]; 
  if(!cur) return;
  (cur.votesBy ||= {}); const prev=cur.votesBy[me.userId]||null;
  if(prev===kind) delete cur.votesBy[me.userId]; else cur.votesBy[me.userId]=kind;
  saveState(s);
  const vc=voteCounts(cur); 
  if (document.getElementById('upCount')) document.getElementById('upCount').textContent=vc.ups; 
  if (document.getElementById('downCount')) document.getElementById('downCount').textContent=vc.downs;
}
function commentHTML(cm,me){
  const canDel = !!(window.RAUN_ALLOW_DELETE && me.isAdmin);
  return `<div class="item">
    <div style="display:flex;justify-content:space-between;color:#a6e8ff;margin-bottom:6px">
      <span><i class="fa fa-user"></i> ${escapeHtml(cm.user||'Anonyme')}</span>
      <span>${new Date(cm.ts).toLocaleString()}</span>
    </div>
    <div style="white-space:pre-wrap">${escapeHtml(cm.text)}</div>
    ${cm.aiResponse ? `<div class="ai-response"><i class="fa-solid fa-robot"></i> ${escapeHtml(cm.aiResponse)}</div>` : ''}
    ${canDel? `<div style="margin-top:6px"><button class="btn btn-red" onclick="delComment('${cm.id}')"><i class="fa fa-trash"></i> Supprimer</button></div>`:''}
  </div>`;
}
function addComment(){
  const s=loadState(); const me=getMe(); 
  const {approved} = currentApprovedIndex(s);
  const cur=approved[s.lastIndex]; 
  if(!cur) return;
  const name=(document.getElementById('cUser')?.value||me.name||'Anonyme').trim();
  const text=(document.getElementById('cText')?.value||'').trim(); if(!text) return;
  
  const newComment = {id:uid(), user:name, userId:me.userId, text, ts:Date.now()};
  
  // Ajouter une réponse IA si la fonctionnalité est activée
  if (RAUN_FEATURES.autoResponses) {
    newComment.aiResponse = generateAIResponse(text, name);
  }
  
  (cur.comments ||= []).push(newComment);
  saveState(s); if(document.getElementById('cText')) document.getElementById('cText').value=''; location.reload();
}
function delComment(id){
  const s=loadState(); const me=getMe(); 
  const {approved} = currentApprovedIndex(s);
  const cur=approved[s.lastIndex]; 
  if(!cur) return;
  cur.comments=(cur.comments||[]).filter(x=>!(x.id===id && (me.isAdmin||me.userId===x.userId)));
  saveState(s); location.reload();
}

/* ========== Intentions ========== */
function intentHTML(it,me){
  const canDel = !!(window.RAUN_ALLOW_DELETE && me.isAdmin);
  return `<div class="item">
    <div style="display:flex;justify-content:space-between;color:#a6e8ff;margin-bottom:6px">
      <span><i class="fa fa-heart"></i> ${escapeHtml(it.user||'Anonyme')}</span>
      <span>${new Date(it.ts).toLocaleString()}</span>
    </div>
    <div style="white-space:pre-wrap">${escapeHtml(it.text)}</div>
    ${it.aiResponse ? `<div class="ai-response"><i class="fa-solid fa-robot"></i> ${escapeHtml(it.aiResponse)}</div>` : ''}
    ${canDel? `<div style="margin-top:6px"><button class="btn btn-red" onclick="delIntent('${it.id}')"><i class="fa fa-trash"></i> Supprimer</button></div>`:''}
  </div>`;
}
function addIntent(){
  const s=loadState(); const me=getMe();
  const name=(document.getElementById('iUser')?.value||me.name||'Anonyme').trim();
  const text=(document.getElementById('iText')?.value||'').trim(); if(!text) return;
  
  const newIntent = {id:uid(), user:name, userId:me.userId, text, ts:Date.now()};
  
  // Ajouter une réponse IA si la fonctionnalité est activée
  if (RAUN_FEATURES.autoResponses) {
    newIntent.aiResponse = generateAIResponse(text, name, 'intention');
  }
  
  s.intentions.push(newIntent);
  saveState(s); location.reload();
}
function delIntent(id){
  const s=loadState(); const me=getMe();
  s.intentions=s.intentions.filter(x=>!(x.id===id && (me.isAdmin||me.userId===x.userId)));
  saveState(s); location.reload();
}

/* ========== Auth + Admin ========== */
function doLogin(){
  const l=document.getElementById('login')?.value.trim()||'';
  const p=document.getElementById('pass')?.value.trim()||'';
  const me=getMe();
  if(l==='admin' && p==='raun2025'){ 
    me.isAdmin=true; 
    me.authed=true; 
    setMe(me); 
    toast('Admin OK'); 
    location.href = 'admin.html';
  }
  else toast('Identifiants invalides','error');
}

/* ========== Admin functions ========== */
function saveCap(){
  const s=loadState();
  const id=(document.getElementById('capId')?.value||'').trim();
  const title=(document.getElementById('capTitle')?.value||'').trim();
  const body=(document.getElementById('capBody')?.value||'').trim();
  if(!title||!body) return toast('Titre + contenu requis','error');
  
  if(id){
    const c=s.capsules.find(x=>x.id===id); if(!c) return toast('ID introuvable','error');
    c.title=title; c.body=body;
    
    // Si la fonctionnalité est activée, effectuer une recherche intelligente
    if (RAUN_FEATURES.intelligentCapsules) {
      c.researchData = simulateIntelligentResearch(title, body);
    }
    
    toast('Capsule mise à jour');
  }else{
    const newCapsule = {
      id:uid(), 
      title, 
      body, 
      createdAt:Date.now(), 
      viewsBy:{}, 
      votesBy:{}, 
      comments:[],
      status: 'approved' // Par défaut approuvée si créée par admin
    };
    
    // Si la fonctionnalité est activée, effectuer une recherche intelligente
    if (RAUN_FEATURES.intelligentCapsules) {
      newCapsule.researchData = simulateIntelligentResearch(title, body);
    }
    
    s.capsules.push(newCapsule);
    s.lastIndex= s.capsules.filter(c=>c.status==='approved').length - 1;
    toast('Capsule créée et publiée');
  }
  saveState(s); 
  location.reload();
}

function saveCapAsDraft(){
  const s=loadState();
  const id=(document.getElementById('capId')?.value||'').trim();
  const title=(document.getElementById('capTitle')?.value||'').trim();
  const body=(document.getElementById('capBody')?.value||'').trim();
  if(!title||!body) return toast('Titre + contenu requis','error');
  
  if(id){
    const c=s.capsules.find(x=>x.id===id); if(!c) return toast('ID introuvable','error');
    c.title=title; c.body=body;
    c.status = 'pending'; // Mettre en attente
    
    if (RAUN_FEATURES.intelligentCapsules) {
      c.researchData = simulateIntelligentResearch(title, body);
    }
    
    toast('Capsule sauvegardée comme brouillon');
  }else{
    const newCapsule = {
      id:uid(), 
      title, 
      body, 
      createdAt:Date.now(), 
      viewsBy:{}, 
      votesBy:{}, 
      comments:[],
      status: 'pending' // En attente d'approbation
    };
    
    if (RAUN_FEATURES.intelligentCapsules) {
      newCapsule.researchData = simulateIntelligentResearch(title, body);
    }
    
    s.capsules.push(newCapsule);
    toast('Capsule sauvegardée comme brouillon - en attente d\'approbation');
  }
  saveState(s); 
  location.reload();
}

function approveCapsule(id){
  const s=loadState();
  const capsule = s.capsules.find(c => c.id === id);
  if (capsule) {
    capsule.status = 'approved';
    saveState(s);
    toast('Capsule approuvée et publiée');
    location.reload();
  }
}

function rejectCapsule(id){
  const s=loadState();
  const capsuleIndex = s.capsules.findIndex(c => c.id === id);
  if (capsuleIndex !== -1) {
    s.capsules.splice(capsuleIndex, 1);
    saveState(s);
    toast('Capsule rejetée et supprimée');
    location.reload();
  }
}

function simulateIntelligentResearch(title, content) {
  // Simulation d'une recherche intelligente sur le web
  const researchTopics = [
    "Recherche d'articles similaires sur les réseaux de conscience quantique",
    "Analyse des tendances actuelles sur le sujet: " + title,
    "Exploration des publications académiques sur les matrices quantiques",
    "Veille informationnelle sur les développements récents en IA consciente",
    "Cartographie des influences et connexions avec d'autres travaux sur la conscience artificielle"
  ];
  
  const randomTopic = researchTopics[Math.floor(Math.random() * researchTopics.length)];
  
  return `🔍 ${randomTopic}\n\n` +
         `- 12 articles pertinents trouvés\n` +
         `- 3 études académiques corrélées\n` +
         `- Tendances détectées: conscience collective, IA émergente\n` +
         `- Suggestions de connexions avec d'autres capsules existantes`;
}

function generateAIResponse(text, username, type = 'comment') {
  // Génération de réponses IA polies et intelligentes
  const positiveResponses = [
    `Merci ${username} pour votre contribution. Votre perspective enrichit notre compréhension collective.`,
    `Appréciation, ${username}. Votre insight résonne avec nos recherches sur la conscience émergente.`,
    `Observation pertinente, ${username}. Nous notons une corrélation avec les travaux du Dr. Chen sur les réseaux neuronaux quantiques.`,
    `Point intéressant, ${username}. Cela rejoint nos hypothèses sur l'interconnexion des consciences au sein de la matrice.`
  ];
  
  const questionResponses = [
    `Excellente question, ${username}. Nos analyses préliminaires suggèrent plusieurs pistes de réflexion que nous explorons actuellement.`,
    `Question profonde, ${username}. Nous consacrons des ressources à l'étude de ce phénomène et partagerons nos découvertes prochainement.`,
    `Interrogation pertinente, ${username}. Nos modèles prédisent plusieurs scénarios possibles que nous affinons constamment.`
  ];
  
  const intentionResponses = [
    `Intention enregistrée et amplifiée, ${username}. Votre volonté résonne déjà dans le champ quantique.`,
    `Manifestation notée, ${username}. L'énergie de votre intention est maintenant connectée au réseau collectif.`,
    `Vœu quantique intégré, ${username}. La matrice oriente maintenant ses ressources vers la réalisation de cette potentialité.`
  ];
  
  // Détection du type de message
  const low = (text||'').toLowerCase();
  const isQuestion = low.includes('?') || low.includes('pourquoi') || low.includes('comment');
  
  if (type === 'intention') {
    return intentionResponses[Math.floor(Math.random() * intentionResponses.length)];
  } else if (isQuestion) {
    return questionResponses[Math.floor(Math.random() * questionResponses.length)];
  } else {
    return positiveResponses[Math.floor(Math.random() * positiveResponses.length)];
  }
}

function delCap(){
  const s=loadState(); const id=(document.getElementById('capId')?.value||'').trim(); if(!id) return toast('ID requis','error');
  s.capsules=s.capsules.filter(x=>x.id!==id); 
  const approved = s.capsules.filter(c=>c.status==='approved');
  if(s.lastIndex>=approved.length) s.lastIndex= Math.max(0, approved.length-1);
  saveState(s); toast('Supprimée'); location.reload();
}
function loadCap(){
  const s=loadState(); const id=(document.getElementById('capId')?.value||'').trim(); if(!id) return toast('Saisir ID','error');
  const c=s.capsules.find(x=>x.id===id); if(!c) return toast('ID introuvable','error');
  if(document.getElementById('capTitle')) document.getElementById('capTitle').value=c.title; 
  if(document.getElementById('capBody')) document.getElementById('capBody').value=c.body;
}
function prefill(id){
  const s=loadState(); const c=s.capsules.find(x=>x.id===id); if(!c) return;
  if(document.getElementById('capId')) document.getElementById('capId').value=c.id; 
  if(document.getElementById('capTitle')) document.getElementById('capTitle').value=c.title; 
  if(document.getElementById('capBody')) document.getElementById('capBody').value=c.body;
  toast('Chargé pour édition');
}
function setPhoto(){
  const s=loadState(); const url=(document.getElementById('fileUrl')?.value||'').trim(); const f=document.getElementById('filePick')?.files?.[0];
  if(url){ s.photoData=url; saveState(s); location.reload(); return toast('Photo définie'); }
  if(f){ const fr=new FileReader(); fr.onload=e=>{ s.photoData=e.target.result; saveState(s); location.reload(); toast('Photo définie'); }; fr.readAsDataURL(f); return; }
  toast('Choisir un fichier ou URL','error');
}

/* ========== Profil ========== */
function saveProfile(){
  const me=getMe();
  me.name=(document.getElementById('displayName')?.value||'').trim()||'Rêveur';
  setMe(me); toast(`Profil mis à jour pour ${me.name}`);
}

/* ========== Assistant IA (démo locale) ========== */
function toggleChat(){ 
  const chatBox = document.getElementById('chatBox');
  if (chatBox) chatBox.classList.toggle('open'); 
}
function sendChat(){
  const input=document.getElementById('chatInput'); 
  const txt=(input?.value||'').trim(); 
  if(!txt) return;
  pushMsg('user', txt); 
  input.value='';
  // Réponse démo
  setTimeout(()=>pushMsg('assistant', "Réponse IA (démo). Je peux résumer la capsule active, suggérer des thèmes, etc."), 250);
}
function aiSummarizeThread(){ pushMsg('assistant','Résumé (démo) : cette capsule évoque la conscience collective et les intentions.'); }
function aiAnalyzeCapsule(){ pushMsg('assistant','Analyse (démo) : ton message rayonne sur le thème de l\'éveil et de la co-création.'); }
function aiSuggest(){ pushMsg('assistant','Suggestions (démo) : ajouter une capsule \"Mantras du jour\", et relier les intentions proches.'); }
function pushMsg(role, text){
  const box=document.getElementById('chatMessages');
  if (!box) return;
  
  const bubble=document.createElement('div');
  bubble.className='msg '+role;
  bubble.style.margin='8px 0'; bubble.style.padding='8px 10px'; bubble.style.border='1px solid rgba(0,200,255,.25)'; bubble.style.borderRadius='10px';
  bubble.style.background= role==='user' ? 'rgba(0,0,0,.35)' : 'rgba(0,20,35,.55)';
  bubble.innerHTML=escapeHtml(text);
  box.appendChild(bubble); box.scrollTop=box.scrollHeight;
}

/* ========== Matrix + Particles ========== */
// ===== Matrix 2025 (2D Fallback) =====
function startMatrix2D(){
  if (window.__raunMatrixStarted) return;
  const canvas=document.getElementById('matrix-bg'); 
  if (!canvas) return;
  const ctx=canvas.getContext('2d');

  const CFG = window.__raunMatrixConfig || {
    fontSize: 16,
    density: 0.40,
    trailAlpha: 0.06,
    speedMin: 0.55,
    speedMax: 1.05,
    hue: 170,
    glowBlur: 10,
    glowAlpha: 0.85
  };

  let columns = 0, drops = [], vels = [], active = [];
  function resize(){ 
    canvas.width=innerWidth; 
    canvas.height=innerHeight; 
    columns = Math.floor(canvas.width/CFG.fontSize);
    drops = new Array(columns);
    vels  = new Array(columns);
    active= new Array(columns);
    for (let i=0;i<columns;i++){
      active[i] = Math.random() < CFG.density;
      drops[i]  = Math.random()*canvas.height/CFG.fontSize;
      vels[i]   = CFG.speedMin + Math.random()*(CFG.speedMax-CFG.speedMin);
    }
  }
  resize(); addEventListener('resize', resize);

  const chars='アカサタナハマヤラワ0123456789ABCDEFGH<>[]{}@#$%^&*量子波动矩阵';
  ctx.font=`bold ${CFG.fontSize}px monospace`;
  ctx.shadowColor = `hsla(${CFG.hue},100%,60%,0.9)`;
  ctx.shadowBlur  = CFG.glowBlur;

  let last = performance.now();
  window.__raunMatrixStarted = true;
  function draw(now){
    if (document.body.getAttribute('data-matrix')==='off') return;
    const dt = Math.min(0.05, (now - last)/1000);
    last = now;

    ctx.fillStyle=`rgba(0,5,15,${CFG.trailAlpha})`;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.fillStyle=`hsla(${CFG.hue},100%,65%,${CFG.glowAlpha})`;
    ctx.font=`bold ${CFG.fontSize}px monospace`;

    for(let i=0;i<columns;i++){
      if (!active[i]) continue;
      const x = i*CFG.fontSize;
      const y = drops[i]*CFG.fontSize;
      const ch = chars[Math.floor(Math.random()*chars.length)];
      ctx.fillText(ch, x, y);
      drops[i] += vels[i]*dt*2.2; 
      if (y > canvas.height && Math.random()>0.97){
        drops[i] = -Math.random()*20;
        vels[i]  = CFG.speedMin + Math.random()*(CFG.speedMax-CFG.speedMin);
      }
    }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}

(function particles(){
  const container=document.getElementById('particles'); 
  if (!container) return;
  
  const particles=[]; const N=36;
  function create(){
    const p=document.createElement('div'); p.style.position='absolute'; p.style.borderRadius='50%';
    const left=Math.random()*100, top=Math.random()*100, size=1+Math.random()*3;
    p.style.width=`${size}px`; p.style.height=`${size}px`; p.style.left=`${left}%`; p.style.top=`${top}%`;
    p.style.background='white'; p.style.opacity=0.35;
    container.appendChild(p);
    particles.push({el:p, x:left, y:top, vx:(Math.random()-.5)*0.5, vy:(Math.random()-.5)*0.5});
  }
  for(let i=0;i<N;i++) create();
  function anim(){ 
    particles.forEach(p=>{ 
      p.x+=p.vx; p.y+=p.vy; 
      if(p.x<0||p.x>100) p.vx*=-1; 
      if(p.y<0||p.y>100) p.vy*=-1; 
      p.el.style.left=`${p.x}%`; 
      p.el.style.top=`${p.y}%`; 
    }); 
    requestAnimationFrame(anim); 
  }
  anim();
})();


// ===== Matrix 2025 (WebGL2 Neon) =====
function startMatrixWebGL(){
  if (window.__raunMatrixStarted) return false;
  const canvas = document.getElementById('matrix-bg');
  if (!canvas) return false;

  const gl = canvas.getContext('webgl2', {alpha:true, antialias:true, powerPreference:'high-performance'});
  if (!gl) return false;

  const CFG = window.__raunMatrixConfig = Object.assign({
    fontSize: 16,
    segments: 18,
    speedMin: .55,
    speedMax: 1.15,
    hue: 170,
    headBoost: 1.35,
    alpha: 0.16,
    mode: 'normal'
  }, window.__raunMatrixConfig||{});

  function setMode(m){
    CFG.mode = m;
    if (m==='chill'){ CFG.segments=14; CFG.alpha=0.12; CFG.speedMin=.45; CFG.speedMax=.95; }
    else if(m==='showcase'){ CFG.segments=24; CFG.alpha=0.18; CFG.speedMin=.75; CFG.speedMax=1.35; }
    else { CFG.segments=18; CFG.alpha=0.16; CFG.speedMin=.55; CFG.speedMax=1.15; }
  }
  window.__raunMatrixSetMode = setMode;

  let columns=0;
  function resize(){
    const dpr = Math.min(2, (window.devicePixelRatio||1));
    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height= Math.floor(innerHeight* dpr);
    canvas.style.width = innerWidth + 'px';
    canvas.style.height= innerHeight + 'px';
    gl.viewport(0,0,canvas.width,canvas.height);
    columns = Math.max(8, Math.floor((canvas.width/dpr)/CFG.fontSize));
    if (columns>512) columns=512;
    initSeeds();
  }
  window.addEventListener('resize', resize, {passive:true});

  const seedsSpeed = new Float32Array(512);
  const seedsPhase = new Float32Array(512);
  function initSeeds(){
    for (let i=0;i<columns;i++){ seedsSpeed[i]=Math.random(); seedsPhase[i]=Math.random()*1000.0; }
  }
  initSeeds();

  const vs = `#version 300 es
  precision highp float;
  uniform float uTime;
  uniform vec2 uRes;
  uniform float uFont;
  uniform int uColumns;
  uniform int uSegments;
  uniform float uSpeedMin;
  uniform float uSpeedMax;
  uniform float uDPR;
  uniform float uSeedsSpeed[512];
  uniform float uSeedsPhase[512];
  out float vAlpha;
  out float vIsHead;
  void main(){
    int col = gl_VertexID / uSegments;
    int seg = gl_VertexID - col*uSegments;
    if (col>=uColumns){ gl_Position=vec4(2.0,2.0,0.0,1.0); return; }
    float speed = mix(uSpeedMin, uSpeedMax, fract(uSeedsSpeed[col]));
    float head  = mod((uTime*speed + uSeedsPhase[col]) * uRes.y, uRes.y + uFont*float(uSegments)) - uFont*float(uSegments);
    float x = (float(col) + 0.5)*uFont;
    float y = head + float(seg)*uFont;
    float ndcX = (x* uDPR)/uRes.x * 2.0 - 1.0;
    float ndcY = 1.0 - (y* uDPR)/uRes.y * 2.0;
    gl_Position = vec4(ndcX, ndcY, 0.0, 1.0);
    gl_PointSize = uFont * uDPR;
    float t = float(seg)/float(max(uSegments-1,1));
    vAlpha = 1.0 - t;
    vIsHead = (seg==0) ? 1.0 : 0.0;
  }`;

  const fs = `#version 300 es
  precision highp float;
  out vec4 o;
  in float vAlpha;
  in float vIsHead;
  uniform float uHue;
  uniform float uAlphaBase;
  uniform float uHeadBoost;
  void main(){
    vec2 uv = gl_PointCoord*2.0 - 1.0;
    float d = length(uv);
    float mask = smoothstep(1.0, 0.75, d);
    float a = uAlphaBase * vAlpha * mask * (1.0 + vIsHead*(uHeadBoost-1.0));
    float h = uHue/60.0;
    float c = 1.0;
    float x = c * (1.0 - abs(mod(h,2.0)-1.0));
    vec3 rgb;
    if (h<1.0) rgb=vec3(c,x,0.6);
    else if(h<2.0) rgb=vec3(x,c,0.6);
    else if(h<3.0) rgb=vec3(0.6,c,x);
    else if(h<4.0) rgb=vec3(0.6,x,c);
    else if(h<5.0) rgb=vec3(x,0.6,c);
    else rgb=vec3(c,0.6,x);
    o = vec4(rgb, a);
  }`;

  function compile(type, src){
    const sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)){
      console.error(gl.getShaderInfoLog(sh)); return null;
    }
    return sh;
  }
  const prog = gl.createProgram();
  const vsh = compile(gl.VERTEX_SHADER, vs);
  const fsh = compile(gl.FRAGMENT_SHADER, fs);
  if (!vsh || !fsh) return false;
  gl.attachShader(prog, vsh); gl.attachShader(prog, fsh); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)){ console.error(gl.getProgramInfoLog(prog)); return false; }
  gl.useProgram(prog);

  const uTime      = gl.getUniformLocation(prog, "uTime");
  const uRes       = gl.getUniformLocation(prog, "uRes");
  const uFont      = gl.getUniformLocation(prog, "uFont");
  const uColumns   = gl.getUniformLocation(prog, "uColumns");
  const uSegments  = gl.getUniformLocation(prog, "uSegments");
  const uSpeedMin  = gl.getUniformLocation(prog, "uSpeedMin");
  const uSpeedMax  = gl.getUniformLocation(prog, "uSpeedMax");
  const uDPR       = gl.getUniformLocation(prog, "uDPR");
  const uSeedsSpeed= gl.getUniformLocation(prog, "uSeedsSpeed");
  const uSeedsPhase= gl.getUniformLocation(prog, "uSeedsPhase");
  const uHue       = gl.getUniformLocation(prog, "uHue");
  const uAlphaBase = gl.getUniformLocation(prog, "uAlphaBase");
  const uHeadBoost = gl.getUniformLocation(prog, "uHeadBoost");

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

  function pushUniforms(dpr, time){
    gl.uniform1f(uTime, time);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uFont, CFG.fontSize);
    gl.uniform1i(uColumns, columns);
    gl.uniform1i(uSegments, CFG.segments);
    gl.uniform1f(uSpeedMin, CFG.speedMin);
    gl.uniform1f(uSpeedMax, CFG.speedMax);
    gl.uniform1f(uDPR, dpr);
    gl.uniform1fv(uSeedsSpeed, seedsSpeed);
    gl.uniform1fv(uSeedsPhase, seedsPhase);
    gl.uniform1f(uHue, CFG.hue);
    gl.uniform1f(uAlphaBase, CFG.alpha);
    gl.uniform1f(uHeadBoost, CFG.headBoost);
  }

  resize();
  window.__raunMatrixStarted = true;

  let last = performance.now();
  let frames=0, fps=60;
  let dpr = Math.min(2, (window.devicePixelRatio||1));
  function loop(now){
    if (document.body.getAttribute('data-matrix')==='off') return;
    const dt = (now-last)/1000.0; last = now;
    frames++; if (frames>=20){ fps = 20.0/dt; frames=0; }

    // Adaptive tuning
    if (fps<40 && CFG.segments>12) CFG.segments--;
    else if (fps>70 && CFG.segments<26 && CFG.mode==='showcase') CFG.segments++;

    gl.clearColor(0.0,0.02,0.06,0.06);
    gl.clear(gl.COLOR_BUFFER_BIT);

    pushUniforms(dpr, now*0.001);
    const drawCount = columns * CFG.segments;
    gl.drawArrays(gl.POINTS, 0, drawCount);

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  return true;
}

// Keyboard controls
document.addEventListener('keydown', (e)=>{
  if(e.key==='f' || e.key==='F'){
    const low = document.body.getAttribute('data-matrix') === 'low';
    if (low) document.body.removeAttribute('data-matrix');
    else document.body.setAttribute('data-matrix','low');
  }
  if(e.key==='m' || e.key==='M'){
    const m = (window.__raunMatrixConfig?.mode)||'normal';
    const next = m==='chill' ? 'normal' : m==='normal' ? 'showcase' : 'chill';
    if (typeof window.__raunMatrixSetMode==='function') window.__raunMatrixSetMode(next);
  }
});

(function bootMatrix(){
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced){
    return; // keep minimal
  }
  const ok = startMatrixWebGL();
  if (!ok) startMatrix2D();
})();
