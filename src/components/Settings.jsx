import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { validateWebsiteUrl } from "../services/websiteRegistry";

export default function Settings({ settings, onChange, onClose }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [siteError, setSiteError] = useState("");

  function update(patch) { onChange({ ...settings, ...patch }); }

  function addWebsite(e) {
    e.preventDefault();
    const cleanName = name.trim().toLowerCase();
    const check = validateWebsiteUrl(url.trim());
    if (!cleanName) return setSiteError("Enter a website name.");
    if (!check.valid) return setSiteError(check.message);
    update({ ...settings, websites: { ...settings.websites, [cleanName]: check.url } });
    setName(""); setUrl(""); setSiteError("");
  }

  function removeWebsite(key) {
    const next = { ...settings.websites };
    delete next[key];
    update({ ...settings, websites: next });
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <aside className="settings-panel" onMouseDown={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <div><h2>Settings</h2><p>Customize how VoiceSearch behaves.</p></div>
          <button className="icon-button" onClick={onClose}><X size={20} /></button>
        </div>

        <label>Search engine
          <select value={settings.engine} onChange={(e) => update({ engine: e.target.value })}>
            <option value="google">Google</option><option value="bing">Bing</option><option value="duckduckgo">DuckDuckGo</option>
          </select>
        </label>

        <label>Default action
          <select value={settings.defaultAction} onChange={(e) => update({ defaultAction: e.target.value })}>
            <option value="search">Search web</option><option value="confirm">Ask for confirmation</option><option value="ignore">Ignore unknown commands</option>
          </select>
        </label>

        <label>Duplicate suppression
          <select value={settings.duplicateWindow} onChange={(e) => update({ duplicateWindow: Number(e.target.value) })}>
            <option value="1000">1 second</option><option value="3000">3 seconds</option><option value="5000">5 seconds</option><option value="10000">10 seconds</option>
          </select>
        </label>

        <div className="custom-sites">
          <h3>Custom websites</h3><p className="muted">Say “open [name]” after adding a site.</p>
          <form onSubmit={addWebsite} className="site-form">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name e.g. MDN" />
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://developer.mozilla.org" />
            <button className="secondary-button" type="submit"><Plus size={16} /> Add</button>
          </form>
          {siteError && <div className="form-error">{siteError}</div>}
          <div className="site-list">
            {Object.entries(settings.websites).length === 0 && <span className="muted">No custom websites.</span>}
            {Object.entries(settings.websites).map(([key, value]) => (
              <div className="site-item" key={key}>
                <div><strong>{key}</strong><span>{value}</span></div>
                <button className="danger-icon" onClick={() => removeWebsite(key)}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="privacy-box"><strong>Privacy</strong><p>Microphone access starts only after you activate listening. This app does not upload or store raw microphone audio. Recognized text stays in this page unless you clear it.</p></div>
      </aside>
    </div>
  );
}