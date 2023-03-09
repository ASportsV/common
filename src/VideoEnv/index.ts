import { Frame, BaseVideo } from '../@types'

import { DataLoader } from '../DataLoader'
import { VideoPlayer } from './VideoPlayer'

export class VideoEnv<
  GameID extends string,
  VideoID extends string,
  PlayerID extends number
> extends VideoPlayer<GameID, VideoID> {

  /**
   * add a dataLoader to the VideoPlayer
   */
  // dataLoader: DataLoader

  // data
  #frames: Record<number, Frame<PlayerID>> | undefined
  get frames() { return this.#frames }
  set frames(v) { this.#frames = v }

  // combine event
  constructor(readonly dataLoader: DataLoader<GameID, VideoID, PlayerID> = new DataLoader()) {
    super()
    // this.dataLoader = new DataLoader(postProcessingData)
    // combine event
    this.dataLoader.onLoad = (videoId: VideoID) => {
      this.onLoad?.(videoId, 'Data')
    }
    this.dataLoader.onUnload = (videoId: VideoID) => {
      this.onUnload?.(videoId, 'Data')
    }
  }

  async fetchVideos() {
    super.fetchVideos()
    for (const video of this.videos) {
      await this.dataLoader.fetch(video)
    }
  }

  isLoaded(video: BaseVideo<GameID, VideoID>) {
    return this.dataLoader.isLoaded(video) && super.isLoaded(video)
  }

  async loadVideo(video: BaseVideo<GameID, VideoID>, play = false) {
    // not load
    if (this.currentTrack?.id === video.id) return
    super.loadVideo(video, play)
    // load data
    await this.dataLoader.fetch(video)
    this.frames = this.dataLoader.getVideoData(video.id)
  }

  // one off data load
  // async loadBins() {
  //   return this.dataLoader.loadBins()
  // }
}