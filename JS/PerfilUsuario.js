document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("customModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const formularioLink = document.getElementById("formularioLink");
  let usuarioLogueado = false; // Cambia a true si el usuario está logueado

  formularioLink.addEventListener("click", function (e) {
    if (!usuarioLogueado) {
      e.preventDefault();
      modal.style.display = "block";
    } else {
      window.location.href = "Formulario.html";
    }
  });

  closeModalBtn.addEventListener("click", function () {
    modal.style.display = "none";
  });

  window.onclick = function (e) {
    if (e.target == modal) {
      modal.style.display = "none";
    }
  };

  document.querySelector(".btn-logout").addEventListener("click", () => {
    alert("Sesión cerrada. Redirigiendo a página de inicio de sesión...");
    window.location.href = "LogIn.html";
  });

  // Mostrar datos del usuario logueado usando el token correcto
  const token = sessionStorage.getItem("jwt_token");
  const loginModal = document.getElementById("loginModal");
  if (!token) {
    loginModal.style.display = "block";
    closeModalBtn.addEventListener("click", () => {
      loginModal.style.display = "none";
      window.location.href = "LogIn.html";
    });
    return;
  }
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
});
