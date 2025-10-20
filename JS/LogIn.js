// LogIn.js - Lógica de registro y login para JAXTEC
document.addEventListener("DOMContentLoaded", function () {
  const token = sessionStorage.getItem("jwt_token");
  const isLoggedIn = !!token;

  // --- Mostrar nombre del usuario logueado ---
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
  mostrarNombreUsuario();

  // --- Login ---
  const loginForm = document.getElementById("loginForm");
  const usernameField = document.getElementById("username");
  const passwordField = document.getElementById("password");
  const usernameError = document.getElementById("usernameError");
  const passwordError = document.getElementById("passwordError");
  const registeredMessage = document.getElementById("registeredMessage");

  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    hideMessages();

    const username = usernameField.value.trim();
    const password = passwordField.value.trim();
    let hasError = false;

    if (!username) {
      showMessage(usernameError, "Por favor, ingresa tu nombre de usuario.");
      hasError = true;
    }
    if (!password) {
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
        sessionStorage.setItem("id_usuario", result.id_usuario);
        sessionStorage.setItem("usuario", username);
        sessionStorage.setItem("jwt_token", result.token);
        localStorage.setItem("isLoggedIn", "true");

        showMessage(registeredMessage, result.mensaje || "¡Inicio de sesión exitoso!", "green");

        // --- Fusionar carrito temporal ---
        const carritoTemporal = JSON.parse(localStorage.getItem("carritoTemporal"));
        if (carritoTemporal?.length > 0) {
          try {
            const mergeResponse = await fetch("http://localhost:3000/api/carrito/merge", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${result.token}`,
              },
              body: JSON.stringify({ productos: carritoTemporal }),
            });
            if (mergeResponse.ok) {
              console.log("✅ Carrito temporal fusionado con el del usuario.");
              localStorage.removeItem("carritoTemporal");
            } else {
              console.warn("⚠️ No se pudo fusionar el carrito temporal.");
            }
          } catch (err) {
            console.warn("❌ Error al enviar el carrito temporal:", err);
          }
        }

        // --- Obtener rol y redirigir ---
        const perfilResponse = await fetch("http://localhost:3000/api/perfil_usuario", {
          headers: { Authorization: `Bearer ${result.token}` },
        });

        if (perfilResponse.ok) {
          const perfilData = await perfilResponse.json();
          const rol = perfilData.rol_usuario || "";
          setTimeout(() => {
            if (rol === "Administrador") window.location.href = "../HTML/Stock.html";
            else window.location.href = "../HTML/Inicio.html";
          }, 300);
        } else {
          console.warn("No se pudo obtener el rol del usuario.");
          setTimeout(() => window.location.href = "../HTML/Inicio.html", 300);
        }

      } else {
        showMessage(usernameError, result.mensaje || "Usuario o contraseña incorrectos");
      }
    } catch (error) {
      showMessage(usernameError, "Error de conexión con el servidor.");
      console.error("Error en fetch:", error);
    }
  });

  // --- Funciones auxiliares ---
  function hideMessages() {
    [usernameError, passwordError, registeredMessage].forEach(el => {
      if (el) {
        el.style.display = "none";
        el.textContent = "";
      }
    });
  }

  function showMessage(element, message, color = "red") {
    element.textContent = message;
    element.style.color = color;
    element.style.display = "block";
  }

  // --- Registro ---
  const showCreateAccountBtn = document.getElementById("showCreateAccount");
  const createAccountForm = document.getElementById("createAccountForm");
  const registerSuccess = document.getElementById("registerSuccess");
  const registerError = document.getElementById("registerError");
  const quoteBtn = document.getElementById("quoteBtn");
  const quoteError = document.getElementById("quoteError");

  showCreateAccountBtn.addEventListener("click", () => {
    const showing = createAccountForm.style.display === "block";
    createAccountForm.style.display = showing ? "none" : "block";
    showCreateAccountBtn.textContent = showing ? "Crear cuenta" : "Cancelar";
    registerSuccess.style.display = "none";
    registerError.style.display = "none";
    quoteError.style.display = "none";
    clearRegisterErrors();
  });

  function clearRegisterErrors() {
    ["newUsernameError","newPasswordError","phoneError","emailError","addressError"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = "";
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
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const address = document.getElementById("address").value.trim();

    if (!newUsername) { document.getElementById("newUsernameError").textContent = "El nombre de usuario es obligatorio."; valid=false; }
    if (!newPassword) { document.getElementById("newPasswordError").textContent = "La contraseña es obligatoria."; valid=false; }
    if (!phone || !/^\d+$/.test(phone)) { document.getElementById("phoneError").textContent = "El teléfono debe ser un número válido."; valid=false; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { document.getElementById("emailError").textContent = "Correo válido es obligatorio."; valid=false; }
    if (!address) { document.getElementById("addressError").textContent = "La dirección es obligatoria."; valid=false; }

    if (!valid) { registerError.style.display="block"; return; }

    try {
      const response = await fetch("http://localhost:3000/api/registrar_usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_usuario: newUsername,
          contraseña_usuario: newPassword,
          teléfono_usuario: phone,
          correo_usuario: email,
          dirección_usuario: address,
        }),
      });

      const text = await response.text();
      if (response.ok) {
        registerSuccess.style.display="block";
        createAccountForm.style.display="none";
        showCreateAccountBtn.textContent="Crear cuenta";
        createAccountForm.reset();
      } else {
        registerError.textContent = text || "Error al registrar usuario.";
        registerError.style.display="block";
      }
    } catch (error) {
      registerError.textContent = "Error de conexión con el servidor.";
      registerError.style.display="block";
    }
  });

  // --- Redirección a Inicio ---
  quoteBtn.addEventListener("click", () => {
    if (localStorage.getItem("isLoggedIn") === "true") window.location.href = "Inicio.html";
    else quoteError.style.display="block";
  });

  // --- Modal Recuperación de contraseña ---
  const sendForgotBtn = document.getElementById("sendForgot");
  const forgotInput = document.getElementById("forgotUsername");
  const sendEmailMessage = document.getElementById("sendEmailMessage");

  sendForgotBtn?.addEventListener("click", async () => {
    const username = forgotInput.value.trim();
    if (!username) {
      sendEmailMessage.style.color="red";
      sendEmailMessage.textContent="Por favor ingresa tu nombre de usuario.";
      forgotInput.focus();
      return;
    }
    try {
      const res = await fetch("http://localhost:3000/api/enviar_correo_recuperacion", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ nombre_usuario: username })
      });
      const data = await res.json();
      sendEmailMessage.style.color = res.ok ? "green" : "red";
      sendEmailMessage.textContent = data.mensaje || (res.ok ? "Correo enviado correctamente." : "No se pudo enviar el correo.");
    } catch(err) {
      console.error(err);
      sendEmailMessage.style.color="red";
      sendEmailMessage.textContent="Error de conexión con el servidor.";
    }
  });

});
