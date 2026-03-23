/**
 * Audio Track in Timeline
 * Represents an audio file placed in the timeline with position and volume
 */
export interface AudioTrack {
    id: string;
    audioId: string; // Reference to uploaded audio file
    name: string;
    startTime: number; // Start position in video timeline (seconds)
    duration: number; // Duration of the audio clip (seconds)
    volume: number; // 0 to 1
    loop: boolean; // Whether to loop if audio is shorter than video
}

/**
 * Uploaded Audio File
 * Represents an audio file available in the library
 */
export interface UploadedAudio {
    id: string;
    name: string;
    url: string; // Blob URL or uploaded URL
    duration: number;
    fileSize: number; // In bytes
    mimeType: string; // e.g., "audio/mp3", "audio/wav"
}

/**
 * Audio Configuration
 * Global audio settings per video
 */
export interface AudioConfig {
    muteOriginalAudio: boolean; // Whether to mute the original video audio
    tracks: AudioTrack[]; // Audio tracks in the timeline
    masterVolume: number; // Master volume for all audio tracks (0 to 1)
}

/**
 * Default audio configuration
 */
export const DEFAULT_AUDIO_CONFIG: AudioConfig = {
    muteOriginalAudio: false,
    tracks: [],
    masterVolume: 1,
};

/**
 * Supported audio formats
 */
export const SUPPORTED_AUDIO_FORMATS = [
    'audio/mpeg', // MP3
    'audio/mp3',
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/ogg',
    'audio/aac',
    'audio/m4a',
    'audio/x-m4a',
] as const;

export const SUPPORTED_AUDIO_EXTENSIONS = [
    '.mp3',
    '.wav',
    '.ogg',
    '.aac',
    '.m4a',
] as const;

/**
 * Maximum audio file size (50MB)
 */
export const MAX_AUDIO_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Maximum number of audio tracks
 */
export const MAX_AUDIO_TRACKS = 5;
