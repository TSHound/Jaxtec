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

  const isLoggedIn = false; // Cambia a true si el usuario está logueado

  const formularioLink = document.getElementById("formularioLink");
  const modal = document.getElementById("loginModal");
  const closeModalBtn = document.getElementById("closeModalBtn");

  formularioLink.addEventListener("click", function (e) {
    if (!isLoggedIn) {
      e.preventDefault();
      modal.classList.add("modal-show");
    }
  });

  closeModalBtn.addEventListener("click", function () {
    modal.classList.remove("modal-show");
  });

  window.addEventListener("click", function (e) {
    if (e.target === modal) {
      modal.classList.remove("modal-show");
    }
  });
});