import { Mic, MicOff, LoaderCircle, Volume2, AlertTriangle, RefreshCw } from "lucide-react";

const config = {
  stopped: { icon: MicOff, text: "Stopped", className: "status-stopped" },
  starting: { icon: LoaderCircle, text: "Starting", className: "status-starting" },
  listening: { icon: Mic, text: "Listening", className: "status-listening" },
  processing: { icon: LoaderCircle, text: "Processing", className: "status-starting" },
  speaking: { icon: Volume2, text: "Speaking", className: "status-listening" },
  reconnecting: { icon: RefreshCw, text: "Reconnecting", className: "status-starting" },
  permission: { icon: AlertTriangle, text: "Microphone Permission", className: "status-error" },
  error: { icon: AlertTriangle, text: "Error", className: "status-error" },
};

export default function StatusIndicator({ status }) {
  const item = config[status] || config.stopped;
  const Icon = item.icon;
  return (
    <div className={`status-pill ${item.className}`}>
      <Icon size={16} className={status === "starting" || status === "processing" || status === "reconnecting" ? "spin" : ""} />
      <span>{item.text}</span>
    </div>
  );
}
