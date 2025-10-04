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

  // --- Cargar artículos desde la API y renderizar grid ---
  async function cargarArticulos() {
    const productGrid = document.getElementById("productGrid");
  
    try {
      // Obtener artículos de la API
      const res = await fetch("http://localhost:3000/api/articulo", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!res.ok) throw new Error("Error en la petición");
      
      const articulos = await res.json();
      productGrid.innerHTML = "";
      
      // Renderizar cada artículo
      articulos.forEach((art) => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title">${art.nombre_artículo}</h5>
              <p class="card-text">Cantidad: ${art.cantidad_artículo}</p>
              <p class="card-text">Precio: $${art.precio_artículo}</p>
              <p class="card-text">Costo: $${art.costo_artículo}</p>
              <p class="card-text">Proveedor: ${art.Proveedor_id_proveedor}</p>
              <button class="btn btn-warning add-to-cart-btn" data-id="${art.id_artículo}">Agregar al carrito</button>
            </div>
          </div>
        `;
        productGrid.appendChild(card);
      });
      
      // Vincular evento de agregar al carrito a todos los botones
      document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
          const idArticulo = this.getAttribute('data-id');
          try {
            const res = await fetch('http://localhost:3000/api/carrito', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ id_articulo: idArticulo })
            });
            
            if (res.ok) {
              alert('Producto agregado al carrito');
            } else {
              alert('Error al agregar al carrito');
            }
          } catch (e) {
            alert('Error de conexión');
          }
        });
      });
    } catch (e) {
      productGrid.innerHTML =
        '<div class="alert alert-danger">Error al cargar artículos</div>';
    }
  }
  cargarArticulos();

  // Configurar acceso al formulario de cotización (como en otras páginas)
  const formularioLinks = document.querySelectorAll('a[href="Formulario.html"]');
  formularioLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      if (!isLoggedIn) {
        e.preventDefault();
        alert("Atención: Debes iniciar sesión.");
      }
      // Si está logueado, se permite ir al formulario normalmente
    });
  });
});