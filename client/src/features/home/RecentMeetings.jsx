import React, { useState, useEffect } from 'react'
import API_BASE from '../../config'

const CONTENT_BG  = '/images/hero/content-area.svg'
const CARD_SVG    = '/images/hero/card.svg'
const CARD_ALT1   = '/images/hero/card-alt1.svg'
const CARD_ALT2   = '/images/hero/card-alt2.svg'
const BTN_GRAY    = '/images/hero/btn-gray.svg'

const CARD_VARIANTS = [CARD_ALT2, CARD_SVG, CARD_ALT1]

const RecentMeetings = () => {
  const [meetings, setMeetings] = useState([])

  useEffect(() => {
    fetch(`${API_BASE}/api/meetings/recent`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setMeetings(data.meetings)
      })
  }, [])

  return (
    <div className="ex-section">
      <img src={CONTENT_BG} alt="" className="ex-section-bg" draggable={false} />
      <div className="ex-section-content">
        <h3 className="ex-section-title">Recent Meetings</h3>
        <div className="ex-meeting-list">
          {meetings.map((meeting, i) => (
            <div key={meeting.id} className="ex-meeting-item">
              <img
                src={CARD_VARIANTS[i % CARD_VARIANTS.length]}
                alt=""
                className="ex-meeting-item-bg"
                draggable={false}
              />
              <div className="ex-meeting-info">
                <p className="ex-meeting-title">{meeting.title || 'Untitled Meeting'}</p>
                <p className="ex-meeting-date">
                  {new Date(meeting.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="ex-meeting-btn-wrapper">
                <img src={BTN_GRAY} alt="" className="ex-meeting-btn-svg" draggable={false} />
                <button
                  className="ex-meeting-btn"
                  onClick={() => { window.location.href = `/meeting/${meeting.roomCode}` }}
                >
                  Rejoin
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RecentMeetings