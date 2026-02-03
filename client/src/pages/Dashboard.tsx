import React, { useState } from 'react'
import { useQuery } from 'react-query'
import axios from 'axios'
import { Paper, Grid, Typography, Table, TableHead, TableRow, TableCell, TableBody, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TableSortLabel, Box } from '@mui/material'
import { useAuth } from '../context/AuthContext'
import StatusUpdateDialog from '../components/StatusUpdateDialog'
import TableFilters, { Column } from '../components/TableFilters'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const API = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

function useTasks() {
  return useQuery('tasks', async () => {
    const res = await axios.get(API + '/tasks', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    return res.data
  })
}

function useLeads() {
  return useQuery('leads', async () => {
    const res = await axios.get(API + '/leads', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    return res.data
  })
}

function useUsers() {
  return useQuery('users', async () => {
    const res = await axios.get(API + '/users', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    return res.data
  })
}

export default function Dashboard() {
  // visible title changed to Home in nav/routes; keep component name for clarity
  const { data: tasks = [], refetch } = useTasks()
  const { data: leads = [] } = useLeads()
  const { data: users = [] } = useUsers()
  const { user } = useAuth()

  const [statusOpen, setStatusOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [attachmentOpen, setAttachmentOpen] = useState(false)
  const [attachment, setAttachment] = useState<any | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [sortKey, setSortKey] = useState('dueDate')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const openStatusDialog = (id: string) => { setSelectedTaskId(id); setStatusOpen(true) }

  const userMap = users.reduce((acc: any, u: any) => { acc[u.id] = u.name || u.email || u.id; return acc }, {})

  const [filters, setFilters] = useState<any>({})
  const columns: Column[] = [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'description', label: 'Description', type: 'text' },
    { key: 'status', label: 'Status', type: 'select', options: ['todo','in-progress','done','failed'] },
    { key: 'priority', label: 'Priority', type: 'select', options: ['high','medium','low'] },
    { key: 'dueDate', label: 'Due', type: 'date-range' },
    { key: 'assignedTo', label: 'Assigned To', type: 'text' },
    { key: 'attachment', label: 'Attachment', type: 'text' },
  ]

  const matchesFilters = (task: any, allFilters: any) => {
    if (!allFilters || Object.keys(allFilters).length === 0) return true
    return Object.entries(allFilters).every(([key, filterValue]) => {
      if (filterValue === null || filterValue === undefined || filterValue === '') return true
      const taskValue = task[key]

      if (typeof filterValue === 'object' && filterValue !== null && ('from' in filterValue || 'to' in filterValue)) {
        const range = filterValue as { from?: string; to?: string }
        if (!taskValue) return false
        const tv = new Date(taskValue)
        if (range.from) {
          const from = new Date(range.from)
          if (!isNaN(from.getTime()) && tv < from) return false
        }
        if (range.to) {
          const to = new Date(range.to)
          if (!isNaN(to.getTime()) && tv > to) return false
        }
        return true
      }

      if (Array.isArray(filterValue)) {
        return filterValue.length === 0 || filterValue.includes(taskValue)
      }

      const v1 = taskValue && typeof taskValue === 'object' ? (taskValue.filename || taskValue.name || '') : (taskValue == null ? '' : String(taskValue))
      const v2 = filterValue == null ? '' : String(filterValue)
      return v1.toLowerCase().includes(v2.toLowerCase())
    })
  }

  const filteredTasks = Array.isArray(tasks) ? tasks.filter((t: any) => matchesFilters(t, filters)) : []

  const getComparable = (row: any, key: string) => {
    if (key === 'dueDate') return row?.dueDate ? new Date(row.dueDate).getTime() : 0
    if (key === 'attachment') return (row?.attachment?.filename || row?.attachment?.name || '').toString().toLowerCase()
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

  const attachmentUrl = attachment?.url ? (attachment.url.startsWith('http') ? attachment.url : API + attachment.url) : ''

  const statusMap = tasks.reduce((acc: any, t: any) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc }, {})
  const tasksByStatus = Object.entries(statusMap).map(([name, value]) => ({ name, value }))

  const leadsByStage = Object.entries(leads.reduce((acc: any, l: any) => { acc[l.stage] = (acc[l.stage] || 0) + 1; return acc }, {})).map(([name, value]) => ({ name, value }))

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Tasks by Status</Typography>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={tasksByStatus} dataKey="value" nameKey="name" outerRadius={80} fill="#8884d8" label>
                {tasksByStatus.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Leads by Stage</Typography>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={leadsByStage}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ p: 2, mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Tasks</Typography>
            <Button variant="outlined" onClick={() => setShowFilters((s) => !s)}>{showFilters ? 'Hide Filters' : 'Show Filters'}</Button>
          </Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  <TableSortLabel active={sortKey === 'title'} direction={sortKey === 'title' ? sortDir : 'asc'} onClick={() => handleSort('title')}>Title</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  <TableSortLabel active={sortKey === 'description'} direction={sortKey === 'description' ? sortDir : 'asc'} onClick={() => handleSort('description')}>Description</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem', minWidth: 140 }}>
                  <TableSortLabel active={sortKey === 'status'} direction={sortKey === 'status' ? sortDir : 'asc'} onClick={() => handleSort('status')}>Status</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem', minWidth: 140 }}>
                  <TableSortLabel active={sortKey === 'priority'} direction={sortKey === 'priority' ? sortDir : 'asc'} onClick={() => handleSort('priority')}>Priority</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem', minWidth: 160 }}>
                  <TableSortLabel active={sortKey === 'dueDate'} direction={sortKey === 'dueDate' ? sortDir : 'asc'} onClick={() => handleSort('dueDate')}>Due</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  <TableSortLabel active={sortKey === 'assignedTo'} direction={sortKey === 'assignedTo' ? sortDir : 'asc'} onClick={() => handleSort('assignedTo')}>Assigned To</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  <TableSortLabel active={sortKey === 'reason'} direction={sortKey === 'reason' ? sortDir : 'asc'} onClick={() => handleSort('reason')}>Failed Reason</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  <TableSortLabel active={sortKey === 'attachment'} direction={sortKey === 'attachment' ? sortDir : 'asc'} onClick={() => handleSort('attachment')}>Attachment</TableSortLabel>
                </TableCell>
                {user && user.role !== 'admin' && <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem' }}>Update</TableCell>}
              </TableRow>
              {showFilters && <TableFilters columns={columns} filters={filters} onChange={setFilters} />}
            </TableHead>
            <TableBody>
              {sortedTasks.slice(0, 10).map((t: any) => (
                <TableRow key={t.id} sx={t.status === 'failed' ? { backgroundColor: 'rgba(255, 82, 82, 0.06)' } : undefined}>
                  <TableCell>{t.title}</TableCell>
                  <TableCell>{t.description}</TableCell>
                  <TableCell>{t.status}</TableCell>
                  <TableCell>
                    {(() => {
                      const p = (t.priority || '').toLowerCase()
                      const color = p === 'high' ? 'error' : p === 'medium' ? 'warning' : 'success'
                      return <Chip label={t.priority} color={color as any} size="small" />
                    })()}
                  </TableCell>
                  <TableCell>{t.dueDate}</TableCell>
                  <TableCell>{t.assignedTo ? (userMap[t.assignedTo] || t.assignedTo) : 'Unassigned'}</TableCell>
                  <TableCell>{t.status === 'failed' && t.reason ? t.reason : ''}</TableCell>
                  <TableCell>
                    {t.attachment ? (
                      <Button size="small" onClick={() => openAttachmentDialog(t.attachment)}>{t.attachment.filename || t.attachment.name || 'Attachment'}</Button>
                    ) : (
                      '--'
                    )}
                  </TableCell>
                  {user && user.role !== 'admin' && (
                    <TableCell>
                      {t.assignedTo === user?.id ? (
                        (t.status !== 'done' && t.status !== 'failed') ? (
                          <Button size="small" onClick={() => openStatusDialog(t.id)}>Update Status</Button>
                        ) : (
                          <Button size="small" disabled>Update Status</Button>
                        )
                      ) : (
                        <span>{t.status}{t.status === 'failed' && t.reason ? ` — ${t.reason}` : ''}</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Grid>
      {statusOpen && selectedTaskId && (
        <StatusUpdateDialog open={statusOpen} taskId={selectedTaskId} initialStatus={undefined} onClose={(ok: boolean) => { setStatusOpen(false); setSelectedTaskId(null); if (ok) refetch() }} />
      )}
      <Dialog open={attachmentOpen} onClose={() => setAttachmentOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Attachment</DialogTitle>
        <DialogContent>
          <Typography variant="body2">{attachment?.filename || attachment?.name || 'Attachment'}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAttachmentOpen(false)}>Close</Button>
          {attachmentUrl && (
            <>
              <Button component="a" href={attachmentUrl} target="_blank" rel="noopener noreferrer">Preview</Button>
              <Button component="a" href={attachmentUrl} download>Download</Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Grid>
  )
}
