document.addEventListener("DOMContentLoaded", function () {
  // Obtener token JWT una sola vez para toda la página
  const token = sessionStorage.getItem("jwt_token");
  const isLoggedIn = !!token;

  // --- Mostrar el nombre del usuario en la barra de navegación ---
  async function mostrarNombreUsuario() {
    // Si no está logueado, no hacemos nada
    if (!isLoggedIn) return;

    try {
      const res = await fetch("http://localhost:3000/api/perfil_usuario", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const userData = await res.json();
        const navbar = document.querySelector(".navbar-collapse");
        
        if (navbar) {
          // Crear el elemento para el mensaje de bienvenida
          const userDiv = document.createElement("div");
          userDiv.className = "ms-auto bienvenido-usuario";
          
          // Crear el texto con formato (usando las clases CSS)
          const welcomeText = document.createElement("span");
          welcomeText.className = "bienvenido-texto"; // Usa la clase definida en Baterias.css
          welcomeText.textContent = `Bienvenido, ${userData.nombre_usuario || 'usuario'}`;
          
          // Añadir el texto al div
          userDiv.appendChild(welcomeText);
          
          // Añadir el div a la navbar
          navbar.appendChild(userDiv);
        }
      }
    } catch (e) {
      console.warn("Error al obtener información del usuario:", e);
    }
  }
  mostrarNombreUsuario();
  
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

  // Configurar acceso al formulario de cotización (como en otras páginas)
  const formularioLinks = document.querySelectorAll('a[href="Formulario.html"]');
  formularioLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      if (!isLoggedIn) {
        e.preventDefault();
        alert("Atención: Debes iniciar sesión.");
      }
      // Si está logueado, se permite ir al formulario normalmente
    });
  });
});