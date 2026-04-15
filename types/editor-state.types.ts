import type { BackgroundTab, AspectRatio, BackgroundColorConfig, CropArea, ZoomFragment, AudioTrack } from "@/types";
import type { TrimRange } from "@/types/timeline.types";
import type { MockupConfig } from "@/types/mockup.types";
import type { CanvasElement } from "@/types/canvas-elements.types";
import type { CameraConfig } from "@/types/camera.types";

export interface EditorState {
    backgroundTab: BackgroundTab;
    selectedWallpaper: number;
    backgroundBlur: number;
    padding: number;
    roundedCorners: number;
    shadows: number;
    selectedImageUrl: string;
    backgroundColorConfig: BackgroundColorConfig | null;
    
    aspectRatio: AspectRatio;
    customDimensions: { width: number; height: number } | null;
    cropArea: CropArea | undefined;
    trimRange: TrimRange;
    
    zoomFragments: ZoomFragment[];
    
    mockupId: string;
    mockupConfig: MockupConfig;
    
    canvasElements: CanvasElement[];
    
    audioTracks: AudioTrack[];
    muteOriginalAudio: boolean;
    masterVolume: number;

    cameraConfig: CameraConfig | null;
}

export function createInitialEditorState(overrides?: Partial<EditorState>): EditorState {
    return {
        backgroundTab: "wallpaper",
        selectedWallpaper: 0,
        backgroundBlur: 0,
        padding: 10,
        roundedCorners: 10,
        shadows: 10,
        selectedImageUrl: "",
        backgroundColorConfig: null,
        aspectRatio: "auto",
        customDimensions: null,
        cropArea: undefined,
        trimRange: { start: 0, end: 0 },
        zoomFragments: [],
        mockupId: "none",
        mockupConfig: {
            darkMode: false,
            frameColor: "#000000",
            url: "",
            headerScale: 100,
            headerOpacity: 100,
            cornerRadius: 10,
        },
        canvasElements: [],
        audioTracks: [],
        muteOriginalAudio: false,
        masterVolume: 1,
        cameraConfig: null,
        ...overrides,
    };
}
