import React, { useState } from 'react'
import axios from 'axios'
import { useQuery } from 'react-query'
import { 
  Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button, Box, TableSortLabel, 
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Checkbox, FormControl, 
  InputLabel, Select, MenuItem, Grid, Avatar, TableContainer, IconButton
} from '@mui/material'
import { LeadForm } from '../components'
import TableFilters, { Column } from '../components/TableFilters'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import ContactMailIcon from '@mui/icons-material/ContactMail'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import NewReleasesIcon from '@mui/icons-material/NewReleases'
import FilterListIcon from '@mui/icons-material/FilterList'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'

const API = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function Leads() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [filters, setFilters] = useState<any>({})
  const [showFilters, setShowFilters] = useState(false)
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkStage, setBulkStage] = useState('')
  const [bulkOwner, setBulkOwner] = useState('')
  const [activityOpen, setActivityOpen] = useState(false)
  const [activityItems, setActivityItems] = useState<any[]>([])

  const columns: Column[] = [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'phone', label: 'Phone', type: 'text' },
    { key: 'stage', label: 'Stage', type: 'select', options: ['new','contacted','qualified','converted'] },
    { key: 'owner', label: 'Owner', type: 'text' },
    { key: 'tags', label: 'Tags', type: 'text' },
  ]

  const { data: users = [] } = useQuery('users', async () => {
    const res = await axios.get(API + '/users', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    return res.data
  })


  const { data: leadsResp = [], refetch } = useQuery(['leads', page, pageSize, sortKey, sortDir, filters, searchQuery], async () => {
    const params = {
      page,
      pageSize,
      sortBy: sortKey,
      sortDir,
      name: filters?.name || '',
      email: filters?.email || '',
      phone: filters?.phone || '',
      stage: filters?.stage || '',
      owner: filters?.owner || '',
      tag: filters?.tags || '',
      q: searchQuery || ''
    }
    const res = await axios.get(API + '/leads', { params, headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    return res.data
  })
  const leadsData = Array.isArray(leadsResp) ? { items: leadsResp, total: leadsResp.length } : leadsResp
  const leads = leadsData.items || []
  const totalLeads = leadsData.total || leads.length

  // Stats calculations
  const newCount = leads.filter((l: any) => l.stage === 'new').length
  const contactedCount = leads.filter((l: any) => l.stage === 'contacted').length
  const qualifiedCount = leads.filter((l: any) => l.stage === 'qualified').length
  const convertedCount = leads.filter((l: any) => l.stage === 'converted').length

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

  const filteredLeads = leads

  const sortedLeads = [...filteredLeads].sort((a: any, b: any) => {
    if (!sortKey) return 0
    const av = (a?.[sortKey] ?? '').toString().toLowerCase()
    const bv = (b?.[sortKey] ?? '').toString().toLowerCase()
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })
  const handlePage = (e: any, p: number) => setPage(p)

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? leads.map((l: any) => l.id) : [])
  }

  const applyBulk = async () => {
    const updates: any = {}
    if (bulkStage) updates.stage = bulkStage
    if (bulkOwner) updates.owner = bulkOwner
    if (!selectedIds.length || Object.keys(updates).length === 0) return
    await axios.post(API + '/leads/bulk', { ids: selectedIds, updates }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    setSelectedIds([])
    setBulkStage('')
    setBulkOwner('')
    refetch()
  }


  const openActivityDialog = (activity: any[]) => {
    setActivityItems(activity || [])
    setActivityOpen(true)
  }

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, px: 1 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>Leads</Typography>
          <Typography variant="body2" color="text.secondary">Manage and track your sales leads</Typography>
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
            New Lead
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatCard title="New" value={newCount} icon={<NewReleasesIcon />} color="#f59e0b" bgColor="#fef3c7" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Contacted" value={contactedCount} icon={<ContactMailIcon />} color="#3b82f6" bgColor="#dbeafe" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Qualified" value={qualifiedCount} icon={<PersonAddIcon />} color="#8b5cf6" bgColor="#f3e8ff" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Converted" value={convertedCount} icon={<CheckCircleIcon />} color="#10b981" bgColor="#dcfce7" />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        {/* Search and Filters */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
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

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, p: 2, bgcolor: '#f1f5f9', borderRadius: 2, flexWrap: 'wrap' }}>
            <Chip label={`${selectedIds.length} selected`} color="primary" size="small" />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Stage</InputLabel>
              <Select label="Stage" value={bulkStage} onChange={(e) => setBulkStage(e.target.value)}>
                <MenuItem value="">No change</MenuItem>
                <MenuItem value="new">New</MenuItem>
                <MenuItem value="contacted">Contacted</MenuItem>
                <MenuItem value="qualified">Qualified</MenuItem>
                <MenuItem value="converted">Converted</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Owner</InputLabel>
              <Select label="Owner" value={bulkOwner} onChange={(e) => setBulkOwner(e.target.value)}>
                <MenuItem value="">No change</MenuItem>
                {(users || []).map((u: any) => <MenuItem key={u.id} value={u.id}>{u.name || u.email}</MenuItem>)}
              </Select>
            </FormControl>
            <Button 
              variant="contained" 
              onClick={applyBulk}
              sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
            >
              Apply Changes
            </Button>
          </Box>
        )}

        {/* Table */}
        <TableContainer sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 600, color: '#475569' } }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedIds.length > 0 && selectedIds.length === leads.length}
                    indeterminate={selectedIds.length > 0 && selectedIds.length < leads.length}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                  <TableSortLabel active={sortKey === 'name'} direction={sortKey === 'name' ? sortDir : 'asc'} onClick={() => handleSort('name')}>Name</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                  <TableSortLabel active={sortKey === 'email'} direction={sortKey === 'email' ? sortDir : 'asc'} onClick={() => handleSort('email')}>Email</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                  <TableSortLabel active={sortKey === 'phone'} direction={sortKey === 'phone' ? sortDir : 'asc'} onClick={() => handleSort('phone')}>Phone</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                  <TableSortLabel active={sortKey === 'stage'} direction={sortKey === 'stage' ? sortDir : 'asc'} onClick={() => handleSort('stage')}>Stage</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                  <TableSortLabel active={sortKey === 'owner'} direction={sortKey === 'owner' ? sortDir : 'asc'} onClick={() => handleSort('owner')}>Owner</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                  <TableSortLabel active={sortKey === 'tags'} direction={sortKey === 'tags' ? sortDir : 'asc'} onClick={() => handleSort('tags')}>Tags</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Activity</TableCell>
              </TableRow>
              {showFilters && <TableFilters columns={columns} filters={filters} onChange={setFilters} prefixCells={1} suffixCells={1} />}
            </TableHead>
            <TableBody>
              {sortedLeads.map((l: any) => (
                <TableRow key={l.id} sx={{ '&:hover': { bgcolor: '#f8fafc' }, transition: 'background-color 0.2s' }}>
                  <TableCell padding="checkbox">
                    <Checkbox checked={selectedIds.includes(l.id)} onChange={() => toggleSelect(l.id)} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500, color: '#1e293b' }}>{l.name}</TableCell>
                  <TableCell sx={{ color: '#64748b' }}>{l.email}</TableCell>
                  <TableCell sx={{ color: '#64748b' }}>{l.phone}</TableCell>
                  <TableCell>
                    <Chip 
                      label={l.stage} 
                      size="small" 
                      sx={{ 
                        fontWeight: 600,
                        bgcolor: l.stage === 'converted' ? '#dcfce7' : 
                                 l.stage === 'qualified' ? '#f3e8ff' : 
                                 l.stage === 'contacted' ? '#dbeafe' : '#fef3c7',
                        color: l.stage === 'converted' ? '#16a34a' : 
                               l.stage === 'qualified' ? '#7c3aed' : 
                               l.stage === 'contacted' ? '#2563eb' : '#d97706'
                      }} 
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#64748b' }}>{l.owner}</TableCell>
                  <TableCell>
                    {(l.tags || []).length ? (l.tags || []).map((tag: string) => <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5, bgcolor: '#e0e7ff', color: '#4338ca' }} />) : '--'}
                  </TableCell>
                  <TableCell>
                    {l.activity?.length ? (
                      <Button size="small" variant="text" onClick={() => openActivityDialog(l.activity)} sx={{ textTransform: 'none' }}>View</Button>
                    ) : '--'}
                  </TableCell>
                </TableRow>
              ))}
              {sortedLeads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    No leads found
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
            {totalLeads === 0 ? '0 of 0' : `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, totalLeads)} of ${totalLeads}`}
          </Typography>
          <Button size="small" variant="outlined" sx={{ color: '#64748b', borderColor: '#e2e8f0', minWidth: 36, borderRadius: 1.5 }} onClick={() => setPage((p) => Math.min(Math.ceil(totalLeads / pageSize), p + 1))} disabled={page >= Math.ceil(totalLeads / pageSize)}>›</Button>
          <Button size="small" variant="outlined" sx={{ color: '#64748b', borderColor: '#e2e8f0', minWidth: 36, borderRadius: 1.5 }} onClick={() => setPage(Math.max(1, Math.ceil(totalLeads / pageSize)))} disabled={page >= Math.ceil(totalLeads / pageSize)}>»</Button>
        </Box>
      </Paper>

      {/* Activity Dialog */}
      <Dialog open={activityOpen} onClose={() => setActivityOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>Activity History</DialogTitle>
        <DialogContent>
          {activityItems.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No activity yet.</Typography>
          ) : (
            activityItems.slice().reverse().map((a: any) => (
              <Box key={a.id} sx={{ mb: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                <Typography variant="body2"><strong>{a.action}</strong> — {a.summary}</Typography>
                <Typography variant="caption" color="text.secondary">{a.at}</Typography>
              </Box>
            ))
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setActivityOpen(false)} sx={{ textTransform: 'none', borderRadius: 2 }}>Close</Button>
        </DialogActions>
      </Dialog>

      {open && <LeadForm open={open} initial={editing} onClose={() => { setOpen(false); refetch() }} />}
    </Box>
  )
}
