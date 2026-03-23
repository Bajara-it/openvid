export type CanvasElementType = "svg" | "image" | "text";

export interface CanvasElementBase {
    id: string;
    type: CanvasElementType;
    x: number; // Position in percentage (0-100)
    y: number; // Position in percentage (0-100)
    width: number; // Size in percentage
    height: number; // Size in percentage
    rotation: number; // Rotation in degrees
    opacity: number; // 0-100
    zIndex: number; // Stacking order
}

export interface SvgElement extends CanvasElementBase {
    type: "svg";
    category: string; // e.g., "shapes", "arrows", "decorative"
    svgId: string; // ID that maps to inline SVG component
    color?: string; // Fill color (optional)
}
    
export interface ImageElement extends CanvasElementBase {
    type: "image";
    category: string; // e.g., "stickers", "superposiciones", "desenfoques"
    imagePath: string; // Path to image file in public folder
}

export interface TextElement extends CanvasElementBase {
    type: "text";
    content: string;
    fontSize: number; // Base size (will be scaled)
    fontFamily: string;
    fontWeight: "normal" | "medium" | "bold";
    color: string;
}

export type CanvasElement = SvgElement | ImageElement | TextElement;

export interface SvgCategory {
    id: string;
    title: string;
    items: SvgItem[];
}

export interface SvgItem {
    id: string;
    name: string;
    icon?: string;
}

export interface ImageCategory {
    id: string;
    title: string;
    items: ImageItem[];
}

export interface ImageItem {
    id: string;
    name: string;
    imagePath: string;
    previewPath?: string;
}

export interface ElementsMenuProps {
    onAddElement: (element: CanvasElement) => void;
    selectedElement?: CanvasElement | null;
    onUpdateElement?: (id: string, updates: Partial<CanvasElement>) => void;
    onDeleteElement?: (id: string) => void;
    onBringToFront?: (id: string) => void;
    onSendToBack?: (id: string) => void;
}

export const PRESET_COLORS = ["#FFFFFF", "#000000", "#FF0000", "#00FF00", "#0000FF"];

export const TEXT_PRESETS = [
    { label: "Título", fontSize: 48, weight: "bold", sample: "Título" },
    { label: "Subtítulo", fontSize: 32, weight: "medium", sample: "Subtítulo" },
    { label: "Cuerpo", fontSize: 24, weight: "normal", sample: "Texto de cuerpo" },
    { label: "Caption", fontSize: 18, weight: "normal", sample: "Caption" },
] as const;

export const FONT_FAMILIES = ["Inter", "Roboto", "Arial", "Georgia", "Courier New", "Comic Sans MS"];

export const FONT_WEIGHTS = [
    { key: "normal", label: "Regular" },
    { key: "medium", label: "Medium" },
    { key: "bold", label: "Bold" },
] as const;