import React, { useEffect, useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem } from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import axios from 'axios'

const API = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function TaskForm({ open, onClose, initial }: any) {
  const { control, handleSubmit, reset, watch } = useForm({ defaultValues: initial || { title: '', status: 'todo', priority: 'medium', dueDate: '', assignedTo: '', leadId: '', description: '', tags: '' } })
  const [users, setUsers] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])

  useEffect(() => {
    axios.get(API + '/users', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => setUsers(r.data || []))
      .catch(() => setUsers([]))
    axios.get(API + '/leads', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => setLeads(r.data || []))
      .catch(() => setLeads([]))
  }, [])

  useEffect(() => {
    const seed = initial ? { ...initial, tags: (initial.tags || []).join(', ') } : { title: '', status: 'todo', priority: 'medium', dueDate: '', assignedTo: '', leadId: '', description: '', tags: '' }
    reset(seed)
  }, [initial, reset])

  const selectedLeadId = watch('leadId')
  const selectedLead = leads.find(l => l.id === selectedLeadId)

  const onSubmit = async (data: any) => {
    try {
      const payload = { ...data, tags: data.tags }
      if (initial) {
        await axios.put(API + '/tasks/' + initial.id, payload, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      } else {
        await axios.post(API + '/tasks', payload, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      }
      onClose()
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>{initial ? 'Edit Task' : 'New Task'}</DialogTitle>
      <DialogContent>
        <Controller name="title" control={control} render={({ field }) => <TextField {...field} label="Title" fullWidth margin="normal" />} />
        <Controller name="description" control={control} render={({ field }) => <TextField {...field} label="Description" fullWidth margin="normal" multiline minRows={3} />} />
        <Controller name="status" control={control} render={({ field }) => (
          <TextField select {...field} label="Status" fullWidth margin="normal">
            <MenuItem value="todo">To Do</MenuItem>
            <MenuItem value="in-progress">In Progress</MenuItem>
            <MenuItem value="done">Done</MenuItem>
          </TextField>
        )} />
        <Controller name="priority" control={control} render={({ field }) => (
          <TextField select {...field} label="Priority" fullWidth margin="normal">
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </TextField>
        )} />
        <Controller name="dueDate" control={control} render={({ field }) => <TextField {...field} label="Due Date" type="date" fullWidth margin="normal" InputLabelProps={{ shrink: true }} />} />
        <Controller name="assignedTo" control={control} render={({ field }) => (
          <TextField select {...field} label="Assigned To" fullWidth margin="normal">
            <MenuItem value="">Unassigned</MenuItem>
            {users.map(u => <MenuItem key={u.id} value={u.id}>{u.name || u.email}</MenuItem>)}
          </TextField>
        )} />
        <Controller name="tags" control={control} render={({ field }) => (
          <TextField {...field} label="Tags (comma separated)" fullWidth margin="normal" />
        )} />

        <Controller name="leadId" control={control} render={({ field }) => (
          <TextField select {...field} label="Related Lead" fullWidth margin="normal">
            <MenuItem value="">None</MenuItem>
            {leads.map(l => <MenuItem key={l.id} value={l.id}>{l.name} {l.email ? `(${l.email})` : ''}</MenuItem>)}
          </TextField>
        )} />

        {selectedLead && (
          <>
            <TextField label="Lead Email" value={selectedLead.email || ''} fullWidth margin="normal" InputProps={{ readOnly: true }} />
            <TextField label="Lead Phone" value={selectedLead.phone || ''} fullWidth margin="normal" InputProps={{ readOnly: true }} />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit(onSubmit)} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  )
}
