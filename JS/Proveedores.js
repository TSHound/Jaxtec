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
  
  // Cargar proveedores cuando la página se cargue
  cargarProveedores();

  // Agregar eventos a los botones existentes
  const proveedoresTableBody = document.getElementById("proveedoresTableBody");
  proveedoresTableBody.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-edit")) {
      const id = e.target.closest("tr").children[0].textContent;
      editarProveedor(id);
    } else if (e.target.classList.contains("btn-delete")) {
      const id = e.target.closest("tr").children[0].textContent;
      // Aquí iría la función para eliminar proveedor
    }
  });
});

// --- Cargar proveedores desde la API y renderizar tabla ---
async function cargarProveedores() {
  // Obtener token JWT
  const token = sessionStorage.getItem("jwt_token");
  try {
    const res = await fetch('http://localhost:3000/api/proveedores', {
      headers: { "Authorization": token ? `Bearer ${token}` : '' }
    });
    const proveedores = await res.json();
    proveedoresTableBody.innerHTML = '';
    proveedores.forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.id_proveedor}</td>
        <td>${p.nombre_proveedor}</td>
        <td>${p.teléfono_proveedor || '-'}</td>
        <td>${p.correo_proveedor || '-'}</td>
        <td>
          <button class="btn-edit">Editar</button>
          <button class="btn-delete">Eliminar</button>
        </td>
      `;
      proveedoresTableBody.appendChild(tr);
    });
  } catch (e) {
    proveedoresTableBody.innerHTML = '<tr><td colspan="5">Error al cargar proveedores</td></tr>';
  }
}

// Mostrar modal para agregar o editar proveedor
function mostrarModalProveedor(modo, proveedor = {}) {
  document.getElementById('proveedorModalLabel').textContent = modo === 'editar' ? 'Editar Proveedor' : 'Agregar Proveedor';
  document.getElementById('proveedorId').value = proveedor.id_proveedor || '';
  document.getElementById('nombreProveedor').value = proveedor.nombre_proveedor || '';
  document.getElementById('teléfonoProveedor').value = proveedor.teléfono_proveedor || '';
  document.getElementById('correoProveedor').value = proveedor.correo_proveedor || '';
  const modal = new bootstrap.Modal(document.getElementById('proveedorModal'));
  modal.show();
}

// Evento para botón "Agregar Proveedor"
document.querySelector('.btn-add').addEventListener('click', () => mostrarModalProveedor('agregar'));

// Guardar proveedor (agregar o editar)
document.getElementById('guardarProveedorBtn').addEventListener('click', async () => {
  const id = document.getElementById('proveedorId').value;
  const nombre = document.getElementById('nombreProveedor').value.trim();
  const teléfono = document.getElementById('teléfonoProveedor').value.trim();
  const correo = document.getElementById('correoProveedor').value.trim();
  if (!nombre || !teléfono || !correo) {
    alert('Completa todos los campos');
    return;
  }
  const body = { nombre_proveedor: nombre, teléfono_proveedor: teléfono, correo_proveedor: correo };
  try {
    let res;
    if (id) {
      // Editar
      const token = sessionStorage.getItem("jwt_token");
      res = await fetch(`http://localhost:3000/api/proveedores/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(body)
      });
    } else {
      // Agregar
      const token = sessionStorage.getItem("jwt_token");
      res = await fetch('http://localhost:3000/api/proveedores', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(body)
      });
    }
    if (res.ok) {
      bootstrap.Modal.getInstance(document.getElementById('proveedorModal')).hide();
      cargarProveedores();
    } else {
      alert('Error: ' + await res.text());
    }
  } catch (e) {
    alert('Error de conexión');
  }
});

// Editar y eliminar proveedor desde la tabla
proveedoresTableBody.addEventListener('click', (e) => {
  const tr = e.target.closest('tr');
  const id = tr.children[0].textContent;
  if (e.target.classList.contains('btn-edit')) {
    // Obtener datos actuales de la fila
    const proveedor = {
      id_proveedor: id,
      nombre_proveedor: tr.children[1].textContent,
      teléfono_proveedor: tr.children[2].textContent,
      correo_proveedor: tr.children[3].textContent
    };
    mostrarModalProveedor('editar', proveedor);
  } else if (e.target.classList.contains('btn-delete')) {
    if (confirm('¿Eliminar proveedor ' + id + '?')) {
      const token = sessionStorage.getItem("jwt_token");
      fetch(`http://localhost:3000/api/proveedores/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      })
        .then(res => {
          if (res.ok) cargarProveedores();
          else res.text().then(msg => alert('Error: ' + msg));
        })
        .catch(() => alert('Error de conexión'));
    }
  }
});

document.addEventListener('DOMContentLoaded', cargarProveedores);