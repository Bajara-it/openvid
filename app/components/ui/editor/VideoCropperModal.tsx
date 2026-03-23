"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import type { CropArea } from "@/types";

interface VideoCropperModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoUrl: string | null;
    onCropApply: (crop: CropArea) => void;
    initialCrop?: CropArea;
}

const CROP_ASPECT_RATIOS = [
    { label: "Libre", value: null },
    { label: "16:9", value: 16 / 9 },
    { label: "9:16", value: 9 / 16 },
    { label: "1:1", value: 1 },
    { label: "4:3", value: 4 / 3 },
    { label: "3:4", value: 3 / 4 },
] as const;

export function VideoCropperModal({
    isOpen,
    onClose,
    videoUrl,
    onCropApply,
    initialCrop,
}: VideoCropperModalProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const [cropArea, setCropArea] = useState<CropArea>(initialCrop ?? { x: 0, y: 0, width: 100, height: 100 });
    const [selectedAspectRatio, setSelectedAspectRatio] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragType, setDragType] = useState<"move" | "resize" | null>(null);
    const [dragHandle, setDragHandle] = useState<string | null>(null);
    const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
    const [wasOpen, setWasOpen] = useState(false);

    const dragStartPos = useRef({ x: 0, y: 0 });
    const initialCropRef = useRef<CropArea>({ x: 0, y: 0, width: 100, height: 100 });

    if (isOpen && !wasOpen) {
        setCropArea(initialCrop ?? { x: 0, y: 0, width: 100, height: 100 });
        setSelectedAspectRatio(null);
        setWasOpen(true);
    } else if (!isOpen && wasOpen) {
        setWasOpen(false);
    }

    const handleVideoLoad = useCallback(() => {
        if (videoRef.current) {
            setVideoDimensions({
                width: videoRef.current.videoWidth,
                height: videoRef.current.videoHeight,
            });
        }
    }, []);

    // Aplicar aspect ratio cuando se selecciona
    const handleAspectRatioSelect = useCallback((ratio: number | null) => {
        setSelectedAspectRatio(ratio);

        if (ratio === null || videoDimensions.width === 0) return;

        const videoAspect = videoDimensions.width / videoDimensions.height;
        const targetAspect = ratio;

        let newWidth: number;
        let newHeight: number;

        if (targetAspect > videoAspect) {
            newWidth = 100;
            newHeight = (100 * videoAspect) / targetAspect;
        } else {
            newHeight = 100;
            newWidth = (100 * targetAspect) / videoAspect;
        }

        const newX = (100 - newWidth) / 2;
        const newY = (100 - newHeight) / 2;

        setCropArea({
            x: Math.max(0, newX),
            y: Math.max(0, newY),
            width: Math.min(100, newWidth),
            height: Math.min(100, newHeight),
        });
    }, [videoDimensions]);

    // Manejo del inicio de arrastre
    const handleMouseDown = (e: React.MouseEvent, type: "move" | "resize", handle?: string) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        setDragType(type);
        setDragHandle(handle ?? null);
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        initialCropRef.current = { ...cropArea };
    };

    // Manejo del movimiento
    useEffect(() => {
        if (!isDragging || !containerRef.current) return;

        const handleMouseMove = (e: MouseEvent) => {
            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const deltaX = ((e.clientX - dragStartPos.current.x) / rect.width) * 100;
            const deltaY = ((e.clientY - dragStartPos.current.y) / rect.height) * 100;

            if (dragType === "move") {
                const newX = Math.max(0, Math.min(100 - cropArea.width, initialCropRef.current.x + deltaX));
                const newY = Math.max(0, Math.min(100 - cropArea.height, initialCropRef.current.y + deltaY));
                setCropArea(prev => ({ ...prev, x: newX, y: newY }));
            } else if (dragType === "resize" && dragHandle) {
                const newCrop = { ...initialCropRef.current };
                const minSize = 10;

                switch (dragHandle) {
                    case "nw": {
                        const maxDx = initialCropRef.current.width - minSize;
                        const maxDy = initialCropRef.current.height - minSize;
                        const clampedDx = Math.max(-initialCropRef.current.x, Math.min(maxDx, deltaX));
                        const clampedDy = Math.max(-initialCropRef.current.y, Math.min(maxDy, deltaY));
                        newCrop.x = initialCropRef.current.x + clampedDx;
                        newCrop.y = initialCropRef.current.y + clampedDy;
                        newCrop.width = initialCropRef.current.width - clampedDx;
                        newCrop.height = initialCropRef.current.height - clampedDy;
                        break;
                    }
                    case "ne": {
                        const maxDx = 100 - initialCropRef.current.x - initialCropRef.current.width;
                        const maxDy = initialCropRef.current.height - minSize;
                        const clampedDx = Math.max(-(initialCropRef.current.width - minSize), Math.min(maxDx, deltaX));
                        const clampedDy = Math.max(-initialCropRef.current.y, Math.min(maxDy, deltaY));
                        newCrop.y = initialCropRef.current.y + clampedDy;
                        newCrop.width = initialCropRef.current.width + clampedDx;
                        newCrop.height = initialCropRef.current.height - clampedDy;
                        break;
                    }
                    case "sw": {
                        const maxDx = initialCropRef.current.width - minSize;
                        const maxDy = 100 - initialCropRef.current.y - initialCropRef.current.height;
                        const clampedDx = Math.max(-initialCropRef.current.x, Math.min(maxDx, deltaX));
                        const clampedDy = Math.max(-(initialCropRef.current.height - minSize), Math.min(maxDy, deltaY));
                        newCrop.x = initialCropRef.current.x + clampedDx;
                        newCrop.width = initialCropRef.current.width - clampedDx;
                        newCrop.height = initialCropRef.current.height + clampedDy;
                        break;
                    }
                    case "se": {
                        const maxDx = 100 - initialCropRef.current.x - initialCropRef.current.width;
                        const maxDy = 100 - initialCropRef.current.y - initialCropRef.current.height;
                        const clampedDx = Math.max(-(initialCropRef.current.width - minSize), Math.min(maxDx, deltaX));
                        const clampedDy = Math.max(-(initialCropRef.current.height - minSize), Math.min(maxDy, deltaY));
                        newCrop.width = initialCropRef.current.width + clampedDx;
                        newCrop.height = initialCropRef.current.height + clampedDy;
                        break;
                    }
                    case "n": {
                        const maxDy = initialCropRef.current.height - minSize;
                        const clampedDy = Math.max(-initialCropRef.current.y, Math.min(maxDy, deltaY));
                        newCrop.y = initialCropRef.current.y + clampedDy;
                        newCrop.height = initialCropRef.current.height - clampedDy;
                        break;
                    }
                    case "s": {
                        const maxDy = 100 - initialCropRef.current.y - initialCropRef.current.height;
                        const clampedDy = Math.max(-(initialCropRef.current.height - minSize), Math.min(maxDy, deltaY));
                        newCrop.height = initialCropRef.current.height + clampedDy;
                        break;
                    }
                    case "w": {
                        const maxDx = initialCropRef.current.width - minSize;
                        const clampedDx = Math.max(-initialCropRef.current.x, Math.min(maxDx, deltaX));
                        newCrop.x = initialCropRef.current.x + clampedDx;
                        newCrop.width = initialCropRef.current.width - clampedDx;
                        break;
                    }
                    case "e": {
                        const maxDx = 100 - initialCropRef.current.x - initialCropRef.current.width;
                        const clampedDx = Math.max(-(initialCropRef.current.width - minSize), Math.min(maxDx, deltaX));
                        newCrop.width = initialCropRef.current.width + clampedDx;
                        break;
                    }
                }

                newCrop.x = Math.max(0, Math.min(100 - minSize, newCrop.x));
                newCrop.y = Math.max(0, Math.min(100 - minSize, newCrop.y));
                newCrop.width = Math.max(minSize, Math.min(100 - newCrop.x, newCrop.width));
                newCrop.height = Math.max(minSize, Math.min(100 - newCrop.y, newCrop.height));

                setCropArea(newCrop);
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setDragType(null);
            setDragHandle(null);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, dragType, dragHandle, cropArea.width, cropArea.height]);

    const handleReset = () => {
        setCropArea({ x: 0, y: 0, width: 100, height: 100 });
        setSelectedAspectRatio(null);
    };

    const handleApply = () => {
        onCropApply(cropArea);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center"
            >
                <motion.div
                    initial={{ scale: 0.96, opacity: 0, y: 8 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.96, opacity: 0, y: 8 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-[#0a0a0b] rounded-2xl border border-white/10 w-[92vw] max-w-5xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl"
                >
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
                        <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center">
                                <Icon icon="mdi:crop" className="text-sm text-white/70" />
                            </div>
                            <span className="text-sm font-medium text-white">Recortar video</span>
                            {videoDimensions.width > 0 && (
                                <span className="text-[11px] font-mono text-white/60 bg-white/4 px-2 py-0.5 rounded-md border border-white/10">
                                    {videoDimensions.width} × {videoDimensions.height}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white/70"
                        >
                            <Icon icon="mdi:close" className="text-base" />
                        </button>
                    </div>

                    <div className="flex-1 flex overflow-hidden min-h-0">

                        <div className="flex-1 p-6 flex items-center justify-center bg-black/50 overflow-hidden">
                            <div
                                ref={containerRef}
                                className="relative w-full h-full max-w-full max-h-full flex items-center justify-center"
                            >
                                <div
                                    className="relative"
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        maxWidth: "100%",
                                        maxHeight: "100%",
                                        aspectRatio: videoDimensions.width && videoDimensions.height
                                            ? `${videoDimensions.width}/${videoDimensions.height}`
                                            : "16/9",
                                    }}
                                >
                                    {videoUrl ? (
                                        <video
                                            ref={videoRef}
                                            src={videoUrl}
                                            className="absolute inset-0 w-full h-full object-contain bg-black"
                                            onLoadedMetadata={handleVideoLoad}
                                            muted loop autoPlay
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-white/3 rounded-lg flex items-center justify-center text-white/20 text-sm">
                                            Sin video
                                        </div>
                                    )}

                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className="absolute bg-black/75 left-0 right-0 top-0" style={{ height: `${cropArea.y}%` }} />
                                        <div className="absolute bg-black/75 left-0 right-0 bottom-0" style={{ height: `${Math.max(0, 100 - cropArea.y - cropArea.height)}%` }} />
                                        <div className="absolute bg-black/75 left-0" style={{ top: `${cropArea.y}%`, width: `${cropArea.x}%`, height: `${cropArea.height}%` }} />
                                        <div className="absolute bg-black/75 right-0" style={{ top: `${cropArea.y}%`, width: `${Math.max(0, 100 - cropArea.x - cropArea.width)}%`, height: `${cropArea.height}%` }} />
                                    </div>

                                    <div
                                        className="absolute border border-white/80 cursor-move"
                                        style={{
                                            left: `${cropArea.x}%`,
                                            top: `${cropArea.y}%`,
                                            width: `${cropArea.width}%`,
                                            height: `${cropArea.height}%`,
                                        }}
                                        onMouseDown={(e) => handleMouseDown(e, "move")}
                                    >
                                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                                            {[...Array(9)].map((_, i) => (
                                                <div key={i} className="border border-white/15" />
                                            ))}
                                        </div>

                                        {videoDimensions.width > 0 && (
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm border border-white/12 text-white/60 text-[10px] font-mono px-2 py-0.5 rounded-md whitespace-nowrap pointer-events-none">
                                                {Math.round((videoDimensions.width * cropArea.width) / 100)} × {Math.round((videoDimensions.height * cropArea.height) / 100)}
                                            </div>
                                        )}

                                        {["nw", "ne", "sw", "se"].map((handle) => {
                                            const positions: Record<string, string> = {
                                                nw: "-top-1.5 -left-1.5 cursor-nwse-resize",
                                                ne: "-top-1.5 -right-1.5 cursor-nesw-resize",
                                                sw: "-bottom-1.5 -left-1.5 cursor-nesw-resize",
                                                se: "-bottom-1.5 -right-1.5 cursor-nwse-resize",
                                            };
                                            return (
                                                <div
                                                    key={handle}
                                                    className={`absolute w-3 h-3 bg-white rounded-sm shadow-lg ${positions[handle]}`}
                                                    onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, "resize", handle); }}
                                                />
                                            );
                                        })}

                                        {["n", "s", "w", "e"].map((handle) => {
                                            const isVertical = handle === "n" || handle === "s";
                                            const positions: Record<string, string> = {
                                                n: "left-1/2 -translate-x-1/2 -top-[3px] cursor-ns-resize",
                                                s: "left-1/2 -translate-x-1/2 -bottom-[3px] cursor-ns-resize",
                                                w: "top-1/2 -translate-y-1/2 -left-[3px] cursor-ew-resize",
                                                e: "top-1/2 -translate-y-1/2 -right-[3px] cursor-ew-resize",
                                            };
                                            return (
                                                <div
                                                    key={handle}
                                                    className={`absolute bg-white rounded-sm ${positions[handle]}`}
                                                    style={{ width: isVertical ? "28px" : "5px", height: isVertical ? "5px" : "28px" }}
                                                    onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, "resize", handle); }}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="w-56 shrink-0 border-l border-white/10 flex flex-col bg-[#0d0d0f]">

                            <div className="p-4 border-b border-white/10">
                                <p className="text-[10px] uppercase tracking-widest font-semibold text-white/60 mb-3">Proporción</p>
                                <div className="grid grid-cols-3 gap-1">
                                    {CROP_ASPECT_RATIOS.map((ratio) => (
                                        <div key={ratio.label} className="relative">
                                            <button
                                                onClick={() => handleAspectRatioSelect(ratio.value)}
                                                className={`w-full py-1.5 text-[11px] font-medium rounded-lg transition-all ${selectedAspectRatio === ratio.value
                                                    ? "text-white border-transparent"
                                                    : "bg-white/4 text-white/40 hover:bg-white/8 hover:text-white/70 border border-white/10"
                                                    }`}
                                                style={
                                                    selectedAspectRatio === ratio.value
                                                        ? {
                                                            background: 'radial-gradient(circle at 50% 0%, #555555 0%, #252525 64%)',
                                                            boxShadow: 'inset 0 1.01rem 0.2rem -1rem #fff0, inset 0 -1.01rem 0.2rem -1rem #0000, 0 -1.02rem 0.2rem -1rem #fff0, 0 1rem 0.2rem -1rem #0000, 0 0 0 1px #fff3, 0 4px 4px 0 #0004, 0 0 0 1px #333',
                                                        }
                                                        : {}
                                                }
                                            >
                                                {ratio.label}
                                            </button>
                                            {selectedAspectRatio === ratio.value && (
                                                <div className="absolute left-1 top-1/5 -translate-y-1/2 size-3 bg-white rounded-full blur-[5px]" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 border-b border-white/10">
                                <p className="text-[10px] uppercase tracking-widest font-semibold text-white/60 mb-3">Área</p>
                                <div className="space-y-2">
                                    {[
                                        { label: "X", value: cropArea.x },
                                        { label: "Y", value: cropArea.y },
                                        { label: "W", value: cropArea.width },
                                        { label: "H", value: cropArea.height },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="flex items-center justify-between">
                                            <span className="text-[11px] text-white/25 font-mono w-4">{label}</span>
                                            <div className="flex-1 mx-3 h-px bg-white/4" />
                                            <span className="text-[11px] font-mono text-white/50">{value.toFixed(1)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1" />

                            <div className="p-4 flex flex-col gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handleReset}
                                >
                                    Restablecer
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleApply}
                                >
                                    Aplicar recorte
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence >
    );
}
