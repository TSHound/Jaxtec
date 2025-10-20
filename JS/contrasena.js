// Obtener token de la URL
const params = new URLSearchParams(window.location.search);
const token = params.get("token");

const form = document.getElementById("formContrasena");
const input = document.getElementById("nuevaContrasena");

// --- Mostrar nombre del usuario ---
if (token) {
  try {
    // Decodificar el token (sin verificar firma)
    const payloadBase64 = token.split(".")[1];
    const decodedJson = atob(payloadBase64);
    const payload = JSON.parse(decodedJson);

    const nombre = payload.nombre_usuario || "usuario";
    const titulo = document.getElementById("tituloCambio");
    if (titulo) titulo.textContent = `Cambiar contraseña de ${nombre}`;

    // --- Verificar si el token expiró ---
    const ahora = Math.floor(Date.now() / 1000);
    if (payload.exp && ahora > payload.exp) {
      alert("El enlace ha expirado. Solicita uno nuevo.");
      if (form) form.style.display = "none";
    }

  } catch (e) {
    console.error("Error al decodificar token:", e);
    alert("Token inválido.");
    if (form) form.style.display = "none";
  }
} else {
  alert("Token inválido o no proporcionado.");
  if (form) form.style.display = "none";
}

// --- Evento para enviar nueva contraseña ---
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nueva = input.value.trim();

    if (!nueva) {
      alert("Por favor ingresa una nueva contraseña.");
      return;
    }

    if (nueva.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      const res = await fetch("/api/cambiar_contrasena", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, nueva_contrasena: nueva }),
      });

      const data = await res.json();

      alert(data.mensaje);

      if (data.ok) {
        // Redirigir al login después de cambiar contraseña
        window.location.href = "/login.html";
      }

    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      alert("Ocurrió un error al actualizar la contraseña.");
    }
  });
}
