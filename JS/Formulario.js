// Formulario.js - Lógica del formulario de pedidos de vehículo para JAXTEC
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
    
  // Solo ejecutar el código relacionado con el formulario de pedidos si estamos en la página del formulario
  const pedidoForm = document.getElementById("pedidoForm");
  
  // Si no estamos en la página del formulario, no continuar con esta parte del código
  if (!pedidoForm) return;
  
  const usuario = sessionStorage.getItem('usuario') || '';
  const usuarioInput = document.getElementById('usuario_logueado');
  if (usuarioInput) usuarioInput.value = usuario;

  const formMsg = document.getElementById("formMsg");

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
    if (formMsg) {
      formMsg.textContent = "";
      formMsg.style.display = "none";
    }
  }

  function showMessage(element, message, color = "red") {
    if (element) {
      element.textContent = message;
      element.style.color = color;
      element.style.visibility = "visible";
      element.style.height = "auto";
      element.style.display = "block";
    } else {
      console.warn('Elemento no encontrado para mostrar mensaje:', message);
    }
  }

  const fechaSolicitud = document.getElementById("fecha_solicitud");
  if (fechaSolicitud) fechaSolicitud.valueAsDate = new Date();


});