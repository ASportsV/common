import { db } from './database'
import type { Evt, Frame, BBox, PersonSeg } from 'common/@types'
import { EventData } from 'common/@videos'

/**
 * Person segmentation data from the server
 */
interface AnnotationJSON {
  circle: Array<{ x: number, y: number, r: number }>
  polygon: Array<{ id: number, points: [number, number][] }>
}

interface KeyPoint {
  x: number, y: number, v: number, name: string
}

/**
* Ball pos and table polygon from the server
*/
interface SegmentationJSON {
  videoId: string,
  framePerImage: number,
  combinedFiles: string[],
  segmentations: Array<{
    id: number
    lz: number,
    chunk: number[],
    bbox: BBox,
    keypoint: KeyPoint[]
  }[]>
  video_width: number
  video_height: number
}


async function getBallandTable(videoId: string) {
  const data = await fetch(`assets/${videoId}/ball_table.json`).then(res => res.json())
  return data as AnnotationJSON
}

async function getSegmentation(videoId: string) {
  const data = await fetch(`assets/${videoId}/segmentations.json`).then(res => res.json())
  return {
    ...data,
    segmentations: Object.values(data.segmentations),
  } as SegmentationJSON
}


function getEvents(videoId: string): Evt[] {
  return (EventData as any)[videoId]
}

export async function fetchDataFromServer(videoId: string) {
  console.log('fetchData')
  const segmentations = await getSegmentation(videoId)
  const ballAndTable = await getBallandTable(videoId)
  const events = getEvents(videoId)

  const { video_width, video_height } = segmentations

  // build pointers among events
  for (let i = 0, len = events.length; i < len - 1; ++i) {
    events[i].nextEvt = events[i + 1]
  }

  const segmentationsImageData = await processAndCachePerson(videoId, segmentations, video_width, video_height, 0)

  const frames: Frame[] = []
  for (let i = 0, len = segmentations.segmentations.length; i < len; ++i) {
    const event = events.find(e => e.from <= i && i <= e.to)
    const preEvent = [...events].reverse().find(e => e.to < i)
    const nextEvent = events.find(e => e.from > i)

    frames.push({
      circle: ballAndTable.circle[i],
      table: ballAndTable.polygon[i],
      persons: segmentationsImageData[i],  // segmentations.segmentations[i],
      event,
      preEvent,
      nextEvent
    })
  }

  return {
    videoWidth: video_width,
    videoHeight: video_height,
    frames,
    events,
    maxFrame: frames.length,
  }
}



const PADDING = 15

export async function processAndCachePerson(videoId: string, segmentationData: SegmentationJSON,
  videoW: number, videoH: number, skip: number = 0) {

  const width = videoW
  const height = videoH
  const canvas = document.createElement('canvas')
  // can be prepared in the backend side
  canvas.setAttribute('width', `${width}`)
  canvas.setAttribute('height', `${height}`)
  const ctx: CanvasRenderingContext2D = canvas.getContext('2d')!
  const { segmentations, combinedFiles, framePerImage } = segmentationData
  const segmentationsImageData: Record<number, PersonSeg[]> = {}

  for (let groupIdx = 0, len = combinedFiles.length; groupIdx < len; ++groupIdx) {
    if (groupIdx * 10 < skip) continue
    const frameIdxs = Array(framePerImage).fill(0)
      .map((_, i) => i + groupIdx * framePerImage)
      .filter(frameIdx => frameIdx < segmentations.length)

    const combinedFile = combinedFiles[groupIdx]

    const dbData = await db.frames.where(['idx', 'videoId'])
      .anyOf(frameIdxs.map(d => [d, videoId]))
      .toArray()

    console.groupCollapsed('done in', combinedFile)
    if (dbData.length === frameIdxs.length) {
      dbData.forEach((frame: any) => {
        console.log(frame.idx)
        segmentationsImageData[frame.idx] = frame.persons
      })
    } else {

      const frameImage = new Image()
      frameImage.src = `${process.env.PUBLIC_URL}/assets/${videoId}/cropedFrames/${combinedFile}`
      frameImage.crossOrigin = "Anonymous";
      await new Promise<HTMLImageElement | null>((resolve) => {
        frameImage.onload = function () {
          resolve(null)
        };
      })

      let offsetTop = 0
      frameIdxs.forEach(async (frameIdx) => {
        if (frameIdx in segmentationsImageData) {
          console.log('wtf', frameIdx)
        }

        const segs = segmentations[frameIdx]

        ctx.clearRect(0, 0, width, height)
        const persons = segs.filter(seg => seg).map((seg, idx) => {

          const { left, right, top, bottom } = seg!.bbox
          const sx = 0
          const sy = offsetTop
          // darw
          ctx.drawImage(frameImage,
            sx, sy, right - left + PADDING * 2, bottom - top,
            left - PADDING, top, right - left + PADDING * 2, bottom - top,
          )
          offsetTop += bottom - top

          // get
          const originalData = ctx
            .getImageData(left - PADDING, top, right - left + PADDING * 2, bottom - top)

          // process
          const newBBox = clipPerson(seg!, PADDING, {
            canvasWidth: width,
            canvasHeight: height,
          }, originalData);

          return {
            id: seg.id,
            bbox: newBBox, // { left: left - padding, top, right: right + padding, bottom },
            data: originalData,
            keypoints: seg.keypoint.reduce((o, k) => {
              o[k.name] = { x: k.x, y: k.y }
              return o
            }, {} as any)
          }
        })

        // cache to db
        await db.frames.add({ idx: frameIdx, persons, videoId })
        // cache to mem
        segmentationsImageData[frameIdx] = persons
      })

    }
    console.groupEnd()
  }
  return segmentationsImageData
}

function clipPerson(seg: {
  lz: number,
  chunk: number[],
  bbox: BBox
}, padding: number,
  { canvasWidth, canvasHeight }: { canvasWidth: number, canvasHeight: number },
  oData: ImageData) {
  const debug = true

  const W = canvasWidth
  const H = canvasHeight
  const w = oData.width
  const h = oData.height
  const top = seg.bbox.top
  const left = seg.bbox.left - padding
  const flag = Array(w * h).fill(0)
  const personAlpha = 1
  const bgAlpha = 0.5

  if (debug) {
    console.debug(`
canvas size: ${W} x ${H},
oData  size: ${w} x ${h},
left: ${left}, top: ${top}
        `)
  }
  let retBbox = {
    left: seg.bbox.left - padding,
    top: seg.bbox.top,
    right: seg.bbox.right + padding,
    bottom: seg.bbox.bottom
  }

  let startPad = seg.lz
  for (let i = 0, len = seg.chunk.length; i < len; ++i) {
    // probably some outlier
    // if(i % 2 === 0 && i > 0 && seg.chunk[i-1] > W * 5) {
    //     // update bbox
    //     retBbox = newBBox
    //     break
    // }
    // 1
    if (i % 2 === 0) {
      // Cs x αs + Cb x αb x (1 - αs)
      // αo = αs + αb x (1 - αs)
      // pre padding
      const prePadStart = Math.max(startPad - padding,
        i > 1 ? startPad - seg.chunk[i - 1] : 0)
      const prePadEnd = startPad
      const preDivider = prePadEnd - prePadStart
      for (let j = prePadStart; j < prePadEnd; ++j) {
        const X = j % W
        const Y = Math.floor(j / W)
        const x = X - left
        const y = Y - top
        const oIdx = (y * w + x) * 4
        const ratio = (j - prePadStart) / preDivider
        const oneMinusAlphaS = (1 - bgAlpha) + ratio * bgAlpha

        // 从黑过度到有东西
        // 暂时注释掉, 去掉黑边
        // oData.data[oIdx] = oData.data[oIdx] * oneMinusAlphaS
        // oData.data[oIdx + 1] = oData.data[oIdx + 1] * oneMinusAlphaS
        // oData.data[oIdx + 2] = oData.data[oIdx + 2] * oneMinusAlphaS

        flag[y * w + x] = 0 // 不要多余的
        // debug && console.debug(`Set flag at (${x}, ${y}) as 1`)
      }

      for (let j = startPad, lenj = startPad + seg.chunk[i]; j < lenj; ++j) {
        const X = j % W
        const Y = Math.floor(j / W)
        const x = X - left
        const y = Y - top
        const oIdx = (y * w + x) * 4

        // oData.data[oIdx] = oData.data[oIdx]
        // oData.data[oIdx + 1] = oData.data[oIdx + 1]
        // oData.data[oIdx + 2] = oData.data[oIdx + 2]
        oData.data[oIdx + 3] = 255 * personAlpha

        flag[y * w + x] = 1
        // debug && console.debug(`Set flag at (${x}, ${y}) as 1`)
      }

      // // post padding
      const postPadStart = startPad + seg.chunk[i]
      const postPadEnd = Math.min(startPad + seg.chunk[i] + padding, (i < len - 1) ? startPad + seg.chunk[i] + seg.chunk[i + 1] : Infinity)
      const postDivider = postPadEnd - postPadStart
      for (let j = postPadStart; j < postPadEnd; ++j) {
        const X = j % W
        const Y = Math.floor(j / W)
        const x = X - left
        const y = Y - top
        const oIdx = (y * w + x) * 4
        const ratio = (j - postPadStart) / postDivider
        const oneMinusAlphaS = 1 - ratio * bgAlpha

        // 从有东西过度到黑
        // 暂时注释掉, 去掉黑边
        // oData.data[oIdx] = oData.data[oIdx] * oneMinusAlphaS
        // oData.data[oIdx + 1] = oData.data[oIdx + 1] * oneMinusAlphaS
        // oData.data[oIdx + 2] = oData.data[oIdx + 2] * oneMinusAlphaS

        flag[y * w + x] = 0 // 不要多余的
        // debug && console.debug(`Set flag at (${x}, ${y}) as 1`)
      }
    }
    startPad += seg.chunk[i]
  }

  // debug
  if (debug) {
    console.debug(`#bits flag === 1: ${flag.filter(f => f === 1).length}`,
      `#bits flag === 0: ${flag.filter(f => f === 0).length}`)
    console.assert(flag.length === oData.width * oData.height)
    console.log(flag)
  }
  for (let i = 0, len = flag.length; i < len; ++i) {
    if (flag[i] === 0) {
      const oIdx = i * 4
      // oData.data[oIdx] = 0.5 * oData.data[oIdx]
      // oData.data[oIdx + 1] = 0.5 * oData.data[oIdx + 1]
      // oData.data[oIdx + 2] = 0.5 * oData.data[oIdx + 2]
      oData.data[oIdx + 3] = 0
    }
  }

  return retBbox
}