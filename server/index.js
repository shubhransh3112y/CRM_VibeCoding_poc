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

const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
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

function readDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
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

app.get('/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
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

  db.tasks[idx] = { ...task, ...updates, activity };
  writeDb(db);
  res.json(db.tasks[idx]);
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
  db.leads[idx] = { ...lead, ...updates, activity };
  writeDb(db);
  res.json(db.leads[idx]);
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
