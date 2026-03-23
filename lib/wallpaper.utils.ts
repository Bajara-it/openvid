import { getWallpaperByIndex } from './wallpaper.catalog';

export function getWallpaperUrl(index: number): string {
    if (index < 0) return "";
    return getWallpaperByIndex(index)?.fullUrl ?? "";
}

export function getWallpaperPreviewUrl(index: number): string {
    if (index < 0) return "";
    return getWallpaperByIndex(index)?.previewUrl ?? "";
}
