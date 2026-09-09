import { useEffect, useState } from "react";
import type { Room } from "livekit-client";
import { Button } from "../ui/button.tsx";
import { Select } from "../ui/select.tsx";

type DeviceSettingsProps = {
  room: Room;
  onClose: () => void;
};

export function DeviceSettings({ room, onClose }: DeviceSettingsProps) {
  const [inputs, setInputs] = useState<MediaDeviceInfo[]>([]);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [outputs, setOutputs] = useState<MediaDeviceInfo[]>([]);
  const supportsSink =
    typeof HTMLMediaElement !== "undefined" && "setSinkId" in HTMLMediaElement.prototype;

  useEffect(() => {
    void navigator.mediaDevices.enumerateDevices().then((devices) => {
      setInputs(devices.filter((device) => device.kind === "audioinput"));
      setCameras(devices.filter((device) => device.kind === "videoinput"));
      setOutputs(devices.filter((device) => device.kind === "audiooutput"));
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-abyss/85 p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="device-settings-title"
        className="surface-raised w-full max-w-md max-h-[min(90dvh,40rem)] overflow-y-auto rounded-[20px] p-6"
      >
        <h2 id="device-settings-title" className="font-display text-xl text-cloud">
          Dispositivos
        </h2>
        <p className="mt-1 text-sm text-haze">Escolha como você quer ouvir e falar.</p>
        <label className="mt-6 block text-sm font-medium text-haze">Microfone</label>
        <Select
          className="mt-2"
          onChange={(event) => {
            void room.switchActiveDevice("audioinput", event.target.value);
          }}
        >
          {inputs.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || "Microfone"}
            </option>
          ))}
        </Select>
        <label className="mt-4 block text-sm font-medium text-haze">Câmera</label>
        <Select
          className="mt-2"
          onChange={(event) => {
            void room.switchActiveDevice("videoinput", event.target.value);
          }}
        >
          {cameras.length === 0 ? (
            <option value="">Nenhuma câmera listada</option>
          ) : (
            cameras.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || "Câmera"}
              </option>
            ))
          )}
        </Select>
        {supportsSink ? (
          <>
            <label className="mt-5 block text-sm font-medium text-haze">Saída de áudio</label>
            <Select
              className="mt-2"
              onChange={(event) => {
                void room.switchActiveDevice("audiooutput", event.target.value);
              }}
            >
              {outputs.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || "Alto-falante"}
                </option>
              ))}
            </Select>
          </>
        ) : (
          <p className="mt-5 text-sm text-haze">
            Este navegador não permite escolher a saída de áudio.
          </p>
        )}
        <Button type="button" variant="secondary" className="mt-6 w-full" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </div>
  );
}
