"use client";

import { useRef, useMemo, useCallback, useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { formatTime, getZoomMultiplier } from "@/lib/video.utils";
import { TIMELINE_LABEL_WIDTH, MIN_TRIM_DURATION } from "@/lib/constants";
import type { TimelineProps } from "@/types/timeline.types";
import LabelSidebar from "./LabelSidebar";
import { ZoomFragmentTrackItem, findValidFragmentPosition } from "./ZoomFragmentTrackItem";
import { AudioFragmentTrackItem } from "./AudioFragmentTrackItem";
import { Icon } from "@iconify/react";

// Default duration for new zoom fragments (in seconds)
const DEFAULT_ZOOM_FRAGMENT_DURATION = 2;

export function Timeline({
    videoDuration,
    currentTime,
    onSeek,
    videoUrl = null,
    zoomLevel,
    isDraggingPlayhead = false,
    onDragStart,
    onDragEnd,
    trimRange,
    onTrimChange,
    // Zoom props
    zoomFragments = [],
    selectedZoomFragmentId,
    onSelectZoomFragment,
    onAddZoomFragment,
    onUpdateZoomFragment,
    onActivateZoomTool,
    // Audio props
    audioTracks = [],
    uploadedAudios = [],
    selectedAudioTrackId,
    onSelectAudioTrack,
    onUpdateAudioTrack,
}: TimelineProps) {
    const trackRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [trackWidth, setTrackWidth] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isDraggingTrim, setIsDraggingTrim] = useState<'start' | 'end' | null>(null);
    const [isDraggingZoomFragment, setIsDraggingZoomFragment] = useState(false);
    const [isOverFragment, setIsOverFragment] = useState(false);

    // Use requestAnimationFrame for smooth scrubbing synced with display refresh
    const pendingSeekRef = useRef<number | null>(null);
    const rafIdRef = useRef<number | null>(null);
    const isSeekingRef = useRef<boolean>(false);
    const [isHoveringZoomRow, setIsHoveringZoomRow] = useState(false);
    const [ghostX, setGhostX] = useState(0);
    const validDuration = Number.isFinite(videoDuration) && videoDuration > 0 ? videoDuration : 0;
    // Trimmed duration for display
    const trimmedDuration = useMemo(() => {
        return trimRange.end - trimRange.start;
    }, [trimRange]);

    const TRACK_PADDING = 16;

    const contentWidth = useMemo(() => {
        if (trackWidth === 0) return 0;
        const availableWidth = trackWidth - TRACK_PADDING;
        return availableWidth * getZoomMultiplier(zoomLevel);
    }, [trackWidth, zoomLevel]);

    const playheadX = useMotionValue(0);
    const trimStartX = useMotionValue(0);
    const trimEndX = useMotionValue(0);

    // Calculate trim handle positions
    const trimStartPosition = useMemo(() => {
        if (validDuration === 0 || contentWidth === 0) return 0;
        return (trimRange.start / validDuration) * contentWidth;
    }, [trimRange.start, validDuration, contentWidth]);

    const trimEndPosition = useMemo(() => {
        if (validDuration === 0 || contentWidth === 0) return contentWidth;
        return (trimRange.end / validDuration) * contentWidth;
    }, [trimRange.end, validDuration, contentWidth]);

    // Update trim motion values when positions change
    useEffect(() => {
        if (!isDraggingTrim) {
            trimStartX.set(trimStartPosition);
            trimEndX.set(trimEndPosition);
        }
    }, [trimStartPosition, trimEndPosition, isDraggingTrim, trimStartX, trimEndX]);

    const playheadPosition = useMemo(() => {
        if (validDuration === 0 || contentWidth === 0) return 0;
        return (currentTime / validDuration) * contentWidth;
    }, [currentTime, validDuration, contentWidth]);

    useEffect(() => {
        const updateTrackWidth = () => {
            if (containerRef.current) {
                setTrackWidth(containerRef.current.clientWidth - TIMELINE_LABEL_WIDTH);
            }
        };
        updateTrackWidth();
        window.addEventListener("resize", updateTrackWidth);
        return () => window.removeEventListener("resize", updateTrackWidth);
    }, []);

    useEffect(() => {
        if (!isDragging && !isDraggingPlayhead) {
            animate(playheadX, playheadPosition, {
                type: "tween",
                duration: 0.05,
                ease: "linear"
            });
        }
    }, [playheadPosition, isDragging, isDraggingPlayhead, playheadX]);

    // Cleanup RAF on unmount
    useEffect(() => {
        return () => {
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
            }
        };
    }, []);

    const timeMarkers = useMemo(() => {
        if (validDuration === 0) return [];
        const baseInterval = validDuration / 6;
        const adjustedInterval = baseInterval / Math.sqrt(getZoomMultiplier(zoomLevel));
        const markerCount = Math.ceil(validDuration / adjustedInterval) + 1;
        return Array.from({ length: Math.min(markerCount, 50) }, (_, i) => ({
            time: adjustedInterval * i,
            position: (adjustedInterval * i / validDuration) * contentWidth
        })).filter(m => m.time <= validDuration);
    }, [validDuration, zoomLevel, contentWidth]);

    const handleTrackClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (isDragging || isDraggingTrim) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const scrollLeft = e.currentTarget.scrollLeft;
        const clickX = e.clientX - rect.left + scrollLeft;
        if (clickX >= 0 && contentWidth > 0) {
            const percentage = Math.max(0, Math.min(1, clickX / contentWidth));
            const newTime = percentage * validDuration;
            // Clamp to trim range
            const clampedTime = Math.max(trimRange.start, Math.min(trimRange.end, newTime));
            onSeek(clampedTime);
        }
    }, [contentWidth, validDuration, onSeek, isDragging, isDraggingTrim, trimRange]);

    const handleDrag = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (contentWidth === 0 || validDuration === 0) return;
        const newX = Math.max(trimStartPosition, Math.min(trimEndPosition, playheadX.get() + info.delta.x));
        playheadX.set(newX);

        const newTime = (newX / contentWidth) * validDuration;

        // Store latest position for seek
        pendingSeekRef.current = newTime;

        // Use requestAnimationFrame for smooth, display-synced seeking
        if (!isSeekingRef.current) {
            isSeekingRef.current = true;
            rafIdRef.current = requestAnimationFrame(() => {
                if (pendingSeekRef.current !== null) {
                    onSeek(pendingSeekRef.current);
                }
                isSeekingRef.current = false;
            });
        }
    }, [contentWidth, validDuration, onSeek, playheadX, trimStartPosition, trimEndPosition]);

    const handleDragStart = useCallback(() => {
        setIsDragging(true);
        pendingSeekRef.current = null;
        isSeekingRef.current = false;
        onDragStart?.();
    }, [onDragStart]);

    const handleDragEnd = useCallback(() => {
        // Cancel any pending RAF
        if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }
        // Always seek to final position on drag end (precise seek)
        if (pendingSeekRef.current !== null) {
            onSeek(pendingSeekRef.current);
            pendingSeekRef.current = null;
        }
        isSeekingRef.current = false;
        setIsDragging(false);
        onDragEnd?.();
    }, [onDragEnd, onSeek]);

    // Trim handle drag handlers
    const handleTrimStartDrag = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (contentWidth === 0 || validDuration === 0) return;

        const newX = Math.max(0, Math.min(trimEndX.get() - (MIN_TRIM_DURATION / validDuration) * contentWidth, trimStartX.get() + info.delta.x));
        trimStartX.set(newX);

        const newStartTime = (newX / contentWidth) * validDuration;
        onTrimChange({ ...trimRange, start: Math.max(0, newStartTime) });

        // If playhead is before new start, move it
        if (currentTime < newStartTime) {
            onSeek(newStartTime);
        }
    }, [contentWidth, validDuration, trimStartX, trimEndX, trimRange, onTrimChange, currentTime, onSeek]);

    const handleTrimEndDrag = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (contentWidth === 0 || validDuration === 0) return;

        const newX = Math.min(contentWidth, Math.max(trimStartX.get() + (MIN_TRIM_DURATION / validDuration) * contentWidth, trimEndX.get() + info.delta.x));
        trimEndX.set(newX);

        const newEndTime = (newX / contentWidth) * validDuration;
        onTrimChange({ ...trimRange, end: Math.min(validDuration, newEndTime) });

        // If playhead is after new end, move it
        if (currentTime > newEndTime) {
            onSeek(newEndTime);
        }
    }, [contentWidth, validDuration, trimStartX, trimEndX, trimRange, onTrimChange, currentTime, onSeek]);

    const handleTrimDragStart = useCallback((handle: 'start' | 'end') => {
        setIsDraggingTrim(handle);
    }, []);

    const handleTrimDragEnd = useCallback(() => {
        setIsDraggingTrim(null);
    }, []);

    // Auto-scroll when playhead near edge
    useEffect(() => {
        if (!containerRef.current || isDragging) return;
        const scrollableArea = containerRef.current.querySelector('[data-scrollable]') as HTMLDivElement;
        if (!scrollableArea) return;
        const visibleWidth = scrollableArea.clientWidth;
        const scrollLeft = scrollableArea.scrollLeft;
        const margin = 100;
        if (playheadPosition < scrollLeft + margin) {
            scrollableArea.scrollTo({ left: Math.max(0, playheadPosition - margin), behavior: 'smooth' });
        } else if (playheadPosition > scrollLeft + visibleWidth - margin) {
            scrollableArea.scrollTo({ left: playheadPosition - visibleWidth + margin, behavior: 'smooth' });
        }
    }, [playheadPosition, isDragging]);

    const clipLeft = trimStartPosition;
    const clipWidth = trimEndPosition - trimStartPosition;

    // Derive progress width directly from playheadX motion value for perfect sync
    const progressWidth = useTransform(
        playheadX,
        (x) => {
            if (clipWidth <= 0) return 0;
            const clampedX = Math.max(trimStartPosition, Math.min(x, trimEndPosition));
            return Math.max(0, clampedX - trimStartPosition);
        }
    );

    return (
        <div ref={containerRef} className="flex flex-col w-full">
            <div className="h-38 shrink-0 bg-[#0D0D11] border-t border-white/10 flex flex-col font-mono text-[10px]">
                <div className="flex-1 flex flex-col relative overflow-hidden">

                    {/* Label sidebar */}
                    <LabelSidebar audioTracksCount={audioTracks.length} />
                    {/* Scrollable content */}
                    <div
                        ref={trackRef}
                        data-scrollable
                        className="flex-1 flex flex-col overflow-x-auto overflow-y-hidden custom-scrollbar pl-18"
                        style={{ scrollBehavior: 'smooth' }}
                    >
                        <div style={{ width: contentWidth > 0 ? contentWidth : '100%' }} className="relative flex flex-col h-full">


                            {/* Playhead */}
                            <motion.div
                                className="absolute top-0 bottom-0 z-20 flex flex-col items-center cursor-ew-resize group select-none"
                                style={{ x: playheadX, translateX: "-50%" }}
                                drag="x"
                                dragConstraints={{ left: trimStartPosition, right: trimEndPosition }}
                                dragElastic={0}
                                dragMomentum={false}
                                onDrag={handleDrag}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                            >
                                <div className={`w-2.5 h-2.5 bg-blue-400 rotate-45 rounded-[2px] mt-[3px] shrink-0 shadow-[0_0_8px_rgba(96,165,250,0.6)] transition-colors ${isDragging ? 'bg-blue-300 scale-110' : 'group-hover:bg-blue-300'}`} />
                                <div className={`w-px flex-1 transition-colors ${isDragging ? 'bg-blue-300 w-0.5' : 'bg-blue-400 group-hover:bg-blue-300'}`} />
                            </motion.div>

                            {/* Ruler */}
                            <div
                                className="h-7 border-b border-white/10 relative shrink-0 cursor-pointer bg-zinc-900/40 select-none"
                                onClick={handleTrackClick}
                            >
                                <div
                                    className="absolute inset-0 opacity-20 pointer-events-none"
                                    style={{
                                        backgroundImage: `linear-gradient(to right, #ccc 1px, transparent 1px)`,
                                        backgroundSize: `${10 * zoomLevel}px 4px`,
                                        backgroundRepeat: 'repeat-x'
                                    }}
                                />

                                <div className="absolute inset-0 pointer-events-none">
                                    {validDuration > 0 && timeMarkers.map((marker, i) => (
                                        <div
                                            key={i}
                                            className="absolute top-0 h-full flex flex-col items-start"
                                            style={{ left: marker.position }}
                                        >
                                            <div className="w-px h-3 bg-zinc-500/60" />

                                            <span className={`text-[9px] font-mono text-zinc-500 mt-1 tabular-nums ${i === 0 ? 'ml-1' : i === timeMarkers.length - 1 ? '-ml-7' : '-ml-3'
                                                }`}>
                                                {formatTime(marker.time)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Tracks */}
                            <div className="flex-1 flex flex-col" onClick={handleTrackClick}>

                                {/* Video track */}
                                <div className="flex-1 flex items-center py-1.5 relative">
                                    <div
                                        className="h-full rounded-md flex items-center relative bg-[#0a1510] border border-white/5"
                                        style={{ width: contentWidth > 0 ? contentWidth : '100%' }}
                                    >
                                        {trimRange.start > 0 && (
                                            <div
                                                className="absolute left-0 top-0 bottom-0 bg-black/60 rounded-l-md z-10"
                                                style={{ width: trimStartPosition }}
                                            />
                                        )}
                                        {trimRange.end < validDuration && (
                                            <div
                                                className="absolute right-0 top-0 bottom-0 bg-black/60 rounded-r-md z-10"
                                                style={{ width: contentWidth - trimEndPosition }}
                                            />
                                        )}

                                        {/* Active clip region */}
                                        <div
                                            className="absolute top-0 bottom-0 rounded-md border border-[#34A853]/40 bg-[#182e20] overflow-hidden"
                                            style={{ left: clipLeft, width: Math.max(clipWidth, 20) }}
                                        >
                                            <div className="absolute inset-0 flex items-center overflow-hidden">
                                                <div className="flex h-full w-full">
                                                    {videoUrl && Array.from({ length: Math.max(1, Math.ceil(getZoomMultiplier(zoomLevel) * 3)) }).map((_, i) => (
                                                        <div
                                                            key={i}
                                                            className="h-full flex-1 border-r border-[#34A853]/10 last:border-r-0"
                                                            style={{
                                                                background: 'linear-gradient(to top, rgba(0, 0, 0, 0) 0%, rgba(20, 80, 40, 0.1) 50%, rgba(52, 168, 83, 0.1) 100%)',
                                                                boxShadow: 'inset 0px 1px 0px rgba(255, 255, 255, 0.05)'
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <motion.div
                                                className="absolute top-0 bottom-0 -left-px border-r-2 border-[#4ade80]"
                                                style={{
                                                    width: progressWidth,
                                                    background: `linear-gradient(to bottom, rgba(52, 168, 83, 0.9) 0%, rgba(34, 139, 34, 1) 50%, rgba(20, 80, 40, 1) 100%)`,
                                                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)'
                                                }}
                                            />
                                            <span className="flex items-center justify-center gap-2 text-emerald-400 text-[11px] font-medium ml-3 relative z-10 drop-shadow-sm h-full">
                                                {videoUrl ? 'Media Clip' : 'No Media'} · {formatTime(trimmedDuration)}
                                            </span>
                                        </div>

                                        {/* Trim Start Handle */}
                                        <motion.div
                                            className="absolute top-0 bottom-0 w-3 cursor-ew-resize z-20 group/trim flex items-center justify-center"
                                            style={{ x: trimStartX, translateX: "-50%" }}
                                            drag="x"
                                            dragConstraints={{ left: 0, right: contentWidth }}
                                            dragElastic={0}
                                            dragMomentum={false}
                                            onDrag={handleTrimStartDrag}
                                            onDragStart={() => handleTrimDragStart('start')}
                                            onDragEnd={handleTrimDragEnd}
                                        >
                                            <div className={`w-1.5 h-8 rounded-full transition-all ${isDraggingTrim === 'start' ? 'bg-[#4ade80] scale-110' : 'bg-[#34A853] group-hover/trim:bg-[#4ade80]'}`} />
                                        </motion.div>

                                        {/* Trim End Handle */}
                                        <motion.div
                                            className="absolute top-0 bottom-0 w-3 cursor-ew-resize z-20 group/trim flex items-center justify-center"
                                            style={{ x: trimEndX, translateX: "-50%" }}
                                            drag="x"
                                            dragConstraints={{ left: 0, right: contentWidth }}
                                            dragElastic={0}
                                            dragMomentum={false}
                                            onDrag={handleTrimEndDrag}
                                            onDragStart={() => handleTrimDragStart('end')}
                                            onDragEnd={handleTrimDragEnd}
                                        >
                                            <div className={`w-1.5 h-8 rounded-full transition-all ${isDraggingTrim === 'end' ? 'bg-[#4ade80] scale-110' : 'bg-[#34A853] group-hover/trim:bg-[#4ade80]'}`} />
                                        </motion.div>
                                    </div>
                                </div>

                                {/* Zoom track */}
                                <div
                                    className="flex-1 flex items-center border-t border-white/5 relative"
                                    onMouseMove={(e) => {
                                        if (isDraggingZoomFragment) return;
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setGhostX(e.clientX - rect.left);
                                        setIsHoveringZoomRow(true);
                                    }}
                                    onMouseLeave={() => setIsHoveringZoomRow(false)}
                                    onClick={(e) => {
                                        // Don't add if dragging or clicking on a fragment
                                        if (isOverFragment || isDraggingZoomFragment || !onAddZoomFragment || validDuration === 0 || contentWidth === 0) return;
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const clickX = e.clientX - rect.left;
                                        const clickTime = (clickX / contentWidth) * validDuration;

                                        // Find valid position (avoiding overlaps)
                                        const validPosition = findValidFragmentPosition(
                                            clickTime,
                                            DEFAULT_ZOOM_FRAGMENT_DURATION,
                                            zoomFragments,
                                            validDuration
                                        );

                                        if (validPosition) {
                                            onAddZoomFragment(validPosition.startTime);
                                        }
                                    }}
                                >
                                    <div
                                        className="h-full flex items-center relative"
                                        style={{ width: contentWidth > 0 ? contentWidth : '100%' }}
                                    >
                                        {/* Dynamic zoom fragments with drag/resize */}
                                        {zoomFragments.map((fragment) => (
                                            <ZoomFragmentTrackItem
                                                key={fragment.id}
                                                fragment={fragment}
                                                isSelected={fragment.id === selectedZoomFragmentId}
                                                contentWidth={contentWidth}
                                                videoDuration={validDuration}
                                                otherFragments={zoomFragments.filter(f => f.id !== fragment.id)}
                                                onSelect={() => {
                                                    onSelectZoomFragment?.(fragment.id);
                                                    onActivateZoomTool?.();
                                                }}
                                                onUpdate={(updates) => onUpdateZoomFragment?.(fragment.id, updates)}
                                                onDragStateChange={(dragging) => {
                                                    setIsDraggingZoomFragment(dragging);
                                                    if (dragging) {
                                                        setIsOverFragment(true);
                                                        setIsHoveringZoomRow(false);
                                                    }
                                                }}
                                                onMouseEnter={() => setIsOverFragment(true)}
                                                onMouseLeave={() => setIsOverFragment(false)}
                                            />
                                        ))}

                                        {/* Ghost fragment — follows cursor on hover (shows nearest valid position) */}
                                        {isHoveringZoomRow && !isDraggingZoomFragment && !isOverFragment && (() => {
                                            const hoverTime = (ghostX / contentWidth) * validDuration;
                                            const validPosition = findValidFragmentPosition(
                                                hoverTime,
                                                DEFAULT_ZOOM_FRAGMENT_DURATION,
                                                zoomFragments,
                                                validDuration
                                            );

                                            if (!validPosition) {
                                                // No space available at all
                                                return (
                                                    <div
                                                        className="absolute top-[10%] h-[80%] w-32 pointer-events-none"
                                                        style={{ left: ghostX - 64 }}
                                                    >
                                                        <div className="w-full h-full rounded border border-dashed border-red-400/50 bg-red-500/10 flex flex-col items-center justify-center gap-0.5">
                                                            <span className="text-[8px] font-mono text-red-400/60">No espacio</span>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            // Calculate ghost position based on valid position
                                            const ghostLeft = (validPosition.startTime / validDuration) * contentWidth;
                                            const ghostWidth = ((validPosition.endTime - validPosition.startTime) / validDuration) * contentWidth;

                                            return (
                                                <motion.div
                                                    className="absolute top-[10%] h-[80%] pointer-events-none"
                                                    initial={false}
                                                    animate={{
                                                        left: ghostLeft,
                                                        width: ghostWidth,
                                                    }}
                                                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                                                >
                                                    <div className="w-full h-full rounded border border-dashed border-blue-400/50 bg-blue-500/10 flex flex-col items-center justify-center gap-0.5">
                                                        <Icon icon="qlementine-icons:zoom-12" width="12" height="12" className="text-blue-400" />
                                                        <span className="text-[8px] font-mono text-blue-400/60">+ Zoom</span>
                                                    </div>
                                                </motion.div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Audio track - only show if there are audio tracks */}
                                {audioTracks.length > 0 && (
                                    <div className="flex-1 flex items-center border-t border-white/5 relative">
                                        <div
                                            className="h-full flex items-center relative"
                                            style={{ width: contentWidth > 0 ? contentWidth : '100%' }}
                                        >
                                            {/* Audio fragments with drag/resize */}
                                            {audioTracks.map((track) => {
                                                const audio = uploadedAudios?.find(a => a.id === track.audioId);
                                                return (
                                                    <AudioFragmentTrackItem
                                                        key={track.id}
                                                        track={track}
                                                        audio={audio}
                                                        isSelected={track.id === selectedAudioTrackId}
                                                        contentWidth={contentWidth}
                                                        videoDuration={validDuration}
                                                        otherTracks={audioTracks.filter(t => t.id !== track.id)}
                                                        onSelect={() => onSelectAudioTrack?.(track.id)}
                                                        onUpdate={(updates) => onUpdateAudioTrack?.(track.id, updates)}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}