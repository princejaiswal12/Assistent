import { ExternalLink, History } from "lucide-react";

export default function ActionHistory({ actions }) {
  return (
    <section className="panel">
      <div className="panel-title"><History size={18} /><span>Action History</span></div>
      <div className="table-wrap">
        {actions.length === 0 ? (
          <div className="empty-state">No actions yet.</div>
        ) : (
          <table>
            <thead><tr><th>Action</th><th>Query</th><th>Status</th></tr></thead>
            <tbody>
              {actions.map((action) => (
                <tr key={action.id}>
                  <td><span className="action-tag">{action.type}</span></td>
                  <td title={action.query}>{action.query || "—"}</td>
                  <td>
                    <span className={action.success ? "success" : "failed"}>
                      {action.success ? <><ExternalLink size={13} /> Opened</> : "Blocked / failed"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}