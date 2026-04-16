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
    RECORDING_SETUP_STORAGE_KEY,
    VALID_CAMERA_SHAPES,
    VALID_CAMERA_CORNERS,
    CORNER_BUTTONS,
    type AvailableDevices,
    type CameraCorner,
    type CameraShape,
    type RecordingSetupConfig,
} from "@/types/camera.types";
import { SliderControl } from "./SliderControl";
import { Toggle } from "@/components/ui/toggle";
import { BrowserPermissionUI } from "@/components/ui/BrowserPermissionUI";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"

interface Props {
    open: boolean;
    onClose: () => void;
    onStart: (config: RecordingSetupConfig) => void;
}

function loadSavedSetup(): RecordingSetupConfig {
    if (typeof window === "undefined") return { ...DEFAULT_RECORDING_SETUP, systemAudio: false };
    try {
        const saved = localStorage.getItem(RECORDING_SETUP_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved) as RecordingSetupConfig;

            // Migración: convertir shapes deprecated a valores válidos actuales
            let cameraShape = (parsed.camera?.shape as string) || "";

            // Convertir valores deprecated a valores actuales
            if (cameraShape === "rounded") {
                cameraShape = "squircle";
            }

            // FIX: Validar que el shape sea uno de los valores actuales válidos.
            // Si no lo es (valor corrupto, deprecado no migrado, etc.), usar el default.
            const resolvedShape: CameraShape = VALID_CAMERA_SHAPES.includes(cameraShape as CameraShape)
                ? (cameraShape as CameraShape)
                : DEFAULT_RECORDING_SETUP.camera.shape;

            // FIX: Validar corner guardado
            const savedCorner = parsed.camera?.corner;
            const resolvedCorner: CameraCorner = VALID_CAMERA_CORNERS.includes(savedCorner)
                ? savedCorner
                : DEFAULT_RECORDING_SETUP.camera.corner;

            // Si el corner cambió por ser inválido, también resetear la posición
            const resolvedPosition = (savedCorner === resolvedCorner && parsed.camera?.position)
                ? parsed.camera.position
                : DEFAULT_RECORDING_SETUP.camera.position;

            return {
                ...DEFAULT_RECORDING_SETUP,
                ...parsed,
                systemAudio: parsed.systemAudio ?? false,
                camera: {
                    // FIX: El orden importa. DEFAULT va primero, luego parsed,
                    // luego los valores resueltos/validados que NUNCA deben ser pisados.
                    ...DEFAULT_RECORDING_SETUP.camera,
                    ...parsed.camera,
                    shape: resolvedShape,
                    corner: resolvedCorner,
                    position: resolvedPosition,
                },
                microphone: { ...DEFAULT_RECORDING_SETUP.microphone, ...parsed.microphone },
            };
        }
    } catch {
        // ignore — localStorage corrupto, usar defaults
    }
    return { ...DEFAULT_RECORDING_SETUP, systemAudio: false };
}

export default function RecordingSetupDialog({ open, onClose, onStart }: Props) {
    const [setup, setSetup] = useState<RecordingSetupConfig>(loadSavedSetup);
    const [devices, setDevices] = useState<AvailableDevices>({ cameras: [], microphones: [] });
    const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [micError, setMicError] = useState<string | null>(null);
    const previewVideoRef = useRef<HTMLVideoElement>(null);
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const [isDraggingPreview, setIsDraggingPreview] = useState(false);
    const isPermissionDenied = cameraError?.includes("NotAllowedError") || cameraError?.includes("Permission denied");
    const dragPreviewRef = useRef<{
        pointerId: number;
        startX: number;
        startY: number;
        startPosX: number;
        startPosY: number;
    } | null>(null);

    useEffect(() => {
        if (!open) return;
        enumerateMediaDevices().then(setDevices);
    }, [open]);

    useEffect(() => {
        if (!open || !setup.camera.enabled) {
            // Limpiar stream cuando la cámara se deshabilita o el diálogo se cierra
            const timer = setTimeout(() => {
                setPreviewStream((prevStream) => {
                    if (prevStream) {
                        prevStream.getTracks().forEach((t) => t.stop());
                    }
                    return null;
                });
            }, 0);
            return () => clearTimeout(timer);
        }

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

                // 1. Detectamos si es un error de permisos
                const isPermissionError =
                    err.name === "NotAllowedError" ||
                    err.message?.includes("Permission denied");

                // 2. Guardamos el string clave para que el SectionToggle muestre el Popover
                if (isPermissionError) {
                    setCameraError("NotAllowedError");
                } else {
                    setCameraError("No se pudo acceder a la cámara. Revisa tu conexión.");
                }

                setSetup((s) => ({ ...s, camera: { ...s.camera, enabled: false } }));
            });

        return () => {
            cancelled = true;
            if (acquired) {
                acquired.getTracks().forEach((t) => t.stop());
            }
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
        
        // Always update srcObject when previewStream changes
        el.srcObject = previewStream;
        
        if (previewStream) {
            el.play().catch(() => undefined);
        }
    }, [previewStream]);

    const handleStart = useCallback(() => {
        try {
            localStorage.setItem(RECORDING_SETUP_STORAGE_KEY, JSON.stringify(setup));
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

    const sizeMultiplier = 0.5 + (setup.camera.size - 20) / 40;

    const shapeRadiusMap: Record<CameraShape, string> = {
        circle: "50%",
        squircle: `${Math.round(20 * sizeMultiplier)}px`,
        square: `${Math.round(6 * sizeMultiplier)}px`,
    };
    const shapeRadius = shapeRadiusMap[setup.camera.shape] ?? shapeRadiusMap.square;

    const previewFrameStyle: React.CSSProperties = {
        borderRadius: shapeRadius,
        transform: setup.camera.mirror ? "scaleX(-1)" : undefined,
    };

    return (
        <div className="fixed inset-0 z-9998 flex items-center justify-center bg-black/70 backdrop-blur-md px-4 py-6 pointer-events-auto">
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
                        <Icon icon="material-symbols:close-rounded" className="size-5" />
                    </button>
                </div>

                <div className="grid gap-0 md:grid-cols-[1.2fr_1fr] h-full">
                    <div className="relative flex flex-col h-full bg-[#0A0A0C] p-6 border-b md:border-b-0 md:border-r border-white/10">
                        <div className="relative flex flex-1 w-full items-center justify-center min-h-0">
                            <div className="relative w-full overflow-hidden rounded-[10px] shadow-[0_3px_10px_rgba(0,0,0,0.5)]">
                                <div className="w-full aspect-video bg-[#1E1E1E] border border-white/10 flex flex-col overflow-hidden">
                                    <div className="bg-[#2D2D2D] flex flex-col justify-center items-center px-4 shrink-0 w-full h-7 rounded-t-[10px] border-b border-white/5">
                                        <div className="flex items-center justify-between w-full">

                                            <div className="flex items-center gap-4">
                                                <div className="flex gap-1.5">
                                                    <div className="size-1.5 rounded-full border border-gray-400 bg-gray-400/20"></div>
                                                    <div className="size-1.5 rounded-full border border-gray-400 bg-gray-400/20"></div>
                                                    <div className="size-1.5 rounded-full border border-gray-400 bg-gray-400/20"></div>
                                                </div>
                                                <div className="flex items-center gap-2 text-neutral-400">
                                                    <Icon icon="lucide:arrow-left" className="size-2 hover:text-neutral-200 transition-colors cursor-pointer" />
                                                    <Icon icon="lucide:arrow-right" className="size-2 text-neutral-600" />
                                                    <Icon icon="lucide:rotate-cw" className="size-2 hover:text-neutral-200 transition-colors cursor-pointer" />
                                                </div>
                                            </div>

                                            <div className="flex-1 max-w-xl mx-4">
                                                <div className="bg-[#1C1C1C] rounded-[4px] h-5 w-full flex items-center justify-between px-2 border border-white/5 shadow-inner">
                                                    <Icon icon="material-symbols:lock" className="size-2.5 text-neutral-500 hover:text-neutral-200 transition-colors cursor-pointer" />
                                                    <span className="flex-1 text-center text-[9px] tracking-wide truncate px-2 text-neutral-300 leading-none">
                                                        openvid.dev
                                                    </span>
                                                    <Icon icon="material-symbols:star-outline" className="size-3 text-neutral-500 hover:text-neutral-200 transition-colors cursor-pointer" />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 text-neutral-400">
                                                <Icon icon="solar:puzzle-linear" className="size-2 hover:text-neutral-200 transition-colors cursor-pointer" />
                                                <Icon icon="lucide:panel-right" className="size-2 hover:text-neutral-200 transition-colors cursor-pointer" />
                                            </div>

                                        </div>
                                    </div>

                                    <div
                                        ref={previewContainerRef}
                                        className="flex-1 flex w-full h-full bg-[#0a0a0a]"
                                    >

                                        <div
                                            className="relative w-full h-full bg-[linear-gradient(135deg,#1a1a1e,#0a0a0c)] overflow-hidden"
                                            style={{ containerType: "size" }}
                                        >
                                            <div className="absolute inset-0 grid grid-cols-4 grid-rows-3 opacity-20">
                                                {Array.from({ length: 12 }).map((_, i) => (
                                                    <div key={i} className="border border-white/5" />
                                                ))}
                                            </div>

                                            <div
                                                onPointerDown={(e) => {
                                                    if (!setup.camera.enabled || e.button !== 0) return;
                                                    const container = previewContainerRef.current;
                                                    if (!container) return;
                                                    e.currentTarget.setPointerCapture(e.pointerId);
                                                    dragPreviewRef.current = {
                                                        pointerId: e.pointerId,
                                                        startX: e.clientX,
                                                        startY: e.clientY,
                                                        startPosX: setup.camera.position.x,
                                                        startPosY: setup.camera.position.y,
                                                    };
                                                    setIsDraggingPreview(true);
                                                }}
                                                onPointerMove={(e) => {
                                                    const drag = dragPreviewRef.current;
                                                    if (!drag || drag.pointerId !== e.pointerId) return;
                                                    const container = previewContainerRef.current;
                                                    if (!container) return;
                                                    const rect = container.getBoundingClientRect();
                                                    const dx = (e.clientX - drag.startX) / rect.width;
                                                    const dy = (e.clientY - drag.startY) / rect.height;
                                                    const nextX = Math.min(1, Math.max(0, drag.startPosX + dx));
                                                    const nextY = Math.min(1, Math.max(0, drag.startPosY + dy));
                                                    setSetup((s) => ({
                                                        ...s,
                                                        camera: {
                                                            ...s.camera,
                                                            position: { x: nextX, y: nextY },
                                                            corner: "custom",
                                                        },
                                                    }));
                                                }}
                                                onPointerUp={(e) => {
                                                    const drag = dragPreviewRef.current;
                                                    if (!drag || drag.pointerId !== e.pointerId) return;
                                                    e.currentTarget.releasePointerCapture(e.pointerId);
                                                    dragPreviewRef.current = null;
                                                    setIsDraggingPreview(false);
                                                }}
                                                onPointerCancel={(e) => {
                                                    const drag = dragPreviewRef.current;
                                                    if (!drag || drag.pointerId !== e.pointerId) return;
                                                    e.currentTarget.releasePointerCapture(e.pointerId);
                                                    dragPreviewRef.current = null;
                                                    setIsDraggingPreview(false);
                                                }}
                                                className={`absolute ${setup.camera.enabled
                                                    ? (isDraggingPreview ? "cursor-grabbing" : "cursor-grab")
                                                    : ""
                                                    }`}
                                                style={{
                                                    width: `${setup.camera.size * 100}cqw`,
                                                    height: `${setup.camera.size * 100}cqw`,
                                                    left: `clamp(0px, calc(${setup.camera.position.x * 100}cqw - ${setup.camera.size * 50}cqw), calc(100cqw - ${setup.camera.size * 100}cqw))`,
                                                    top: `clamp(0px, calc(${setup.camera.position.y * 100}cqh - ${setup.camera.size * 50}cqw), calc(100cqh - ${setup.camera.size * 100}cqw))`,
                                                    transition: isDraggingPreview ? "none" : "left 120ms ease, top 120ms ease",
                                                    touchAction: "none",
                                                }}
                                            >
                                                {setup.camera.enabled && previewStream ? (
                                                    <video
                                                        ref={previewVideoRef}
                                                        autoPlay
                                                        muted
                                                        playsInline
                                                        className={`size-full object-cover border-2 border-white/20 shadow-[0_8px_40px_rgba(0,163,255,0.25)] transition-all duration-300 ${setup.camera.shape === "squircle" ? "squircle-element-camera" : ""
                                                            }`}
                                                        style={previewFrameStyle}
                                                    />
                                                ) : (
                                                    <div
                                                        className={`size-full flex items-center justify-center border-2 border-dashed border-white/20 text-neutral-500 transition-all duration-300 ${setup.camera.shape === "squircle" ? "squircle-element-camera" : ""
                                                            }`}
                                                        style={previewFrameStyle}
                                                    >
                                                        <Icon icon="solar:videocamera-bold" className="size-8" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 shrink-0">
                            <div className="text-xs text-neutral-400 mb-2">Posición inicial</div>
                            <div className="grid grid-cols-4 gap-2">
                                {CORNER_BUTTONS.map((c) => {
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
                                            className={`group relative flex items-center justify-center aspect-video rounded-md border text-[10px] transition-all ${active
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

                    <div className="p-6 space-y-5 text-sm overflow-y-auto max-h-[60vh] md:max-h-full">
                        <SectionToggle
                            icon="solar:videocamera-record-bold"
                            title="Cámara"
                            enabled={setup.camera.enabled}
                            onToggle={(v) =>
                                setSetup((s) => ({
                                    ...s,
                                    camera: { ...s.camera, enabled: v },
                                }))
                            }
                            error={cameraError}
                            description={
                                isPermissionDenied ? (
                                    <div className="mt-0.5">
                                        <HoverCard openDelay={200} closeDelay={100}>
                                            <HoverCardTrigger asChild>
                                                <span className="text-red-400 font-medium border-b border-dashed border-red-400/50 cursor-help pb-0.5">
                                                    Se rechazó el acceso a la cámara. Pasa el cursor aquí para ver cómo solucionarlo.
                                                </span>
                                            </HoverCardTrigger>
                                            <HoverCardContent
                                                side="bottom"
                                                align="start"
                                                sideOffset={8}
                                                className="w-auto p-0 border-none shadow-none bg-transparent z-9999"
                                            >
                                                <div className="relative">
                                                    <div className="absolute -top-2 left-10 w-4 h-4 bg-white border-t border-l border-white/10 transform rotate-45" />
                                                    <BrowserPermissionUI />
                                                </div>
                                            </HoverCardContent>
                                        </HoverCard>
                                    </div>
                                ) : (
                                    "Agrega una burbuja con tu cámara web."
                                )
                            }
                        >
                            <div className="space-y-3 pt-1">
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
                                    <SelectContent className="bg-[#1E1E20] border-white/10 text-neutral-200 z-9999">
                                        <SelectItem value="default">Cámara predeterminada</SelectItem>
                                        {devices.cameras
                                            .filter((cam) => cam.deviceId !== "")
                                            .map((cam) => (
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
                                                            camera: { ...s.camera, shape: shape.id },
                                                        }))
                                                    }
                                                    className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-[11px] transition-all ${active
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

                                <div className="mt-2">
                                    <SliderControl
                                        label="Tamaño"
                                        value={Math.round(setup.camera.size * 100)}
                                        min={8}
                                        max={40}
                                        suffix="%"
                                        onChange={(val) =>
                                            setSetup((s) => ({
                                                ...s,
                                                camera: { ...s.camera, size: val / 100 },
                                            }))
                                        }
                                    />
                                </div>

                                <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-white/5">
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
                            <div className="pt-1">
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
                                    <SelectContent className="bg-[#1E1E20] border-white/10 text-neutral-200 z-9999">
                                        <SelectItem value="default">Micrófono </SelectItem>
                                        {devices.microphones
                                            .filter((mic) => mic.deviceId !== "")
                                            .map((mic) => (
                                                <SelectItem key={mic.deviceId} value={mic.deviceId}>
                                                    {mic.label}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
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
                    <Button variant="outline" onClick={handleCancel}>
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
    description: React.ReactNode;
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
    children?: React.ReactNode;
    error?: string | null;
}) {
    return (
        <div className="rounded-xl border border-white/10 bg-white/3">
            <label className="flex items-center justify-between p-3 cursor-pointer">
                <div className="flex items-start gap-2.5">
                    <Icon icon={icon} className="size-5 text-neutral-400 mt-0.5 transition-colors" />
                    <div>
                        <div className="text-sm text-neutral-200 font-medium transition-colors">{title}</div>
                        <div className="text-[11px] text-neutral-500 transition-colors">{description}</div>
                    </div>
                </div>
                <Toggle checked={enabled} onChange={onToggle} />
            </label>

            <div
                className={`grid transition-all duration-300 ease-in-out ${enabled ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
            >
                <div className="overflow-hidden">
                    <div className="px-3 pb-3">
                        {error && (
                            <div className="mb-2 rounded-md bg-red-500/10 border border-red-500/20 px-2.5 py-1.5 text-[11px] text-red-300">
                                {error}
                            </div>
                        )}
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}