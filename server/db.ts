import fs from 'fs';
import path from 'path';
import { createClient, Client } from '@libsql/client';
import mysql from 'mysql2/promise';
import { hashPassword, UserRole } from './auth';

export interface UserRecord {
  id: string;
  username: string;
  name?: string;
  email?: string;
  passwordHash: string;
  role: UserRole;
  clusterId?: string;
  createdAt: string;
}

export interface ClusterRecord {
  id: string;
  name: string;
  code: string;
  description: string;
  subscriptionTier: 'FREE_TRIAL' | 'PRO' | 'ENTERPRISE';
  subscriptionStatus: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
  maxSimulators: number;
  maxTeachers: number;
  primaryColor?: string;
  createdAt: string;
}

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
}

export interface SimulatorRecord {
  id: string;
  title: string;
  slug: string;
  description: string;
  categoryId: string;
  clusterId?: string;
  filePath?: string;
  htmlContent?: string;
  thumbnailUrl?: string;
  isPublished: boolean;
  viewsCount: number;
  author: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const DATA_DIR = path.join(process.cwd(), 'data');
export const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Default standard categories for initial setup
export const defaultCleanCategories: CategoryRecord[] = [
  {
    id: 'cat-physics',
    name: 'Fisika & Mekanika',
    slug: 'fisika-mekanika',
    description: 'Simulasi gerak partikel, osilasi pegas, optika gelombang, dan termodinamika',
    icon: 'Atom',
    color: 'blue'
  },
  {
    id: 'cat-electronics',
    name: 'Elektronika & Sirkuit',
    slug: 'elektronika-sirkuit',
    description: 'Rangkaian gerbang logika digital, breadboard virtual, resistor, dan osiloskop',
    icon: 'Cpu',
    color: 'amber'
  },
  {
    id: 'cat-chemistry',
    name: 'Kimia & Atom',
    slug: 'kimia-atom',
    description: 'Struktur molekul 3D, reaksi stoikiometri asam basa, dan tabel periodik interaktif',
    icon: 'FlaskConical',
    color: 'emerald'
  },
  {
    id: 'cat-astronomy',
    name: 'Astronomi & Antariksa',
    slug: 'astronomi-antariksa',
    description: 'Orbit tata surya gravitasi Newton, mekanika orbital satelit, dan konstelasi bintang',
    icon: 'Sparkles',
    color: 'purple'
  },
  {
    id: 'cat-math-comp',
    name: 'Matematika & Komputasi',
    slug: 'matematika-komputasi',
    description: 'Kalkulus visual, visualisasi algoritma graf, geometri fraktal, dan probabilitas',
    icon: 'Layers',
    color: 'rose'
  }
];

// Determine Database Engine (sqlite vs mysql)
const DB_TYPE = (process.env.DB_TYPE || (process.env.DATABASE_URL?.startsWith('mysql') ? 'mysql' : 'sqlite')).toLowerCase();

let sqliteClient: Client | null = null;
let mysqlPool: mysql.Pool | null = null;

// Database Adapter Interface
interface DatabaseAdapter {
  init(): Promise<void>;
  // Clusters
  getClusters(): Promise<ClusterRecord[]>;
  getClusterById(id: string): Promise<ClusterRecord | null>;
  getClusterByCode(code: string): Promise<ClusterRecord | null>;
  addCluster(data: Omit<ClusterRecord, 'id' | 'createdAt'>): Promise<ClusterRecord>;
  updateCluster(id: string, updates: Partial<ClusterRecord>): Promise<ClusterRecord | null>;
  deleteCluster(id: string): Promise<boolean>;
  // Users
  getUsers(clusterId?: string): Promise<UserRecord[]>;
  getUserByUsername(username: string): Promise<UserRecord | null>;
  getUserById(id: string): Promise<UserRecord | null>;
  addUser(data: Omit<UserRecord, 'id' | 'createdAt'>): Promise<UserRecord>;
  deleteUser(id: string): Promise<boolean>;
  // Categories
  getCategories(): Promise<CategoryRecord[]>;
  getCategoryById(id: string): Promise<CategoryRecord | null>;
  addCategory(data: Omit<CategoryRecord, 'id'>): Promise<CategoryRecord>;
  updateCategory(id: string, updates: Partial<CategoryRecord>): Promise<CategoryRecord | null>;
  deleteCategory(id: string): Promise<boolean>;
  // Simulators
  getSimulators(options?: { clusterId?: string; categoryId?: string; search?: string; isPublished?: boolean }): Promise<SimulatorRecord[]>;
  getSimulatorById(id: string): Promise<SimulatorRecord | null>;
  incrementViewCount(id: string): Promise<void>;
  addSimulator(data: Omit<SimulatorRecord, 'id' | 'createdAt' | 'updatedAt' | 'viewsCount'>): Promise<SimulatorRecord>;
  updateSimulator(id: string, updates: Partial<SimulatorRecord>): Promise<SimulatorRecord | null>;
  deleteSimulator(id: string): Promise<boolean>;
}

// ----------------------------------------------------
// 1. SQLite Driver Implementation (Default Zero-Config)
// ----------------------------------------------------
const sqliteAdapter: DatabaseAdapter = {
  async init() {
    const dbPath = path.join(DATA_DIR, 'edusim.db');
    sqliteClient = createClient({
      url: `file:${dbPath}`
    });

    // Create Tables
    await sqliteClient.execute(`
      CREATE TABLE IF NOT EXISTS clusters (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        description TEXT,
        subscriptionTier TEXT DEFAULT 'PRO',
        subscriptionStatus TEXT DEFAULT 'ACTIVE',
        maxSimulators INTEGER DEFAULT 50,
        maxTeachers INTEGER DEFAULT 15,
        primaryColor TEXT DEFAULT '#0284c7',
        createdAt TEXT NOT NULL
      );
    `);

    await sqliteClient.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        name TEXT,
        email TEXT,
        passwordHash TEXT NOT NULL,
        role TEXT NOT NULL,
        clusterId TEXT,
        createdAt TEXT NOT NULL
      );
    `);

    await sqliteClient.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        icon TEXT,
        color TEXT
      );
    `);

    await sqliteClient.execute(`
      CREATE TABLE IF NOT EXISTS simulators (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT NOT NULL,
        description TEXT,
        categoryId TEXT NOT NULL,
        clusterId TEXT,
        filePath TEXT,
        htmlContent TEXT,
        thumbnailUrl TEXT,
        isPublished INTEGER DEFAULT 1,
        viewsCount INTEGER DEFAULT 0,
        author TEXT,
        tags TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);

    // Ensure clean default Super Admin exists
    const adminCheck = await sqliteClient.execute({
      sql: 'SELECT id FROM users WHERE role = ? LIMIT 1',
      args: ['SUPER_ADMIN']
    });

    const defaultSuperAdminUser = process.env.SUPERADMIN_USERNAME || process.env.ADMIN_USERNAME || 'superadmin';
    const defaultSuperAdminPass = process.env.SUPERADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'superadmin123';

    if (adminCheck.rows.length === 0) {
      console.log(`[Database: SQLite] Initializing Clean Database with default Super Admin: ${defaultSuperAdminUser}`);
      await sqliteClient.execute({
        sql: `INSERT INTO users (id, username, name, email, passwordHash, role, createdAt)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          'usr-superadmin',
          defaultSuperAdminUser,
          'Super Administrator',
          'superadmin@edusim.hub',
          hashPassword(defaultSuperAdminPass),
          'SUPER_ADMIN',
          new Date().toISOString()
        ]
      });
    }

    // Seed default clean categories if empty
    const catCheck = await sqliteClient.execute('SELECT COUNT(*) as count FROM categories');
    const catCount = Number(catCheck.rows[0]?.count || 0);
    if (catCount === 0) {
      for (const cat of defaultCleanCategories) {
        await sqliteClient.execute({
          sql: `INSERT INTO categories (id, name, slug, description, icon, color) VALUES (?, ?, ?, ?, ?, ?)`,
          args: [cat.id, cat.name, cat.slug, cat.description, cat.icon, cat.color]
        });
      }
    }
  },

  // Clusters
  async getClusters() {
    const res = await sqliteClient!.execute('SELECT * FROM clusters ORDER BY createdAt DESC');
    return res.rows.map(r => ({
      id: String(r.id),
      name: String(r.name),
      code: String(r.code),
      description: String(r.description || ''),
      subscriptionTier: (r.subscriptionTier as any) || 'PRO',
      subscriptionStatus: (r.subscriptionStatus as any) || 'ACTIVE',
      maxSimulators: Number(r.maxSimulators || 50),
      maxTeachers: Number(r.maxTeachers || 15),
      primaryColor: String(r.primaryColor || '#0284c7'),
      createdAt: String(r.createdAt)
    }));
  },

  async getClusterById(id: string) {
    const res = await sqliteClient!.execute({
      sql: 'SELECT * FROM clusters WHERE id = ? LIMIT 1',
      args: [id]
    });
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: String(r.id),
      name: String(r.name),
      code: String(r.code),
      description: String(r.description || ''),
      subscriptionTier: (r.subscriptionTier as any) || 'PRO',
      subscriptionStatus: (r.subscriptionStatus as any) || 'ACTIVE',
      maxSimulators: Number(r.maxSimulators || 50),
      maxTeachers: Number(r.maxTeachers || 15),
      primaryColor: String(r.primaryColor || '#0284c7'),
      createdAt: String(r.createdAt)
    };
  },

  async getClusterByCode(code: string) {
    const res = await sqliteClient!.execute({
      sql: 'SELECT * FROM clusters WHERE LOWER(code) = LOWER(?) LIMIT 1',
      args: [code]
    });
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: String(r.id),
      name: String(r.name),
      code: String(r.code),
      description: String(r.description || ''),
      subscriptionTier: (r.subscriptionTier as any) || 'PRO',
      subscriptionStatus: (r.subscriptionStatus as any) || 'ACTIVE',
      maxSimulators: Number(r.maxSimulators || 50),
      maxTeachers: Number(r.maxTeachers || 15),
      primaryColor: String(r.primaryColor || '#0284c7'),
      createdAt: String(r.createdAt)
    };
  },

  async addCluster(data) {
    const id = 'cluster-' + Date.now();
    const createdAt = new Date().toISOString();
    await sqliteClient!.execute({
      sql: `INSERT INTO clusters (id, name, code, description, subscriptionTier, subscriptionStatus, maxSimulators, maxTeachers, primaryColor, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        data.name,
        data.code.toLowerCase(),
        data.description || '',
        data.subscriptionTier || 'PRO',
        data.subscriptionStatus || 'ACTIVE',
        data.maxSimulators || 50,
        data.maxTeachers || 15,
        data.primaryColor || '#0284c7',
        createdAt
      ]
    });
    return { id, createdAt, ...data, code: data.code.toLowerCase() };
  },

  async updateCluster(id, updates) {
    const existing = await this.getClusterById(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    await sqliteClient!.execute({
      sql: `UPDATE clusters SET name = ?, code = ?, description = ?, subscriptionTier = ?, subscriptionStatus = ?, maxSimulators = ?, maxTeachers = ?, primaryColor = ? WHERE id = ?`,
      args: [
        updated.name,
        updated.code.toLowerCase(),
        updated.description,
        updated.subscriptionTier,
        updated.subscriptionStatus,
        updated.maxSimulators,
        updated.maxTeachers,
        updated.primaryColor || '#0284c7',
        id
      ]
    });
    return updated;
  },

  async deleteCluster(id) {
    await sqliteClient!.execute({
      sql: 'DELETE FROM simulators WHERE clusterId = ?',
      args: [id]
    });
    await sqliteClient!.execute({
      sql: 'DELETE FROM users WHERE clusterId = ?',
      args: [id]
    });
    const res = await sqliteClient!.execute({
      sql: 'DELETE FROM clusters WHERE id = ?',
      args: [id]
    });
    return (res.rowsAffected || 0) > 0;
  },

  // Users
  async getUsers(clusterId) {
    let sql = 'SELECT * FROM users';
    let args: any[] = [];
    if (clusterId) {
      sql += ' WHERE clusterId = ?';
      args.push(clusterId);
    }
    sql += ' ORDER BY createdAt DESC';
    const res = await sqliteClient!.execute({ sql, args });
    return res.rows.map(r => ({
      id: String(r.id),
      username: String(r.username),
      name: String(r.name || r.username),
      email: String(r.email || ''),
      passwordHash: String(r.passwordHash),
      role: r.role as UserRole,
      clusterId: r.clusterId ? String(r.clusterId) : undefined,
      createdAt: String(r.createdAt)
    }));
  },

  async getUserByUsername(username) {
    const res = await sqliteClient!.execute({
      sql: 'SELECT * FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1',
      args: [username]
    });
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: String(r.id),
      username: String(r.username),
      name: String(r.name || r.username),
      email: String(r.email || ''),
      passwordHash: String(r.passwordHash),
      role: r.role as UserRole,
      clusterId: r.clusterId ? String(r.clusterId) : undefined,
      createdAt: String(r.createdAt)
    };
  },

  async getUserById(id) {
    const res = await sqliteClient!.execute({
      sql: 'SELECT * FROM users WHERE id = ? LIMIT 1',
      args: [id]
    });
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: String(r.id),
      username: String(r.username),
      name: String(r.name || r.username),
      email: String(r.email || ''),
      passwordHash: String(r.passwordHash),
      role: r.role as UserRole,
      clusterId: r.clusterId ? String(r.clusterId) : undefined,
      createdAt: String(r.createdAt)
    };
  },

  async addUser(data) {
    const id = 'usr-' + Date.now();
    const createdAt = new Date().toISOString();
    await sqliteClient!.execute({
      sql: `INSERT INTO users (id, username, name, email, passwordHash, role, clusterId, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        data.username,
        data.name || data.username,
        data.email || `${data.username}@cluster.local`,
        data.passwordHash,
        data.role,
        data.clusterId || null,
        createdAt
      ]
    });
    return { id, createdAt, ...data };
  },

  async deleteUser(id) {
    const res = await sqliteClient!.execute({
      sql: 'DELETE FROM users WHERE id = ?',
      args: [id]
    });
    return (res.rowsAffected || 0) > 0;
  },

  // Categories
  async getCategories() {
    const res = await sqliteClient!.execute('SELECT * FROM categories ORDER BY name ASC');
    return res.rows.map(r => ({
      id: String(r.id),
      name: String(r.name),
      slug: String(r.slug),
      description: String(r.description || ''),
      icon: String(r.icon || 'Atom'),
      color: String(r.color || 'blue')
    }));
  },

  async getCategoryById(id) {
    const res = await sqliteClient!.execute({
      sql: 'SELECT * FROM categories WHERE id = ? LIMIT 1',
      args: [id]
    });
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: String(r.id),
      name: String(r.name),
      slug: String(r.slug),
      description: String(r.description || ''),
      icon: String(r.icon || 'Atom'),
      color: String(r.color || 'blue')
    };
  },

  async addCategory(data) {
    const id = 'cat-' + Date.now();
    await sqliteClient!.execute({
      sql: `INSERT INTO categories (id, name, slug, description, icon, color) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id, data.name, data.slug, data.description || '', data.icon || 'Atom', data.color || 'blue']
    });
    return { id, ...data };
  },

  async updateCategory(id, updates) {
    const existing = await this.getCategoryById(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    await sqliteClient!.execute({
      sql: `UPDATE categories SET name = ?, slug = ?, description = ?, icon = ?, color = ? WHERE id = ?`,
      args: [updated.name, updated.slug, updated.description, updated.icon, updated.color, id]
    });
    return updated;
  },

  async deleteCategory(id) {
    const res = await sqliteClient!.execute({
      sql: 'DELETE FROM categories WHERE id = ?',
      args: [id]
    });
    return (res.rowsAffected || 0) > 0;
  },

  // Simulators
  async getSimulators(options) {
    let sql = 'SELECT * FROM simulators WHERE 1=1';
    const args: any[] = [];

    if (options?.clusterId && options.clusterId !== 'all') {
      sql += ' AND clusterId = ?';
      args.push(options.clusterId);
    }

    if (options?.isPublished !== undefined) {
      sql += ' AND isPublished = ?';
      args.push(options.isPublished ? 1 : 0);
    }

    if (options?.categoryId && options.categoryId !== 'all') {
      sql += ' AND categoryId = ?';
      args.push(options.categoryId);
    }

    if (options?.search) {
      sql += ' AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(tags) LIKE ?)';
      const q = `%${options.search.toLowerCase()}%`;
      args.push(q, q, q);
    }

    sql += ' ORDER BY createdAt DESC';

    const res = await sqliteClient!.execute({ sql, args });
    return res.rows.map(r => {
      let parsedTags: string[] = [];
      try {
        parsedTags = JSON.parse(String(r.tags || '[]'));
      } catch {
        parsedTags = String(r.tags || '').split(',').map(t => t.trim()).filter(Boolean);
      }
      return {
        id: String(r.id),
        title: String(r.title),
        slug: String(r.slug),
        description: String(r.description || ''),
        categoryId: String(r.categoryId),
        clusterId: r.clusterId ? String(r.clusterId) : undefined,
        filePath: r.filePath ? String(r.filePath) : undefined,
        htmlContent: r.htmlContent ? String(r.htmlContent) : undefined,
        thumbnailUrl: r.thumbnailUrl ? String(r.thumbnailUrl) : undefined,
        isPublished: Number(r.isPublished) === 1,
        viewsCount: Number(r.viewsCount || 0),
        author: String(r.author || 'Pengajar EduHub'),
        tags: parsedTags,
        createdAt: String(r.createdAt),
        updatedAt: String(r.updatedAt)
      };
    });
  },

  async getSimulatorById(id) {
    const res = await sqliteClient!.execute({
      sql: 'SELECT * FROM simulators WHERE id = ? LIMIT 1',
      args: [id]
    });
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    let parsedTags: string[] = [];
    try {
      parsedTags = JSON.parse(String(r.tags || '[]'));
    } catch {
      parsedTags = String(r.tags || '').split(',').map(t => t.trim()).filter(Boolean);
    }
    return {
      id: String(r.id),
      title: String(r.title),
      slug: String(r.slug),
      description: String(r.description || ''),
      categoryId: String(r.categoryId),
      clusterId: r.clusterId ? String(r.clusterId) : undefined,
      filePath: r.filePath ? String(r.filePath) : undefined,
      htmlContent: r.htmlContent ? String(r.htmlContent) : undefined,
      thumbnailUrl: r.thumbnailUrl ? String(r.thumbnailUrl) : undefined,
      isPublished: Number(r.isPublished) === 1,
      viewsCount: Number(r.viewsCount || 0),
      author: String(r.author || 'Pengajar EduHub'),
      tags: parsedTags,
      createdAt: String(r.createdAt),
      updatedAt: String(r.updatedAt)
    };
  },

  async incrementViewCount(id) {
    await sqliteClient!.execute({
      sql: 'UPDATE simulators SET viewsCount = viewsCount + 1 WHERE id = ?',
      args: [id]
    });
  },

  async addSimulator(data) {
    const id = 'sim-' + Date.now();
    const now = new Date().toISOString();
    const tagsJson = JSON.stringify(data.tags || []);
    await sqliteClient!.execute({
      sql: `INSERT INTO simulators (id, title, slug, description, categoryId, clusterId, filePath, htmlContent, thumbnailUrl, isPublished, viewsCount, author, tags, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        data.title,
        data.slug,
        data.description || '',
        data.categoryId,
        data.clusterId || null,
        data.filePath || null,
        data.htmlContent || null,
        data.thumbnailUrl || null,
        data.isPublished ? 1 : 0,
        0,
        data.author || 'Pengajar EduHub',
        tagsJson,
        now,
        now
      ]
    });
    return {
      id,
      viewsCount: 0,
      createdAt: now,
      updatedAt: now,
      ...data
    };
  },

  async updateSimulator(id, updates) {
    const existing = await this.getSimulatorById(id);
    if (!existing) return null;
    const now = new Date().toISOString();
    const updated = { ...existing, ...updates, updatedAt: now };
    const tagsJson = JSON.stringify(updated.tags || []);
    await sqliteClient!.execute({
      sql: `UPDATE simulators SET title = ?, slug = ?, description = ?, categoryId = ?, clusterId = ?, filePath = ?, htmlContent = ?, thumbnailUrl = ?, isPublished = ?, author = ?, tags = ?, updatedAt = ? WHERE id = ?`,
      args: [
        updated.title,
        updated.slug,
        updated.description,
        updated.categoryId,
        updated.clusterId || null,
        updated.filePath || null,
        updated.htmlContent || null,
        updated.thumbnailUrl || null,
        updated.isPublished ? 1 : 0,
        updated.author,
        tagsJson,
        now,
        id
      ]
    });
    return updated;
  },

  async deleteSimulator(id) {
    const sim = await this.getSimulatorById(id);
    if (sim?.filePath) {
      const fullPath = path.join(process.cwd(), sim.filePath);
      if (fs.existsSync(fullPath)) {
        try { fs.unlinkSync(fullPath); } catch (e) {}
      }
    }
    const res = await sqliteClient!.execute({
      sql: 'DELETE FROM simulators WHERE id = ?',
      args: [id]
    });
    return (res.rowsAffected || 0) > 0;
  }
};

// ----------------------------------------------------
// 2. MySQL Driver Implementation (VPS MySQL / MariaDB)
// ----------------------------------------------------
const mysqlAdapter: DatabaseAdapter = {
  async init() {
    const host = process.env.MYSQL_HOST || 'localhost';
    const port = Number(process.env.MYSQL_PORT || 3306);
    const user = process.env.MYSQL_USER || 'root';
    const password = process.env.MYSQL_PASSWORD || '';
    const database = process.env.MYSQL_DATABASE || 'edusim';

    // Parse DATABASE_URL if available
    let poolConfig: mysql.PoolOptions = {
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };

    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('mysql')) {
      try {
        const u = new URL(process.env.DATABASE_URL);
        poolConfig = {
          host: u.hostname,
          port: Number(u.port || 3306),
          user: decodeURIComponent(u.username),
          password: decodeURIComponent(u.password),
          database: u.pathname.replace(/^\//, ''),
          waitForConnections: true,
          connectionLimit: 10
        };
      } catch (err) {
        console.error('Failed to parse DATABASE_URL for MySQL:', err);
      }
    }

    mysqlPool = mysql.createPool(poolConfig);

    // Test connection & create tables
    const conn = await mysqlPool.getConnection();
    try {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS clusters (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          code VARCHAR(64) UNIQUE NOT NULL,
          description TEXT,
          subscriptionTier VARCHAR(32) DEFAULT 'PRO',
          subscriptionStatus VARCHAR(32) DEFAULT 'ACTIVE',
          maxSimulators INT DEFAULT 50,
          maxTeachers INT DEFAULT 15,
          primaryColor VARCHAR(32) DEFAULT '#0284c7',
          createdAt VARCHAR(64) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(64) PRIMARY KEY,
          username VARCHAR(64) UNIQUE NOT NULL,
          name VARCHAR(255),
          email VARCHAR(255),
          passwordHash TEXT NOT NULL,
          role VARCHAR(32) NOT NULL,
          clusterId VARCHAR(64),
          createdAt VARCHAR(64) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(64) UNIQUE NOT NULL,
          description TEXT,
          icon VARCHAR(64),
          color VARCHAR(32)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS simulators (
          id VARCHAR(64) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          slug VARCHAR(255) NOT NULL,
          description TEXT,
          categoryId VARCHAR(64) NOT NULL,
          clusterId VARCHAR(64),
          filePath TEXT,
          htmlContent LONGTEXT,
          thumbnailUrl TEXT,
          isPublished TINYINT(1) DEFAULT 1,
          viewsCount INT DEFAULT 0,
          author VARCHAR(255),
          tags TEXT,
          createdAt VARCHAR(64) NOT NULL,
          updatedAt VARCHAR(64) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Seed Super Admin if missing
      const [userRows]: any = await conn.query('SELECT id FROM users WHERE role = ? LIMIT 1', ['SUPER_ADMIN']);
      const defaultSuperAdminUser = process.env.SUPERADMIN_USERNAME || process.env.ADMIN_USERNAME || 'superadmin';
      const defaultSuperAdminPass = process.env.SUPERADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'superadmin123';

      if (userRows.length === 0) {
        console.log(`[Database: MySQL] Initializing Clean Database with default Super Admin: ${defaultSuperAdminUser}`);
        await conn.query(
          `INSERT INTO users (id, username, name, email, passwordHash, role, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            'usr-superadmin',
            defaultSuperAdminUser,
            'Super Administrator',
            'superadmin@edusim.hub',
            hashPassword(defaultSuperAdminPass),
            'SUPER_ADMIN',
            new Date().toISOString()
          ]
        );
      }

      // Seed standard categories if empty
      const [catRows]: any = await conn.query('SELECT COUNT(*) as count FROM categories');
      if (Number(catRows[0]?.count || 0) === 0) {
        for (const cat of defaultCleanCategories) {
          await conn.query(
            `INSERT INTO categories (id, name, slug, description, icon, color) VALUES (?, ?, ?, ?, ?, ?)`,
            [cat.id, cat.name, cat.slug, cat.description, cat.icon, cat.color]
          );
        }
      }
    } finally {
      conn.release();
    }
  },

  // Clusters
  async getClusters() {
    const [rows]: any = await mysqlPool!.query('SELECT * FROM clusters ORDER BY createdAt DESC');
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      description: r.description || '',
      subscriptionTier: r.subscriptionTier || 'PRO',
      subscriptionStatus: r.subscriptionStatus || 'ACTIVE',
      maxSimulators: Number(r.maxSimulators || 50),
      maxTeachers: Number(r.maxTeachers || 15),
      primaryColor: r.primaryColor || '#0284c7',
      createdAt: r.createdAt
    }));
  },

  async getClusterById(id: string) {
    const [rows]: any = await mysqlPool!.query('SELECT * FROM clusters WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      code: r.code,
      description: r.description || '',
      subscriptionTier: r.subscriptionTier || 'PRO',
      subscriptionStatus: r.subscriptionStatus || 'ACTIVE',
      maxSimulators: Number(r.maxSimulators || 50),
      maxTeachers: Number(r.maxTeachers || 15),
      primaryColor: r.primaryColor || '#0284c7',
      createdAt: r.createdAt
    };
  },

  async getClusterByCode(code: string) {
    const [rows]: any = await mysqlPool!.query('SELECT * FROM clusters WHERE LOWER(code) = LOWER(?) LIMIT 1', [code]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      code: r.code,
      description: r.description || '',
      subscriptionTier: r.subscriptionTier || 'PRO',
      subscriptionStatus: r.subscriptionStatus || 'ACTIVE',
      maxSimulators: Number(r.maxSimulators || 50),
      maxTeachers: Number(r.maxTeachers || 15),
      primaryColor: r.primaryColor || '#0284c7',
      createdAt: r.createdAt
    };
  },

  async addCluster(data) {
    const id = 'cluster-' + Date.now();
    const createdAt = new Date().toISOString();
    await mysqlPool!.query(
      `INSERT INTO clusters (id, name, code, description, subscriptionTier, subscriptionStatus, maxSimulators, maxTeachers, primaryColor, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        data.code.toLowerCase(),
        data.description || '',
        data.subscriptionTier || 'PRO',
        data.subscriptionStatus || 'ACTIVE',
        data.maxSimulators || 50,
        data.maxTeachers || 15,
        data.primaryColor || '#0284c7',
        createdAt
      ]
    );
    return { id, createdAt, ...data, code: data.code.toLowerCase() };
  },

  async updateCluster(id, updates) {
    const existing = await this.getClusterById(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    await mysqlPool!.query(
      `UPDATE clusters SET name = ?, code = ?, description = ?, subscriptionTier = ?, subscriptionStatus = ?, maxSimulators = ?, maxTeachers = ?, primaryColor = ? WHERE id = ?`,
      [
        updated.name,
        updated.code.toLowerCase(),
        updated.description,
        updated.subscriptionTier,
        updated.subscriptionStatus,
        updated.maxSimulators,
        updated.maxTeachers,
        updated.primaryColor || '#0284c7',
        id
      ]
    );
    return updated;
  },

  async deleteCluster(id) {
    await mysqlPool!.query('DELETE FROM simulators WHERE clusterId = ?', [id]);
    await mysqlPool!.query('DELETE FROM users WHERE clusterId = ?', [id]);
    const [result]: any = await mysqlPool!.query('DELETE FROM clusters WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  // Users
  async getUsers(clusterId) {
    let sql = 'SELECT * FROM users';
    const params: any[] = [];
    if (clusterId) {
      sql += ' WHERE clusterId = ?';
      params.push(clusterId);
    }
    sql += ' ORDER BY createdAt DESC';
    const [rows]: any = await mysqlPool!.query(sql, params);
    return rows.map((r: any) => ({
      id: r.id,
      username: r.username,
      name: r.name || r.username,
      email: r.email || '',
      passwordHash: r.passwordHash,
      role: r.role as UserRole,
      clusterId: r.clusterId || undefined,
      createdAt: r.createdAt
    }));
  },

  async getUserByUsername(username) {
    const [rows]: any = await mysqlPool!.query('SELECT * FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1', [username]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      username: r.username,
      name: r.name || r.username,
      email: r.email || '',
      passwordHash: r.passwordHash,
      role: r.role as UserRole,
      clusterId: r.clusterId || undefined,
      createdAt: r.createdAt
    };
  },

  async getUserById(id) {
    const [rows]: any = await mysqlPool!.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      username: r.username,
      name: r.name || r.username,
      email: r.email || '',
      passwordHash: r.passwordHash,
      role: r.role as UserRole,
      clusterId: r.clusterId || undefined,
      createdAt: r.createdAt
    };
  },

  async addUser(data) {
    const id = 'usr-' + Date.now();
    const createdAt = new Date().toISOString();
    await mysqlPool!.query(
      `INSERT INTO users (id, username, name, email, passwordHash, role, clusterId, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.username,
        data.name || data.username,
        data.email || `${data.username}@cluster.local`,
        data.passwordHash,
        data.role,
        data.clusterId || null,
        createdAt
      ]
    );
    return { id, createdAt, ...data };
  },

  async deleteUser(id) {
    const [result]: any = await mysqlPool!.query('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  // Categories
  async getCategories() {
    const [rows]: any = await mysqlPool!.query('SELECT * FROM categories ORDER BY name ASC');
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description || '',
      icon: r.icon || 'Atom',
      color: r.color || 'blue'
    }));
  },

  async getCategoryById(id) {
    const [rows]: any = await mysqlPool!.query('SELECT * FROM categories WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description || '',
      icon: r.icon || 'Atom',
      color: r.color || 'blue'
    };
  },

  async addCategory(data) {
    const id = 'cat-' + Date.now();
    await mysqlPool!.query(
      `INSERT INTO categories (id, name, slug, description, icon, color) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, data.name, data.slug, data.description || '', data.icon || 'Atom', data.color || 'blue']
    );
    return { id, ...data };
  },

  async updateCategory(id, updates) {
    const existing = await this.getCategoryById(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    await mysqlPool!.query(
      `UPDATE categories SET name = ?, slug = ?, description = ?, icon = ?, color = ? WHERE id = ?`,
      [updated.name, updated.slug, updated.description, updated.icon, updated.color, id]
    );
    return updated;
  },

  async deleteCategory(id) {
    const [result]: any = await mysqlPool!.query('DELETE FROM categories WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  // Simulators
  async getSimulators(options) {
    let sql = 'SELECT * FROM simulators WHERE 1=1';
    const params: any[] = [];

    if (options?.clusterId && options.clusterId !== 'all') {
      sql += ' AND clusterId = ?';
      params.push(options.clusterId);
    }

    if (options?.isPublished !== undefined) {
      sql += ' AND isPublished = ?';
      params.push(options.isPublished ? 1 : 0);
    }

    if (options?.categoryId && options.categoryId !== 'all') {
      sql += ' AND categoryId = ?';
      params.push(options.categoryId);
    }

    if (options?.search) {
      sql += ' AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(tags) LIKE ?)';
      const q = `%${options.search.toLowerCase()}%`;
      params.push(q, q, q);
    }

    sql += ' ORDER BY createdAt DESC';

    const [rows]: any = await mysqlPool!.query(sql, params);
    return rows.map((r: any) => {
      let parsedTags: string[] = [];
      try {
        parsedTags = JSON.parse(r.tags || '[]');
      } catch {
        parsedTags = (r.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean);
      }
      return {
        id: r.id,
        title: r.title,
        slug: r.slug,
        description: r.description || '',
        categoryId: r.categoryId,
        clusterId: r.clusterId || undefined,
        filePath: r.filePath || undefined,
        htmlContent: r.htmlContent || undefined,
        thumbnailUrl: r.thumbnailUrl || undefined,
        isPublished: Number(r.isPublished) === 1,
        viewsCount: Number(r.viewsCount || 0),
        author: r.author || 'Pengajar EduHub',
        tags: parsedTags,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      };
    });
  },

  async getSimulatorById(id) {
    const [rows]: any = await mysqlPool!.query('SELECT * FROM simulators WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) return null;
    const r = rows[0];
    let parsedTags: string[] = [];
    try {
      parsedTags = JSON.parse(r.tags || '[]');
    } catch {
      parsedTags = (r.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean);
    }
    return {
      id: r.id,
      title: r.title,
      slug: r.slug,
      description: r.description || '',
      categoryId: r.categoryId,
      clusterId: r.clusterId || undefined,
      filePath: r.filePath || undefined,
      htmlContent: r.htmlContent || undefined,
      thumbnailUrl: r.thumbnailUrl || undefined,
      isPublished: Number(r.isPublished) === 1,
      viewsCount: Number(r.viewsCount || 0),
      author: r.author || 'Pengajar EduHub',
      tags: parsedTags,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    };
  },

  async incrementViewCount(id) {
    await mysqlPool!.query('UPDATE simulators SET viewsCount = viewsCount + 1 WHERE id = ?', [id]);
  },

  async addSimulator(data) {
    const id = 'sim-' + Date.now();
    const now = new Date().toISOString();
    const tagsJson = JSON.stringify(data.tags || []);
    await mysqlPool!.query(
      `INSERT INTO simulators (id, title, slug, description, categoryId, clusterId, filePath, htmlContent, thumbnailUrl, isPublished, viewsCount, author, tags, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.title,
        data.slug,
        data.description || '',
        data.categoryId,
        data.clusterId || null,
        data.filePath || null,
        data.htmlContent || null,
        data.thumbnailUrl || null,
        data.isPublished ? 1 : 0,
        0,
        data.author || 'Pengajar EduHub',
        tagsJson,
        now,
        now
      ]
    );
    return {
      id,
      viewsCount: 0,
      createdAt: now,
      updatedAt: now,
      ...data
    };
  },

  async updateSimulator(id, updates) {
    const existing = await this.getSimulatorById(id);
    if (!existing) return null;
    const now = new Date().toISOString();
    const updated = { ...existing, ...updates, updatedAt: now };
    const tagsJson = JSON.stringify(updated.tags || []);
    await mysqlPool!.query(
      `UPDATE simulators SET title = ?, slug = ?, description = ?, categoryId = ?, clusterId = ?, filePath = ?, htmlContent = ?, thumbnailUrl = ?, isPublished = ?, author = ?, tags = ?, updatedAt = ? WHERE id = ?`,
      [
        updated.title,
        updated.slug,
        updated.description,
        updated.categoryId,
        updated.clusterId || null,
        updated.filePath || null,
        updated.htmlContent || null,
        updated.thumbnailUrl || null,
        updated.isPublished ? 1 : 0,
        updated.author,
        tagsJson,
        now,
        id
      ]
    );
    return updated;
  },

  async deleteSimulator(id) {
    const sim = await this.getSimulatorById(id);
    if (sim?.filePath) {
      const fullPath = path.join(process.cwd(), sim.filePath);
      if (fs.existsSync(fullPath)) {
        try { fs.unlinkSync(fullPath); } catch (e) {}
      }
    }
    const [result]: any = await mysqlPool!.query('DELETE FROM simulators WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

// Select Active DB Adapter
export const db: DatabaseAdapter = DB_TYPE === 'mysql' ? mysqlAdapter : sqliteAdapter;

export async function initDatabase() {
  console.log(`[Database] Initializing ${DB_TYPE.toUpperCase()} database engine...`);
  try {
    await db.init();
    console.log(`[Database] ${DB_TYPE.toUpperCase()} database ready & connected.`);
  } catch (err) {
    console.error(`[Database] Error initializing ${DB_TYPE.toUpperCase()}:`, err);
    if (DB_TYPE === 'mysql') {
      console.log(`[Database] Falling back to SQLite file storage...`);
      await sqliteAdapter.init();
    } else {
      throw err;
    }
  }
}
