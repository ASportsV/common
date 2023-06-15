import type {
  Frame,
  BaseVideo,
  CacheFrameData
} from "../@types"
import { DEBUG } from '../@const';
import { getImg, wait, debugMem, ArrayToDict, waitUntil, wrapWorker } from '../@utils';

import MyWorker from './loadFrames.worker';

export class DataLoader<GameID extends string, VideoID extends string, PlayerID extends number> {

  // shotRecords: ShotRecord[] = []
  #Loading: Partial<Record<VideoID, boolean>> = {}

  // video data per frame
  memVideoData: Partial<Record<VideoID, Record<number, Frame<PlayerID>>>> = {}

  onLoad?: (videoId: VideoID, progress?: number) => void
  onUnload?: (videoId: VideoID) => void

  #getFrames: (video: BaseVideo<GameID, VideoID>) => Promise<CacheFrameData<PlayerID>[] | undefined>
  constructor(readonly worker: { new(): Worker } = MyWorker) {
    this.#getFrames = wrapWorker<[BaseVideo<GameID, VideoID>], CacheFrameData<PlayerID>[] | undefined>(worker, 'Frames', (d) => {
      if (d[0] === 'Progress') {
        const [_, vId, progress] = d
        this.onLoad?.(vId, progress)
      }
    })
  }

  /**
   * ----------------- Data Loading --------------------
   */
  isLoaded(video: BaseVideo<GameID, VideoID>) {
    return video.isTransit || video.id in this.memVideoData
  }
  getVideoData(videoId: VideoID) {
    return this.memVideoData[videoId]
  }

  #pre_load_batch_size = 50
  async fetch(video: BaseVideo<GameID, VideoID>, shouldWait: boolean = false) {

    if (this.#Loading[video.id]) {
      // wait until anothe thread finish
      await waitUntil(() => !this.#Loading[video.id])
      return
    }

    this.#Loading[video.id] = true
    console.debug('preload===>', video)
    // if not in mem, load from db
    if (!this.isLoaded(video)) {
      // step 1, get from db
      const frames = await this.#getFrames(video)
      if (!frames) {
        this.#Loading[video.id] = false
        return
      }
      const progressOffset = 0.6
      this.onLoad?.(video.id, progressOffset)

      // step2, process to mem
      console.log(`%cMain thread processing ${video.id} to mem =====>`, 'color:#f5f5f5;background: #00695c; padding: 2px; border-radius:2px')
      // should not do at once, chunck frames into groups
      let framesToSave: Frame<PlayerID>[] = []
      console.debug('===>parsing blob to img...')
      for (let i = 0; i < Object.keys(frames).length; i += this.#pre_load_batch_size) {
        const itemsForBatch = frames.slice(i, i + this.#pre_load_batch_size)
        framesToSave = [
          ...framesToSave,
          ...(await Promise.all(itemsForBatch.map(async (frame) => {
            const mask = frame.mask ? await getImg(URL.createObjectURL(frame.mask)) : undefined
            return { ...frame, mask } as any as Frame<PlayerID>
          })))
        ]
        this.onLoad?.(video.id, progressOffset + (0.95 - progressOffset) * i / Object.keys(frames).length)

        if (shouldWait) {
          await wait(30)
        }
      }
      // sort
      framesToSave.sort((a, b) => a.idx - b.idx)
      console.debug(`<=====${video.id} Done!`, framesToSave[0])
      // Step3. save to mem
      this.memVideoData[video.id] = ArrayToDict(framesToSave, 'idx')
      this.onLoad?.(video.id, 1)
      DEBUG.DEBUG_MEM && debugMem()

      console.log(`%cMain thread done processing ${video.id} to mem<======`, 'color:#f5f5f5;background: #00695c; padding: 2px; border-radius:2px')
    }
    this.#Loading[video.id] = false
  }

  unloadFromMem(video?: BaseVideo<GameID, VideoID>) {
    if (video === undefined || video.isTransit) return
    delete this.memVideoData[video.id]
    this.onUnload?.(video.id)
    DEBUG.DEBUG_MEM && debugMem()
  }
}