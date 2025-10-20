// Stock.js - Gestión de inventario para JAXTEC
// Esperamos a que el DOM esté cargado para iniciar todas las funcionalidades
document.addEventListener("DOMContentLoaded", function () {
  // Obtener token JWT una sola vez para toda la página
  const token = sessionStorage.getItem("jwt_token");
  const isLoggedIn = !!token;

  // Referencias a elementos DOM
  const searchInput = document.getElementById("productSearch");
  const statusFilter = document.getElementById("statusFilter");
  let tableRows; // Lo inicializaremos después de cargar los datos

  // --- Función para filtrar la tabla ---
  function filterTable() {
    // Asegurarse de que tableRows esté actualizado con las filas actuales
    tableRows = document.querySelectorAll("#inventoryTable tbody tr");
    
    const searchText = searchInput ? searchInput.value.toLowerCase() : '';
    const selectedStatus = statusFilter ? statusFilter.value : '';

    if (tableRows) {
      tableRows.forEach((row) => {
        const productName = row.cells[0].textContent.toLowerCase();
        // Obtener el estado de la celda 5 (índice 5) donde ahora está la columna Estado
        const estadoTexto = row.cells[5].textContent.trim();
        const statusClass = estadoTexto === 'En Stock' ? 'in' : 'out';

        const matchesSearch = productName.includes(searchText);
        const matchesStatus =
          selectedStatus === "" || statusClass === selectedStatus;

        row.style.display = matchesSearch && matchesStatus ? "" : "none";
      });
    }
  }

  // --- Configurar event listeners para filtrado ---
  if (searchInput && statusFilter) {
    searchInput.addEventListener("input", filterTable);
    statusFilter.addEventListener("change", filterTable);
  }

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
          // Verificar si ya existe el mensaje de bienvenida para evitar duplicados
          const existingWelcome = document.querySelector(".bienvenido-usuario");
          if (existingWelcome) return;
          
          // Crear el elemento para el mensaje de bienvenida
          const userDiv = document.createElement("div");
          userDiv.className = "ms-auto bienvenido-usuario";
          
          // Crear el texto con formato (usando las clases CSS)
          const welcomeText = document.createElement("span");
          welcomeText.className = "bienvenido-texto"; 
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

  // --- Configurar botones de editar y eliminar ---
  function setupRowButtons() {
    // Botones de editar
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.dataset.id;
        const row = this.closest('tr');
        
        // Obtener los datos actuales de la fila
        const nombre = row.cells[0].textContent;
        const cantidad = parseInt(row.cells[1].textContent);
        const precio = parseFloat(row.cells[2].textContent.replace('$', '').replace(',', ''));
        const costo = parseFloat(row.cells[3].textContent.replace('$', '').replace(',', ''));
        
        // Llenar el modal con los datos actuales
        document.getElementById('editNombre').value = nombre;
        document.getElementById('editCantidad').value = cantidad;
        document.getElementById('editPrecio').value = precio;
        document.getElementById('editCosto').value = costo;
        
        // Mostrar el modal
        const modal = new bootstrap.Modal(document.getElementById('editarArticuloModal'));
        modal.show();
        
        // Configurar el botón de guardar para este artículo específico
        const guardarBtn = document.getElementById('guardarCambios');
        // Remover event listeners previos
        const newGuardarBtn = guardarBtn.cloneNode(true);
        guardarBtn.parentNode.replaceChild(newGuardarBtn, guardarBtn);
        
        newGuardarBtn.addEventListener('click', async function() {
          const nuevoNombre = document.getElementById('editNombre').value.trim();
          const nuevaCantidad = parseInt(document.getElementById('editCantidad').value);
          const nuevoPrecio = parseFloat(document.getElementById('editPrecio').value);
          const nuevoCosto = parseFloat(document.getElementById('editCosto').value) || undefined;
          
          // Validar datos
          if (!nuevoNombre || isNaN(nuevaCantidad) || isNaN(nuevoPrecio) || nuevaCantidad < 0 || nuevoPrecio < 0) {
            alert('Por favor, introduce valores válidos');
            return;
          }
          
          try {
            const body = {
              nombre_artículo: nuevoNombre,
              cantidad_artículo: nuevaCantidad,
              precio_artículo: nuevoPrecio
            };
            
            // Solo incluir costo si se proporcionó
            if (nuevoCosto !== undefined && !isNaN(nuevoCosto) && nuevoCosto >= 0) {
              body.costo_artículo = nuevoCosto;
            }
            
            const res = await fetch(`http://localhost:3000/api/articulo/${id}`, {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify(body)
            });
            
            if (res.ok) {
              modal.hide();
              alert('Artículo actualizado con éxito');
              // Recargar la tabla para mostrar los cambios
              cargarArticulosStock();
            } else {
              const errorData = await res.json().catch(() => ({}));
              alert('Error al actualizar el artículo: ' + (errorData?.mensaje || 'Error desconocido'));
            }
          } catch (e) {
            alert('Error de conexión');
            console.error('Error al editar:', e);
          }
        });
      });
    });
    
    // Botones de eliminar (corregido para usar id_articulo)
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async function() {
        const row = this.closest('tr');
        const nombreProducto = row.cells[0].textContent;
        
        if (!confirm(`¿Estás seguro de eliminar el artículo "${nombreProducto}"?`)) return;
        
        const id = this.dataset.id;
        console.log("Eliminando artículo con ID:", id); // Debug
        
        try {
          // Corregir la URL para usar id_articulo como espera el servidor
          const res = await fetch(`http://localhost:3000/api/articulo/${id}`, {
            method: 'DELETE',
            headers: { "Authorization": `Bearer ${token}` }
          });
          
          console.log("Respuesta del servidor:", res.status); // Debug
          
          if (res.ok) {
            const data = await res.json();
            alert('Artículo eliminado con éxito');
            console.log("Eliminación exitosa:", data);
            // Recargar la tabla para reflejar los cambios
            cargarArticulosStock();
          } else {
            const errorText = await res.text();
            console.error("Error del servidor:", errorText);
            try {
              const errorData = JSON.parse(errorText);
              alert('Error al eliminar el artículo: ' + (errorData?.mensaje || 'Error desconocido'));
            } catch (e) {
              alert(`Error al eliminar el artículo. Status: ${res.status}`);
            }
          }
        } catch (e) {
          alert('Error de conexión');
          console.error('Error al eliminar:', e);
        }
      });
    });
  }
  
  // --- Función para cargar los proveedores en el selector ---
  async function cargarProveedores() {
    const proveedorSelect = document.getElementById('productProvider');
    if (!proveedorSelect) return;

    try {
      const res = await fetch('http://localhost:3000/api/proveedores', {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }
      
      const proveedores = await res.json();
      
      // Limpiar opciones existentes excepto la primera
      while (proveedorSelect.options.length > 1) {
        proveedorSelect.remove(1);
      }
      
      // Agregar los proveedores como opciones
      proveedores.forEach(proveedor => {
        const option = document.createElement('option');
        option.value = proveedor.id_proveedor;
        option.textContent = proveedor.nombre_proveedor;
        proveedorSelect.appendChild(option);
      });
    } catch (e) {
      console.error("Error al cargar proveedores:", e);
      alert('No se pudieron cargar los proveedores. Detalles en consola.');
    }
  }
  
  // --- Lógica para agregar producto ---
  const modal = document.getElementById('addProductModal');
  if (modal) {
    // Cargar proveedores cuando se abre el modal
    modal.addEventListener('shown.bs.modal', function () {
      cargarProveedores();
    });
    
    const guardarBtn = modal.querySelector('.btn-warning');
    const form = modal.querySelector('form');
    
    if (guardarBtn && form) {
      guardarBtn.addEventListener('click', async () => {
        const nombre_artículo = document.getElementById('productName')?.value.trim() || '';
        const cantidad_artículo = parseInt(document.getElementById('productQuantity')?.value || '0');
        const precio_artículo = parseFloat(document.getElementById('productPrice')?.value || '0');
        const costo_artículo = parseFloat(document.getElementById('productCost')?.value || '0');
        const proveedorSelect = document.getElementById('productProvider');
        const Proveedor_id_proveedor = parseInt(proveedorSelect?.value || '0');
        
        if (!nombre_artículo || isNaN(precio_artículo) || isNaN(cantidad_artículo) || Proveedor_id_proveedor <= 0) {
          alert('Completa todos los campos obligatorios correctamente, incluyendo el proveedor');
          return;
        }
        
        try {
          // Mostrar qué datos se están enviando para depuración
          const payload = {
            nombre_artículo,
            cantidad_artículo,
            precio_artículo,
            costo_artículo,
            Proveedor_id_proveedor
          };
          console.log("Enviando datos:", payload);
          
          const res = await fetch('http://localhost:3000/api/articulo', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
          
          if (res.ok) {
            alert('Producto agregado exitosamente');
            form.reset();
            // Cerrar modal
            const modalInstance = bootstrap.Modal.getInstance(modal);
            if (modalInstance) modalInstance.hide();
            // Recargar lista de productos
            cargarArticulosStock();
          } else {
            const errorText = await res.text();
            console.error("Error del servidor:", errorText);
            try {
              const errorData = JSON.parse(errorText);
              alert('Error: ' + (errorData.mensaje || 'No se pudo agregar el artículo'));
            } catch (e) {
              alert('Error: No se pudo agregar el artículo. Detalles en la consola.');
            }
          }
        } catch (e) {
          alert('Error de conexión');
          console.error('Error al guardar:', e);
        }
      });
    }
  }
  
    // --- Cargar artículos desde la API y renderizar tabla ---
  async function cargarArticulosStock() {
    const table = document.querySelector('#inventoryTable');
    if (!table) {
      console.error("Tabla de inventario no encontrada");
      return;
    }
    
    // Asegurarnos de que la tabla tenga un tbody
    let tbody = table.querySelector('tbody');
    if (!tbody) {
      tbody = document.createElement('tbody');
      table.appendChild(tbody);
    }
    
    try {
      const res = await fetch('http://localhost:3000/api/articulo', {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }
      
      const articulos = await res.json();
      tbody.innerHTML = '';

      // Array para acumular productos con stock bajo
      const productosBajos = [];
      
      articulos.forEach(art => {
        const estado = art.cantidad_artículo > 0 ? 'En Stock' : 'Agotado';
        const statusClass = art.cantidad_artículo > 0 ? 'status-in' : 'status-out';
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${art.nombre_artículo || 'Sin nombre'}</td>
          <td>${art.cantidad_artículo || 0}</td>
          <td>$${art.precio_artículo || 0}</td>
          <td>$${art.costo_artículo || 0}</td>
          <td>${art.nombre_proveedor || 'Sin proveedor'}</td>
          <td class="${statusClass}">${estado}</td>
          <td>
            <button class="edit-btn" data-id="${art.id_artículo}">Editar</button>
            <button class="delete-btn" data-id="${art.id_artículo}">Eliminar</button>
          </td>
        `;
        tbody.appendChild(tr);

        // Si la cantidad es menor a 5 la marcamos para avisar
        if (typeof art.cantidad_artículo === 'number' && art.cantidad_artículo < 5) {
          productosBajos.push(art.nombre_artículo || 'Sin nombre');
        }
      });
      
      // Configurar acciones para los botones de editar y eliminar
      setupRowButtons();
      
      // Actualizar tableRows después de cargar datos
      tableRows = document.querySelectorAll("#inventoryTable tbody tr");
      
      // Aplicar filtros actuales si existen
      if (searchInput && statusFilter) {
        filterTable();
      }

      // --- Mostrar modal de resurtir si hay productos bajos ---
      if (productosBajos.length > 0) {
        // Crear modal sencillo solo si no existe (no reemplaza tu HTML si ya tienes uno)
        if (!document.getElementById('alertaStockModal')) {
          const modalHTML = `
            <div class="modal fade" id="alertaStockModal" tabindex="-1" aria-labelledby="alertaStockLabel" aria-hidden="true">
              <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                  <div class="modal-header bg-warning">
                    <h5 class="modal-title" id="alertaStockLabel">Favor de resurtir</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                  </div>
                  <div class="modal-body">
                    <p id="alertaStockTexto"></p>
                  </div>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                  </div>
                </div>
              </div>
            </div>`;
          document.body.insertAdjacentHTML('beforeend', modalHTML);
        }

        // Poner el texto y mostrar el modal
        const alertaTexto = document.getElementById('alertaStockTexto');
        if (alertaTexto) {
          alertaTexto.textContent = `Favor de resurtir: ${productosBajos.join(', ')}`;
        }
        const modalEl = document.getElementById('alertaStockModal');
        if (modalEl) {
          const modalInstance = new bootstrap.Modal(modalEl);
          modalInstance.show();
        }
      }
      
    } catch (e) {
      console.error("Error al cargar artículos:", e);
      tbody.innerHTML = `<tr><td colspan="7">Error al cargar artículos: ${e.message}</td></tr>`;
    }
  }


  // --- Iniciar carga de datos ---
  mostrarNombreUsuario();
  cargarArticulosStock();
});
