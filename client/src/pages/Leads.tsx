import React, { useState } from 'react'
import axios from 'axios'
import { useQuery } from 'react-query'
import { Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button, Box, TableSortLabel, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Pagination, TextField } from '@mui/material'
import { LeadForm } from '../components'
import TableFilters, { Column } from '../components/TableFilters'

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
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Leads</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
          />
          <Button variant="outlined" onClick={() => setShowFilters((s) => !s)}>{showFilters ? 'Hide Filters' : 'Show Filters'}</Button>
          <Button variant="contained" color="primary" onClick={() => { setEditing(null); setOpen(true) }} aria-label="New Lead">New Lead</Button>
        </Box>
      </Box>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <TableSortLabel active={sortKey === 'name'} direction={sortKey === 'name' ? sortDir : 'asc'} onClick={() => handleSort('name')}>Name</TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel active={sortKey === 'email'} direction={sortKey === 'email' ? sortDir : 'asc'} onClick={() => handleSort('email')}>Email</TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel active={sortKey === 'phone'} direction={sortKey === 'phone' ? sortDir : 'asc'} onClick={() => handleSort('phone')}>Phone</TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel active={sortKey === 'stage'} direction={sortKey === 'stage' ? sortDir : 'asc'} onClick={() => handleSort('stage')}>Stage</TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel active={sortKey === 'owner'} direction={sortKey === 'owner' ? sortDir : 'asc'} onClick={() => handleSort('owner')}>Owner</TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel active={sortKey === 'tags'} direction={sortKey === 'tags' ? sortDir : 'asc'} onClick={() => handleSort('tags')}>Tags</TableSortLabel>
            </TableCell>
            <TableCell>Activity</TableCell>
          </TableRow>
          {showFilters && <TableFilters columns={columns} filters={filters} onChange={setFilters} />}
        </TableHead>
        <TableBody>
          {sortedLeads.map((l: any) => (
            <TableRow key={l.id}>
              <TableCell>{l.name}</TableCell>
              <TableCell>{l.email}</TableCell>
              <TableCell>{l.phone}</TableCell>
              <TableCell>{l.stage}</TableCell>
              <TableCell>{l.owner}</TableCell>
              <TableCell>
                {(l.tags || []).length ? (l.tags || []).map((tag: string) => <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5 }} />) : '--'}
              </TableCell>
              <TableCell>
                {l.activity?.length ? (
                  <Button size="small" onClick={() => openActivityDialog(l.activity)}>View</Button>
                ) : (
                  '--'
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination count={Math.max(1, Math.ceil(totalLeads / pageSize))} page={page} onChange={handlePage} />
      </Box>

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

      {open && <LeadForm open={open} initial={editing} onClose={() => { setOpen(false); refetch() }} />}
    </Paper>
  )
}
