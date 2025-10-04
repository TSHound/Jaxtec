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
  
  // Iniciar carga de productos del carrito
  cargarProductosCarrito();
});

// Función para cargar los productos del carrito del usuario
async function cargarProductosCarrito() {
  const token = sessionStorage.getItem("jwt_token");
  if (!token) {
    console.error("No hay token de autenticación");
    return;
  }

  try {
    // Primero obtenemos el carrito activo del usuario
    const response = await fetch("http://localhost:3000/api/carrito/actual", {
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
        console.log('Procesando producto:', producto); // Debug
        const articleElement = document.createElement("article");
        articleElement.className = "cart-item";
        // Asegurar que tenemos el ID correcto
        const idArticulo = producto.Artículo_id_artículo;
        if (!idArticulo) {
          console.error('Producto sin ID:', producto);
          return;
        }
        articleElement.setAttribute("data-id", idArticulo);
        articleElement.setAttribute("data-price", producto.precio_artículo);
        articleElement.setAttribute("data-quantity", producto.cantidad_carrito);
        articleElement.setAttribute("tabindex", "0");
        articleElement.innerHTML = `
        <img src="${producto.imagen || 'https://placehold.co/150x150'}" alt="${producto.nombre_artículo}" />
        <div class="cart-item-details">
          <h5>${producto.nombre_artículo}</h5>
          <p>Precio unitario: $${producto.precio_artículo}</p>
        </div>
        <div class="cart-item-actions">
          <label for="qty-${idArticulo}" class="visually-hidden">
            Cantidad de ${producto.nombre_artículo}
          </label>
          <input
            id="qty-${idArticulo}"
            type="number"
            min="1"
            value="${producto.cantidad_carrito}"
            aria-describedby="desc-qty-${idArticulo}"
          />
          <button class="remove-btn" 
            data-product-id="${idArticulo}"
            aria-label="Eliminar ${producto.nombre_artículo}">
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
      // Guardar el valor original antes de cualquier operación
      const valorOriginal = e.target.defaultValue;
      
      // Si el valor es vacío o no es un número, revertir y salir
      if (e.target.value === "" || isNaN(parseInt(e.target.value))) {
        e.target.value = valorOriginal || 1;
        alert('Por favor ingresa una cantidad válida');
        return;
      }
      
      // Permitir el valor 0 para eliminar productos
      // Valores negativos se tratan como 0 (eliminar)
      let cantidad = parseInt(e.target.value);
      if (cantidad < 0) {
        cantidad = 0;
        e.target.value = 0;
      }
      
      const cartItem = e.target.closest('.cart-item');
      const productoId = cartItem.getAttribute('data-id');
      const nuevaCantidad = cantidad; // Usar la variable cantidad que ya está parseada
      
      try {
        // Actualizar el defaultValue para que si hay error podamos revertir al nuevo valor
        e.target.defaultValue = nuevaCantidad;
        
        // Si la cantidad es 0, eliminar el producto visualmente y de la base de datos
        if (nuevaCantidad === 0) {
          const cartItem = e.target.closest('.cart-item');
          if (cartItem) {
            // Eliminar visualmente
            cartItem.remove();
            updateCartSummary();
            // Llamar a la API para eliminar en la base de datos
            await eliminarDelCarrito(productoId);
            alert("Producto eliminado del carrito");
            return;
          }
        }
        
        const resultado = await actualizarCantidadCarrito(productoId, nuevaCantidad);
        updateCartSummary();
        
        // Solo mostrar alerta si la cantidad fue actualizada
        if (nuevaCantidad > 0) {
          alert("Cantidad actualizada exitosamente");
        }
      } catch (error) {
        console.error('Error al actualizar cantidad:', error);
        // No mostrar alerta aquí ya que actualizarCantidadCarrito ya lo hace
        
        // Revertir al valor anterior si hay error
        e.target.value = valorOriginal || 1;
        updateCartSummary();
      }
    });
  });

  // Evento para botones eliminar
  document.querySelectorAll(".cart-item .remove-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      try {
        const productoId = btn.getAttribute('data-product-id');
        console.log('Botón eliminar clickeado, ID del producto:', productoId);
        
        if (!productoId) {
          console.error('ID de producto no encontrado');
          throw new Error('ID de producto no encontrado');
        }
        
        // La función eliminarDelCarrito ya se encarga de eliminar el elemento del DOM
        // y de actualizar el resumen del carrito
        await eliminarDelCarrito(productoId);
        
        // Mostrar mensaje de éxito
        alert("Producto eliminado del carrito");
      } catch (error) {
        console.error('Error al procesar el carrito:', error);
        alert('No se pudo procesar la operación. Por favor, intente nuevamente.');
      }
    });
  });
}

// Función para actualizar la cantidad de un producto en el carrito
async function actualizarCantidadCarrito(productoId, cantidad) {
  const token = sessionStorage.getItem("jwt_token");
  
  // Validar la cantidad antes de enviar
  const cantidadNum = parseInt(cantidad);
  
  // Si la cantidad no es un número válido o es menor a 1
  if (isNaN(cantidadNum) || cantidadNum < 1) {
    console.error('Cantidad inválida:', cantidad);
    
    // Si es 0 o menor, eliminar el producto
    if (cantidadNum === 0) {
      console.log('Cantidad es 0, eliminando producto del carrito');
      // Eliminar visualmente antes de llamar a la API
      const cartItem = document.querySelector(`article[data-id="${productoId}"]`);
      if (cartItem) {
        cartItem.remove();
        updateCartSummary();
      }
      return eliminarDelCarrito(productoId);
    }
    
    // Si no es un número, restaurar el valor anterior y mostrar error
    const inputElement = document.querySelector(`article[data-id="${productoId}"] input[type="number"]`);
    if (inputElement) {
      inputElement.value = 1; // Valor por defecto
    }
    alert("Por favor ingresa una cantidad válida");
    return;
  }
  
  try {
    const response = await fetch(`http://localhost:3000/api/carrito/${productoId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        cantidad: cantidadNum
      })
    });

    console.log('Respuesta actualización:', response.status);
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Error actualización:', errorData);
      throw new Error("Error al actualizar la cantidad");
    }
    
    const data = await response.json();
    console.log("Actualización exitosa:", data.mensaje);
    return data;
  } catch (error) {
    console.error("Error al actualizar la cantidad:", error);
    alert("Error al actualizar la cantidad del producto");
    
    // Restaurar valor anterior en caso de error
    const inputElement = document.querySelector(`article[data-id="${productoId}"] input[type="number"]`);
    if (inputElement) {
      inputElement.value = inputElement.defaultValue || 1; // Restaurar al valor anterior o usar 1 como fallback
    }
    throw error;
  }
}

// Función para eliminar un producto del carrito
async function eliminarDelCarrito(productoId) {
  if (!productoId) {
    console.error('ID de producto no proporcionado');
    throw new Error('ID de producto no proporcionado');
  }

  const token = sessionStorage.getItem("jwt_token");
  if (!token) {
    console.error('No hay token de autenticación');
    throw new Error('No hay token de autenticación');
  }
  
  // Eliminar visualmente el producto antes de la petición
  // Primero con data-id
  let productoElement = document.querySelector(`article[data-id="${productoId}"]`);
  // Si no lo encuentra, intentar con el botón eliminar que contiene data-product-id
  if (!productoElement) {
    const btnEliminar = document.querySelector(`.remove-btn[data-product-id="${productoId}"]`);
    if (btnEliminar) {
      productoElement = btnEliminar.closest('.cart-item');
    }
  }
  
  if (productoElement) {
    console.log('Eliminando visualmente el producto:', productoId);
    productoElement.remove(); // Elimina el elemento del DOM inmediatamente
    updateCartSummary(); // Actualizar el resumen del carrito
  }

  try {
    console.log('Enviando petición DELETE para el producto:', productoId);
    const response = await fetch(`http://localhost:3000/api/carrito/${productoId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      responseData = { mensaje: 'Error al procesar la respuesta del servidor' };
    }

    if (!response.ok) {
      console.error('Error del servidor:', responseData);
      throw new Error(responseData.mensaje || 'Error al eliminar el producto');
    }

    console.log('Producto eliminado:', responseData);
    return responseData;
  } catch (error) {
    console.error("Error al eliminar el producto:", error);
    throw error;
  }
}

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
    btn.addEventListener("click", async (e) => {
      const productoId = btn.getAttribute('data-product-id');
      if (productoId) {
        try {
          await eliminarDelCarrito(productoId);
        } catch (error) {
          console.error('Error al eliminar producto:', error);
          alert('Error al eliminar el producto');
        }
      } else {
        console.error('ID de producto no encontrado');
        alert('No se pudo identificar el producto a eliminar');
      }
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
        // Vaciar el carrito en la base de datos
        try {
          const vaciarResponse = await fetch("http://localhost:3000/api/carrito/vaciar", {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (vaciarResponse.ok) {
            console.log('Carrito vaciado en la base de datos');
          } else {
            console.error('Error al vaciar el carrito en la base de datos');
          }
        } catch (vaciarError) {
          console.error('Error al vaciar el carrito:', vaciarError);
        }
        
        alert("Compra registrada con éxito. ¡Gracias!");
        // Actualizar la vista
        document.getElementById("cartItems").innerHTML = "<p>No hay productos en el carrito</p>";
        updateCartSummary();
      } else {
        alert(result.mensaje || "Error al procesar la compra.");
      }
    } catch (err) {
      console.error("Error al enviar orden:", err);
      alert("Error de conexión con el servidor.");
    }
  });

// Evento para el botón "proceder al pago" (envío directo a tablas pedido y pedidodetalle)
document.addEventListener("DOMContentLoaded", function() {
  const btnPago = document.getElementById("procederPagoBtn");
  if (btnPago) {
    btnPago.addEventListener("click", async function() {
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
      
      if (cartItems.length === 0) {
        alert("El carrito está vacío");
        return;
      }
      
      const order = {
        items: cartItems,
        total: document.getElementById("total").textContent.replace("Total: $", ""),
      };
      
      try {
        const response = await fetch("http://localhost:3000/api/orden", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(order),
        });
        
        const result = await response.json();
        if (response.ok) {
          // Vaciar el carrito en la base de datos
          try {
            const vaciarResponse = await fetch("http://localhost:3000/api/carrito/vaciar", {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
            
            if (vaciarResponse.ok) {
              console.log('Carrito vaciado en la base de datos');
            } else {
              console.error('Error al vaciar el carrito en la base de datos');
            }
          } catch (vaciarError) {
            console.error('Error al vaciar el carrito:', vaciarError);
          }
          
          alert("¡Compra registrada con éxito! Tu pedido está en proceso.");
          // Limpiar el carrito visualmente
          document.getElementById("cartItems").innerHTML = "<p>No hay productos en el carrito</p>";
          updateCartSummary();
        } else {
          alert(result.mensaje || "Error al procesar la compra.");
        }
      } catch (err) {
        console.error("Error al enviar orden:", err);
        alert("Error de conexión con el servidor.");
      }
    });
  }
});