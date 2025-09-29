document.addEventListener("DOMContentLoaded", function () {
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
});

// JS migrado desde el <script> interno de Inicio.html

document.addEventListener("DOMContentLoaded", () => {
  const formularioLink = document.getElementById("formularioLink");
  const modal = document.getElementById("loginAlertModal");
  const closeModalBtn = document.getElementById("closeModalBtn");

  formularioLink.addEventListener("click", (e) => {
    // Simula estado de sesión (true/false)
    // Por ejemplo, en tu app real, usa cookies, localStorage, session o llamada a backend
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

    if (!isLoggedIn) {
      e.preventDefault();
      modal.style.display = "flex";
    }
    // Si está logueado, se permite ir al formulario
  });

  closeModalBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Cerrar modal si clic fuera del contenido
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
});
