const searchInput = document.getElementById("productSearch");
const statusFilter = document.getElementById("statusFilter");
const tableRows = document.querySelectorAll("#inventoryTable tbody tr");

function filterTable() {
  const searchText = searchInput.value.toLowerCase();
  const selectedStatus = statusFilter.value;

  tableRows.forEach((row) => {
    const productName = row.cells[0].textContent.toLowerCase();
    const statusClass = row.cells[3].classList.contains("status-in")
      ? "in"
      : "out";

    const matchesSearch = productName.includes(searchText);
    const matchesStatus =
      selectedStatus === "" || statusClass === selectedStatus;

    row.style.display = matchesSearch && matchesStatus ? "" : "none";
  });
}


searchInput.addEventListener("input", filterTable);
statusFilter.addEventListener("change", filterTable);

// --- Lógica para agregar producto ---
document.addEventListener('DOMContentLoaded', () => {
  const guardarBtn = document.querySelector('#addProductModal .btn-warning');
  const modal = document.getElementById('addProductModal');
  const form = modal.querySelector('form');
  guardarBtn.addEventListener('click', async () => {
    const inputs = form.querySelectorAll('input, select');
    const nombre_articulo = inputs[0].value.trim();
    const precio_articulo = parseFloat(inputs[1].value);
    const cantidad_articulo = parseInt(inputs[2].value);
    // Estado no se guarda en la base, se calcula por cantidad
    // Imagen no se envía
    // Proveedor_id_proveedor: valor fijo por ahora (ajustar si hay selector)
    const Proveedor_id_proveedor = 1;
    const costo_articulo = 0; // Ajustar si hay campo de costo
    if (!nombre_articulo || isNaN(precio_articulo) || isNaN(cantidad_articulo)) {
      alert('Completa todos los campos obligatorios');
      return;
    }
    try {
      const res = await fetch('http://localhost:3000/api/articulo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_articulo,
          cantidad_articulo,
          precio_articulo,
          costo_articulo,
          Proveedor_id_proveedor
        })
      });
      if (res.ok) {
        alert('Producto agregado exitosamente');
        form.reset();
        // Opcional: cerrar modal y recargar tabla
        const modalInstance = bootstrap.Modal.getInstance(modal);
        if (modalInstance) modalInstance.hide();
        // Recargar productos (puedes implementar fetch y render de tabla)
        location.reload();
      } else {
        const msg = await res.text();
        alert('Error: ' + msg);
      }
    } catch (e) {
      alert('Error de conexión');
    }
  });
});
