"use client";

import { useState, useRef, useEffect, useCallback, lazy, Suspense, useMemo } from "react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { loadVideoFromIndexedDB, deleteRecordedVideo } from "@/hooks/useScreenRecording";
import { useVideoUpload } from "@/hooks/useVideoUpload";
import { useVideoExport } from "@/hooks/useVideoExport";
import { useVideoThumbnails } from "@/hooks/useVideoThumbnails";
import { clearAllThumbnailCache } from "@/lib/thumbnail-cache";
import type { ExportQuality, Tool, BackgroundTab, VideoCanvasHandle, BackgroundColorConfig, AspectRatio, CropArea, ZoomFragment } from "@/types";
import type { TrimRange } from "@/types/timeline.types";
import type { MockupConfig } from "@/types/mockup.types";
import { DEFAULT_MOCKUP_CONFIG, getMockupDefaultConfig } from "@/types/mockup.types";
import type { CanvasElement } from "@/types/canvas-elements.types";
import { MOCKUPS } from "@/lib/mockup-data";
import { gradientToCss, generateDefaultZoomFragments, createZoomFragment } from "@/types";
import "../../globals.css";
import { ToolsSidebar } from "@/app/components/ui/editor/ToolsSidebar";
import { EditorTopBar } from "@/app/components/ui/editor/EditorTopBar";
import { VideoCanvas, VIDEO_Z_INDEX } from "@/app/components/ui/editor/VideoCanvas";
import { PlayerControls } from "@/app/components/ui/editor/PlayerControls";
import { findValidFragmentPosition } from "@/app/components/ui/editor/ZoomFragmentTrackItem";
import { LoadingSpinner } from "@/app/components/ui/LoadingSpinner";
import { TimelineSkeleton } from "@/app/components/ui/Skeleton";

// Lazy load heavy components
const ControlPanel = lazy(() => import("@/app/components/ui/editor/ControlPanel").then(mod => ({ default: mod.ControlPanel })));
const Timeline = lazy(() => import("@/app/components/ui/editor/Timeline").then(mod => ({ default: mod.Timeline })));
const ExportOverlay = lazy(() => import("@/app/components/ui/ExportOverlay").then(mod => ({ default: mod.ExportOverlay })));
const VideoCropperModal = lazy(() => import("@/app/components/ui/editor/VideoCropperModal").then(mod => ({ default: mod.VideoCropperModal })));


// FUERA del componente, antes de export default:
async function detectVideoHasAudio(blob: Blob): Promise<boolean> {
    try {
        const url = URL.createObjectURL(blob);
        const video = document.createElement("video");
        video.src = url;
        await new Promise<void>((resolve) => {
            video.onloadedmetadata = () => resolve();
            video.onerror = () => resolve();
        });
        // audioTracks es la API estándar — funciona en Chrome/Edge/Firefox
        const videoEl = video as HTMLVideoElement & { audioTracks?: { length: number } };
        const hasAudio = (videoEl.audioTracks?.length ?? 0) > 0;
        URL.revokeObjectURL(url);
        return hasAudio;
    } catch {
        return true; // en caso de error, asumir que tiene audio
    }
}

export default function Editor() {
    const [activeTool, setActiveTool] = useState<Tool>("screenshot");
    const [backgroundTab, setBackgroundTab] = useState<BackgroundTab>("wallpaper");
    const [selectedWallpaper, setSelectedWallpaper] = useState(0);
    const [backgroundBlur, setBackgroundBlur] = useState(0);
    const [padding, setPadding] = useState(10);
    const [roundedCorners, setRoundedCorners] = useState(10);
    const [shadows, setShadows] = useState(10);
    const [isControlPanelOpen, setIsControlPanelOpen] = useState(true);

    // Video transform state (rotation and position)
    const [videoTransform, setVideoTransform] = useState<{ rotation: number; translateX: number; translateY: number }>({
        rotation: 0,
        translateX: 0,
        translateY: 0,
    });

    // Custom background images
    const [uploadedImages, setUploadedImages] = useState<string[]>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem("openvid-uploaded-images");
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed)) {
                        return parsed;
                    }
                } catch (error) {
                    console.error("Error loading uploaded images:", error);
                }
            }
        }
        return [];
    });
    const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
    const [unsplashBgUrl, setUnsplashBgUrl] = useState<string>("");

    // Background color/gradient state
    const [backgroundColorConfig, setBackgroundColorConfig] = useState<BackgroundColorConfig | null>(null);

    // Aspect ratio, fullscreen, and cropper state
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>("auto");
    const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number } | null>(null);
    const [customDimensions, setCustomDimensions] = useState<{ width: number; height: number } | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isCropperOpen, setIsCropperOpen] = useState(false);
    const [cropArea, setCropArea] = useState<CropArea | undefined>(undefined);

    // Computed: which dimensions to use for the canvas
    const customAspectRatio = aspectRatio === "auto" ? videoDimensions : (aspectRatio === "custom" ? customDimensions : null);

    // Refs for fullscreen
    const editorAreaRef = useRef<HTMLDivElement>(null);

    // Video state
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [videoId, setVideoId] = useState<string | null>(null);
    const [videoDuration, setVideoDuration] = useState<number>(0);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<VideoCanvasHandle>(null);

    // Timeline state
    const [timelineZoom, setTimelineZoom] = useState<number>(1);
    const [isDraggingPlayhead, setIsDraggingPlayhead] = useState<boolean>(false);
    const [trimRange, setTrimRange] = useState<TrimRange>({ start: 0, end: 0 });
    const animationFrameRef = useRef<number | null>(null);
    const justEndedRef = useRef<boolean>(false);
    const wasPlayingBeforeDragRef = useRef<boolean>(false);

    const [scrubTime, setScrubTime] = useState<number>(0);

    // Zoom fragments state
    const [zoomFragments, setZoomFragments] = useState<ZoomFragment[]>([]);
    const [selectedZoomFragmentId, setSelectedZoomFragmentId] = useState<string | null>(null);

    // Ref to always have the latest zoomFragments value (prevents stale closures)
    const zoomFragmentsRef = useRef<ZoomFragment[]>([]);
    useEffect(() => {
        zoomFragmentsRef.current = zoomFragments;
    }, [zoomFragments]);

    // Mockup state
    const [mockupId, setMockupId] = useState<string>("none");
    const [mockupConfig, setMockupConfig] = useState<MockupConfig>(DEFAULT_MOCKUP_CONFIG);

    // Canvas elements state
    const [canvasElements, setCanvasElements] = useState<CanvasElement[]>([]);
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

    // Audio state
    const [uploadedAudios, setUploadedAudios] = useState<import("@/types/audio.types").UploadedAudio[]>([]);
    const [audioTracks, setAudioTracks] = useState<import("@/types/audio.types").AudioTrack[]>([]);
    const [muteOriginalAudio, setMuteOriginalAudio] = useState<boolean>(false);
    const [masterVolume, setMasterVolume] = useState<number>(1);
    const [selectedAudioTrackId, setSelectedAudioTrackId] = useState<string | null>(null);

    // Audio playback refs - store HTML Audio elements for each track
    const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

    // Initialize audio elements when tracks change
    useEffect(() => {
        const currentElements = audioElementsRef.current;
        const currentTrackIds = new Set(audioTracks.map(t => t.id));

        // Remove audio elements for deleted tracks
        for (const [trackId, audioEl] of currentElements.entries()) {
            if (!currentTrackIds.has(trackId)) {
                audioEl.pause();
                audioEl.src = '';
                currentElements.delete(trackId);
            }
        }

        // Create audio elements for new tracks
        for (const track of audioTracks) {
            if (!currentElements.has(track.id)) {
                const audio = uploadedAudios.find(a => a.id === track.audioId);
                if (audio) {
                    const audioEl = new Audio(audio.url);
                    audioEl.preload = 'auto';
                    audioEl.volume = track.volume * masterVolume;
                    currentElements.set(track.id, audioEl);
                }
            }
        }
    }, [audioTracks, uploadedAudios, masterVolume]);

    // Update audio volumes when master volume or track volumes change
    useEffect(() => {
        const currentElements = audioElementsRef.current;
        for (const track of audioTracks) {
            const audioEl = currentElements.get(track.id);
            if (audioEl) {
                audioEl.volume = track.volume * masterVolume;
            }
        }
    }, [audioTracks, masterVolume]);

    // Sync audio playback with video current time
    const syncAudioPlayback = useCallback((videoTime: number, playing: boolean) => {
        const currentElements = audioElementsRef.current;

        for (const track of audioTracks) {
            const audioEl = currentElements.get(track.id);
            if (!audioEl) continue;

            const trackStart = track.startTime;
            const trackEnd = track.startTime + track.duration;

            // Check if current video time is within this track's range
            if (videoTime >= trackStart && videoTime < trackEnd) {
                // Calculate the audio element's current time relative to track start
                const audioTime = videoTime - trackStart;

                // Only seek if there's a significant difference (avoid micro-seeks)
                if (Math.abs(audioEl.currentTime - audioTime) > 0.1) {
                    audioEl.currentTime = audioTime;
                }

                if (playing && audioEl.paused) {
                    audioEl.play().catch(() => { });
                } else if (!playing && !audioEl.paused) {
                    audioEl.pause();
                }
            } else {
                // Outside this track's range - pause if playing
                if (!audioEl.paused) {
                    audioEl.pause();
                }
            }
        }
    }, [audioTracks]);

    // Cleanup audio elements on unmount
    useEffect(() => {
        const elementsRef = audioElementsRef.current;
        return () => {
            for (const audioEl of elementsRef.values()) {
                audioEl.pause();
                audioEl.src = '';
            }
            elementsRef.clear();
        };
    }, []);

    // Handler para cambiar el mockup
    const handleMockupChange = useCallback((newMockupId: string) => {
        setMockupId(newMockupId);
        // Establecer la config por defecto del nuevo mockup
        const newMockup = MOCKUPS.find(m => m.id === newMockupId);
        setMockupConfig(getMockupDefaultConfig(newMockup));
    }, []);

    // Handler para cambiar la configuración del mockup
    const handleMockupConfigChange = useCallback((updates: Partial<MockupConfig>) => {
        setMockupConfig(prev => ({ ...prev, ...updates }));
    }, []);

    // Handler para cambiar las esquinas redondeadas (sincroniza ambos valores)
    const handleRoundedCornersChange = useCallback((value: number) => {
        setRoundedCorners(value); // Para NoneMockup y canvas general
        setMockupConfig(prev => ({ ...prev, cornerRadius: value })); // Para mockups que usan config
    }, []);

    // Canvas elements handlers
    const addCanvasElement = useCallback((element: CanvasElement) => {
        setCanvasElements(prev => [...prev, element]);
        setSelectedElementId(element.id);
    }, []);

    const updateCanvasElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
        setCanvasElements(prev => prev.map(el =>
            el.id === id ? { ...el, ...updates } as CanvasElement : el
        ));
    }, []);

    const deleteCanvasElement = useCallback((id: string) => {
        setCanvasElements(prev => prev.filter(el => el.id !== id));
        setSelectedElementId(prev => prev === id ? null : prev);
    }, []);

    const selectCanvasElement = useCallback((id: string | null) => {
        setSelectedElementId(id);
        // Auto-open elements menu when selecting an element
        if (id) {
            setActiveTool("elements");
        }
    }, []);


    // Copy/paste handlers
    const [copiedElement, setCopiedElement] = useState<CanvasElement | null>(null);

    const copySelectedElement = useCallback(() => {
        if (!selectedElementId) return;
        const element = canvasElements.find(el => el.id === selectedElementId);
        if (element) {
            setCopiedElement(element);
        }
    }, [selectedElementId, canvasElements]);

    const pasteElement = useCallback(() => {
        if (!copiedElement) return;

        const newElement = {
            ...copiedElement,
            id: `${copiedElement.type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            x: copiedElement.x + 5, // Offset slightly from original
            y: copiedElement.y + 5,
            zIndex: Date.now(),
        } as CanvasElement;

        setCanvasElements(prev => [...prev, newElement]);
        setSelectedElementId(newElement.id);
        setActiveTool("elements");
    }, [copiedElement]);

    const bringToFront = useCallback((id: string) => {
        // Get elements that are above the video (zIndex >= VIDEO_Z_INDEX)
        const aboveVideoElements = canvasElements.filter(el => el.zIndex >= VIDEO_Z_INDEX);
        const maxAboveVideo = aboveVideoElements.length > 0
            ? Math.max(...aboveVideoElements.map(el => el.zIndex))
            : VIDEO_Z_INDEX - 1;
        // Ensure the element goes above video and all other above-video elements
        updateCanvasElement(id, { zIndex: Math.max(maxAboveVideo + 1, VIDEO_Z_INDEX) });
    }, [canvasElements, updateCanvasElement]);

    const sendToBack = useCallback((id: string) => {
        const element = canvasElements.find(el => el.id === id);
        if (!element) return;

        // If element is above video (zIndex >= VIDEO_Z_INDEX), send it just behind video
        if (element.zIndex >= VIDEO_Z_INDEX) {
            const behindVideoElements = canvasElements.filter(el => el.zIndex < VIDEO_Z_INDEX);
            const minBehindVideo = behindVideoElements.length > 0
                ? Math.min(...behindVideoElements.map(el => el.zIndex))
                : VIDEO_Z_INDEX - 100;
            updateCanvasElement(id, { zIndex: Math.min(minBehindVideo - 1, VIDEO_Z_INDEX - 1) });
        } else {
            // If already behind video, send further back
            const behindVideoElements = canvasElements.filter(el => el.zIndex < VIDEO_Z_INDEX && el.id !== id);
            const minBehindVideo = behindVideoElements.length > 0
                ? Math.min(...behindVideoElements.map(el => el.zIndex))
                : element.zIndex;
            updateCanvasElement(id, { zIndex: minBehindVideo - 1 });
        }
    }, [canvasElements, updateCanvasElement]);

    // Audio handlers
    const handleAudioUpload = useCallback(async (file: File) => {
        try {
            // Create blob URL
            const url = URL.createObjectURL(file);

            // Load audio to get duration
            const audio = new Audio(url);
            await new Promise<void>((resolve, reject) => {
                audio.addEventListener('loadedmetadata', () => resolve());
                audio.addEventListener('error', () => reject(new Error('Failed to load audio')));
            });

            const newAudio: import("@/types/audio.types").UploadedAudio = {
                id: `audio-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                name: file.name,
                url,
                duration: audio.duration,
                fileSize: file.size,
                mimeType: file.type,
            };

            setUploadedAudios(prev => [...prev, newAudio]);
        } catch (error) {
            console.error('Error uploading audio:', error);
            alert('Error al subir el audio. Por favor intenta de nuevo.');
        }
    }, []);

    const handleAudioDelete = useCallback((audioId: string) => {
        // Remove from uploaded audios
        setUploadedAudios(prev => {
            const audio = prev.find(a => a.id === audioId);
            if (audio) {
                URL.revokeObjectURL(audio.url); // Clean up blob URL
            }
            return prev.filter(a => a.id !== audioId);
        });

        // Remove all tracks using this audio
        setAudioTracks(prev => prev.filter(track => track.audioId !== audioId));
    }, []);

    const handleAddAudioTrack = useCallback((audioId: string) => {
        const audio = uploadedAudios.find(a => a.id === audioId);
        if (!audio) return;

        // Check max tracks limit
        const MAX_AUDIO_TRACKS = 5;
        if (audioTracks.length >= MAX_AUDIO_TRACKS) {
            alert(`Máximo ${MAX_AUDIO_TRACKS} pistas de audio permitidas.`);
            return;
        }

        // Check if already in timeline
        if (audioTracks.some(track => track.audioId === audioId)) {
            return;
        }

        // Calculate startTime as end of last track to prevent overlapping
        const lastTrackEnd = audioTracks.reduce((max, track) =>
            Math.max(max, track.startTime + track.duration), 0);

        const newTrack: import("@/types/audio.types").AudioTrack = {
            id: `track-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            audioId,
            name: audio.name,
            startTime: lastTrackEnd,
            duration: audio.duration,
            volume: 1,
            loop: false,
        };

        setAudioTracks(prev => [...prev, newTrack]);
        if (audioTracks.length === 0) {
            setMuteOriginalAudio(true);
        }
    }, [uploadedAudios, audioTracks]);

    const handleUpdateAudioTrack = useCallback((trackId: string, updates: Partial<import("@/types/audio.types").AudioTrack>) => {
        setAudioTracks(prev => prev.map(track =>
            track.id === trackId ? { ...track, ...updates } : track
        ));
    }, []);

    const handleDeleteAudioTrack = useCallback((trackId: string) => {
        setAudioTracks(prev => {
            const remaining = prev.filter(track => track.id !== trackId);
            if (remaining.length === 0) {
                setMuteOriginalAudio(false);
            }
            return remaining;
        });
    }, []);

    const handleToggleMuteOriginalAudio = useCallback(() => {
        setMuteOriginalAudio(prev => !prev);
    }, []);

    const handleMasterVolumeChange = useCallback((volume: number) => {
        setMasterVolume(volume);
    }, []);

    // Genere Thumbnails de alta calidad y su generacion de intervalo corto para que el scrubbing se sienta instantáneo
    const { getThumbnailForTime } = useVideoThumbnails(
        videoUrl,
        videoDuration,
        {
            interval: 0.1,
            quality: "high",
            videoId: videoId || undefined,
        }
    );

    const { exportVideo, cancelExport, exportProgress } = useVideoExport(videoRef, canvasRef);
    const { uploadVideo, loadUploadedVideo, isUploading } = useVideoUpload();
    const [videoBlob, setVideoBlob] = useState<Blob | null>(null);

    const handleExport = (quality: ExportQuality) => {
        exportVideo({
            quality,
            videoBlob: videoBlob ?? undefined,
            transparentBackground: selectedWallpaper === -1,
            trim: trimRange.end > trimRange.start ? { start: trimRange.start, end: trimRange.end } : undefined,
            // Audio settings
            muteOriginalAudio,
            audioTracks: audioTracks.map(track => {
                const audio = uploadedAudios.find(a => a.id === track.audioId);
                return {
                    audioUrl: audio?.url || '',
                    startTime: track.startTime,
                    duration: track.duration,
                    volume: track.volume,
                    loop: track.loop,
                };
            }),
            masterVolume,
        });
    };
    const [videoHasAudioTrack, setVideoHasAudioTrack] = useState<boolean>(true);

    // Handler para subir video
    const handleVideoUpload = useCallback(async (file: File) => {
        setVideoBlob(file);
        detectVideoHasAudio(file).then(hasAudio => {
            setVideoHasAudioTrack(hasAudio);
            if (!hasAudio) setMuteOriginalAudio(true);
        });
        try {
            // Clear any existing recorded video and thumbnails
            await deleteRecordedVideo();
            await clearAllThumbnailCache();
        } catch (error) {
            console.warn("Failed to clear previous video:", error);
        }

        const uploadedData = await uploadVideo(file);
        if (uploadedData) {
            setVideoUrl(uploadedData.url);
            setVideoId(uploadedData.videoId);
            setVideoDuration(uploadedData.duration);
            setTrimRange({ start: 0, end: uploadedData.duration });
            setAspectRatio(uploadedData.aspectRatio);

            // Always store the actual video dimensions
            setVideoDimensions({ width: uploadedData.width, height: uploadedData.height });

            const defaultFragments = generateDefaultZoomFragments(uploadedData.duration);
            setZoomFragments(defaultFragments);

            // Reset playback state
            setCurrentTime(0);
            setIsPlaying(false);
        }
    }, [uploadVideo]);

    useEffect(() => {
        const loadVideo = async () => {
            try {
                // Try loading recorded video first
                let videoData = await loadVideoFromIndexedDB();

                // If no recorded video, try loading uploaded video
                if (!videoData) {
                    const uploadedData = await loadUploadedVideo();
                    if (uploadedData) {
                        videoData = {
                            url: uploadedData.url,
                            videoId: uploadedData.videoId,
                            duration: uploadedData.duration,
                            blob: new Blob(), // Not needed for display
                        };
                        setAspectRatio(uploadedData.aspectRatio);
                        setVideoDimensions({ width: uploadedData.width, height: uploadedData.height });
                    }
                } else if (videoData.blob && videoData.blob.size > 0) {
                    setVideoBlob(videoData.blob);
                    detectVideoHasAudio(videoData.blob).then(hasAudio => {
                        setVideoHasAudioTrack(hasAudio);
                        if (!hasAudio) setMuteOriginalAudio(true);
                    });
                }

                if (videoData) {
                    setVideoUrl(videoData.url);
                    setVideoId(videoData.videoId);
                    setVideoDuration(videoData.duration);
                    setTrimRange({ start: 0, end: videoData.duration });
                    const defaultFragments = generateDefaultZoomFragments(videoData.duration);
                    setZoomFragments(defaultFragments);
                }

            } catch (error) {
                console.error("Error loading video:", error);
            }
        };

        loadVideo();
    }, [loadUploadedVideo]);

    useEffect(() => {
        if (uploadedImages.length > 0) {
            localStorage.setItem("openvid-uploaded-images", JSON.stringify(uploadedImages));
        }
    }, [uploadedImages]);

    // Mute/unmute original video audio
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = muteOriginalAudio;
        }
    }, [muteOriginalAudio]);

    const togglePlayPause = useCallback(() => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
                // Pause all audio tracks
                syncAudioPlayback(videoRef.current.currentTime, false);
            } else {
                // When playing, ensure we start from within trim range
                if (trimRange.end > 0) {
                    const currentVideoTime = videoRef.current.currentTime;
                    // If outside trim range or at the end, jump to trim start
                    if (currentVideoTime < trimRange.start || currentVideoTime >= trimRange.end) {
                        videoRef.current.currentTime = trimRange.start;
                        setCurrentTime(trimRange.start);
                    }
                }
                videoRef.current.play();
                // Start audio playback synced with video
                syncAudioPlayback(videoRef.current.currentTime, true);
            }
            setIsPlaying(!isPlaying);
        }
    }, [isPlaying, trimRange.start, trimRange.end, syncAudioPlayback]);

    // Smooth time update using requestAnimationFrame
    const updateTimeSmoothRef = useRef<() => void>(() => { });

    useEffect(() => {
        updateTimeSmoothRef.current = () => {
            // Skip update if video just ended (prevents jump to 0)
            if (justEndedRef.current) return;

            if (videoRef.current && !isDraggingPlayhead) {
                const currentVideoTime = videoRef.current.currentTime;

                // Check if we've reached the trim end point
                if (trimRange.end > 0 && currentVideoTime >= trimRange.end) {
                    videoRef.current.pause();
                    // Stop all audio tracks
                    syncAudioPlayback(currentVideoTime, false);
                    setIsPlaying(false);
                    justEndedRef.current = true;
                    setCurrentTime(trimRange.end);
                    // Don't modify videoRef.currentTime to avoid visual jump
                    setTimeout(() => { justEndedRef.current = false; }, 300);
                    return;
                }

                setCurrentTime(currentVideoTime);
                // Sync audio playback with current video time
                syncAudioPlayback(currentVideoTime, true);
            }
            if (isPlaying && !isDraggingPlayhead) {
                animationFrameRef.current = requestAnimationFrame(updateTimeSmoothRef.current);
            }
        };
    }, [isPlaying, isDraggingPlayhead, trimRange.end, syncAudioPlayback]);

    // Start/stop animation frame loop based on playing state
    useEffect(() => {
        if (isPlaying && !isDraggingPlayhead) {
            animationFrameRef.current = requestAnimationFrame(updateTimeSmoothRef.current);
        } else {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isPlaying, isDraggingPlayhead]);

    const handleTimeUpdate = () => {
        // Only update if not using animation frame (fallback for paused state)
        // Ignore updates right after video ended to prevent reset to 0
        if (videoRef.current && !isPlaying && !justEndedRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handlePlayheadDragStart = useCallback(() => {
        setIsDraggingPlayhead(true);
        // Pause video during scrubbing for smoother experience
        if (videoRef.current && !videoRef.current.paused) {
            wasPlayingBeforeDragRef.current = true;
            videoRef.current.pause();
        } else {
            wasPlayingBeforeDragRef.current = false;
        }
    }, []);

    const handlePlayheadDragEnd = useCallback(() => {
        setIsDraggingPlayhead(false);

        if (videoRef.current) {
            videoRef.current.currentTime = scrubTime;
        }

        if (wasPlayingBeforeDragRef.current && videoRef.current) {
            videoRef.current.play();
            setIsPlaying(true);
            // Resume audio playback after drag ends
            syncAudioPlayback(scrubTime, true);
        } else {
            // Sync audio to new position (paused)
            syncAudioPlayback(scrubTime, false);
        }
    }, [scrubTime, syncAudioPlayback]);

    const handleZoomChange = useCallback((zoom: number) => {
        setTimelineZoom(zoom);
    }, []);

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            const duration = videoRef.current.duration;
            if (isFinite(duration) && duration > 0) {
                setVideoDuration(duration);
                setTrimRange(prev => prev.end === 0 ? { start: 0, end: duration } : prev);
            }
        }
    };

    const skipBackward = () => {
        if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
        }
    };

    const skipForward = () => {
        if (videoRef.current) {
            videoRef.current.currentTime = Math.min(videoDuration, videoRef.current.currentTime + 5);
        }
    };

    const handleSeek = useCallback((time: number) => {
        setScrubTime(time);
        setCurrentTime(time);

        if (videoRef.current && !isDraggingPlayhead) {
            if ('fastSeek' in videoRef.current && typeof videoRef.current.fastSeek === 'function') {
                videoRef.current.fastSeek(time);
            } else {
                videoRef.current.currentTime = time;
            }
            // Sync audio to new seek position
            syncAudioPlayback(time, isPlaying);
        }
    }, [isDraggingPlayhead, isPlaying, syncAudioPlayback]);

    const handleImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            if (dataUrl) {
                setUploadedImages(prev => [dataUrl, ...prev]);
                setSelectedImageUrl(dataUrl);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleImageSelect = (url: string) => {
        if (backgroundTab === "wallpaper") {
            // Unsplash image selected from wallpaper tab — show without switching tabs
            setUnsplashBgUrl(url);
        } else {
            setSelectedImageUrl(url);
        }
    };

    const handleWallpaperSelect = (index: number) => {
        setSelectedWallpaper(index);
        setUnsplashBgUrl(""); // Clear Unsplash override when selecting a regular wallpaper
    };

    const handleImageRemove = (url: string) => {
        setUploadedImages(prev => prev.filter(img => img !== url));
        if (selectedImageUrl === url) {
            setSelectedImageUrl("");
        }
    };

    // Background tab change handler
    const handleBackgroundTabChange = (tab: BackgroundTab) => {
        setBackgroundTab(tab);
    };

    // Handler para cambio de color/gradiente
    const handleBackgroundColorChange = (config: BackgroundColorConfig) => {
        setBackgroundColorConfig(config);
    };

    // Zoom fragment handlers
    const handleSelectZoomFragment = useCallback((fragmentId: string | null) => {
        setSelectedZoomFragmentId(fragmentId);
    }, []);

    const handleActivateZoomTool = useCallback(() => {
        setActiveTool("zoom");
    }, []);

    // Default duration for new zoom fragments
    const DEFAULT_ZOOM_FRAGMENT_DURATION = 2;

    const handleAddZoomFragment = useCallback((startTime: number) => {
        // Find valid position avoiding overlaps - use ref to get latest fragments
        const validPosition = findValidFragmentPosition(
            startTime,
            DEFAULT_ZOOM_FRAGMENT_DURATION,
            zoomFragmentsRef.current,
            videoDuration
        );

        if (!validPosition) {
            // No space available - could show a toast/notification
            console.warn("No space available for new zoom fragment");
            return;
        }

        const newFragment = createZoomFragment(validPosition.startTime, validPosition.endTime);
        setZoomFragments(prev => [...prev, newFragment].sort((a, b) => a.startTime - b.startTime));
        setSelectedZoomFragmentId(newFragment.id);
        setActiveTool("zoom"); // Switch to zoom tool when adding
    }, [videoDuration]);

    const handleUpdateZoomFragment = useCallback((fragmentId: string, updates: Partial<ZoomFragment>) => {
        setZoomFragments(prev => prev.map(f =>
            f.id === fragmentId ? { ...f, ...updates } : f
        ).sort((a, b) => a.startTime - b.startTime));
    }, []);

    const handleDeleteZoomFragment = useCallback((fragmentId: string) => {
        setZoomFragments(prev => prev.filter(f => f.id !== fragmentId));
        if (selectedZoomFragmentId === fragmentId) {
            setSelectedZoomFragmentId(null);
        }
    }, [selectedZoomFragmentId]);

    // Get currently selected zoom fragment - memoized
    const selectedZoomFragment = useMemo(() =>
        zoomFragments.find(f => f.id === selectedZoomFragmentId) || null,
        [zoomFragments, selectedZoomFragmentId]
    );

    // Calcular el CSS del background actual - memoized
    const backgroundColorCss = useMemo((): string | undefined => {
        if (backgroundTab === "color" && backgroundColorConfig) {
            if (backgroundColorConfig.type === "solid") {
                return backgroundColorConfig.config.color;
            } else {
                return gradientToCss(backgroundColorConfig.config);
            }
        }
        return undefined;
    }, [backgroundTab, backgroundColorConfig]);

    // Fullscreen toggle handler
    const toggleFullscreen = useCallback(async () => {
        if (!editorAreaRef.current) return;

        try {
            if (!document.fullscreenElement) {
                await editorAreaRef.current.requestFullscreen();
                setIsFullscreen(true);
            } else {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        } catch (error) {
            console.error("Error toggling fullscreen:", error);
        }
    }, []);

    // Listen for fullscreen changes (e.g., pressing Escape)
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    // Keyboard shortcuts for zoom fragments
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger if user is typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            // Copy element (Ctrl+C or Cmd+C)
            if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedElementId) {
                e.preventDefault();
                copySelectedElement();
                return;
            }

            // Paste element (Ctrl+V or Cmd+V)
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                e.preventDefault();
                pasteElement();
                return;
            }

            // Delete selected canvas element with Delete or Backspace
            if ((e.key === "Delete" || e.key === "Backspace") && selectedElementId) {
                e.preventDefault();
                deleteCanvasElement(selectedElementId);
                return; // Prevent zoom fragment deletion if element is selected
            }

            // Delete selected audio track with Delete or Backspace
            if ((e.key === "Delete" || e.key === "Backspace") && selectedAudioTrackId) {
                e.preventDefault();
                handleDeleteAudioTrack(selectedAudioTrackId);
                setSelectedAudioTrackId(null);
                return;
            }

            // Delete selected zoom fragment with Delete or Backspace
            if ((e.key === "Delete" || e.key === "Backspace") && selectedZoomFragmentId) {
                e.preventDefault();
                handleDeleteZoomFragment(selectedZoomFragmentId);
            }

            // Escape to deselect canvas element or zoom fragment
            if (e.key === "Escape") {
                e.preventDefault();
                if (selectedElementId) {
                    setSelectedElementId(null);
                } else if (selectedAudioTrackId) {
                    setSelectedAudioTrackId(null);
                } else if (selectedZoomFragmentId) {
                    setSelectedZoomFragmentId(null);
                }
            }

            // Don't handle spacebar here - let PlayerControls handle it to avoid conflicts
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [selectedElementId, selectedZoomFragmentId, selectedAudioTrackId, deleteCanvasElement, handleDeleteZoomFragment, handleDeleteAudioTrack, copySelectedElement, pasteElement]);

    useEffect(() => {
        const checkMobile = () => {
            if (window.innerWidth < 768) {
                setIsControlPanelOpen(false);
            }
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const handleAspectRatioChange = useCallback((ratio: AspectRatio) => {
        setAspectRatio(ratio);
    }, []);

    const handleCustomDimensionsChange = useCallback((dimensions: { width: number; height: number }) => {
        setCustomDimensions(dimensions);
    }, []);

    const handleOpenCropper = useCallback(() => {
        setIsCropperOpen(true);
    }, []);

    const handleCloseCropper = useCallback(() => {
        setIsCropperOpen(false);
    }, []);

    const handleCropApply = useCallback((crop: CropArea) => {
        setCropArea(crop);
    }, []);

    return (
        <div className="flex flex-col h-screen w-full bg-[#0E0E12] text-white/60 font-sans overflow-hidden select-none">
            <div className="flex flex-1 overflow-hidden">
                {/* Tools Sidebar */}
                <ToolsSidebar
                    activeTool={activeTool}
                    onToolChange={setActiveTool}
                    onVideoUpload={handleVideoUpload}
                    isUploading={isUploading}
                />

                {/* Control Panel */}
                <AnimatePresence mode="wait">
                    {isControlPanelOpen && (
                        <motion.div
                            key="control-panel"
                            initial={{ x: -320, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -320, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            <Suspense fallback={
                                <div className="w-[320px] h-screen bg-[#141417] border-r border-white/10 flex items-center justify-center">
                                    <LoadingSpinner message="Cargando panel..." />
                                </div>
                            }>
                                <ControlPanel
                                    activeTool={activeTool}
                                    backgroundTab={backgroundTab}
                                    onBackgroundTabChange={handleBackgroundTabChange}
                                    selectedWallpaper={selectedWallpaper}
                                    onWallpaperSelect={handleWallpaperSelect}
                                    backgroundBlur={backgroundBlur}
                                    onBackgroundBlurChange={setBackgroundBlur}
                                    padding={padding}
                                    onPaddingChange={setPadding}
                                    roundedCorners={roundedCorners}
                                    onRoundedCornersChange={handleRoundedCornersChange}
                                    shadows={shadows}
                                    onShadowsChange={setShadows}
                                    uploadedImages={uploadedImages}
                                    selectedImageUrl={selectedImageUrl}
                                    onImageUpload={handleImageUpload}
                                    onImageSelect={handleImageSelect}
                                    onImageRemove={handleImageRemove}
                                    backgroundColorConfig={backgroundColorConfig}
                                    onBackgroundColorChange={handleBackgroundColorChange}
                                    onTogglePanel={() => setIsControlPanelOpen(!isControlPanelOpen)}
                                    isOpen={isControlPanelOpen}
                                    // Zoom props
                                    zoomFragments={zoomFragments}
                                    selectedZoomFragment={selectedZoomFragment}
                                    onSelectZoomFragment={handleSelectZoomFragment}
                                    onAddZoomFragment={() => handleAddZoomFragment(currentTime)}
                                    onUpdateZoomFragment={handleUpdateZoomFragment}
                                    onDeleteZoomFragment={handleDeleteZoomFragment}
                                    videoUrl={videoUrl}
                                    videoThumbnail={selectedZoomFragment ? getThumbnailForTime(selectedZoomFragment.startTime)?.dataUrl ?? null : null}
                                    currentTime={currentTime}
                                    getThumbnailForTime={getThumbnailForTime}
                                    videoDimensions={customAspectRatio}
                                    // Mockup props
                                    mockupId={mockupId}
                                    mockupConfig={mockupConfig}
                                    onMockupChange={handleMockupChange}
                                    onMockupConfigChange={handleMockupConfigChange}
                                    // Canvas elements props
                                    onAddCanvasElement={addCanvasElement}
                                    selectedCanvasElement={canvasElements.find(el => el.id === selectedElementId) || null}
                                    onUpdateCanvasElement={updateCanvasElement}
                                    onDeleteCanvasElement={deleteCanvasElement}
                                    onBringToFront={bringToFront}
                                    onSendToBack={sendToBack}
                                    // Audio props
                                    uploadedAudios={uploadedAudios}
                                    audioTracks={audioTracks}
                                    muteOriginalAudio={muteOriginalAudio}
                                    masterVolume={masterVolume}
                                    onAudioUpload={handleAudioUpload}
                                    onAudioDelete={handleAudioDelete}
                                    onAddAudioTrack={handleAddAudioTrack}
                                    onUpdateAudioTrack={handleUpdateAudioTrack}
                                    onDeleteAudioTrack={handleDeleteAudioTrack}
                                    onToggleMuteOriginalAudio={handleToggleMuteOriginalAudio}
                                    onMasterVolumeChange={handleMasterVolumeChange}
                                    videoDuration={videoDuration}
                                    videoHasAudioTrack={videoHasAudioTrack}
                                />
                            </Suspense>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Editor Area */}
                <div
                    ref={editorAreaRef}
                    className="flex-1 bg-[#09090B] flex flex-col relative overflow-hidden"
                >
                    <AnimatePresence>
                        {!isControlPanelOpen && (
                            <motion.button
                                initial={{ x: -100, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -100, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut", delay: 0.15 }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setIsControlPanelOpen(true)}
                                className="absolute top-2 left-4 z-50 p-2 squircle-element bg-[#18181b] border border-white/10 text-white hover:bg-[#252529] transition-all duration-200 shadow-lg"
                                title="Abrir panel de control"
                            >
                                <Icon icon="lucide:sidebar-open" width="20" />
                            </motion.button>
                        )}
                    </AnimatePresence>

                    <EditorTopBar
                        onExport={handleExport}
                        exportProgress={exportProgress}
                        hasTransparentBackground={selectedWallpaper === -1}
                    />

                    {/* Video Canvas */}
                    <VideoCanvas
                        ref={canvasRef}
                        videoUrl={videoUrl}
                        videoRef={videoRef}
                        padding={padding}
                        roundedCorners={roundedCorners}
                        shadows={shadows}
                        aspectRatio={aspectRatio}
                        customAspectRatio={customAspectRatio}
                        cropArea={cropArea}
                        backgroundTab={backgroundTab}
                        selectedWallpaper={selectedWallpaper}
                        backgroundBlur={backgroundBlur}
                        selectedImageUrl={selectedImageUrl}
                        unsplashOverrideUrl={unsplashBgUrl}
                        backgroundColorCss={backgroundColorCss}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        // Scrubbing props for instant thumbnail preview
                        isScrubbing={isDraggingPlayhead}
                        scrubTime={scrubTime}
                        getThumbnailForTime={getThumbnailForTime}
                        // Zoom props
                        zoomFragments={zoomFragments}
                        currentTime={currentTime}
                        // Mockup props
                        mockupId={mockupId}
                        mockupConfig={mockupConfig ?? DEFAULT_MOCKUP_CONFIG}
                        // Video upload props
                        onVideoUpload={handleVideoUpload}
                        isUploading={isUploading}
                        // Transform props
                        videoTransform={videoTransform}
                        onVideoTransformChange={setVideoTransform}
                        // Canvas elements props
                        canvasElements={canvasElements}
                        selectedElementId={selectedElementId}
                        onElementUpdate={updateCanvasElement}
                        onElementSelect={selectCanvasElement}
                        onEnded={() => {
                            setIsPlaying(false);
                            justEndedRef.current = true;
                            const endTime = trimRange.end > 0 ? trimRange.end : videoDuration;
                            setCurrentTime(endTime);
                            setTimeout(() => {
                                justEndedRef.current = false;
                            }, 300);
                        }}
                    />

                    {/* Player Controls */}
                    <PlayerControls
                        isPlaying={isPlaying}
                        currentTime={currentTime}
                        videoDuration={videoDuration}
                        aspectRatio={aspectRatio}
                        customAspectRatio={aspectRatio === "custom" ? customDimensions : videoDimensions}
                        isFullscreen={isFullscreen}
                        zoomLevel={timelineZoom}
                        onTogglePlayPause={togglePlayPause}
                        onSkipBackward={skipBackward}
                        onSkipForward={skipForward}
                        onToggleFullscreen={toggleFullscreen}
                        onAspectRatioChange={handleAspectRatioChange}
                        onCustomAspectRatioChange={handleCustomDimensionsChange}
                        onOpenCropper={handleOpenCropper}
                        onZoomChange={handleZoomChange}
                    />

                    <Suspense fallback={<TimelineSkeleton />}>
                        <Timeline
                            videoDuration={videoDuration}
                            currentTime={currentTime}
                            onSeek={handleSeek}
                            videoUrl={videoUrl}
                            zoomLevel={timelineZoom}
                            isDraggingPlayhead={isDraggingPlayhead}
                            onDragStart={handlePlayheadDragStart}
                            onDragEnd={handlePlayheadDragEnd}
                            trimRange={trimRange}
                            onTrimChange={setTrimRange}
                            // Zoom props
                            zoomFragments={zoomFragments}
                            selectedZoomFragmentId={selectedZoomFragmentId}
                            onSelectZoomFragment={handleSelectZoomFragment}
                            onAddZoomFragment={handleAddZoomFragment}
                            onUpdateZoomFragment={handleUpdateZoomFragment}
                            onActivateZoomTool={handleActivateZoomTool}
                            // Audio props
                            audioTracks={audioTracks}
                            uploadedAudios={uploadedAudios}
                            selectedAudioTrackId={selectedAudioTrackId}
                            onSelectAudioTrack={setSelectedAudioTrackId}
                            onUpdateAudioTrack={handleUpdateAudioTrack}
                        />
                    </Suspense>

                </div>

            </div>
            <Suspense fallback={null}>
                <ExportOverlay
                    exportProgress={exportProgress}
                    onCancel={cancelExport}
                    isTransparentExport={selectedWallpaper === -1}
                />
            </Suspense>
            <Suspense fallback={null}>
                <VideoCropperModal
                    isOpen={isCropperOpen}
                    onClose={handleCloseCropper}
                    videoUrl={videoUrl}
                    onCropApply={handleCropApply}
                    initialCrop={cropArea}
                />
            </Suspense>
        </div>
    );
}