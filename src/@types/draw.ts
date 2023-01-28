import { Frame } from "./data";

export interface Layer {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
}

// all ms
export interface TimeParams {
    startTime?: number
    inDuration?: number
    duration?: number
    outDuration?: number
    frameRate?: number
}

export interface IVisualizer {
    readonly layers: Record<string, Layer | null>
}

// export type AnimatedFunc = (ratio: number, tick: number, visualizer: Visualizer, globalCurrentFrame: number) => void
export type AnimatedFunc<PlayerID extends number> = (ratio: number, tick: number, frameData: Frame<PlayerID>) => void
