// Suponiendo que esta variable indica si el usuario está logueado
// Cambia a true si el usuario ha iniciado sesión
let isLoggedIn = false;

// Bloquear el acceso al formulario si no está logueado
document.addEventListener("DOMContentLoaded", function () {
  document
    .querySelectorAll('a.nav-link[href="Formulario.html"], .checkout-btn')
    .forEach((btn) => {
      btn.addEventListener("click", function (e) {
        if (!isLoggedIn) {
          e.preventDefault(); // Evita la acción normal del enlace o botón
          alert("Debes iniciar sesión para acceder a esta sección.");
        }
      });
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
    .addEventListener("submit", function (e) {
      e.preventDefault();
      // Aquí iría la integración con la API de pago
      alert("Pago procesado correctamente. ¡Gracias por su compra!");
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("paymentModal")
      );
      modal.hide();
    });
});
