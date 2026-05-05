import express from "express";
import nodemailer from "nodemailer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import cors from "cors";
import pg from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DB,
  ssl: { rejectUnauthorized: false },
});

pool.on("error", (err) => console.error("❌ DB Client Error:", err));

const app = express();
const server = createServer(app);

const corsOptions = {
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const io = new Server(server, { cors: corsOptions });

io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);
  socket.on("disconnect", () =>
    console.log(`🔌 Socket disconnected: ${socket.id}`),
  );
});

const notifyClients = (event, data) => {
  io.emit(event, { ...data, timestamp: new Date().toISOString() });
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async () => ({
    folder: "samara-peace-forum",
    allowed_formats: ["jpg", "png", "jpeg", "gif", "webp"],
    transformation: [
      { width: 1200, height: 1200, crop: "limit", quality: "auto" },
    ],
  }),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const memoryStorage = multer.memoryStorage();
const uploadMemory = multer({
  storage: memoryStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  tls: { rejectUnauthorized: false },
});

transporter.verify((error) => {
  if (error) console.error("❌ SMTP Connection Error:", error);
  else console.log("✅ SMTP Server is ready");
});

// --- Middleware ---
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const queryToken = req.query.token;

  if (!authHeader && !queryToken)
    return res.status(401).json({ error: "No token provided" });

  const token = authHeader ? authHeader.split(" ")[1] : queryToken;

  try {
    req.user = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret_key_123",
    );
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

// FIX: verifySuperAdmin now properly chains without swallowing errors
const verifySuperAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Superadmin privileges required" });
    }
    next();
  });
};

// FIX: optional token middleware — attaches user if token present, never blocks
const optionalToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const queryToken = req.query.token;
  const token = authHeader ? authHeader.split(" ")[1] : queryToken;

  if (!token) return next();

  try {
    req.user = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret_key_123",
    );
  } catch {
    // invalid token — treat as unauthenticated
  }
  next();
};

// --- Database Initialization ---
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        image TEXT,
        leader_name TEXT,
        leader_role TEXT,
        description TEXT,
        about_content TEXT,
        mission_content TEXT,
        vision_content TEXT,
        goal_content TEXT
      );

      CREATE TABLE IF NOT EXISTS members (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        category TEXT,
        grade TEXT,
        department TEXT,
        id_number TEXT,
        graduation_year TEXT,
        position TEXT,
        image TEXT,
        id_image TEXT,
        password_hash TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        joined_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO settings (key, value) VALUES ('registrations_enabled', 'true') ON CONFLICT (key) DO NOTHING;

      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author TEXT NOT NULL,
        category TEXT,
        image TEXT,
        images TEXT[],
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) DEFAULT 'admin',
        assigned_union TEXT,
        position TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_name TEXT NOT NULL,
        sender_email TEXT NOT NULL,
        subject TEXT,
        content TEXT NOT NULL,
        category TEXT DEFAULT 'General',
        status VARCHAR(20) DEFAULT 'unread',
        reply_content TEXT,
        replied_at TIMESTAMPTZ,
        replied_by TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS executives (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        phone TEXT,
        department TEXT,
        row_level INTEGER DEFAULT 3,
        icon TEXT DEFAULT 'User',
        image TEXT,
        student_category TEXT,
        telegram TEXT,
        "union" TEXT,
        email TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS resources (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        size TEXT,
        category TEXT NOT NULL,
        url TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS plans (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_by TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS meetings (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        date TIMESTAMPTZ NOT NULL,
        location TEXT,
        category TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'upcoming',
        created_by TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Safe column additions for existing deployments
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='status') THEN
          ALTER TABLE members ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='position') THEN
          ALTER TABLE members ADD COLUMN position TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='images') THEN
          ALTER TABLE posts ADD COLUMN images TEXT[];
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='status') THEN
          ALTER TABLE messages ADD COLUMN status VARCHAR(20) DEFAULT 'unread';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='reply_content') THEN
          ALTER TABLE messages ADD COLUMN reply_content TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='replied_at') THEN
          ALTER TABLE messages ADD COLUMN replied_at TIMESTAMPTZ;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='replied_by') THEN
          ALTER TABLE messages ADD COLUMN replied_by TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admins' AND column_name='assigned_union') THEN
          ALTER TABLE admins ADD COLUMN assigned_union TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admins' AND column_name='position') THEN
          ALTER TABLE admins ADD COLUMN position TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='executives' AND column_name='email') THEN
          ALTER TABLE executives ADD COLUMN email TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='leader_name') THEN
          ALTER TABLE categories ADD COLUMN leader_name TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='leader_role') THEN
          ALTER TABLE categories ADD COLUMN leader_role TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='description') THEN
          ALTER TABLE categories ADD COLUMN description TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='about_content') THEN
          ALTER TABLE categories ADD COLUMN about_content TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='mission_content') THEN
          ALTER TABLE categories ADD COLUMN mission_content TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='vision_content') THEN
          ALTER TABLE categories ADD COLUMN vision_content TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='goal_content') THEN
          ALTER TABLE categories ADD COLUMN goal_content TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='executives' AND column_name='student_category') THEN
          ALTER TABLE executives ADD COLUMN student_category TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='executives' AND column_name='telegram') THEN
          ALTER TABLE executives ADD COLUMN telegram TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='executives' AND column_name='union') THEN
          ALTER TABLE executives ADD COLUMN "union" TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='plans' AND column_name='created_by') THEN
          ALTER TABLE plans ADD COLUMN created_by TEXT;
        END IF;
      END $$;
    `);

    console.log("✅ Database initialized successfully.");
  } catch (err) {
    console.error("❌ DB Init Error:", err);
    throw err;
  }
};

// ==========================================
// AUTH
// ==========================================
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });
  try {
    const result = await pool.query("SELECT * FROM admins WHERE email = $1", [
      email.trim().toLowerCase(),
    ]);
    if (result.rows.length === 0)
      return res.status(401).json({ error: "Invalid credentials" });

    const admin = result.rows[0];
    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role, assigned_union: admin.assigned_union, position: admin.position },
      process.env.JWT_SECRET || "fallback_secret_key_123",
      { expiresIn: "8h" },
    );
    res.json({ token, user: { email: admin.email, role: admin.role, assigned_union: admin.assigned_union, position: admin.position } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// SETTINGS
// ==========================================
app.get("/api/settings", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM settings");
    const settings = rows.reduce(
      (acc, row) => ({ ...acc, [row.key]: row.value }),
      {},
    );
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

app.patch("/api/settings", verifyToken, async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key || value === undefined)
      return res.status(400).json({ error: "Key and value required" });
    const { rows } = await pool.query(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [key, String(value)],
    );
    notifyClients("settings_updated", { key, value });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// ==========================================
// FILE UPLOAD (R2)
// ==========================================
app.post(
  "/api/upload-resource",
  verifyToken,
  uploadMemory.single("file"),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const fileName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, "-")}`;

    try {
      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileName,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      });

      await s3Client.send(command);
      const url = `${process.env.R2_PUBLIC_URL}/${fileName}`;
      res.json({ url });
    } catch (error) {
      console.error("R2 Upload Error:", error);
      res.status(500).json({ error: "Failed to upload file to R2 storage." });
    }
  },
);

// ==========================================
// EXECUTIVES
// ==========================================
app.get("/api/executives", optionalToken, async (req, res) => {
  try {
    let query = 'SELECT * FROM executives';
    let params = [];
    if (req.user && req.user.role === "admin" && req.user.assigned_union) {
      query += ' WHERE "union" = $1';
      params.push(req.user.assigned_union);
    }
    query += " ORDER BY row_level ASC, name ASC";
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch executives" });
  }
});

app.get("/api/executives/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      "SELECT * FROM executives WHERE id = $1",
      [id],
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Executive not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch executive" });
  }
});

app.post(
  "/api/executives",
  verifyToken,
  upload.single("image"),
  async (req, res) => {
    try {
      const {
        name,
        role,
        phone,
        department,
        union,
        row_level,
        icon,
        student_category,
        telegram,
        email,
      } = req.body;
      if (!name || !role)
        return res.status(400).json({ error: "Name and role are required" });
      const image = req.file?.path || req.body.image || null;
      const { rows } = await pool.query(
        `INSERT INTO executives (name, role, phone, department, "union", row_level, icon, image, student_category, telegram, email)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [
          name,
          role,
          phone,
          department,
          union,
          row_level || 3,
          icon || "User",
          image,
          student_category,
          telegram,
          email,
        ],
      );
      notifyClients("executive_added", rows[0]);
      res.status(201).json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Failed to add executive" });
    }
  },
);

app.put(
  "/api/executives/:id",
  verifyToken,
  upload.single("image"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        role,
        phone,
        department,
        union,
        row_level,
        icon,
        student_category,
        telegram,
        email,
      } = req.body;
      const current = await pool.query(
        "SELECT image FROM executives WHERE id = $1",
        [id],
      );
      if (current.rows.length === 0)
        return res.status(404).json({ error: "Executive not found" });
      const image = req.file?.path || req.body.image || current.rows[0].image;
      const { rows } = await pool.query(
        `UPDATE executives SET name=$1, role=$2, phone=$3, department=$4, "union"=$5,
         row_level=$6, icon=$7, image=$8, student_category=$9, telegram=$10, email=$11
         WHERE id=$12 RETURNING *`,
        [
          name,
          role,
          phone,
          department,
          union,
          row_level || 3,
          icon || "User",
          image,
          student_category,
          telegram,
          email,
          id,
        ],
      );
      notifyClients("executive_updated", rows[0]);
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Failed to update executive" });
    }
  },
);

app.delete("/api/executives/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      "DELETE FROM executives WHERE id=$1 RETURNING *",
      [id],
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Executive not found" });
    notifyClients("executive_deleted", { id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete executive" });
  }
});

// ==========================================
// RESOURCES
// ==========================================
app.get("/api/plans", verifyToken, async (req, res) => {
  try {
    let query = "SELECT * FROM plans";
    let params = [];
    if (req.user.role === "admin" && req.user.assigned_union) {
      query += " WHERE category = $1";
      params.push(req.user.assigned_union);
    }
    query += " ORDER BY created_at DESC";
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch plans" });
  }
});

app.get("/api/members", verifyToken, async (req, res) => {
  try {
    const { status, category, position } = req.query;
    let query = "SELECT * FROM members WHERE 1=1";
    let params = [];

    if (status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }
    if (category) {
      query += ` AND category = $${params.length + 1}`;
      params.push(category);
    }
    if (position) {
      query += ` AND position = $${params.length + 1}`;
      params.push(position);
    }

    // Role-based filtering for Admins
    if (req.user.role === "admin") {
      // Always filter by union if assigned
      if (req.user.assigned_union) {
        query += ` AND category = $${params.length + 1}`;
        params.push(req.user.assigned_union);
      }
      // ONLY filter by position for PENDING requests (Approval Matching)
      // If it's the approved directory, they see everyone in their union
      if (status === "pending" && req.user.position) {
        query += ` AND position = $${params.length + 1}`;
        params.push(req.user.position);
      }
    }

    query += " ORDER BY joined_date DESC";
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch members" });
  }
});

app.get("/api/resources", verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM resources ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch resources" });
  }
});

app.post("/api/resources", verifyToken, async (req, res) => {
  try {
    const { name, type, size, category, url } = req.body;
    if (!name || !type || !category || !url)
      return res
        .status(400)
        .json({ error: "Name, type, category, url required" });
    const { rows } = await pool.query(
      "INSERT INTO resources (name, type, size, category, url) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [name, type, size, category, url],
    );
    notifyClients("resource_added", rows[0]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to add resource" });
  }
});

app.put("/api/resources/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, size, category, url } = req.body;
    const { rows } = await pool.query(
      "UPDATE resources SET name=$1, type=$2, size=$3, category=$4, url=$5 WHERE id=$6 RETURNING *",
      [name, type, size, category, url, id],
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Resource not found" });
    notifyClients("resource_updated", rows[0]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update resource" });
  }
});

app.delete("/api/resources/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      "DELETE FROM resources WHERE id=$1 RETURNING *",
      [id],
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Resource not found" });
    notifyClients("resource_deleted", { id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete resource" });
  }
});

// ==========================================
// ADMIN USER MANAGEMENT
// ==========================================
app.get("/api/users", verifySuperAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, role, assigned_union, position, created_at FROM admins ORDER BY created_at DESC",
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admins", verifySuperAdmin, async (req, res) => {
  const { email, password, role = "admin", assigned_union, position } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });
  try {
    const hash = await bcrypt.hash(password.trim(), 10);
    const result = await pool.query(
      "INSERT INTO admins (email, password_hash, role, assigned_union, position) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, role, assigned_union, position, created_at",
      [email.trim().toLowerCase(), hash, role, assigned_union, position],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505")
      return res.status(400).json({ error: "Email already exists" });
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/admins/:id", verifySuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { role, assigned_union, position } = req.body;
  try {
    const { rows } = await pool.query(
      "UPDATE admins SET role=$1, assigned_union=$2, position=$3 WHERE id=$4 RETURNING id, email, role, assigned_union, position, created_at",
      [role, assigned_union, position, id],
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Admin not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/admins/:id", verifySuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM admins WHERE id = $1 RETURNING id",
      [id],
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Admin not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/admins/me/password", verifyToken, async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6)
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });
  try {
    const hash = await bcrypt.hash(newPassword.trim(), 10);
    await pool.query("UPDATE admins SET password_hash = $1 WHERE id = $2", [
      hash,
      req.user.id,
    ]);
    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/admins/:id/password", verifySuperAdmin, async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6)
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });
  try {
    const hash = await bcrypt.hash(newPassword.trim(), 10);
    const result = await pool.query(
      "UPDATE admins SET password_hash = $1 WHERE id = $2 RETURNING id, email",
      [hash, req.params.id],
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Admin not found" });
    res.json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// CATEGORIES
// ==========================================
app.get("/api/categories", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT name, image, description, about_content, mission_content,
       vision_content, goal_content, leader_name, leader_role
       FROM categories ORDER BY name ASC`,
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// FIX: was using `result` which was never declared after the INSERT
app.post("/api/categories", upload.single("image"), async (req, res) => {
  const name = req.body.name?.trim();
  const image = req.file?.path || null;
  if (!name) return res.status(400).json({ error: "Category name required" });
  try {
    const { rows } = await pool.query(
      `INSERT INTO categories (name, image) VALUES ($1, $2)
       ON CONFLICT (name) DO UPDATE SET image = EXCLUDED.image
       RETURNING *`,
      [name, image],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put(
  "/api/categories/:name",
  verifyToken,
  upload.single("image"),
  async (req, res) => {
    const { name } = req.params;
    const {
      description,
      about_content,
      mission_content,
      vision_content,
      goal_content,
      leader_name,
      leader_role,
    } = req.body;
    const image = req.file?.path || req.body.image || null;

    if (req.user.role !== "superadmin" && req.user.role !== name) {
      return res
        .status(403)
        .json({ error: "Unauthorized to update this category" });
    }

    try {
      const { rows } = await pool.query(
        `UPDATE categories SET
          image = COALESCE($1, image),
          description = COALESCE($2, description),
          about_content = COALESCE($3, about_content),
          mission_content = COALESCE($4, mission_content),
          vision_content = COALESCE($5, vision_content),
          goal_content = COALESCE($6, goal_content),
          leader_name = COALESCE($7, leader_name),
          leader_role = COALESCE($8, leader_role)
         WHERE name = $9 RETURNING *`,
        [
          image,
          description,
          about_content,
          mission_content,
          vision_content,
          goal_content,
          leader_name,
          leader_role,
          name,
        ],
      );
      if (rows.length === 0)
        return res.status(404).json({ error: "Category not found" });
      notifyClients("category_updated", rows[0]);
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// ==========================================
// PLANS
// ==========================================
app.get("/api/plans", optionalToken, async (req, res) => {
  try {
    let query = "SELECT * FROM plans";
    const params = [];
    if (req.user && req.user.role !== "superadmin") {
      query += " WHERE category = $1";
      params.push(req.user.role);
    }
    query += " ORDER BY created_at DESC";
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch plans" });
  }
});

app.post("/api/plans", verifyToken, async (req, res) => {
  try {
    const { title, content, category, status } = req.body;
    const finalCategory =
      req.user.role === "superadmin" ? category : req.user.role;

    if (!title || !content || !finalCategory) {
      return res
        .status(400)
        .json({ error: "Title, content, and category are required" });
    }

    const { rows } = await pool.query(
      "INSERT INTO plans (title, content, category, status, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [title, content, finalCategory, status || "pending", req.user.email],
    );
    notifyClients("plan_added", rows[0]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to add plan" });
  }
});

app.put("/api/plans/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, status } = req.body;

    const check = await pool.query("SELECT category FROM plans WHERE id = $1", [
      id,
    ]);
    if (check.rows.length === 0)
      return res.status(404).json({ error: "Plan not found" });

    if (
      req.user.role !== "superadmin" &&
      req.user.role !== check.rows[0].category
    ) {
      return res.status(403).json({ error: "Unauthorized to edit this plan" });
    }

    const { rows } = await pool.query(
      "UPDATE plans SET title=$1, content=$2, status=$3 WHERE id=$4 RETURNING *",
      [title, content, status, id],
    );
    notifyClients("plan_updated", rows[0]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update plan" });
  }
});

app.delete("/api/plans/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const check = await pool.query("SELECT category FROM plans WHERE id = $1", [
      id,
    ]);
    if (check.rows.length === 0)
      return res.status(404).json({ error: "Plan not found" });

    if (
      req.user.role !== "superadmin" &&
      req.user.role !== check.rows[0].category
    ) {
      return res
        .status(403)
        .json({ error: "Unauthorized to delete this plan" });
    }

    await pool.query("DELETE FROM plans WHERE id=$1", [id]);
    notifyClients("plan_deleted", { id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete plan" });
  }
});

// ==========================================
// MEETINGS
// ==========================================
app.get("/api/meetings", optionalToken, async (req, res) => {
  try {
    let query = "SELECT * FROM meetings";
    const params = [];
    if (req.user && req.user.role !== "superadmin") {
      query += " WHERE category = $1 OR category = 'General'";
      params.push(req.user.role);
    }
    query += " ORDER BY date ASC";
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch meetings" });
  }
});

app.post("/api/meetings", verifyToken, async (req, res) => {
  try {
    const { title, description, date, location, category, status } = req.body;
    // Safely default to "General" if superadmin didn't provide a category
    const finalCategory = req.user.role === "superadmin" ? (category || "General") : req.user.role;

    if (!title || !date || !finalCategory) {
      return res.status(400).json({ error: "Title, date, and category are required" });
    }

    const { rows } = await pool.query(
      `INSERT INTO meetings (title, description, date, location, category, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, description, date, location, finalCategory, status || "upcoming", req.user.email]
    );
    notifyClients("meeting_added", rows[0]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to add meeting" });
  }
});

app.put("/api/meetings/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, location, status } = req.body;

    const check = await pool.query("SELECT category FROM meetings WHERE id = $1", [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: "Meeting not found" });

    if (req.user.role !== "superadmin" && req.user.role !== check.rows[0].category) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { rows } = await pool.query(
      `UPDATE meetings SET title=$1, description=$2, date=$3, location=$4, status=$5
       WHERE id=$6 RETURNING *`,
      [title, description, date, location, status, id]
    );
    notifyClients("meeting_updated", rows[0]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update meeting" });
  }
});

app.delete("/api/meetings/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const check = await pool.query("SELECT category FROM meetings WHERE id = $1", [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: "Meeting not found" });

    if (req.user.role !== "superadmin" && req.user.role !== check.rows[0].category) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await pool.query("DELETE FROM meetings WHERE id=$1", [id]);
    notifyClients("meeting_deleted", { id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete meeting" });
  }
});

// ==========================================
// MEMBERS
// ==========================================

app.get("/api/members/count/pending", verifyToken, async (req, res) => {
  try {
    let query = "SELECT COUNT(*) FROM members WHERE status = 'pending'";
    let params = [];
    if (req.user.role === "admin") {
      if (req.user.assigned_union) {
        query += " AND category = $1";
        params.push(req.user.assigned_union);
      }
      if (req.user.position) {
        query += ` AND position = $${params.length + 1}`;
        params.push(req.user.position);
      }
    }
    const { rows } = await pool.query(query, params);
    res.json({ count: parseInt(rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post(
  "/api/members",
  upload.fields([{ name: "image" }, { name: "idImage" }]),
  async (req, res) => {
    const {
      name,
      email,
      category,
      grade,
      phone,
      department,
      id_number,
      graduation_year,
      position,
    } = req.body;

    if (!name || !email || !category)
      return res.status(400).json({ error: "Name, email, category required" });

    const allowed = (process.env.ALLOWED_DOMAINS || "@samu.edu.et").split(",");
    if (!allowed.some((d) => email.toLowerCase().endsWith(d.trim()))) {
      return res.status(403).json({ error: "Use official university email" });
    }

    try {
      const settingsResult = await pool.query(
        "SELECT value FROM settings WHERE key = 'registrations_enabled'",
      );
      const enabled = settingsResult.rows[0]?.value === "true";
      if (!enabled)
        return res
          .status(403)
          .json({ error: "Registrations are currently closed." });

      const defaultPassword = '12345678';
      const hash = await bcrypt.hash(defaultPassword, 10);

      const result = await pool.query(
        `INSERT INTO members
           (name, email, phone, category, grade, department, id_number, graduation_year, position, image, id_image, password_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
        [
          name,
          email.toLowerCase(),
          phone,
          category,
          grade,
          department,
          id_number,
          graduation_year,
          position,
          req.files?.image?.[0]?.path || null,
          req.files?.idImage?.[0]?.path || null,
          hash,
        ],
      );
      const msg = result.rows[0];
      notifyClients("member_added", msg);
      res.status(201).json(msg);
    } catch (err) {
      if (err.code === "23505")
        return res.status(400).json({ error: "Email already registered" });
      res.status(500).json({ error: err.message });
    }
  },
);

app.put(
  "/api/members/:id",
  verifyToken,
  upload.fields([{ name: "image" }, { name: "idImage" }]),
  async (req, res) => {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      category,
      grade,
      department,
      id_number,
      graduation_year,
      position,
    } = req.body;
    if (!name || !email)
      return res.status(400).json({ error: "Name and email required" });
    try {
      const current = await pool.query("SELECT * FROM members WHERE id = $1", [
        id,
      ]);
      if (current.rows.length === 0)
        return res.status(404).json({ error: "Member not found" });

      const image = req.files?.image?.[0]?.path || current.rows[0].image;
      const id_image =
        req.files?.idImage?.[0]?.path || current.rows[0].id_image;

      const result = await pool.query(
        `UPDATE members SET name=$1, email=$2, phone=$3, category=$4, grade=$5, department=$6,
         id_number=$7, graduation_year=$8, position=$9, image=$10, id_image=$11
         WHERE id=$12 RETURNING *`,
        [
          name,
          email.toLowerCase(),
          phone,
          category,
          grade,
          department,
          id_number,
          graduation_year,
          position,
          image,
          id_image,
          id,
        ],
      );
      notifyClients("member_updated", result.rows[0]);
      res.json(result.rows[0]);
    } catch (err) {
      if (err.code === "23505")
        return res.status(400).json({ error: "Email already registered" });
      res.status(500).json({ error: err.message });
    }
  },
);

app.patch("/api/members/:id/status", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const { rows } = await pool.query(
      "UPDATE members SET status = $1 WHERE id = $2 RETURNING *",
      [status, id],
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Member not found" });

    if (status === "approved") {
      const mailOptions = {
        from: `"Samara Peace Forum" <${process.env.SMTP_USER}>`,
        to: rows[0].email,
        subject: "Application Approved - Samara Peace Forum",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #059669;">Welcome, ${rows[0].name}!</h2>
            <p>Your application for the <strong>Samara Peace Forum Union</strong> has been officially approved by the administration.</p>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px;"><strong>Institutional Role:</strong> ${rows[0].position || "Member"}</p>
              <p style="margin: 5px 0 0; font-size: 14px;"><strong>Jurisdiction:</strong> ${rows[0].category}</p>
            </div>
            <p>You can now access the administrative portal using your institutional email.</p>
            <p><strong>Temporary Access Key:</strong> 12345678</p>
            <div style="margin-top: 25px;">
              <a href="${process.env.APP_URL || 'http://localhost:5173'}/login" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Access Dashboard</a>
            </div>
            <p style="font-size: 11px; color: #64748b; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
              This is an official institutional message from the Samara Peace Forum Union. Please change your temporary password upon first entry.
            </p>
          </div>
        `,
      };
      transporter.sendMail(mailOptions).catch((err) => {
        console.error("❌ Approval Email Error:", err);
      });
    }

    notifyClients("member_updated", rows[0]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update member status" });
  }
});

app.delete("/api/members/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM members WHERE id = $1 RETURNING id",
      [id],
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Member not found" });
    notifyClients("member_deleted", { id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// POSTS
// ==========================================
app.get("/api/posts", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM posts ORDER BY created_at DESC",
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM posts WHERE id = $1", [id]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Post not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/posts", upload.array("images", 10), async (req, res) => {
  const { title, content, author, category } = req.body;
  if (!title || !content || !author)
    return res.status(400).json({ error: "Title, content, author required" });
  try {
    const imageUrls = (req.files || []).map((f) => f.path);
    const primaryImage = imageUrls[0] || null;
    const result = await pool.query(
      "INSERT INTO posts (title, content, author, category, image, images) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [title, content, author, category, primaryImage, imageUrls],
    );
    const post = result.rows[0];
    notifyClients("new_post", {
      id: post.id,
      title: post.title,
      category: post.category,
    });
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/posts/:id", upload.array("images", 10), async (req, res) => {
  const { id } = req.params;
  const { title, content, author, category, keepImages } = req.body;
  if (!title || !content || !author)
    return res.status(400).json({ error: "Title, content, author required" });
  try {
    const current = await pool.query("SELECT * FROM posts WHERE id = $1", [id]);
    if (current.rows.length === 0)
      return res.status(404).json({ error: "Post not found" });

    const newUrls = (req.files || []).map((f) => f.path);
    let existingKept = [];
    try {
      existingKept = keepImages ? JSON.parse(keepImages) : [];
    } catch {
      existingKept = [];
    }
    const imageUrls = [...existingKept, ...newUrls];
    const primaryImage = imageUrls[0] || current.rows[0].image;

    const result = await pool.query(
      "UPDATE posts SET title=$1, content=$2, author=$3, category=$4, image=$5, images=$6 WHERE id=$7 RETURNING *",
      [title, content, author, category, primaryImage, imageUrls, id],
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/posts/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM posts WHERE id = $1 RETURNING id",
      [id],
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Post not found" });
    notifyClients("post_deleted", { id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// INBOX / MESSAGES
// ==========================================
app.post("/api/contact", async (req, res) => {
  const { email, name, message, subject, category } = req.body;
  if (!email || !name || !message)
    return res.status(400).json({ error: "Name, email, message required" });
  try {
    const result = await pool.query(
      `INSERT INTO messages (sender_name, sender_email, subject, content, category, status)
       VALUES ($1, $2, $3, $4, $5, 'unread') RETURNING *`,
      [
        name,
        email.toLowerCase(),
        subject || "No Subject",
        message,
        category || "General",
      ],
    );
    const msg = result.rows[0];

    // NEW: Send email notification to admin
    try {
      await transporter.sendMail({
        from: `"Contact Form" <${process.env.SMTP_USER}>`,
        to: process.env.SMTP_USER,
        replyTo: email,
        subject: `[Contact Form] ${subject || "New Inquiry"}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background: #0f172a; color: white; padding: 24px; text-align: center;">
              <h2 style="margin: 0; font-size: 20px;">New Contact Submission</h2>
            </div>
            <div style="padding: 32px; color: #1e293b; line-height: 1.6;">
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Subject:</strong> ${subject || "No Subject"}</p>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="font-weight: bold; margin-bottom: 8px;">Message:</p>
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; font-style: italic;">
                ${message.replace(/\n/g, "<br/>")}
              </div>
            </div>
            <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
              This message was sent from the Samara Peace Forum Union website contact form.
            </div>
          </div>
        `,
      });
      console.log(`📧 Contact email notification sent to admin for: ${email}`);
    } catch (mailErr) {
      console.error("❌ SMTP Contact Email Error:", mailErr);
    }

    notifyClients("new_message", {
      id: msg.id,
      sender: msg.sender_name,
      subject: msg.subject,
    });
    res
      .status(201)
      .json({ success: true, message: "Message sent!", messageId: msg.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/messages/stats", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT COUNT(*) as count FROM messages WHERE status = 'unread'",
    );
    res.json({ unreadCount: parseInt(result.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/messages", verifyToken, async (req, res) => {
  try {
    const { status, search, limit = 20, offset = 0 } = req.query;
    const params = [];
    let idx = 1;
    let conditions = [];

    if (status) {
      conditions.push(`status = $${idx}`);
      params.push(status);
      idx++;
    }
    if (search) {
      conditions.push(`(sender_name ILIKE $${idx} OR subject ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const query = `SELECT * FROM messages ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${
      idx + 1
    }`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/messages/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM messages WHERE id = $1", [
      id,
    ]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Message not found" });

    const msg = result.rows[0];
    if (msg.status === "unread") {
      await pool.query("UPDATE messages SET status = 'read' WHERE id = $1", [
        id,
      ]);
      msg.status = "read";
      notifyClients("message_read", { id });
    }
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/messages/:id/reply", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { replyContent, repliedBy } = req.body;
  if (!replyContent)
    return res.status(400).json({ error: "Reply content required" });
  try {
    const msgRes = await pool.query("SELECT * FROM messages WHERE id = $1", [
      id,
    ]);
    if (msgRes.rows.length === 0)
      return res.status(404).json({ error: "Message not found" });
    const msg = msgRes.rows[0];

    try {
      await transporter.sendMail({
        from: `"Peace Forum Admin" <${process.env.SMTP_USER}>`,
        replyTo: process.env.SMTP_USER,
        to: msg.sender_email,
        subject: `Re: ${msg.subject || "No Subject"} [ID: #${msg.id}]`,
        html: `
          <div style="font-family:sans-serif;color:#334155;line-height:1.6;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;padding:30px;border-radius:12px;">
            <p style="font-size:16px;">Hello <strong>${msg.sender_name}</strong>,</p>
            <p style="font-size:15px;color:#1e293b;">${replyContent}</p>
            <div style="margin-top:30px;padding-top:20px;border-top:1px solid #f1f5f9;">
              <p style="font-size:13px;color:#64748b;margin-bottom:0;">
                <strong>Peace Forum Admin Team</strong><br/>Samara University Official Platform
              </p>
              <p style="font-size:11px;color:#94a3b8;margin-top:10px;">Sent to: ${msg.sender_email}</p>
            </div>
          </div>`,
      });
      console.log(`✅ Reply email sent to ${msg.sender_email}`);
    } catch (mailErr) {
      console.error("❌ Email Delivery Error:", mailErr);
    }

    const result = await pool.query(
      "UPDATE messages SET reply_content=$1, replied_at=NOW(), status='replied', replied_by=$2 WHERE id=$3 RETURNING *",
      [replyContent, repliedBy || req.user?.email, id],
    );

    const repliedMsg = result.rows[0];
    notifyClients("message_updated", {
      id: repliedMsg.id,
      status: repliedMsg.status,
      replied_by: repliedMsg.replied_by,
    });
    res.json(repliedMsg);
  } catch (err) {
    console.error("❌ Reply API Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/messages/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM messages WHERE id = $1 RETURNING id",
      [id],
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Message not found" });
    notifyClients("message_deleted", { id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// EMAIL BROADCAST
// ==========================================
app.post("/api/email/send", verifySuperAdmin, async (req, res) => {
  const { subject, message, targetType, targetValue } = req.body;
  if (!subject || !message || !targetType)
    return res.status(400).json({ error: "Missing fields" });

  try {
    let recipients = [];
    if (targetType === "all") {
      const r = await pool.query(
        "SELECT email FROM members WHERE email IS NOT NULL AND email != '' AND status = 'approved'",
      );
      recipients = r.rows.map((x) => x.email).filter(Boolean);
    } else if (targetType === "category") {
      const r = await pool.query(
        "SELECT email FROM members WHERE category = $1 AND email IS NOT NULL AND email != '' AND status = 'approved'",
        [targetValue],
      );
      recipients = r.rows.map((x) => x.email).filter(Boolean);
    } else if (targetType === "selected") {
      const r = await pool.query(
        "SELECT email FROM members WHERE id = ANY($1) AND email IS NOT NULL AND email != ''",
        [targetValue],
      );
      recipients = r.rows.map((x) => x.email).filter(Boolean);
    } else if (targetType === "personal") {
      recipients = [targetValue].filter(Boolean);
    }

    if (recipients.length === 0)
      return res
        .status(404)
        .json({ error: "No valid recipient email addresses found." });

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return res.status(500).json({
        error:
          "Email configuration is missing on the server (SMTP_USER/SMTP_PASS).",
      });
    }

    await transporter.sendMail({
      from: `"Peace Forum Admin" <${process.env.SMTP_USER}>`,
      replyTo: process.env.SMTP_USER,
      bcc: recipients,
      subject,
      html: `
        <div style="font-family:sans-serif;color:#334155;line-height:1.6;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;padding:30px;border-radius:12px;">
          <h3 style="color:#1e293b;margin-top:0;">${subject}</h3>
          <div style="font-size:15px;color:#1e293b;">${message}</div>
          <div style="margin-top:30px;padding-top:20px;border-top:1px solid #f1f5f9;">
            <p style="font-size:13px;color:#64748b;margin-bottom:0;">
              <strong>Peace Forum Admin Team</strong><br/>Samara University Official Platform
            </p>
          </div>
        </div>`,
    });

    console.log(`✅ Broadcast sent to ${recipients.length} recipients.`);
    res.json({ success: true, count: recipients.length });
  } catch (err) {
    console.error("❌ Broadcast Error:", err);
    res.status(500).json({ error: "Failed to send broadcast. " + err.message });
  }
});

// ==========================================
// EXPORT & HEALTH
// ==========================================
app.get("/api/export/members", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM members ORDER BY joined_date DESC",
    );
    const csv =
      "ID,Name,Email,Category,Department,Status\n" +
      result.rows
        .map(
          (m) =>
            `${m.id},"${m.name}","${m.email}","${m.category || ""}","${m.department || ""}","${m.status || ""}"`,
        )
        .join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=members.csv");
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "Healthy",
    db: "Connected",
    socket: "Active",
    inbox: "Ready",
  });
});

// --- ERROR HANDLING ---
app.use((req, res) => res.status(404).json({ error: "Endpoint not found" }));
app.use((err, req, res, next) => {
  console.error("Global Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// --- START SERVER ---
const PORT = process.env.PORT || 4000;
const startServer = async () => {
  await initDB();
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📥 Inbox System Active`);
    console.log(`🔔 Real-time Notifications Ready`);
  });
};
startServer();

export default app;
