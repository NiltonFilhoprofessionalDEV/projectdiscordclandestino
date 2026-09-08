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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-abyss/85 p-4 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="device-settings-title"
        className="surface-raised w-full max-w-md rounded-[1.6rem] p-6"
      >
        <h2 id="device-settings-title" className="font-display text-xl text-cloud">
          Dispositivos
        </h2>
        <p className="mt-1 text-sm text-haze">Escolha como você quer ouvir e falar.</p>
        <label className="mt-6 block text-sm font-medium text-haze">Microfone</label>
        <select
          className="mt-2 h-11 w-full rounded-xl border border-haze/15 bg-abyss px-3 text-cloud outline-none focus:border-electric/70 focus:ring-2 focus:ring-electric/25"
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
            <label className="mt-5 block text-sm font-medium text-haze">Saída de áudio</label>
            <select
              className="mt-2 h-11 w-full rounded-xl border border-haze/15 bg-abyss px-3 text-cloud outline-none focus:border-electric/70 focus:ring-2 focus:ring-electric/25"
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
          <p className="mt-5 text-sm text-haze">
            Este navegador não permite escolher a saída de áudio.
          </p>
        )}
        <Button type="button" variant="ghost" className="mt-6 w-full" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </div>
  );
}
