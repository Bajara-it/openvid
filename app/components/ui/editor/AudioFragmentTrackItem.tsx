"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { motion, useMotionValue } from "framer-motion";
import type { AudioTrack, UploadedAudio } from "@/types/audio.types";
import { Icon } from "@iconify/react";

// Minimum fragment duration in seconds
const MIN_FRAGMENT_DURATION = 0.1;

interface AudioFragmentTrackItemProps {
    track: AudioTrack;
    audio: UploadedAudio | undefined;
    isSelected: boolean;
    contentWidth: number;
    videoDuration: number;
    otherTracks: AudioTrack[];
    onSelect: () => void;
    onUpdate: (updates: Partial<AudioTrack>) => void;
    onDragStateChange?: (isDragging: boolean) => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

export function AudioFragmentTrackItem({
    track,
    audio,
    isSelected,
    contentWidth,
    videoDuration,
    otherTracks,
    onSelect,
    onUpdate,
    onDragStateChange,
    onMouseEnter,
    onMouseLeave,
}: AudioFragmentTrackItemProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState<'start' | 'end' | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Motion values for smooth animations
    const fragmentX = useMotionValue(0);
    const fragmentWidth = useMotionValue(0);

    const timeToPixels = useCallback((time: number) => {
        return (time / videoDuration) * contentWidth;
    }, [videoDuration, contentWidth]);

    const pixelsToTime = useCallback((pixels: number) => {
        return (pixels / contentWidth) * videoDuration;
    }, [contentWidth, videoDuration]);

    const initialLeft = timeToPixels(track.startTime);
    const initialWidth = timeToPixels(track.duration);

    useEffect(() => {
        if (!isDragging && !isResizing) {
            fragmentX.set(initialLeft);
            fragmentWidth.set(initialWidth);
        }
    }, [initialLeft, initialWidth, isDragging, isResizing, fragmentX, fragmentWidth]);

    // Find boundaries - can't overlap with other fragments
    const boundaries = useMemo(() => {
        const sorted = [...otherTracks].sort((a, b) => a.startTime - b.startTime);

        let minStart = 0;
        let maxEnd = videoDuration;

        for (const other of sorted) {
            const otherEnd = other.startTime + other.duration;
            const trackEnd = track.startTime + track.duration;
            
            if (otherEnd <= track.startTime) {
                minStart = Math.max(minStart, otherEnd);
            }
            if (other.startTime >= trackEnd) {
                maxEnd = Math.min(maxEnd, other.startTime);
                break;
            }
        }

        return { minStart, maxEnd };
    }, [otherTracks, track.startTime, track.duration, videoDuration]);

    // Handle drag (move entire fragment)
    const handleDrag = useCallback((e: MouseEvent | TouchEvent | PointerEvent, info: { delta: { x: number } }) => {
        if (contentWidth === 0 || videoDuration === 0) return;

        const currentX = fragmentX.get();

        let newX = currentX + info.delta.x;

        const minX = timeToPixels(boundaries.minStart);
        const maxX = timeToPixels(boundaries.maxEnd - track.duration);
        newX = Math.max(minX, Math.min(maxX, newX));

        fragmentX.set(newX);
    }, [contentWidth, videoDuration, fragmentX, track.duration, boundaries, timeToPixels]);

    const handleDragStart = useCallback(() => {
        setIsDragging(true);
        onDragStateChange?.(true);
    }, [onDragStateChange]);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
        onDragStateChange?.(false);

        const newStartTime = pixelsToTime(fragmentX.get());

        onUpdate({
            startTime: Math.max(0, Math.min(videoDuration - track.duration, newStartTime)),
        });
    }, [fragmentX, pixelsToTime, track.duration, videoDuration, onUpdate, onDragStateChange]);

    // Handle resize from start
    const handleResizeStartDrag = useCallback((e: MouseEvent | TouchEvent | PointerEvent, info: { delta: { x: number } }) => {
        if (contentWidth === 0 || videoDuration === 0) return;

        const currentX = fragmentX.get();
        const currentWidth = fragmentWidth.get();

        let newX = currentX + info.delta.x;
        let newWidth = currentWidth - info.delta.x;

        const minWidth = timeToPixels(MIN_FRAGMENT_DURATION);
        if (newWidth < minWidth) {
            newWidth = minWidth;
            newX = currentX + currentWidth - minWidth;
        }

        // Clamp to boundaries (can't go before minStart)
        const minX = timeToPixels(boundaries.minStart);
        if (newX < minX) {
            const diff = minX - newX;
            newX = minX;
            newWidth = currentWidth - diff;
        }

        // Don't let duration exceed original audio duration
        if (audio && newWidth > timeToPixels(audio.duration)) {
            const diff = newWidth - timeToPixels(audio.duration);
            newX = currentX + diff;
            newWidth = timeToPixels(audio.duration);
        }

        fragmentX.set(newX);
        fragmentWidth.set(newWidth);
    }, [contentWidth, videoDuration, fragmentX, fragmentWidth, boundaries, timeToPixels, audio]);

    // Handle resize from end
    const handleResizeEndDrag = useCallback((e: MouseEvent | TouchEvent | PointerEvent, info: { delta: { x: number } }) => {
        if (contentWidth === 0 || videoDuration === 0) return;

        const currentWidth = fragmentWidth.get();

        // Calculate new width
        let newWidth = currentWidth + info.delta.x;

        // Enforce minimum duration
        const minWidth = timeToPixels(MIN_FRAGMENT_DURATION);
        newWidth = Math.max(minWidth, newWidth);

        // Clamp to boundaries (can't go past maxEnd)
        const currentX = fragmentX.get();
        const maxWidth = timeToPixels(boundaries.maxEnd) - currentX;
        newWidth = Math.min(newWidth, maxWidth);

        // Don't let duration exceed original audio duration
        if (audio) {
            newWidth = Math.min(newWidth, timeToPixels(audio.duration));
        }

        fragmentWidth.set(newWidth);
    }, [contentWidth, videoDuration, fragmentWidth, fragmentX, boundaries, timeToPixels, audio]);

    const handleResizeStart = useCallback((handle: 'start' | 'end') => {
        setIsResizing(handle);
        onDragStateChange?.(true);
    }, [onDragStateChange]);

    const handleResizeEnd = useCallback(() => {
        setIsResizing(null);
        onDragStateChange?.(false);

        // Update track with new bounds
        const newStartTime = pixelsToTime(fragmentX.get());
        const newDuration = pixelsToTime(fragmentWidth.get());

        onUpdate({
            startTime: Math.max(0, newStartTime),
            duration: Math.min(audio?.duration || videoDuration, newDuration),
        });
    }, [fragmentX, fragmentWidth, pixelsToTime, audio, videoDuration, onUpdate, onDragStateChange]);

    const isInteracting = isDragging || isResizing !== null;
    const exceedsVideoDuration = track.startTime + track.duration > videoDuration;

    return (
        <motion.div
            ref={containerRef}
            className={`absolute top-[10%] h-[80%] rounded cursor-move transition-colors flex items-center justify-center overflow-hidden ${
                isSelected
                    ? 'bg-purple-600/30 border-2 border-purple-400'
                    : 'bg-purple-600/20 border border-purple-400/40 hover:border-purple-400/60'
            } ${isInteracting ? 'z-10' : 'z-0'}`}
            style={{ x: fragmentX, width: fragmentWidth }}
            drag="x"
            dragElastic={0}
            dragMomentum={false}
            onDrag={handleDrag}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {/* Audio waveform visual */}
            <div className="absolute inset-0 flex items-center justify-center gap-0.5 px-1 opacity-30">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div
                        key={i}
                        className="w-0.5 bg-purple-300 rounded-full"
                        style={{
                            height: `${30 + Math.sin(i * 0.7) * 20 + (i % 3) * 5}%`,
                        }}
                    />
                ))}
            </div>

            {/* Icon and info */}
            <div className="relative z-10 flex flex-col items-center gap-0.5 pointer-events-none">
                <Icon icon="ph:waveform-bold" width="12" height="12" className="text-purple-300" />
                <span className="text-[8px] font-mono text-purple-300/80 max-w-full truncate px-1">
                    {audio?.name || 'Audio'}
                </span>
                {track.loop && (
                    <Icon icon="ph:repeat-bold" width="8" height="8" className="text-purple-300/60" />
                )}
                {exceedsVideoDuration && (
                    <Icon icon="ph:warning-bold" width="8" height="8" className="text-yellow-400" />
                )}
            </div>

            {/* Resize handle - Start */}
            <motion.div
                className={`absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-20 group/resize flex items-center justify-center ${
                    isResizing === 'start' ? 'bg-purple-400/50' : 'hover:bg-purple-400/30'
                }`}
                drag="x"
                dragElastic={0}
                dragMomentum={false}
                onDrag={handleResizeStartDrag}
                onDragStart={() => handleResizeStart('start')}
                onDragEnd={handleResizeEnd}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-0.5 h-4 bg-purple-300 rounded-full" />
            </motion.div>

            {/* Resize handle - End */}
            <motion.div
                className={`absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-20 group/resize flex items-center justify-center ${
                    isResizing === 'end' ? 'bg-purple-400/50' : 'hover:bg-purple-400/30'
                }`}
                drag="x"
                dragElastic={0}
                dragMomentum={false}
                onDrag={handleResizeEndDrag}
                onDragStart={() => handleResizeStart('end')}
                onDragEnd={handleResizeEnd}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-0.5 h-4 bg-purple-300 rounded-full" />
            </motion.div>
        </motion.div>
    );
}
