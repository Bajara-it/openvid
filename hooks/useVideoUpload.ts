import { useCallback, useState } from "react";
import { saveUploadedVideo, getUploadedVideo, deleteUploadedVideo } from "@/lib/video-upload-cache";
import type { AspectRatio } from "@/types";

interface UploadedVideoData {
    url: string;
    videoId: string;
    duration: number;
    aspectRatio: AspectRatio;
    fileName: string;
    width: number;
    height: number;
}

interface UseVideoUploadReturn {
    uploadVideo: (file: File) => Promise<UploadedVideoData | null>;
    loadUploadedVideo: () => Promise<UploadedVideoData | null>;
    clearUploadedVideo: () => Promise<void>;
    isUploading: boolean;
    uploadError: string | null;
}

const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-matroska"];

function mapAspectRatio(ratio: string): AspectRatio {
    switch (ratio) {
        case "16:9": return "16:9";
        case "9:16": return "9:16";
        case "1:1": return "1:1";
        case "4:3": return "4:3";
        case "3:4": return "3:4";
        default: return "auto";
    }
}

export function useVideoUpload(): UseVideoUploadReturn {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const uploadVideo = useCallback(async (file: File): Promise<UploadedVideoData | null> => {
        setIsUploading(true);
        setUploadError(null);

        try {
            if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
                throw new Error("Formato de video no soportado. Use MP4, WebM o MOV.");
            }

            if (file.size > MAX_VIDEO_SIZE) {
                throw new Error("El video es demasiado grande. Máximo 500MB.");
            }

            const cachedVideo = await saveUploadedVideo(file);

            const url = URL.createObjectURL(cachedVideo.blob);
            const videoId = `uploaded-${Date.now()}`;

            return {
                url,
                videoId,
                duration: cachedVideo.duration,
                aspectRatio: mapAspectRatio(cachedVideo.aspectRatio),
                fileName: cachedVideo.fileName,
                width: cachedVideo.width,
                height: cachedVideo.height,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Error al subir el video";
            setUploadError(errorMessage);
            console.error("Video upload error:", error);
            return null;
        } finally {
            setIsUploading(false);
        }
    }, []);

    const loadUploadedVideo = useCallback(async (): Promise<UploadedVideoData | null> => {
        try {
            const cachedVideo = await getUploadedVideo();
            
            if (!cachedVideo) {
                return null;
            }

            const url = URL.createObjectURL(cachedVideo.blob);
            const videoId = `uploaded-${cachedVideo.uploadedAt}`;

            return {
                url,
                videoId,
                duration: cachedVideo.duration,
                aspectRatio: mapAspectRatio(cachedVideo.aspectRatio),
                fileName: cachedVideo.fileName,
                width: cachedVideo.width,
                height: cachedVideo.height,
            };
        } catch (error) {
            console.error("Error loading uploaded video:", error);
            return null;
        }
    }, []);

    const clearUploadedVideo = useCallback(async (): Promise<void> => {
        try {
            await deleteUploadedVideo();
        } catch (error) {
            console.error("Error clearing uploaded video:", error);
        }
    }, []);

    return {
        uploadVideo,
        loadUploadedVideo,
        clearUploadedVideo,
        isUploading,
        uploadError,
    };
}
