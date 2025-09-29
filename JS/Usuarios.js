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
