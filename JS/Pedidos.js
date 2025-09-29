const pedidosTableBody = document.getElementById("pedidosTableBody");

// Función para actualizar un pedido (simulación)
function actualizarPedido(id) {
  alert(`Actualizar pedido ${id}`);
}

// Función para eliminar un pedido (simulación)
function eliminarPedido(id) {
  if (confirm(`¿Eliminar pedido ${id}?`)) {
    alert(`Pedido ${id} eliminado`);
    // Aquí eliminarías el pedido desde el backend o base de datos
  }
}

// Agregar eventos a los botones existentes
pedidosTableBody.addEventListener("click", (e) => {
  if (e.target.classList.contains("btn-update")) {
    const id = e.target.closest("tr").children[0].textContent;
    actualizarPedido(id);
  } else if (e.target.classList.contains("btn-delete")) {
    const id = e.target.closest("tr").children[0].textContent;
    eliminarPedido(id);
  }
});
