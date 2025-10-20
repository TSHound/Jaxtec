document.addEventListener("DOMContentLoaded", async function () {
  // Obtener token JWT una sola vez para toda la página
  const token = sessionStorage.getItem("jwt_token");
  const isLoggedIn = !!token;

  // --- Mostrar el nombre del usuario en la barra de navegación ---
  async function mostrarNombreUsuario() {
    if (!isLoggedIn) return;

    try {
      const res = await fetch("http://localhost:3000/api/perfil_usuario", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const userData = await res.json();
        const navbar = document.querySelector(".navbar-collapse");
        
        if (navbar) {
          const userDiv = document.createElement("div");
          userDiv.className = "ms-auto bienvenido-usuario";
          
          const welcomeText = document.createElement("span");
          welcomeText.className = "bienvenido-texto";
          welcomeText.textContent = `Bienvenido, ${userData.nombre_usuario || 'usuario'}`;
          
          userDiv.appendChild(welcomeText);
          navbar.appendChild(userDiv);
        }
      }
    } catch (e) {
      console.warn("Error al obtener información del usuario:", e);
    }
  }
  await mostrarNombreUsuario();

  // --- Efecto de escritura ---
  const texto =
    "JAXTEC es una empresa dedicada a la movilidad eléctrica, innovación tecnológica y sostenibilidad urbana. Nuestro objetivo es liderar el futuro del transporte inteligente, ofreciendo soluciones eficientes y respetuosas con el medio ambiente. Este sitio refleja nuestra misión, visión y compromiso con un mundo más verde y conectado.";
  const target = document.getElementById("typewriter");
  let index = 0;

  function escribir() {
    if (index < texto.length) {
      target.innerHTML += texto.charAt(index);
      index++;
      setTimeout(escribir, 10);
    }
  }
  escribir();

  // --- Acceso al formulario de cotización ---
  const formularioLinks = document.querySelectorAll('a[href="Formulario.html"]');
  formularioLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      if (!isLoggedIn) {
        e.preventDefault();
        alert("Atención: Debes iniciar sesión.");
      }
    });
  });

  // --- Cargar y mostrar cotizaciones del usuario logueado ---
  if (!isLoggedIn) return;

  const tbody = document.getElementById("cotizacionesBody");
  const estadoColorMap = {
    Pendiente: "warning",
    Completado: "success",
    Cancelado: "danger",
  };
  const getEstadoColor = (estado) => estadoColorMap[estado] || "secondary";

  async function cargarMisCotizaciones() {
    tbody.innerHTML =
      '<tr><td colspan="12" class="text-center">Cargando tus cotizaciones...</td></tr>';

    try {
      const res = await fetch("http://localhost:3000/api/mis-cotizaciones", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text();
        tbody.innerHTML = `<tr><td colspan="12" class="text-center text-danger">Error ${res.status}: ${text}</td></tr>`;
        return;
      }

      const cotizaciones = await res.json();

      if (!cotizaciones.length) {
        tbody.innerHTML =
          '<tr><td colspan="12" class="text-center text-warning">No tienes cotizaciones registradas.</td></tr>';
        return;
      }

      tbody.innerHTML = "";
      cotizaciones.forEach(cot => {
        const tr = document.createElement("tr");
        const fecha = cot.fecha_cotización ? new Date(cot.fecha_cotización).toLocaleDateString('es-ES') : '-';
        const estadoCotizacion = cot.estado_cotización || 'Pendiente';

        tr.innerHTML = `
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
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      tbody.innerHTML =
        '<tr><td colspan="12" class="text-center text-danger">Error de red al cargar tus cotizaciones.</td></tr>';
      console.error("Error al cargar mis cotizaciones:", err);
    }
  }

  cargarMisCotizaciones();
});
