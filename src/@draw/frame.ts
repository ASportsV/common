import { COLORS } from "../@const/draw";
import { Layer } from "../@types";

function drawRawFrame(layer: Layer, frame: CanvasImageSource, darkenAlpha: number = COLORS.BG_MASK_ALPHA) {
    const { width, height } = layer.canvas
    layer.ctx.drawImage(frame, 0, 0, width, height);

    if (darkenAlpha !== 0) {
        drawOverlay(layer, darkenAlpha)
    }
}

function drawOverlay(layer: Layer, alpha: number) {
    const { ctx, canvas } = layer
    const { width, height } = canvas

    ctx.save()
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore()
}

function fadeOutLayer(layer: Layer, alpha: number) {
    layer.ctx.save()
    layer.ctx.globalAlpha = alpha
    layer.ctx.globalCompositeOperation = 'copy';
    layer.ctx.drawImage(layer.canvas, 0, 0)
    layer.ctx.restore()
}


export {
    drawRawFrame as bg,
    drawOverlay as overlay,
    fadeOutLayer as fadeOutFrame
}