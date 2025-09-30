document.addEventListener("DOMContentLoaded", function () {
  // Modal login personalizado
  const loginModal = document.getElementById("loginModal");
  const closeLoginModalBtn = document.getElementById("closeLoginModalBtn");
  const formularioLinks = document.querySelectorAll(".formulario-link");

  // Verificar si existe token en sessionStorage
  const token = sessionStorage.getItem("jwt_token");
  let isLoggedIn = !!token; // true si hay token guardado

  formularioLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      if (!isLoggedIn) {
        e.preventDefault();
        loginModal.style.display = "flex";
      } else {
        // si está logueado, navega al formulario real
        // (ajusta la ruta según tu HTML real)
        window.location.href = "Formulario.html";
      }
    });
  });

  closeLoginModalBtn.addEventListener("click", function () {
    loginModal.style.display = "none";
  });

  // Cerrar si clic fuera del contenido
  window.addEventListener("click", function (e) {
    if (e.target === loginModal) loginModal.style.display = "none";
  });

  // --- Cargar artículos desde la API y renderizar grid ---
  async function cargarArticulos() {
    const productGrid = document.getElementById("productGrid");
    if (!token) {
      productGrid.innerHTML =
        '<div class="alert alert-warning">Debes iniciar sesión para ver los productos.</div>';
      return;
    }
    try {
      const res = await fetch("http://localhost:3000/api/articulo", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Error en la petición");
      const articulos = await res.json();
      productGrid.innerHTML = "";
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
      // Vincular evento de agregar al carrito
      document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', async function () {
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

  // --- Mostrar nombre de usuario en la tienda ---
  async function mostrarNombreUsuario() {
    const token = sessionStorage.getItem("jwt_token");
    let isLoggedIn = !!token;

    // Mostrar nombre en navbar si está logueado
    if (isLoggedIn) {
      try {
        const res = await fetch("http://localhost:3000/api/perfil_usuario", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const usuario = await res.json();
          const navbar = document.querySelector(".navbar-collapse");
          if (navbar) {
            const userDiv = document.createElement("div");
            userDiv.className = "ms-3 d-flex align-items-center";
            userDiv.innerHTML = `<span class="fw-bold text-warning">Bienvenido, ${usuario.nombre_usuario}</span>`;
            navbar.appendChild(userDiv);
          }
        }
      } catch (e) {
        // Si falla, no muestra nada
      }
    }
  }

  cargarArticulos();
  mostrarNombreUsuario();
});