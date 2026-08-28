import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import API_BASE from '../../config'

const CONTENT_BG = '/images/hero/content-area.svg'
const BTN_DARK   = '/images/hero/btn-dark.svg'
const BTN_GRAY   = '/images/hero/btn-gray.svg'
const CARD_SVG   = '/images/hero/card.svg'

const IMAGES = [
  '/readmeimages/1.png',
  '/readmeimages/2.png',
  '/readmeimages/3.png',
  '/readmeimages/4.png',
]
const EXTENDED_IMAGES = [...IMAGES, ...IMAGES, ...IMAGES]

function Herosection() {
  const navigate = useNavigate()
  const [slideIndex, setSlideIndex] = useState(IMAGES.length)
  const [isTransitioning, setIsTransitioning] = useState(true)
  const intervalRef = useRef(null)

  const nextSlide = useCallback(() => {
    setIsTransitioning(true)
    setSlideIndex(i => i + 1)
  }, [])

  const prevSlide = useCallback(() => {
    setIsTransitioning(true)
    setSlideIndex(i => i - 1)
  }, [])

  // Auto-scroll every 3 seconds
  useEffect(() => {
    intervalRef.current = setInterval(nextSlide, 3000)
    return () => clearInterval(intervalRef.current)
  }, [nextSlide])

  // Handle snap back for infinite scroll
  useEffect(() => {
    if (slideIndex >= IMAGES.length * 2) {
      const timer = setTimeout(() => {
        setIsTransitioning(false)
        setSlideIndex(slideIndex - IMAGES.length)
      }, 500)
      return () => clearTimeout(timer)
    }
    if (slideIndex <= 0) {
      const timer = setTimeout(() => {
        setIsTransitioning(false)
        setSlideIndex(slideIndex + IMAGES.length)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [slideIndex])

  // Reset auto-scroll on manual interaction
  function handleManual(fn) {
    clearInterval(intervalRef.current)
    fn()
    intervalRef.current = setInterval(nextSlide, 3000)
  }

  async function handleStart() {
    if (window.location.pathname === '/') {
      navigate('/home')
      return
    }
    try {
      const res = await fetch(`${API_BASE}/api/meetings/instant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      const data = await res.json()
      if (!data.success) { alert(data.message); return }
      window.location.href = '/meeting/' + data.meeting.roomCode
    } catch (err) { console.error(err) }
  }

  async function handleJoin() {
    if (window.location.pathname === '/') {
      navigate('/home')
      return
    }
    const code = prompt('Enter the meeting room code:')
    if (!code) return
    try {
      const res = await fetch(`${API_BASE}/api/meetings/join`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: code }),
      })
      const data = await res.json()
      if (!data.success) { alert(data.message); return }
      window.location.href = '/meeting/' + data.meeting.roomCode
    } catch (err) { console.error(err) }
  }

  return (
    <div className="ex-hero">
      <img src={CONTENT_BG} alt="" className="ex-hero-bg" draggable={false} />

      <div className="ex-hero-content">
        <h2 className="ex-hero-title">Meets made immersive!</h2>
        <p className="ex-hero-subtitle">
          Hangout with your friends in the playground — watch movies, have chats,
          while looking at one another and moving too! Or have an official meet if you want.
        </p>

        <div className="ex-hero-buttons">
          <div className="ex-hero-btn-wrapper">
            <img src={BTN_DARK} alt="" className="ex-hero-btn-svg" draggable={false} />
            <button className="ex-hero-btn" onClick={handleStart}>Start meeting</button>
          </div>
          <div className="ex-hero-btn-wrapper">
            <img src={BTN_GRAY} alt="" className="ex-hero-btn-svg" draggable={false} />
            <button className="ex-hero-btn" onClick={handleJoin}>Join Meet</button>
          </div>
        </div>

        {/* Image Carousel */}
        <div className="ex-carousel">
          <button
            className="ex-carousel-arrow ex-carousel-arrow-left"
            onClick={() => handleManual(prevSlide)}
          >‹</button>
          <button
            className="ex-carousel-arrow ex-carousel-arrow-right"
            onClick={() => handleManual(nextSlide)}
          >›</button>

          <div
            className="ex-carousel-track"
            style={{ 
              transform: `translateX(calc(-${slideIndex} * (50% + 12px)))`,
              transition: isTransitioning ? 'transform 0.5s ease' : 'none'
            }}
          >
            {EXTENDED_IMAGES.map((src, i) => (
              <div key={i} className="ex-carousel-slide">
                <img src={CARD_SVG} alt="" className="ex-carousel-card-bg" draggable={false} />
                <img src={src} alt={`Screenshot ${i + 1}`} className="ex-carousel-img" />
              </div>
            ))}
          </div>

          <div className="ex-carousel-dots">
            {IMAGES.map((_, i) => (
              <button
                key={i}
                className={`ex-carousel-dot ${i === (slideIndex % IMAGES.length) ? 'active' : ''}`}
                onClick={() => handleManual(() => {
                  setIsTransitioning(true)
                  setSlideIndex(IMAGES.length + i)
                })}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Herosection