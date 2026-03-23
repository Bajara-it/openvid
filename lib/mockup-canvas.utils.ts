import type { MockupConfig } from "@/types/mockup.types";
import {
    type MockupDrawResult,
    drawMacosMockup,
    drawMacosGlassMockup,
    drawVSCodeMockup,
    drawIPhoneSlimMockup,
} from "./mockup-canvas";
import { drawMacosGhostMockup } from "./mockup-canvas/macos-ghost";
import { drawGlassUIContainerMockup } from "./mockup-canvas/glass-ui-container";
import { drawMacosGhostGlassMockup } from "./mockup-canvas/macos-ghost-glass";
import { drawMacosContainerGlassMockup } from "./mockup-canvas/macos-container-glass";
import { drawBraveMockup } from "./mockup-canvas/brave";
import { drawBraveGlassMockup } from "./mockup-canvas/brave-glass";
import { drawBrowserTabGlassMockup } from "./mockup-canvas/browser-tab-glass";
import { drawChromeMockup } from "./mockup-canvas/chrome";
import { drawChromeGlassMockup } from "./mockup-canvas/chrome-glass";
import { drawMacosDarkIdeMockup } from "./mockup-canvas/macos-dark-ide";
import { drawMacosGhostIdeMockup } from "./mockup-canvas/macos-ghost-ide";

interface MockupCanvasContext {
    ctx: CanvasRenderingContext2D;
    x: number;
    y: number;
    width: number;
    height: number;
    config: MockupConfig;
    cornerRadius: number;
    shadowBlur: number;
}

export function drawMockupToCanvas(
    ctx: CanvasRenderingContext2D,
    mockupId: string,
    config: MockupConfig,
    x: number,
    y: number,
    width: number,
    height: number,
    cornerRadius: number,
    shadowBlur: number = 0
): MockupDrawResult {
    const context: MockupCanvasContext = {
        ctx,
        x,
        y,
        width,
        height,
        config,
        cornerRadius,
        shadowBlur,
    };

    switch (mockupId) {
        case "macos":
            return drawMacosMockup(context);
        case "macos-glass":
            return drawMacosGlassMockup(context);
        case "glass-ui-container":
            return drawGlassUIContainerMockup(context);
        case "macos-ghost":
            return drawMacosGhostMockup(context);
        case "macos-ghost-glass":
            return drawMacosGhostGlassMockup(context);
        case "macos-container-glass":
            return drawMacosContainerGlassMockup(context);
        case "brave":
            return drawBraveMockup(context);
        case "brave-glass":
            return drawBraveGlassMockup(context);
        case "browser-tab-glass":
            return drawBrowserTabGlassMockup(context);
        case "chrome":
            return drawChromeMockup(context);
        case "chrome-glass":
            return drawChromeGlassMockup(context);
        case "vscode":
            return drawVSCodeMockup(context);
        case "macos-dark-ide":
            return drawMacosDarkIdeMockup(context);
        case "macos-ghost-ide":
            return drawMacosGhostIdeMockup(context);
        case "iphone-slim":
            return drawIPhoneSlimMockup(context);
        default:
            // Sin mockup, el contenido ocupa todo el espacio
            return {
                contentX: x,
                contentY: y,
                contentWidth: width,
                contentHeight: height,
            };
    }
}

