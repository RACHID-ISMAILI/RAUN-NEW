// Script spécifique à la page À propos
document.addEventListener('DOMContentLoaded', function() {
  const s = loadState();
  const avatarContainer = document.getElementById('aboutAvatar');
  
  if (avatarContainer && s.photoData) {
    avatarContainer.innerHTML = `<img src="${s.photoData}" alt="Rachid Ismaili">`;
  } else if (avatarContainer) {
    avatarContainer.innerHTML = '<i class="fa fa-user-astronaut" style="font-size:80px;padding:40px 0;color:rgba(0,255,255,.4)"></i>';
  }
});
