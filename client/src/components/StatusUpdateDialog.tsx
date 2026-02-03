import React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, FormHelperText, Box } from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import axios from 'axios'

const API = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function StatusUpdateDialog({ open, onClose, taskId, initialStatus }: any) {
  const { control, handleSubmit, watch } = useForm({ defaultValues: { status: initialStatus || 'done', reason: '' } })
  const status = watch('status')
  const [file, setFile] = React.useState<File | null>(null)
  const [fileError, setFileError] = React.useState('')

  const onSubmit = async (data: any) => {
    try {
      if (status === 'failed' && !file) {
        setFileError('Attachment is required for failed tasks (jpg, jpeg, png, pdf).')
        return
      }

      const token = localStorage.getItem('token')
      if (file) {
        const form = new FormData()
        form.append('status', data.status)
        form.append('reason', data.reason || '')
        form.append('attachment', file)
        await axios.put(API + '/tasks/' + taskId, form, { headers: { Authorization: `Bearer ${token}` } })
      } else {
        await axios.put(API + '/tasks/' + taskId, data, { headers: { Authorization: `Bearer ${token}` } })
      }
      onClose(true)
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error')
      onClose(false)
    }
  }

  return (
    <Dialog open={open} onClose={() => onClose(false)} fullWidth>
      <DialogTitle>Update Task Status</DialogTitle>
      <DialogContent>
        <Controller name="status" control={control} render={({ field }) => (
          <TextField select {...field} label="Status" fullWidth margin="normal">
            <MenuItem value="done">Done</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
          </TextField>
        )} />
        {status === 'failed' && (
          <>
            <Controller name="reason" control={control} render={({ field }) => (
              <TextField {...field} label="Reason" fullWidth margin="normal" multiline minRows={3} />
            )} />
            <Box sx={{ mt: 1 }}>
              <Button variant="outlined" component="label">
                Upload Evidence
                <input
                  hidden
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null
                    if (!f) { setFile(null); setFileError(''); return }
                    const ok = ['image/jpeg', 'image/png', 'application/pdf'].includes(f.type)
                    if (!ok) { setFile(null); setFileError('Only JPG, PNG, or PDF files are allowed.'); return }
                    setFile(f); setFileError('')
                  }}
                />
              </Button>
              {file && <FormHelperText>Selected: {file.name}</FormHelperText>}
              {fileError && <FormHelperText error>{fileError}</FormHelperText>}
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)}>Cancel</Button>
        <Button onClick={handleSubmit(onSubmit)} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  )
}
