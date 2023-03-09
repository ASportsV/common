import { BaseVideo } from "../@types"

export async function getImg(src: string) {
  const img = new Image()
  img.src = src
  await new Promise(resolve => {
    img.onload = e => {
      URL.revokeObjectURL(src)
      resolve(undefined)
    }
  })
  return img
}

export function globalFIdxToLocal<GameID extends string, VideoID extends string>(globalFrameIdx: number, videos: BaseVideo<GameID, VideoID>[]) {
  let accFrame = 0
  let videoIdx = 0
  for (videoIdx = 0; videoIdx < videos.length; ++videoIdx) {
    const video = videos[videoIdx]
    if (globalFrameIdx >= accFrame && globalFrameIdx < accFrame + video.maxFrame) {
      break
    } else {
      accFrame += video.maxFrame
    }
  }
  const newCurFrameIdx = globalFrameIdx - accFrame
  return { videoIdx, frameIdx: newCurFrameIdx }
}

export function localFIdxToGlobalFIdx<GameID extends string, VideoID extends string>(videoIdx: number, localFIdx: number, videos: BaseVideo<GameID, VideoID>[]) {
  let accFrameIdx = 0
  for (let i = 0; i < videoIdx; ++i)
    accFrameIdx += videos[i].maxFrame
  return accFrameIdx + localFIdx
}
