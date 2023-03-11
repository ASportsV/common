import { DEBUG } from "../../@const"
import type { BaseVideo } from "../../@types"
import { debugMem, waitUntil } from "../../@utils"


export class VideoLoader<GameID extends string, VideoID extends string> {
  #Loading: Partial<Record<VideoID, boolean>> = {}

  onLoad?: (videoId: VideoID) => void
  onUnload?: (videoId: VideoID) => void
  private memVideos: Partial<Record<VideoID, HTMLVideoElement>> = {}

  getVideo(videoId: VideoID) {
    return this.memVideos[videoId]
  }

  isLoaded(video: BaseVideo<GameID, VideoID>) {
    return video.id in this.memVideos
  }

  async fetch(video: BaseVideo<GameID, VideoID>) {

    if (this.#Loading[video.id]) {
      // wait until anothe thread finish
      await waitUntil(() => !this.#Loading[video.id])
      return
    }

    this.#Loading[video.id] = true
    if (!this.isLoaded(video)) {
      console.debug('VideoLoader.preLoadToMem', video)
      const nextVideo = document.createElement('video')
      nextVideo.src = `${process.env.PUBLIC_URL}/assets/${video.gameId}/${video.id}/${video.id}.mp4`
      nextVideo.id = video.id
      nextVideo.load()
      await new Promise(resolve => {
        // nextVideo.onloadedmetadata = () => console.log('onloadedmetadata', video.id)
        nextVideo.onloadeddata = resolve
      })
      console.debug('VideoLoader.preLoadToMem ==> Done', video)

      // load to mem
      this.memVideos[video.id] = nextVideo
      this.onLoad?.(video.id)
      DEBUG.DEBUG_MEM && debugMem()
    }
    this.#Loading[video.id] = false
  }
}
