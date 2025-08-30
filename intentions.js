// Script spécifique à la page Intentions
document.addEventListener('DOMContentLoaded', function() {
  const s = loadState();
  const me = getMe();
  
  // Pré-remplir le nom d'utilisateur
  const iUser = document.getElementById('iUser');
  if (iUser && me.name) {
    iUser.value = me.name;
  }
  
  // Afficher les intentions
  updateIntentionsList(s, me);
});

function updateIntentionsList(s, me) {
  const listContainer = document.getElementById('ilist');
  if (!listContainer) return;
  
  listContainer.innerHTML = s.intentions.slice().reverse().map(it => intentHTML(it, me)).join('');
}
