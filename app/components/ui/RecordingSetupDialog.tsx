"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    CAMERA_SHAPES,
    CORNER_POSITIONS,
    DEFAULT_RECORDING_SETUP,
    enumerateMediaDevices,
    requestCameraStream,
    requestMicrophoneStream,
    type AvailableDevices,
    type CameraCorner,
    type CameraShape,
    type RecordingSetupConfig,
} from "@/types/camera.types";

interface Props {
    open: boolean;
    onClose: () => void;
    onStart: (config: RecordingSetupConfig) => void;
}

const STORAGE_KEY = "openvid:recordingSetup";

const CORNER_ORDER: Array<{ id: Exclude<CameraCorner, "custom">; label: string; icon: string }> = [
    { id: "top-left", label: "Arriba izq.", icon: "solar:arrow-up-bold" },
    { id: "top-right", label: "Arriba der.", icon: "solar:arrow-up-bold" },
    { id: "bottom-left", label: "Abajo izq.", icon: "solar:arrow-down-bold" },
    { id: "bottom-right", label: "Abajo der.", icon: "solar:arrow-down-bold" },
];

function loadSavedSetup(): RecordingSetupConfig {
    if (typeof window === "undefined") return DEFAULT_RECORDING_SETUP;
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved) as RecordingSetupConfig;
            return {
                ...DEFAULT_RECORDING_SETUP,
                ...parsed,
                camera: { ...DEFAULT_RECORDING_SETUP.camera, ...parsed.camera },
                microphone: { ...DEFAULT_RECORDING_SETUP.microphone, ...parsed.microphone },
            };
        }
    } catch {
        // ignore
    }
    return DEFAULT_RECORDING_SETUP;
}

export default function RecordingSetupDialog({ open, onClose, onStart }: Props) {
    const [setup, setSetup] = useState<RecordingSetupConfig>(loadSavedSetup);
    const [devices, setDevices] = useState<AvailableDevices>({ cameras: [], microphones: [] });
    const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [micError, setMicError] = useState<string | null>(null);
    const previewVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (!open) return;
        enumerateMediaDevices().then(setDevices);
    }, [open]);

    useEffect(() => {
        if (!open || !setup.camera.enabled) return;

        let cancelled = false;
        let acquired: MediaStream | null = null;

        requestCameraStream(setup.camera.deviceId)
            .then(async (stream) => {
                if (cancelled) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }
                acquired = stream;
                setPreviewStream(stream);
                setCameraError(null);
                const fresh = await enumerateMediaDevices();
                if (!cancelled) setDevices(fresh);
            })
            .catch((err) => {
                if (cancelled) return;
                console.warn("Error de cámara:", err);
                setCameraError("No se pudo acceder a la cámara.");
                setSetup((s) => ({ ...s, camera: { ...s.camera, enabled: false } }));
            });

        return () => {
            cancelled = true;
            if (acquired) {
                acquired.getTracks().forEach((t) => t.stop());
            }
            setPreviewStream((current) => (current === acquired ? null : current));
        };
    }, [open, setup.camera.enabled, setup.camera.deviceId]);

    useEffect(() => {
        if (!open || !setup.microphone.enabled) return;
        let cancelled = false;

        requestMicrophoneStream(setup.microphone.deviceId, {
            noiseSuppression: setup.microphone.noiseSuppression,
            echoCancellation: setup.microphone.echoCancellation,
        })
            .then(async (stream) => {
                stream.getTracks().forEach((t) => t.stop());
                if (cancelled) return;
                setMicError(null);
                const fresh = await enumerateMediaDevices();
                if (!cancelled) setDevices(fresh);
            })
            .catch((err) => {
                if (cancelled) return;
                console.warn("Error de micrófono:", err);
                setMicError("No se pudo acceder al micrófono.");
                setSetup((s) => ({
                    ...s,
                    microphone: { ...s.microphone, enabled: false },
                }));
            });

        return () => {
            cancelled = true;
        };
    }, [
        open,
        setup.microphone.enabled,
        setup.microphone.deviceId,
        setup.microphone.noiseSuppression,
        setup.microphone.echoCancellation,
    ]);

    useEffect(() => {
        const el = previewVideoRef.current;
        if (!el) return;
        el.srcObject = previewStream;
        if (previewStream) el.play().catch(() => undefined);
    }, [previewStream]);

    const handleStart = useCallback(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(setup));
        } catch {
            // ignore
        }
        onStart(setup);
        onClose();
    }, [setup, onStart, onClose]);

    const handleCancel = useCallback(() => {
        onClose();
    }, [onClose]);

    if (!open) return null;

    const shapeRadius =
        setup.camera.shape === "circle" ? "50%"
        : setup.camera.shape === "rounded" ? "22%"
        : "4%";

    const previewFrameStyle: React.CSSProperties = {
        borderRadius: shapeRadius,
        transform: setup.camera.mirror ? "scaleX(-1)" : undefined,
    };

    return (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 backdrop-blur-md px-4 py-6 pointer-events-auto">
            <div
                className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#121214] shadow-2xl"
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Configurar grabación</h2>
                        <p className="text-xs text-neutral-400">
                            Elige tu cámara, micrófono y cómo quieres que se vea tu burbuja.
                        </p>
                    </div>
                    <button
                        onClick={handleCancel}
                        className="size-8 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center"
                        aria-label="Cerrar"
                    >
                        <Icon icon="solar:close-circle-linear" className="size-5" />
                    </button>
                </div>

                <div className="grid gap-0 md:grid-cols-[1.2fr_1fr]">
                    <div className="relative bg-[#0A0A0C] p-6 border-b md:border-b-0 md:border-r border-white/10">
                        <div className="relative aspect-video w-full rounded-xl bg-[linear-gradient(135deg,#1a1a1e,#0a0a0c)] border border-white/5 overflow-hidden">
                            <div className="absolute inset-0 grid grid-cols-4 grid-rows-3 opacity-20">
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <div key={i} className="border border-white/5" />
                                ))}
                            </div>

                            <div
                                className="absolute"
                                style={{
                                    left: `clamp(0px, calc(${setup.camera.position.x * 100}% - ${setup.camera.size * 50}%), calc(100% - ${setup.camera.size * 100}%))`,
                                    top: `clamp(0px, calc(${setup.camera.position.y * 100}% - ${setup.camera.size * 50}%), calc(100% - ${setup.camera.size * 100}%))`,
                                    width: `${setup.camera.size * 100}%`,
                                    aspectRatio: "1 / 1",
                                }}
                            >
                                {setup.camera.enabled && previewStream ? (
                                    <video
                                        ref={previewVideoRef}
                                        autoPlay
                                        muted
                                        playsInline
                                        className="size-full object-cover border-2 border-white/20 shadow-[0_8px_40px_rgba(0,163,255,0.25)]"
                                        style={previewFrameStyle}
                                    />
                                ) : (
                                    <div
                                        className="size-full flex items-center justify-center border-2 border-dashed border-white/20 text-neutral-500"
                                        style={previewFrameStyle}
                                    >
                                        <Icon icon="solar:videocamera-bold" className="size-8" />
                                    </div>
                                )}
                            </div>

                            <div className="absolute left-3 top-3 px-2 py-0.5 text-[10px] rounded-full bg-white/10 text-neutral-300 tracking-wide">
                                Vista previa de posición
                            </div>
                        </div>

                        <div className="mt-4">
                            <div className="text-xs text-neutral-400 mb-2">Posición inicial</div>
                            <div className="grid grid-cols-4 gap-2">
                                {CORNER_ORDER.map((c) => {
                                    const active = setup.camera.corner === c.id;
                                    return (
                                        <button
                                            key={c.id}
                                            onClick={() =>
                                                setSetup((s) => ({
                                                    ...s,
                                                    camera: {
                                                        ...s.camera,
                                                        corner: c.id,
                                                        position: CORNER_POSITIONS[c.id],
                                                    },
                                                }))
                                            }
                                            disabled={!setup.camera.enabled}
                                            className={`group relative flex items-center justify-center aspect-video rounded-md border text-[10px] transition-all ${
                                                active
                                                    ? "border-[#00A3FF] bg-[#00A3FF]/10 text-white"
                                                    : "border-white/10 bg-white/5 text-neutral-400 hover:bg-white/10"
                                            } ${!setup.camera.enabled ? "opacity-40 cursor-not-allowed" : ""}`}
                                        >
                                            <span
                                                className={`absolute size-2 rounded-full ${active ? "bg-[#00A3FF]" : "bg-neutral-500"}`}
                                                style={{
                                                    left: c.id.includes("left") ? "10%" : "auto",
                                                    right: c.id.includes("right") ? "10%" : "auto",
                                                    top: c.id.includes("top") ? "18%" : "auto",
                                                    bottom: c.id.includes("bottom") ? "18%" : "auto",
                                                }}
                                            />
                                            <span className="sr-only">{c.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-5 text-sm">
                        <SectionToggle
                            icon="solar:videocamera-record-bold"
                            title="Cámara"
                            description="Agrega una burbuja con tu cámara web."
                            enabled={setup.camera.enabled}
                            onToggle={(v) =>
                                setSetup((s) => ({
                                    ...s,
                                    camera: { ...s.camera, enabled: v },
                                }))
                            }
                            error={cameraError}
                        >
                            <div className="space-y-3">
                                <Select
                                    value={setup.camera.deviceId ?? "default"}
                                    onValueChange={(v) =>
                                        setSetup((s) => ({
                                            ...s,
                                            camera: {
                                                ...s.camera,
                                                deviceId: v === "default" ? null : v,
                                            },
                                        }))
                                    }
                                >
                                    <SelectTrigger className="w-full bg-white/5 border-white/10 text-neutral-200">
                                        <SelectValue placeholder="Seleccionar cámara" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1E1E20] border-white/10 text-neutral-200">
                                        <SelectItem value="default">Cámara predeterminada</SelectItem>
                                        {devices.cameras.map((cam) => (
                                            <SelectItem key={cam.deviceId} value={cam.deviceId}>
                                                {cam.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div>
                                    <div className="text-xs text-neutral-400 mb-1.5">Forma</div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {CAMERA_SHAPES.map((shape) => {
                                            const active = setup.camera.shape === shape.id;
                                            return (
                                                <button
                                                    key={shape.id}
                                                    onClick={() =>
                                                        setSetup((s) => ({
                                                            ...s,
                                                            camera: { ...s.camera, shape: shape.id as CameraShape },
                                                        }))
                                                    }
                                                    className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-[11px] transition-all ${
                                                        active
                                                            ? "border-[#00A3FF] bg-[#00A3FF]/10 text-white"
                                                            : "border-white/10 bg-white/5 text-neutral-400 hover:bg-white/10"
                                                    }`}
                                                >
                                                    <Icon icon={shape.icon} className="size-5" />
                                                    {shape.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
                                        <span>Tamaño</span>
                                        <span className="text-neutral-300 tabular-nums">
                                            {Math.round(setup.camera.size * 100)}%
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={8}
                                        max={40}
                                        value={Math.round(setup.camera.size * 100)}
                                        onChange={(e) =>
                                            setSetup((s) => ({
                                                ...s,
                                                camera: { ...s.camera, size: Number(e.target.value) / 100 },
                                            }))
                                        }
                                        className="w-full accent-[#00A3FF]"
                                    />
                                </div>

                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-xs text-neutral-300 flex items-center gap-2">
                                        <Icon icon="solar:reflection-horisontal-bold" className="size-4" />
                                        Reflejar horizontalmente
                                    </span>
                                    <Toggle
                                        checked={setup.camera.mirror}
                                        onChange={(v) =>
                                            setSetup((s) => ({
                                                ...s,
                                                camera: { ...s.camera, mirror: v },
                                            }))
                                        }
                                    />
                                </label>
                            </div>
                        </SectionToggle>

                        <SectionToggle
                            icon="solar:microphone-3-bold"
                            title="Micrófono"
                            description="Graba tu voz en la misma pista."
                            enabled={setup.microphone.enabled}
                            onToggle={(v) =>
                                setSetup((s) => ({
                                    ...s,
                                    microphone: { ...s.microphone, enabled: v },
                                }))
                            }
                            error={micError}
                        >
                            <Select
                                value={setup.microphone.deviceId ?? "default"}
                                onValueChange={(v) =>
                                    setSetup((s) => ({
                                        ...s,
                                        microphone: {
                                            ...s.microphone,
                                            deviceId: v === "default" ? null : v,
                                        },
                                    }))
                                }
                            >
                                <SelectTrigger className="w-full bg-white/5 border-white/10 text-neutral-200">
                                    <SelectValue placeholder="Seleccionar micrófono" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1E1E20] border-white/10 text-neutral-200">
                                    <SelectItem value="default">Micrófono predeterminado</SelectItem>
                                    {devices.microphones.map((mic) => (
                                        <SelectItem key={mic.deviceId} value={mic.deviceId}>
                                            {mic.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </SectionToggle>

                        <label className="flex items-center justify-between cursor-pointer px-1 py-2 rounded-lg">
                            <div className="flex items-start gap-2.5">
                                <Icon icon="solar:volume-loud-bold" className="size-5 text-neutral-400 mt-0.5" />
                                <div>
                                    <div className="text-sm text-neutral-200 font-medium">Audio del sistema</div>
                                    <div className="text-[11px] text-neutral-500">
                                        Captura el audio de la pestaña o ventana compartida.
                                    </div>
                                </div>
                            </div>
                            <Toggle
                                checked={setup.systemAudio}
                                onChange={(v) => setSetup((s) => ({ ...s, systemAudio: v }))}
                            />
                        </label>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-[#0E0E10]">
                    <Button variant="ghost" onClick={handleCancel}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleStart} className="gap-2">
                        <Icon icon="material-symbols:cast-outline-rounded" className="size-4" />
                        Compartir pantalla
                    </Button>
                </div>
            </div>
        </div>
    );
}

function SectionToggle({
    icon,
    title,
    description,
    enabled,
    onToggle,
    children,
    error,
}: {
    icon: string;
    title: string;
    description: string;
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
    children?: React.ReactNode;
    error?: string | null;
}) {
    return (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <label className="flex items-center justify-between p-3 cursor-pointer">
                <div className="flex items-start gap-2.5">
                    <Icon icon={icon} className="size-5 text-neutral-400 mt-0.5" />
                    <div>
                        <div className="text-sm text-neutral-200 font-medium">{title}</div>
                        <div className="text-[11px] text-neutral-500">{description}</div>
                    </div>
                </div>
                <Toggle checked={enabled} onChange={onToggle} />
            </label>

            {enabled && (
                <div className="px-3 pb-3">
                    {error && (
                        <div className="mb-2 rounded-md bg-red-500/10 border border-red-500/20 px-2.5 py-1.5 text-[11px] text-red-300">
                            {error}
                        </div>
                    )}
                    {children}
                </div>
            )}
        </div>
    );
}

function Toggle({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={(e) => {
                e.preventDefault();
                onChange(!checked);
            }}
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                checked ? "bg-[#00A3FF]" : "bg-white/10"
            }`}
        >
            <span
                className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white transition-transform ${
                    checked ? "translate-x-4" : "translate-x-0"
                }`}
            />
        </button>
    );
}
