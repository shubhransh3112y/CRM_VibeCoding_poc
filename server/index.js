const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (allowedMimes.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Invalid file type'));
  }
});

app.use('/uploads', express.static(UPLOAD_DIR));

const DB_PATH = path.join(__dirname, 'data', 'db.json');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function ensureCollections(db) {
  db.views = db.views || [];
  db.teams = db.teams || [];
  db.notifications = db.notifications || [];
  return db;
}

function readDb() {
  return ensureCollections(JSON.parse(fs.readFileSync(DB_PATH, 'utf8')));
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function toArrayTags(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String).map(t => t.trim()).filter(Boolean);
  return String(val).split(',').map(t => t.trim()).filter(Boolean);
}

function applyTaskFilters(items, query) {
  const q = (query.q || '').toLowerCase();
  const status = (query.status || '').toLowerCase();
  const priority = (query.priority || '').toLowerCase();
  const assignedTo = (query.assignedTo || '').toLowerCase();
  const title = (query.title || '').toLowerCase();
  const dueFrom = query.dueFrom ? new Date(query.dueFrom) : null;
  const dueTo = query.dueTo ? new Date(query.dueTo) : null;
  const tag = (query.tag || '').toLowerCase();

  return items.filter(t => {
    if (status && String(t.status || '').toLowerCase() !== status) return false;
    if (priority && String(t.priority || '').toLowerCase() !== priority) return false;
    if (assignedTo && String(t.assignedTo || '').toLowerCase() !== assignedTo) return false;
    if (title && !String(t.title || '').toLowerCase().includes(title)) return false;
    if (tag) {
      const tags = (t.tags || []).map(x => String(x).toLowerCase());
      if (!tags.includes(tag)) return false;
    }
    if (dueFrom || dueTo) {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      if (dueFrom && d < dueFrom) return false;
      if (dueTo && d > dueTo) return false;
    }
    if (q) {
      const hay = [t.title, t.description, t.reason, t.assignedTo, ...(t.tags || [])]
        .map(v => String(v || '').toLowerCase())
        .join(' ');
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function applyLeadFilters(items, query) {
  const q = (query.q || '').toLowerCase();
  const stage = (query.stage || '').toLowerCase();
  const owner = (query.owner || '').toLowerCase();
  const tag = (query.tag || '').toLowerCase();
  return items.filter(l => {
    if (stage && String(l.stage || '').toLowerCase() !== stage) return false;
    if (owner && String(l.owner || '').toLowerCase() !== owner) return false;
    if (tag) {
      const tags = (l.tags || []).map(x => String(x).toLowerCase());
      if (!tags.includes(tag)) return false;
    }
    if (q) {
      const hay = [l.name, l.email, l.phone, l.owner, ...(l.tags || [])]
        .map(v => String(v || '').toLowerCase())
        .join(' ');
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function applySort(items, sortBy, sortDir) {
  if (!sortBy) return items;
  const dir = String(sortDir || 'asc').toLowerCase() === 'desc' ? -1 : 1;
  return [...items].sort((a, b) => {
    const av = a?.[sortBy];
    const bv = b?.[sortBy];
    if (sortBy === 'dueDate') {
      const ad = av ? new Date(av).getTime() : 0;
      const bd = bv ? new Date(bv).getTime() : 0;
      return ad < bd ? -1 * dir : ad > bd ? 1 * dir : 0;
    }
    const as = (av == null ? '' : String(av)).toLowerCase();
    const bs = (bv == null ? '' : String(bv)).toLowerCase();
    return as < bs ? -1 * dir : as > bs ? 1 * dir : 0;
  });
}

function paginate(items, query) {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const pageSize = Math.max(1, parseInt(query.pageSize || '10', 10));
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return { page, pageSize, total: items.length, items: items.slice(start, end) };
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token' });
  const token = auth.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  const db = readDb();
  const user = db.users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

app.post('/auth/register', (req, res) => {
  const db = readDb();
  const { name, firstName, lastName, email, password } = req.body;
  const displayName = name || [firstName, lastName].filter(Boolean).join(' ').trim();
  if (!email || !password || !displayName) return res.status(400).json({ message: 'name, email and password required' });
  if (db.users.find(u => u.email === email)) return res.status(400).json({ message: 'Email already exists' });
  const newUser = { id: uuidv4(), email, password, name: displayName, firstName: firstName || '', lastName: lastName || '', role: 'user', avatar: null };
  db.users.push(newUser);
  writeDb(db);
  res.status(201).json({ id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role, firstName: newUser.firstName, lastName: newUser.lastName, avatar: newUser.avatar });
});

app.get('/auth/me', authMiddleware, (req, res) => {
  const db = readDb();
  const u = db.users.find(x => x.id === req.user.id);
  if (!u) return res.json({ user: req.user });
  res.json({ user: { id: u.id, email: u.email, role: u.role, name: u.name, firstName: u.firstName, lastName: u.lastName, avatar: u.avatar } });
});

// Tasks
app.get('/tasks', authMiddleware, (req, res) => {
  const db = readDb();
  const user = req.user;
  let tasks = db.tasks;
  if (user.role === 'user') {
    tasks = tasks.filter(t => t.assignedTo === user.id);
  }
  tasks = applyTaskFilters(tasks, req.query);
  tasks = applySort(tasks, req.query.sortBy, req.query.sortDir);
  if (req.query.page || req.query.pageSize) {
    return res.json(paginate(tasks, req.query));
  }
  res.json(tasks);
});

app.post('/tasks', authMiddleware, (req, res) => {
  const db = readDb();
  const user = req.user;
  if (user.role === 'user') return res.status(403).json({ message: 'Only admin/manager can create tasks' });
  const { title, status, priority, dueDate, assignedTo, tags, description, leadId } = req.body;
  if (!title) return res.status(400).json({ message: 'Title required' });
  const now = new Date().toISOString();
  const task = {
    id: uuidv4(),
    title,
    status: status || 'todo',
    priority: priority || 'medium',
    dueDate: dueDate || null,
    assignedTo,
    description: description || '',
    leadId: leadId || null,
    tags: toArrayTags(tags),
    activity: [
      { id: uuidv4(), at: now, by: user.id, action: 'created', summary: `Task created by ${user.email}` }
    ]
  };
  db.tasks.push(task);
  if (assignedTo) {
    db.notifications.push({
      id: uuidv4(),
      at: now,
      userId: assignedTo,
      type: 'task-assigned',
      message: `New task assigned: ${title}`,
      read: false
    });
  }
  writeDb(db);

  // Mock email notify
  if (assignedTo) {
    // find assigned user email
    const assignedUser = db.users.find(u => u.id === assignedTo);
    if (assignedUser) {
      console.log(`Mock: sending email to ${assignedUser.email} about task assignment`);
    }
  }

  res.status(201).json(task);
});

app.put('/tasks/:id', authMiddleware, upload.single('attachment'), (req, res) => {
  const db = readDb();
  const user = req.user;
  const { id } = req.params;
  const idx = db.tasks.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  const task = db.tasks[idx];
  if (user.role === 'user' && task.assignedTo !== user.id) return res.status(403).json({ message: 'Forbidden' });
  const updates = { ...req.body };

  if (req.file) {
    updates.attachment = {
      filename: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      mime: req.file.mimetype
    };
  }

  if (updates.tags) {
    updates.tags = toArrayTags(updates.tags);
  }

  if (updates.status === 'failed' && !req.file && !task.attachment) {
    return res.status(400).json({ message: 'Evidence attachment is required when marking failed' });
  }

  const now = new Date().toISOString();
  const activity = task.activity || [];
  const summary = updates.status ? `Status changed to ${updates.status}` : 'Task updated';
  activity.push({ id: uuidv4(), at: now, by: user.id, action: 'updated', summary });

  if (updates.assignedTo && updates.assignedTo !== task.assignedTo) {
    db.notifications.push({
      id: uuidv4(),
      at: now,
      userId: updates.assignedTo,
      type: 'task-assigned',
      message: `New task assigned: ${task.title}`,
      read: false
    });
  }

  if (updates.status) {
    db.notifications.push({
      id: uuidv4(),
      at: now,
      userId: task.assignedTo || null,
      type: 'task-status',
      message: `Task "${task.title}" status: ${updates.status}`,
      read: false
    });
  }

  db.tasks[idx] = { ...task, ...updates, activity };
  writeDb(db);
  res.json(db.tasks[idx]);
});

app.post('/tasks/bulk', authMiddleware, (req, res) => {
  const db = readDb();
  const user = req.user;
  if (user.role === 'user') return res.status(403).json({ message: 'Forbidden' });
  const { ids = [], updates = {} } = req.body;
  const now = new Date().toISOString();
  let updated = 0;
  const assignedNotifications = [];
  db.tasks = db.tasks.map(t => {
    if (!ids.includes(t.id)) return t;
    updated += 1;
    const activity = t.activity || [];
    activity.push({ id: uuidv4(), at: now, by: user.id, action: 'bulk-update', summary: 'Bulk update applied' });
    const next = { ...t, ...updates, activity };
    if (updates.assignedTo) {
      assignedNotifications.push({
        id: uuidv4(),
        at: now,
        userId: updates.assignedTo,
        type: 'task-assigned',
        message: `New task assigned: ${next.title}`,
        read: false
      });
    }
    return next;
  });
  if (assignedNotifications.length) {
    db.notifications.push(...assignedNotifications);
  }
  writeDb(db);
  res.json({ updated });
});

app.delete('/tasks/:id', authMiddleware, (req, res) => {
  const db = readDb();
  const user = req.user;
  const { id } = req.params;
  const idx = db.tasks.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  const task = db.tasks[idx];
  if (user.role === 'user' && task.assignedTo !== user.id) return res.status(403).json({ message: 'Forbidden' });
  db.tasks.splice(idx, 1);
  writeDb(db);
  res.json({ message: 'Deleted' });
});

app.get('/tasks/:id/activity', authMiddleware, (req, res) => {
  const db = readDb();
  const user = req.user;
  const { id } = req.params;
  const task = db.tasks.find(t => t.id === id);
  if (!task) return res.status(404).json({ message: 'Not found' });
  if (user.role === 'user' && task.assignedTo !== user.id) return res.status(403).json({ message: 'Forbidden' });
  res.json(task.activity || []);
});

// Leads
app.get('/leads', authMiddleware, (req, res) => {
  const db = readDb();
  const { stage } = req.query;
  let leads = db.leads;
  if (stage) leads = leads.filter(l => l.stage === stage);
  leads = applyLeadFilters(leads, req.query);
  leads = applySort(leads, req.query.sortBy, req.query.sortDir);
  if (req.query.page || req.query.pageSize) {
    return res.json(paginate(leads, req.query));
  }
  res.json(leads);
});

app.post('/leads', authMiddleware, (req, res) => {
  const db = readDb();
  const { name, email, phone, stage, owner, tags } = req.body;
  const now = new Date().toISOString();
  const lead = {
    id: uuidv4(),
    name, email, phone,
    stage: stage || 'new',
    owner,
    tags: toArrayTags(tags),
    activity: [{ id: uuidv4(), at: now, by: req.user.id, action: 'created', summary: `Lead created by ${req.user.email}` }]
  };
  db.leads.push(lead);
  db.notifications.push({
    id: uuidv4(),
    at: now,
    userId: owner || null,
    type: 'lead-created',
    message: `New lead assigned: ${name}`,
    read: false
  });
  writeDb(db);
  res.status(201).json(lead);
});

app.put('/leads/:id', authMiddleware, (req, res) => {
  const db = readDb();
  const { id } = req.params;
  const idx = db.leads.findIndex(l => l.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Lead not found' });
  const updates = { ...req.body };
  if (updates.tags) updates.tags = toArrayTags(updates.tags);
  const lead = db.leads[idx];
  const now = new Date().toISOString();
  const activity = lead.activity || [];
  activity.push({ id: uuidv4(), at: now, by: req.user.id, action: 'updated', summary: 'Lead updated' });
  if (updates.stage) {
    db.notifications.push({
      id: uuidv4(),
      at: now,
      userId: lead.owner || null,
      type: 'lead-stage',
      message: `Lead "${lead.name}" stage: ${updates.stage}`,
      read: false
    });
  }
  db.leads[idx] = { ...lead, ...updates, activity };
  writeDb(db);
  res.json(db.leads[idx]);
});

app.post('/leads/bulk', authMiddleware, (req, res) => {
  const db = readDb();
  const user = req.user;
  if (user.role === 'user') return res.status(403).json({ message: 'Forbidden' });
  const { ids = [], updates = {} } = req.body;
  const now = new Date().toISOString();
  let updated = 0;
  db.leads = db.leads.map(l => {
    if (!ids.includes(l.id)) return l;
    updated += 1;
    const activity = l.activity || [];
    activity.push({ id: uuidv4(), at: now, by: user.id, action: 'bulk-update', summary: 'Bulk update applied' });
    return { ...l, ...updates, activity };
  });
  writeDb(db);
  res.json({ updated });
});

app.get('/notifications', authMiddleware, (req, res) => {
  const db = readDb();
  const user = req.user;
  const items = db.notifications.filter(n => !n.userId || n.userId === user.id).slice().reverse();
  res.json(items);
});

app.post('/notifications/:id/read', authMiddleware, (req, res) => {
  const db = readDb();
  const { id } = req.params;
  const idx = db.notifications.findIndex(n => n.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  db.notifications[idx].read = true;
  writeDb(db);
  res.json(db.notifications[idx]);
});

app.post('/notifications/read-all', authMiddleware, (req, res) => {
  const db = readDb();
  const user = req.user;
  let updated = 0;
  db.notifications = db.notifications.map(n => {
    if ((n.userId == null || n.userId === user.id) && !n.read) {
      updated += 1;
      return { ...n, read: true };
    }
    return n;
  });
  writeDb(db);
  res.json({ updated });
});

app.get('/views', authMiddleware, (req, res) => {
  const db = readDb();
  const user = req.user;
  res.json(db.views.filter(v => v.userId === user.id));
});

app.post('/views', authMiddleware, (req, res) => {
  const db = readDb();
  const user = req.user;
  const { name, page, filters } = req.body;
  if (!name || !page) return res.status(400).json({ message: 'name and page required' });
  const view = { id: uuidv4(), userId: user.id, name, page, filters };
  db.views.push(view);
  writeDb(db);
  res.status(201).json(view);
});

app.get('/teams', authMiddleware, (req, res) => {
  const db = readDb();
  res.json(db.teams);
});

app.post('/teams', authMiddleware, (req, res) => {
  const db = readDb();
  const { name, members = [] } = req.body;
  if (!name) return res.status(400).json({ message: 'name required' });
  const team = { id: uuidv4(), name, members };
  db.teams.push(team);
  writeDb(db);
  res.status(201).json(team);
});

app.get('/leads/:id/activity', authMiddleware, (req, res) => {
  const db = readDb();
  const { id } = req.params;
  const lead = db.leads.find(l => l.id === id);
  if (!lead) return res.status(404).json({ message: 'Not found' });
  res.json(lead.activity || []);
});

// Users (admin managed)
app.get('/users', authMiddleware, (req, res) => {
  const db = readDb();
  const user = req.user;
  // Admin and manager can view all users; regular users only see themselves
  if (user.role === 'user') {
    const u = db.users.find(x => x.id === user.id);
    return res.json(u ? [u] : []);
  }
  res.json(db.users.map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role })));
});

app.put('/users/me', authMiddleware, upload.single('avatar'), (req, res) => {
  const db = readDb();
  const user = req.user;
  let idx = db.users.findIndex(u => u.id === user.id);
  if (idx === -1) {
    const created = { id: user.id, email: user.email || '', password: '', name: user.name || '', firstName: '', lastName: '', role: user.role || 'user', avatar: null };
    db.users.push(created);
    idx = db.users.length - 1;
  }

  const existing = db.users[idx];
  const { firstName, lastName, name, email, password, removeAvatar } = req.body;

  if (email && db.users.some(u => u.email === email && u.id !== user.id)) {
    return res.status(400).json({ message: 'Email already exists' });
  }

  const updates = {};
  if (firstName !== undefined) updates.firstName = String(firstName || '');
  if (lastName !== undefined) updates.lastName = String(lastName || '');
  if (name !== undefined) updates.name = String(name || '');
  if (email !== undefined) updates.email = String(email || '');
  if (password !== undefined && String(password)) updates.password = String(password);

  const shouldRemoveAvatar = String(removeAvatar || '').toLowerCase() === 'true';
  if (shouldRemoveAvatar && existing.avatar?.url) {
    const p = path.join(UPLOAD_DIR, path.basename(existing.avatar.url));
    if (fs.existsSync(p)) {
      try { fs.unlinkSync(p); } catch (e) {}
    }
    updates.avatar = null;
  }

  if (req.file) {
    const ext = path.extname(req.file.originalname || '').toLowerCase();
    const isImage = req.file.mimetype === 'image/jpeg' || req.file.mimetype === 'image/png';
    if (!isImage || !['.jpg', '.jpeg', '.png'].includes(ext)) {
      const p = path.join(UPLOAD_DIR, path.basename(req.file.filename));
      if (fs.existsSync(p)) {
        try { fs.unlinkSync(p); } catch (e) {}
      }
      return res.status(400).json({ message: 'Only jpg, jpeg, png files are allowed' });
    }
    if (existing.avatar?.url) {
      const p = path.join(UPLOAD_DIR, path.basename(existing.avatar.url));
      if (fs.existsSync(p)) {
        try { fs.unlinkSync(p); } catch (e) {}
      }
    }
    updates.avatar = {
      filename: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      mime: req.file.mimetype
    };
  }

  if ((updates.firstName !== undefined || updates.lastName !== undefined) && !updates.name) {
    const fn = updates.firstName !== undefined ? updates.firstName : (existing.firstName || '');
    const ln = updates.lastName !== undefined ? updates.lastName : (existing.lastName || '');
    const merged = [fn, ln].filter(Boolean).join(' ').trim();
    if (merged) updates.name = merged;
  }

  db.users[idx] = { ...existing, ...updates };
  writeDb(db);
  const u = db.users[idx];
  res.json({ id: u.id, email: u.email, role: u.role, name: u.name, firstName: u.firstName, lastName: u.lastName, avatar: u.avatar });
});

// Global search
app.get('/search', authMiddleware, (req, res) => {
  const db = readDb();
  const q = (req.query.q || '').toLowerCase();
  if (!q) return res.json({ tasks: [], leads: [], users: [] });
  let tasks = db.tasks;
  if (req.user.role === 'user') tasks = tasks.filter(t => t.assignedTo === req.user.id);
  tasks = tasks.filter(t => [t.title, t.description, t.reason, ...(t.tags || [])].map(v => String(v || '').toLowerCase()).join(' ').includes(q));
  const leads = db.leads.filter(l => [l.name, l.email, l.phone, ...(l.tags || [])].map(v => String(v || '').toLowerCase()).join(' ').includes(q));
  const users = db.users
    .filter(u => [u.name, u.email, u.role].map(v => String(v || '').toLowerCase()).join(' ').includes(q))
    .map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }));
  res.json({ tasks, leads, users });
});

// Dashboard summary
app.get('/dashboard/summary', authMiddleware, (req, res) => {
  const db = readDb();
  const user = req.user;
  let tasks = db.tasks;
  if (user.role === 'user') tasks = tasks.filter(t => t.assignedTo === user.id);
  const leads = db.leads;
  const tasksByStatus = tasks.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {});
  const leadsByStage = leads.reduce((acc, l) => { acc[l.stage] = (acc[l.stage] || 0) + 1; return acc; }, {});
  const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length;
  res.json({
    totalTasks: tasks.length,
    totalLeads: leads.length,
    overdueTasks: overdue,
    tasksByStatus,
    leadsByStage
  });
});

app.post('/users', authMiddleware, (req, res) => {
  const db = readDb();
  const user = req.user;
  if (user.role !== 'admin') return res.status(403).json({ message: 'Only admin can create users' });
  const { email, password, name, role } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'email and password required' });
  if (db.users.find(u => u.email === email)) return res.status(400).json({ message: 'Email already exists' });
  const newUser = { id: uuidv4(), email, password, name: name || '', role: role || 'user' };
  db.users.push(newUser);
  writeDb(db);
  res.status(201).json({ id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role });
});

app.put('/users/:id', authMiddleware, (req, res) => {
  const db = readDb();
  const actor = req.user;
  const { id } = req.params;
  const idx = db.users.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).json({ message: 'User not found' });
  // Only admin can change roles; users can update their own name/password
  const updates = req.body;
  if (updates.role && actor.role !== 'admin') return res.status(403).json({ message: 'Only admin can change roles' });
  db.users[idx] = { ...db.users[idx], ...updates };
  writeDb(db);
  const u = db.users[idx];
  res.json({ id: u.id, email: u.email, name: u.name, role: u.role });
});

// Mock notification endpoints
app.post('/notify/email', (req, res) => {
  console.log('Mock email payload:', req.body);
  res.json({ ok: true, message: 'Email mock sent' });
});

app.post('/notify/whatsapp', (req, res) => {
  console.log('Mock whatsapp payload:', req.body);
  res.json({ ok: true, message: 'WhatsApp mock sent' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Mock server listening on ${PORT}`));
