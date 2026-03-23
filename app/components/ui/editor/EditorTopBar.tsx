"use client";

import { Icon } from "@iconify/react";
import { ExportDropdown } from "../ExportDropdown";
import type { ExportQuality, ExportProgress } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEffect, useState } from "react";

interface EditorTopBarProps {
    onExport: (quality: ExportQuality) => void;
    exportProgress: ExportProgress;
    hasTransparentBackground?: boolean;
}

export function EditorTopBar({ onExport, exportProgress, hasTransparentBackground }: EditorTopBarProps) {
    const [showAlert, setShowAlert] = useState(false);
    const [prevStatus, setPrevStatus] = useState<string>(exportProgress.status);

    if (exportProgress.status !== prevStatus) {
        setPrevStatus(exportProgress.status);
        if (exportProgress.status === "error") {
            setShowAlert(true);
        } else {
            setShowAlert(false);
        }
    }

    useEffect(() => {
        if (showAlert) {
            const timer = setTimeout(() => {
                setShowAlert(false);
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [showAlert]);

    return (
        <div className="h-13 border-b border-white/10 flex items-center justify-between px-4 shrink-0 relative">

            {showAlert && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 w-full max-w-md z-200 px-4 animate-in fade-in zoom-in slide-in-from-top-4 duration-300">
                    <Alert variant="info" className="relative border-red-500/50 bg-red-950/95 backdrop-blur-lg shadow-2xl overflow-hidden">
                        <button
                            onClick={() => setShowAlert(false)}
                            className="absolute top-3 right-3 p-1 rounded-md text-white hover:text-red-100 hover:bg-white/10 transition-all duration-200 group"
                            aria-label="Cerrar alerta"
                        >
                            <Icon icon="lucide:x" className="h-4 w-4" />
                        </button>

                        <Icon icon="lucide:alert-circle" className="h-4 w-4 text-red-400" />

                        <div className="pr-6">
                            <AlertTitle className="text-red-100 font-medium">Error al exportar</AlertTitle>
                            <AlertDescription className="flex flex-col gap-2 mt-1">
                                <span className="text-red-200/90 text-xs">
                                    {exportProgress.message}
                                </span>
                                <span className="text-xs leading-tight text-white/90">
                                    Intenta reproducir toda la duración del video antes de exportar.
                                </span>
                            </AlertDescription>
                        </div>
                    </Alert>
                </div>

            )}

            <div className="flex-1"></div>

            <div className="flex items-center gap-3 ml-auto">
                <div className="flex items-center gap-2 border-r border-white/10 pr-3">
                    <button className="hover:text-white transition-colors">
                        <Icon icon="mdi:undo" width="20" />
                    </button>
                    <button className="hover:text-white transition-colors opacity-50 cursor-not-allowed">
                        <Icon icon="mdi:redo" width="20" />
                    </button>
                </div>
                <ExportDropdown onExport={onExport} exportProgress={exportProgress}  hasTransparentBackground={hasTransparentBackground}/>
            </div>
        </div>
    );
}