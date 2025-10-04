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

  document.querySelector(".btn-logout").addEventListener("click", () => {
    alert("Sesión cerrada. Redirigiendo a página de inicio de sesión...");
    window.location.href = "LogIn.html";
  });

  // Función para cargar los pedidos del usuario
  async function cargarPedidosUsuario() {
    try {
      const res = await fetch("http://localhost:3000/api/pedidos_usuario", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("No se pudo obtener los pedidos");
      const pedidos = await res.json();
      const tablaPedidos = document.getElementById("tablaPedidos");
      
      if (pedidos.length === 0) {
        tablaPedidos.innerHTML = `
          <tr>
            <td colspan="4" class="text-center">No tienes pedidos realizados</td>
          </tr>
        `;
        return;
      }

      tablaPedidos.innerHTML = pedidos.map(pedido => `
        <tr>
          <td>${new Date(pedido.fecha_pedido).toLocaleDateString()}</td>
          <td><span class="badge bg-${getEstadoColor(pedido.estado_pedido)}">${pedido.estado_pedido}</span></td>
          <td>$${pedido.precio_total.toLocaleString()}</td>
          <td>
            <button class="btn btn-sm btn-primary" onclick="verDetallesPedido(${pedido.id_pedido})">
              Ver detalles
            </button>
          </td>
        </tr>
      `).join('');
    } catch (e) {
      const tablaPedidos = document.getElementById("tablaPedidos");
      tablaPedidos.innerHTML = `
        <tr>
          <td colspan="4" class="text-center text-danger">Error al cargar los pedidos</td>
        </tr>
      `;
    }
  }

  // Función para obtener el color del estado del pedido
  function getEstadoColor(estado) {
    const colores = {
      'Pendiente': 'warning',
      'En proceso': 'info',
      'Enviado': 'primary',
      'Entregado': 'success',
      'Cancelado': 'danger'
    };
    return colores[estado] || 'secondary';
  }

  // Función para ver detalles del pedido
  window.verDetallesPedido = async function(idPedido) {
    try {
      console.log('Obteniendo detalles del pedido:', idPedido);
      const res = await fetch(`http://localhost:3000/api/pedidos/${idPedido}/detalles`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        console.error('Error al obtener detalles:', data);
        alert(data.mensaje || 'Error al obtener los detalles del pedido');
        return;
      }
      
      console.log('Detalles obtenidos:', data);
      
      const detallesTabla = document.getElementById('detallesPedidoTabla');
      detallesTabla.innerHTML = data.map(detalle => `
        <tr>
          <td>${detalle.nombre_artículo}</td>
          <td>${detalle.cantidad_pedido}</td>
          <td>$${detalle.precio_unitario.toLocaleString()}</td>
          <td>$${(detalle.cantidad_pedido * detalle.precio_unitario).toLocaleString()}</td>
        </tr>
      `).join('');
      
      // Mostrar el modal usando Bootstrap
      const modal = new bootstrap.Modal(document.getElementById('detallesPedidoModal'));
      modal.show();
    } catch (e) {
      alert('Error al cargar los detalles del pedido');
    }
  };

  // Mostrar datos del usuario en el div infoUsuarioPerfil
  (async function () {
    try {
      const res = await fetch("http://localhost:3000/api/perfil_usuario", {
        headers: { Authorization: `Bearer ${token}` }
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
      // Cargar los pedidos después de mostrar la información del usuario
      await cargarPedidosUsuario();
    } catch (e) {
      const infoDiv = document.getElementById("infoUsuarioPerfil");
      if (infoDiv) infoDiv.innerHTML = '<div class="alert alert-danger">Error al cargar datos de usuario.</div>';
    }
  })();

  // --- Mostrar datos del usuario logueado ---
  document.addEventListener("DOMContentLoaded", async function () {
    const token = sessionStorage.getItem("jwt_token");
    if (!token) return;
    try {
      const res = await fetch("http://localhost:3000/api/perfil_usuario", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("No se pudo obtener el perfil");
      const usuario = await res.json();
      // Muestra nombre, correo, teléfono y dirección en el HTML
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
  });

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