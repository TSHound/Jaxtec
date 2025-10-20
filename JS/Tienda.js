document.addEventListener("DOMContentLoaded", function () {
  const token = sessionStorage.getItem("jwt_token");
  const isLoggedIn = !!token;

  // --- Mostrar el nombre del usuario en la barra de navegación ---
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
          welcomeText.textContent = `Bienvenido, ${userData.nombre_usuario || "usuario"}`;

          userDiv.appendChild(welcomeText);
          navbar.appendChild(userDiv);
        }
      }
    } catch (e) {
      console.warn("Error al obtener información del usuario:", e);
    }
  }
  mostrarNombreUsuario();

  // --- Cargar artículos desde la API y renderizar grid ---
  async function cargarArticulos() {
    const productGrid = document.getElementById("productGrid");

    try {
      const res = await fetch("http://localhost:3000/api/articulo", {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) throw new Error("Error en la petición");

      const articulos = await res.json();
      productGrid.innerHTML = "";

      articulos.forEach((art) => {
        const card = document.createElement("div");
        card.className = "product-card";
        
        // Determinar si está agotado y configurar botón accordingly
        const isAgotado = art.cantidad_artículo === 0;
        const estadoTexto = isAgotado ? "Agotado" : `Existencias: ${art.cantidad_artículo}`;
        const botonTexto = isAgotado ? "Agotado" : "Agregar al carrito";
        const botonClase = isAgotado ? "btn btn-secondary" : "btn btn-warning add-to-cart-btn";
        const botonDisabled = isAgotado ? "disabled" : "";
        
        card.innerHTML = `
          <div class="card h-100 shadow-sm">
            <div class="card-body text-center">
              <h5 class="card-title">${art.nombre_artículo}</h5>
              <p class="card-text">${estadoTexto}</p>
              <p class="card-text">Precio: $${art.precio_artículo}</p>
              ${!isAgotado ? `
                <div class="quantity-selector mb-3">
                  <label for="cantidad-${art.id_artículo}" class="form-label">Cantidad:</label>
                  <input type="number" 
                         id="cantidad-${art.id_artículo}" 
                         class="form-control cantidad-input" 
                         min="1" 
                         max="${art.cantidad_artículo}" 
                         value="1" 
                         style="width: 80px; margin: 0 auto;">
                </div>
              ` : ''}
              <button class="${botonClase} mt-2" data-id="${art.id_artículo}" ${botonDisabled}>
                ${botonTexto}
              </button>
            </div>
          </div>
        `;
        productGrid.appendChild(card);
      });

      // --- Evento de agregar al carrito ---
      document.querySelectorAll(".add-to-cart-btn").forEach((btn) => {
        btn.addEventListener("click", async function () {
          const idArticulo = this.getAttribute("data-id");
          
          // 🔍 Buscar el artículo en la lista para verificar cantidad
          const articulo = articulos.find(art => art.id_artículo == idArticulo);
          
          // ⚠️ Verificar si el artículo está agotado
          if (articulo && articulo.cantidad_artículo === 0) {
            alert("❌ Este producto está agotado y no puede ser agregado al carrito.");
            return;
          }

          // � Obtener la cantidad seleccionada por el usuario
          const cantidadInput = document.getElementById(`cantidad-${idArticulo}`);
          const cantidadSeleccionada = cantidadInput ? parseInt(cantidadInput.value) : 1;
          
          // ✅ Validar que la cantidad sea válida
          if (cantidadSeleccionada < 1) {
            alert("❌ La cantidad debe ser al menos 1.");
            return;
          }
          
          if (cantidadSeleccionada > articulo.cantidad_artículo) {
            alert(`❌ Solo hay ${articulo.cantidad_artículo} unidades disponibles de este producto.`);
            return;
          }

          // �🟢 Si el usuario NO está logueado, guardamos en carrito temporal local
          if (!isLoggedIn) {
            let carritoTemporal = JSON.parse(localStorage.getItem("carritoTemporalDetallado")) || [];

            // Buscar si el producto ya existe en el carrito temporal
            const productoExistente = carritoTemporal.find(item => item.id === idArticulo);
            
            if (productoExistente) {
              // Si existe, sumar la cantidad
              const nuevaCantidad = productoExistente.cantidad + cantidadSeleccionada;
              if (nuevaCantidad > articulo.cantidad_artículo) {
                alert(`❌ No puedes agregar más. Solo hay ${articulo.cantidad_artículo} unidades disponibles.`);
                return;
              }
              productoExistente.cantidad = nuevaCantidad;
            } else {
              // Si no existe, agregarlo
              carritoTemporal.push({
                id: idArticulo,
                nombre: articulo.nombre_artículo,
                precio: articulo.precio_artículo,
                cantidad: cantidadSeleccionada
              });
            }
            
            localStorage.setItem("carritoTemporalDetallado", JSON.stringify(carritoTemporal));
            alert(`✅ ${cantidadSeleccionada} unidad(es) de "${articulo.nombre_artículo}" agregada(s) al carrito temporal. Inicia sesión para guardarlo permanentemente.`);
            return;
          }

          // 🟢 Si el usuario está logueado, enviamos al backend con la cantidad
          try {
            const res = await fetch("http://localhost:3000/api/carrito", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ 
                id_articulo: idArticulo,
                cantidad: cantidadSeleccionada
              }),
            });

            if (res.ok) {
              alert(`✅ ${cantidadSeleccionada} unidad(es) de "${articulo.nombre_artículo}" agregada(s) al carrito`);
              // Resetear cantidad a 1 después de agregar
              if (cantidadInput) cantidadInput.value = 1;
            } else {
              const errorData = await res.json();
              alert(`⚠️ Error al agregar al carrito: ${errorData.mensaje || 'Error desconocido'}`);
            }
          } catch (e) {
            console.error("Error de conexión:", e);
            alert("❌ Error de conexión con el servidor");
          }
        });
      });
    } catch (e) {
      productGrid.innerHTML =
        '<div class="alert alert-danger text-center">Error al cargar artículos</div>';
    }
  }

  cargarArticulos();

  // --- Bloquear acceso al formulario si no está logueado ---
  const formularioLinks = document.querySelectorAll('a[href="Formulario.html"]');
  formularioLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      if (!isLoggedIn) {
        e.preventDefault();
        const confirmLogin = confirm(
          "Debes iniciar sesión para acceder al formulario.\n\n¿Deseas hacerlo ahora?"
        );
        if (confirmLogin) window.location.href = "Login.html";
      }
    });
  });
});