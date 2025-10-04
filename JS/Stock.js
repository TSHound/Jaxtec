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
      const token = sessionStorage.getItem("jwt_token");
      const res = await fetch('http://localhost:3000/api/articulo', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
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

// --- Cargar artículos desde la API y renderizar tabla ---
async function cargarArticulosStock() {
  const tbody = document.querySelector('#inventoryTable tbody');
  // Obtener token JWT
  const token = sessionStorage.getItem("jwt_token");
  try {
    const res = await fetch('http://localhost:3000/api/articulo', {
      headers: { "Authorization": token ? `Bearer ${token}` : '' }
    });
    const articulos = await res.json();
    tbody.innerHTML = '';
    articulos.forEach(art => {
      const estado = art.cantidad_artículo > 0 ? 'En Stock' : 'Agotado';
      const statusClass = art.cantidad_artículo > 0 ? 'status-in' : 'status-out';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${art.nombre_artículo}</td>
        <td>$${art.precio_artículo}</td>
        <td>${art.cantidad_artículo}</td>
        <td class="${statusClass}">${estado}</td>
        <td>
          <button class="edit-btn">Editar</button>
          <button class="delete-btn">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="5">Error al cargar artículos</td></tr>';
  }
}

document.addEventListener('DOMContentLoaded', cargarArticulosStock);
