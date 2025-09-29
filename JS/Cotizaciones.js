// Ejemplo de datos simulados (en un caso real, se traerían con AJAX o API)
const cotizaciones = [
  {
    usuario: "juanperez",
    placas: "ABC1234",
    modelo: "JAXTEC Model X",
    año: 2023,
    combustible: "Gasolina",
    estado: "Nuevo",
    kilometraje: 0,
    ubicacion: "Ciudad de México",
    fecha: "2025-08-12",
    comentarios: "Entrega rápida por favor",
  },
  {
    usuario: "mariar",
    placas: "XYZ5678",
    modelo: "JAXTEC Model Y",
    año: 2022,
    combustible: "Diesel",
    estado: "Usado",
    kilometraje: 25000,
    ubicacion: "Monterrey",
    fecha: "2025-08-10",
    comentarios: "",
  },
  // Más cotizaciones...
];

const tbody = document.getElementById("cotizacionesBody");
const searchInput = document.getElementById("searchInput");

function renderCotizaciones(list) {
  tbody.innerHTML = "";
  if (list.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="11" class="text-center text-warning">No se encontraron cotizaciones.</td></tr>';
    return;
  }
  list.forEach((cot) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${cot.usuario}</td>
      <td>${cot.placas}</td>
      <td>${cot.modelo}</td>
      <td>${cot.año}</td>
      <td>${cot.combustible}</td>
      <td>${cot.estado}</td>
      <td>${cot.kilometraje}</td>
      <td>${cot.ubicacion}</td>
      <td>${cot.fecha}</td>
      <td>${cot.comentarios || "-"}</td>
      <td><button class="btn-delete" data-user="${cot.usuario}" data-placas="${cot.placas}">Eliminar</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// Filtrado básico por usuario, placa o modelo
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  const filtered = cotizaciones.filter(
    (c) =>
      c.usuario.toLowerCase().includes(query) ||
      c.placas.toLowerCase().includes(query) ||
      c.modelo.toLowerCase().includes(query)
  );
  renderCotizaciones(filtered);
});

// Manejo de eliminar cotización (solo simulación)
tbody.addEventListener("click", (e) => {
  if (e.target.classList.contains("btn-delete")) {
    const user = e.target.getAttribute("data-user");
    const placas = e.target.getAttribute("data-placas");
    if (confirm(`¿Eliminar cotización de ${user} con placas ${placas}?`)) {
      // Aquí eliminarías la cotización desde el backend o base de datos
      const index = cotizaciones.findIndex(
        (c) => c.usuario === user && c.placas === placas
      );
      if (index > -1) {
        cotizaciones.splice(index, 1);
        renderCotizaciones(cotizaciones);
      }
    }
  }
});

// Render inicial
renderCotizaciones(cotizaciones);
