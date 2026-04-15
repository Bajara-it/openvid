"use client";

import { Icon } from "@iconify/react";
import {
    CAMERA_SHAPES,
    CORNER_POSITIONS,
    type CameraConfig,
    type CameraCorner,
    type CameraShape,
} from "@/types/camera.types";

interface Props {
    cameraUrl: string | null;
    cameraConfig: CameraConfig | null;
    onCameraConfigChange: (partial: Partial<CameraConfig>) => void;
}

const CORNER_BUTTONS: Array<{ id: Exclude<CameraCorner, "custom">; label: string }> = [
    { id: "top-left", label: "Arriba izq." },
    { id: "top-right", label: "Arriba der." },
    { id: "bottom-left", label: "Abajo izq." },
    { id: "bottom-right", label: "Abajo der." },
];

export function CameraMenu({ cameraUrl, cameraConfig, onCameraConfigChange }: Props) {
    if (!cameraUrl || !cameraConfig) {
        return (
            <div className="p-5 flex flex-col items-center text-center gap-3 text-neutral-400">
                <Icon icon="solar:videocamera-record-broken" className="size-8 text-neutral-500" />
                <p className="text-sm">
                    Esta grabación no incluye cámara.
                </p>
                <p className="text-xs text-neutral-500 max-w-52">
                    Activa la cámara al iniciar una nueva grabación para verla aquí.
                </p>
            </div>
        );
    }

    return (
        <div className="p-4 flex flex-col gap-5 text-sm">
            <div className="flex items-center gap-2 text-white font-medium">
                <Icon icon="solar:videocamera-record-bold" width="20" />
                <span>Cámara</span>
            </div>

            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 cursor-pointer">
                <div className="flex items-center gap-2.5">
                    <Icon
                        icon={cameraConfig.enabled ? "solar:eye-bold" : "solar:eye-closed-bold"}
                        className="size-4 text-neutral-400"
                    />
                    <span className="text-sm text-neutral-200">
                        Mostrar cámara
                    </span>
                </div>
                <Toggle
                    checked={cameraConfig.enabled}
                    onChange={(v) => onCameraConfigChange({ enabled: v })}
                />
            </label>

            <div className={`${cameraConfig.enabled ? "" : "opacity-50 pointer-events-none"} flex flex-col gap-5`}>
                <div>
                    <div className="text-[10px] uppercase tracking-widest text-white/60 font-bold mb-2">
                        Forma
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {CAMERA_SHAPES.map((shape) => {
                            const active = cameraConfig.shape === shape.id;
                            return (
                                <button
                                    key={shape.id}
                                    onClick={() =>
                                        onCameraConfigChange({ shape: shape.id as CameraShape })
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
                    <div className="text-[10px] uppercase tracking-widest text-white/60 font-bold mb-2">
                        Posición
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {CORNER_BUTTONS.map((c) => {
                            const active = cameraConfig.corner === c.id;
                            return (
                                <button
                                    key={c.id}
                                    onClick={() =>
                                        onCameraConfigChange({
                                            corner: c.id,
                                            position: CORNER_POSITIONS[c.id],
                                        })
                                    }
                                    className={`relative flex items-center justify-center gap-2 aspect-[2/1] rounded-md border text-[11px] transition-all ${
                                        active
                                            ? "border-[#00A3FF] bg-[#00A3FF]/10 text-white"
                                            : "border-white/10 bg-white/5 text-neutral-400 hover:bg-white/10"
                                    }`}
                                >
                                    <span
                                        className={`absolute size-2 rounded-full ${active ? "bg-[#00A3FF]" : "bg-neutral-500"}`}
                                        style={{
                                            left: c.id.includes("left") ? "12%" : "auto",
                                            right: c.id.includes("right") ? "12%" : "auto",
                                            top: c.id.includes("top") ? "20%" : "auto",
                                            bottom: c.id.includes("bottom") ? "20%" : "auto",
                                        }}
                                    />
                                    <span className="ml-4">{c.label}</span>
                                </button>
                            );
                        })}
                    </div>
                    {cameraConfig.corner === "custom" && (
                        <div className="mt-2 text-[11px] text-neutral-500 flex items-center gap-1.5">
                            <Icon icon="solar:hand-move-bold" className="size-3.5" />
                            Posición personalizada (arrastra la cámara en el canvas).
                        </div>
                    )}
                </div>

                <div>
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-white/60 font-bold mb-2">
                        <span>Tamaño</span>
                        <span className="text-neutral-300 tabular-nums normal-case tracking-normal">
                            {Math.round(cameraConfig.size * 100)}%
                        </span>
                    </div>
                    <input
                        type="range"
                        min={8}
                        max={40}
                        value={Math.round(cameraConfig.size * 100)}
                        onChange={(e) =>
                            onCameraConfigChange({ size: Number(e.target.value) / 100 })
                        }
                        className="w-full accent-[#00A3FF]"
                    />
                </div>

                <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                        <Icon icon="solar:reflection-horisontal-bold" className="size-4 text-neutral-400" />
                        <span className="text-sm text-neutral-200">Reflejar (espejo)</span>
                    </div>
                    <Toggle
                        checked={cameraConfig.mirror}
                        onChange={(v) => onCameraConfigChange({ mirror: v })}
                    />
                </label>
            </div>
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
