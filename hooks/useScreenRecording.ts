"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { RecordingState, RecordingResult, VideoData } from "@/types";
import { clearAllThumbnailCache } from "@/lib/thumbnail-cache";

// Re-export tipos para compatibilidad
export type { RecordingState, RecordingResult, VideoData };

/**
 * Generate a unique video ID
 */
function generateVideoId(): string {
  return `vid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

async function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const dbName = "FreeshotDB";
    const storeName = "videos";
    const version = 1;

    const request = indexedDB.open(dbName, version);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function saveVideoToIndexedDB(blob: Blob, duration: number): Promise<string> {
  // Clear old thumbnail cache before saving new video
  try {
    await clearAllThumbnailCache();
  } catch (e) {
    console.warn("Failed to clear thumbnail cache:", e);
  }

  const videoId = generateVideoId();
  const db = await getDB(); // Pedimos la conexión a la base de datos

  return new Promise((resolve, reject) => {
    const storeName = "videos";
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);

    const videoData = {
      blob,
      duration,
      videoId,
      timestamp: Date.now(),
    };

    const putRequest = store.put(videoData, "currentVideo");

    putRequest.onsuccess = () => {
      db.close();
      resolve(videoId);
    };

    putRequest.onerror = () => {
      db.close();
      reject(putRequest.error);
    };
  });
}

// 3. Refactorización de loadVideoFromIndexedDB
export async function loadVideoFromIndexedDB(): Promise<{ blob: Blob; duration: number; url: string; videoId: string } | null> {
  try {
    const db = await getDB(); // Pedimos la conexión a la base de datos
    const storeName = "videos";

    // Verificación de seguridad por si acaso
    if (!db.objectStoreNames.contains(storeName)) {
      db.close();
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const getRequest = store.get("currentVideo");

      getRequest.onsuccess = () => {
        db.close();
        const data = getRequest.result;
        
        if (data) {
          const url = URL.createObjectURL(data.blob);
          // Generate videoId if not exists (for backwards compatibility)
          const videoId = data.videoId || `vid_${data.timestamp || Date.now()}`;
          resolve({ blob: data.blob, duration: data.duration, url, videoId });
        } else {
          resolve(null);
        }
      };

      getRequest.onerror = () => {
        db.close();
        reject(getRequest.error);
      };
    });
  } catch (error) {
    console.error("Error al cargar video desde la base de datos:", error);
    return null; // Devolvemos null de forma segura si la DB falla al abrirse
  }
}

// Función para eliminar el video grabado de IndexedDB
export async function deleteRecordedVideo(): Promise<void> {
  try {
    const db = await getDB();
    const storeName = "videos";

    if (!db.objectStoreNames.contains(storeName)) {
      db.close();
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const deleteRequest = store.delete("currentVideo");

      deleteRequest.onsuccess = () => {
        db.close();
        resolve();
      };
      deleteRequest.onerror = () => {
        db.close();
        reject(deleteRequest.error);
      };
    });
  } catch (error) {
    throw error;
  }
}

// Favicons como data URLs para cambio dinámico
const favicons = {
  idle: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="%230E0E12" stroke="%233B82F6" stroke-width="2"/><circle cx="16" cy="16" r="6" fill="%233B82F6"/></svg>`,
  countdown: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="%230E0E12" stroke="%23FBBF24" stroke-width="2"/><circle cx="16" cy="16" r="6" fill="%23FBBF24"/></svg>`,
  recording: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="%230E0E12" stroke="%23EF4444" stroke-width="2"/><circle cx="16" cy="16" r="6" fill="%23EF4444"><animate attributeName="opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite"/></circle></svg>`,
  processing: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="%230E0E12" stroke="%2322C55E" stroke-width="2"/><circle cx="16" cy="16" r="6" fill="%2222C55E"/></svg>`,
};

const titles = {
  idle: "openvid - Crea tomas cinemáticas",
  countdown: (count: number) => `Grabando en ${count}...`,
  recording: "Grabando...",
  processing: "⏳ Procesando video...",
};

export function useScreenRecording() {
  const [state, setState] = useState<RecordingState>("idle");
  const [countdown, setCountdown] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState<number>(0);

  const router = useRouter();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const originalTitleRef = useRef<string>("");
  const faviconLinkRef = useRef<HTMLLinkElement | null>(null);
  const stateRef = useRef<RecordingState>("idle");
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const setFavicon = useCallback((type: keyof typeof favicons) => {
    if (typeof document === "undefined") return;

    if (!faviconLinkRef.current) {
      faviconLinkRef.current = document.querySelector('link[rel="icon"]');
      if (!faviconLinkRef.current) {
        faviconLinkRef.current = document.createElement("link");
        faviconLinkRef.current.rel = "icon";
        document.head.appendChild(faviconLinkRef.current);
      }
    }
    faviconLinkRef.current.href = favicons[type];
  }, []);

  const setTitle = useCallback((title: string) => {
    if (typeof document === "undefined") return;
    document.title = title;
  }, []);

  const restoreOriginals = useCallback(() => {
    setFavicon("idle");
    setTitle(originalTitleRef.current || titles.idle);
  }, [setFavicon, setTitle]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      originalTitleRef.current = document.title;
    }
  }, []);

  useEffect(() => {
    if (state === "idle") {
      restoreOriginals();
    } else if (state === "countdown") {
      setFavicon("countdown");
      setTitle(titles.countdown(countdown));
    } else if (state === "recording") {
      setFavicon("recording");
      const timeStr = recordingTime.toString().padStart(2, '0');
      setTitle(`Grabando ${timeStr}s`);
    } else if (state === "processing") {
      setFavicon("processing");
      setTitle(titles.processing);
    }
  }, [state, countdown, recordingTime, setFavicon, setTitle, restoreOriginals]);

  useEffect(() => {
    if (state === "recording") {
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      if (state === "idle") {
        setRecordingTime(0);
      }
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [state]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Iniciar la grabación real
  const startRecording = useCallback((stream: MediaStream) => {
    try {
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      const codecOptions = [
        { mimeType: "video/webm;codecs=vp9,opus" },
        { mimeType: "video/webm;codecs=vp8,opus" },
        { mimeType: "video/webm;codecs=vp9" },
        { mimeType: "video/webm;codecs=vp8" },
        { mimeType: "video/webm" },
      ];

      let mediaRecorder: MediaRecorder | null = null;

      for (const options of codecOptions) {
        try {
          if (MediaRecorder.isTypeSupported(options.mimeType)) {
            mediaRecorder = new MediaRecorder(stream, options);
            console.log(`Using codec: ${options.mimeType}`);
            break;
          }
        } catch (e) {
          console.warn(`Failed to create MediaRecorder with ${options.mimeType}:`, e);
        }
      }

      if (!mediaRecorder) {
        try {
          mediaRecorder = new MediaRecorder(stream);
          console.log("Using default MediaRecorder settings");
        } catch {
          throw new Error("No se pudo crear MediaRecorder con ninguna configuración");
        }
      }

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        setError("Error durante la grabación");
        setState("idle");
        restoreOriginals();
      };

      mediaRecorder.onstop = async () => {
        setState("processing");

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const duration = (Date.now() - startTimeRef.current) / 1000;

        try {
          await saveVideoToIndexedDB(blob, duration);

          router.push("/editor");
        } catch (error) {
          console.error("Error al guardar video:", error);
          setError("Error al procesar el video");
          setState("idle");
          restoreOriginals();
        }
      };

      try {
        mediaRecorder.start(1000);
        setState("recording");
      } catch (e) {
        console.error("Error starting MediaRecorder:", e);
        throw new Error("No se pudo iniciar la grabación");
      }

    } catch (err) {
      console.error("Error al iniciar grabación:", err);
      setError(err instanceof Error ? err.message : "No se pudo iniciar la grabación");
      setState("idle");
      restoreOriginals();
    }
  }, [router, restoreOriginals]);

  const startCountdown = useCallback(async () => {
    try {
      setError(null);

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "browser",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      streamRef.current = stream;

      stream.getVideoTracks()[0].onended = () => {
        if (stateRef.current === "recording") {
          stopRecording();
        } else {
          setState("idle");
          restoreOriginals();
        }
      };

      setState("countdown");
      setCountdown(4);

      let count = 4;
      const countdownInterval = setInterval(() => {
        count--;
        setCountdown(count);

        if (count <= 0) {
          clearInterval(countdownInterval);
          startRecording(stream);
        }
      }, 1000);

    } catch (err) {
      console.error("Error al iniciar captura:", err);
      setError("No se pudo iniciar la captura de pantalla");
      setState("idle");
      restoreOriginals();
    }
  }, [restoreOriginals, stopRecording, startRecording]);

  const cancelRecording = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    chunksRef.current = [];
    setState("idle");
    restoreOriginals();
  }, [restoreOriginals]);

  useEffect(() => {
    if (recordingTime >= 60 && state === "recording") {
      stopRecording();
    }
  }, [recordingTime, state, stopRecording]);

  return {
    state,
    countdown,
    recordingTime,
    error,
    startCountdown,
    stopRecording,
    cancelRecording,
    isIdle: state === "idle",
    isCountdown: state === "countdown",
    isRecording: state === "recording",
    isProcessing: state === "processing",
  };
}
