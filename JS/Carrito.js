// Función para cargar los productos del carrito del usuario
async function cargarProductosCarrito() {
  const token = sessionStorage.getItem("jwt_token");
  if (!token) {
    console.error("No hay token de autenticación");
    return;
  }

  try {
    // Primero obtenemos el carrito activo del usuario
    const response = await fetch("http://localhost:3000/api/carritodetalle/usuario", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    console.log('Respuesta del servidor:', response.status);
    const responseData = await response.text();
    console.log('Datos recibidos:', responseData);

    if (!response.ok) {
      throw new Error(`Error al obtener el carrito: ${response.status} ${responseData}`);
    }

      const productos = responseData ? JSON.parse(responseData) : [];
      console.log('Productos recibidos:', productos); // Para depuración
      
      const cartItemsContainer = document.getElementById("cartItems");
      cartItemsContainer.innerHTML = ""; // Limpiar el contenedor

      if (!productos || productos.length === 0) {
        cartItemsContainer.innerHTML = '<p>No hay productos en el carrito</p>';
        updateCartSummary(); // Actualizar el resumen con totales en 0
        return;
      }

      // Crear elementos HTML para cada producto
      productos.forEach(producto => {
        const articleElement = document.createElement("article");
        articleElement.className = "cart-item";
        articleElement.setAttribute("data-id", producto.Artículo_id_artículo);
        articleElement.setAttribute("data-price", producto.precio_artículo);
        articleElement.setAttribute("tabindex", "0");      articleElement.innerHTML = `
        <img src="${producto.imagen || 'https://via.placeholder.com/150'}" alt="${producto.nombre_artículo}" />
        <div class="cart-item-details">
          <h5>${producto.nombre_artículo}</h5>
          <p>Precio unitario: $${producto.precio_artículo}</p>
        </div>
        <div class="cart-item-actions">
          <label for="qty-${producto.Artículo_id_artículo}" class="visually-hidden">
            Cantidad de ${producto.nombre_artículo}
          </label>
          <input
            id="qty-${producto.Artículo_id_artículo}"
            type="number"
            min="1"
            value="${producto.cantidad_carrito}"
            aria-describedby="desc-qty-${producto.Artículo_id_artículo}"
          />
          <button class="remove-btn" aria-label="Eliminar ${producto.nombre}">
            &times;
          </button>
        </div>
      `;

      cartItemsContainer.appendChild(articleElement);
    });

    // Actualizar el resumen del carrito
    updateCartSummary();
    
    // Recargar los event listeners para los nuevos elementos
    setupEventListeners();
  } catch (error) {
    console.error("Error al cargar los productos del carrito:", error);
    alert("Error al cargar los productos del carrito");
  }
}

// Función para configurar los event listeners de los elementos del carrito
function setupEventListeners() {
  // Eventos para inputs de cantidad
  document.querySelectorAll('.cart-item input[type="number"]').forEach(input => {
    input.addEventListener("change", async (e) => {
      if (e.target.value < 1) e.target.value = 1;
      
      const cartItem = e.target.closest('.cart-item');
      const productoId = cartItem.getAttribute('data-id');
      const nuevaCantidad = parseInt(e.target.value);
      
      await actualizarCantidadCarrito(productoId, nuevaCantidad);
      updateCartSummary();
    });
  });

  // Evento para botones eliminar
  document.querySelectorAll(".cart-item .remove-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const cartItem = e.target.closest('.cart-item');
      const productoId = cartItem.getAttribute('data-id');
      
      await eliminarDelCarrito(productoId);
      cartItem.remove();
      updateCartSummary();
    });
  });
}

// Función para actualizar la cantidad de un producto en el carrito
async function actualizarCantidadCarrito(productoId, cantidad) {
  const token = sessionStorage.getItem("jwt_token");
  
  try {
    const response = await fetch(`http://localhost:3000/api/carritodetalle/actualizar`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id_articulo: productoId,
        cantidad_carrito: cantidad
      })
    });

    console.log('Respuesta actualización:', response.status);
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Error actualización:', errorData);
      throw new Error("Error al actualizar la cantidad");
    }
  } catch (error) {
    console.error("Error al actualizar la cantidad:", error);
    alert("Error al actualizar la cantidad del producto");
  }
}

// Función para eliminar un producto del carrito
async function eliminarDelCarrito(productoId) {
  const token = sessionStorage.getItem("jwt_token");

  try {
    const response = await fetch(`http://localhost:3000/api/carrito/${productoId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("Error al eliminar el producto");
    }
  } catch (error) {
    console.error("Error al eliminar el producto:", error);
    alert("Error al eliminar el producto del carrito");
  }
}

let token = sessionStorage.getItem("jwt_token");
let isLoggedIn = token !== null; // si hay token => está logueado

// Bloquear el acceso al formulario si no está logueado
document.addEventListener("DOMContentLoaded", function () {
  let token = sessionStorage.getItem("jwt_token");
  let isLoggedIn = !!token; // true si existe

  if (isLoggedIn) {
    cargarProductosCarrito(); // Cargar productos si el usuario está logueado
  }

  document
    .querySelectorAll('a.nav-link[href="Formulario.html"], .checkout-btn')
    .forEach((btn) => {
      btn.addEventListener("click", function (e) {
        if (!isLoggedIn) {
          e.preventDefault();
          alert("Debes iniciar sesión para acceder al carrito y comprar.");
        }
      });
    });
});

// Mostrar información del usuario logueado en el carrito
document.addEventListener('DOMContentLoaded', async function () {
  const token = sessionStorage.getItem('jwt_token');
  if (!token) return;
  try {
    const res = await fetch('http://localhost:3000/api/perfil_usuario', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('No se pudo obtener el perfil');
    const usuario = await res.json();
    // Muestra el nombre y correo en el HTML del carrito
    const infoDiv = document.getElementById('infoUsuarioCarrito');
    if (infoDiv) {
      infoDiv.innerHTML = `
        <p><strong>Usuario:</strong> ${usuario.nombre_usuario}</p>
        <p><strong>Correo:</strong> ${usuario.correo_usuario}</p>
      `;
    }
  } catch (e) {
    const infoDiv = document.getElementById('infoUsuarioCarrito');
    if (infoDiv) infoDiv.innerHTML = '<div class="alert alert-danger">Error al cargar datos de usuario.</div>';
  }
});

  // Actualizar resumen total del carrito
  function updateCartSummary() {
    const cartItems = document.querySelectorAll(".cart-item");
    let subtotal = 0;

    cartItems.forEach((item) => {
      const price = parseFloat(item.getAttribute("data-price"));
      const qtyInput = item.querySelector('input[type="number"]');
      const qty = parseInt(qtyInput.value) || 1;
      subtotal += price * qty;
    });

    const shipping = subtotal > 0 ? 10 : 0; // Ejemplo fijo de envío
    const total = subtotal + shipping;

    document.getElementById(
      "subtotal"
    ).textContent = `Subtotal: $${subtotal.toFixed(2)}`;
    document.getElementById(
      "shipping"
    ).textContent = `Envío: $${shipping.toFixed(2)}`;
    document.getElementById("total").textContent = `Total: $${total.toFixed(
      2
    )}`;
  }

  // Inicializar resumen al cargar página
  updateCartSummary();

  // Eventos para inputs de cantidad
  document
    .querySelectorAll('.cart-item input[type="number"]')
    .forEach((input) => {
      input.addEventListener("change", (e) => {
        if (e.target.value < 1) e.target.value = 1;
        updateCartSummary();
      });
    });

  // Evento para botones eliminar
  document.querySelectorAll(".cart-item .remove-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const item = e.target.closest(".cart-item");
      item.remove();
      updateCartSummary();
    });
  });

  // Manejar el envío del formulario de pago
 document
  .getElementById("paymentForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    let token = sessionStorage.getItem("jwt_token");
    if (!token) {
      alert("Debes iniciar sesión para comprar.");
      return;
    }

    // Construir carrito desde el DOM
    const cartItems = [];
    document.querySelectorAll(".cart-item").forEach((item) => {
      cartItems.push({
        id: item.getAttribute("data-id"),
        nombre: item.querySelector("h5").textContent,
        precio: parseFloat(item.getAttribute("data-price")),
        cantidad: parseInt(item.querySelector('input[type="number"]').value),
      });
    });

    const order = {
      items: cartItems,
      total: document.getElementById("total").textContent.replace("Total: $", ""),
    };

    try {
      const response = await fetch("http://localhost:3000/api/orden", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // 🔑 mandamos el token al backend
        },
        body: JSON.stringify(order),
      });

      const result = await response.json();
      if (response.ok) {
        alert("Compra registrada con éxito. ¡Gracias!");
      } else {
        alert(result.mensaje || "Error al procesar la compra.");
      }
    } catch (err) {
      console.error("Error al enviar orden:", err);
      alert("Error de conexión con el servidor.");
    }
  });