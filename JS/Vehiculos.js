document.addEventListener("DOMContentLoaded", function () {
  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");
  let matches = [];
  let currentIndex = -1;

  searchForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const keyword = searchInput.value.trim();
    if (!keyword) return;

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
          return node.textContent.match(regex)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_SKIP;
        },
      }
    );

    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    textNodes.forEach((node) => {
      const span = document.createElement("span");
      span.innerHTML = node.textContent.replace(
        regex,
        '<mark class="highlight">$1</mark>'
      );
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

  // Lógica movida desde el <script> interno de Vehiculos.html
  // Mostrar modal solo cuando se clickea "Formulario"
  document.getElementById("openModalBtn")?.addEventListener("click", function (e) {
    e.preventDefault(); // evita que navegue
    const warningModal = new bootstrap.Modal(
      document.getElementById("warningModal")
    );
    warningModal.show();
  });
});