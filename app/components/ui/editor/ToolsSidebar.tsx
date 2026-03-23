"use client";

import { Icon } from "@iconify/react";
import { SidebarTool } from "../SidebarTool";
import type { ToolsSidebarProps } from "@/types/tool-sidebar.types";
import { useRef } from "react";

interface ExtendedToolsSidebarProps extends ToolsSidebarProps {
    onVideoUpload?: (file: File) => void;
    isUploading?: boolean;
}

export function ToolsSidebar({
    activeTool,
    onToolChange,
    onVideoUpload,
    isUploading = false
}: ExtendedToolsSidebarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onVideoUpload) {
            onVideoUpload(file);
            // Reset input para permitir subir el mismo archivo nuevamente
            e.target.value = '';
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };
    return (
        <div className="relative shrink-0 bg-[#141417]" style={{ width: '90px' }}>
            <div className="h-13 border-b border-white/10 w-full" />
            <aside
                className="h-full absolute top-1/2 left-12 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center gap-4 squircle-element border shadow-md shadow-white/20 border-white/10 z-40"
                style={{
                    height: 'calc(100% - 2rem)',
                    maxHeight: '600px',
                    minWidth: '70px',
                    background: 'radial-gradient(circle at 50% 30%, #2a2a2a 0%, #131313 64%)',
                }}
            >
                <div className="flex flex-col gap-4 w-full overflow-y-auto p-2">
                    <SidebarTool
                        icon="gravity-ui:picture"
                        label="Fondo"
                        isActive={activeTool === "screenshot"}
                        onClick={() => onToolChange("screenshot")}
                    />
                    <SidebarTool
                        label="Elementos"
                        isActive={activeTool === "elements"}
                        onClick={() => onToolChange("elements")}
                        icon={
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="transition-colors duration-200"
                            >
                                <path
                                    d="M11 13.5V21.5H3V13.5H11ZM9 15.5H5V19.5H9V15.5ZM12 2L17.5 11H6.5L12 2ZM12 5.86L10.08 9H13.92L12 5.86Z"
                                    fill="currentColor"
                                    stroke="currentColor"
                                    strokeWidth="0.2"
                                />
                                <path fillRule="evenodd" clipRule="evenodd" d="M13.7667 13.8246C13.7667 13.6323 13.8431 13.4479 13.9791 13.312C14.115 13.176 14.2994 13.0996 14.4917 13.0996H20.2917C20.484 13.0996 20.6684 13.176 20.8044 13.312C20.9403 13.4479 21.0167 13.6323 21.0167 13.8246V14.7913C21.0167 14.9836 20.9403 15.168 20.8044 15.3039C20.6684 15.4399 20.484 15.5163 20.2917 15.5163C20.0994 15.5163 19.915 15.4399 19.7791 15.3039C19.6431 15.168 19.5667 14.9836 19.5667 14.7913V14.5496H18.1167V20.3496H18.3584C18.5507 20.3496 18.7351 20.426 18.871 20.562C19.007 20.6979 19.0834 20.8823 19.0834 21.0746C19.0834 21.2669 19.007 21.4513 18.871 21.5873C18.7351 21.7232 18.5507 21.7996 18.3584 21.7996H16.4251C16.2328 21.7996 16.0484 21.7232 15.9124 21.5873C15.7764 21.4513 15.7001 21.2669 15.7001 21.0746C15.7001 20.8823 15.7764 20.6979 15.9124 20.562C16.0484 20.426 16.2328 20.3496 16.4251 20.3496H16.6667V14.5496H15.2167V14.7913C15.2167 14.9836 15.1403 15.168 15.0044 15.3039C14.8684 15.4399 14.684 15.5163 14.4917 15.5163C14.2994 15.5163 14.115 15.4399 13.9791 15.3039C13.8431 15.168 13.7667 14.9836 13.7667 14.7913V13.8246Z" fill="currentColor" stroke="currentColor" strokeWidth="0.5" />
                            </svg>
                        }
                    />
                    <SidebarTool
                        icon="mdi:volume-high"
                        label="Audio"
                        isActive={activeTool === "audio"}
                        onClick={() => onToolChange("audio")}
                    />
                    <SidebarTool
                        icon="iconamoon:zoom-in-bold"
                        label="Zoom"
                        isActive={activeTool === "zoom"}
                        onClick={() => onToolChange("zoom")}
                    />

                    <SidebarTool
                        icon="hugeicons:browser"
                        label="Mockup"
                        isActive={activeTool === "mockup"}
                        onClick={() => onToolChange("mockup")}
                    />

                </div>
                <div className="w-full p-2 relative flex flex-col items-center shrink-0 group">
                    <div className="absolute -top-0.5 left-0 w-full border-t border-white/10" />
                    <button
                        onClick={handleUploadClick}
                        disabled={isUploading}
                        className="w-full flex flex-col items-center text-center justify-center gap-1.5 p-2 rounded-xl cursor-pointer hover:bg-blue-500/20 text-white/60 hover:text-blue-400 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                        title={isUploading ? "Subiendo video..." : "Subir video personalizado"}
                    >
                        {isUploading ? (
                            <>
                                <Icon icon="svg-spinners:ring-resize" className="transition-transform duration-300" width="24" height="24" />
                                <span className="text-xs font-medium">Subiendo...</span>
                            </>
                        ) : (
                            <>
                                <Icon icon="mage:video-upload" className="transition-transform duration-300 group-hover:scale-105" width="24" height="24" />
                                <span className="text-xs font-medium">Subir video</span>
                            </>
                        )}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>
            </aside>
        </div>
    );
}
