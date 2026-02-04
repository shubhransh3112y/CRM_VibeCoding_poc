import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useQuery } from 'react-query'
import { 
  Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button, Box, TextField, 
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, Avatar, TableContainer, IconButton, Chip
} from '@mui/material'
import GroupsIcon from '@mui/icons-material/Groups'
import PersonIcon from '@mui/icons-material/Person'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'

const API = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function Teams() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: teams = [], refetch } = useQuery('teams', async () => {
    const res = await axios.get(API + '/teams', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    return res.data
  })

  const createTeam = async () => {
    if (!name.trim()) return
    await axios.post(API + '/teams', { name }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    setName('')
    setOpen(false)
    refetch()
  }

  const filteredTeams = (teams || []).filter((t: any) => {
    if (!searchQuery.trim()) return true
    return t.name?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const totalTeams = filteredTeams.length
  const totalMembers = teams.reduce((acc: number, t: any) => acc + (t.members?.length || 0), 0)
  const pagedTeams = filteredTeams.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => {
    setPage(1)
  }, [teams.length, searchQuery])

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

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, px: 1 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>Teams</Typography>
          <Typography variant="body2" color="text.secondary">Manage your teams and team members</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <IconButton size="small" onClick={() => refetch()} sx={{ bgcolor: 'white', border: '1px solid', borderColor: 'divider' }}>
            <RefreshIcon fontSize="small" />
          </IconButton>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
            sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
          >
            New Team
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <StatCard title="Total Teams" value={teams.length} icon={<GroupsIcon />} color="#3b82f6" bgColor="#dbeafe" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <StatCard title="Total Members" value={totalMembers} icon={<PersonIcon />} color="#8b5cf6" bgColor="#f3e8ff" />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        {/* Search */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <TextField
            size="small"
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} fontSize="small" /> }}
            sx={{ minWidth: 280, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' } }}
          />
        </Box>

        {/* Table */}
        <TableContainer sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 600, color: '#475569' } }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Team Name</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Members</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedTeams.map((t: any) => (
                <TableRow key={t.id} sx={{ '&:hover': { bgcolor: '#f8fafc' }, transition: 'background-color 0.2s' }}>
                  <TableCell sx={{ fontWeight: 500, color: '#1e293b' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ bgcolor: '#dbeafe', color: '#3b82f6', width: 36, height: 36 }}>
                        <GroupsIcon fontSize="small" />
                      </Avatar>
                      {t.name}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={`${(t.members || []).length} members`} 
                      size="small" 
                      sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 500 }} 
                    />
                  </TableCell>
                </TableRow>
              ))}
              {pagedTeams.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    No teams found
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
            {totalTeams === 0 ? '0 of 0' : `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, totalTeams)} of ${totalTeams}`}
          </Typography>
          <Button size="small" variant="outlined" sx={{ color: '#64748b', borderColor: '#e2e8f0', minWidth: 36, borderRadius: 1.5 }} onClick={() => setPage((p) => Math.min(Math.ceil(totalTeams / pageSize), p + 1))} disabled={page >= Math.ceil(totalTeams / pageSize)}>›</Button>
          <Button size="small" variant="outlined" sx={{ color: '#64748b', borderColor: '#e2e8f0', minWidth: 36, borderRadius: 1.5 }} onClick={() => setPage(Math.max(1, Math.ceil(totalTeams / pageSize)))} disabled={page >= Math.ceil(totalTeams / pageSize)}>»</Button>
        </Box>
      </Paper>

      {/* Create Team Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>Create New Team</DialogTitle>
        <DialogContent>
          <TextField 
            label="Team name" 
            fullWidth 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: 'none', borderRadius: 2 }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={createTeam}
            sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
          >
            Create Team
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
