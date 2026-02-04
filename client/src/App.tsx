import React, { useEffect, useMemo, useState } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { Container, AppBar, Toolbar, Button, Typography, Box, IconButton, Badge, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Divider, Paper, InputAdornment, Chip, CircularProgress } from '@mui/material'
import { useQuery } from 'react-query'
import axios from 'axios'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Home from './pages/Home'
import Tasks from './pages/Tasks'
import Leads from './pages/Leads'
import Notifications from './pages/Notifications'
import Teams from './pages/Teams'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import PersonIcon from '@mui/icons-material/Person'
import EmailIcon from '@mui/icons-material/Email'
import CameraAltIcon from '@mui/icons-material/CameraAlt'
import NotificationsIcon from '@mui/icons-material/Notifications'
import LogoutIcon from '@mui/icons-material/Logout'
import SaveIcon from '@mui/icons-material/Save'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
const UsersPage = React.lazy(() => import('./pages/Users'))

const API = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

function Nav() {
  const { user, logout, updateUser } = useAuth()
  const location = useLocation()
  const { data: notifications = [] } = useQuery(['notifications', user?.id], async () => {
    const res = await axios.get(API + '/notifications', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    return res.data
  }, { enabled: !!user, refetchInterval: 10000 })

  const assignedCount = (notifications || []).filter((n: any) => !n.read && (n.type === 'task-assigned' || n.type === 'task-created')).length
  const unreadNotifications = (notifications || []).filter((n: any) => !n.read)

  const [profileOpen, setProfileOpen] = useState(false)
  const [profileValues, setProfileValues] = useState({ firstName: '', lastName: '', email: '' })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    if (!user) return
    const first = (user as any).firstName || (user as any).name?.split(' ')?.[0] || ''
    const last = (user as any).lastName || (user as any).name?.split(' ')?.slice(1).join(' ') || ''
    setProfileValues({ firstName: first, lastName: last, email: user.email })
    setAvatarFile(null)
    setRemoveAvatar(false)
  }, [user])

  const initials = useMemo(() => {
    if (!user) return ''
    const first = (user as any).firstName || (user as any).name?.split(' ')?.[0] || ''
    const last = (user as any).lastName || (user as any).name?.split(' ')?.slice(1).join(' ') || ''
    const a = first?.[0] || ''
    const b = last?.[0] || ''
    const i = `${a}${b}`.trim()
    if (i) return i.toUpperCase()
    return (user.email || '').slice(0, 2).toUpperCase()
  }, [user])

  const avatarUrl = useMemo(() => {
    const att = (user as any)?.avatar
    if (!att?.url) return ''
    return att.url.startsWith('http') ? att.url : `${API}${att.url}`
  }, [user])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.toLowerCase().split('.').pop() || ''
    const okExt = ['jpg', 'jpeg', 'png'].includes(ext)
    const okType = ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)
    if (!okExt || !okType) {
      alert('Only jpg, jpeg, png files are allowed')
      return
    }
    setAvatarFile(file)
    setRemoveAvatar(false)
  }

  const saveProfile = async () => {
    if (!user) return
    setSavingProfile(true)
    try {
      const form = new FormData()
      form.append('firstName', profileValues.firstName || '')
      form.append('lastName', profileValues.lastName || '')
      form.append('email', profileValues.email || '')
      if (removeAvatar) form.append('removeAvatar', 'true')
      if (avatarFile) form.append('avatar', avatarFile)

      const res = await axios.put(API + '/users/me', form, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      updateUser(res.data)
      setProfileOpen(false)
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Profile update failed')
    } finally {
      setSavingProfile(false)
    }
  }
  if (location.pathname === '/login') {
    return null
  }
  if (location.pathname === '/register') {
    return null
  }
  if (!user) return null

  return (
    <>
      <AppBar position="sticky" sx={{ top: 0, zIndex: (theme) => theme.zIndex.appBar }}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <img src="/logo.png" alt="App logo" style={{ height: 40, marginRight: 12 }} aria-label="App logo" />
            <Typography variant="h6">CRM POC</Typography>
          </Box>
          <>
            <Button color="inherit" component={Link} to="/home">Home</Button>
            <Button color="inherit" component={Link} to="/dashboard">Dashboard</Button>
            {user.role === 'admin' && <Button color="inherit" component={Link} to="/users">Users</Button>}
            {(user.role === 'admin' || user.role === 'manager') && <Button color="inherit" component={Link} to="/teams">Teams</Button>}
            <Button color="inherit" component={Link} to="/tasks">Tasks</Button>
            {(user.role === 'admin' || user.role === 'manager') && <Button color="inherit" component={Link} to="/leads">Leads</Button>}
            <IconButton color="inherit" onClick={() => setProfileOpen(true)} aria-label="Profile">
              <Badge color="error" badgeContent={assignedCount} invisible={assignedCount === 0}>
                <Avatar src={removeAvatar ? '' : avatarUrl} sx={{ width: 32, height: 32, bgcolor: avatarUrl ? 'transparent' : 'secondary.main' }}>
                  {initials}
                </Avatar>
              </Badge>
            </IconButton>
          </>
        </Toolbar>
      </AppBar>

      <Dialog 
        open={profileOpen} 
        onClose={() => setProfileOpen(false)} 
        fullWidth 
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }
        }}
      >
        {/* Dialog Header */}
        <Box sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          p: 3,
          color: 'white',
          position: 'relative'
        }}>
          <IconButton 
            onClick={() => setProfileOpen(false)}
            sx={{ 
              position: 'absolute', 
              right: 12, 
              top: 12,
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            <CloseIcon />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>Edit Profile</Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>Update your personal information</Typography>
        </Box>

        <DialogContent sx={{ p: 0 }}>
          {/* Avatar Section */}
          <Box sx={{ 
            p: 3, 
            background: 'linear-gradient(180deg, #f8fafc 0%, white 100%)',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar 
                  src={avatarFile ? URL.createObjectURL(avatarFile) : (removeAvatar ? '' : avatarUrl)} 
                  sx={{ 
                    width: 100, 
                    height: 100, 
                    bgcolor: avatarUrl ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    fontSize: '2rem',
                    fontWeight: 600,
                    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
                    border: '4px solid white'
                  }}
                >
                  {initials}
                </Avatar>
                <Box
                  component="label"
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: '#667eea',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.4)',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: '#5a6fd6',
                      transform: 'scale(1.1)'
                    }
                  }}
                >
                  <CameraAltIcon sx={{ color: 'white', fontSize: 18 }} />
                  <input hidden type="file" accept="image/png,image/jpeg" onChange={handleAvatarChange} />
                </Box>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
                  Profile Photo
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                  JPG or PNG. Max size 2MB.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  <Button 
                    variant="outlined" 
                    component="label"
                    size="small"
                    startIcon={<CloudUploadIcon />}
                    sx={{ 
                      borderRadius: 2,
                      textTransform: 'none',
                      borderColor: '#667eea',
                      color: '#667eea',
                      '&:hover': { borderColor: '#5a6fd6', bgcolor: 'rgba(102, 126, 234, 0.04)' }
                    }}
                  >
                    Upload
                    <input hidden type="file" accept="image/png,image/jpeg" onChange={handleAvatarChange} />
                  </Button>
                  {(avatarUrl || avatarFile) && !removeAvatar && (
                    <Button 
                      variant="outlined" 
                      color="error"
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={() => { setRemoveAvatar(true); setAvatarFile(null) }}
                      sx={{ 
                        borderRadius: 2,
                        textTransform: 'none'
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Form Fields */}
          <Box sx={{ p: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon sx={{ fontSize: 20, color: '#667eea' }} />
              Personal Information
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="First Name"
                value={profileValues.firstName}
                onChange={(e) => setProfileValues((p) => ({ ...p, firstName: e.target.value }))}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: '#667eea' },
                    '&.Mui-focused fieldset': { borderColor: '#667eea' }
                  }
                }}
              />
              <TextField
                fullWidth
                label="Last Name"
                value={profileValues.lastName}
                onChange={(e) => setProfileValues((p) => ({ ...p, lastName: e.target.value }))}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: '#667eea' },
                    '&.Mui-focused fieldset': { borderColor: '#667eea' }
                  }
                }}
              />
            </Box>
            <TextField
              fullWidth
              label="Email Address"
              margin="normal"
              value={profileValues.email}
              onChange={(e) => setProfileValues((p) => ({ ...p, email: e.target.value }))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: '#64748b' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mt: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': { borderColor: '#667eea' },
                  '&.Mui-focused fieldset': { borderColor: '#667eea' }
                }
              }}
            />

            <Divider sx={{ my: 3 }} />
            
            {/* Notifications Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationsIcon sx={{ fontSize: 20, color: '#667eea' }} />
                Recent Notifications
              </Typography>
              {unreadNotifications.length > 0 && (
                <Chip 
                  label={`${unreadNotifications.length} unread`} 
                  size="small" 
                  sx={{ 
                    bgcolor: '#fef3c7', 
                    color: '#d97706',
                    fontWeight: 600,
                    fontSize: '0.7rem'
                  }} 
                />
              )}
            </Box>
            {unreadNotifications.length === 0 ? (
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  textAlign: 'center', 
                  bgcolor: '#f8fafc', 
                  borderRadius: 2,
                  border: '1px dashed #e2e8f0'
                }}
              >
                <NotificationsIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No unread notifications
                </Typography>
              </Paper>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {unreadNotifications.slice(0, 5).map((n: any) => (
                  <Paper 
                    key={n.id} 
                    elevation={0}
                    sx={{ 
                      p: 2, 
                      borderRadius: 2,
                      bgcolor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: '#f1f5f9',
                        borderColor: '#cbd5e1'
                      }
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b', mb: 0.5 }}>
                      {n.message}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      {n.at}
                    </Typography>
                  </Paper>
                ))}
                <Button 
                  size="small" 
                  component={Link} 
                  to="/notifications" 
                  onClick={() => setProfileOpen(false)}
                  sx={{ 
                    mt: 1,
                    textTransform: 'none',
                    color: '#667eea',
                    fontWeight: 600,
                    '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.08)' }
                  }}
                >
                  View all notifications →
                </Button>
              </Box>
            )}
          </Box>
        </DialogContent>

        {/* Dialog Actions */}
        <DialogActions sx={{ 
          p: 3, 
          borderTop: '1px solid #e2e8f0',
          bgcolor: '#f8fafc',
          gap: 1.5
        }}>
          <Button 
            onClick={() => setProfileOpen(false)}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              color: '#64748b',
              '&:hover': { bgcolor: '#f1f5f9' }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={logout}
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              px: 3
            }}
          >
            Logout
          </Button>
          <Button 
            variant="contained" 
            onClick={saveProfile} 
            disabled={savingProfile}
            startIcon={savingProfile ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
              },
              '&:disabled': {
                background: '#e2e8f0',
              }
            }}
          >
            {savingProfile ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Nav />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

          <Route path="/home" element={<Box sx={{ width: '100%' }}><ProtectedRoute><Home /></ProtectedRoute></Box>} />
          <Route path="/dashboard" element={<Container maxWidth="xl" disableGutters sx={{ mt: 0, px: 2 }}><ProtectedRoute><Dashboard /></ProtectedRoute></Container>} />
        <Route path="/tasks" element={<Container maxWidth="xl" disableGutters sx={{ mt: 0, px: 2 }}><ProtectedRoute><Tasks /></ProtectedRoute></Container>} />
        <Route path="/leads" element={<Container maxWidth="xl" disableGutters sx={{ mt: 0, px: 2 }}><ProtectedRoute roles={["admin","manager"]}><Leads /></ProtectedRoute></Container>} />
        <Route path="/notifications" element={<Container maxWidth="xl" disableGutters sx={{ mt: 0, px: 2 }}><ProtectedRoute><Notifications /></ProtectedRoute></Container>} />
        <Route path="/teams" element={<Container maxWidth="xl" disableGutters sx={{ mt: 0, px: 2 }}><ProtectedRoute><Teams /></ProtectedRoute></Container>} />
        <Route path="/users" element={<Container maxWidth="xl" disableGutters sx={{ mt: 0, px: 2 }}><ProtectedRoute roles={["admin"]}><React.Suspense fallback={<div>Loading...</div>}><UsersPage /></React.Suspense></ProtectedRoute></Container>} />
        <Route path="/" element={<Box sx={{ width: '100%' }}><ProtectedRoute><Home /></ProtectedRoute></Box>} />
      </Routes>
    </AuthProvider>
  )
}
