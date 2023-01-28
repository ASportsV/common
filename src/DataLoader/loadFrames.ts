import type {
  Player,
  Ball,
  Video,
  CacheFrameData,
} from '../@types';
import { ArrayToDict } from "../@utils";

import { Database } from "./Database"

// a flag
const Loading: Partial<Record<string, boolean>> = {}

// load data from indexedDB
export async function loadFramesFromDBToMem<GameID extends string, VideoID extends string>(video: Video<GameID, VideoID>, db: Database): Promise<CacheFrameData[] | undefined> {
  const { id: videoId, maxFrame, isTransit = false, startFame = 0 } = video
  if (Loading[videoId] || isTransit) return
  Loading[videoId] = true

  console.groupCollapsed(`%cWorker load ${videoId} ====>`, 'background: #222; color: #bada55')
  const frameIdxs = Array(maxFrame).fill(0)
    .map((_, frameIdx) => frameIdx)
    // filter the frames before the startFrame
    .filter((fIdx) => fIdx >= startFame)
  const frames = Object.values(await loadAllFromDB<GameID, VideoID>(video, frameIdxs, db))
  console.groupEnd()

  Loading[videoId] = false
  console.debug(`%cWorker Done loadFramesFromDBToMem! ${frames.length} idx len: ${frameIdxs.length} <=========\n`, 'background: #222; color: #bada55')
  return frames
}

export async function loadAllFromDB<GameID extends string, VideoID extends string>(video: Video<GameID, VideoID>, frameIdxs: number[], db: Database) {
  const { gameId, id: videoId } = video
  const { version: vCache = -1 } = (await db.myTables.videoDataVersions
    .where(['gameId', 'videoId'])
    .equals([gameId, videoId])
    .toArray()
  )[0] ?? {}

  let dbFrames: Record<number, CacheFrameData> = {}
  if (video.version === vCache) {
    dbFrames = ArrayToDict(await db.myTables.frames //db.table('frames')
      .where(['gameId', 'videoId', 'idx'])
      .anyOf(frameIdxs.map(idx => [gameId, videoId, idx]))
      .toArray(), 'idx')
  }

  if (Object.keys(dbFrames).length !== frameIdxs.length) {
    console.log('missing frames in db, load from the net')
    return await loadRawFramesFromNet<GameID, VideoID>(video, frameIdxs, db)
  }
  return dbFrames
}

export async function loadRawFramesFromNet<GameID extends string, VideoID extends string>(video: Video<GameID, VideoID>, frameIdxs: number[], db: Database) {
  const { gameId, id: videoId, width: W, height: H, version } = video

  console.debug(`Download ${videoId} from net ====>`)
  const frame_data = await fetch(`/assets/${gameId}/${videoId}/${videoId}-frame_data.json`).then(d => d.json())
  console.debug(`Done download ${videoId}<====`)

  const canvas = new OffscreenCanvas(W, H)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  const rawFrames = ArrayToDict(await Promise.all(frameIdxs.map(async (frameIdx) => {
    const { seg } = frame_data[frameIdx]

    ctx.clearRect(0, 0, W, H)
    const imgData = ctx.getImageData(0, 0, W, H)
    const buf32 = new Uint32Array(imgData.data.buffer);

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

  const frameData: Record<number, CacheFrameData> = {}
  frameIdxs.forEach(frameIdx => {

    // convert player
    const players: Player<number>[] = frame_data[frameIdx].players
      .map((p: any) => {
        return {
          ...p,
          bbox: { x: p.bbox[0], y: p.bbox[1], w: p.bbox[2], h: p.bbox[3] },
          keypoints: p.keypoints.reduce((o: any, k: any) => {
            o[k[0]] = { x: k[1], y: k[2] }
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
      gameId,
      videoId,
      ball,
      players,
    }
  })
  console.debug('merging...')
  const frames: CacheFrameData[] = frameIdxs.map(frameIdx => ({ ...frameData[frameIdx], ...rawFrames[frameIdx] }))

  console.debug(`Save ${videoId} to db===>`)
  db.myTables.frames.bulkPut(Object.values(frames))
  db.myTables.videoDataVersions.put({ gameId, videoId, version })
  console.debug(`Done save ${videoId} to db<====`)
  return frames
}


// export async function loadFramesFromDBToMem(video: Video, db: Database): Promise<Array<CacheFrame & CacheFrameData> | undefined> {
//   const { gameId, id: videoId, maxFrame, isTransit = false, startFame = 0 } = video
//   if (Loading[videoId] || isTransit) return
//   Loading[videoId] = true

//   console.groupCollapsed(`%cWorker load ${videoId} ====>`, 'background: #222; color: #bada55')
//   const frameIdxs = Array(maxFrame).fill(0)
//     .map((_, frameIdx) => frameIdx)
//     // filter the frames before the startFrame
//     .filter((fIdx) => fIdx >= startFame)

//   // load raw frame from the db
//   const rawFrames = await loadRawFrameFromDB(video, frameIdxs, db)
//   // load data from the db
//   const frameData = await loadStatDataFromDB(video, frameIdxs, db)

//   console.log('merging...')
//   const frames: CacheFrameData[] = frameIdxs.map(frameIdx => ({ ...frameData[frameIdx], ...rawFrames[frameIdx] }))
//   console.groupEnd()

//   Loading[videoId] = false
//   console.debug(`%cWorker Done loadFramesFromDBToMem! ${frames.length} idx len: ${frameIdxs.length} <=========\n`, 'background: #222; color: #bada55')
//   return frames
// }

// export async function loadRawFrameFromDB(video: Video, frameIdxs: number[], db: Database) {
//   const { gameId, id: videoId } = video
//   console.debug('load frames from db')
//   const dbFrames: Record<number, CacheFrame> = ArrayToDict(await db.myTables.frames //db.table('frames')
//     .where(['gameId', 'videoId', 'idx'])
//     .anyOf(frameIdxs.map(idx => [gameId, videoId, idx]))
//     .toArray(), 'idx')

//   if (Object.keys(dbFrames).length !== frameIdxs.length) {
//     console.log('missing frames in db')
//     return await loadRawFramesFromNet(video, frameIdxs, db)
//   }
//   return dbFrames
// }

// export async function loadRawFramesFromNet({ gameId, id: videoId }: Video, frameIdxs: number[], db: Database) {
//   console.debug(`Download ${videoId} from net ====>`)
//   const dir = `/assets/${gameId}/${videoId}/`

//   let blobFrames: Array<{ mask?: Blob, frameIdx: number }> = []
//   const batch_size = 100
//   for (let i = 0; i < frameIdxs.length; i += batch_size) {
//     const itemsForBatch = frameIdxs.slice(i, i + batch_size)
//     console.log(i)
//     blobFrames = [
//       ...blobFrames,
//       ...(await Promise.all(itemsForBatch.map(async (frameIdx, idx) => {
//         const mask = await fetch(`${dir}/semseg/${frameIdx}.png`)
//           .then(res => res.blob())
//         return { mask, frameIdx }
//       })))
//     ]
//   }
//   console.log(`Done download ${videoId}<====`)

//   console.log(`Save ${videoId} to db===>`)
//   const frames: Record<number, CacheFrame> = {}
//   await Promise.all(blobFrames.map(async ({ mask, frameIdx }) => {
//     db.myTables.frames
//       .put({
//         gameId,
//         idx: frameIdx,
//         videoId: videoId,
//         mask
//       })

//     frames[frameIdx] = { idx: frameIdx, videoId, gameId }
//     if (mask !== undefined) {
//       frames[frameIdx].mask = mask
//     }
//   }))
//   console.log(`Done save ${videoId} to db<====`)
//   return frames
// }

// export async function loadStatDataFromDB(video: Video, frameIdxs: number[], db: Database) {
//   const { gameId, id: videoId } = video
//   // compatable for history version
//   console.log('load data from db!')
//   const dir = `/assets/${gameId}/${videoId}/`

//   // check version
//   // get the version from the net
//   const { version: vNet } = await fetch(`${dir}/${videoId}-version.json`).then(res => res.json())
//   // local version
//   const { version: vCache = -1 } = (await db.myTables.videoDataVersions
//     .where(['gameId', 'videoId'])
//     .equals([gameId, videoId])
//     .toArray()
//   )[0] ?? {}

//   let dbFrameDatas: Record<number, CacheFrameData> = {}
//   // if version match, fetch from DB
//   if (vNet === vCache) {
//     dbFrameDatas = ArrayToDict(await db.myTables.frameDatas.where(['gameId', 'videoId', 'idx'])
//       .anyOf(frameIdxs.map(idx => [gameId, videoId, idx]))
//       .toArray(), 'idx')
//   }

//   if (Object.keys(dbFrameDatas).length !== frameIdxs.length) {
//     console.log('missing data in db')
//     dbFrameDatas = await loadStatDataFromNet(video, frameIdxs, vNet, db)
//   }

//   return dbFrameDatas
// }

// export async function loadStatDataFromNet({ gameId, id: videoId }: Video, frameIdxs: number[], version: number, db: Database) {
//   console.log('load data from net')
//   const dir = `/assets/${gameId}/${videoId}/`

//   const bboxes_by_frame = await fetch(`${dir}/${videoId}-frame_data.json`).then(r => r.json())
//   const meta = await fetch(`${process.env.PUBLIC_URL}/meta.json`).then(r => r.json())

//   // 
//   const frames: Record<number, CacheFrameData> = {}

//   // convert format
//   frameIdxs.forEach(frameIdx => {
//     if(!(frameIdx in bboxes_by_frame)) return

//     // convert player
//       const players: Player[] = bboxes_by_frame[frameIdx].players
//         .map((p: any) => {
//           return {
//             ...p,
//             bbox: { x: p.bbox[0], y: p.bbox[1], w: p.bbox[2], h: p.bbox[3] },
//             keypoints: p.keypoints.reduce((o: any, k: any) => {
//               o[k[0]] = { x: k[1], y: k[2] }
//               return o
//             }, {} as any)
//           }
//         })

//       // convert ball
//       const oBall = bboxes_by_frame[frameIdx].ball
//       const ball: Ball | null = oBall ? {
//         // @ts-ignore, this is a dirty hack, since typescript does not allow override types, so I have to remove the `player` property from the type definition of Ball, and manually specify it in the app's @type definition
//         playerId: oBall[0],
//         tracking: { x: oBall[1], y: oBall[2], h: oBall[3] },
//         screenPos: { x: oBall[4], y: oBall[5] }
//       } : null

//       frames[frameIdx] = {
//         ...bboxes_by_frame[frameIdx],
//         gameId,
//         videoId,
//         ball,
//         players,
//       }
//   })

//   db.myTables.frameDatas
//     .bulkPut(Object.values(frames))
//   db.myTables.videoDataVersions
//     .put({ gameId, videoId, version })

//   return frames
// }