import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useQuery } from 'react-query'
import { 
  Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button, IconButton, Box, 
  TableSortLabel, TextField, Grid, Avatar, TableContainer, Chip
} from '@mui/material'
import TableFilters, { Column } from '../components/TableFilters'
import EditIcon from '@mui/icons-material/Edit'
import UserForm from '../components/UserForm'
import PeopleIcon from '@mui/icons-material/People'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount'
import PersonIcon from '@mui/icons-material/Person'
import FilterListIcon from '@mui/icons-material/FilterList'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'

const API = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function Users() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)

  const [filters, setFilters] = useState<any>({})
  const [showFilters, setShowFilters] = useState(false)
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const columns: Column[] = [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'role', label: 'Role', type: 'select', options: ['admin','manager','user'] },
  ]

  const { data: users = [], refetch } = useQuery('users', async () => {
    const res = await axios.get(API + '/users', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    return res.data
  })

  // Stats calculations
  const adminCount = (users || []).filter((u: any) => u.role === 'admin').length
  const managerCount = (users || []).filter((u: any) => u.role === 'manager').length
  const userCount = (users || []).filter((u: any) => u.role === 'user').length

  // Stat Card Component
  const StatCard = ({ title, value, icon, color, bgColor }: any) => (
    <Paper 
      elevation={0}
      sx={{ 
        p: 2.5, 
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        background: `linear-gradient(135deg, ${bgColor}50 0%, ${bgColor}80 100%)`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 25px ${color}20`,
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: color }}>
            {value}
          </Typography>
        </Box>
        <Avatar sx={{ bgcolor: `${color}20`, color: color, width: 48, height: 48 }}>
          {icon}
        </Avatar>
      </Box>
    </Paper>
  )

  const filteredUsers = (users || []).filter((u: any) => {
    if (searchQuery.trim()) {
      const hay = [u.name, u.email, u.role].map(v => String(v || '').toLowerCase()).join(' ')
      if (!hay.includes(searchQuery.toLowerCase())) return false
    }
    return columns.every((c) => {
    const v = filters[c.key]
    if (!v) return true
    const val = u[c.key]
    return (val ?? '').toString().toLowerCase().includes(String(v).toLowerCase())
    })
  })

  const sortedUsers = [...filteredUsers].sort((a: any, b: any) => {
    if (!sortKey) return 0
    const av = (a?.[sortKey] ?? '').toString().toLowerCase()
    const bv = (b?.[sortKey] ?? '').toString().toLowerCase()
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const totalUsers = sortedUsers.length
  const pagedUsers = sortedUsers.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => {
    setPage(1)
  }, [searchQuery, filters, sortKey, sortDir])

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const onEdit = (u: any) => { setEditing(u); setOpen(true) }

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, px: 1 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>Users</Typography>
          <Typography variant="body2" color="text.secondary">Manage system users and their roles</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <IconButton size="small" onClick={() => refetch()} sx={{ bgcolor: 'white', border: '1px solid', borderColor: 'divider' }}>
            <RefreshIcon fontSize="small" />
          </IconButton>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => { setEditing(null); setOpen(true) }}
            sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
          >
            New User
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatCard title="Total Users" value={users.length} icon={<PeopleIcon />} color="#3b82f6" bgColor="#dbeafe" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Admins" value={adminCount} icon={<AdminPanelSettingsIcon />} color="#ef4444" bgColor="#fee2e2" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Managers" value={managerCount} icon={<SupervisorAccountIcon />} color="#8b5cf6" bgColor="#f3e8ff" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Users" value={userCount} icon={<PersonIcon />} color="#10b981" bgColor="#dcfce7" />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        {/* Search and Filters */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} fontSize="small" /> }}
            sx={{ minWidth: 280, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' } }}
          />
          <Button 
            variant={showFilters ? 'contained' : 'outlined'} 
            startIcon={<FilterListIcon />} 
            onClick={() => setShowFilters((s) => !s)}
            sx={{ textTransform: 'none', borderRadius: 2, ...(showFilters && { bgcolor: '#3b82f6' }) }}
          >
            {showFilters ? 'Hide Filters' : 'Filters'}
          </Button>
        </Box>

        {/* Table */}
        <TableContainer sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 600, color: '#475569' } }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                  <TableSortLabel active={sortKey === 'name'} direction={sortKey === 'name' ? sortDir : 'asc'} onClick={() => handleSort('name')}>Name</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                  <TableSortLabel active={sortKey === 'email'} direction={sortKey === 'email' ? sortDir : 'asc'} onClick={() => handleSort('email')}>Email</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                  <TableSortLabel active={sortKey === 'role'} direction={sortKey === 'role' ? sortDir : 'asc'} onClick={() => handleSort('role')}>Role</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Actions</TableCell>
              </TableRow>
              {showFilters && <TableFilters columns={columns} filters={filters} onChange={setFilters} suffixCells={1} />}
            </TableHead>
            <TableBody>
              {pagedUsers.map((u: any) => (
                <TableRow key={u.id} sx={{ '&:hover': { bgcolor: '#f8fafc' }, transition: 'background-color 0.2s' }}>
                  <TableCell sx={{ fontWeight: 500, color: '#1e293b' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ 
                        bgcolor: u.role === 'admin' ? '#fee2e2' : u.role === 'manager' ? '#f3e8ff' : '#dcfce7',
                        color: u.role === 'admin' ? '#dc2626' : u.role === 'manager' ? '#7c3aed' : '#16a34a',
                        width: 36, 
                        height: 36,
                        fontSize: '0.875rem',
                        fontWeight: 600
                      }}>
                        {(u.name || u.email || '?').charAt(0).toUpperCase()}
                      </Avatar>
                      {u.name}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: '#64748b' }}>{u.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={u.role} 
                      size="small" 
                      sx={{ 
                        fontWeight: 600,
                        bgcolor: u.role === 'admin' ? '#fee2e2' : u.role === 'manager' ? '#f3e8ff' : '#dcfce7',
                        color: u.role === 'admin' ? '#dc2626' : u.role === 'manager' ? '#7c3aed' : '#16a34a'
                      }} 
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      onClick={() => onEdit(u)} 
                      size="small"
                      sx={{ 
                        bgcolor: '#f1f5f9',
                        '&:hover': { bgcolor: '#e2e8f0' }
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {pagedUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button size="small" variant="outlined" sx={{ color: '#64748b', borderColor: '#e2e8f0', minWidth: 36, borderRadius: 1.5 }} onClick={() => setPage(1)} disabled={page === 1}>«</Button>
          <Button size="small" variant="outlined" sx={{ color: '#64748b', borderColor: '#e2e8f0', minWidth: 36, borderRadius: 1.5 }} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>‹</Button>
          <Typography variant="body2" sx={{ fontWeight: 500, color: '#475569', px: 2 }}>
            {totalUsers === 0 ? '0 of 0' : `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, totalUsers)} of ${totalUsers}`}
          </Typography>
          <Button size="small" variant="outlined" sx={{ color: '#64748b', borderColor: '#e2e8f0', minWidth: 36, borderRadius: 1.5 }} onClick={() => setPage((p) => Math.min(Math.ceil(totalUsers / pageSize), p + 1))} disabled={page >= Math.ceil(totalUsers / pageSize)}>›</Button>
          <Button size="small" variant="outlined" sx={{ color: '#64748b', borderColor: '#e2e8f0', minWidth: 36, borderRadius: 1.5 }} onClick={() => setPage(Math.max(1, Math.ceil(totalUsers / pageSize)))} disabled={page >= Math.ceil(totalUsers / pageSize)}>»</Button>
        </Box>
      </Paper>

      {open && <UserForm open={open} initial={editing} onClose={() => { setOpen(false); refetch() }} />}
    </Box>
  )
}
