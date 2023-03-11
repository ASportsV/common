import type {
  BasePlayer,
  Ball,
  BaseVideo,
  CacheFrameData,
} from '../@types';
import { ArrayToDict } from "../@utils";

import { Database } from "./Database"

// a flag
const Loading: Partial<Record<string, boolean>> = {}

// load data from indexedDB
export async function loadFramesFromDBToMem<GameID extends string, VideoID extends string, PlayerID extends number>(video: BaseVideo<GameID, VideoID>, db: Database<PlayerID>): Promise<CacheFrameData<PlayerID>[] | undefined> {
  const { id: videoId, maxFrame, isTransit = false, startFame = 0 } = video
  if (Loading[videoId] || isTransit) return
  Loading[videoId] = true

  console.groupCollapsed(`%cWorker load ${videoId} ====>`, 'background: #222; color: #bada55')
  const frameIdxs = Array(maxFrame).fill(0)
    .map((_, frameIdx) => frameIdx)
    // filter the frames before the startFrame
    .filter((fIdx) => fIdx >= startFame)
  const frames = Object.values(await loadAllFromDB<GameID, VideoID, PlayerID>(video, frameIdxs, db))
  console.groupEnd()

  Loading[videoId] = false
  console.debug(`%cWorker Done loadFramesFromDBToMem! ${frames.length} idx len: ${frameIdxs.length} <=========\n`, 'background: #222; color: #bada55')
  return frames
}

export async function loadAllFromDB<GameID extends string, VideoID extends string, PlayerID extends number>(video: BaseVideo<GameID, VideoID>, frameIdxs: number[], db: Database<PlayerID>) {
  const { gameId, id: videoId } = video
  const { version: vCache = -1 } = (await db.myTables.videoDataVersions
    .where(['gameId', 'videoId'])
    .equals([gameId, videoId])
    .toArray()
  )[0] ?? {}

  let dbFrames: Record<number, CacheFrameData<PlayerID>> = {}
  if (video.version === vCache) {
    dbFrames = ArrayToDict(await db.myTables.frames //db.table('frames')
      .where(['gameId', 'videoId', 'idx'])
      .anyOf(frameIdxs.map(idx => [gameId, videoId, idx]))
      .toArray(), 'idx')
  }

  if (Object.keys(dbFrames).length !== frameIdxs.length) {
    console.log('missing frames in db, load from the net')
    return await loadRawFramesFromNet<GameID, VideoID, PlayerID>(video, frameIdxs, db)
  }
  return dbFrames
}

function myDecode(ori_str: string) {
  const isLeadingZero = ori_str[0] === '0'
  ori_str = ori_str.slice(1)

  // Decode the unsigned leb128 encoded bytearray
  let rles = []
  // let idx = 0, 
  let cnt = 0, rle = 0
  let more = true
  //console.log('ori_str: ', ori_str)
  for (let i = 0; i < ori_str.length; i++) {
    let byte = ori_str[i].charCodeAt(0)
    //console.log('byte: ', byte)
    byte = byte - 48
    more = ((byte & 0x20) === 32)
    byte = byte & 0x1f
    byte = byte << (cnt * 5)
    rle = rle + byte
    if (more) {
      cnt += 1
    } else {
      rles.push(rle)
      // idx += 1
      cnt = 0
      rle = 0
    }
  }

  return isLeadingZero ? {
    lz: rles[0], chunk: rles.slice(1)
  } : {
    lz: 0, chunk: rles
  }

}

const KEY_POINT_LIST = [
  'nose',
  'left_eye',
  'right_eye',
  'left_ear',
  'right_ear',
  'left_shoulder',
  'right_shoulder',
  'left_elbow',
  'right_elbow',
  'left_wrist',
  'right_wrist',
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle'
]

export async function loadRawFramesFromNet<GameID extends string, VideoID extends string, PlayerID extends number>(video: BaseVideo<GameID, VideoID>, frameIdxs: number[], db: Database<PlayerID>) {
  const { gameId, id: videoId, width: W, height: H, version } = video

  console.debug(`Download ${videoId} from net ====>`)
  // const frame_data = await fetch(`/assets/${gameId}/${videoId}/${videoId}-frame_data.json`).then(d => d.json())
  const frame_data = await fetch(`/assets/${gameId}/${videoId}/${videoId}-data.json`).then(d => d.json())
  console.debug(`Done download ${videoId}<====`)

  const canvas = new OffscreenCanvas(W, H)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  const rawFrames = ArrayToDict(await Promise.all(frameIdxs.map(async (frameIdx) => {
    const { seg: raw_seg } = frame_data[frameIdx]

    ctx.clearRect(0, 0, W, H)
    const imgData = ctx.getImageData(0, 0, W, H)
    const buf32 = new Uint32Array(imgData.data.buffer);

    const seg = myDecode(raw_seg)
    let startPad = seg.lz
    for (let i = 0, len = seg.chunk.length; i < len; ++i) {
      if (i % 2 === 0) {
        for (let j = startPad, lenj = startPad + seg.chunk[i]; j < lenj; ++j) {
          const x = j % W
          const y = Math.floor(j / W)
          const pIdx = (y * W + x)
          // mark as 1, black
          buf32[pIdx] = 0xff000000;
        }
      }
      startPad += seg.chunk[i]
    }

    ctx.putImageData(imgData, 0, 0)
    // clean
    delete frame_data[frameIdx].seg
    return { mask: await canvas.convertToBlob(), frameIdx }
  })), 'frameIdx')

  const frameData: Record<number, CacheFrameData<PlayerID>> = {}
  frameIdxs.forEach(frameIdx => {

    // convert player
    const players: BasePlayer<number>[] = (frame_data[frameIdx].players ?? [])
      .map((p: any) => {
        return {
          ...p,
          bbox: { x: p.bbox[0], y: p.bbox[1], w: p.bbox[2], h: p.bbox[3] },
          keypoints: p.keypoints.reduce((o: any, k: any, idx: number) => {
            o[KEY_POINT_LIST[idx]] = { x: k[0], y: k[1] }
            return o
          }, {} as any)
        }
      })

    // convert ball
    const oBall = frame_data[frameIdx].ball
    const ball: Ball | null = oBall ? {
      // @ts-ignore, this is a dirty hack, since typescript does not allow override types, so I have to remove the `player` property from the type definition of Ball, and manually specify it in the app's @type definition
      playerId: oBall[0],
      tracking: { x: oBall[1], y: oBall[2], h: oBall[3] },
      screenPos: { x: oBall[4], y: oBall[5] }
    } : null

    frameData[frameIdx] = {
      ...frame_data[frameIdx],
      idx: +frameIdx,
      gameId,
      videoId,
      ball,
      players,
    }
  })
  console.debug('merging...')
  const frames: CacheFrameData<PlayerID>[] = frameIdxs.map(frameIdx => ({ ...frameData[frameIdx], ...rawFrames[frameIdx] }))

  console.debug(`Save ${videoId} to db===>`)
  db.myTables.frames.bulkPut(Object.values(frames))
  db.myTables.videoDataVersions.put({ gameId, videoId, version })
  console.debug(`Done save ${videoId} to db<====`)
  return frames
}
