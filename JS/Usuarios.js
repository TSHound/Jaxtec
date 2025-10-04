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

  const usuariosTableBody = document.getElementById("usuariosTableBody");

// Función para agregar un usuario (simulación)
function agregarUsuario() {
  alert("Aquí abrirías el formulario para agregar usuario");
}

// Función para editar un usuario (simulación)
function editarUsuario(id) {
  alert(`Editar usuario ${id}`);
}

// Función para eliminar un usuario (simulación)
function eliminarUsuario(id) {
  if (confirm(`¿Eliminar usuario ${id}?`)) {
    alert(`Usuario ${id} eliminado`);
    // Aquí eliminarías el usuario desde el backend o base de datos
  }
}

// Agregar eventos a los botones existentes
usuariosTableBody.addEventListener("click", (e) => {
  if (e.target.classList.contains("btn-edit")) {
    const id = e.target.closest("tr").children[0].textContent;
    editarUsuario(id);
  } else if (e.target.classList.contains("btn-delete")) {
    const id = e.target.closest("tr").children[0].textContent;
    eliminarUsuario(id);
  }
});

});
