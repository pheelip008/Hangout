import React from 'react'

const RecentMeetings = () => {
  return (
    <div className="border-5 border-black bg-gray-50 px-6 py-10">
      <h3 className="mb-6 text-center text-2xl font-bold text-gray-900">Recent Meetings</h3>
      <div className="flex flex-col gap-4">

        <div className="flex items-center justify-between rounded-lg border-2 border-black bg-white px-6 py-4">
          <div>
            <p className="font-semibold text-gray-900">Team Standup</p>
            <p className="text-sm text-gray-500">July 16, 2026 · 30 min</p>
          </div>
          <button className="cursor-pointer rounded-lg border-2 border-blue-900 bg-blue-900 px-4 py-2 text-white hover:bg-blue-800">Rejoin</button>
        </div>

        <div className="flex items-center justify-between rounded-lg border-2 border-black bg-white px-6 py-4">
          <div>
            <p className="font-semibold text-gray-900">Project Review</p>
            <p className="text-sm text-gray-500">July 15, 2026 · 1 hr</p>
          </div>
          <button className="cursor-pointer rounded-lg border-2 border-blue-900 bg-blue-900 px-4 py-2 text-white hover:bg-blue-800">Rejoin</button>
        </div>

        <div className="flex items-center justify-between rounded-lg border-2 border-black bg-white px-6 py-4">
          <div>
            <p className="font-semibold text-gray-900">Design Sync</p>
            <p className="text-sm text-gray-500">July 14, 2026 · 45 min</p>
          </div>
          <button className="cursor-pointer rounded-lg border-2 border-blue-900 bg-blue-900 px-4 py-2 text-white hover:bg-blue-800">Rejoin</button>
        </div>

      </div>
    </div>
  )
}

export default RecentMeetings