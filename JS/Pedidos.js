document.addEventListener("DOMContentLoaded", async function () {
  const token = sessionStorage.getItem("jwt_token");
  const isLoggedIn = !!token;

  const estadoColorMap = {
    Pendiente: "warning",
    Completado: "success",
    Cancelado: "danger",
    "En proceso": "info",
    Enviado: "primary",
    Entregado: "success",
  };
  const getEstadoColor = (estado) => estadoColorMap[estado] || "secondary";

  const mostrarMensajePedidos = (html) => {
    const tabla = document.getElementById("tablaPedidos");
    if (tabla) tabla.innerHTML = html;
  };

  // --- Obtener datos del usuario ---
  async function mostrarNombreUsuario() {
    if (!isLoggedIn) return null;
    try {
      const res = await fetch("http://localhost:3000/api/perfil_usuario", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.warn(`⚠️ Perfil usuario NO OK (${res.status})`);
        return null;
      }

      const userData = await res.json();
      const navbar = document.querySelector(".navbar-collapse");
      if (navbar && !document.querySelector(".bienvenido-usuario")) {
        const userDiv = document.createElement("div");
        userDiv.className = "ms-auto bienvenido-usuario";
        userDiv.innerHTML = `<span class="bienvenido-texto">Bienvenido, ${userData.nombre_usuario || "usuario"}</span>`;
        navbar.appendChild(userDiv);
      }
      return userData;
    } catch (err) {
      console.error("❌ Error al obtener perfil usuario:", err);
      return null;
    }
  }

  // --- Cargar todos los pedidos (vista de administrador) ---
  async function cargarPedidos(usuario) {
    if (!isLoggedIn) {
      mostrarMensajePedidos(
        `<tr><td colspan="5" class="text-center text-warning">Debe iniciar sesión</td></tr>`
      );
      return;
    }

    mostrarMensajePedidos(
      `<tr><td colspan="5" class="text-center">Cargando todos los pedidos...</td></tr>`
    );

    try {
      // Usar el nuevo endpoint de administrador
      const endpoint = "http://localhost:3000/api/admin/pedidos";
      console.log("📡 Admin solicitando todos los pedidos:", endpoint);

      const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const text = await res.text();
        console.error(`⚠️ Error al obtener todos los pedidos (${res.status}):`, text);
        mostrarMensajePedidos(
          `<tr><td colspan="5" class="text-center text-danger">Error ${res.status}: ${text}</td></tr>`
        );
        return;
      }

      const pedidos = await res.json();
      console.log(`✅ Pedidos recibidos para admin: ${pedidos.length}`);
      
      const tabla = document.getElementById("tablaPedidos");
      if (!pedidos || pedidos.length === 0) {
        tabla.innerHTML = `<tr><td colspan="5" class="text-center">No hay pedidos en el sistema</td></tr>`;
        return;
      }

      // Formato con separación de Detalles y Acciones: Fecha, Estado, Total, Detalles, Acciones
      tabla.innerHTML = pedidos
        .map((pedido) => {
          const fecha = pedido.fecha_pedido ? new Date(pedido.fecha_pedido).toLocaleDateString() : "—";
          const estado = pedido.estado_pedido || "—";
          const total = pedido.precio_total ? `$${pedido.precio_total.toLocaleString()}` : "$0";
          const id = pedido.id_pedido || 0;
          
          // Crear dropdown para cambiar estado
          const estadosDisponibles = ['Pendiente', 'Completado', 'Cancelado'];
          const opcionesEstado = estadosDisponibles
            .filter(est => est !== estado) // Excluir el estado actual
            .map(est => `<option value="${est}">${est}</option>`)
            .join('');
          
          return `<tr>
            <td>${fecha}</td>
            <td><span class="badge bg-${getEstadoColor(estado)}">${estado}</span></td>
            <td>${total}</td>
            <td><button class="btn btn-sm btn-primary" onclick="verDetallesPedido(${id})">Ver detalles</button></td>
            <td>
              <select class="form-select form-select-sm" onchange="cambiarEstadoPedido(${id}, this.value)" style="min-width: 120px;">
                <option value="">Cambiar estado...</option>
                ${opcionesEstado}
              </select>
            </td>
          </tr>`;
        })
        .join("");
    } catch (err) {
      console.error("❌ Error fetch todos los pedidos:", err);
      mostrarMensajePedidos(
        `<tr><td colspan="5" class="text-center text-danger">Error de red al cargar todos los pedidos. Revisa la consola.</td></tr>`
      );
    }
  }

  // --- Ver detalles de un pedido (versión admin sin restricciones) ---
  window.verDetallesPedido = async function (idPedido) {
    try {
      console.log(`📡 Admin solicitando detalles del pedido ${idPedido}...`);
      
      // Usar el nuevo endpoint de admin que no tiene restricciones de usuario
      const res = await fetch(`http://localhost:3000/api/admin/pedidos/${idPedido}/detalles`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(`⚠️ Error detalles pedido admin (${res.status}):`, text);
        
        // Intentar parsear como JSON para obtener mensaje específico
        try {
          const errorData = JSON.parse(text);
          alert(`Error: ${errorData.mensaje || 'No se pudieron obtener los detalles'}`);
        } catch (e) {
          alert(`Error ${res.status}: No se pudieron obtener los detalles del pedido`);
        }
        return;
      }

      const detalles = await res.json();
      console.log(`✅ Detalles recibidos para pedido ${idPedido}:`, detalles.length);
      
      const tabla = document.getElementById("detallesPedidoTabla");
      if (!tabla) {
        console.error("❌ No se encontró la tabla detallesPedidoTabla");
        alert("Error: No se encontró la tabla de detalles");
        return;
      }

      if (detalles.length === 0) {
        tabla.innerHTML = `<tr><td colspan="6" class="text-center">No hay detalles para este pedido</td></tr>`;
      } else {
        tabla.innerHTML = detalles
          .map((d) => {
            const pedidoId = d.Pedido_id_pedido || "—";
            const articuloId = d.Artículo_id_artículo || "—";
            const cantidad = d.cantidad_pedido || 0;
            const precioUnitario = Number(d.precio_unitario) || 0;
            const nombreArticulo = d.nombre_artículo || "Sin nombre";
            const subtotal = cantidad * precioUnitario;

            return `<tr>
              <td>${pedidoId}</td>
              <td>${articuloId}</td>
              <td>${nombreArticulo}</td>
              <td>${cantidad}</td>
              <td>$${precioUnitario.toLocaleString()}</td>
              <td>$${subtotal.toLocaleString()}</td>
            </tr>`;
          })
          .join("");
      }

      const modalEl = document.getElementById("detallesPedidoModal");
      if (modalEl) {
        new bootstrap.Modal(modalEl).show();
      } else {
        console.error("❌ No se encontró el modal detallesPedidoModal");
        alert("Error: No se encontró el modal de detalles");
      }
    } catch (err) {
      console.error("❌ Error fetch detalles pedido admin:", err);
      alert("Error de conexión al cargar detalles. Revisa la consola.");
    }
  };

  // --- Inicializar ---
  const usuario = await mostrarNombreUsuario();
  if (isLoggedIn) await cargarPedidos(usuario);

  // --- Bloquear acceso a formulario si no hay sesión ---
  document.querySelectorAll('a[href="Formulario.html"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      if (!isLoggedIn) {
        e.preventDefault();
        alert("Debes iniciar sesión.");
      }
    });
  });
});

// --- Función para cambiar estado de pedido ---
window.cambiarEstadoPedido = async function(idPedido, nuevoEstado) {
  // Validar que se haya seleccionado un estado
  if (!nuevoEstado || nuevoEstado === '') {
    return;
  }

  if (!confirm(`¿Cambiar el estado del pedido a "${nuevoEstado}"?`)) {
    // Resetear el dropdown si el usuario cancela
    const select = event.target;
    select.value = '';
    return;
  }

  const token = sessionStorage.getItem("jwt_token");
  try {
    console.log(`✏️ Cambiando estado del pedido ${idPedido} a ${nuevoEstado}...`);
    
    const res = await fetch(`http://localhost:3000/api/admin/pedidos/${idPedido}/estado`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ estado_pedido: nuevoEstado })
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
