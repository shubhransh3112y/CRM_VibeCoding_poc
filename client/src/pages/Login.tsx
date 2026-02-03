import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { TextField, Button, Box, Typography, Paper } from '@mui/material'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useAuth } from '../context/AuthContext'

const schema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().required()
}).required()

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: yupResolver(schema) })

  const onSubmit = async (data: any) => {
    try {
      await login(data.email, data.password)
      navigate('/dashboard')
    } catch (err) {
      alert('Login failed')
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundImage: 'url(/login.jpeg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      p: 3,
    }}>
      <Paper sx={{ p: 4, maxWidth: 480, width: '100%', bgcolor: 'rgba(255,255,255,0.95)', boxShadow: 6 }} elevation={6} aria-labelledby="login-title">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <img src="/logo.png" alt="App logo" style={{ height: 36 }} />
          <Typography id="login-title" variant="h5">Sign in to your account</Typography>
        </Box>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <TextField fullWidth label="Email" margin="normal" {...register('email')} helperText={errors.email?.message as string} error={!!errors.email} inputProps={{ 'aria-label': 'email' }} />
          <TextField fullWidth label="Password" type="password" margin="normal" {...register('password')} helperText={errors.password?.message as string} error={!!errors.password} inputProps={{ 'aria-label': 'password' }} />
          <Button type="submit" variant="contained" sx={{ mt: 2, width: '100%' }} disabled={isSubmitting} aria-label="Sign in">Sign in</Button>
        </Box>
      </Paper>
    </Box>
  )
}
