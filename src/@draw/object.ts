import type { Layer } from "../@types/draw";
import type { Player } from "../@types/data";
import type { Point } from "../@types/basic";
import { fadeOutFrame } from './frame'

function drawBall(layer: Layer, ball?: Point, trail = false) {

  const { width, height } = layer.canvas
  if (trail) {
    fadeOutFrame(layer, 0.9)
  } else {
    layer.ctx.clearRect(0, 0, width, height)
  }

  if (ball) {
    const { x: cx, y: cy } = ball
    layer.ctx.beginPath()
    layer.ctx.lineWidth = 3
    layer.ctx.strokeStyle = 'steelblue'
    layer.ctx.fillStyle = 'rgba(236, 240, 241, 1)'
    layer.ctx.arc(cx, cy, 5, 0, 2 * Math.PI)
    layer.ctx.fill()
    layer.ctx.stroke()
  }
}

const internalCanvas = document.createElement('canvas')
const internalCtx = internalCanvas.getContext('2d')!
function drawFullBrightPlayers<PlayerID extends number>(layer: Layer,
  frame: CanvasImageSource,
  mask: CanvasImageSource,
  players: Player<PlayerID>[],
  glow: boolean = true
) {
  const { ctx } = layer
  const { width, height } = layer.canvas

  // mask get full bright players
  internalCanvas.width = width
  internalCanvas.height = height
  internalCtx.save()
  internalCtx.drawImage(mask, 0, 0)
  internalCtx.globalCompositeOperation = 'source-in'
  internalCtx.drawImage(frame, 0, 0)
  internalCtx.restore()

  ctx.save()
  if (glow) {
    ctx.shadowBlur = 30
    ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
  }
  players
    .forEach(player => {
      const { x, y, w, h } = player.bbox
      ctx.drawImage(internalCanvas,
        x, y, w, h,
        x, y, w, h)
    })
  ctx.restore()

}

export {
  drawBall as ball,
  drawFullBrightPlayers as fullbrightPlayers,
}
