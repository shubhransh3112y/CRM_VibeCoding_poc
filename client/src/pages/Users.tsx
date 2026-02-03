import React, { useState } from 'react'
import axios from 'axios'
import { useQuery } from 'react-query'
import { Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button, IconButton, Box, TableSortLabel } from '@mui/material'
import TableFilters, { Column } from '../components/TableFilters'
import EditIcon from '@mui/icons-material/Edit'
import UserForm from '../components/UserForm'

const API = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function Users() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)

  const [filters, setFilters] = useState<any>({})
  const [showFilters, setShowFilters] = useState(false)
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const columns: Column[] = [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'role', label: 'Role', type: 'select', options: ['admin','manager','user'] },
  ]

  const { data: users = [], refetch } = useQuery('users', async () => {
    const res = await axios.get(API + '/users', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    return res.data
  })

  const filteredUsers = (users || []).filter((u: any) => columns.every((c) => {
    const v = filters[c.key]
    if (!v) return true
    const val = u[c.key]
    return (val ?? '').toString().toLowerCase().includes(String(v).toLowerCase())
  }))

  const sortedUsers = [...filteredUsers].sort((a: any, b: any) => {
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

  const onEdit = (u: any) => { setEditing(u); setOpen(true) }

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Users</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={() => setShowFilters((s) => !s)}>{showFilters ? 'Hide Filters' : 'Show Filters'}</Button>
          <Button variant="contained" color="primary" onClick={() => { setEditing(null); setOpen(true) }} aria-label="New User">New User</Button>
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
              <TableSortLabel active={sortKey === 'role'} direction={sortKey === 'role' ? sortDir : 'asc'} onClick={() => handleSort('role')}>Role</TableSortLabel>
            </TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
          {showFilters && <TableFilters columns={columns} filters={filters} onChange={setFilters} />}
        </TableHead>
        <TableBody>
          {sortedUsers.map((u: any) => (
            <TableRow key={u.id}>
              <TableCell>{u.name}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>{u.role}</TableCell>
              <TableCell>
                <IconButton onClick={() => onEdit(u)}><EditIcon/></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {open && <UserForm open={open} initial={editing} onClose={() => { setOpen(false); refetch() }} />}
    </Paper>
  )
}
