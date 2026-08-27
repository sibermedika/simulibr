import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { db, initDatabase, UPLOADS_DIR } from './server/db';
import {
  authenticateToken,
  requireSuperAdmin,
  requireClusterAdmin,
  requireTeacherOrAdmin,
  comparePassword,
  hashPassword,
  generateToken,
  AuthenticatedRequest
} from './server/auth';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize SQLite / MySQL database & default Superadmin
  await initDatabase();

  app.use(cors());
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Serve static HTML uploads
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Configure Multer for HTML file uploads
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, UPLOADS_DIR);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, `${uniqueSuffix}-${cleanName}`);
    }
  });

  const upload = multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
    fileFilter: (_req, file, cb) => {
      if (file.mimetype === 'text/html' || file.originalname.endsWith('.html') || file.originalname.endsWith('.htm')) {
        cb(null, true);
      } else {
        cb(new Error('Hanya file single-file HTML (.html / .htm) yang diperbolehkan.'));
      }
    }
  });

  // =====================================
  // 1. AUTHENTICATION ENDPOINTS
  // =====================================

  // POST /api/auth/login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username dan Password wajib diisi.' });
      }

      const user = await db.getUserByUsername(username);
      if (!user || !comparePassword(password, user.passwordHash)) {
        return res.status(401).json({ error: 'Kredensial tidak cocok. Periksa username dan password.' });
      }

      const cluster = user.clusterId ? await db.getClusterById(user.clusterId) : null;

      const tokenPayload = {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        clusterId: user.clusterId,
        clusterCode: cluster?.code
      };

      const token = generateToken(tokenPayload);

      return res.json({
        message: 'Login berhasil',
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name || user.username,
          email: user.email,
          role: user.role,
          clusterId: user.clusterId,
          clusterCode: cluster?.code,
          clusterName: cluster?.name
        }
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Terjadi kesalahan sistem saat otentikasi.' });
    }
  });

  // GET /api/auth/me
  app.get('/api/auth/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Tidak terotentikasi' });
      const fullUser = await db.getUserById(req.user.id);
      const cluster = fullUser?.clusterId ? await db.getClusterById(fullUser.clusterId) : null;

      res.json({
        user: {
          id: req.user.id,
          username: req.user.username,
          name: fullUser?.name || req.user.username,
          email: fullUser?.email,
          role: req.user.role,
          clusterId: req.user.clusterId,
          clusterCode: cluster?.code,
          clusterName: cluster?.name
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // =====================================
  // 2. CLUSTER SAAS ENDPOINTS
  // =====================================

  // GET /api/clusters
  app.get('/api/clusters', async (_req, res) => {
    try {
      const rawClusters = await db.getClusters();
      const clustersWithCounts = await Promise.all(
        rawClusters.map(async cluster => {
          const sims = await db.getSimulators({ clusterId: cluster.id });
          const users = await db.getUsers(cluster.id);
          const teachers = users.filter(u => u.role === 'TEACHER_CLUSTER');
          const students = users.filter(u => u.role === 'STUDENT_CLUSTER');

          return {
            ...cluster,
            simulatorsCount: sims.length,
            teachersCount: teachers.length,
            studentsCount: students.length
          };
        })
      );
      res.json(clustersWithCounts);
    } catch (err: any) {
      console.error('Error fetching clusters:', err);
      res.status(500).json({ error: 'Gagal mengambil data cluster.' });
    }
  });

  // GET /api/clusters/:id
  app.get('/api/clusters/:id', async (req, res) => {
    try {
      const cluster = await db.getClusterById(req.params.id);
      if (!cluster) {
        return res.status(404).json({ error: 'Cluster tidak ditemukan.' });
      }
      const sims = await db.getSimulators({ clusterId: cluster.id });
      const users = await db.getUsers(cluster.id);
      res.json({
        ...cluster,
        simulatorsCount: sims.length,
        users
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/clusters (Super Admin creates a new institution cluster)
  app.post('/api/clusters', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const { name, code, description, subscriptionTier, maxSimulators, maxTeachers, primaryColor, adminUsername, adminPassword, adminName } = req.body;

      if (!name || !code) {
        return res.status(400).json({ error: 'Nama Institusi/Cluster dan Kode Unik wajib diisi.' });
      }

      const cleanCode = code.toLowerCase().replace(/[^a-z0-9]/g, '');
      const existing = await db.getClusterByCode(cleanCode);
      if (existing) {
        return res.status(400).json({ error: `Kode cluster "${cleanCode}" sudah digunakan.` });
      }

      const newCluster = await db.addCluster({
        name,
        code: cleanCode,
        description: description || `Cluster Kurasi Simulator untuk ${name}`,
        subscriptionTier: subscriptionTier || 'PRO',
        subscriptionStatus: 'ACTIVE',
        maxSimulators: maxSimulators ? Number(maxSimulators) : 50,
        maxTeachers: maxTeachers ? Number(maxTeachers) : 15,
        primaryColor: primaryColor || '#0284c7'
      });

      // Optionally create Cluster Admin user
      let createdAdmin = null;
      if (adminUsername && adminPassword) {
        createdAdmin = await db.addUser({
          username: adminUsername,
          name: adminName || `Admin ${name}`,
          email: `${adminUsername}@${cleanCode}.sch.id`,
          passwordHash: hashPassword(adminPassword),
          role: 'ADMIN_CLUSTER',
          clusterId: newCluster.id
        });
      }

      res.status(201).json({
        cluster: newCluster,
        adminUser: createdAdmin ? { username: createdAdmin.username, role: createdAdmin.role } : null
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal membuat cluster baru.' });
    }
  });

  // PUT /api/clusters/:id (Super Admin or Cluster Admin)
  app.put('/api/clusters/:id', authenticateToken, requireClusterAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      if (req.user?.role !== 'SUPER_ADMIN' && req.user?.clusterId !== id) {
        return res.status(403).json({ error: 'Anda tidak memiliki hak untuk mengubah cluster ini.' });
      }

      const updated = await db.updateCluster(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Cluster tidak ditemukan.' });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/clusters/:id (Super Admin only)
  app.delete('/api/clusters/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await db.deleteCluster(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Cluster tidak ditemukan.' });
      }
      res.json({ message: 'Cluster berlangganan berhasil dihapus.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // =====================================
  // 3. USER MANAGEMENT ENDPOINTS
  // =====================================

  // GET /api/users
  app.get('/api/users', authenticateToken, requireClusterAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      let users = [];
      if (req.user?.role === 'SUPER_ADMIN') {
        users = await db.getUsers();
      } else {
        users = await db.getUsers(req.user?.clusterId);
      }

      const mappedUsers = users.map(u => ({
        id: u.id,
        username: u.username,
        name: u.name || u.username,
        email: u.email,
        role: u.role,
        clusterId: u.clusterId,
        createdAt: u.createdAt
      }));

      res.json(mappedUsers);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/users (Add Teacher or Student to Cluster)
  app.post('/api/users', authenticateToken, requireClusterAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { username, name, email, password, role, clusterId } = req.body;

      if (!username || !password || !role) {
        return res.status(400).json({ error: 'Username, Password, dan Role wajib diisi.' });
      }

      const targetClusterId = req.user?.role === 'SUPER_ADMIN' ? (clusterId || req.user?.clusterId) : req.user?.clusterId;

      const existing = await db.getUserByUsername(username);
      if (existing) {
        return res.status(400).json({ error: 'Username sudah digunakan.' });
      }

      const newUser = await db.addUser({
        username,
        name: name || username,
        email: email || `${username}@cluster.id`,
        passwordHash: hashPassword(password),
        role,
        clusterId: targetClusterId
      });

      res.status(201).json({
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role,
        clusterId: newUser.clusterId
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/users/:id
  app.delete('/api/users/:id', authenticateToken, requireClusterAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const user = await db.getUserById(id);
      if (!user) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });

      if (req.user?.role !== 'SUPER_ADMIN' && user.clusterId !== req.user?.clusterId) {
        return res.status(403).json({ error: 'Anda hanya dapat mengelola pengguna di cluster Anda.' });
      }

      await db.deleteUser(id);
      res.json({ message: 'Pengguna berhasil dihapus.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // =====================================
  // 4. CATEGORY ENDPOINTS
  // =====================================

  // GET /api/categories
  app.get('/api/categories', async (_req, res) => {
    try {
      const categories = await db.getCategories();
      res.json(categories);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/categories (Cluster Admin or Super Admin)
  app.post('/api/categories', authenticateToken, requireClusterAdmin, async (req, res) => {
    try {
      const { name, slug, description, icon, color } = req.body;
      if (!name || !slug) {
        return res.status(400).json({ error: 'Nama kategori dan Slug wajib diisi.' });
      }

      const newCategory = await db.addCategory({
        name,
        slug,
        description: description || '',
        icon: icon || 'Atom',
        color: color || 'blue'
      });

      res.status(201).json(newCategory);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/categories/:id
  app.put('/api/categories/:id', authenticateToken, requireClusterAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await db.updateCategory(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Kategori tidak ditemukan.' });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/categories/:id
  app.delete('/api/categories/:id', authenticateToken, requireClusterAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await db.deleteCategory(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Kategori tidak ditemukan.' });
      }
      res.json({ message: 'Kategori berhasil dihapus.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // =====================================
  // 5. SIMULATOR ENDPOINTS
  // =====================================

  // GET /api/simulators
  app.get('/api/simulators', async (req, res) => {
    try {
      const { categoryId, clusterId, search, isPublished } = req.query;

      let publishedFilter: boolean | undefined = undefined;
      if (isPublished === 'true') publishedFilter = true;
      if (isPublished === 'false') publishedFilter = false;

      const rawList = await db.getSimulators({
        categoryId: categoryId as string,
        clusterId: clusterId as string,
        search: search as string,
        isPublished: publishedFilter
      });

      const listWithClusterNames = await Promise.all(
        rawList.map(async s => {
          const cluster = s.clusterId ? await db.getClusterById(s.clusterId) : null;
          return {
            ...s,
            clusterName: cluster?.name || 'Global Public'
          };
        })
      );

      res.json(listWithClusterNames);
    } catch (err: any) {
      console.error('Error fetching simulators:', err);
      res.status(500).json({ error: 'Gagal mengambil data simulator.' });
    }
  });

  // GET /api/simulators/:id
  app.get('/api/simulators/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const sim = await db.getSimulatorById(id);
      if (!sim) {
        return res.status(404).json({ error: 'Simulator tidak ditemukan.' });
      }

      // Increment view count
      await db.incrementViewCount(id);

      const cluster = sim.clusterId ? await db.getClusterById(sim.clusterId) : null;

      res.json({
        ...sim,
        viewsCount: (sim.viewsCount || 0) + 1,
        clusterName: cluster?.name || 'Global Public'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/simulators/:id/raw (Delivers HTML content directly for sandbox iframe)
  app.get('/api/simulators/:id/raw', async (req, res) => {
    try {
      const { id } = req.params;
      const sim = await db.getSimulatorById(id);
      if (!sim) {
        return res.status(404).send('<h2>Simulator tidak ditemukan</h2>');
      }

      if (sim.filePath) {
        const fullPath = path.join(process.cwd(), sim.filePath);
        if (fs.existsSync(fullPath)) {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          return res.sendFile(fullPath);
        }
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(sim.htmlContent || '<h2>Simulasi kosong</h2>');
    } catch (err: any) {
      res.status(500).send('<h2>Terjadi kesalahan saat memuat simulasi</h2>');
    }
  });

  // POST /api/simulators (Teachers, Cluster Admins, or Super Admins)
  app.post('/api/simulators', authenticateToken, requireTeacherOrAdmin, upload.single('file'), async (req: AuthenticatedRequest, res) => {
    try {
      const { title, slug, description, categoryId, clusterId, isPublished, tags, author, htmlContent } = req.body;

      if (!title || !categoryId) {
        return res.status(400).json({ error: 'Judul simulator dan Kategori wajib diisi.' });
      }

      // Determine target cluster
      let targetClusterId = clusterId || req.user?.clusterId;
      if (!targetClusterId && req.user?.role !== 'SUPER_ADMIN') {
        targetClusterId = req.user?.clusterId;
      }

      let contentToSave = htmlContent || '';
      let relativeFilePath: string | undefined = undefined;

      if (req.file) {
        relativeFilePath = path.relative(process.cwd(), req.file.path);
        contentToSave = fs.readFileSync(req.file.path, 'utf-8');
      }

      if (!contentToSave && !relativeFilePath) {
        return res.status(400).json({ error: 'Harap unggah file .html atau masukkan kode HTML simulator.' });
      }

      const generatedSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      let parsedTags: string[] = [];
      if (typeof tags === 'string') {
        try {
          parsedTags = JSON.parse(tags);
        } catch {
          parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
        }
      } else if (Array.isArray(tags)) {
        parsedTags = tags;
      }

      const autoPublish = isPublished === 'true' || isPublished === true;
      const authorName = author || req.user?.name || req.user?.username || 'Pengajar EduHub';

      const newSim = await db.addSimulator({
        title,
        slug: generatedSlug,
        description: description || '',
        categoryId,
        clusterId: targetClusterId,
        isPublished: autoPublish,
        tags: parsedTags,
        author: authorName,
        filePath: relativeFilePath,
        htmlContent: contentToSave
      });

      res.status(201).json(newSim);
    } catch (err: any) {
      console.error('Error creating simulator:', err);
      res.status(500).json({ error: err.message || 'Gagal menyimpan simulator.' });
    }
  });

  // PUT /api/simulators/:id
  app.put('/api/simulators/:id', authenticateToken, requireTeacherOrAdmin, upload.single('file'), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const sim = await db.getSimulatorById(id);
      if (!sim) {
        return res.status(404).json({ error: 'Simulator tidak ditemukan.' });
      }

      // Non super admin can only edit their own cluster simulators
      if (req.user?.role !== 'SUPER_ADMIN' && sim.clusterId !== req.user?.clusterId) {
        return res.status(403).json({ error: 'Anda hanya dapat mengedit simulator milik cluster Anda.' });
      }

      const { title, slug, description, categoryId, clusterId, isPublished, tags, author, htmlContent } = req.body;

      let updates: Partial<typeof sim> = {};

      if (title !== undefined) updates.title = title;
      if (slug !== undefined) updates.slug = slug;
      if (description !== undefined) updates.description = description;
      if (categoryId !== undefined) updates.categoryId = categoryId;
      if (clusterId !== undefined) updates.clusterId = clusterId;
      if (isPublished !== undefined) updates.isPublished = isPublished === 'true' || isPublished === true;
      if (author !== undefined) updates.author = author;

      if (tags !== undefined) {
        if (typeof tags === 'string') {
          try { updates.tags = JSON.parse(tags); } catch { updates.tags = tags.split(',').map(t => t.trim()); }
        } else if (Array.isArray(tags)) {
          updates.tags = tags;
        }
      }

      if (req.file) {
        updates.filePath = path.relative(process.cwd(), req.file.path);
        updates.htmlContent = fs.readFileSync(req.file.path, 'utf-8');
      } else if (htmlContent) {
        updates.htmlContent = htmlContent;
      }

      const updated = await db.updateSimulator(id, updates);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/simulators/:id
  app.delete('/api/simulators/:id', authenticateToken, requireTeacherOrAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const sim = await db.getSimulatorById(id);
      if (!sim) return res.status(404).json({ error: 'Simulator tidak ditemukan.' });

      if (req.user?.role !== 'SUPER_ADMIN' && sim.clusterId !== req.user?.clusterId) {
        return res.status(403).json({ error: 'Anda hanya dapat menghapus simulator milik cluster Anda.' });
      }

      await db.deleteSimulator(id);
      res.json({ message: 'Simulator berhasil dihapus.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Educational Simulator Hub running on http://localhost:${PORT}`);
  });
}

startServer();
