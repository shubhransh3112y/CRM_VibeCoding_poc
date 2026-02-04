const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().slice(0, 10);

const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

const users = db.users || [];
const userIds = users.map(u => u.id);

const statuses = ['todo', 'in-progress', 'done', 'failed'];
const priorities = ['low', 'medium', 'high'];
const tags = ['vip', 'bug', 'backend', 'frontend', 'sla', 'urgent', 'new', 'followup'];
const stages = ['new', 'contacted', 'qualified', 'converted'];

const tasks = [];
for (let i = 1; i <= 200; i++) {
  const status = randomItem(statuses);
  tasks.push({
    id: uuidv4(),
    title: `Task ${i}`,
    description: `Generated task ${i}`,
    status,
    priority: randomItem(priorities),
    dueDate: randomDate(new Date(2026, 0, 1), new Date(2026, 11, 31)),
    assignedTo: randomItem(userIds),
    tags: [randomItem(tags)],
    activity: [{ id: uuidv4(), at: new Date().toISOString(), by: randomItem(userIds), action: 'created', summary: 'Seeded task' }]
  });
}

const leads = [];
for (let i = 1; i <= 100; i++) {
  leads.push({
    id: uuidv4(),
    name: `Lead ${i}`,
    email: `lead${i}@example.com`,
    phone: `90000${String(i).padStart(5, '0')}`,
    stage: randomItem(stages),
    owner: randomItem(userIds),
    tags: [randomItem(tags)],
    activity: [{ id: uuidv4(), at: new Date().toISOString(), by: randomItem(userIds), action: 'created', summary: 'Seeded lead' }]
  });
}

db.tasks = [...(db.tasks || []), ...tasks];
db.leads = [...(db.leads || []), ...leads];

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
console.log('Large dataset appended: 200 tasks, 100 leads');
