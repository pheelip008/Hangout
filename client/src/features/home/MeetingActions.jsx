function MeetingAction() {
    return (
        <div className="border-5 border-black bg-white px-6 py-10">
            <h3 className="mb-6 text-center text-2xl font-bold text-gray-900">Quick Actions</h3>
            <div className="flex items-center justify-center gap-6">
                <div className="flex h-40 w-60 cursor-pointer flex-col items-center justify-center rounded-lg border-5 border-dashed border-black bg-gray-200 hover:bg-gray-300">
                    <span className="text-3xl">📹</span>
                    <span className="mt-2 font-semibold">New Meeting</span>
                </div>
                <div className="flex h-40 w-60 cursor-pointer flex-col items-center justify-center rounded-lg border-5 border-dashed border-black bg-gray-200 hover:bg-gray-300">
                    <span className="text-3xl">📅</span>
                    <span className="mt-2 font-semibold">Schedule</span>
                </div>
                <div className="flex h-40 w-60 cursor-pointer flex-col items-center justify-center rounded-lg border-5 border-dashed border-black bg-gray-200 hover:bg-gray-300">
                    <span className="text-3xl">🔗</span>
                    <span className="mt-2 font-semibold">Join with Code</span>
                </div>
            </div>
        </div>
    )
}
export default MeetingAction;