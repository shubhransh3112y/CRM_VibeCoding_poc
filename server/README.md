# Mock Server

Routes:
- POST /auth/login { email, password } -> { token }
- GET /auth/me -> user
- GET /tasks -> list tasks (RBAC: user sees own tasks)
- POST /tasks -> create task
- PUT /tasks/:id -> update
- DELETE /tasks/:id -> delete
- GET /leads -> list leads (filter with ?stage=)
- POST /leads -> create lead
- POST /notify/email -> mock email
- POST /notify/whatsapp -> mock whatsapp

Seed data is in `data/db.json`.

Run:

npm install
npm run dev
