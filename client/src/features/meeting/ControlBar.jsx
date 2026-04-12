function ControlBar() {
    return (
    <>
        <div className="p-3 border-5 border-black bg-gray-400 w-full">
            <div className="flex items-center justify-center gap-2">
                <button className="cursor-pointer rounded-lg border-2 border-black bg-gray-200 px-4 py-2 hover:bg-gray-300 active:bg-gray-500">Audio</button>
                <button className="cursor-pointer rounded-lg border-2 border-black bg-gray-200 px-4 py-2 hover:bg-gray-300 active:bg-gray-500">Video</button>
                <button className="cursor-pointer rounded-lg border-2 border-black bg-gray-200 px-4 py-2 hover:bg-gray-300 active:bg-gray-500">Screen Share</button>
                <button className="cursor-pointer rounded-lg border-2 border-black bg-gray-200 px-4 py-2 hover:bg-gray-300 active:bg-gray-500">Raise Hand</button>
                <button className="cursor-pointer rounded-lg border-2 border-black bg-gray-200 px-4 py-2 hover:bg-gray-300 active:bg-gray-500">Chat</button>
                <button className="cursor-pointer rounded-lg border-2 border-black bg-gray-200 px-4 py-2 hover:bg-gray-300 active:bg-gray-500">Settings</button>
                <button className="cursor-pointer rounded-lg border-2 border-red-700 bg-red-500 px-4 py-2 text-white hover:bg-red-600 active:bg-red-800">Leave</button>
            </div>
        </div>
    </>
    )
}
export default ControlBar;