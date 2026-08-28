function ParticipantPanel({ localName, participants }) {
    const remoteParticipants = Object.values(participants || {});
    const totalCount = 1 + remoteParticipants.length;

    return (
        <>
            <img src="/images/hero/content-area.svg" className="ex-participant-panel-bg" alt="" />
            <h2 className="ex-participant-title">
                Participants ({totalCount})
            </h2>
            <ul className="ex-participant-list w-full">
                <li className="ex-participant-item">
                    <img src="/images/hero/card-alt1.svg" className="ex-participant-item-bg" alt="" />
                    <div className="ex-participant-avatar">
                        {localName ? localName.charAt(0).toUpperCase() : 'Y'}
                    </div>
                    <span className="ex-participant-name" title={localName || "You"}>{localName || "You"} (You)</span>
                </li>
                {remoteParticipants.map((p, i) => {
                    const name = p.name || "Remote User";
                    return (
                        <li key={p.id} className="ex-participant-item">
                            <img src={i % 2 === 0 ? "/images/hero/card-alt2.svg" : "/images/hero/card-alt1.svg"} className="ex-participant-item-bg" alt="" />
                            <div className="ex-participant-avatar">
                                {name.charAt(0).toUpperCase()}
                            </div>
                            <span className="ex-participant-name" title={name}>{name}</span>
                        </li>
                    );
                })}
            </ul>
        </>
    )
}

export default ParticipantPanel;