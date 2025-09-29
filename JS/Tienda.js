document.addEventListener("DOMContentLoaded", function () {
  // Modal login personalizado
  const loginModal = document.getElementById("loginModal");
  const closeLoginModalBtn = document.getElementById("closeLoginModalBtn");
  const formularioLinks = document.querySelectorAll(".formulario-link");
  let isLoggedIn = false; // Cambia a true si el usuario está logueado

  formularioLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      if (!isLoggedIn) {
        e.preventDefault();
        loginModal.style.display = "flex";
      } else {
        // si está logueado, navega al formulario real
        // (ajusta el destino si tu ruta es distinta)
        window.location.href = "LogIn.html";
      }
    });
  });

  closeLoginModalBtn.addEventListener("click", function () {
    loginModal.style.display = "none";
  });

  // Cerrar si clic fuera del contenido
  window.addEventListener("click", function (e) {
    if (e.target === loginModal) loginModal.style.display = "none";
  });
});
