// Formulario.js - Lógica del formulario de pedidos de vehículo para JAXTEC
document.addEventListener("DOMContentLoaded", function () {
  const usuario = sessionStorage.getItem('usuario') || '';
  const usuarioInput = document.getElementById('usuario_logueado');
  if (usuarioInput) usuarioInput.value = usuario;

  const pedidoForm = document.getElementById("pedidoForm");
  const formMsg = document.getElementById("formMsg");

  // Obtener token guardado en sessionStorage
  const token = sessionStorage.getItem("jwt_token"); 

  // Bloquear el formulario si no hay token
  if (!token) {
    showMessage(formMsg, "Debes iniciar sesión para hacer un pedido.", "red");
    pedidoForm.querySelector("button[type='submit']").disabled = true;
  }

  pedidoForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    hideMessages();

    const id_usuario = sessionStorage.getItem('id_usuario');
    const nombre_usuario = sessionStorage.getItem('usuario') || '';
    const data = {
      Usuario_id_usuario: id_usuario,
      nombre_usuario: nombre_usuario,
      placa_vehículo: document.getElementById("placa_vehiculo").value.trim(),
      modelo_vehículo: document.getElementById("modelo_vehiculo").value.trim(),
      año_vehículo: document.getElementById("año_vehiculo").value.trim(),
      tipo_combustible: document.getElementById("tipo_combustible").value.trim(),
      estado_vehículo: document.getElementById("estado_vehiculo").value.trim(),
      kilometraje_vehículo: document.getElementById("kilometraje").value.trim(),
      ubicación_vehículo: document.getElementById("ubicacion").value.trim(),
      fecha_cotización: document.getElementById("fecha_solicitud").value.trim(),
      estado_cotización: "Pendiente",
      comentarios_cotización: document.getElementById("comentarios_adicionales").value.trim()
    };

    for (const key in data) {
      if (key !== "comentarios_adicionales" && !data[key]) {
        showMessage(formMsg, "Por favor, completa todos los campos obligatorios.");
        return;
      }
    }

    try {
      const response = await fetch("http://localhost:3000/api/registrar_cotizacion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // <-- Token agregado
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        showMessage(formMsg, "¡Pedido enviado correctamente!", "green");
        pedidoForm.reset();
        if (usuarioInput) usuarioInput.value = usuario;
        document.getElementById("fecha_solicitud").valueAsDate = new Date();
      } else {
        let errorMsg = "Error al enviar el pedido.";
        try {
          const errorData = await response.json();
          errorMsg = errorData.mensaje || errorMsg;
        } catch (e) {
          errorMsg = await response.text() || errorMsg;
        }
        showMessage(formMsg, errorMsg, "red");
      }
    } catch (error) {
      showMessage(formMsg, "Error de conexión con el servidor.");
      console.error("Error en fetch:", error);
    }
  });

  function hideMessages() {
    formMsg.textContent = "";
    formMsg.style.display = "none";
  }

  function showMessage(element, message, color = "red") {
    element.textContent = message;
    element.style.color = color;
    element.style.visibility = "visible";
    element.style.height = "auto";
    element.style.display = "block";
  }

  document.getElementById("fecha_solicitud").valueAsDate = new Date();

  // --- Pedidos del usuario con token ---
  document.getElementById('btnEliminarPedidos').addEventListener('click', async function() {
    const misPedidosDiv = document.getElementById('misPedidos');
    const listaPedidosDiv = document.getElementById('listaPedidos');
    misPedidosDiv.style.display = 'block';
    listaPedidosDiv.innerHTML = 'Cargando...';

    const usuario = sessionStorage.getItem('usuario') || '';

    try {
      const response = await fetch(`http://localhost:3000/api/pedidos?usuario=${encodeURIComponent(usuario)}`, {
        headers: { "Authorization": `Bearer ${token}` } // <-- Token agregado
      });
      const pedidos = await response.json();

      if (pedidos.length === 0) {
        listaPedidosDiv.innerHTML = '<em>No tienes pedidos registrados.</em>';
        return;
      }

      listaPedidosDiv.innerHTML = pedidos.map(pedido => `
        <div class="card mb-2">
          <div class="card-body">
            <strong>Placa:</strong> ${pedido.placa_vehiculo} |
            <strong>Modelo:</strong> ${pedido.modelo_vehiculo} |
            <strong>Fecha:</strong> ${pedido.fecha_solicitud}
            <button class="btn btn-sm btn-danger float-end" onclick="eliminarPedido('${pedido.id_pedido}')">Eliminar</button>
          </div>
        </div>
      `).join('');
    } catch (err) {
      listaPedidosDiv.innerHTML = '<span style="color:red;">Error al cargar pedidos.</span>';
      console.error("[EliminarPedidos] Error al cargar pedidos:", err);
    }
  });

  // Función global para eliminar un pedido específico
  window.eliminarPedido = async function(id_pedido) {
    if (!confirm('¿Seguro que deseas eliminar este pedido?')) return;
    try {
      const response = await fetch(`http://localhost:3000/api/pedido/${id_pedido}`, { 
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${token}` } // <-- Token agregado
      });
      if (response.ok) {
        alert('Pedido eliminado');
        document.getElementById('btnEliminarPedidos').click();
      } else {
        alert('No se pudo eliminar el pedido');
      }
    } catch (err) {
      alert('Error de conexión');
      console.error("[EliminarPedidos] Error al eliminar pedido:", err);
    }
  };

  const btnEliminar = document.getElementById("btnEliminarPedidos");
  const misPedidos = document.getElementById("misPedidos");
  if (btnEliminar && misPedidos) {
    btnEliminar.addEventListener("click", function () {
      misPedidos.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }
});