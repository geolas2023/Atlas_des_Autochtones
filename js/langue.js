// Bascule français / anglais : le lien .lien-langue mène à la page jumelle ; l'ancre (#...) est conservée.
document.querySelectorAll('.lien-langue').forEach(a => a.addEventListener('click', () => {
  a.href = a.getAttribute('href').split('#')[0] + location.hash;
}));
