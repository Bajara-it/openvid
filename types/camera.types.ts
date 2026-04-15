export type CameraShape = "circle" | "rounded" | "square";

export type CameraCorner =
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "custom";

export interface CameraPosition {
    x: number;
    y: number;
}

export interface CameraConfig {
    enabled: boolean;
    deviceId: string | null;
    shape: CameraShape;
    size: number;
    position: CameraPosition;
    corner: CameraCorner;
    mirror: boolean;
}

export interface MicrophoneConfig {
    enabled: boolean;
    deviceId: string | null;
    volume: number;
    noiseSuppression: boolean;
    echoCancellation: boolean;
}

export interface RecordingSetupConfig {
    camera: CameraConfig;
    microphone: MicrophoneConfig;
    systemAudio: boolean;
}

export interface MediaDeviceOption {
    deviceId: string;
    label: string;
    groupId: string;
}

export interface AvailableDevices {
    cameras: MediaDeviceOption[];
    microphones: MediaDeviceOption[];
}

export const DEFAULT_CAMERA_CONFIG: CameraConfig = {
    enabled: false,
    deviceId: null,
    shape: "circle",
    size: 0.18,
    position: { x: 0.95, y: 0.95 },
    corner: "bottom-right",
    mirror: true,
};

export const DEFAULT_MICROPHONE_CONFIG: MicrophoneConfig = {
    enabled: false,
    deviceId: null,
    volume: 1,
    noiseSuppression: true,
    echoCancellation: true,
};

export const DEFAULT_RECORDING_SETUP: RecordingSetupConfig = {
    camera: DEFAULT_CAMERA_CONFIG,
    microphone: DEFAULT_MICROPHONE_CONFIG,
    systemAudio: true,
};

export const CORNER_POSITIONS: Record<
    Exclude<CameraCorner, "custom">,
    CameraPosition
> = {
    "top-left": { x: 0.12, y: 0.12 },
    "top-right": { x: 0.88, y: 0.12 },
    "bottom-left": { x: 0.12, y: 0.88 },
    "bottom-right": { x: 0.88, y: 0.88 },
};

/**
 * Compute the camera bubble's pixel layout inside a container, clamped so the
 * full bubble stays inside the container regardless of position/size. Callers
 * pass container dimensions (viewport, canvas, or preview box) and get back
 * size + top-left pixel coords ready to apply as CSS or canvas draw coords.
 */
export function getCameraLayout(
    config: CameraConfig,
    containerWidth: number,
    containerHeight: number
): { size: number; left: number; top: number } {
    const shortSide = Math.min(containerWidth, containerHeight);
    const size = Math.min(
        config.size * shortSide,
        containerWidth,
        containerHeight
    );
    const half = size / 2;
    const centerX = config.position.x * containerWidth;
    const centerY = config.position.y * containerHeight;
    const left = Math.max(0, Math.min(containerWidth - size, centerX - half));
    const top = Math.max(0, Math.min(containerHeight - size, centerY - half));
    return { size, left, top };
}

export const CAMERA_SHAPES: Array<{ id: CameraShape; label: string; icon: string }> = [
    { id: "circle", label: "Círculo", icon: "solar:record-circle-bold" },
    { id: "rounded", label: "Redondeado", icon: "solar:squircle-bold" },
    { id: "square", label: "Cuadrado", icon: "solar:stop-bold" },
];

export async function enumerateMediaDevices(): Promise<AvailableDevices> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
        return { cameras: [], microphones: [] };
    }

    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return {
            cameras: devices
                .filter((d) => d.kind === "videoinput")
                .map((d) => ({
                    deviceId: d.deviceId,
                    label: d.label || "Cámara sin nombre",
                    groupId: d.groupId,
                })),
            microphones: devices
                .filter((d) => d.kind === "audioinput")
                .map((d) => ({
                    deviceId: d.deviceId,
                    label: d.label || "Micrófono sin nombre",
                    groupId: d.groupId,
                })),
        };
    } catch (err) {
        console.warn("Error al enumerar dispositivos:", err);
        return { cameras: [], microphones: [] };
    }
}

export async function requestCameraStream(
    deviceId: string | null
): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia({
        video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
        },
        audio: false,
    });
}

export async function requestMicrophoneStream(
    deviceId: string | null,
    options: { noiseSuppression: boolean; echoCancellation: boolean }
): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            noiseSuppression: options.noiseSuppression,
            echoCancellation: options.echoCancellation,
        },
    });
}
