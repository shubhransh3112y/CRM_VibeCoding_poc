import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { Container, AppBar, Toolbar, Button, Typography, Box } from '@mui/material'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Leads from './pages/Leads'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
const UsersPage = React.lazy(() => import('./pages/Users'))

function Nav() {
  const { user, logout } = useAuth()
  return (
    <AppBar position="static">
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <img src="/logo.png" alt="App logo" style={{ height: 40, marginRight: 12 }} aria-label="App logo" />
          <Typography variant="h6">CRM POC</Typography>
        </Box>
        {user ? (
          <>
            <Button color="inherit" component={Link} to="/home">Home</Button>
            {user.role === 'admin' && <Button color="inherit" component={Link} to="/users">Users</Button>}
            <Button color="inherit" component={Link} to="/tasks">Tasks</Button>
            {(user.role === 'admin' || user.role === 'manager') && <Button color="inherit" component={Link} to="/leads">Leads</Button>}
            <Button color="inherit" onClick={logout}>Logout</Button>
          </>
        ) : (
          <Button color="inherit" component={Link} to="/login">Login</Button>
        )}
      </Toolbar>
    </AppBar>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Nav />
      <Routes>
        <Route path="/login" element={<Login />} />

          <Route path="/home" element={<Container maxWidth="xl" disableGutters sx={{ mt: 3, px: 2 }}><ProtectedRoute><Dashboard /></ProtectedRoute></Container>} />
          <Route path="/dashboard" element={<Container maxWidth="xl" disableGutters sx={{ mt: 3, px: 2 }}><ProtectedRoute><Dashboard /></ProtectedRoute></Container>} />
        <Route path="/tasks" element={<Container maxWidth="xl" disableGutters sx={{ mt: 3, px: 2 }}><ProtectedRoute><Tasks /></ProtectedRoute></Container>} />
        <Route path="/leads" element={<Container maxWidth="xl" disableGutters sx={{ mt: 3, px: 2 }}><ProtectedRoute roles={["admin","manager"]}><Leads /></ProtectedRoute></Container>} />
        <Route path="/users" element={<Container maxWidth="xl" disableGutters sx={{ mt: 3, px: 2 }}><ProtectedRoute roles={["admin"]}><React.Suspense fallback={<div>Loading...</div>}><UsersPage /></React.Suspense></ProtectedRoute></Container>} />
        <Route path="/" element={<Container maxWidth="xl" disableGutters sx={{ mt: 3, px: 2 }}><ProtectedRoute><Dashboard /></ProtectedRoute></Container>} />
      </Routes>
    </AuthProvider>
  )
}
