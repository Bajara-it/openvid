import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ExportQuality } from "@/hooks/useVideoExport";
import { useState } from "react";

interface ExportProgress {
    status: "idle" | "preparing" | "encoding" | "finalizing" | "complete" | "error";
    progress: number;
    message: string;
}

interface ExportDropdownProps {
    onExport: (quality: ExportQuality) => void;
    exportProgress: ExportProgress;
    hasTransparentBackground?: boolean;
}

export function ExportDropdown({ onExport, exportProgress, hasTransparentBackground }: ExportDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const isExporting = exportProgress.status !== "idle" &&
        exportProgress.status !== "complete" &&
        exportProgress.status !== "error";

    const isTransparent = !!hasTransparentBackground;

    const handleExport = (quality: ExportQuality) => {
        setIsOpen(false);
        onExport(quality);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="primary"
                    className="px-3 py-2 text-sm gap-2 min-w-27.5"
                    size="sm"
                    disabled={isExporting}
                >
                    <Icon icon="icon-park-outline:export" width="18" />
                    Exportar
                    <Icon icon="mdi:chevron-down" width="16" className="opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="end"
                className="w-72 bg-[#1C1C1F] border-white/10 text-white shadow-2xl p-0 overflow-hidden"
            >
                <div className="flex flex-col bg-black border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                    <div className="px-4 py-3 border-b border-white/10 bg-white/5">
                        <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/50">Calidad de exportación
                        </span>
                    </div>

                    <div className="flex flex-col max-h-120 overflow-y-auto custom-scrollbar">
                        <button
                            className={`group flex flex-col items-start gap-1.5 p-4 transition-all text-left border-b border-white/10 ${isTransparent ? "hover:bg-cyan-500/5" : "hover:bg-white/5"}`}
                            onClick={() => handleExport("4k")}
                        >
                            <div className="flex items-center justify-between w-full">
                                <span className="text-sm font-medium transition-colors text-white group-hover:text-blue-400">
                                    {isTransparent ? (
                                        <>
                                            4K WebM · <span className="text-cyan-400 group-hover:text-cyan-300">sin fondo</span>
                                        </>
                                    ) : (
                                        "4K Ultra HD"
                                    )}
                                </span>
                            </div>
                            <span className="text-[11px] font-mono text-white/50">
                                {isTransparent ? (
                                    <>
                                        3840 × 2160 · <span className="text-cyan-400/70">VP9 Alpha</span>
                                    </>
                                ) : (
                                    "3840 × 2160 • Máxima fidelidad"
                                )}
                            </span>
                        </button>

                        <button
                            className={`group flex flex-col items-start gap-1.5 p-4 transition-all text-left border-b border-white/10 ${isTransparent ? "hover:bg-cyan-500/5" : "hover:bg-white/5"}`}
                            onClick={() => handleExport("2k")}
                        >
                            <div className="flex items-center justify-between w-full">
                                <span className="text-sm font-medium transition-colors text-white group-hover:text-white/80">
                                    {isTransparent ? (
                                        <>2K WebM · <span className="text-cyan-400 group-hover:text-cyan-300">sin fondo</span></>
                                    ) : (
                                        "2K Quad HD"
                                    )}
                                </span>
                                {/* <span className="border border-white/10 text-white/50 text-[9px] px-2 py-0.5 rounded-full font-bold">
                                    PREMIUM
                                </span> */}
                            </div>
                            <span className="text-[11px] font-mono text-white/50">
                                {isTransparent ? (
                                    <>2560 × 1440 · <span className="text-cyan-400/70">VP9 Alpha</span></>
                                ) : (
                                    "2560 × 1440 • Balance ideal"
                                )}
                            </span>
                        </button>

                        {/* BOTÓN 1080p */}
                        <button
                            className={`group flex flex-col items-start gap-1.5 p-4 transition-all text-left border-b border-white/10 ${isTransparent ? "hover:bg-cyan-500/5" : "hover:bg-white/5"}`}
                            onClick={() => handleExport("1080p")}
                        >
                            <div className="flex items-center justify-between w-full">
                                <span className="text-sm font-medium transition-colors text-white group-hover:text-white/80">
                                    {isTransparent ? (
                                        <>1080p WebM · <span className="text-cyan-400 group-hover:text-cyan-300">sin fondo</span></>
                                    ) : (
                                        "1080p Full HD"
                                    )}
                                </span>
                                <span className="border border-blue-500/30 text-blue-400 text-[9px] px-2 py-0.5 rounded-full font-bold tracking-tight">
                                    RECOMENDADO
                                </span>
                            </div>

                            <span className="text-[11px] font-mono text-white/50">
                                {isTransparent ? (
                                    <>1920 × 1080 · <span className="text-cyan-400/70">VP9 Alpha</span></>
                                ) : (
                                    "1920 × 1080 • Estándar web"
                                )}
                            </span>

                        </button>

                        {/* BOTÓN 720p */}
                        <button
                            className={`group flex flex-col items-start gap-1.5 p-4 transition-all text-left border-b border-white/10 ${isTransparent ? "hover:bg-cyan-500/5" : "hover:bg-white/5"}`}
                            onClick={() => handleExport("720p")}
                        >
                            <span className="text-sm font-medium transition-colors text-white group-hover:text-white/80">
                                {isTransparent ? (
                                    <>720p WebM · <span className="text-cyan-400 group-hover:text-cyan-300">sin fondo</span></>
                                ) : (
                                    "720p HD"
                                )}
                            </span>
                            <span className="text-[11px] font-mono text-white/50">
                                {isTransparent ? (
                                    <>1280 × 720 · <span className="text-cyan-400/70">VP9 Alpha</span></>
                                ) : (
                                    "1280 × 720 • Archivo ligero"
                                )}
                            </span>
                        </button>

                        <button
                            className={`group flex flex-col items-start gap-1.5 p-4 transition-all text-left border-b border-white/10 ${isTransparent ? "hover:bg-cyan-500/5" : "hover:bg-white/5"}`}
                            onClick={() => handleExport("480p")}
                        >
                            <span className="text-sm font-medium transition-colors text-white group-hover:text-white/80">
                                {isTransparent ? (
                                    <>480p WebM · <span className="text-cyan-400 group-hover:text-cyan-300">sin fondo</span></>
                                ) : (
                                    "480p SD"
                                )}
                            </span>
                            <span className="text-[11px] font-mono text-white/50">
                                {isTransparent ? (
                                    <>854 × 480 · <span className="text-cyan-400/70">VP9 Alpha</span></>
                                ) : (
                                    "854 × 480 • Calidad borrador"
                                )}
                            </span>
                        </button>
                        <button
                            className={`group flex flex-col items-start gap-1.5 p-4 transition-all text-left border-b border-white/10 ${isTransparent ? "opacity-80 hover:bg-orange-500/5" : "hover:bg-orange-500/5"}`}
                            onClick={() => handleExport("gif")}
                        >
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-orange-400 group-hover:text-orange-300 transition-colors">
                                        GIF Animado
                                    </span>
                                    <div className="h-1.5 w-1.5 rounded-full bg-orange-500/50"></div>
                                    {!isTransparent && (
                                        <span className="text-[9px] bg-orange-500/10 text-orange-400/80 px-1.5 py-0.5 rounded border border-orange-500/20 font-bold uppercase tracking-tighter">
                                            Color Paletted
                                        </span>
                                    )}
                                </div>

                                {isTransparent && (
                                    <span className="text-[9px] text-red-400/80 font-bold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                                        FONDO SÓLIDO
                                    </span>
                                )}
                            </div>

                            <span className="text-[11px] font-mono text-orange-400/70">
                                {isTransparent
                                    ? "1280 × 720 · Fondo negro sólido"
                                    : "1280 × 720 • Loop sin audio"}
                            </span>
                        </button>

                    </div>
                </div>
            </PopoverContent>
        </Popover >
    );
}