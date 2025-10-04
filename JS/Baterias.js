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

  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");
  let matches = [];
  let currentIndex = -1;

  searchForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const keyword = searchInput.value.trim();
    if (!keyword) return;

    // Si el término de búsqueda cambió, resetea coincidencias
    if (searchInput.dataset.lastKeyword !== keyword) {
      removeHighlights();
      matches = highlightMatches(document.body, keyword);
      currentIndex = -1;
      searchInput.dataset.lastKeyword = keyword;
    }

    if (matches.length > 0) {
      currentIndex = (currentIndex + 1) % matches.length;
      matches[currentIndex].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      // Agrega una clase visible para la coincidencia actual
      matches.forEach((m, i) => {
        m.style.backgroundColor = i === currentIndex ? "#ffff00" : "#ffea00";
      });
    } else {
      alert("No se encontraron coincidencias.");
    }
  });

  // Resalta todas las coincidencias de la palabra clave
  function highlightMatches(container, keyword) {
    const regex = new RegExp(`(${keyword})`, "gi");
    const matches = [];

    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const parentTag = node.parentNode.tagName;
          if (["SCRIPT", "STYLE", "NOSCRIPT", "IFRAME", "INPUT", "TEXTAREA"].includes(parentTag)) {
            return NodeFilter.FILTER_REJECT;
          }
          if (node.textContent.match(regex)) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        },
      }
    );

    const textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    textNodes.forEach((node) => {
      const span = document.createElement("span");
      span.innerHTML = node.textContent.replace(regex, '<mark class="highlight">$1</mark>');
      const frag = document.createDocumentFragment();
      while (span.firstChild) frag.appendChild(span.firstChild);
      node.parentNode.replaceChild(frag, node);
    });

    document.querySelectorAll("mark.highlight").forEach((el) => matches.push(el));
    return matches;
  }

  // Elimina los resaltados de coincidencias
  function removeHighlights() {
    document.querySelectorAll("mark.highlight").forEach((mark) => {
      const textNode = document.createTextNode(mark.textContent);
      mark.replaceWith(textNode);
    });
  }

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