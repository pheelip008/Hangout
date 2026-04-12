function Herosection() {
    return (
        <div className="flex flex-col items-center justify-center border-5 border-black bg-gray-100 py-20 px-6 text-center">
            <h2 className="text-4xl font-bold text-gray-900">Video Calls Made Simple</h2>
            <p className="mt-4 text-lg text-gray-600">Connect with anyone, anywhere. Start or join a meeting in seconds.</p>
            <div className="mt-8 flex gap-4">
                <button className="cursor-pointer rounded-lg border-2 border-blue-900 bg-blue-900 px-6 py-3 text-white hover:bg-blue-800 active:bg-blue-950">
                    Start a Meeting
                </button>
                <button className="cursor-pointer rounded-lg border-2 border-blue-900 bg-transparent px-6 py-3 text-blue-900 hover:bg-blue-100 active:bg-blue-200">
                    Join a Meeting
                </button>
            </div>
        </div>
    )
}
export default Herosection;