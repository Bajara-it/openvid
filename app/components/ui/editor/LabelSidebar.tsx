interface LabelSidebarProps {
    audioTracksCount?: number;
}

export default function LabelSidebar({ audioTracksCount = 0 }: LabelSidebarProps) {
    return (
        <div className="absolute left-0 top-0 bottom-0 w-16 shrink-0 border-r border-white/5 flex flex-col bg-[#0D0D11] z-30">
            <div className="h-7 border-b border-white/5" />
            <div className="flex-1 flex items-center px-3">
                <span className="text-[9px] uppercase font-semibold tracking-wider text-zinc-500">Video</span>
            </div>
            <div className="flex-1 flex items-center px-3 border-t border-white/5">
                <span className="text-[9px] uppercase font-semibold tracking-wider text-zinc-500">Zoom</span>
            </div>

            {audioTracksCount > 0 && (
                <div className="flex-1 flex items-center px-3 border-t border-white/5">
                    <span className="text-[9px] uppercase font-semibold tracking-wider text-zinc-500">Audio</span>
                </div>
            )}
        </div>
    );
}