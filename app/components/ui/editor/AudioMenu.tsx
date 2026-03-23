"use client";

import { Icon } from "@iconify/react";
import { useCallback, useRef, useState } from "react";
import type { UploadedAudio, AudioTrack } from "@/types/audio.types";
import { SliderControl } from "../SliderControl";

interface AudioMenuProps {
    uploadedAudios: UploadedAudio[];
    audioTracks: AudioTrack[];
    muteOriginalAudio: boolean;
    masterVolume: number;
    videoDuration: number;
    onAudioUpload: (file: File) => void;
    onAudioDelete: (audioId: string) => void;
    onAddAudioTrack: (audioId: string) => void;
    onUpdateAudioTrack: (trackId: string, updates: Partial<AudioTrack>) => void;
    onDeleteAudioTrack: (trackId: string) => void;
    onToggleMuteOriginalAudio: () => void;
    onMasterVolumeChange: (volume: number) => void;
    videoHasAudioTrack?: boolean;
}

export function AudioMenu({
    uploadedAudios,
    audioTracks,
    muteOriginalAudio,
    masterVolume,
    videoDuration,
    onAudioUpload,
    onAudioDelete,
    onAddAudioTrack,
    onUpdateAudioTrack,
    onDeleteAudioTrack,
    onToggleMuteOriginalAudio,
    onMasterVolumeChange,
    videoHasAudioTrack = false
}: AudioMenuProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const SUPPORTED_AUDIO_FORMATS = [
            'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave',
            'audio/x-wav', 'audio/ogg', 'audio/aac', 'audio/m4a', 'audio/x-m4a'
        ];

        if (!SUPPORTED_AUDIO_FORMATS.includes(file.type) &&
            !['.mp3', '.wav', '.ogg', '.aac', '.m4a'].some(ext => file.name.toLowerCase().endsWith(ext))) {
            alert("Formato de audio no soportado. Por favor usa MP3, WAV, OGG, AAC o M4A.");
            return;
        }

        // Validate file size (50MB)
        const MAX_AUDIO_FILE_SIZE = 50 * 1024 * 1024;
        if (file.size > MAX_AUDIO_FILE_SIZE) {
            alert("El archivo es demasiado grande. El tamaño máximo es 50MB.");
            return;
        }

        onAudioUpload(file);

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }, [onAudioUpload]);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="p-4 flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center gap-2 text-white font-medium">
                <Icon icon="mdi:music-note" width="20" />
                <span>Audio</span>
            </div>

            {/* Mute Original Audio Toggle */}
            <div className="bg-[#09090B] border border-white/5 squircle-element p-3">
                <button
                    onClick={onToggleMuteOriginalAudio}
                    disabled={!videoHasAudioTrack}
                    className={`w-full flex items-center justify-between text-sm transition-colors ${!videoHasAudioTrack
                            ? "opacity-40 cursor-not-allowed text-white/40"
                            : "text-white/80 hover:text-white"
                        }`}>
                    <div className="flex items-center gap-2">
                        <Icon
                            icon={muteOriginalAudio ? "mdi:volume-off" : "mdi:volume-high"}
                            width="18"
                            className={muteOriginalAudio ? "text-red-400" : "text-blue-400"}
                        />
                        <span>Audio original</span>
                    </div>
                    <div className={`px-2 py-0.5 rounded text-xs font-medium ${muteOriginalAudio
                        ? "bg-red-500/20 text-red-400"
                        : "bg-blue-500/20 text-blue-400"
                        }`}>
                        {muteOriginalAudio ? "Silenciado" : "Activo"}
                    </div>
                </button>
            </div>

            {/* Master Volume */}
            <SliderControl
                icon="mdi:volume-medium"
                label="Volumen maestro"
                value={masterVolume * 100}
                min={0}
                max={100}
                onChange={(value: number) => onMasterVolumeChange(value / 100)}
            />

            {/* Upload Audio Button */}
            <div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".mp3,.wav,.ogg,.aac,.m4a,audio/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2"
                >
                    <Icon icon="mdi:upload" width="18" />
                    Subir audio
                </button>
                <p className="text-xs text-white/40 mt-2 text-center">
                    MP3, WAV, OGG, AAC, M4A (max 50MB)
                </p>
            </div>

            {/* Uploaded Audios Library */}
            {uploadedAudios.length > 0 && (
                <div className="flex flex-col gap-2">
                    <div className="text-xs font-medium text-white/60 flex items-center gap-2">
                        <Icon icon="mdi:folder-music" width="14" />
                        <span>BIBLIOTECA DE AUDIO ({uploadedAudios.length})</span>
                    </div>
                    <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {uploadedAudios.map((audio) => {
                            const isInTimeline = audioTracks.some(track => track.audioId === audio.id);
                            return (
                                <div
                                    key={audio.id}
                                    className="bg-[#09090B] border border-white/5 squircle-element p-3 hover:border-white/10 transition-all"
                                >
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm text-white font-medium truncate">
                                                {audio.name}
                                            </div>
                                            <div className="text-xs text-white/40 mt-0.5">
                                                {formatDuration(audio.duration)} • {formatFileSize(audio.fileSize)}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onAudioDelete(audio.id)}
                                            className="p-1.5 rounded text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                            title="Eliminar audio"
                                        >
                                            <Icon icon="mdi:delete" width="16" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => onAddAudioTrack(audio.id)}
                                        disabled={isInTimeline}
                                        className={`w-full py-1.5 px-3 rounded text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${isInTimeline
                                            ? "bg-white/5 text-white/30 cursor-not-allowed"
                                            : "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                                            }`}
                                    >
                                        <Icon icon={isInTimeline ? "mdi:check" : "mdi:plus"} width="14" />
                                        {isInTimeline ? "En línea de tiempo" : "Añadir a línea de tiempo"}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Audio Tracks in Timeline */}
            {audioTracks.length > 0 && (
                <div className="flex flex-col gap-2">
                    <div className="text-xs font-medium text-white/60 flex items-center gap-2">
                        <Icon icon="mdi:timeline-clock" width="14" />
                        <span>PISTAS EN LÍNEA DE TIEMPO ({audioTracks.length})</span>
                    </div>
                    <div className="flex flex-col gap-2">
                        {audioTracks.map((track) => {
                            const audio = uploadedAudios.find(a => a.id === track.audioId);
                            if (!audio) return null;

                            const isSelected = selectedTrackId === track.id;
                            const exceedsVideoDuration = (track.startTime + track.duration) > videoDuration;

                            return (
                                <div
                                    key={track.id}
                                    className={`bg-[#09090B] border squircle-element p-3 transition-all ${isSelected
                                        ? "border-blue-500/50 bg-blue-500/5"
                                        : "border-white/5 hover:border-white/10"
                                        }`}
                                    onClick={() => setSelectedTrackId(isSelected ? null : track.id)}
                                >
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm text-white font-medium truncate">
                                                {audio.name}
                                            </div>
                                            <div className="text-xs text-white/40 mt-0.5">
                                                Inicio: {formatDuration(track.startTime)}
                                            </div>
                                            {exceedsVideoDuration && (
                                                <div className="text-xs text-orange-400 mt-1 flex items-center gap-1">
                                                    <Icon icon="mdi:alert" width="12" />
                                                    Excede duración del video
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteAudioTrack(track.id);
                                                if (selectedTrackId === track.id) {
                                                    setSelectedTrackId(null);
                                                }
                                            }}
                                            className="p-1.5 rounded text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                            title="Quitar de línea de tiempo"
                                        >
                                            <Icon icon="mdi:close" width="16" />
                                        </button>
                                    </div>

                                    {isSelected && (
                                        <div className="flex flex-col gap-3 pt-2 border-t border-white/5 animate-in fade-in duration-150">
                                            <SliderControl
                                                icon="mdi:volume-medium"
                                                label="Volumen"
                                                value={track.volume * 100}
                                                min={0}
                                                max={100}
                                                onChange={(value: number) => onUpdateAudioTrack(track.id, { volume: value / 100 })}
                                            />

                                            <div className="flex items-center justify-between">
                                                <label className="text-xs text-white/60 flex items-center gap-1.5">
                                                    <Icon icon="mdi:repeat" width="14" />
                                                    Repetir
                                                </label>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onUpdateAudioTrack(track.id, { loop: !track.loop });
                                                    }}
                                                    className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${track.loop
                                                        ? "bg-blue-500/20 text-blue-400"
                                                        : "bg-white/5 text-white/40 hover:bg-white/10"
                                                        }`}
                                                >
                                                    {track.loop ? "Activado" : "Desactivado"}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {uploadedAudios.length === 0 && (
                <div className="text-center py-8 px-4 text-white/40">
                    <Icon icon="mdi:music-note-off" width="48" className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No hay audios subidos</p>
                    <p className="text-xs mt-1">Sube un archivo de audio para comenzar</p>
                </div>
            )}
        </div>
    );
}