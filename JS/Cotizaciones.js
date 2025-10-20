document.addEventListener("DOMContentLoaded", async function () {
  const token = sessionStorage.getItem("jwt_token");
  const isLoggedIn = !!token;

  // Mapeo de colores para estados de cotización
  const estadoColorMap = {
    Pendiente: "warning",
    Completado: "success",
    Cancelado: "danger",
  };
  const getEstadoColor = (estado) => estadoColorMap[estado] || "secondary";

  let usuarioData = null;

  // --- Mostrar el nombre del usuario en la barra de navegación ---
  async function mostrarNombreUsuario() {
    if (!isLoggedIn) return;

    try {
      const res = await fetch("http://localhost:3000/api/perfil_usuario", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Perfil usuario status:", res.status);

      if (res.ok) {
        usuarioData = await res.json();
        console.log("Datos de usuario recibidos:", usuarioData);

        const navbar = document.querySelector(".navbar-collapse");

        if (navbar) {
          // Verificar si ya existe para evitar duplicados
          const existingWelcome = document.querySelector(".bienvenido-usuario");
          if (existingWelcome) return;
          
          const userDiv = document.createElement("div");
          userDiv.className = "ms-auto bienvenido-usuario";
          const welcomeText = document.createElement("span");
          welcomeText.className = "bienvenido-texto";
          welcomeText.textContent = `Bienvenido, ${usuarioData.nombre_usuario || "usuario"}`;
          userDiv.appendChild(welcomeText);
          navbar.appendChild(userDiv);
        }
      } else {
        const text = await res.text();
        console.warn("No se pudo obtener información del usuario:", res.status, text);
      }
    } catch (e) {
      console.error("Error al obtener información del usuario:", e);
    }
  }

  await mostrarNombreUsuario();

  const tbody = document.getElementById("cotizacionesBody");
  const searchInput = document.getElementById("searchInput");
  let cotización = [];

  function renderCotizaciones(list) {
    tbody.innerHTML = "";
    if (!list || list.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="12" class="text-center text-warning">No se encontraron cotizaciones.</td></tr>';
      return;
    }

    list.forEach((cot) => {
      const tr = document.createElement("tr");
      // Usar los nombres exactos de los campos de la tabla cotización
      const fecha = cot.fecha_cotización ? new Date(cot.fecha_cotización).toLocaleDateString('es-ES') : '-';
      const estadoCotizacion = cot.estado_cotización || 'Pendiente';
      
      // Crear dropdown para cambiar estado
      const estadosDisponibles = ['Pendiente', 'Completado', 'Cancelado'];
      const opcionesEstado = estadosDisponibles
        .filter(est => est !== estadoCotizacion) // Excluir el estado actual
        .map(est => `<option value="${est}">${est}</option>`)
        .join('');
      
      tr.innerHTML = `
        <td>${cot.nombre_usuario || "-"}</td>
        <td>${cot.placa_vehículo || "-"}</td>
        <td>${cot.modelo_vehículo || "-"}</td>
        <td>${cot.año_vehículo || "-"}</td>
        <td>${cot.tipo_combustible || "-"}</td>
        <td>${cot.estado_vehículo || "-"}</td>
        <td>${cot.kilometraje_vehículo || "-"}</td>
        <td>${cot.ubicación_vehículo || "-"}</td>
        <td>${fecha}</td>
        <td>${cot.comentarios_cotización || "-"}</td>
        <td><span class="badge bg-${getEstadoColor(estadoCotizacion)}">${estadoCotizacion}</span></td>
        <td>
          <select class="form-select form-select-sm" onchange="cambiarEstadoCotizacion(${cot.id_cotización}, this.value)" style="min-width: 120px;">
            <option value="">Cambiar estado...</option>
            ${opcionesEstado}
          </select>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.toLowerCase();
      const filtered = cotización.filter(
        (c) =>
          // Actualizar para usar los nombres correctos de los campos
          (c.nombre_usuario && c.nombre_usuario.toLowerCase().includes(query)) ||
          (c.placa_vehículo && c.placa_vehículo.toLowerCase().includes(query)) ||
          (c.modelo_vehículo && c.modelo_vehículo.toLowerCase().includes(query))
      );
      renderCotizaciones(filtered);
    });
  }

  // --- Event listener removido - Ya no se necesita eliminar cotizaciones ---

  // --- Cargar TODAS las cotizaciones (vista admin) ---
  async function cargarCotizaciones() {
    if (!isLoggedIn) {
      tbody.innerHTML =
        '<tr><td colspan="12" class="text-center text-warning">Debe iniciar sesión.</td></tr>';
      return;
    }

    tbody.innerHTML =
      '<tr><td colspan="12" class="text-center">Cargando todas las cotizaciones...</td></tr>';

    try {
      // SIEMPRE usar el endpoint de admin que devuelve TODAS las cotizaciones
      const ruta = "http://localhost:3000/api/cotizaciones-todas";
      console.log("📡 Admin: Cargando todas las cotizaciones desde:", ruta);

      const res = await fetch(ruta, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Fetch cotizaciones status:", res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error al obtener cotizaciones:", res.status, errorText);
        tbody.innerHTML = `<tr><td colspan="12" class="text-center text-danger">Error ${res.status}: ${errorText}</td></tr>`;
        return;
      }

      cotización = await res.json();
      console.log(`✅ Admin: ${cotización.length} cotizaciones recibidas en total`);
      renderCotizaciones(cotización);
    } catch (err) {
      console.error("❌ Error fetch cotizaciones:", err);
      tbody.innerHTML =
        '<tr><td colspan="12" class="text-center text-danger">Error de red al cargar cotizaciones.</td></tr>';
    }
  }

  cargarCotizaciones();
});

// --- Función para cambiar estado de cotización ---
window.cambiarEstadoCotizacion = async function(idCotizacion, nuevoEstado) {
  // Validar que se haya seleccionado un estado
  if (!nuevoEstado || nuevoEstado === '') {
    return;
  }

  if (!confirm(`¿Cambiar el estado de la cotización a "${nuevoEstado}"?`)) {
    // Resetear el dropdown si el usuario cancela
    const select = event.target;
    select.value = '';
    return;
  }

  const token = sessionStorage.getItem("jwt_token");
  try {
    console.log(`✏️ Cambiando estado de la cotización ${idCotizacion} a ${nuevoEstado}...`);
    
    const res = await fetch(`http://localhost:3000/api/admin/cotizaciones/${idCotizacion}/estado`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ estado_cotización: nuevoEstado })
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`❌ Error al cambiar estado (${res.status}):`, text);
      alert(`Error al cambiar estado: ${res.status}`);
      // Resetear el dropdown en caso de error
      const select = event.target;
      select.value = '';
      return;
    }

    const result = await res.json();
    console.log('✅ Estado cambiado:', result);
    alert(`Estado cambiado a "${nuevoEstado}" exitosamente`);
    
    // Recargar la tabla para mostrar los cambios
    window.location.reload();
    
  } catch (err) {
    console.error('❌ Error al cambiar estado:', err);
    alert('Error de conexión al cambiar estado');
    // Resetear el dropdown en caso de error
    if (event && event.target) {
      event.target.value = '';
    }
  }
};
