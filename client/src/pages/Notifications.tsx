import React from 'react'
import { useQuery } from 'react-query'
import axios from 'axios'
import { Paper, Typography, List, ListItem, ListItemText, Button, Box } from '@mui/material'

const API = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function Notifications() {
  const { data: items = [], refetch } = useQuery('notifications', async () => {
    const res = await axios.get(API + '/notifications', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    return res.data
  })

  const markRead = async (id: string) => {
    await axios.post(API + '/notifications/' + id + '/read', {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    refetch()
  }

  const markAllRead = async () => {
    await axios.post(API + '/notifications/read-all', {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    refetch()
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Notifications</Typography>
        <Button size="small" onClick={markAllRead} disabled={!items.some((n: any) => !n.read)}>Clear</Button>
      </Box>
      <List>
        {items.map((n: any) => (
          <ListItem key={n.id} divider>
            <ListItemText
              primary={n.message}
              secondary={n.at}
            />
            {!n.read && (
              <Button size="small" onClick={() => markRead(n.id)}>Mark read</Button>
            )}
          </ListItem>
        ))}
      </List>
      {items.length === 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2">No notifications yet.</Typography>
        </Box>
      )}
    </Paper>
  )
}
