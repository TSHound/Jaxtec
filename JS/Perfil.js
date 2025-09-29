document.addEventListener("DOMContentLoaded", function () {
  const texto =
    "JAXTEC es una empresa dedicada a la movilidad eléctrica, innovación tecnológica y sostenibilidad urbana. Nuestro objetivo es liderar el futuro del transporte inteligente, ofreciendo soluciones eficientes y respetuosas con el medio ambiente. Este sitio refleja nuestra misión, visión y compromiso con un mundo más verde y conectado.";
  const target = document.getElementById("typewriter");
  let index = 0;

  function escribir() {
    if (index < texto.length) {
      target.innerHTML += texto.charAt(index);
      index++;
      setTimeout(escribir, 10); // velocidad rápida
    }
  }

  escribir();
});

(function () {
  function estaLogueado() {
    return (
      localStorage.getItem('isLoggedIn') === 'true' ||
      sessionStorage.getItem('isLoggedIn') === 'true' ||
      localStorage.getItem('loggedIn') === 'true' ||
      sessionStorage.getItem('loggedIn') === 'true' ||
      localStorage.getItem('usuarioLogueado') === 'true' ||
      sessionStorage.getItem('usuarioLogueado') === 'true'
    );
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Hay dos enlaces a LogIn.html (Formulario y Log In). Solo interceptamos el que dice "Formulario".
    const navLinks = Array.from(document.querySelectorAll('a.nav-link'));
    const formularioLinks = navLinks.filter(
      (a) => a.textContent.trim().toLowerCase() === 'formulario'
    );

    formularioLinks.forEach((link) => {
      link.addEventListener('click', function (e) {
        if (!estaLogueado()) {
          e.preventDefault();
          const modalEl = document.getElementById('mustLoginModal');
          if (modalEl) {
            const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
            modal.show();
          } else {
            // Respaldo por si el modal no se carga
            alert('Debes iniciar sesión para acceder al formulario.');
          }
        }
        // Si sí está logueado, se permitirá la navegación normal del enlace.
      });
    });
  });
})();
