function ParticipantPanel({ localName, remoteName, remoteConnected }) {
    return (
        <>
            <div className="flex flex-col p-4 w-full h-full items-start bg-gray-900 border-l border-gray-800 text-white">
                <h2 className="text-lg font-bold mb-6 border-b border-gray-700 w-full pb-3 text-[#00FFFF] tracking-wide">
                    Participants ({(remoteConnected ? 2 : 1)})
                </h2>
                <ul className="w-full space-y-3">
                    <li className="flex items-center gap-4 p-3 bg-gray-800 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors shadow-md">
                        <div className="w-10 h-10 rounded-full bg-[#00FFFF]/10 text-[#00FFFF] border border-[#00FFFF]/30 flex items-center justify-center font-bold">
                            {localName ? localName.charAt(0).toUpperCase() : 'Y'}
                        </div>
                        <span className="font-semibold text-gray-200">{localName || "You"} (You)</span>
                    </li>
                    {remoteConnected && (
                        <li className="flex items-center gap-4 p-3 bg-gray-800 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors shadow-md">
                            <div className="w-10 h-10 rounded-full bg-[#ff0]/10 text-[#ff0] border border-[#ff0]/30 flex items-center justify-center font-bold">
                                {remoteName ? remoteName.charAt(0).toUpperCase() : 'R'}
                            </div>
                            <span className="font-semibold text-gray-200">{remoteName || "Remote User"}</span>
                        </li>
                    )}
                </ul>
            </div>
        </>
    )
}

export default ParticipantPanel;