import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
    getCachedThumbnails,
    saveThumbnailsToCache,
} from "@/lib/thumbnail-cache";

export interface VideoThumbnail {
    time: number;
    dataUrl: string;
    quality?: "low" | "high";
}

export type ThumbnailQuality = "low" | "medium" | "high" | "native";

export interface UseVideoThumbnailsOptions {
    interval?: number;
    quality?: ThumbnailQuality;
    width?: number;
    progressive?: boolean;
    videoId?: string;
}

// Quality presets for thumbnail resolution
const QUALITY_PRESETS: Record<ThumbnailQuality, number | null> = {
    low: 480,
    medium: 720,
    high: 960,
    native: null,
};

// Low quality preset for fast initial loading
const LOW_QUALITY_WIDTH = 480;

export interface UseVideoThumbnailsReturn {
    thumbnails: VideoThumbnail[];
    isGenerating: boolean;
    progress: number;
    getThumbnailForTime: (time: number) => VideoThumbnail | null;
    regenerate: () => void;
}

/**
 * Hook to generate high-quality video thumbnails for smooth scrubbing preview
 * Features:
 * - IndexedDB caching (doesn't regenerate if cached)
 * - Progressive loading (low quality first, then high quality)
 * - Background processing using requestIdleCallback
 */
export function useVideoThumbnails(
    videoUrl: string | null,
    duration: number,
    options: UseVideoThumbnailsOptions = {}
): UseVideoThumbnailsReturn {
    const {
        interval = 0.1,
        quality = "high",
        width: customWidth,
        progressive = true,
        videoId,
    } = options;

    // Separate states for low and high quality thumbnails
    const [lowQualityThumbnails, setLowQualityThumbnails] = useState<VideoThumbnail[]>([]);
    const [highQualityThumbnails, setHighQualityThumbnails] = useState<VideoThumbnail[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);

    const abortRef = useRef<boolean>(false);
    const videoElementRef = useRef<HTMLVideoElement | null>(null);

    // Merged thumbnails: prefer high quality, fallback to low quality
    const thumbnails = useMemo(() => {
        if (highQualityThumbnails.length > 0) {
            return highQualityThumbnails;
        }
        return lowQualityThumbnails;
    }, [lowQualityThumbnails, highQualityThumbnails]);

    const generateThumbnailsAtQuality = useCallback(async (
        video: HTMLVideoElement,
        canvas: HTMLCanvasElement,
        targetQuality: "low" | "high",
        targetWidth: number,
        videoDuration: number,
        onProgress: (progress: number) => void,
        onThumbnailGenerated: (thumb: VideoThumbnail) => void
    ): Promise<VideoThumbnail[]> => {
        const nativeWidth = video.videoWidth;
        const nativeHeight = video.videoHeight;
        const aspectRatio = nativeWidth / nativeHeight;

        const thumbWidth = Math.min(targetWidth, nativeWidth);
        const thumbHeight = Math.round(thumbWidth / aspectRatio);

        canvas.width = thumbWidth;
        canvas.height = thumbHeight;

        const ctx = canvas.getContext("2d", {
            alpha: false,
            willReadFrequently: false,
        });
        if (!ctx) throw new Error("Failed to get canvas context");

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = targetQuality === "high" ? "high" : "medium";

        const numThumbnails = Math.ceil(videoDuration / interval) + 1;
        const newThumbnails: VideoThumbnail[] = [];

        const supportsWebP = canvas.toDataURL("image/webp").startsWith("data:image/webp");
        const imageFormat = supportsWebP ? "image/webp" : "image/jpeg";
        const imageQuality = targetQuality === "high" ? 0.92 : 0.7;

        for (let i = 0; i < numThumbnails; i++) {
            if (abortRef.current) break;

            const time = Math.min(i * interval, videoDuration);

            video.currentTime = time;

            await new Promise<void>((resolve) => {
                const onSeeked = () => {
                    video.removeEventListener("seeked", onSeeked);
                    resolve();
                };
                video.addEventListener("seeked", onSeeked);
            });

            ctx.drawImage(video, 0, 0, thumbWidth, thumbHeight);

            const dataUrl = canvas.toDataURL(imageFormat, imageQuality);

            const thumb: VideoThumbnail = {
                time,
                dataUrl,
                quality: targetQuality,
            };
            newThumbnails.push(thumb);
            onThumbnailGenerated(thumb);
            onProgress(((i + 1) / numThumbnails) * 100);

            if (i % 3 === 0) {
                await new Promise<void>((resolve) => {
                    if ("requestIdleCallback" in window) {
                        requestIdleCallback(() => resolve(), { timeout: 16 });
                    } else {
                        setTimeout(resolve, 0);
                    }
                });
            }
        }

        return newThumbnails;
    }, [interval]);

    const generateThumbnails = useCallback(async (forceRegenerate = false) => {
        if (!videoUrl || duration <= 0) return;

        abortRef.current = false;
        setIsGenerating(true);
        setProgress(0);

        let highQualityWidth: number;
        if (customWidth) {
            highQualityWidth = customWidth;
        } else {
            const presetWidth = QUALITY_PRESETS[quality];
            highQualityWidth = presetWidth ?? 1920;
        }

        if (!forceRegenerate && videoId) {
            try {
                const cachedHigh = await getCachedThumbnails(
                    videoId,
                    quality,
                    interval
                );
                if (cachedHigh && cachedHigh.thumbnails.length > 0) {
                    const highThumbs = cachedHigh.thumbnails.map((t) => ({
                        ...t,
                        quality: "high" as const,
                    }));
                    setHighQualityThumbnails(highThumbs);
                    setProgress(100);
                    setIsGenerating(false);
                    return;
                }
            } catch (error) {
                console.warn("Cache check failed:", error);
            }
        }

        const video = document.createElement("video");
        video.src = videoUrl;
        video.crossOrigin = "anonymous";
        video.muted = true;
        video.preload = "auto";
        videoElementRef.current = video;

        const lowCanvas = document.createElement("canvas");
        const highCanvas = document.createElement("canvas");

        try {
            await new Promise<void>((resolve, reject) => {
                video.onloadedmetadata = () => resolve();
                video.onerror = () => reject(new Error("Failed to load video"));
                video.load();
            });

            if (progressive) {
                const lowThumbs: VideoThumbnail[] = [];
                await generateThumbnailsAtQuality(
                    video,
                    lowCanvas,
                    "low",
                    LOW_QUALITY_WIDTH,
                    duration,
                    (p) => setProgress(p * 0.3), // 0-30% for low quality
                    (thumb) => {
                        lowThumbs.push(thumb);
                        setLowQualityThumbnails([...lowThumbs]);
                    }
                );
            }

            if (abortRef.current) return;

            const highThumbs: VideoThumbnail[] = [];
            await generateThumbnailsAtQuality(
                video,
                highCanvas,
                "high",
                highQualityWidth,
                duration,
                (p) => setProgress(progressive ? 30 + p * 0.7 : p), // 30-100% or 0-100%
                (thumb) => {
                    highThumbs.push(thumb);
                    setHighQualityThumbnails([...highThumbs]);
                }
            );

            if (!abortRef.current && highThumbs.length > 0 && videoId) {
                try {
                    await saveThumbnailsToCache(
                        videoId,
                        quality,
                        interval,
                        highThumbs.map(({ time, dataUrl }) => ({ time, dataUrl }))
                    );
                } catch (error) {
                    console.warn("Failed to cache thumbnails:", error);
                }
            }
        } catch (error) {
            console.error("Error generating thumbnails:", error);
        } finally {
            setIsGenerating(false);
            video.src = "";
            videoElementRef.current = null;
        }
    }, [videoUrl, duration, interval, quality, customWidth, progressive, videoId, generateThumbnailsAtQuality]);

    // Generate thumbnails when video URL or videoId changes
    useEffect(() => {
        if (videoUrl && duration > 0) {
            setLowQualityThumbnails([]);
            setHighQualityThumbnails([]);
            setProgress(0);

            generateThumbnails();
        }

        return () => {
            abortRef.current = true;
        };
    }, [videoUrl, duration, videoId, generateThumbnails]);

    const getThumbnailForTime = useCallback((time: number): VideoThumbnail | null => {
        const findNearest = (thumbs: VideoThumbnail[]): VideoThumbnail | null => {
            if (thumbs.length === 0) return null;

            let left = 0;
            let right = thumbs.length - 1;

            while (left < right) {
                const mid = Math.floor((left + right) / 2);
                if (thumbs[mid].time < time) {
                    left = mid + 1;
                } else {
                    right = mid;
                }
            }

            if (left > 0) {
                const prevDiff = Math.abs(thumbs[left - 1].time - time);
                const currDiff = Math.abs(thumbs[left].time - time);
                if (prevDiff < currDiff) {
                    return thumbs[left - 1];
                }
            }

            return thumbs[left];
        };

        const highThumb = findNearest(highQualityThumbnails);
        if (highThumb) {
            const timeDiff = Math.abs(highThumb.time - time);
            if (timeDiff <= interval * 1.5) {
                return highThumb;
            }
        }

        const lowThumb = findNearest(lowQualityThumbnails);
        
        if (highThumb && lowThumb) {
            const highDiff = Math.abs(highThumb.time - time);
            const lowDiff = Math.abs(lowThumb.time - time);
            return highDiff <= lowDiff ? highThumb : lowThumb;
        }

        return highThumb || lowThumb;
    }, [lowQualityThumbnails, highQualityThumbnails, interval]);

    const regenerate = useCallback(() => {
        generateThumbnails(true);
    }, [generateThumbnails]);

    return {
        thumbnails,
        isGenerating,
        progress,
        getThumbnailForTime,
        regenerate,
    };
}
