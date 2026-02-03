import React, { useState } from 'react'
import axios from 'axios'
import { useQuery } from 'react-query'
import { Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button, Box, TableSortLabel } from '@mui/material'
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

  const columns: Column[] = [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'phone', label: 'Phone', type: 'text' },
    { key: 'stage', label: 'Stage', type: 'select', options: ['new','contacted','qualified','converted'] },
    { key: 'owner', label: 'Owner', type: 'text' },
  ]

  const { data: leads = [], refetch } = useQuery('leads', async () => {
    const res = await axios.get(API + '/leads', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    return res.data
  })

  const filteredLeads = (leads || []).filter((l: any) => columns.every((c) => {
    const v = filters[c.key]
    if (!v) return true
    return (l[c.key] ?? '').toString().toLowerCase().includes((v as string).toLowerCase())
  }))

  const sortedLeads = [...filteredLeads].sort((a: any, b: any) => {
    if (!sortKey) return 0
    const av = (a?.[sortKey] ?? '').toString().toLowerCase()
    const bv = (b?.[sortKey] ?? '').toString().toLowerCase()
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

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Leads</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {open && <LeadForm open={open} initial={editing} onClose={() => { setOpen(false); refetch() }} />}
    </Paper>
  )
}
