import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useQuery, useQueryClient } from 'react-query'
import axios from 'axios'
import { 
  Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Typography, Box, Chip, 
  Dialog, DialogTitle, DialogContent, DialogActions, TableSortLabel, TextField, Checkbox, MenuItem, 
  Select, FormControl, InputLabel, TableContainer, Grid, Avatar
} from '@mui/material'
import TableFilters, { Column } from '../components/TableFilters'
import StatusUpdateDialog from '../components/StatusUpdateDialog'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import TaskForm from '../components/TaskForm'
import AssignmentIcon from '@mui/icons-material/Assignment'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import ErrorIcon from '@mui/icons-material/Error'
import FilterListIcon from '@mui/icons-material/FilterList'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'

const API = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function Tasks() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [editing, setEditing] = useState<any | null>(null)
  const [open, setOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [attachmentOpen, setAttachmentOpen] = useState(false)
  const [attachment, setAttachment] = useState<any | null>(null)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)
  const [activityItems, setActivityItems] = useState<any[]>([])
  const [filters, setFilters] = React.useState<any>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState('dueDate')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkPriority, setBulkPriority] = useState('')
  const [bulkAssignedTo, setBulkAssignedTo] = useState('')
  const pageSize = 10

  const { data: tasksResp = [], refetch } = useQuery(['tasks', page, pageSize, sortKey, sortDir, filters, searchQuery], async () => {
    const dueRange = filters?.dueDate || {}
    const params = {
      page,
      pageSize,
      sortBy: sortKey,
      sortDir,
      title: filters?.title || '',
      status: filters?.status || '',
      priority: filters?.priority || '',
      assignedTo: filters?.assignedTo || '',
      tag: filters?.tags || '',
      q: searchQuery || '',
      dueFrom: dueRange.from || '',
      dueTo: dueRange.to || ''
    }
    const res = await axios.get(API + '/tasks', { params, withCredentials: true, headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    return res.data
  })
  const tasksData = Array.isArray(tasksResp) ? { items: tasksResp, total: tasksResp.length } : tasksResp
  const tasks = tasksData.items || []
  const totalTasks = tasksData.total || tasks.length
  const showUpdateColumn = !!(user && user.role !== 'admin' && tasks.some((t: any) => t.assignedTo === user.id))

  const { data: users = [] } = useQuery('users', async () => {
    const res = await axios.get(API + '/users', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    return res.data
  })

  // Stats calculations
  const todoCount = tasks.filter((t: any) => t.status === 'todo').length
  const inProgressCount = tasks.filter((t: any) => t.status === 'in-progress').length
  const doneCount = tasks.filter((t: any) => t.status === 'done').length
  const failedCount = tasks.filter((t: any) => t.status === 'failed').length

  // KPI Card Component
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


  const columns: Column[] = [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'status', label: 'Status', type: 'select', options: ['todo','in-progress','done','failed'] },
    { key: 'priority', label: 'Priority', type: 'select', options: ['high','medium','low'] },
    { key: 'description', label: 'Description', type: 'text' },
    { key: 'dueDate', label: 'Due', type: 'date-range' },
    { key: 'assignedTo', label: 'Assigned To', type: 'text' },
    { key: 'tags', label: 'Tags', type: 'text' },
    { key: 'reason', label: 'Failed Reason', type: 'text' },
    { key: 'attachment', label: 'Attachment', type: 'text' },
  ]

  const filteredTasks = tasks

  const getComparable = (row: any, key: string) => {
    if (key === 'dueDate') return row?.dueDate ? new Date(row.dueDate).getTime() : 0
    if (key === 'attachment') return (row?.attachment?.filename || row?.attachment?.name || '').toString().toLowerCase()
    if (key === 'tags') return (row?.tags || []).join(', ').toLowerCase()
    const raw = row?.[key]
    if (raw && typeof raw === 'object') return (raw.filename || raw.name || '').toString().toLowerCase()
    return (raw ?? '').toString().toLowerCase()
  }

  const sortedTasks = [...filteredTasks].sort((a: any, b: any) => {
    if (!sortKey) return 0
    const av = getComparable(a, sortKey)
    const bv = getComparable(b, sortKey)
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const openAttachmentDialog = (att: any) => {
    setAttachment(att)
    setAttachmentOpen(true)
  }

  const openActivityDialog = (activity: any[]) => {
    setActivityItems(activity || [])
    setActivityOpen(true)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? tasks.map((t: any) => t.id) : [])
  }

  const applyBulk = async () => {
    const updates: any = {}
    if (bulkStatus) updates.status = bulkStatus
    if (bulkPriority) updates.priority = bulkPriority
    if (bulkAssignedTo) updates.assignedTo = bulkAssignedTo
    if (!selectedIds.length || Object.keys(updates).length === 0) return
    await axios.post(API + '/tasks/bulk', { ids: selectedIds, updates }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    setSelectedIds([])
    setBulkStatus('')
    setBulkPriority('')
    setBulkAssignedTo('')
    refetch()
  }


  const attachmentUrl = attachment?.url ? (attachment.url.startsWith('http') ? attachment.url : API + attachment.url) : ''

  const deleteTask = async (id: string) => {
    await axios.delete(API + '/tasks/' + id, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    refetch()
  }

  const openStatusDialog = (id: string) => { setSelectedTaskId(id); setStatusOpen(true) }

  const handlePage = (e: any, p: number) => setPage(p)

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, px: 1 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>Tasks</Typography>
          <Typography variant="body2" color="text.secondary">Manage and track all your tasks in one place</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <IconButton size="small" onClick={() => refetch()} sx={{ bgcolor: 'white', border: '1px solid', borderColor: 'divider' }}>
            <RefreshIcon fontSize="small" />
          </IconButton>
          {user && user.role !== 'user' && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setOpen(true) }}
              sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}>
              New Task
            </Button>
          )}
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatCard title="To Do" value={todoCount} icon={<AssignmentIcon />} color="#f59e0b" bgColor="#fef3c7" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="In Progress" value={inProgressCount} icon={<HourglassEmptyIcon />} color="#3b82f6" bgColor="#dbeafe" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Completed" value={doneCount} icon={<CheckCircleIcon />} color="#10b981" bgColor="#dcfce7" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Failed" value={failedCount} icon={<ErrorIcon />} color="#ef4444" bgColor="#fee2e2" />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        {/* Search and Filters */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
            InputProps={{ startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} fontSize="small" /> }}
            sx={{ minWidth: 280, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' } }}
          />
          <Button variant={showFilters ? 'contained' : 'outlined'} startIcon={<FilterListIcon />} onClick={() => setShowFilters((s) => !s)}
            sx={{ textTransform: 'none', borderRadius: 2, ...(showFilters && { bgcolor: '#3b82f6' }) }}>
            {showFilters ? 'Hide Filters' : 'Filters'}
          </Button>
        </Box>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, p: 2, bgcolor: '#f1f5f9', borderRadius: 2, flexWrap: 'wrap' }}>
            <Chip label={`${selectedIds.length} selected`} color="primary" size="small" />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}>
                <MenuItem value="">No change</MenuItem>
                <MenuItem value="todo">To Do</MenuItem>
                <MenuItem value="in-progress">In Progress</MenuItem>
                <MenuItem value="done">Done</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Priority</InputLabel>
              <Select label="Priority" value={bulkPriority} onChange={(e) => setBulkPriority(e.target.value)}>
                <MenuItem value="">No change</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Assigned To</InputLabel>
              <Select label="Assigned To" value={bulkAssignedTo} onChange={(e) => setBulkAssignedTo(e.target.value)}>
                <MenuItem value="">No change</MenuItem>
                {(users || []).map((u: any) => <MenuItem key={u.id} value={u.id}>{u.name || u.email}</MenuItem>)}
              </Select>
            </FormControl>
            <Button variant="contained" onClick={applyBulk} sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}>
              Apply Changes
            </Button>
          </Box>
        )}

        {/* Table */}
        <TableContainer sx={{ maxHeight: '60vh', overflowY: 'auto', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ '& th': { whiteSpace: 'nowrap', bgcolor: '#f8fafc', fontWeight: 600, color: '#475569' } }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedIds.length > 0 && selectedIds.length === tasks.length}
                    indeterminate={selectedIds.length > 0 && selectedIds.length < tasks.length}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                  <TableSortLabel active={sortKey === 'title'} direction={sortKey === 'title' ? sortDir : 'asc'} onClick={() => handleSort('title')}>Title</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem', minWidth: 120 }}>
                  <TableSortLabel active={sortKey === 'status'} direction={sortKey === 'status' ? sortDir : 'asc'} onClick={() => handleSort('status')}>Status</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem', minWidth: 120 }}>
                  <TableSortLabel active={sortKey === 'priority'} direction={sortKey === 'priority' ? sortDir : 'asc'} onClick={() => handleSort('priority')}>Priority</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                  <TableSortLabel active={sortKey === 'description'} direction={sortKey === 'description' ? sortDir : 'asc'} onClick={() => handleSort('description')}>Description</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem', minWidth: 120 }}>
                  <TableSortLabel active={sortKey === 'dueDate'} direction={sortKey === 'dueDate' ? sortDir : 'asc'} onClick={() => handleSort('dueDate')}>Due Date</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                  <TableSortLabel active={sortKey === 'assignedTo'} direction={sortKey === 'assignedTo' ? sortDir : 'asc'} onClick={() => handleSort('assignedTo')}>Assigned To</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                  <TableSortLabel active={sortKey === 'tags'} direction={sortKey === 'tags' ? sortDir : 'asc'} onClick={() => handleSort('tags')}>Tags</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                  <TableSortLabel active={sortKey === 'reason'} direction={sortKey === 'reason' ? sortDir : 'asc'} onClick={() => handleSort('reason')}>Failed Reason</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                  <TableSortLabel active={sortKey === 'attachment'} direction={sortKey === 'attachment' ? sortDir : 'asc'} onClick={() => handleSort('attachment')}>Attachment</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Activity</TableCell>
                {showUpdateColumn && <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Action</TableCell>}
              </TableRow>
              {showFilters && <TableFilters columns={columns} filters={filters} onChange={setFilters} prefixCells={1} suffixCells={showUpdateColumn ? 1 : 0} />}
            </TableHead>
            <TableBody>
              {sortedTasks.map((t: any) => (
                <TableRow key={t.id} sx={{ ...(t.status === 'failed' ? { backgroundColor: 'rgba(239, 68, 68, 0.04)' } : {}), '&:hover': { bgcolor: '#f8fafc' }, transition: 'background-color 0.2s' }}>
                  <TableCell padding="checkbox">
                    <Checkbox checked={selectedIds.includes(t.id)} onChange={() => toggleSelect(t.id)} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500, color: '#1e293b' }}>{t.title}</TableCell>
                  <TableCell>
                    <Chip label={t.status} size="small" sx={{ fontWeight: 600, bgcolor: t.status === 'done' ? '#dcfce7' : t.status === 'in-progress' ? '#dbeafe' : t.status === 'failed' ? '#fee2e2' : '#fef3c7', color: t.status === 'done' ? '#16a34a' : t.status === 'in-progress' ? '#2563eb' : t.status === 'failed' ? '#dc2626' : '#d97706' }} />
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const p = (t.priority || '').toLowerCase()
                      const bgColor = p === 'high' ? '#fee2e2' : p === 'medium' ? '#fef3c7' : '#dcfce7'
                      const textColor = p === 'high' ? '#dc2626' : p === 'medium' ? '#d97706' : '#16a34a'
                      return <Chip label={t.priority} size="small" sx={{ bgcolor: bgColor, color: textColor, fontWeight: 600 }} />
                    })()}
                  </TableCell>
                  <TableCell sx={{ color: '#64748b', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.description}</TableCell>
                  <TableCell sx={{ color: '#64748b' }}>{t.dueDate}</TableCell>
                  <TableCell sx={{ color: '#64748b' }}>{t.assignedTo}</TableCell>
                  <TableCell>
                    {(t.tags || []).length ? (t.tags || []).map((tag: string) => <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5, bgcolor: '#e0e7ff', color: '#4338ca' }} />) : '--'}
                  </TableCell>
                  <TableCell sx={{ color: '#ef4444' }}>{t.status === 'failed' && t.reason ? t.reason : ''}</TableCell>
                  <TableCell>
                    {t.attachment ? (
                      <Button size="small" variant="text" onClick={() => openAttachmentDialog(t.attachment)} sx={{ textTransform: 'none' }}>{t.attachment.filename || t.attachment.name || 'View'}</Button>
                    ) : '--'}
                  </TableCell>
                  <TableCell>
                    {t.activity?.length ? (
                      <Button size="small" variant="text" onClick={() => openActivityDialog(t.activity)} sx={{ textTransform: 'none' }}>View</Button>
                    ) : '--'}
                  </TableCell>
                  {showUpdateColumn && (
                    <TableCell>
                      {t.assignedTo === user?.id ? (
                        (t.status !== 'done' && t.status !== 'failed') ? (
                          <Button size="small" variant="contained" onClick={() => openStatusDialog(t.id)} sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}>Update</Button>
                        ) : (
                          <Button size="small" disabled sx={{ textTransform: 'none', borderRadius: 2 }}>Update</Button>
                        )
                      ) : (
                        <Typography variant="caption" color="text.secondary">{t.status}{t.status === 'failed' && t.reason ? ` — ${t.reason}` : ''}</Typography>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button size="small" variant="outlined" sx={{ color: '#64748b', borderColor: '#e2e8f0', minWidth: 36, borderRadius: 1.5 }} onClick={() => setPage(1)} disabled={page === 1}>«</Button>
          <Button size="small" variant="outlined" sx={{ color: '#64748b', borderColor: '#e2e8f0', minWidth: 36, borderRadius: 1.5 }} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>‹</Button>
          <Typography variant="body2" sx={{ fontWeight: 500, color: '#475569', px: 2 }}>
            {totalTasks === 0 ? '0 of 0' : `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, totalTasks)} of ${totalTasks}`}
          </Typography>
          <Button size="small" variant="outlined" sx={{ color: '#64748b', borderColor: '#e2e8f0', minWidth: 36, borderRadius: 1.5 }} onClick={() => setPage((p) => Math.min(Math.ceil(totalTasks / pageSize), p + 1))} disabled={page >= Math.ceil(totalTasks / pageSize)}>›</Button>
          <Button size="small" variant="outlined" sx={{ color: '#64748b', borderColor: '#e2e8f0', minWidth: 36, borderRadius: 1.5 }} onClick={() => setPage(Math.max(1, Math.ceil(totalTasks / pageSize)))} disabled={page >= Math.ceil(totalTasks / pageSize)}>»</Button>
        </Box>
      </Paper>

      {/* Dialogs */}
      {open && <TaskForm open={open} initial={editing} onClose={() => { setOpen(false); refetch() }} />}
      {statusOpen && selectedTaskId && <StatusUpdateDialog open={statusOpen} taskId={selectedTaskId} initialStatus={undefined} onClose={(ok: boolean) => { setStatusOpen(false); setSelectedTaskId(null); if (ok) refetch() }} />}
      
      <Dialog open={attachmentOpen} onClose={() => setAttachmentOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>Attachment</DialogTitle>
        <DialogContent>
          <Typography variant="body2">{attachment?.filename || attachment?.name || 'Attachment'}</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAttachmentOpen(false)} sx={{ textTransform: 'none', borderRadius: 2 }}>Close</Button>
          {attachmentUrl && (
            <>
              <Button component="a" href={attachmentUrl} target="_blank" rel="noopener noreferrer" sx={{ textTransform: 'none', borderRadius: 2 }}>Preview</Button>
              <Button component="a" href={attachmentUrl} download variant="contained" sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#3b82f6' }}>Download</Button>
            </>
          )}
        </DialogActions>
      </Dialog>

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
    </Box>
  )
}
