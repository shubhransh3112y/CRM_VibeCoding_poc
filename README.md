# Task Tracker + Mini-CRM POC

This workspace contains a production-minded POC for a Task Tracking + Mini-CRM web app.

Folders:
- `server` – mock Express backend with seed data and mock notification endpoints.
- `client` – React + TypeScript frontend (Vite) using Material UI, React Query, React Router, React Hook Form, Yup, and Recharts.

Quick start (Windows PowerShell):

# Install dependencies for server and client
cd server
npm install

cd ..\client
npm install

# Run both (in separate terminals)
# Terminal 1 (server)
cd server
npm run dev

# Terminal 2 (client)
cd client
npm run dev

See server/README.md and client/README.md for more details.
