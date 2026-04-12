function MeetingHeader(){
    return(
        <header className="flex items-center justify-between border-5 border-black bg-blue-900 px-10 py-4">
            <div>
                <h1 className="text-x1 font-semibold text-white">
                    Hangout!
                </h1>
                <p className="text-sm text-gray-400">
                    Code: HGT-123-XTZ
                </p>
            </div>
            <div className="text-sm text-gray-300">
                00:00:00 
            </div>
        </header>
    )
}

export default MeetingHeader;