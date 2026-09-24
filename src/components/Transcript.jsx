import { MessageSquareText } from "lucide-react";

export default function Transcript({ entries, interim }) {
  return (
    <section className="panel">
      <div className="panel-title"><MessageSquareText size={18} /><span>Live Transcript</span></div>
      <div className="transcript-list">
        {entries.length === 0 && !interim ? (
          <div className="empty-state">Your recognized sentences will appear here.</div>
        ) : (
          <>
            {entries.map((entry) => (
              <div className="transcript-row" key={entry.id}>
                <span className="quote">&gt;</span><span>{entry.text}</span>
              </div>
            ))}
            {interim && (
              <div className="transcript-row interim">
                <span className="quote">…</span><span>{interim}</span>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}