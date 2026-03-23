"use client";

import { useRef, useMemo } from "react";
import { Icon } from "@iconify/react";
import { SliderControl } from "../SliderControl";
import type { ZoomFragment } from "@/types/zoom.types";
import { formatZoomTime, zoomLevelToFactor, speedToTransitionMs } from "@/types/zoom.types";
import type { VideoThumbnail } from "@/types/editor.types";

interface ZoomFragmentEditorProps {
    fragment: ZoomFragment;
    videoUrl: string | null;
    videoThumbnail?: string | null;
    currentTime?: number;
    getThumbnailForTime?: (time: number) => VideoThumbnail | null;
    videoDimensions?: { width: number; height: number } | null;
    onBack: () => void;
    onDelete: () => void;
    onUpdate: (updates: Partial<ZoomFragment>) => void;
}

export function ZoomFragmentEditor({
    fragment,
    videoUrl,
    videoThumbnail,
    currentTime = 0,
    getThumbnailForTime,
    videoDimensions,
    onBack,
    onDelete,
    onUpdate,
}: ZoomFragmentEditorProps) {
    const focusPreviewRef = useRef<HTMLDivElement>(null);

    const dynamicThumbnail = useMemo(() => {
        if (!getThumbnailForTime) return videoThumbnail || null;

        const thumb = getThumbnailForTime(currentTime);
        return thumb?.dataUrl || videoThumbnail || null;
    }, [getThumbnailForTime, currentTime, videoThumbnail]);

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);

        const move = (ev: PointerEvent) => {
            if (!focusPreviewRef.current) return;
            const rect = focusPreviewRef.current.getBoundingClientRect();
            const x = Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100));
            const y = Math.max(0, Math.min(100, ((ev.clientY - rect.top) / rect.height) * 100));
            onUpdate({ focusX: x, focusY: y });
        };

        const up = () => {
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", up);
        };

        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
    };

    const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('[data-drag-handle]')) return;
        if (!focusPreviewRef.current) return;

        const rect = focusPreviewRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

        onUpdate({ focusX: x, focusY: y });
    };

    return (
        <div className="flex flex-col h-full text-white">
            <div className="flex items-center gap-2 p-3 border-b border-white/6 shrink-0">
                <button
                    onClick={onBack}
                    className="flex items-center justify-center size-7 rounded-md hover:bg-white/6 text-white/50 transition-colors"
                >
                    <Icon icon="ph:arrow-left-bold" width="14" />
                </button>
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-md font-medium text-white truncate">Fragmento de zoom</span>
                </div>
                <button
                    onClick={onDelete}
                    className="ml-auto flex items-center gap-1.5 text-[10px] text-red-400/70 hover:text-red-400 px-2 py-1 rounded-md transition-colors shrink-0"
                    title="Eliminar fragmento (Delete)"
                >
                    <Icon icon="ph:trash-bold" width="12" />
                    Eliminar
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-5">
                <div>
                    <div className="flex items-center gap-2 text-xs mb-2 text-white/60">
                        <Icon icon="material-symbols:center-focus-strong-outline" width="16" />
                        <span>Punto de enfoque</span>
                        <span className="ml-auto font-mono text-[10px] text-white/25">
                            {Math.round(fragment.focusX)}% · {Math.round(fragment.focusY)}%
                        </span>
                    </div>
                    <div
                        ref={focusPreviewRef}
                        className="relative w-full squircle-element overflow-hidden bg-[#0a0a0e] border border-white/10"
                        style={{ aspectRatio: videoDimensions ? `${videoDimensions.width}/${videoDimensions.height}` : "16/9" }}
                        onClick={handlePreviewClick}
                    >
                        {dynamicThumbnail ? (
                            <img
                                src={dynamicThumbnail}
                                alt="Video preview"
                                className="absolute inset-0 w-full h-full object-cover opacity-60"
                            />
                        ) : videoUrl ? (
                            <video
                                src={videoUrl}
                                className="absolute inset-0 w-full h-full object-cover opacity-60"
                                muted
                            />
                        ) : null}

                        <div
                            className="absolute border border-dashed border-blue-500/50 bg-gradient-to-b from-blue-500/30 to-transparent squircle-element pointer-events-none"
                            style={{
                                width: `${100 / zoomLevelToFactor(fragment.zoomLevel)}%`,
                                height: `${100 / zoomLevelToFactor(fragment.zoomLevel)}%`,
                                left: `${fragment.focusX}%`,
                                top: `${fragment.focusY}%`,
                                transform: 'translate(-50%, -50%)',
                            }}
                        />

                        <div
                            data-drag-handle
                            className="absolute z-10 cursor-grab active:cursor-grabbing"
                            style={{
                                left: `${fragment.focusX}%`,
                                top: `${fragment.focusY}%`,
                                transform: "translate(-50%, -50%)",
                            }}
                            onPointerDown={handlePointerDown}
                        >
                            <div className="size-8 rounded-full bg-white shadow-lg border-2 border-white/10 hover:scale-110 transition-transform" />
                        </div>

                        <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
                            <span className="text-[7px] text-white/20 font-mono uppercase tracking-[0.3em]">
                                Arrastra o click
                            </span>
                        </div>
                    </div>
                </div>

                <SliderControl
                    icon="mdi:magnify-plus-outline"
                    label="Nivel de zoom"
                    value={fragment.zoomLevel}
                    min={1}
                    max={10}
                    step={0.1}
                    onChange={(value) => onUpdate({ zoomLevel: value })}
                />

                <SliderControl
                    icon="mdi:speedometer"
                    label="Velocidad de transición"
                    value={fragment.speed}
                    min={1}
                    max={10}
                    step={0.1}
                    onChange={(value) => onUpdate({ speed: value })}
                />

                <div className="h-px bg-white/10" />

                <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                        <span className="text-white/35">Duración del fragmento</span>
                        <span className="font-mono text-white/55 bg-white/10 px-2 py-0.5 rounded">
                            {formatZoomTime(fragment.startTime)} - {formatZoomTime(fragment.endTime)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                        <span className="text-white/35">Área de enfoque</span>
                        <span className="font-mono text-white/55 bg-white/10 px-2 py-0.5 rounded">
                            {Math.round(fragment.focusX)}% · {Math.round(fragment.focusY)}%
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                        <span className="text-white/35">Factor de zoom</span>
                        <span className="font-mono text-white/55 bg-white/10 px-2 py-0.5 rounded">
                            {zoomLevelToFactor(fragment.zoomLevel).toFixed(1)}×
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                        <span className="text-white/35">Duración de transición</span>
                        <span className="font-mono text-white/55 bg-white/10 px-2 py-0.5 rounded">
                            {(speedToTransitionMs(fragment.speed) / 1000).toFixed(1)}s
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
