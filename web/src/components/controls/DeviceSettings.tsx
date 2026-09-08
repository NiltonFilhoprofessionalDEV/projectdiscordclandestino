import { useEffect, useState } from "react";
import type { Room } from "livekit-client";
import { Button } from "../ui/button.tsx";

type DeviceSettingsProps = {
  room: Room;
  onClose: () => void;
};

export function DeviceSettings({ room, onClose }: DeviceSettingsProps) {
  const [inputs, setInputs] = useState<MediaDeviceInfo[]>([]);
  const [outputs, setOutputs] = useState<MediaDeviceInfo[]>([]);
  const supportsSink =
    typeof HTMLMediaElement !== "undefined" && "setSinkId" in HTMLMediaElement.prototype;

  useEffect(() => {
    void navigator.mediaDevices.enumerateDevices().then((devices) => {
      setInputs(devices.filter((device) => device.kind === "audioinput"));
      setOutputs(devices.filter((device) => device.kind === "audiooutput"));
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-panel p-6">
        <h2 className="font-display text-xl text-fog">Dispositivos</h2>
        <label className="mt-4 block text-sm text-mist">Microfone</label>
        <select
          className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-void px-3 text-fog"
          onChange={(event) => {
            void room.switchActiveDevice("audioinput", event.target.value);
          }}
        >
          {inputs.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || "Microfone"}
            </option>
          ))}
        </select>
        {supportsSink ? (
          <>
            <label className="mt-4 block text-sm text-mist">Saída de áudio</label>
            <select
              className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-void px-3 text-fog"
              onChange={(event) => {
                void room.switchActiveDevice("audiooutput", event.target.value);
              }}
            >
              {outputs.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || "Alto-falante"}
                </option>
              ))}
            </select>
          </>
        ) : (
          <p className="mt-4 text-sm text-mist">
            Este navegador não permite escolher a saída de áudio.
          </p>
        )}
        <Button type="button" variant="solid" className="mt-6 w-full" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </div>
  );
}
