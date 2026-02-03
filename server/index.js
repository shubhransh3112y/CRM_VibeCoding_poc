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
  res.json(tasks);
});

app.post('/tasks', authMiddleware, (req, res) => {
  const db = readDb();
  const user = req.user;
  if (user.role === 'user') return res.status(403).json({ message: 'Only admin/manager can create tasks' });
  const { title, status, priority, dueDate, assignedTo } = req.body;
  if (!title) return res.status(400).json({ message: 'Title required' });
  const task = { id: uuidv4(), title, status: status || 'todo', priority: priority || 'medium', dueDate: dueDate || null, assignedTo };
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

  if (updates.status === 'failed' && !req.file && !task.attachment) {
    return res.status(400).json({ message: 'Evidence attachment is required when marking failed' });
  }

  db.tasks[idx] = { ...task, ...updates };
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

// Leads
app.get('/leads', authMiddleware, (req, res) => {
  const db = readDb();
  const { stage } = req.query;
  let leads = db.leads;
  if (stage) leads = leads.filter(l => l.stage === stage);
  res.json(leads);
});

app.post('/leads', authMiddleware, (req, res) => {
  const db = readDb();
  const { name, email, phone, stage, owner } = req.body;
  const lead = { id: uuidv4(), name, email, phone, stage: stage || 'new', owner };
  db.leads.push(lead);
  writeDb(db);
  res.status(201).json(lead);
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
