import { Mic, MicOff, LoaderCircle, Volume2, AlertTriangle } from "lucide-react";

const config = {
  stopped: { icon: MicOff, text: "Stopped", className: "status-stopped" },
  starting: { icon: LoaderCircle, text: "Starting", className: "status-starting" },
  listening: { icon: Mic, text: "Listening", className: "status-listening" },
  speaking: { icon: Volume2, text: "Speaking", className: "status-listening" },
  permission: { icon: AlertTriangle, text: "Permission denied", className: "status-error" },
  error: { icon: AlertTriangle, text: "Error", className: "status-error" },
};

export default function StatusIndicator({ status }) {
  const item = config[status] || config.stopped;
  const Icon = item.icon;
  return <div className={`status-pill ${item.className}`}><Icon size={16} className={status === "starting" ? "spin" : ""} /><span>{item.text}</span></div>;
}