// LogIn.js - Lógica de registro y login para JAXTEC
// Este archivo gestiona el registro de nuevos usuarios, el inicio de sesión, el manejo de mensajes de error/éxito y la redirección al formulario principal tras el login.

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
  
  // Referencias a los elementos del formulario de login
  const loginForm = document.getElementById("loginForm");
  const usernameField = document.getElementById("username");
  const passwordField = document.getElementById("password");
  const usernameError = document.getElementById("usernameError");
  const passwordError = document.getElementById("passwordError");
  const registerButton = document.getElementById("showCreateAccount");
  const registeredMessage = document.getElementById("registeredMessage");


  // Login de usuario existente
  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    hideMessages();
    const username = usernameField.value.trim();
    const password = passwordField.value.trim();
    let hasError = false;
    if (username === "") {
      showMessage(usernameError, "Por favor, ingresa tu nombre de usuario.");
      hasError = true;
    }
    if (password === "") {
      showMessage(passwordError, "Por favor, ingresa tu contraseña.");
      hasError = true;
    }
    if (hasError) return;
    try {
      const response = await fetch("http://localhost:3000/api/login_usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre_usuario: username, contraseña_usuario: password }),
      });
      const result = await response.json();
      if (response.ok) {
        // Guarda el id_usuario y nombre de usuario en sessionStorage para usarlo en otras páginas
        sessionStorage.setItem('id_usuario', result.id_usuario);
        sessionStorage.setItem('usuario', username);
        sessionStorage.setItem('jwt_token', result.token); // Guarda el token JWT en sessionStorage
        localStorage.setItem("isLoggedIn", "true"); // Marca al usuario como logueado en localStorage
        showMessage(registeredMessage, result.mensaje || "¡Inicio de sesión exitoso!", "green");
        setTimeout(() => {
          window.location.href = "../HTML/Formulario.html"; // Redirige al formulario principal
        }, 300);
      } else {
        showMessage(usernameError, result.mensaje || "Usuario o contraseña incorrectos");
      }
    } catch (error) {
      showMessage(usernameError, "Error de conexión con el servidor.");
      console.error("Error en fetch:", error);
    }
  });

  // Oculta todos los mensajes de error/éxito
  function hideMessages() {
    [usernameError, passwordError, registeredMessage].forEach((el) => {
      if (el) {
        el.style.visibility = "hidden";
        el.style.height = "0";
        el.style.display = "none";
        el.textContent = "";
      }
    });
  }

  // Muestra mensajes de error o éxito en el elemento indicado
  function showMessage(element, message, color = "red") {
    element.textContent = message;
    element.style.color = color;
    element.style.visibility = "visible";
    element.style.height = "auto";
    element.style.display = "block";
  }

  // Mostrar mensaje de "¡Registrado!" con tiempos ajustados
  function mostrarMensajeRegistrado() {
    const msg = registeredMessage;
    msg.style.display = "block";
    msg.style.animation = "fadeIn 0.3s ease-out";
    setTimeout(() => {
      msg.style.display = "none";
    }, 5000);
  }

  // Mostrar mensaje de "El usuario ya existe"
  function mostrarMensajeUsuarioExistente() {
    const msg = document.getElementById("userExistsMessage");
    msg.style.display = "block";
    msg.style.animation = "fadeIn 0.3s ease-out";
    setTimeout(() => {
      msg.style.display = "none";
    }, 5000);
  }

  // JS movido desde LogIn.html
  const showCreateAccountBtn = document.getElementById("showCreateAccount");
  const createAccountForm = document.getElementById("createAccountForm");
  const registerSuccess = document.getElementById("registerSuccess");
  const registerError = document.getElementById("registerError");
  const quoteBtn = document.getElementById("quoteBtn");
  const quoteError = document.getElementById("quoteError");

  showCreateAccountBtn.addEventListener("click", () => {
    if (
      createAccountForm.style.display === "none" ||
      createAccountForm.style.display === ""
    ) {
      createAccountForm.style.display = "block";
      registerSuccess.style.display = "none";
      registerError.style.display = "none";
      quoteError.style.display = "none";
      showCreateAccountBtn.textContent = "Cancelar";
    } else {
      createAccountForm.style.display = "none";
      showCreateAccountBtn.textContent = "Crear cuenta";
      clearRegisterErrors();
      registerSuccess.style.display = "none";
      registerError.style.display = "none";
      quoteError.style.display = "none";
    }
  });

  // Limpiar errores del formulario crear cuenta
  function clearRegisterErrors() {
    [
      "newUsernameError",
      "newPasswordError",
      "phoneError",
      "emailError",
      "addressError",
    ].forEach((id) => {
      document.getElementById(id).textContent = "";
    });
  }

  createAccountForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    clearRegisterErrors();
    registerSuccess.style.display = "none";
    registerError.style.display = "none";
    quoteError.style.display = "none";

    let valid = true;

    const newUsername = document.getElementById("newUsername").value.trim();
    const newPassword = document.getElementById("newPassword").value.trim();
    const phone = Number(document.getElementById("phone").value.trim());
    const email = document.getElementById("email").value.trim();
    const address = document.getElementById("address").value.trim();
    

    if (!newUsername) {
      document.getElementById("newUsernameError").textContent =
        "El nombre de usuario es obligatorio.";
      valid = false;
    }
    if (!newPassword) {
      document.getElementById("newPasswordError").textContent =
        "La contraseña es obligatoria.";
      valid = false;
    }
    if (!phone || isNaN(phone)) {
      document.getElementById("phoneError").textContent =
        "El teléfono es obligatorio y debe ser un número.";
      valid = false;
    }
    if (!email || !email.includes("@")) {
      document.getElementById("emailError").textContent =
        "Correo válido es obligatorio.";
      valid = false;
    }
    if (!address) {
      document.getElementById("addressError").textContent =
        "La dirección es obligatoria.";
      valid = false;
    }

    if (!valid) {
      registerError.style.display = "block";
      return;
    }

    // Enviar datos al backend para registrar usuario real
    try {
      const response = await fetch("http://localhost:3000/api/registrar_usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_usuario: newUsername,
          contraseña_usuario: newPassword,
          teléfono_usuario: phone,
          correo_usuario: email,
          dirección_usuario: address
        }),
      });
      const text = await response.text();
      if (response.ok) {
        registerSuccess.style.display = "block";
        createAccountForm.style.display = "none";
        showCreateAccountBtn.textContent = "Crear cuenta";
        createAccountForm.reset();
      } else {
        registerError.textContent = text || "Error al registrar usuario.";
        registerError.style.display = "block";
      }
    } catch (error) {
      registerError.textContent = "Error de conexión con el servidor.";
      registerError.style.display = "block";
    }
  });

  // Botón para cotizar
  quoteBtn.addEventListener("click", () => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (isLoggedIn === "true") {
      window.location.href = "Formulario.html";
    } else {
      quoteError.style.display = "block";
    }
  });
});