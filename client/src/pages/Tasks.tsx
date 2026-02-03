import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useQuery, useQueryClient } from 'react-query'
import axios from 'axios'
import { Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Typography, Box, Chip, Pagination, Dialog, DialogTitle, DialogContent, DialogActions, TableSortLabel } from '@mui/material'
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
  const [sortKey, setSortKey] = useState('dueDate')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const pageSize = 10

  const { data: tasks = [], refetch } = useQuery('tasks', async () => {
    const res = await axios.get(API + '/tasks', { withCredentials: true, headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    return res.data
  })
  const showUpdateColumn = !!(user && user.role !== 'admin' && tasks.some((t: any) => t.assignedTo === user.id))
  const [filters, setFilters] = React.useState<any>({})

  const columns: Column[] = [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'status', label: 'Status', type: 'select', options: ['todo','in-progress','done','failed'] },
    { key: 'priority', label: 'Priority', type: 'select', options: ['high','medium','low'] },
    { key: 'description', label: 'Description', type: 'text' },
    { key: 'dueDate', label: 'Due', type: 'date-range' },
    { key: 'assignedTo', label: 'Assigned To', type: 'text' },
    { key: 'reason', label: 'Failed Reason', type: 'text' },
    { key: 'attachment', label: 'Attachment', type: 'text' },
  ]

  const filteredTasks = (tasks || []).filter((t: any) => {
    return columns.every((c) => {
      const v = filters[c.key]
      if (!v) return true
      if (c.type === 'date') {
        const from = v?.from ? new Date(v.from) : null
        const to = v?.to ? new Date(v.to) : null
        if (!t[c.key]) return false
        const d = new Date(t[c.key])
        if (from && d < from) return false
        if (to && d > to) return false
        return true
      }
      const raw = t[c.key]
      const cell = (raw && typeof raw === 'object') ? (raw.filename || raw.name || '') : (raw ?? '')
      return String(cell).toLowerCase().includes(String(v).toLowerCase())
    })
  })

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
        <Box sx={{ display: 'flex', gap: 1 }}>
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
              <TableSortLabel active={sortKey === 'reason'} direction={sortKey === 'reason' ? sortDir : 'asc'} onClick={() => handleSort('reason')}>Failed Reason</TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
              <TableSortLabel active={sortKey === 'attachment'} direction={sortKey === 'attachment' ? sortDir : 'asc'} onClick={() => handleSort('attachment')}>Attachment</TableSortLabel>
            </TableCell>
            {showUpdateColumn && <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem' }}>Update</TableCell>}
            <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem' }}>Actions</TableCell>
          </TableRow>
          {showFilters && <TableFilters columns={columns} filters={filters} onChange={setFilters} />}
        </TableHead>
        <TableBody>
          {sortedTasks.slice((page-1)*pageSize, page*pageSize).map((t: any) => (
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
              <TableCell>{t.status === 'failed' && t.reason ? t.reason : ''}</TableCell>
              <TableCell>
                {t.attachment ? (
                  <Button size="small" onClick={() => openAttachmentDialog(t.attachment)}>{t.attachment.filename || t.attachment.name || 'Attachment'}</Button>
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
        <Pagination count={Math.max(1, Math.ceil(tasks.length / pageSize))} page={page} onChange={handlePage} />
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
    </Paper>
  )
}
