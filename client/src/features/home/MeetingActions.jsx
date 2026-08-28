import { useState } from 'react'
import API_BASE from '../../config'

const CONTENT_BG  = '/images/hero/content-area.svg'
const CARD_SVG    = '/images/hero/card.svg'
const CARD_ALT1   = '/images/hero/card-alt1.svg'
const CARD_ALT2   = '/images/hero/card-alt2.svg'
const INPUT_SVG   = '/images/loginandregister/emailcardtoypeemail.svg'
const BTN_DARK    = '/images/hero/btn-dark.svg'

const ICON_CAMERA = '/images/hero/camera.svg'
const ICON_CALENDAR = '/images/hero/calender.svg'
const ICON_LINK = '/images/hero/link.svg'

const ACTION_CARDS = [
  { icon: ICON_CAMERA, label: 'New Meeting', card: CARD_SVG },
  { icon: ICON_CALENDAR, label: 'Schedule',    card: CARD_ALT1 },
  { icon: ICON_LINK, label: 'Join with Code', card: CARD_ALT2 },
]

function MeetingAction() {
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [title, setTitle] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')

  async function newmeet() {
    const res = await fetch(`${API_BASE}/api/meetings/instant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
    const data = await res.json()
    if (!data.success) { alert(data.message); return }
    window.location.href = '/meeting/' + data.meeting.roomCode
  }

  async function handlejoin() {
    const code = prompt('Enter the meeting room code:')
    if (!code) return
    const res = await fetch(`${API_BASE}/api/meetings/join`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode: code }),
    })
    const data = await res.json()
    if (!data.success) { alert(data.message); return }
    window.location.href = '/meeting/' + data.meeting.roomCode
  }

  async function handleschedule() {
    const res = await fetch(`${API_BASE}/api/meetings/schedule`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, scheduledAt }),
    })
    const data = await res.json()
    if (!data.success) { alert(data.message); return }
    alert('Meeting scheduled successfully')
    setShowScheduleForm(false)
    setTitle('')
    setScheduledAt('')
  }

  const handlers = [newmeet, () => setShowScheduleForm(true), handlejoin]

  return (
    <div className="ex-section">
      <img src={CONTENT_BG} alt="" className="ex-section-bg" draggable={false} />
      <div className="ex-section-content">
        <h3 className="ex-section-title">Quick Actions</h3>

        <div className="ex-actions-grid">
          {ACTION_CARDS.map((item, i) => (
            <div key={i} className="ex-action-card" onClick={handlers[i]}>
              <img src={item.card} alt="" className="ex-action-card-bg" draggable={false} />
              <img src={item.icon} alt="" className="ex-action-card-icon" draggable={false} />
              <span className="ex-action-card-label">{item.label}</span>
            </div>
          ))}
        </div>

        {showScheduleForm && (
          <div className="ex-schedule-form">
            <div className="ex-schedule-input-wrapper">
              <img src={INPUT_SVG} alt="" className="ex-schedule-input-svg" draggable={false} />
              <input
                className="ex-schedule-input"
                type="text"
                placeholder="Meeting title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="ex-schedule-input-wrapper">
              <img src={INPUT_SVG} alt="" className="ex-schedule-input-svg" draggable={false} />
              <input
                className="ex-schedule-input"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div className="ex-schedule-btn-wrapper">
              <img src={BTN_DARK} alt="" className="ex-schedule-btn-svg" draggable={false} />
              <button className="ex-schedule-btn" onClick={handleschedule}>
                Confirm Schedule
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MeetingAction