import React, { useState, useEffect } from 'react'
import { Box, Typography, Button, Paper, Container, IconButton } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useNavigate } from 'react-router-dom'

const carouselSlides = [
  {
    image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1920&h=600&fit=crop',
    title: 'Streamline Your Customer Relationships',
    subtitle: 'Powerful CRM solution for modern businesses'
  },
  {
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1920&h=600&fit=crop',
    title: 'Track Leads & Close Deals Faster',
    subtitle: 'Convert prospects into loyal customers'
  },
  {
    image: 'https://images.unsplash.com/photo-1553028826-f4804a6dba3b?w=1920&h=600&fit=crop',
    title: 'Collaborate With Your Team',
    subtitle: 'Stay connected and achieve more together'
  },
  {
    image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1920&h=600&fit=crop',
    title: 'Data-Driven Insights',
    subtitle: 'Make informed decisions with powerful analytics'
  }
]

const partnerLogos = [
  { name: 'Tech Corp', logo: 'https://via.placeholder.com/120x60?text=TechCorp' },
  { name: 'Innovate Inc', logo: 'https://via.placeholder.com/120x60?text=Innovate' },
  { name: 'Global Solutions', logo: 'https://via.placeholder.com/120x60?text=Global' },
  { name: 'Digital Plus', logo: 'https://via.placeholder.com/120x60?text=Digital+' },
  { name: 'Smart Systems', logo: 'https://via.placeholder.com/120x60?text=Smart' },
  { name: 'Cloud Nine', logo: 'https://via.placeholder.com/120x60?text=CloudNine' },
]

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const navigate = useNavigate()

  // Auto-slide every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const goToPrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length)
  }

  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselSlides.length)
  }

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Hero Carousel Section */}
      <Box sx={{ position: 'relative', width: '100%', height: { xs: 300, sm: 400, md: 500 }, overflow: 'hidden' }}>
        {carouselSlides.map((slide, index) => (
          <Box
            key={index}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: currentSlide === index ? 1 : 0,
              transition: 'opacity 0.8s ease-in-out',
              backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.5)), url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              color: 'white',
              textAlign: 'center',
              px: 2
            }}
          >
            <Typography
              variant="h2"
              sx={{
                fontWeight: 700,
                mb: 2,
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3.5rem' }
              }}
            >
              {slide.title}
            </Typography>
            <Typography
              variant="h5"
              sx={{
                mb: 4,
                textShadow: '1px 1px 3px rgba(0,0,0,0.5)',
                fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' }
              }}
            >
              {slide.subtitle}
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/dashboard')}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                borderRadius: 2,
                bgcolor: 'primary.main',
                '&:hover': { bgcolor: 'primary.dark' }
              }}
            >
              Get Started
            </Button>
          </Box>
        ))}

        {/* Navigation Arrows */}
        <IconButton
          onClick={goToPrevSlide}
          sx={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            bgcolor: 'rgba(255,255,255,0.8)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.95)' },
            zIndex: 2
          }}
        >
          <ChevronLeftIcon fontSize="large" />
        </IconButton>
        <IconButton
          onClick={goToNextSlide}
          sx={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            bgcolor: 'rgba(255,255,255,0.8)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.95)' },
            zIndex: 2
          }}
        >
          <ChevronRightIcon fontSize="large" />
        </IconButton>

        {/* Slide Indicators */}
        <Box sx={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 1, zIndex: 2 }}>
          {carouselSlides.map((_, index) => (
            <Box
              key={index}
              onClick={() => setCurrentSlide(index)}
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: currentSlide === index ? 'white' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                transition: 'background-color 0.3s'
              }}
            />
          ))}
        </Box>
      </Box>

      {/* About Section */}
      <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: '#f8f9fa' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 6, alignItems: 'center' }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 600, letterSpacing: 2 }}>
                ABOUT US
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 3, fontSize: { xs: '1.75rem', md: '2.5rem' } }}>
                Your Complete CRM Solution
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.8, fontSize: '1.1rem' }}>
                Our CRM platform is designed to help businesses of all sizes manage customer relationships effectively. 
                From lead tracking to task management, we provide all the tools you need to grow your business and 
                build lasting customer relationships.
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, lineHeight: 1.8, fontSize: '1.1rem' }}>
                With powerful analytics, team collaboration features, and an intuitive interface, 
                our CRM empowers your team to work smarter, not harder. Join thousands of businesses 
                that trust our platform to drive their success.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/dashboard')}
                sx={{ px: 4, py: 1.5, borderRadius: 2 }}
              >
                Read More
              </Button>
            </Box>
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <Box
                component="img"
                src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=400&fit=crop"
                alt="Team collaboration"
                sx={{
                  width: '100%',
                  maxWidth: 500,
                  height: 'auto',
                  borderRadius: 3,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
                }}
              />
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: 'white' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 600, letterSpacing: 2 }}>
              WHY CHOOSE US
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, fontSize: { xs: '1.75rem', md: '2.5rem' } }}>
              Key Features
            </Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 4 }}>
            {[
              { icon: '📊', title: 'Analytics Dashboard', desc: 'Get real-time insights into your sales pipeline and team performance' },
              { icon: '👥', title: 'Lead Management', desc: 'Track and nurture leads through every stage of the sales funnel' },
              { icon: '✅', title: 'Task Tracking', desc: 'Assign, manage, and monitor tasks across your entire team' },
              { icon: '🤝', title: 'Team Collaboration', desc: 'Work together seamlessly with built-in collaboration tools' },
              { icon: '📧', title: 'Notifications', desc: 'Stay updated with real-time alerts and task reminders' },
              { icon: '🔒', title: 'Secure & Reliable', desc: 'Enterprise-grade security to protect your valuable data' }
            ].map((feature, idx) => (
              <Paper
                key={idx}
                elevation={0}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  borderRadius: 3,
                  border: '1px solid #e0e0e0',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    transform: 'translateY(-4px)'
                  }
                }}
              >
                <Typography sx={{ fontSize: '3rem', mb: 2 }}>{feature.icon}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>{feature.title}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>{feature.desc}</Typography>
              </Paper>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Leads Captured / Partners Section */}
      <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: '#1a237e', color: 'white' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: 2 }}>
              TRUSTED BY
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, fontSize: { xs: '1.75rem', md: '2.5rem' } }}>
              Our Clients & Partners
            </Typography>
            <Typography variant="body1" sx={{ mt: 2, color: 'rgba(255,255,255,0.8)', maxWidth: 600, mx: 'auto' }}>
              Join the growing list of businesses that trust our CRM platform to manage their customer relationships
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' },
              gap: 3
            }}
          >
            {partnerLogos.map((partner, idx) => (
              <Paper
                key={idx}
                elevation={0}
                sx={{
                  p: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'white',
                  borderRadius: 2,
                  minHeight: 80,
                  transition: 'transform 0.3s ease',
                  '&:hover': { transform: 'scale(1.05)' }
                }}
              >
                <Box
                  component="img"
                  src={partner.logo}
                  alt={partner.name}
                  sx={{ maxWidth: '100%', maxHeight: 50, objectFit: 'contain' }}
                />
              </Paper>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Call to Action */}
      <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: 'primary.main', color: 'white', textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1.5rem', md: '2rem' } }}>
            Ready to Transform Your Business?
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, color: 'rgba(255,255,255,0.9)' }}>
            Start using our CRM platform today and experience the difference
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/dashboard')}
            sx={{
              px: 5,
              py: 1.5,
              fontSize: '1.1rem',
              borderRadius: 2,
              bgcolor: 'white',
              color: 'primary.main',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
            }}
          >
            Go to Dashboard
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ py: 4, bgcolor: '#263238', color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
        <Container>
          <Typography variant="body2">
            © {new Date().getFullYear()} CRM POC. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  )
}
