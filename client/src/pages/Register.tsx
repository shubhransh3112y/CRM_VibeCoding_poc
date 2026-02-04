import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { 
  TextField, Button, Box, Typography, Paper, InputAdornment, IconButton,
  CircularProgress, Alert, Divider 
} from '@mui/material'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import axios from 'axios'
import PersonIcon from '@mui/icons-material/Person'
import EmailIcon from '@mui/icons-material/Email'
import LockIcon from '@mui/icons-material/Lock'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import HowToRegIcon from '@mui/icons-material/HowToReg'

const API = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

const schema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Please enter a valid email').required('Email is required'),
  password: yup.string().required('Password is required').min(6, 'Password must be at least 6 characters')
}).required()

export default function Register() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: yupResolver(schema) })

  const onSubmit = async (data: any) => {
    try {
      setError('')
      await axios.post(API + '/auth/register', data)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed. Please try again.')
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      p: 3,
    }}>
      <Paper 
        sx={{ 
          p: 0, 
          maxWidth: 480, 
          width: '100%', 
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }} 
        elevation={0}
      >
        {/* Header Section */}
        <Box sx={{ 
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          p: 4,
          textAlign: 'center'
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 1.5,
            mb: 2
          }}>
            <Box sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <img src="/logo.png" alt="App logo" style={{ height: 32, width: 32, objectFit: 'contain' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }}>
              CRM Pro
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Create your account to get started
          </Typography>
        </Box>

        {/* Form Section */}
        <Box sx={{ p: 4 }}>
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 3, borderRadius: 2 }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}

          {success && (
            <Alert 
              severity="success" 
              sx={{ mb: 3, borderRadius: 2 }}
            >
              Registration successful! Redirecting to login...
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField 
                fullWidth 
                label="First Name" 
                margin="normal" 
                {...register('firstName')} 
                helperText={errors.firstName?.message as string} 
                error={!!errors.firstName}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: '#667eea' },
                    '&.Mui-focused fieldset': { borderColor: '#667eea' }
                  }
                }}
              />
              <TextField 
                fullWidth 
                label="Last Name" 
                margin="normal" 
                {...register('lastName')} 
                helperText={errors.lastName?.message as string} 
                error={!!errors.lastName}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: '#667eea' },
                    '&.Mui-focused fieldset': { borderColor: '#667eea' }
                  }
                }}
              />
            </Box>
            <TextField 
              fullWidth 
              label="Email Address" 
              margin="normal" 
              {...register('email')} 
              helperText={errors.email?.message as string} 
              error={!!errors.email}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': { borderColor: '#667eea' },
                  '&.Mui-focused fieldset': { borderColor: '#667eea' }
                }
              }}
            />
            <TextField 
              fullWidth 
              label="Password" 
              type={showPassword ? 'text' : 'password'}
              margin="normal" 
              {...register('password')} 
              helperText={errors.password?.message as string || 'Password must be at least 6 characters'} 
              error={!!errors.password}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': { borderColor: '#667eea' },
                  '&.Mui-focused fieldset': { borderColor: '#667eea' }
                }
              }}
            />

            <Button 
              type="submit" 
              variant="contained" 
              fullWidth
              size="large"
              disabled={isSubmitting || success}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <HowToRegIcon />}
              sx={{ 
                mt: 3,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
                },
                '&:disabled': {
                  background: '#e2e8f0',
                }
              }}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?
            </Typography>
          </Divider>

          <Button
            component={Link}
            to="/login"
            variant="outlined"
            fullWidth
            size="large"
            sx={{
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              borderColor: '#e2e8f0',
              color: '#475569',
              '&:hover': {
                borderColor: '#667eea',
                bgcolor: 'rgba(102, 126, 234, 0.04)'
              }
            }}
          >
            Sign In Instead
          </Button>
        </Box>

        {/* Footer */}
        <Box sx={{ px: 4, pb: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            By creating an account, you agree to our{' '}
            <Box component="span" sx={{ color: '#667eea', cursor: 'pointer' }}>Terms of Service</Box>
            {' '}and{' '}
            <Box component="span" sx={{ color: '#667eea', cursor: 'pointer' }}>Privacy Policy</Box>
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}
