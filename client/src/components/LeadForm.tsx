import React, { useEffect, useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem } from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import axios from 'axios'

const API = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function LeadForm({ open, onClose, initial }: any) {
  const { control, handleSubmit, reset } = useForm({ defaultValues: initial || { name: '', email: '', phone: '', stage: 'new', owner: '', tags: '' } })
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    axios.get(API + '/users', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => setUsers(r.data || []))
      .catch(() => setUsers([]))
  }, [])

  useEffect(() => {
    const seed = initial ? { ...initial, tags: (initial.tags || []).join(', ') } : { name: '', email: '', phone: '', stage: 'new', owner: '', tags: '' }
    reset(seed)
  }, [initial, reset])

  const onSubmit = async (data: any) => {
    try {
      const payload = { ...data, tags: data.tags }
      if (initial) {
        await axios.put(API + '/leads/' + initial.id, payload, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      } else {
        await axios.post(API + '/leads', payload, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      }
      onClose()
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>{initial ? 'Edit Lead' : 'New Lead'}</DialogTitle>
      <DialogContent>
        <Controller name="name" control={control} render={({ field }) => <TextField {...field} label="Name" fullWidth margin="normal" />} />
        <Controller name="email" control={control} render={({ field }) => <TextField {...field} label="Email" fullWidth margin="normal" />} />
        <Controller name="phone" control={control} render={({ field }) => <TextField {...field} label="Phone" fullWidth margin="normal" />} />
        <Controller name="stage" control={control} render={({ field }) => (
          <TextField select {...field} label="Stage" fullWidth margin="normal">
            <MenuItem value="new">New</MenuItem>
            <MenuItem value="contacted">Contacted</MenuItem>
            <MenuItem value="qualified">Qualified</MenuItem>
            <MenuItem value="won">Won</MenuItem>
            <MenuItem value="lost">Lost</MenuItem>
          </TextField>
        )} />
        <Controller name="owner" control={control} render={({ field }) => (
          <TextField select {...field} label="Owner" fullWidth margin="normal">
            <MenuItem value="">Unassigned</MenuItem>
            {users.map(u => <MenuItem key={u.id} value={u.id}>{u.name || u.email}</MenuItem>)}
          </TextField>
        )} />
        <Controller name="tags" control={control} render={({ field }) => (
          <TextField {...field} label="Tags (comma separated)" fullWidth margin="normal" />
        )} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit(onSubmit)} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  )
}
