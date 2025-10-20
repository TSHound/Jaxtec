document.addEventListener("DOMContentLoaded", async function () {
  const token = sessionStorage.getItem("jwt_token");
  const isLoggedIn = !!token;

  if (!isLoggedIn) {
    alert("Debes iniciar sesión");
    return;
  }

  // --- Mostrar nombre del usuario logueado ---
  async function mostrarNombreUsuario() {
    try {
      const res = await fetch("http://localhost:3000/api/perfil_usuario", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        console.error("No se pudo obtener perfil:", res.status, await res.text());
        return;
      }

      const userData = await res.json();
      const navbar = document.querySelector(".navbar-collapse");
      if (navbar) {
        const userDiv = document.createElement("div");
        userDiv.className = "ms-auto bienvenido-usuario";
        userDiv.textContent = `Bienvenido, ${userData.nombre_usuario || "usuario"}`;
        navbar.appendChild(userDiv);
      }
    } catch (e) {
      console.error("Error al obtener información del usuario:", e);
    }
  }
  mostrarNombreUsuario();

  // --- Cargar usuarios ---
  const usuariosTableBody = document.getElementById("usuariosTableBody");

  async function cargarUsuarios() {
    try {
      const res = await fetch("http://localhost:3000/api/usuarios", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error al obtener usuarios: ${res.status} ${text}`);
      }

      const usuarios = await res.json();
      usuariosTableBody.innerHTML = "";

      if (!usuarios.length) {
        usuariosTableBody.innerHTML = `
          <tr>
            <td colspan="8" class="text-center text-muted">No hay usuarios registrados</td>
          </tr>`;
        return;
      }

      usuarios.forEach((usuario) => {
        const fila = document.createElement("tr");

        const hash = usuario.contrasena_usuario || "";
        const hashVisible = hash.length > 10 ? hash.slice(0, 10) + "..." : hash;

        // Crear botones
        const btnModificar = document.createElement("button");
        btnModificar.className = "btn btn-warning btn-sm me-1 btn-modificar";
        btnModificar.textContent = "Modificar";
        btnModificar.dataset.id = usuario.id_usuario;

        const btnEliminar = document.createElement("button");
        btnEliminar.className = "btn btn-danger btn-sm btn-eliminar";
        btnEliminar.textContent = "Eliminar";
        btnEliminar.dataset.id = usuario.id_usuario;

        fila.innerHTML = `
          <td>${usuario.id_usuario}</td>
          <td>${usuario.nombre_usuario}</td>
          <td class="password-cell" data-password="${hash}">${hashVisible}</td>
          <td>${usuario.teléfono_usuario}</td>
          <td>${usuario.direccion_usuario}</td>
          <td>${usuario.correo_usuario}</td>
          <td>${usuario.rol_usuario}</td>
          <td class="acciones-cell sticky-column"></td>
        `;

        // Agregar botones a la última columna
        const accionesCell = fila.querySelector(".acciones-cell");
        accionesCell.appendChild(btnModificar);
        accionesCell.appendChild(btnEliminar);

        usuariosTableBody.appendChild(fila);
      });
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      usuariosTableBody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center text-danger">Error al cargar los usuarios</td>
        </tr>`;
    }
  }
  cargarUsuarios();

  // --- Modales ---
  const modalPassword = document.getElementById("passwordModal");
  const modalModificar = document.getElementById("modificarModal");
  const modalEliminar = document.getElementById("eliminarModal");
  const modalText = document.getElementById("passwordModalText");
  const closeButtons = document.querySelectorAll(".modal-close");

  closeButtons.forEach((btn) =>
    btn.addEventListener("click", () =>
      btn.closest(".modal-overlay").classList.remove("show")
    )
  );

  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      e.target.classList.remove("show");
    }

    const cell = e.target.closest(".password-cell");
    if (cell) {
      modalText.textContent = cell.dataset.password || "No disponible";
      modalPassword.classList.add("show");
    }

    const btnModificar = e.target.closest(".btn-modificar");
    if (btnModificar) {
      const id = btnModificar.dataset.id;
      document.getElementById("modificarId").textContent = id;
      modalModificar.classList.add("show");
    }

    const btnEliminar = e.target.closest(".btn-eliminar");
    if (btnEliminar) {
      const id = btnEliminar.dataset.id;
      document.getElementById("eliminarId").textContent = id;
      modalEliminar.classList.add("show");
    }
  });

  // --- Formulario de modificar usuario ---
  const modificarForm = document.getElementById("modificarForm");
  modificarForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("modificarId").textContent;
    const inputs = modificarForm.querySelectorAll(".modal-input");

    const updatedUser = {
      nombre_usuario: inputs[0].value,
      correo_usuario: inputs[1].value,
      teléfono_usuario: inputs[2].value,
    };

    try {
      const res = await fetch(`http://localhost:3000/api/usuarios/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedUser),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error al actualizar usuario: ${res.status} ${text}`);
      }

      alert("Usuario actualizado correctamente");
      modalModificar.classList.remove("show");
      inputs.forEach((input) => (input.value = ""));
      cargarUsuarios();
    } catch (err) {
      console.error(err);
      alert(`No se pudo actualizar el usuario:\n${err.message}`);
    }
  });

  // --- Botón eliminar usuario ---
  const confirmarEliminar = document.getElementById("confirmarEliminar");
  confirmarEliminar.addEventListener("click", async () => {
    const id = document.getElementById("eliminarId").textContent;

    try {
      const res = await fetch(`http://localhost:3000/api/usuarios/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error al eliminar usuario: ${res.status} ${text}`);
      }

      alert("Usuario eliminado correctamente");
      modalEliminar.classList.remove("show");
      cargarUsuarios();
    } catch (err) {
      console.error(err);
      alert(`No se pudo eliminar el usuario:\n${err.message}`);
    }
  });
});
