import { useEffect, useState } from "react";
import type { Room } from "livekit-client";
import { toast } from "sonner";
import { readDevicePrefs } from "../../lib/storage.ts";
import {
  activeOrSavedDeviceId,
  applySavedDevices,
  listMediaDevices,
  saveDeviceSelection,
} from "../../voice/devices.ts";
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
  const [audioInputId, setAudioInputId] = useState("");
  const [videoInputId, setVideoInputId] = useState("");
  const [audioOutputId, setAudioOutputId] = useState("");
  const [pending, setPending] = useState(false);
  const supportsSink =
    typeof HTMLMediaElement !== "undefined" && "setSinkId" in HTMLMediaElement.prototype;

  useEffect(() => {
    const saved = readDevicePrefs();
    void listMediaDevices().then((devices) => {
      setInputs(devices.audioinput);
      setCameras(devices.videoinput);
      setOutputs(devices.audiooutput);
      setAudioInputId(activeOrSavedDeviceId(room, "audioinput", saved));
      setVideoInputId(activeOrSavedDeviceId(room, "videoinput", saved));
      setAudioOutputId(activeOrSavedDeviceId(room, "audiooutput", saved));
    });
  }, [room]);

  async function handleSave() {
    setPending(true);
    const next = {
      audioinput: audioInputId || undefined,
      videoinput: videoInputId || undefined,
      audiooutput: audioOutputId || undefined,
    };
    saveDeviceSelection(next);
    try {
      await applySavedDevices(room);
      toast.success("Dispositivos salvos.");
      onClose();
    } catch {
      toast.error("Não foi possível aplicar os dispositivos.");
    } finally {
      setPending(false);
    }
  }

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
        <p className="mt-1 text-sm text-haze">
          Escolha microfone, câmera e saída. As opções ficam salvas neste aparelho.
        </p>
        <label className="mt-6 block text-sm font-medium text-haze" htmlFor="device-mic">
          Microfone
        </label>
        <Select
          id="device-mic"
          className="mt-2"
          value={audioInputId}
          onChange={(event) => setAudioInputId(event.target.value)}
        >
          {inputs.length === 0 ? (
            <option value="">Nenhum microfone listado</option>
          ) : (
            inputs.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || "Microfone"}
              </option>
            ))
          )}
        </Select>
        <label className="mt-4 block text-sm font-medium text-haze" htmlFor="device-camera">
          Câmera
        </label>
        <Select
          id="device-camera"
          className="mt-2"
          value={videoInputId}
          onChange={(event) => setVideoInputId(event.target.value)}
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
            <label className="mt-5 block text-sm font-medium text-haze" htmlFor="device-output">
              Saída de áudio
            </label>
            <Select
              id="device-output"
              className="mt-2"
              value={audioOutputId}
              onChange={(event) => setAudioOutputId(event.target.value)}
            >
              {outputs.length === 0 ? (
                <option value="">Nenhuma saída listada</option>
              ) : (
                outputs.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || "Alto-falante"}
                  </option>
                ))
              )}
            </Select>
          </>
        ) : (
          <p className="mt-5 text-sm text-haze">
            Este navegador não permite escolher a saída de áudio.
          </p>
        )}
        <div className="mt-6 flex gap-2">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            className="flex-1"
            disabled={pending}
            onClick={() => void handleSave()}
          >
            {pending ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
