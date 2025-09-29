document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("customModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const formularioLink = document.getElementById("formularioLink");
  let usuarioLogueado = false; // Cambia a true si el usuario está logueado

  formularioLink.addEventListener("click", function (e) {
    if (!usuarioLogueado) {
      e.preventDefault();
      modal.style.display = "block";
    } else {
      window.location.href = "Formulario.html";
    }
  });

  closeModalBtn.addEventListener("click", function () {
    modal.style.display = "none";
  });

  window.onclick = function (e) {
    if (e.target == modal) {
      modal.style.display = "none";
    }
  };

  document.querySelector(".btn-logout").addEventListener("click", () => {
    alert("Sesión cerrada. Redirigiendo a página de inicio de sesión...");
    window.location.href = "LogIn.html";
  });
});
