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
    mockupId?: string;
    mockupConfig?: import("./mockup.types").MockupConfig;
    onVideoUpload?: (file: File) => void;
    onImageUpload?: (file: File) => void;
    onImageDrop?: (files: FileList | File[]) => void;
    isUploading?: boolean;
    videoTransform?: VideoTransform;
    onVideoTransformChange?: (transform: VideoTransform) => void;
    canvasElements?: CanvasElement[];
    selectedElementId?: string | null;
    onElementUpdate?: (id: string, updates: Partial<CanvasElement>) => void;
    onElementSelect?: (id: string | null) => void;
    onElementDelete?: (id: string | string[]) => void;
    cursorConfig?: CursorConfig;
    cursorData?: CursorRecordingData;
    cameraUrl?: string | null;
    cameraConfig?: import("./camera.types").CameraConfig | null;
    onCameraConfigChange?: (partial: Partial<import("./camera.types").CameraConfig>) => void;
    onCameraClick?: () => void;
    layersPanelToolbar?: React.ReactNode;
    textToolActive?: boolean;
    onTextToolDeactivate?: () => void;
    onAddElement?: (element: CanvasElement) => void;
}

export async function detectVideoHasAudio(blob: Blob): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
        const url = URL.createObjectURL(blob);
        const video = document.createElement("video");
        video.muted = true;
        video.preload = "auto";
        let settled = false;

        const cleanup = (result: boolean) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeoutId);
            URL.revokeObjectURL(url);
            video.src = "";
            resolve(result);
        };

        const timeoutId = setTimeout(() => cleanup(false), 8000);

        const checkAudio = (afterData: boolean) => {
            const v = video as HTMLVideoElement & {
                audioTracks?: { length: number };
                mozHasAudio?: boolean;
                webkitAudioDecodedByteCount?: number;
            };

            if (afterData && typeof v.webkitAudioDecodedByteCount === "number") {
                return cleanup(v.webkitAudioDecodedByteCount > 0);
            }

            if (v.audioTracks !== undefined && v.audioTracks.length > 0) {
                return cleanup(true);
            }

            if (v.mozHasAudio !== undefined) {
                return cleanup(Boolean(v.mozHasAudio));
            }

            if (!afterData) return;

            cleanup(false);
        };

        video.addEventListener("loadedmetadata", () => checkAudio(false));
        video.addEventListener("loadeddata", () => checkAudio(true));
        video.addEventListener("error", () => cleanup(false));
        video.src = url;
    });
}
