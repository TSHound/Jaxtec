// server.js - Backend Node.js/Express para JAXTEC.
// Este archivo implementa la API REST para login, registro de usuarios, gestión de cotizaciones y conexión a MySQL.

const express = require("express");
const mysql = require("mysql2");
const path = require("path");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const nodemailer = require("nodemailer");

require("dotenv").config(); // usar variables de entorno
const app = express();
// Middleware para permitir CORS y parsear JSON.
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/HTML", express.static(path.join(__dirname, "HTML")));
app.use("/js", express.static(path.join(__dirname, "JS")));
app.use("/css", express.static(path.join(__dirname, "CSS")));
app.use("/imagenes", express.static(path.join(__dirname, "Imagenes")));
// Crear router para las API
const apiRouter = express.Router();
app.use('/api', apiRouter);

// Configuración de conexión (podría usar variables de entorno en vez de hardcodear)
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "admin",
  database: process.env.DB_NAME || "jaxtec",
    charset: "utf8mb4",
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
            // Guardar sesión en la BD
            const creado_en = new Date();
            const expira_en = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 horas
            const insertSesion = `
              INSERT INTO 
              sesiónusuario (id_usuario, token_sesión, creado_en, expira_en)
              VALUES (?, ?, ?, ?) 
            `;
            db.query(
              insertSesion,
              [user.id_usuario, token, creado_en, expira_en],
              (sesionErr, sesionResult) => {
                if (sesionErr) {
                  console.error("❌ Error al guardar sesión:", sesionErr.message);
                  // Puedes responder con error o continuar según tu lógica
                  return res.status(500).json({ ok: false, error: "Error al guardar sesión" });
                }
                // Responder al frontend con el token y datos de usuario
                res.status(200).json({
                  ok: true,
                  mensaje: "Autenticado",
                  id_usuario: user.id_usuario,
                  token: token,
                });
              }
            );
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

// ===== Ruta: Enviar correo de recuperación de contraseña =====
app.post("/api/enviar_correo_recuperacion", async (req, res) => {
  const { nombre_usuario } = req.body;

  if (!nombre_usuario) {
    return res.status(400).json({ ok: false, mensaje: "Falta el nombre de usuario." });
  }

  try {
    // 🔹 Obtener correo del usuario usando promesas
    const [rows] = await db.promise().query(
      "SELECT correo_usuario FROM usuario WHERE nombre_usuario = ?",
      [nombre_usuario]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado." });
    }

    const correo_usuario = rows[0].correo_usuario;

    // 🔹 Generar un token temporal (por ejemplo JWT o un UUID)
    const token = jwt.sign(
      { nombre_usuario }, 
      process.env.JWT_SECRET || "clave_secreta_jaxtec", 
      { expiresIn: "1h" } // válido por 1 hora
    );

    // 🔹 Configurar transporter con app password
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER || "jaxtec1@gmail.com",
        pass: process.env.MAIL_PASS || "irwhdznjkrmrozuk",
      },
    });

    await transporter.verify();

    // 🔹 Configurar correo con botón
    const mailOptions = {
      from: `"Soporte JAXTEC" <${process.env.MAIL_USER || "jaxtec1@gmail.com"}>`,
      to: correo_usuario,
      subject: "Recuperación de contraseña - JAXTEC",
      html: `
        <div style="font-family: Arial; background:#fffbe6; border:1px solid #fdd835; border-radius:10px; padding:20px; text-align:center;">
          <h2 style="color:#fdd835;">JAXTEC</h2>
          <p>Hola ${nombre_usuario},</p>
          <p>Haz clic en el botón para restablecer tu contraseña:</p>
          <a href="${process.env.FRONT_URL || "http://localhost:3000"}../contrasena.html?token=${token}" 
             style="display:inline-block; padding:12px 25px; margin:15px 0; background:#fdd835; color:#000; font-weight:bold; text-decoration:none; border-radius:5px;">
             Restablecer Contraseña
          </a>
          <p style="font-size:0.8em; color:#555;">Si no solicitaste este correo, ignóralo.</p>
          <br/>
          <p style="font-size:0.8em; color:#555;">© 2025 JAXTEC</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Correo enviado a:", correo_usuario, info.response);

    res.status(200).json({
      ok: true,
      mensaje: `Correo de recuperación enviado a ${correo_usuario}.`,
      info: info.response,
    });

  } catch (error) {
    console.error("❌ Error al enviar correo de recuperación:", error);
    res.status(500).json({
      ok: false,
      mensaje: "Error al procesar la solicitud de recuperación de contraseña.",
      error: error.message,
    });
  }
});

// ===== Ruta: Cambiar contraseña =====
app.post("/api/cambiar_contrasena", async (req, res) => {
  const { token, nueva_contrasena } = req.body;

  if (!token || !nueva_contrasena) {
    return res.status(400).json({ ok: false, mensaje: "Faltan datos necesarios." });
  }

  try {
    // 🔹 Verificar token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "clave_secreta_jaxtec");
    const nombre_usuario = decoded.nombre_usuario;

    // 🔹 Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(nueva_contrasena, 10);

    // 🔹 Actualizar contraseña en la base de datos
    await db.promise().query(
      "UPDATE usuario SET contraseña_usuario = ? WHERE nombre_usuario = ?",
      [hashedPassword, nombre_usuario]
    );

    res.status(200).json({
      ok: true,
      mensaje: "Contraseña actualizada correctamente."
    });

  } catch (error) {
    console.error("❌ Error al cambiar contraseña:", error);

    let mensaje = "Error al procesar la solicitud.";
    if (error.name === "TokenExpiredError") {
      mensaje = "El enlace ha expirado, solicita uno nuevo.";
    } else if (error.name === "JsonWebTokenError") {
      mensaje = "Token inválido.";
    }

    res.status(400).json({
      ok: false,
      mensaje,
      error: error.message
    });
  }
});


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

// Función para eliminar sesiones expiradas
function limpiarSesionesExpiradas() {
  const ahora = new Date();
  
  db.query(
    'DELETE FROM sesiónusuario WHERE expira_en < ?',
    [ahora],
    (err, result) => {
      if (err) {
        console.error('❌ Error al limpiar sesiones expiradas:', err.message);
        return;
      }
      if (result && result.affectedRows > 0) {
        console.log(`🧹 Sesiones expiradas eliminadas: ${result.affectedRows}`);
      }
    }
  );
}

// Ejecutar limpieza periódicamente (cada hora)
setInterval(limpiarSesionesExpiradas, 60 * 60 * 1000); // 1 hora en milisegundos

// Ejecutar limpieza al iniciar el servidor
limpiarSesionesExpiradas();

// Middleware para verificar JWT
function verificarToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    console.log("No se envió header de autorización");
    return res.status(401).json({ mensaje: "No se envió token" });
  }
  
  const token = authHeader.split(" ")[1];
  if (!token) {
    console.log("No se encontró el token en el header");
    return res.status(401).json({ mensaje: "Token inválido" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "clave_super_secreta_jaxtec");
    req.usuario = decoded;
    next();
  } catch (err) {
    console.log("Error al verificar el token:", err.message);
    return res.status(403).json({ mensaje: "Token inválido" });
  }
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


app.get("/api/usuarios", (req, res) => {
  const query = `
    SELECT 
      id_usuario,
      nombre_usuario,
      contraseña_usuario AS contrasena_usuario,
      correo_usuario,
      teléfono_usuario AS teléfono_usuario,
      dirección_usuario AS direccion_usuario,
      rol_usuario
    FROM usuario
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ Error al obtener usuarios:", err.message);
      return res.status(500).json({ mensaje: "Error al obtener usuarios" });
    }

    res.json(results);
  });
});

// --- Modificar usuario ---
app.put("/api/usuarios/:id", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).send("No autorizado");

  const id = req.params.id;
  const { nombre_usuario, correo_usuario, teléfono_usuario } = req.body;

  if (!nombre_usuario || !correo_usuario || !teléfono_usuario) {
    return res.status(400).send("Faltan datos obligatorios");
  }

  const query = `
    UPDATE usuario
    SET nombre_usuario = ?, correo_usuario = ?, teléfono_usuario = ? 
    WHERE id_usuario = ?
  `;
  db.query(query, [nombre_usuario, correo_usuario, teléfono_usuario, id], (err, result) => {
    if (err) return res.status(500).send("Error al actualizar usuario");
    res.json({ message: "Usuario actualizado correctamente" });
  });
});

// --- Eliminar usuario ---
app.delete("/api/usuarios/:id", verificarToken, async (req, res) => {
  const userId = req.params.id;
  console.log("🗑️ Intentando eliminar usuario ID:", userId);

  try {
    // 1. Verificar si el usuario existe
    const [userExists] = await db.promise().query(
      'SELECT id_usuario, nombre_usuario FROM usuario WHERE id_usuario = ?',
      [userId]
    );

    if (!userExists.length) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    console.log("✅ Usuario encontrado:", userExists[0].nombre_usuario);

    // 2. Verificar registros relacionados en tablas específicas
    let tieneRegistros = false;
    let registrosEncontrados = [];

    // Verificar tabla pedido
    try {
      const [pedidos] = await db.promise().query(
        'SELECT COUNT(*) as count FROM pedido WHERE Usuario_id_usuario = ?',
        [userId]
      );
      if (pedidos[0].count > 0) {
        tieneRegistros = true;
        registrosEncontrados.push(`pedidos: ${pedidos[0].count}`);
      }
    } catch (err) {
      console.error("❌ Error verificando tabla pedido:", err.message);
    }

    // Verificar tabla cotización
    try {
      const [cotizaciones] = await db.promise().query(
        'SELECT COUNT(*) as count FROM cotización WHERE Usuario_id_usuario = ?',
        [userId]
      );
      if (cotizaciones[0].count > 0) {
        tieneRegistros = true;
        registrosEncontrados.push(`cotizaciones: ${cotizaciones[0].count}`);
      }
    } catch (err) {
      console.error("❌ Error verificando tabla cotización:", err.message);
    }

    // Verificar tabla sesiónusuario
    try {
      const [sesiones] = await db.promise().query(
        'SELECT COUNT(*) as count FROM sesiónusuario WHERE id_usuario = ?',
        [userId]
      );
      if (sesiones[0].count > 0) {
        tieneRegistros = true;
        registrosEncontrados.push(`sesiones: ${sesiones[0].count}`);
      }
    } catch (err) {
      console.error("❌ Error verificando tabla sesiónusuario:", err.message);
    }

    // Verificar tabla carrito
    try {
      const [carritos] = await db.promise().query(
        'SELECT COUNT(*) as count FROM carrito WHERE Usuario_id_usuario = ?',
        [userId]
      );
      if (carritos[0].count > 0) {
        tieneRegistros = true;
        registrosEncontrados.push(`carritos: ${carritos[0].count}`);
      }
    } catch (err) {
      console.error("❌ Error verificando tabla carrito:", err.message);
    }

    // 3. Si tiene registros, no permitir eliminación
    if (tieneRegistros) {
      console.log("⚠️ Usuario tiene registros relacionados:", registrosEncontrados);
      return res.status(400).json({ 
        mensaje: "No se puede eliminar el usuario porque tiene registros relacionados",
        detalles: registrosEncontrados
      });
    }

    // 4. Si no tiene registros, proceder a eliminar
    console.log("🗑️ Usuario sin registros relacionados, procediendo a eliminar...");
    const [deleteResult] = await db.promise().query(
      'DELETE FROM usuario WHERE id_usuario = ?',
      [userId]
    );

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado para eliminar" });
    }

    console.log("✅ Usuario eliminado exitosamente");
    res.json({ 
      mensaje: "Usuario eliminado exitosamente",
      usuario_eliminado: userExists[0].nombre_usuario 
    });

  } catch (error) {
    console.error("❌ Error al eliminar usuario:", error);
    res.status(500).json({ 
      mensaje: "Error interno del servidor al eliminar usuario",
      error: error.message 
    });
  }
});


// ===== Ruta: Perfil del usuario logueado =====
app.get("/api/perfil", verifyToken, (req, res) => {
  const userId = req.user.id_usuario; // viene del token
  const query = `
    SELECT id_usuario, nombre_usuario, teléfono_usuario, correo_usuario, dirección_usuario, rol_usuario
    FROM usuario 
    WHERE id_usuario = ?`;
  
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("❌ Error al obtener perfil:", err.message);
      return res.status(500).json({ ok: false, mensaje: "Error interno" });
    }
    if (results.length === 0) {
      return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado" });
    }
    res.json({ ok: true, usuario: results[0] });
  });
});
// Endpoint para obtener datos del usuario autenticado
app.get('/api/perfil_usuario', verificarToken, (req, res) => {
  const id_usuario = req.usuario.id_usuario;
  db.query(
    'SELECT id_usuario, nombre_usuario, correo_usuario, teléfono_usuario, dirección_usuario, rol_usuario FROM usuario WHERE id_usuario = ?',
    [id_usuario],
    (err, results) => {
      if (err) return res.status(500).json({ mensaje: 'Error al obtener usuario' });
      if (!results.length) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
      res.json(results[0]);
    }
  );
});
// ===== Ruta protegida: Registrar una nueva orden =====
app.post("/api/orden", verificarToken, (req, res) => {
  const userId = req.usuario.id_usuario; // del token
  const { items, total } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ mensaje: "Carrito vacío o datos inválidos" });
  }

  // Insertar pedido principal
  const insertPedido = "INSERT INTO pedido (Usuario_id_usuario, fecha_pedido, estado_pedido, precio_total) VALUES (?, NOW(), 'Pendiente', ?)";
  db.query(insertPedido, [userId, total], (err, result) => {
    if (err) {
      console.error("❌ Error al registrar pedido:", err.message);
      return res.status(500).json({ mensaje: "Error al registrar pedido", error: err.message });
    }

    const pedidoId = result.insertId;
    
    // Preparar detalles para inserción múltiple
    const detalles = items.map(item => [
      pedidoId,           // Pedido_id_pedido
      userId,             // Usuario_id_usuario
      item.id,            // Artículo_id_artículo
      item.cantidad,      // cantidad_pedido
      item.precio         // precio_unitario
    ]);
    
    // Insertar detalles en batch
    const insertDetalles = "INSERT INTO pedidodetalle (Pedido_id_pedido, Usuario_id_usuario, Artículo_id_artículo, cantidad_pedido, precio_unitario) VALUES ?";
    db.query(insertDetalles, [detalles], (err2) => {
      if (err2) {
        console.error("❌ Error al registrar detalles del pedido:", err2.message);
        return res.status(500).json({ mensaje: "Error al registrar detalles del pedido", error: err2.message });
      }
      
      // 📦 DESCONTAR CANTIDADES DEL INVENTARIO
      console.log("✅ Detalles insertados, procediendo a descontar inventario...");
      
      // Crear promesas para actualizar cada artículo
      const inventarioPromises = items.map(item => {
        return new Promise((resolve, reject) => {
          // Primero verificar stock actual
          db.query(
            "SELECT cantidad_artículo FROM artículo WHERE id_artículo = ?",
            [item.id],
            (err, stockResult) => {
              if (err) {
                console.error(`❌ Error al verificar stock del artículo ${item.id}:`, err);
                return reject(err);
              }
              
              if (stockResult.length === 0) {
                console.error(`❌ Artículo ${item.id} no encontrado`);
                return reject(new Error(`Artículo ${item.id} no encontrado`));
              }
              
              const stockActual = stockResult[0].cantidad_artículo;
              const nuevaCantidad = stockActual - item.cantidad;
              
              // Verificar que no quede en números negativos
              if (nuevaCantidad < 0) {
                console.warn(`⚠️ Stock insuficiente para artículo ${item.id}. Stock: ${stockActual}, Solicitado: ${item.cantidad}`);
                // Establecer en 0 si queda negativo
                const cantidadFinal = 0;
                
                db.query(
                  "UPDATE artículo SET cantidad_artículo = ? WHERE id_artículo = ?",
                  [cantidadFinal, item.id],
                  (updateErr) => {
                    if (updateErr) {
                      console.error(`❌ Error al actualizar inventario del artículo ${item.id}:`, updateErr);
                      return reject(updateErr);
                    }
                    console.log(`📦 Inventario actualizado: Artículo ${item.id} - Stock anterior: ${stockActual}, Vendido: ${item.cantidad}, Stock final: ${cantidadFinal} (AGOTADO)`);
                    resolve();
                  }
                );
              } else {
                // Stock suficiente, descontar normalmente
                db.query(
                  "UPDATE artículo SET cantidad_artículo = ? WHERE id_artículo = ?",
                  [nuevaCantidad, item.id],
                  (updateErr) => {
                    if (updateErr) {
                      console.error(`❌ Error al actualizar inventario del artículo ${item.id}:`, updateErr);
                      return reject(updateErr);
                    }
                    console.log(`📦 Inventario actualizado: Artículo ${item.id} - Stock anterior: ${stockActual}, Vendido: ${item.cantidad}, Stock final: ${nuevaCantidad}`);
                    resolve();
                  }
                );
              }
            }
          );
        });
      });
      
      // Ejecutar todas las actualizaciones de inventario
      Promise.all(inventarioPromises)
        .then(() => {
          console.log("✅ Inventario actualizado exitosamente para todos los artículos");
          res.json({ 
            ok: true, 
            mensaje: "Pedido registrado con éxito e inventario actualizado", 
            id_pedido: pedidoId 
          });
        })
        .catch((inventarioError) => {
          console.error("❌ Error al actualizar inventario:", inventarioError);
          // El pedido ya se registró, pero hubo error en inventario
          res.json({ 
            ok: true, 
            mensaje: "Pedido registrado con éxito, pero hubo un problema actualizando el inventario", 
            id_pedido: pedidoId,
            advertencia: "Revisar stock manualmente"
          });
        });
    });
  });
});
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
app.get("/api/cotizacion", verificarToken, (req, res) => {
  const id_usuario = req.usuario.id_usuario;
  db.query(
    "SELECT * FROM cotización WHERE Usuario_id_usuario = ?",
    [id_usuario],
    (err, results) => {
      if (err) return res.status(500).json({ mensaje: "Error" });
      res.json(results);
    }
  );
});


// Ruta para eliminar una cotización por id.
app.delete("/api/cotizacion/:id_cotización", verificarToken, (req, res) => {
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

//Endpoint admin cotizaciones - ver TODA la tabla cotización en bruto
app.get("/api/cotizaciones-todas", verificarToken, (req, res) => {
  console.log("🔍 Admin solicitando todas las cotizaciones en bruto");

  // Consulta simple para obtener TODA la tabla cotización sin filtros
  const query = `
    SELECT 
      id_cotización,
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
    FROM cotización
    ORDER BY fecha_cotización DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ Error al obtener todas las cotizaciones:", err);
      return res.status(500).json({ 
        mensaje: "Error al obtener cotizaciones", 
        error: err.message 
      });
    }

    console.log(`✅ Admin: ${results.length} cotizaciones encontradas en total`);
    res.json(results);
  });
});




// === APIs para gestión de artículos (Stock) ===

// Registrar un nuevo artículo
app.post("/api/articulo", (req, res) => {
  const {
    nombre_artículo,
    cantidad_artículo,
    precio_artículo,
    costo_artículo,
    Proveedor_id_proveedor
  } = req.body;
  if (
    !nombre_artículo ||
    cantidad_artículo == null ||
    precio_artículo == null ||
    costo_artículo == null ||
    !Proveedor_id_proveedor
  ) {
    return res.status(400).json({ mensaje: "Faltan datos obligatorios" });
  }
  const query = `INSERT INTO artículo (nombre_artículo, cantidad_artículo, precio_artículo, costo_artículo, Proveedor_id_proveedor)
                 VALUES (?, ?, ?, ?, ?)`;
  db.query(
    query,
    [
      nombre_artículo,
      cantidad_artículo,
      precio_artículo,
      costo_artículo,
      Proveedor_id_proveedor
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
  console.log("🗑️ Eliminando artículo ID:", id_articulo);
  
  db.query(
    "DELETE FROM artículo WHERE id_artículo = ?", // Correcto: tabla con tilde
    [id_articulo],
    (err, result) => {
      if (err) {
        console.error("Error al eliminar artículo:", err.message);
        return res.status(500).json({ mensaje: "Error al eliminar artículo", error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ mensaje: "Artículo no encontrado" });
      }
      console.log(`✅ Artículo ${id_articulo} eliminado exitosamente`);
      res.json({ mensaje: "Artículo eliminado exitosamente", id: id_articulo });
    }
  );
});

app.put("/api/articulo/:id_articulo", (req, res) => {
  const { id_articulo } = req.params; // Corregido: usar id_articulo sin tilde
  const {
    nombre_artículo,
    cantidad_artículo,
    precio_artículo,
    costo_artículo
  } = req.body;
  
  console.log("✏️ Actualizando artículo ID:", id_articulo, "con datos:", req.body);
  
  // Solo actualiza los campos que se envían
  const fields = [];
  const values = [];
  if (nombre_artículo !== undefined) {
    fields.push("nombre_artículo = ?");
    values.push(nombre_artículo);
  }
  if (cantidad_artículo !== undefined) {
    fields.push("cantidad_artículo = ?");
    values.push(cantidad_artículo);
  }
  if (precio_artículo !== undefined) {
    fields.push("precio_artículo = ?");
    values.push(precio_artículo);
  }
  if (costo_artículo !== undefined) {
    fields.push("costo_artículo = ?");
    values.push(costo_artículo);
  }

  if (fields.length === 0) {
    return res
      .status(400)
      .json({ mensaje: "No se enviaron campos para actualizar" });
  }
  values.push(id_articulo);
  const query = `UPDATE artículo SET ${fields.join( // Correcto: tabla con tilde
    ", "
  )} WHERE id_artículo = ?`;
  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Error al modificar artículo:", err.message);
      return res.status(500).json({ mensaje: "Error al modificar artículo", error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Artículo no encontrado" });
    }
    console.log(`✅ Artículo ${id_articulo} actualizado exitosamente`);
    res.json({ mensaje: "Artículo modificado exitosamente", id: id_articulo });
  });
});

// Ruta raíz: sirve la página de inicio para probar la conexión.
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "HTML", "Inicio.html"));
});

// Obtener todos los artículos (stock)
app.get("/api/articulo", (req, res) => {
  // JOIN con la tabla proveedor para obtener el nombre del proveedor
  const query = `
    SELECT 
      a.id_artículo,
      a.nombre_artículo,
      a.cantidad_artículo,
      a.precio_artículo,
      a.costo_artículo,
      a.Proveedor_id_proveedor,
      p.nombre_proveedor
    FROM artículo a
    LEFT JOIN proveedor p ON a.Proveedor_id_proveedor = p.id_proveedor
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ Error al obtener artículos:", err.message);
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
// Endpoint para limpiar manualmente las sesiones expiradas (para administradores)
app.delete('/api/sesiones/expiradas', (req, res) => {
  db.query(
    'DELETE FROM sesiónusuario WHERE expira_en < NOW()',
    (err, result) => {
      if (err) {
        console.error('❌ Error al limpiar sesiones expiradas:', err.message);
        return res.status(500).json({ mensaje: 'Error al limpiar sesiones' });
      }
      res.json({ 
        mensaje: 'Sesiones expiradas eliminadas', 
        eliminadas: result.affectedRows 
      });
    }
  );
});

app.listen(3000, () => {
  console.log("🚀 Servidor corriendo en http://localhost:3000");
});

// Endpoint para agregar producto al carrito del usuario autenticado (modelo: un solo carrito activo)
app.post('/api/carrito', verificarToken, (req, res) => {
  const id_usuario = req.usuario.id_usuario;
  const { id_articulo, cantidad = 1 } = req.body;
  
  if (!id_articulo) {
    console.error('❌ Falta id_articulo en el body');
    return res.status(400).json({ mensaje: 'Falta id_articulo' });
  }
  
  console.log('🛒 Usuario:', id_usuario, 'Artículo:', id_articulo, 'Cantidad:', cantidad);


  // Función para manejar la inserción en carritodetalle
  const insertarDetalle = (id_carrito) => {
    console.log('Insertando detalle, carrito:', id_carrito, 'artículo:', id_articulo, 'usuario:', id_usuario);
    
    // Verificar si el producto ya existe en el carrito
    db.query(
      'SELECT cantidad_carrito FROM carritodetalle WHERE Carrito_id_carrito = ? AND Artículo_id_artículo = ? AND Usuario_id_usuario = ?',
      [id_carrito, id_articulo, id_usuario],
      (err3, detalle) => {
        if (err3) {
          console.error('❌ Error al buscar detalle:', err3.message);
          return res.status(500).json({ mensaje: 'Error al buscar detalle', error: err3.message });
        }
        
        if (detalle.length) {
          // Si ya existe, sumar cantidad
          db.query(
            'UPDATE carritodetalle SET cantidad_carrito = cantidad_carrito + ? WHERE Carrito_id_carrito = ? AND Artículo_id_artículo = ? AND Usuario_id_usuario = ?',
            [cantidad, id_carrito, id_articulo, id_usuario],
            (err4) => {
              if (err4) {
                console.error('❌ Error al actualizar cantidad:', err4.message);
                return res.status(500).json({ mensaje: 'Error al actualizar cantidad', error: err4.message });
              }
              res.json({ mensaje: 'Cantidad actualizada en el carrito' });
            }
          );
        } else {
          // Si no existe, insertar nuevo detalle
          db.query(
            'INSERT INTO carritodetalle (Carrito_id_carrito, Usuario_id_usuario, Artículo_id_artículo, cantidad_carrito) VALUES (?, ?, ?, ?)',
            [id_carrito, id_usuario, id_articulo, cantidad],
            (err5) => {
              if (err5) {
                console.error('❌ Error al agregar al carrito:', err5.message);
                return res.status(500).json({ mensaje: 'Error al agregar al carrito', error: err5.message });
              }
              res.json({ mensaje: 'Producto agregado al carrito' });
            }
          );
        }
      }
    );
  };

  // 1. Buscar carrito activo del usuario
  db.query(
    'SELECT id_carrito FROM carrito WHERE Usuario_id_usuario = ? ORDER BY fecha_carrito DESC LIMIT 1',
    [id_usuario],
    (err, results) => {
      if (err) {
        console.error('❌ Error al buscar carrito:', err.message);
        return res.status(500).json({ mensaje: 'Error al buscar carrito', error: err.message });
      }
      
      if (results.length) {
        // Si existe un carrito, usar ese
        const id_carrito = results[0].id_carrito;
        insertarDetalle(id_carrito);
      } else {
        // Si no existe, crear uno nuevo
        db.query(
          'INSERT INTO carrito (fecha_carrito, Usuario_id_usuario) VALUES (NOW(), ?)',
          [id_usuario],
          (err2, result2) => {
            if (err2) {
              console.error('❌ Error al crear carrito:', err2.message);
              return res.status(500).json({ mensaje: 'Error al crear carrito', error: err2.message });
            }
            const id_carrito = result2.insertId;
            insertarDetalle(id_carrito);
          }
        );
      }
    }
  );
});
// 🟢 Fusionar carrito temporal del cliente con el carrito del usuario logueado
app.post('/api/carrito/merge', verificarToken, async (req, res) => {
  const id_usuario = req.usuario.id_usuario;
  const { productos } = req.body; // productos = [id_articulo1, id_articulo2, ...]

  if (!productos || !Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({ mensaje: "No se enviaron productos válidos para fusionar" });
  }

  try {
    // 1. Buscar o crear carrito del usuario
    const [carrito] = await db.promise().query(
      'SELECT id_carrito FROM carrito WHERE Usuario_id_usuario = ? ORDER BY fecha_carrito DESC LIMIT 1',
      [id_usuario]
    );

    let id_carrito;
    if (carrito.length) {
      id_carrito = carrito[0].id_carrito;
    } else {
      const [nuevo] = await db.promise().query(
        'INSERT INTO carrito (fecha_carrito, Usuario_id_usuario) VALUES (NOW(), ?)',
        [id_usuario]
      );
      id_carrito = nuevo.insertId;
    }

    // 2. Insertar productos (evitando duplicados)
    for (const id_articulo of productos) {
      // Verificar si ya existe el producto en el carrito
      const [existe] = await db.promise().query(
        'SELECT cantidad_carrito FROM carritodetalle WHERE Carrito_id_carrito = ? AND Artículo_id_artículo = ? AND Usuario_id_usuario = ?',
        [id_carrito, id_articulo, id_usuario]
      );

      if (existe.length) {
        // Si ya existe, incrementa cantidad en 1
        await db.promise().query(
          'UPDATE carritodetalle SET cantidad_carrito = cantidad_carrito + 1 WHERE Carrito_id_carrito = ? AND Artículo_id_artículo = ? AND Usuario_id_usuario = ?',
          [id_carrito, id_articulo, id_usuario]
        );
      } else {
        // Si no existe, lo inserta con cantidad = 1
        await db.promise().query(
          'INSERT INTO carritodetalle (Carrito_id_carrito, Usuario_id_usuario, Artículo_id_artículo, cantidad_carrito) VALUES (?, ?, ?, 1)',
          [id_carrito, id_usuario, id_articulo]
        );
      }
    }

    console.log(`✅ Carrito fusionado correctamente para usuario ${id_usuario}`);
    res.json({ mensaje: "Carrito fusionado correctamente" });

  } catch (error) {
    console.error("❌ Error al fusionar carrito temporal:", error.message);
    res.status(500).json({ mensaje: "Error al fusionar carrito temporal", error: error.message });
  }
});

// Obtener el carrito actual del usuario con sus productos
app.get('/api/carrito/actual', verificarToken, async (req, res) => {
  const id_usuario = req.usuario.id_usuario;
  console.log('📦 Obteniendo carrito para usuario:', id_usuario);
  
  try {
    // Primero obtener el carrito más reciente del usuario
    const [carritos] = await db.promise().query(
      'SELECT id_carrito FROM carrito WHERE Usuario_id_usuario = ? ORDER BY fecha_carrito DESC LIMIT 1',
      [id_usuario]
    );

    if (!carritos.length) {
      console.log('No se encontró carrito para el usuario');
      return res.json([]); // Retornar array vacío si no hay carrito
    }

    const id_carrito = carritos[0].id_carrito;
    console.log('ID del carrito encontrado:', id_carrito);

    // Obtener los productos del carrito
    const query = `
      SELECT 
        cd.Carrito_id_carrito,
        cd.Artículo_id_artículo,
        cd.cantidad_carrito,
        a.nombre_artículo,
        a.precio_artículo,
        c.fecha_carrito
      FROM carritodetalle cd
      JOIN carrito c ON c.id_carrito = cd.Carrito_id_carrito
      JOIN artículo a ON a.id_artículo = cd.Artículo_id_artículo
      WHERE cd.Carrito_id_carrito = ?`;

    const [productos] = await db.promise().query(query, [id_carrito]);
    console.log('Productos encontrados:', productos.length);
    res.json(productos);

  } catch (error) {
    console.error('❌ Error al obtener productos del carrito:', error);
    return res.status(500).json({ 
      mensaje: 'Error al obtener productos del carrito',
      error: error.message 
    });
  }
});


// Actualizar cantidad de un producto en el carrito
app.put('/api/carrito/:id_articulo', verificarToken, (req, res) => {
  const id_usuario = req.usuario.id_usuario;
  const id_articulo = req.params.id_articulo;
  const { cantidad } = req.body;
  
  if (!cantidad || isNaN(parseInt(cantidad)) || parseInt(cantidad) < 1) {
    return res.status(400).json({ mensaje: 'Cantidad inválida' });
  }
  
  // Primero obtener el carrito activo
  db.query('SELECT id_carrito FROM carrito WHERE Usuario_id_usuario = ? ORDER BY fecha_carrito DESC LIMIT 1', [id_usuario], (err, results) => {
    if (err) return res.status(500).json({ mensaje: 'Error al buscar carrito' });
    if (!results.length) return res.status(404).json({ mensaje: 'Carrito no encontrado' });
    
    const id_carrito = results[0].id_carrito;
    
    // Actualizar la cantidad del producto
    db.query(
      'UPDATE carritodetalle SET cantidad_carrito = ? WHERE Carrito_id_carrito = ? AND Artículo_id_artículo = ? AND Usuario_id_usuario = ?',
      [parseInt(cantidad), id_carrito, id_articulo, id_usuario],
      (err2, result) => {
        if (err2) {
          console.error('❌ Error al actualizar cantidad:', err2);
          return res.status(500).json({ mensaje: 'Error al actualizar cantidad' });
        }
        
        if (result.affectedRows === 0) {
          return res.status(404).json({ mensaje: 'Producto no encontrado en el carrito' });
        }
      }
    );
  });
});

// Endpoint para vaciar el carrito del usuario
app.delete('/api/carrito/vaciar', verificarToken, (req, res) => {
  const id_usuario = req.usuario.id_usuario;
  
  console.log('🗑️ Vaciando carrito del usuario:', id_usuario);
  
  // 1. Obtener el carrito activo del usuario
  db.query('SELECT id_carrito FROM carrito WHERE Usuario_id_usuario = ? ORDER BY fecha_carrito DESC LIMIT 1', 
    [id_usuario], 
    (err, results) => {
      if (err) {
        console.error('❌ Error al buscar carrito para vaciar:', err.message);
        return res.status(500).json({ mensaje: 'Error al buscar carrito' });
      }
      
      if (!results.length) {
        return res.status(404).json({ mensaje: 'Carrito no encontrado' });
      }
      
      const id_carrito = results[0].id_carrito;
      
      // 2. Eliminar todos los productos del carrito
      db.query('DELETE FROM carritodetalle WHERE Carrito_id_carrito = ? AND Usuario_id_usuario = ?', [id_carrito, id_usuario], (err2, result) => {
        if (err2) {
          console.error('❌ Error al vaciar carrito:', err2.message);
          return res.status(500).json({ mensaje: 'Error al vaciar carrito' });
        }
        
        console.log('Carrito vaciado exitosamente, elementos eliminados:', result.affectedRows);
        res.json({ 
          mensaje: 'Carrito vaciado exitosamente',
          eliminados: result.affectedRows
        });
      });
    }
  );
});

// Endpoint para eliminar un producto del carrito
app.delete('/api/carrito/:id_articulo', verificarToken, async (req, res) => {
  const id_usuario = req.usuario.id_usuario;
  const id_articulo = req.params.id_articulo;
  
  console.log('🗑️ Eliminando artículo:', id_articulo, 'del carrito del usuario:', id_usuario);

  try {
    // 1. Obtener el carrito activo del usuario
    const [carritos] = await db.promise().query(
      'SELECT id_carrito FROM carrito WHERE Usuario_id_usuario = ? ORDER BY fecha_carrito DESC LIMIT 1',
      [id_usuario]
    );

    if (!carritos.length) {
      console.log('No se encontró carrito para el usuario');
      return res.status(404).json({ mensaje: 'Carrito no encontrado' });
    }

    const id_carrito = carritos[0].id_carrito;
    console.log('Carrito encontrado:', id_carrito);

    // 2. Eliminar el producto del carrito
    const [result] = await db.promise().query(
      'DELETE FROM carritodetalle WHERE Carrito_id_carrito = ? AND Artículo_id_artículo = ? AND Usuario_id_usuario = ?',
      [id_carrito, id_articulo, id_usuario]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Producto no encontrado en el carrito' });
    }

    console.log('Producto eliminado exitosamente');
    res.json({ mensaje: 'Producto eliminado del carrito' });

  } catch (error) {
    console.error('❌ Error al eliminar producto del carrito:', error);
    res.status(500).json({ 
      mensaje: 'Error al eliminar el producto',
      error: error.message 
    });
  }
});

// Endpoint para obtener los productos del carrito del usuario autenticado
app.get("/api/carritodetalle/usuario", verificarToken, (req, res) => {
  const id_usuario = req.usuario.id_usuario;
  // Buscar el carrito activo del usuario
  db.query(
    "SELECT id_carrito FROM carrito WHERE Usuario_id_usuario = ? ORDER BY fecha_carrito DESC LIMIT 1",
    [id_usuario],
    (err, result) => {
      if (err) return res.status(500).json({ mensaje: "Error al buscar carrito" });
      if (result.length === 0) return res.json([]); // No hay carrito
      const id_carrito = result[0].id_carrito;
      // Buscar los productos del carrito
      db.query(
        `SELECT 
          cd.Artículo_id_artículo AS id_articulo,
          a.nombre_artículo AS nombre_artículo,
          a.precio_artículo AS precio_artículo,
          cd.cantidad_carrito
        FROM carritodetalle cd
        JOIN artículo a ON cd.Artículo_id_artículo = a.id_artículo
        WHERE cd.Carrito_id_carrito = ?`,
        [id_carrito],
        (err2, productos) => {
          if (err2) return res.status(500).json({ mensaje: "Error al obtener productos del carrito" });
          res.json(productos);
        }
      );
    }
  );
});

// Middleware verificarToken debe asignar req.usuario = { id_usuario, rol_usuario }

// ✅ Obtener todos los pedidos del usuario autenticado
app.get("/api/pedidos_usuario", verificarToken, (req, res) => {
  const id_usuario = req.usuario.id_usuario;
  console.log("Buscando pedidos para el usuario:", id_usuario);

  const sql = `
    SELECT 
      id_pedido,
      fecha_pedido,
      estado_pedido,
      precio_total
    FROM pedido
    WHERE Usuario_id_usuario = ?
    ORDER BY fecha_pedido DESC
  `;

  db.query(sql, [id_usuario], (err, results) => {
    if (err) {
      console.error("Error en consulta SQL:", err);
      return res.status(500).json({ 
        mensaje: "Error al obtener los pedidos", 
        error: err.message 
      });
    }

    console.log(`Encontrados ${results.length} pedidos para usuario ${id_usuario}`);
    res.json(results);
  });
});
// ✅ Obtener detalles de un pedido
app.get("/api/pedidos/:id/detalles", verificarToken, (req, res) => {
  const id_pedido = req.params.id;
  const userId = req.usuario.id_usuario;
  const isAdmin = req.usuario.rol_usuario?.toLowerCase() === "admin";

  const sql = `
    SELECT 
      pd.Pedido_id_pedido,
      pd.Artículo_id_artículo,
      pd.cantidad_pedido,
      pd.precio_unitario,
      p.Usuario_id_usuario,
      a.nombre_artículo
    FROM pedidodetalle pd
    JOIN pedido p ON pd.Pedido_id_pedido = p.id_pedido
    LEFT JOIN artículo a ON pd.Artículo_id_artículo = a.id_artículo
    WHERE p.id_pedido = ?
  `;

  db.query(sql, [id_pedido], (err, results) => {
    if (err) {
      console.error("❌ Error al obtener detalles del pedido:", err);
      return res.status(500).json({ mensaje: "Error al obtener los detalles del pedido" });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ mensaje: "Pedido no encontrado" });
    }

    // Restringir solo a usuarios normales
    if (!isAdmin && results[0].Usuario_id_usuario !== userId) {
      return res.status(403).json({ mensaje: "No autorizado para ver este pedido" });
    }

    res.json(results);
  });
});

// ✅ Obtener todos los pedidos
app.get("/api/pedido", verificarToken, (req, res) => {
  const userId = req.usuario.id_usuario;
  const isAdmin = req.usuario.rol_usuario?.toLowerCase() === "admin";

  let query = `
    SELECT 
      p.id_pedido, 
      p.Usuario_id_usuario, 
      p.fecha_pedido AS fecha, 
      p.estado_pedido AS estado, 
      p.precio_total AS total, 
      u.nombre_usuario
    FROM pedido p
    JOIN usuario u ON u.id_usuario = p.Usuario_id_usuario
  `;
  const params = [];

  // Solo filtrar por usuario si NO es admin
  if (!isAdmin) {
    query += " WHERE p.Usuario_id_usuario = ?";
    params.push(userId);
  }

  query += " ORDER BY p.fecha_pedido DESC";

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("❌ Error al obtener pedidos:", err);
      return res.status(500).json({ mensaje: "Error al obtener pedidos" });
    }

    // Siempre devolver un array (vacío si no hay pedidos)
    res.json(results || []);
  });
});

// ✅ Nuevo endpoint para admin - obtener TODOS los pedidos del sistema (formato igual a PerfilUsuario)
app.get("/api/admin/pedidos", verificarToken, (req, res) => {
  console.log("🔍 Admin solicitando todos los pedidos del sistema");

  const sql = `
    SELECT 
      id_pedido,
      fecha_pedido,
      estado_pedido,
      precio_total
    FROM pedido
    ORDER BY fecha_pedido DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Error en consulta SQL (admin pedidos):", err);
      return res.status(500).json({ 
        mensaje: "Error al obtener todos los pedidos", 
        error: err.message 
      });
    }

    console.log(`✅ Admin: ${results.length} pedidos encontrados en total`);
    res.json(results);
  });
});

// ✅ Nuevo endpoint para admin - obtener detalles de cualquier pedido sin restricciones
app.get("/api/admin/pedidos/:id/detalles", verificarToken, (req, res) => {
  const pedidoId = req.params.id;
  console.log("🔍 Admin solicitando detalles del pedido:", pedidoId);

  const query = `
    SELECT 
      pd.Pedido_id_pedido,
      pd.Artículo_id_artículo,
      pd.cantidad_pedido,
      pd.precio_unitario,
      pd.Usuario_id_usuario,
      a.nombre_artículo
    FROM pedidodetalle pd
    JOIN artículo a ON pd.Artículo_id_artículo = a.id_artículo
    WHERE pd.Pedido_id_pedido = ?
    ORDER BY pd.Artículo_id_artículo
  `;

  db.query(query, [pedidoId], (err, results) => {
    if (err) {
      console.error("❌ Error al consultar detalles del pedido (admin):", err);
      return res.status(500).json({ 
        mensaje: "Error al consultar detalles", 
        error: err.message 
      });
    }

    if (results.length === 0) {
      console.log(`⚠️ No se encontraron detalles para el pedido ${pedidoId}`);
      return res.status(404).json({ 
        mensaje: "No se encontraron detalles para este pedido" 
      });
    }

    console.log(`✅ Admin: ${results.length} detalles encontrados para pedido ${pedidoId}`);
    res.json(results);
  });
});

// ✅ Nuevo endpoint para admin - actualizar estado de pedido
app.put("/api/admin/pedidos/:id/estado", verificarToken, (req, res) => {
  const pedidoId = req.params.id;
  const { estado_pedido } = req.body;
  
  console.log(`✏️ Admin cambiando estado del pedido ${pedidoId} a: ${estado_pedido}`);

  if (!estado_pedido) {
    return res.status(400).json({ mensaje: "Debe proporcionar el nuevo estado" });
  }

  const query = "UPDATE pedido SET estado_pedido = ? WHERE id_pedido = ?";

  db.query(query, [estado_pedido, pedidoId], (err, result) => {
    if (err) {
      console.error("❌ Error al actualizar estado del pedido:", err);
      return res.status(500).json({ 
        mensaje: "Error al actualizar estado", 
        error: err.message 
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        mensaje: "Pedido no encontrado" 
      });
    }

    console.log(`✅ Estado del pedido ${pedidoId} actualizado a ${estado_pedido}`);
    res.json({ 
      mensaje: "Estado actualizado exitosamente",
      id: pedidoId,
      nuevo_estado: estado_pedido 
    });
  });
});

// ✅ Nuevo endpoint para admin - actualizar estado de cotización
app.put("/api/admin/cotizaciones/:id/estado", verificarToken, (req, res) => {
  const cotizacionId = req.params.id;
  const { estado_cotización } = req.body;
  
  console.log(`✏️ Admin cambiando estado de la cotización ${cotizacionId} a: ${estado_cotización}`);

  if (!estado_cotización) {
    return res.status(400).json({ mensaje: "Debe proporcionar el nuevo estado" });
  }

  const query = "UPDATE cotización SET estado_cotización = ? WHERE id_cotización = ?";

  db.query(query, [estado_cotización, cotizacionId], (err, result) => {
    if (err) {
      console.error("❌ Error al actualizar estado de la cotización:", err);
      return res.status(500).json({ 
        mensaje: "Error al actualizar estado", 
        error: err.message 
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        mensaje: "Cotización no encontrada" 
      });
    }

    console.log(`✅ Estado de la cotización ${cotizacionId} actualizado a ${estado_cotización}`);
    res.json({ 
      mensaje: "Estado actualizado exitosamente",
      id: cotizacionId,
      nuevo_estado: estado_cotización 
    });
  });
});
