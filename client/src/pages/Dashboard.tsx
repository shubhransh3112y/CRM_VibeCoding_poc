import React, { useEffect, useState } from 'react'
import { useQuery } from 'react-query'
import axios from 'axios'
import { Paper, Grid, Typography, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, Box, TextField, FormControl, InputLabel, Select, MenuItem, Avatar, LinearProgress, Divider, IconButton } from '@mui/material'
import { useAuth } from '../context/AuthContext'
import StatusUpdateDialog from '../components/StatusUpdateDialog'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend, Area, AreaChart } from 'recharts'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import AssignmentIcon from '@mui/icons-material/Assignment'
import PeopleIcon from '@mui/icons-material/People'
import WarningIcon from '@mui/icons-material/Warning'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RefreshIcon from '@mui/icons-material/Refresh'
import FilterListIcon from '@mui/icons-material/FilterList'

const API = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

function useTasks() {
  return useQuery('tasks', async () => {
    const res = await axios.get(API + '/tasks', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    return res.data
  })
}

function useLeads() {
  return useQuery('leads', async () => {
    const res = await axios.get(API + '/leads', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    return res.data
  })
}

function useUsers() {
  return useQuery('users', async () => {
    const res = await axios.get(API + '/users', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    return res.data
  })
}

export default function Dashboard() {
  // visible title changed to Home in nav/routes; keep component name for clarity
  const { data: tasks = [], refetch } = useTasks()
  const { data: leads = [] } = useLeads()
  const { data: users = [] } = useUsers()
  const { user } = useAuth()
  

  const [graphFilters, setGraphFilters] = useState({ status: '', priority: '', assignedTo: '', from: '', to: '' })

  const userMap = users.reduce((acc: any, u: any) => { acc[u.id] = u.name || u.email || u.id; return acc }, {})

  

  const { data: summary } = useQuery(['dashboard-summary'], async () => {
    const res = await axios.get(API + '/dashboard/summary', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    return res.data
  })

  const matchesGraphFilters = (task: any) => {
    if (graphFilters.status && task.status !== graphFilters.status) return false
    if (graphFilters.priority && task.priority !== graphFilters.priority) return false
    if (graphFilters.assignedTo && task.assignedTo !== graphFilters.assignedTo) return false
    if (graphFilters.from) {
      const from = new Date(graphFilters.from)
      if (!isNaN(from.getTime()) && (!task.dueDate || new Date(task.dueDate) < from)) return false
    }
    if (graphFilters.to) {
      const to = new Date(graphFilters.to)
      if (!isNaN(to.getTime()) && (!task.dueDate || new Date(task.dueDate) > to)) return false
    }
    return true
  }

  const dashboardTasks = (Array.isArray(tasks) ? tasks : []).filter(matchesGraphFilters)

  const statusMap = dashboardTasks.reduce((acc: any, t: any) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc }, {})
  const tasksByStatus = Object.entries(statusMap).map(([name, value]) => ({ name, value }))

  const leadsByStage = Object.entries(leads.reduce((acc: any, l: any) => { acc[l.stage] = (acc[l.stage] || 0) + 1; return acc }, {})).map(([name, value]) => ({ name, value }))

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']
  const totalTasks = dashboardTasks.length
  const totalLeads = summary?.totalLeads ?? leads.length
  const doneTasks = dashboardTasks.filter((t: any) => t.status === 'done').length
  const convertedLeads = leads.filter((l: any) => l.stage === 'converted').length
  const completionRate = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0
  const conversionRate = totalLeads ? Math.round((convertedLeads / totalLeads) * 100) : 0

  const overdueTasks = dashboardTasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length
  const inProgressTasks = dashboardTasks.filter((t: any) => t.status === 'in-progress').length
  const todoTasks = dashboardTasks.filter((t: any) => t.status === 'todo').length
  const failedTasks = dashboardTasks.filter((t: any) => t.status === 'failed').length

  // Priority breakdown
  const highPriorityTasks = dashboardTasks.filter((t: any) => t.priority === 'high').length
  const mediumPriorityTasks = dashboardTasks.filter((t: any) => t.priority === 'medium').length
  const lowPriorityTasks = dashboardTasks.filter((t: any) => t.priority === 'low').length

  // KPI Card Component
  const KPICard = ({ title, value, subtitle, icon, color, trend, trendValue }: any) => (
    <Paper 
      elevation={0}
      sx={{ 
        p: 2.5, 
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        background: `linear-gradient(135deg, ${color}08 0%, ${color}15 100%)`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 25px ${color}25`,
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: color, mb: 0.5 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              {trend === 'up' ? (
                <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
              ) : (
                <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
              )}
              <Typography variant="caption" sx={{ color: trend === 'up' ? 'success.main' : 'error.main', fontWeight: 600 }}>
                {trendValue}
              </Typography>
            </Box>
          )}
        </Box>
        <Avatar sx={{ bgcolor: `${color}20`, color: color, width: 48, height: 48 }}>
          {icon}
        </Avatar>
      </Box>
    </Paper>
  )

  // Progress Card Component
  const ProgressCard = ({ title, value, total, color }: any) => {
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0
    return (
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{value}/{total}</Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={percentage} 
          sx={{ 
            height: 8, 
            borderRadius: 4,
            bgcolor: `${color}20`,
            '& .MuiLinearProgress-bar': {
              bgcolor: color,
              borderRadius: 4,
            }
          }} 
        />
      </Box>
    )
  }

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 2 }}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            position: 'sticky', 
            top: 64, 
            zIndex: 1, 
            bgcolor: '#f8fafc', 
            py: 1,
            px: 1
          }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>Dashboard</Typography>
              <Typography variant="body2" color="text.secondary">
                Welcome back! Here's what's happening with your tasks and leads.
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => refetch()} sx={{ bgcolor: 'white', border: '1px solid', borderColor: 'divider' }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Box>
        </Grid>

        {/* KPI Cards Row */}
            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <KPICard 
                    title="Total Tasks" 
                    value={totalTasks}
                    subtitle={`${inProgressTasks} in progress`}
                    icon={<AssignmentIcon />}
                    color="#3b82f6"
                    trend="up"
                    trendValue="+12% this week"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <KPICard 
                    title="Completed" 
                    value={doneTasks}
                    subtitle={`${completionRate}% completion rate`}
                    icon={<CheckCircleIcon />}
                    color="#10b981"
                    trend="up"
                    trendValue="+8% this week"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <KPICard 
                    title="Overdue Tasks" 
                    value={overdueTasks}
                    subtitle="Needs attention"
                    icon={<WarningIcon />}
                    color="#f59e0b"
                    trend={overdueTasks > 0 ? 'down' : 'up'}
                    trendValue={overdueTasks > 0 ? 'Action required' : 'All on track'}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <KPICard 
                    title="Total Leads" 
                    value={totalLeads}
                    subtitle={`${conversionRate}% conversion`}
                    icon={<PeopleIcon />}
                    color="#8b5cf6"
                    trend="up"
                    trendValue="+15% this month"
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Charts Row */}
            <Grid item xs={12} md={8}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  borderRadius: 3, 
                  border: '1px solid', 
                  borderColor: 'divider',
                  height: '100%'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>Tasks Overview</Typography>
                    <Typography variant="body2" color="text.secondary">Task distribution by status and priority</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      variant="text" 
                      size="small" 
                      startIcon={<FilterListIcon />}
                      onClick={() => setGraphFilters({ status: '', priority: '', assignedTo: '', from: '', to: '' })}
                      sx={{ textTransform: 'none' }}
                    >
                      Reset Filters
                    </Button>
                  </Box>
                </Box>
                
                {/* Inline Filters */}
                <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      label="Status"
                      value={graphFilters.status}
                      onChange={(e) => setGraphFilters((g) => ({ ...g, status: e.target.value }))}
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="todo">To Do</MenuItem>
                      <MenuItem value="in-progress">In Progress</MenuItem>
                      <MenuItem value="done">Done</MenuItem>
                      <MenuItem value="failed">Failed</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      label="Priority"
                      value={graphFilters.priority}
                      onChange={(e) => setGraphFilters((g) => ({ ...g, priority: e.target.value }))}
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="low">Low</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Assigned To</InputLabel>
                    <Select
                      label="Assigned To"
                      value={graphFilters.assignedTo}
                      onChange={(e) => setGraphFilters((g) => ({ ...g, assignedTo: e.target.value }))}
                    >
                      <MenuItem value="">All</MenuItem>
                      {(users || []).map((u: any) => (
                        <MenuItem key={u.id} value={u.id}>{u.name || u.email}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    type="date"
                    size="small"
                    label="From"
                    InputLabelProps={{ shrink: true }}
                    value={graphFilters.from}
                    onChange={(e) => setGraphFilters((g) => ({ ...g, from: e.target.value }))}
                    sx={{ width: 140 }}
                  />
                  <TextField
                    type="date"
                    size="small"
                    label="To"
                    InputLabelProps={{ shrink: true }}
                    value={graphFilters.to}
                    onChange={(e) => setGraphFilters((g) => ({ ...g, to: e.target.value }))}
                    sx={{ width: 140 }}
                  />
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
                      Tasks by Status
                    </Typography>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie 
                          data={tasksByStatus} 
                          dataKey="value" 
                          nameKey="name" 
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80} 
                          fill="#8884d8" 
                          paddingAngle={2}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {tasksByStatus.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index % 4]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
                      Leads by Stage
                    </Typography>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={leadsByStage} layout="vertical">
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={80} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Side Panel - Quick Stats */}
            <Grid item xs={12} md={4}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  borderRadius: 3, 
                  border: '1px solid', 
                  borderColor: 'divider',
                  height: '100%'
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
                  Quick Stats
                </Typography>

                <ProgressCard title="Completed Tasks" value={doneTasks} total={totalTasks} color="#10b981" />
                <ProgressCard title="In Progress" value={inProgressTasks} total={totalTasks} color="#3b82f6" />
                <ProgressCard title="To Do" value={todoTasks} total={totalTasks} color="#f59e0b" />
                <ProgressCard title="Failed" value={failedTasks} total={totalTasks} color="#ef4444" />

                <Divider sx={{ my: 3 }} />

                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                  Priority Breakdown
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip 
                    label={`High: ${highPriorityTasks}`} 
                    size="small" 
                    sx={{ bgcolor: '#fee2e2', color: '#dc2626', fontWeight: 600 }} 
                  />
                  <Chip 
                    label={`Medium: ${mediumPriorityTasks}`} 
                    size="small" 
                    sx={{ bgcolor: '#fef3c7', color: '#d97706', fontWeight: 600 }} 
                  />
                  <Chip 
                    label={`Low: ${lowPriorityTasks}`} 
                    size="small" 
                    sx={{ bgcolor: '#dcfce7', color: '#16a34a', fontWeight: 600 }} 
                  />
                </Box>

                <Divider sx={{ my: 3 }} />

                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                  Conversion Metrics
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#8b5cf6' }}>{conversionRate}%</Typography>
                    <Typography variant="caption" color="text.secondary">Lead Conversion</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#10b981' }}>{completionRate}%</Typography>
                    <Typography variant="caption" color="text.secondary">Task Completion</Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Recent Activity / Summary Row */}
            <Grid item xs={12}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  borderRadius: 3, 
                  border: '1px solid', 
                  borderColor: 'divider'
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 2 }}>
                  Status Summary
                </Typography>
                <Grid container spacing={2}>
                  {[
                    { label: 'To Do', value: todoTasks, color: '#f59e0b', bgColor: '#fef3c7' },
                    { label: 'In Progress', value: inProgressTasks, color: '#3b82f6', bgColor: '#dbeafe' },
                    { label: 'Completed', value: doneTasks, color: '#10b981', bgColor: '#dcfce7' },
                    { label: 'Failed', value: failedTasks, color: '#ef4444', bgColor: '#fee2e2' },
                    { label: 'Overdue', value: overdueTasks, color: '#6366f1', bgColor: '#e0e7ff' },
                    { label: 'Total Leads', value: totalLeads, color: '#8b5cf6', bgColor: '#f3e8ff' },
                  ].map((item) => (
                    <Grid item xs={6} sm={4} md={2} key={item.label}>
                      <Box sx={{ 
                        textAlign: 'center', 
                        p: 2, 
                        borderRadius: 2, 
                        bgcolor: item.bgColor,
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'scale(1.02)' }
                      }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: item.color }}>{item.value}</Typography>
                        <Typography variant="caption" sx={{ color: item.color, fontWeight: 500 }}>{item.label}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
      </Grid>
    </Box>
  )
}
