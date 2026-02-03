import React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem } from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import axios from 'axios'

const API = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function UserForm({ open, onClose, initial }: any) {
  const { control, handleSubmit } = useForm({ defaultValues: initial || { name: '', email: '', password: '', role: 'user' } })

  const onSubmit = async (data: any) => {
    try {
      if (initial) {
        await axios.put(API + '/users/' + initial.id, data, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      } else {
        await axios.post(API + '/users', data, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      }
      onClose()
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>{initial ? 'Edit User' : 'New User'}</DialogTitle>
      <DialogContent>
        <Controller name="name" control={control} render={({ field }) => <TextField {...field} label="Name" fullWidth margin="normal" />} />
        <Controller name="email" control={control} render={({ field }) => <TextField {...field} label="Email" fullWidth margin="normal" />} />
        {!initial && <Controller name="password" control={control} render={({ field }) => <TextField {...field} label="Password" type="password" fullWidth margin="normal" />} />}
        <Controller name="role" control={control} render={({ field }) => (
          <TextField select {...field} label="Role" fullWidth margin="normal">
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="manager">Manager</MenuItem>
            <MenuItem value="user">User</MenuItem>
          </TextField>
        )} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit(onSubmit)} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  )
}
