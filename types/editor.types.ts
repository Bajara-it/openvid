import type { ZoomFragment } from "./zoom.types";
import type { CanvasElement } from "./canvas-elements.types";
import type { CursorConfig, CursorRecordingData } from "./cursor.types";

export type Tool = "screenshot" | "elements" | "audio" | "zoom" | "mockup" | "cursor" | "videos" | "camera" | "history";

export type BackgroundTab = "wallpaper" | "image" | "color";

export type AspectRatio = "auto" | "16:9" | "9:16" | "1:1" | "4:3" | "3:4" | "custom";

export interface CropArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface VideoTransform {
    rotation: number;
    translateX: number;
    translateY: number;
}

export const ASPECT_RATIO_DIMENSIONS: Record<AspectRatio, { width: number; height: number } | null> = {
    "auto": null,
    "16:9": { width: 1920, height: 1080 },
    "9:16": { width: 1080, height: 1920 },
    "1:1": { width: 1080, height: 1080 },
    "4:3": { width: 1440, height: 1080 },
    "3:4": { width: 1080, height: 1440 },
    "custom": null,
};

export interface EditorState {
    activeTool: Tool;
    backgroundTab: BackgroundTab;
    selectedWallpaper: number;
    backgroundBlur: number;
    padding: number;
    roundedCorners: number;
    shadows: number;
}

export interface VideoCanvasHandle {
    getExportCanvas: () => HTMLCanvasElement | null;
    drawFrame: () => Promise<void>;
    getPreviewContainer: () => HTMLDivElement | null;
    clearAllSelection: () => { multiIds: string[]; videoSelected: boolean };
    restoreSelectionState: (state: { multiIds: string[]; videoSelected: boolean }) => void;
}

export interface VideoThumbnail {
    time: number;
    dataUrl: string;
    quality?: "low" | "high";
}

export type MediaType = "video" | "image";

export interface VideoCanvasProps {
    mediaType?: MediaType;
    imageUrl?: string | null;
    imageRef?: React.RefObject<HTMLImageElement | null>;
    imageTransform?: {
        id: string;
        label: string;
        rotateX: number;
        rotateY: number;
        rotateZ: number;
        translateY: number;
        scale: number;
        perspective?: number;
    };
    apply3DToBackground?: boolean;
    imageMaskConfig?: import("@/types/photo.types").ImageMaskConfig;
    videoMaskConfig?: import("@/types/photo.types").ImageMaskConfig;
    onVideoMaskConfigChange?: (config: import("@/types/photo.types").ImageMaskConfig) => void;
    // Video-specific props
    videoRef: React.RefObject<HTMLVideoElement | null>;
    videoUrl: string | null;
    padding: number;
    roundedCorners: number;
    shadows: number;
    aspectRatio?: AspectRatio;
    customAspectRatio?: { width: number; height: number } | null;
    cropArea?: CropArea;
    backgroundTab?: BackgroundTab;
    selectedWallpaper?: number;
    backgroundBlur?: number;
    selectedImageUrl?: string;
    unsplashOverrideUrl?: string;
    backgroundColorCss?: string;
    onTimeUpdate: () => void;
    onLoadedMetadata: () => void;
    onEnded: () => void;
    isScrubbing?: boolean;
    scrubTime?: number;
    getThumbnailForTime?: (time: number) => VideoThumbnail | null;
    zoomFragments?: ZoomFragment[];
    currentTime?: number;
    // Mockup props
    mockupId?: string;
    mockupConfig?: import("./mockup.types").MockupConfig;
    // Video upload props
    onVideoUpload?: (file: File) => void;
    onImageUpload?: (file: File) => void;
    onImageDrop?: (files: FileList | File[]) => void;
    isUploading?: boolean;
    // Transform props
    videoTransform?: VideoTransform;
    onVideoTransformChange?: (transform: VideoTransform) => void;
    // Canvas elements props
    canvasElements?: CanvasElement[];
    selectedElementId?: string | null;
    onElementUpdate?: (id: string, updates: Partial<CanvasElement>) => void;
    onElementSelect?: (id: string | null) => void;
    onElementDelete?: (id: string | string[]) => void;
    // Cursor overlay props
    cursorConfig?: CursorConfig;
    cursorData?: CursorRecordingData;
    // Camera overlay props
    cameraUrl?: string | null;
    cameraConfig?: import("./camera.types").CameraConfig | null;
    onCameraConfigChange?: (partial: Partial<import("./camera.types").CameraConfig>) => void;
    onCameraClick?: () => void;
    // Layers panel customization
    layersPanelToolbar?: React.ReactNode;
}

export async function detectVideoHasAudio(blob: Blob): Promise<boolean> {
    try {
        const url = URL.createObjectURL(blob);

        return new Promise<boolean>((resolve) => {
            const audioCtx = new AudioContext();
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target?.result as ArrayBuffer;
                    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

                    let hasSignal = false;
                    for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
                        const data = audioBuffer.getChannelData(ch);
                        for (let i = 0; i < Math.min(data.length, 10000); i++) {
                            if (Math.abs(data[i]) > 0.001) {
                                hasSignal = true;
                                break;
                            }
                        }
                        if (hasSignal) break;
                    }

                    await audioCtx.close();
                    URL.revokeObjectURL(url);
                    resolve(hasSignal);
                } catch {
                    await audioCtx.close();
                    URL.revokeObjectURL(url);
                    resolve(false);
                }
            };

            reader.onerror = () => {
                audioCtx.close();
                URL.revokeObjectURL(url);
                resolve(false);
            };

            reader.readAsArrayBuffer(blob);
        });
    } catch {
        return true;
    }
}
