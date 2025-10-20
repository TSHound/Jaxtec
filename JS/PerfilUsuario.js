document.addEventListener("DOMContentLoaded", function () {
  const token = sessionStorage.getItem("jwt_token");
  const isLoggedIn = !!token;

  // --- Mostrar el nombre del usuario en la navbar ---
  async function mostrarNombreUsuario() {
    if (!isLoggedIn) return;
    try {
      const res = await fetch("http://localhost:3000/api/perfil_usuario", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al obtener usuario");
      const userData = await res.json();

      const navbar = document.querySelector(".navbar-collapse");
      if (navbar && !document.querySelector(".bienvenido-usuario")) {
        const userDiv = document.createElement("div");
        userDiv.className = "ms-auto bienvenido-usuario";
        const welcomeText = document.createElement("span");
        welcomeText.className = "bienvenido-texto";
        welcomeText.textContent = `Bienvenido, ${userData.nombre_usuario || 'usuario'}`;
        userDiv.appendChild(welcomeText);
        navbar.appendChild(userDiv);
      }
    } catch (e) {
      console.warn("Error al obtener información del usuario:", e);
    }
  }
  mostrarNombreUsuario();

  // --- Cargar datos del usuario ---
  async function cargarPerfilUsuario() {
    if (!isLoggedIn) return;
    try {
      const res = await fetch("http://localhost:3000/api/perfil_usuario", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No se pudo obtener el perfil");
      const usuario = await res.json();

      const infoDiv = document.getElementById("infoUsuarioPerfil");
      if (infoDiv) {
        infoDiv.innerHTML = `
          <h4>Datos del usuario</h4>
          <p><strong>Nombre:</strong> ${usuario.nombre_usuario}</p>
          <p><strong>Correo:</strong> ${usuario.correo_usuario}</p>
          <p><strong>Teléfono:</strong> ${usuario.teléfono_usuario}</p>
          <p><strong>Dirección:</strong> ${usuario.dirección_usuario}</p>
        `;
      }
    } catch (e) {
      const infoDiv = document.getElementById("infoUsuarioPerfil");
      if (infoDiv) infoDiv.innerHTML = '<div class="alert alert-danger">Error al cargar datos de usuario.</div>';
    }
  }
  cargarPerfilUsuario();

  // --- Función para obtener color de estado ---
  function getEstadoColor(estado) {
    const colores = { 'Pendiente': 'warning', 'Completado': 'success', 'Cancelado': 'danger' };
    return colores[estado] || 'secondary';
  }

  // --- Cargar pedidos del usuario ---
  async function cargarPedidosUsuario() {
    if (!isLoggedIn) return;
    try {
      const res = await fetch("http://localhost:3000/api/pedidos_usuario", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No se pudo obtener los pedidos");
      const pedidos = await res.json();

      const tablaPedidos = document.getElementById("tablaPedidos");
      if (!tablaPedidos) return;

      if (pedidos.length === 0) {
        tablaPedidos.innerHTML = `<tr><td colspan="4" class="text-center">No tienes pedidos realizados</td></tr>`;
        return;
      }

      tablaPedidos.innerHTML = pedidos.map(pedido => `
        <tr>
          <td>${new Date(pedido.fecha_pedido).toLocaleDateString()}</td>
          <td><span class="badge bg-${getEstadoColor(pedido.estado_pedido)}">${pedido.estado_pedido}</span></td>
          <td>$${pedido.precio_total.toLocaleString()}</td>
          <td><button class="btn btn-sm btn-primary" onclick="verDetallesPedido(${pedido.id_pedido})">Ver detalles</button></td>
        </tr>
      `).join('');
    } catch (e) {
      const tablaPedidos = document.getElementById("tablaPedidos");
      if (tablaPedidos) tablaPedidos.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error al cargar los pedidos</td></tr>`;
    }
  }
  cargarPedidosUsuario();

  // --- Ver detalles de un pedido ---
  window.verDetallesPedido = async function(idPedido) {
    try {
      const res = await fetch(`http://localhost:3000/api/pedidos/${idPedido}/detalles`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.mensaje || 'Error al obtener los detalles del pedido');
        return;
      }

      const detallesTabla = document.getElementById('detallesPedidoTabla');
      if (detallesTabla) {
        detallesTabla.innerHTML = data.map(detalle => `
          <tr>
            <td>${detalle.nombre_artículo}</td>
            <td>${detalle.cantidad_pedido}</td>
            <td>$${detalle.precio_unitario.toLocaleString()}</td>
            <td>$${(detalle.cantidad_pedido * detalle.precio_unitario).toLocaleString()}</td>
          </tr>
        `).join('');
      }

      const modal = new bootstrap.Modal(document.getElementById('detallesPedidoModal'));
      modal.show();
    } catch (e) {
      alert('Error al cargar los detalles del pedido');
    }
  };

  // --- Cotizaciones del usuario con token ---
  const btnMisCotizaciones = document.getElementById('btnMisCotizaciones');
  if (btnMisCotizaciones) {
    btnMisCotizaciones.addEventListener('click', async function() {
      const misCotizacionesDiv = document.getElementById('misCotizaciones');  
      const listaCotizacionesDiv = document.getElementById('listaCotizaciones');
      
      // Mostrar la sección y hacer scroll hacia ella
      misCotizacionesDiv.style.display = 'block';
      misCotizacionesDiv.scrollIntoView({ behavior: "smooth", block: "center" });
      
      listaCotizacionesDiv.innerHTML = 'Cargando...';

      try {
        // Usar el endpoint correcto para cotizaciones del usuario logueado
        const response = await fetch(`http://localhost:3000/api/cotizacion`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const cotizaciones = await response.json();

        if (cotizaciones.length === 0) {
          listaCotizacionesDiv.innerHTML = '<em>No tienes cotizaciones registradas.</em>';
          return;
        }

        listaCotizacionesDiv.innerHTML = cotizaciones.map(cotizacion => {
          // Formatear fecha si existe
          let fechaFormateada = cotizacion.fecha_cotización;
          if (fechaFormateada) {
            try {
              const fecha = new Date(fechaFormateada);
              fechaFormateada = fecha.toLocaleDateString('es-ES');
            } catch (e) {
              console.warn("Error al formatear fecha:", e);
            }
          }
          
          return `
          <div class="card mb-2">
            <div class="card-body">
              <strong>Placa:</strong> ${cotizacion.placa_vehículo || 'N/A'} |
              <strong>Modelo:</strong> ${cotizacion.modelo_vehículo || 'N/A'} |
              <strong>Fecha:</strong> ${fechaFormateada || 'N/A'}
            </div>
          </div>
        `;
        }).join('');
      } catch (err) {
        listaCotizacionesDiv.innerHTML = '<span style="color:red;">Error al cargar cotizaciones.</span>';
        console.error("[MisCotizaciones] Error al cargar cotizaciones:", err);
      }
    });
  }

 

  // Función global para eliminar una cotización específica
  window.eliminarCotizacion = async function(id_cotización) {
    if (!confirm('¿Seguro que deseas eliminar esta cotización?')) return;
    try {
      const response = await fetch(`http://localhost:3000/api/cotizacion/${id_cotización}`, { 
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        alert('Cotización eliminada correctamente');
        // Actualizar la lista de cotizaciones
        const btnMisCotizaciones = document.getElementById('btnMisCotizaciones');
        if (btnMisCotizaciones) btnMisCotizaciones.click();
      } else {
        const errorText = await response.text().catch(() => '');
        alert(`No se pudo eliminar la cotización: ${errorText || response.statusText}`);
      }
    } catch (err) {
      alert('Error de conexión al servidor');
      console.error("[MisCotizaciones] Error al eliminar cotización:", err);
    }
  };

  // --- Control de acceso al formulario ---
  const formularioLinks = document.querySelectorAll('a[href="Formulario.html"]');
  formularioLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      if (!isLoggedIn) {
        e.preventDefault();
        alert("Atención: Debes iniciar sesión.");
      }
    });
  });
});
