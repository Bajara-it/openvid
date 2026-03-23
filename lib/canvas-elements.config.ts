import type { SvgCategory, ImageCategory, ImageItem } from "@/types/canvas-elements.types";
export function getImagePreviewPath(item: { imagePath: string; previewPath?: string }): string {
    if (item.previewPath) return item.previewPath;
    return item.imagePath.replace(/\.webp$/, "-preview.webp");
}

function generateImageItems(
    folder: string,
    prefix: string,
    count: number,
    extension: string = "webp"
): ImageItem[] {
    return Array.from({ length: count }, (_, i) => {
        const num = (i + 1).toString().padStart(2, "0");
        const id = `${prefix}-${num}`;

        return {
            id: id,
            name: `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} ${num}`, // Ej: "Sticker 01"
            imagePath: `/elements/images/${folder}/${id}.${extension}`,
        };
    });
}

// Elementos SVG destacados que se muestran directamente (11 slots)
export const PINNED_SVG_ITEMS = [
    { id: "rectangle", name: "Rectángulo", icon: "ph:rectangle-bold" },
    { id: "circle", name: "Círculo", icon: "ph:circle-bold" },
    { id: "triangle", name: "Triángulo", icon: "ph:triangle-bold" },
    { id: "arrow-right", name: "Derecha", icon: "ph:arrow-right-bold" },
    { id: "star", name: "Estrella", icon: "ph:star-bold" },
    { id: "heart", name: "Corazón", icon: "ph:heart-bold" },
    { id: "hexagon", name: "Hexágono", icon: "ph:hexagon-bold" },
    { id: "lightning", name: "Rayo", icon: "ph:lightning-bold" },
    { id: "arrow-left", name: "Izquierda", icon: "ph:arrow-left-bold" },
    { id: "diamond", name: "Rombo", icon: "ph:diamond-bold" },
    { id: "chat", name: "Bocadillo", icon: "ph:chat-circle-bold" },
];

// Elementos de imagen destacados que se muestran directamente (11 slots)
export const PINNED_IMAGE_ITEMS = [
    { id: "overlay-01", name: "Lighta curve", imagePath: "/elements/images/overlays/overlay-01.webp" },
    // Add more pinned images here (up to 11 total)
];

export const SVG_CATEGORIES: SvgCategory[] = [
    {
        id: "shapes",
        title: "Básicas",
        items: [
            { id: "rectangle", name: "Rectángulo", icon: "ph:rectangle-bold" },
            { id: "circle", name: "Círculo", icon: "ph:circle-bold" },
            { id: "triangle", name: "Triángulo", icon: "ph:triangle-bold" },
            { id: "hexagon", name: "Hexágono", icon: "ph:hexagon-bold" },
            { id: "diamond", name: "Rombo", icon: "ph:diamond-bold" },
            { id: "square", name: "Cuadrado", icon: "ph:square-bold" },
            { id: "blob", name: "Blob", icon: "tabler:blob-filled" },
            { id: "blob-outline", name: "Blob outline", icon: "tabler:blob"  },
        ]
    },
    {
        id: "arrows",
        title: "Flechas",
        items: [
            { id: "arrow-right", name: "Derecha", icon: "ph:arrow-right-bold" },
            { id: "arrow-left", name: "Izquierda", icon: "ph:arrow-left-bold" },
            { id: "arrow-double", name: "Doble", icon: "ph:arrows-left-right-bold" },
            { id: "arrow-curve", name: "Curva", icon: "ph:arrow-u-up-left-bold" },
            { id: "arrow-diagonal", name: "Diagonal", icon: "ph:arrow-up-right-bold" },
            { id: "arrow-bend", name: "Ángulo", icon: "ph:arrow-bend-up-right-bold" },
            { id: "scribble", name: "Garabato" }
        ]
    },
    {
        id: "decorative",
        title: "Decorativas",
        items: [
            { id: "star", name: "Estrella", icon: "ph:star-bold" },
            { id: "heart", name: "Corazón", icon: "ph:heart-bold" },
            { id: "lightning", name: "Rayo", icon: "ph:lightning-bold" },
            { id: "chat", name: "Bocadillo", icon: "ph:chat-circle-bold" },
            { id: "seal", name: "Sello", icon: "ph:seal-bold" },
            { id: "drop", name: "Gota", icon: "ph:drop-bold" },
            { id: "splash", name: "Salpicadura"},
        ]
    }
];

export const IMAGE_CATEGORIES: ImageCategory[] = [
    {
        id: "stickers",
        title: "Stickers",
        items: [
            // Si también tienes stickers numerados (sticker-01 a sticker-15):
            ...generateImageItems("stickers", "sticker", 1)
        ]
    },
    {
        id: "overlays",
        title: "Superposiciones",
        items: [
            ...generateImageItems("overlays", "overlay", 1)
        ]
    },
    {
        id: "assets",
        title: "Recursos",
        items: [
            ...generateImageItems("assets", "asset", 0)
        ]
    }
];
