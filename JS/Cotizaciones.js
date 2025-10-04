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

  const tbody = document.getElementById("cotizacionesBody");
  const searchInput = document.getElementById("searchInput");

  function renderCotizaciones(list) {
    tbody.innerHTML = "";
    if (list.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="11" class="text-center text-warning">No se encontraron cotizaciones.</td></tr>';
      return;
    }
    list.forEach((cot) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${cot.usuario}</td>
        <td>${cot.placas}</td>
        <td>${cot.modelo}</td>
        <td>${cot.año}</td>
        <td>${cot.combustible}</td>
        <td>${cot.estado}</td>
        <td>${cot.kilometraje}</td>
        <td>${cot.ubicacion}</td>
        <td>${cot.fecha}</td>
        <td>${cot.comentarios || "-"}</td>
        <td><button class="btn-delete" data-user="${cot.usuario}" data-placas="${cot.placas}">Eliminar</button></td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Filtrado básico por usuario, placa o modelo
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    const filtered = cotizaciones.filter(
      (c) =>
        c.usuario.toLowerCase().includes(query) ||
        c.placas.toLowerCase().includes(query) ||
        c.modelo.toLowerCase().includes(query)
    );
    renderCotizaciones(filtered);
  });

  // Manejo de eliminar cotización (solo simulación)
  tbody.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-delete")) {
      const user = e.target.getAttribute("data-user");
      const placas = e.target.getAttribute("data-placas");
      if (confirm(`¿Eliminar cotización de ${user} con placas ${placas}?`)) {
        // Aquí eliminarías la cotización desde el backend o base de datos
        const index = cotizaciones.findIndex(
          (c) => c.usuario === user && c.placas === placas
        );
        if (index > -1) {
          cotizaciones.splice(index, 1);
          renderCotizaciones(cotizaciones);
        }
      }
    }
  });

  // Render inicial
  renderCotizaciones(cotizaciones);
});