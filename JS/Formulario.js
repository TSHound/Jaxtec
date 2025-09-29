// Formulario.js - Lógica del formulario de pedidos de vehículo para JAXTEC
// Este archivo gestiona el llenado, validación, envío y visualización/eliminación de pedidos del usuario logueado.

// Espera a que el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", function () {
  // Obtiene el nombre de usuario logueado desde sessionStorage y lo muestra en el input readonly
  const usuario = sessionStorage.getItem('usuario') || '';
  console.log("Usuario para consulta:", usuario);
  const usuarioInput = document.getElementById('usuario_logueado');
  if (usuarioInput) usuarioInput.value = usuario;

  // Referencias a elementos clave del formulario
  const pedidoForm = document.getElementById("pedidoForm");
  const formMsg = document.getElementById("formMsg");

  // Evento de envío del formulario de pedido
  pedidoForm.addEventListener("submit", async function (event) {
  console.log('Datos enviados al backend:', data);
    event.preventDefault(); // Previene el envío tradicional
    hideMessages(); // Limpia mensajes previos

    // Recolecta los datos del formulario en un objeto, incluyendo el id del usuario logueado
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

    // Validación básica: todos los campos obligatorios deben estar llenos
    for (const key in data) {
      if (key !== "comentarios_adicionales" && !data[key]) {
        showMessage(formMsg, "Por favor, completa todos los campos obligatorios.");
        return;
      }
    }

    // Envío del pedido al backend
    try {
      const response = await fetch("http://localhost:3000/api/registrar_cotizacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  // Oculta mensajes previos del formulario
  function hideMessages() {
    formMsg.textContent = "";
    formMsg.style.display = "none";
  }

  // Muestra mensajes de éxito o error en el formulario
  function showMessage(element, message, color = "red") {
    element.textContent = message;
    element.style.color = color;
    element.style.visibility = "visible";
    element.style.height = "auto";
    element.style.display = "block";
  }

  // Asigna la fecha actual al campo de fecha al cargar la página
  document.getElementById("fecha_solicitud").valueAsDate = new Date();

  // Evento para mostrar los pedidos del usuario y permitir su eliminación
  document.getElementById('btnEliminarPedidos').addEventListener('click', async function() {
    const misPedidosDiv = document.getElementById('misPedidos');
    const listaPedidosDiv = document.getElementById('listaPedidos');
    misPedidosDiv.style.display = 'block';
    listaPedidosDiv.innerHTML = 'Cargando...';

    // Obtiene el usuario logueado nuevamente (por si cambia)
    const usuario = sessionStorage.getItem('usuario') || '';
    console.log("[EliminarPedidos] Usuario para consulta:", usuario);

    // Solicita los pedidos del usuario al backend
    try {
      const response = await fetch(`http://localhost:3000/api/pedidos?usuario=${encodeURIComponent(usuario)}`);
      const pedidos = await response.json();
      console.log("[EliminarPedidos] Pedidos recibidos:", pedidos);

      if (pedidos.length === 0) {
        listaPedidosDiv.innerHTML = '<em>No tienes pedidos registrados.</em>';
        return;
      }

      // Muestra los pedidos con botón para eliminar (rojo)
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
      const response = await fetch(`http://localhost:3000/api/pedido/${id_pedido}`, { method: 'DELETE' });
      if (response.ok) {
        alert('Pedido eliminado');
        document.getElementById('btnEliminarPedidos').click(); // Recarga la lista de pedidos
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