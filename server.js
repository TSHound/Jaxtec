// server.js - Backend Node.js/Express para JAXTEC.
// Este archivo implementa la API REST para login, registro de usuarios, gestión de cotizaciones y conexión a MySQL.

const express = require("express");
const mysql = require("mysql2");
const path = require("path");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator"); // para validaciones

require("dotenv").config(); // usar variables de entorno
const app = express();
const router = express.Router();

// Middleware para permitir CORS y parsear JSON.
app.use(cors());
app.use(express.json());

// Configuración de conexión (podría usar variables de entorno en vez de hardcodear)
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "admin",
  database: process.env.DB_NAME || "jaxtec",
});

db.connect((err) => {
  if (err) {
    console.error("❌ Error al conectar a la base de datos:", err.message);
    process.exit(1);
  }
  console.log("✅ Conexión exitosa a la base de datos JAXTEC");
});

// ===== Ruta: Login de usuario existente =====
// Se corrige ruta sin el dominio completo (solo el path)
app.post(
  "/api/login_usuario",
  // Validaciones básicas antes de consultar la BD
  [
    body("nombre_usuario").notEmpty().withMessage("Usuario requerido"),
    body("contraseña_usuario").notEmpty().withMessage("Contraseña requerida"),
  ],
  async (req, res) => {
    // Validar input //nuevo
    const errors = validationResult(req);
   if (!errors.isEmpty()) {
  return res.status(400).json({ ok: false, errors: errors.array() });
}


    const { nombre_usuario, contraseña_usuario } = req.body;
    try {
      const sql =
        "SELECT id_usuario, nombre_usuario, contraseña_usuario FROM usuario WHERE nombre_usuario = ?";
      db.query(sql, [nombre_usuario], async (error, results) => {
        if (error) {
          console.error("❌ Error en la consulta:", error);
          return res
            .status(500)
            .json({ ok: false, error: "Error interno del servidor" });
        }
        if (results.length === 0) {
          // Usuario no encontrado
          return res
            .status(404)
            .json({ ok: false, msg: "Usuario o contraseña incorrectos" });
        }

        const user = results[0];
        // Comparar contraseña
        const match = await bcrypt.compare(
          contraseña_usuario,
          user.contraseña_usuario
        );
        if (!match) {
          return res
            .status(401)
            .json({ ok: false, msg: "Usuario o contraseña incorrectos" });
        }

        // Generar token JWT
        const payload = {
          id_usuario: user.id_usuario,
          nombre_usuario: user.nombre_usuario,
        };
        const secret = process.env.JWT_SECRET || "clave_super_secreta_jaxtec";
        jwt.sign(
          payload,
          secret,
          { expiresIn: process.env.JWT_EXPIRES_IN || "2h" },
          (jwtError, token) => {
            if (jwtError) {
              console.error("❌ Error JWT:", jwtError);
              return res
                .status(500)
                .json({ ok: false, error: "Error al generar token" });
            }
            res.status(200).json({
              ok: true,
              mensaje: "Autenticado",
              id_usuario: user.id_usuario,
              token: token,
            });
          }
        );
      });
    } catch (error) {
      console.error("❌ Error en login:", error);
      return res
        .status(500)
        .json({ ok: false, error: "Error interno del servidor" });
    }
  }
);

// Middleware para verificar el token en rutas protegidas.
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ mensaje: "Token requerido" });

  const token = authHeader.split(" ")[1];
  jwt.verify(
    token,
    process.env.JWT_SECRET || "clave_super_secreta_jaxtec",
    (err, decoded) => {
      if (err) {
        return res.status(401).json({ mensaje: "Token inválido o expirado" });
      }
      req.user = decoded;
      next();
    }
  );
}

// ===== Ruta: Registro de un nuevo usuario =====
app.post(
  "/api/registrar_usuario",
  
  // Validaciones de entrada
  [
    body("nombre_usuario")
      .notEmpty()
      .withMessage("Nombre de usuario obligatorio"),
    body("contraseña_usuario")
      .isLength({ min: 6 })
      .withMessage("La contraseña debe tener al menos 6 caracteres"),
body("teléfono_usuario").isNumeric().withMessage("Teléfono inválido"),
    body("correo_usuario").isEmail().withMessage("Correo electrónico inválido"),
    body("dirección_usuario")
      .notEmpty()
      .withMessage("La dirección es obligatoria"),
  ],
  async (req, res) => {
    // Validar
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({
          ok: false,
          mensaje: "Datos inválidos",
          detalles: errors.array(),
        });
    }

    const {
      nombre_usuario,
      contraseña_usuario,
      teléfono_usuario,
      correo_usuario,
      dirección_usuario,
    } = req.body;

    try {
      // Verificar si ya existe usuario o correo
      const checkQuery =
        "SELECT nombre_usuario, correo_usuario FROM usuario WHERE nombre_usuario = ? OR correo_usuario = ?";
      db.query(
        checkQuery,
        [nombre_usuario, correo_usuario],
        async (err, results) => {
          if (err) {
            console.error("❌ Error en la consulta:", err.message);
            return res
              .status(500)
              .json({ ok: false, mensaje: "Error en la base de datos" });
          }
          if (results.length > 0) {
            // Si el nombre o correo ya existe, responder error
            if (
              results.some((user) => user.nombre_usuario === nombre_usuario)
            ) {
              return res
                .status(400)
                .json({
                  ok: false,
                  mensaje: "El nombre de usuario ya está registrado.",
                });
            }
            if (
              results.some((user) => user.correo_usuario === correo_usuario)
            ) {
              return res
                .status(400)
                .json({
                  ok: false,
                  mensaje: "El correo electrónico ya está registrado.",
                });
            }
          }

          // Hash de la contraseña
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(contraseña_usuario, salt);

          // Insertar nuevo usuario
          const insertQuery = `
          INSERT INTO usuario (
            nombre_usuario,
            contraseña_usuario,
            teléfono_usuario,
            correo_usuario,
            dirección_usuario
          ) VALUES (?, ?, ?, ?, ?)`;
          db.query(
            insertQuery,
            [
              nombre_usuario,
              hashedPassword, // contraseña hasheada
              Number(teléfono_usuario),
              correo_usuario,
              dirección_usuario,
            ],
            (err, results) => {
              if (err) {
                console.error("❌ Error al insertar usuario:", err.message);
                return res
                  .status(500)
                  .json({
                    ok: false,
                    mensaje: "Error al registrar el usuario",
                  });
              }
              // Responder con éxito (201 Created) y mensaje
              res
                .status(201)
                .json({
                  ok: true,
                  mensaje: "¡Usuario registrado exitosamente!",
                });
            }
          );
        }
      );
    } catch (error) {
      console.error("❌ Error inesperado al registrar usuario:", error);
      return res
        .status(500)
        .json({ ok: false, mensaje: "Error interno del servidor" });
    }
  }
);
// Ruta para el registro de una cotización.
app.post("/api/registrar_cotizacion", (req, res) => {
  console.log("Datos recibidos en backend:", req.body);
  const {
    Usuario_id_usuario,
    nombre_usuario,
    placa_vehículo,
    modelo_vehículo,
    año_vehículo,
    tipo_combustible,
    estado_vehículo,
    kilometraje_vehículo,
    ubicación_vehículo,
    fecha_cotización,
    estado_cotización,
    comentarios_cotización,
  } = req.body;
  const insertQuery = `
    INSERT INTO cotización (
      Usuario_id_usuario,
      nombre_usuario,
      placa_vehículo,
      modelo_vehículo,
      año_vehículo,
      tipo_combustible,
      estado_vehículo,
      kilometraje_vehículo,
      ubicación_vehículo,
      fecha_cotización,
      estado_cotización,
      comentarios_cotización
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(
    insertQuery,
    [
      Usuario_id_usuario,
      nombre_usuario,
      placa_vehículo,
      modelo_vehículo,
      Number(año_vehículo),
      tipo_combustible,
      estado_vehículo,
      Number(kilometraje_vehículo),
      ubicación_vehículo,
      fecha_cotización,
      estado_cotización,
      comentarios_cotización,
    ],
    (err, results) => {
      if (err) {
        console.error("❌ Error al registrar la cotización:", err.message);
        return res
          .status(500)
          .json({ mensaje: "Error al registrar la cotización" });
      }
      res.status(200).json({ mensaje: "¡Cotización registrada exitosamente!" });
    }
  );
});

// Ruta para obtener todas las cotizaciones de un usuario.
app.get("/api/cotizacion", (req, res) => {
  const nombre_usuario = req.query.nombre_usuario;
  db.query(
    "SELECT * FROM cotización WHERE nombre_usuario = ?",
    [nombre_usuario],
    (err, results) => {
      if (err) return res.status(500).json({ mensaje: "Error" });
      res.json(results);
    }
  );
});

// Ruta para eliminar una cotización por id.
app.delete("/api/cotizacion/:id_cotización", (req, res) => {
  const id_cotización = req.params.id_cotización;
  db.query(
    "DELETE FROM cotización WHERE id_cotización = ?",
    [id_cotización],
    (err, results) => {
      if (err) return res.status(500).json({ mensaje: "Error" });
      res.sendStatus(200);
    }
  );
});

// === APIs para gestión de artículos (Stock) ===

// Registrar un nuevo artículo
app.post("/api/articulo", (req, res) => {
  const {
    nombre_articulo,
    cantidad_articulo,
    precio_articulo,
    costo_articulo,
    Proveedor_id_proveedor,
  } = req.body;
  if (
    !nombre_articulo ||
    cantidad_articulo == null ||
    precio_articulo == null ||
    costo_articulo == null ||
    !Proveedor_id_proveedor
  ) {
    return res.status(400).json({ mensaje: "Faltan datos obligatorios" });
  }
  const query = `INSERT INTO Artículo (nombre_artículo, cantidad_artículo, precio_artículo, costo_artículo, Proveedor_id_proveedor)
                 VALUES (?, ?, ?, ?, ?)`;
  db.query(
    query,
    [
      nombre_articulo,
      cantidad_articulo,
      precio_articulo,
      costo_articulo,
      Proveedor_id_proveedor,
    ],
    (err, result) => {
      if (err) {
        console.error("Error al registrar artículo:", err.message);
        return res.status(500).json({ mensaje: "Error al registrar artículo" });
      }
      res.status(201).json({ mensaje: "Artículo registrado exitosamente" });
    }
  );
});

// Eliminar un artículo por ID
app.delete("/api/articulo/:id_articulo", (req, res) => {
  const { id_articulo } = req.params;
  db.query(
    "DELETE FROM Artículo WHERE id_artículo = ?",
    [id_articulo],
    (err, result) => {
      if (err) {
        console.error("Error al eliminar artículo:", err.message);
        return res.status(500).json({ mensaje: "Error al eliminar artículo" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ mensaje: "Artículo no encontrado" });
      }
      res.json({ mensaje: "Artículo eliminado exitosamente" });
    }
  );
});

app.put("/api/articulo/:id_articulo", (req, res) => {
  const { id_articulo } = req.params;
  const {
    nombre_articulo,
    cantidad_articulo,
    precio_articulo,
    costo_articulo,
    Proveedor_id_proveedor,
  } = req.body;
  // Solo actualiza los campos que se envían
  const fields = [];
  const values = [];
  if (nombre_articulo !== undefined) {
    fields.push("nombre_artículo = ?");
    values.push(nombre_articulo);
  }
  if (cantidad_articulo !== undefined) {
    fields.push("cantidad_artículo = ?");
    values.push(cantidad_articulo);
  }
  if (precio_articulo !== undefined) {
    fields.push("precio_artículo = ?");
    values.push(precio_articulo);
  }
  if (costo_articulo !== undefined) {
    fields.push("costo_artículo = ?");
    values.push(costo_articulo);
  }
  if (Proveedor_id_proveedor !== undefined) {
    fields.push("Proveedor_id_proveedor = ?");
    values.push(Proveedor_id_proveedor);
  }
  if (fields.length === 0) {
    return res
      .status(400)
      .json({ mensaje: "No se enviaron campos para actualizar" });
  }
  values.push(id_articulo);
  const query = `UPDATE Artículo SET ${fields.join(
    ", "
  )} WHERE id_artículo = ?`;
  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Error al modificar artículo:", err.message);
      return res.status(500).json({ mensaje: "Error al modificar artículo" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Artículo no encontrado" });
    }
    res.json({ mensaje: "Artículo modificado exitosamente" });
  });
});

// Ruta raíz: sirve la página de inicio para probar la conexión.
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "HTML", "Inicio.html"));
});

// Obtener todos los artículos (stock)
app.get("/api/articulo", (req, res) => {
  db.query("SELECT * FROM Artículo", (err, results) => {
    if (err) {
      console.error("Error al obtener artículos:", err.message);
      return res.status(500).json({ mensaje: "Error al obtener artículos" });
    }
    res.json(results);
  });
});

// === APIs para gestión de proveedores ===

// Obtener todos los proveedores (id, nombre, teléfono, correo)
app.get("/api/proveedores", (req, res) => {
  db.query(
    "SELECT id_proveedor, nombre_proveedor, teléfono_proveedor, correo_proveedor FROM proveedor",
    (err, results) => {
      if (err) {
        console.error("Error al obtener proveedores:", err.message);
        return res.status(500).json({ error: "Error al obtener proveedores" });
      }
      res.json(results);
    }
  );
});

// Registrar un nuevo proveedor
app.post("/api/proveedores", (req, res) => {
  const { nombre_proveedor, teléfono_proveedor, correo_proveedor } = req.body;
  if (!nombre_proveedor || !teléfono_proveedor || !correo_proveedor) {
    return res.status(400).json({ mensaje: "Faltan datos obligatorios" });
  }
  const query = `INSERT INTO proveedor (nombre_proveedor, teléfono_proveedor, correo_proveedor) VALUES (?, ?, ?)`;
  db.query(
    query,
    [nombre_proveedor, teléfono_proveedor, correo_proveedor],
    (err, result) => {
      if (err) {
        console.error("Error al registrar proveedor:", err.message);
        return res
          .status(500)
          .json({ mensaje: "Error al registrar proveedor" });
      }
      res.status(201).json({ mensaje: "Proveedor registrado exitosamente" });
    }
  );
});

// Eliminar un proveedor por ID
app.delete("/api/proveedores/:id_proveedor", (req, res) => {
  const { id_proveedor } = req.params;
  db.query(
    "DELETE FROM proveedor WHERE id_proveedor = ?",
    [id_proveedor],
    (err, result) => {
      if (err) {
        console.error("Error al eliminar proveedor:", err.message);
        return res.status(500).json({ mensaje: "Error al eliminar proveedor" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ mensaje: "Proveedor no encontrado" });
      }
      res.json({ mensaje: "Proveedor eliminado exitosamente" });
    }
  );
});

// Modificar atributos de un proveedor por ID
app.put("/api/proveedores/:id_proveedor", (req, res) => {
  const { id_proveedor } = req.params;
  const { nombre_proveedor, teléfono_proveedor, correo_proveedor } = req.body;
  const fields = [];
  const values = [];
  if (nombre_proveedor !== undefined) {
    fields.push("nombre_proveedor = ?");
    values.push(nombre_proveedor);
  }
  if (teléfono_proveedor !== undefined) {
    fields.push("teléfono_proveedor = ?");
    values.push(teléfono_proveedor);
  }
  if (correo_proveedor !== undefined) {
    fields.push("correo_proveedor = ?");
    values.push(correo_proveedor);
  }
  if (fields.length === 0) {
    return res
      .status(400)
      .json({ mensaje: "No se enviaron campos para actualizar" });
  }
  values.push(id_proveedor);
  const query = `UPDATE proveedor SET ${fields.join(
    ", "
  )} WHERE id_proveedor = ?`;
  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Error al modificar proveedor:", err.message);
      return res.status(500).json({ mensaje: "Error al modificar proveedor" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).send("Proveedor no encontrado");
    }
    res.send("Proveedor modificado exitosamente");
  });
});

/*transacciones
// server.js
// server.js
const stripe = require("stripe")(
  "sk_test_51SBf37LNeIluzKqKBSif8eMqAjHFIcPeL1A6zAUolca9aXJkX6HjDSqaXZFn9dNbhxYytRSfC8G7T4YF0ByNuFNu00u0zt6Rv7"
); // tu clave secreta real

app.use(express.json());
app.use(express.static("public")); // Sirve los archivos HTML/JS de la carpeta "public"

// Ruta para crear sesión de Checkout
app.post("/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "mxn",
            product_data: { name: "Producto de prueba" },
            unit_amount: 2000, // $20.00 MXN
          },
          quantity: 1,
        },
      ],
      success_url: "http://localhost:3000/success.html",
      cancel_url: "http://localhost:3000/cancel.html",
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// Opcional: páginas de éxito y cancelación
app.get("/success.html", (req, res) => res.send("<h1>Pago exitoso ✅</h1>"));
app.get("/cancel.html", (req, res) => res.send("<h1>Pago cancelado ❌</h1>"));
*/

// Iniciar el servidor en el puerto 3000.
app.listen(3000, () => {
  console.log("🚀 Servidor corriendo en http://localhost:3000");
});
