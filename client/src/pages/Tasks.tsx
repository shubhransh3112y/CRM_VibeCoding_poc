import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useQuery, useQueryClient } from 'react-query'
import axios from 'axios'
import { Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Typography, Box, Chip, Pagination, Dialog, DialogTitle, DialogContent, DialogActions, TableSortLabel, TextField } from '@mui/material'
import TableFilters, { Column } from '../components/TableFilters'
import StatusUpdateDialog from '../components/StatusUpdateDialog'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import TaskForm from '../components/TaskForm'

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

  const attachmentUrl = attachment?.url ? (attachment.url.startsWith('http') ? attachment.url : API + attachment.url) : ''

  const deleteTask = async (id: string) => {
    await axios.delete(API + '/tasks/' + id, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    refetch()
  }

  const openStatusDialog = (id: string) => { setSelectedTaskId(id); setStatusOpen(true) }

  const handlePage = (e: any, p: number) => setPage(p)

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Tasks</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
          />
          <Button variant="outlined" onClick={() => setShowFilters((s) => !s)}>{showFilters ? 'Hide Filters' : 'Show Filters'}</Button>
          {user && user.role !== 'user' && <Button variant="contained" color="primary" onClick={() => { setEditing(null); setOpen(true) }} aria-label="New Task">New Task</Button>}
        </Box>
      </Box>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
              <TableSortLabel active={sortKey === 'title'} direction={sortKey === 'title' ? sortDir : 'asc'} onClick={() => handleSort('title')}>Title</TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem', minWidth: 140 }}>
              <TableSortLabel active={sortKey === 'status'} direction={sortKey === 'status' ? sortDir : 'asc'} onClick={() => handleSort('status')}>Status</TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem', minWidth: 140 }}>
              <TableSortLabel active={sortKey === 'priority'} direction={sortKey === 'priority' ? sortDir : 'asc'} onClick={() => handleSort('priority')}>Priority</TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
              <TableSortLabel active={sortKey === 'description'} direction={sortKey === 'description' ? sortDir : 'asc'} onClick={() => handleSort('description')}>Description</TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem', minWidth: 160 }}>
              <TableSortLabel active={sortKey === 'dueDate'} direction={sortKey === 'dueDate' ? sortDir : 'asc'} onClick={() => handleSort('dueDate')}>Due</TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
              <TableSortLabel active={sortKey === 'assignedTo'} direction={sortKey === 'assignedTo' ? sortDir : 'asc'} onClick={() => handleSort('assignedTo')}>Assigned To</TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
              <TableSortLabel active={sortKey === 'tags'} direction={sortKey === 'tags' ? sortDir : 'asc'} onClick={() => handleSort('tags')}>Tags</TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
              <TableSortLabel active={sortKey === 'reason'} direction={sortKey === 'reason' ? sortDir : 'asc'} onClick={() => handleSort('reason')}>Failed Reason</TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
              <TableSortLabel active={sortKey === 'attachment'} direction={sortKey === 'attachment' ? sortDir : 'asc'} onClick={() => handleSort('attachment')}>Attachment</TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem' }}>Activity</TableCell>
            {showUpdateColumn && <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem' }}>Update</TableCell>}
            <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem' }}>Actions</TableCell>
          </TableRow>
          {showFilters && <TableFilters columns={columns} filters={filters} onChange={setFilters} />}
        </TableHead>
        <TableBody>
          {sortedTasks.map((t: any) => (
            <TableRow key={t.id} sx={t.status === 'failed' ? { backgroundColor: 'rgba(255, 82, 82, 0.06)' } : undefined}>
              <TableCell>{t.title}</TableCell>
              <TableCell>{t.status}</TableCell>
              <TableCell>
                {(() => {
                  const p = (t.priority || '').toLowerCase()
                  const color = p === 'high' ? 'error' : p === 'medium' ? 'warning' : 'success'
                  return <Chip label={t.priority} color={color as any} size="small" />
                })()}
              </TableCell>
              <TableCell>{t.description}</TableCell>
              <TableCell>{t.dueDate}</TableCell>
              <TableCell>{t.assignedTo}</TableCell>
              <TableCell>
                {(t.tags || []).length ? (t.tags || []).map((tag: string) => <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5 }} />) : '--'}
              </TableCell>
              <TableCell>{t.status === 'failed' && t.reason ? t.reason : ''}</TableCell>
              <TableCell>
                {t.attachment ? (
                  <Button size="small" onClick={() => openAttachmentDialog(t.attachment)}>{t.attachment.filename || t.attachment.name || 'Attachment'}</Button>
                ) : (
                  '--'
                )}
              </TableCell>
              <TableCell>
                {t.activity?.length ? (
                  <Button size="small" onClick={() => openActivityDialog(t.activity)}>View</Button>
                ) : (
                  '--'
                )}
              </TableCell>
              <TableCell>
                {/* Admins/managers can edit/delete; assigned users and admins/managers can update status */}
                {user && user.role !== 'user' && (
                  <>
                    <IconButton onClick={() => { setEditing(t); setOpen(true) }}><EditIcon/></IconButton>
                    <IconButton onClick={() => deleteTask(t.id)}><DeleteIcon/></IconButton>
                  </>
                )}
                {showUpdateColumn ? (
                  t.assignedTo === user?.id ? (
                    (t.status !== 'done' && t.status !== 'failed') ? (
                      <Button size="small" onClick={() => openStatusDialog(t.id)} sx={{ ml: 1 }}>Update Status</Button>
                    ) : (
                      <Button size="small" disabled sx={{ ml: 1 }}>Update Status</Button>
                    )
                  ) : (
                    <span>{t.status}{t.status === 'failed' && t.reason ? ` — ${t.reason}` : ''}</span>
                  )
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination count={Math.max(1, Math.ceil(totalTasks / pageSize))} page={page} onChange={handlePage} />
      </Box>

      {open && <TaskForm open={open} initial={editing} onClose={() => { setOpen(false); refetch() }} />}
      {statusOpen && selectedTaskId && <StatusUpdateDialog open={statusOpen} taskId={selectedTaskId} initialStatus={undefined} onClose={(ok: boolean) => { setStatusOpen(false); setSelectedTaskId(null); if (ok) refetch() }} />}
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
      <Dialog open={activityOpen} onClose={() => setActivityOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Activity</DialogTitle>
        <DialogContent>
          {activityItems.length === 0 ? (
            <Typography variant="body2">No activity yet.</Typography>
          ) : (
            activityItems.slice().reverse().map((a: any) => (
              <Box key={a.id} sx={{ mb: 1 }}>
                <Typography variant="body2"><strong>{a.action}</strong> — {a.summary}</Typography>
                <Typography variant="caption" color="text.secondary">{a.at}</Typography>
              </Box>
            ))
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActivityOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}
