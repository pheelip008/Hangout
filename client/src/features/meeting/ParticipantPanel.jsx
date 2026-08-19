function ParticipantPanel({ localName, participants }) {
    const remoteParticipants = Object.values(participants || {});
    const totalCount = 1 + remoteParticipants.length;

    return (
        <>
            <div className="flex flex-col p-4 w-full h-full items-start bg-gray-900 border-l border-gray-800 text-white">
                <h2 className="text-lg font-bold mb-6 border-b border-gray-700 w-full pb-3 text-[#00FFFF] tracking-wide">
                    Participants ({totalCount})
                </h2>
                <ul className="w-full space-y-3">
                    <li className="flex items-center gap-4 p-3 bg-gray-800 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors shadow-md">
                        <div className="w-10 h-10 rounded-full bg-[#00FFFF]/10 text-[#00FFFF] border border-[#00FFFF]/30 flex items-center justify-center font-bold shrink-0">
                            {localName ? localName.charAt(0).toUpperCase() : 'Y'}
                        </div>
                        <span className="font-semibold text-gray-200 truncate" title={localName || "You"}>{localName || "You"} (You)</span>
                    </li>
                    {remoteParticipants.map((p) => {
                        const name = p.name || "Remote User";
                        return (
                            <li key={p.id} className="flex items-center gap-4 p-3 bg-gray-800 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors shadow-md">
                                <div className="w-10 h-10 rounded-full bg-[#ff0]/10 text-[#ff0] border border-[#ff0]/30 flex items-center justify-center font-bold shrink-0">
                                    {name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-semibold text-gray-200 truncate" title={name}>{name}</span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </>
    )
}

export default ParticipantPanel;