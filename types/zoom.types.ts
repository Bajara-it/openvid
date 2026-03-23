export interface ZoomFragment {
    id: string;
    startTime: number;      // Tiempo de inicio del fragmento (segundos)
    endTime: number;        // Tiempo de fin del fragmento (segundos)
    zoomLevel: number;      // Nivel de zoom (1-10, donde 5 = 2x)
    speed: number;          // Velocidad de animación (1-10)
    focusX: number;         // Punto de enfoque X (0-100%)
    focusY: number;         // Punto de enfoque Y (0-100%)
}

export interface ZoomState {
    fragments: ZoomFragment[];
    selectedFragmentId: string | null;
}

// Smoother easing for professional zoom feel (quart curves)
export function easeOutQuart(t: number): number {
    return 1 - Math.pow(1 - t, 4);
}

export interface ZoomStateCanvas {
    scale: number;
    focusX: number;
    focusY: number;
}

export interface ZoomState {
    scale: number;
    focusX: number;
    focusY: number;
}

const DEFAULT_ZOOM_LEVEL = 1.5;   // 2x zoom
const DEFAULT_ZOOM_SPEED = 4;   // Medium speed

// Helper para crear un nuevo fragmento con valores por defecto
export function createZoomFragment(
    startTime: number,
    endTime: number
): ZoomFragment {
    return {
        id: `zoom_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        startTime,
        endTime,
        zoomLevel: DEFAULT_ZOOM_LEVEL,
        speed: DEFAULT_ZOOM_SPEED,
        focusX: 50,
        focusY: 50,
    };
}

// Helper para generar fragmentos por defecto cuando carga un video
export function generateDefaultZoomFragments(
    videoDuration: number
): ZoomFragment[] {
    if (videoDuration <= 0) return [];
    
    const fragmentDuration = 2;
    const spacing = videoDuration / 3;
    
    const fragments: ZoomFragment[] = [];
    
    // Primer fragmento en el primer tercio
    const start1 = Math.max(0, spacing * 0.5);
    fragments.push(createZoomFragment(
        start1,
        Math.min(start1 + fragmentDuration, videoDuration)
    ));
    
    // Segundo fragmento en el segundo tercio
    const start2 = Math.max(0, spacing * 2);
    fragments.push(createZoomFragment(
        start2,
        Math.min(start2 + fragmentDuration, videoDuration)
    ));
    
    return fragments;
}

// Convertir zoomLevel (1-10) a factor de zoom real
export function zoomLevelToFactor(level: number): number {
    const minZoom = 1.2;
    const maxZoom = 4.0;
    const normalized = (level - 1) / 9; // 0 to 1
    return minZoom + (maxZoom - minZoom) * normalized;
}

// Convertir speed (1-10) a duración de transición en milisegundos
export function speedToTransitionMs(speed: number): number {
    const minMs = 150;   // Speed 10
    const maxMs = 2000;  // Speed 1
    const normalized = (speed - 1) / 9; // 0 to 1
    return Math.round(maxMs - (maxMs - minMs) * normalized);
}

// Easing suave para animaciones de zoom (cubic-bezier)
export const ZOOM_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

// Formatear tiempo para mostrar en UI (MM:SS)
export function formatZoomTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
