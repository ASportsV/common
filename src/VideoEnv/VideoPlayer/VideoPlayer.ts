import type { Video } from "../../@types"
import { VideoLoader } from './VideoLoader'

class VideoTrack<GameID extends string, VideoID extends string> {
  private get frameOffset() {
    // hardcode value, I dont know why
    return this.#videoMeta?.frameRate === 50 ? 0 : 1
  }

  #videoMeta?: Video<GameID, VideoID>
  #video?: HTMLVideoElement
  get video() { return this.#video }
  get id() { return this.#video?.id }

  CallBackHandle: number | null = null

  onPlay: EventListener | null = null
  onPause: EventListener | null = null
  setVideo(video: Video<GameID, VideoID>, videoElm: HTMLVideoElement | undefined) {
    this.#video = videoElm
    this.#video?.requestVideoFrameCallback(this.invokeFrameHandlers)
    this.#videoMeta = video
  }
  load(onPlay: EventListener, onPause: EventListener) {
    this.onPlay = onPlay
    this.onPause = onPause
    this.#video?.addEventListener('play', onPlay)
    this.#video?.addEventListener('pause', onPause)
  }

  unLoad() {
    if (this.onPlay)
      this.#video?.removeEventListener('play', this.onPlay)
    if (this.onPause)
      this.#video?.removeEventListener('pause', this.onPause)
    if (this.CallBackHandle !== null)
      this.#video?.cancelVideoFrameCallback(this.CallBackHandle)
    this.#video?.load()
    this.#video = undefined
    this.#videoMeta = undefined
  }

  constructor(public readonly name: string, private readonly videoPlayer: VideoPlayer<GameID, VideoID>) { }

  play() {
    this.#video?.play()
  }

  invokeFrameHandlers: VideoFrameRequestCallback = (now, metadata) => {
  
    if (this.#video === this.videoPlayer.currentTrack) {
      const rawFrame = Math.round(metadata.mediaTime * this.#videoMeta!.frameRate) //when play, videoMeta must set
      const frameIdx = rawFrame - this.frameOffset
      const videoId = this.videoPlayer.currentTrack!.id
      for (let i = 0, len = this.videoPlayer.onFrameHandlers.length; i < len; ++i) {
        this.videoPlayer.onFrameHandlers[i].call(this, videoId, frameIdx, Date.now(), this.videoPlayer.currentTrack!)
      }
    }

    if (this.#video) {
      this.CallBackHandle = this.#video?.requestVideoFrameCallback(this.invokeFrameHandlers)
    }
  }
}

export class VideoPlayer<GameID extends string, VideoID extends string> {
  protected _currentTrack?: HTMLVideoElement
  public get currentTrack() { return this._currentTrack }
  // video meta
  #currentVideo: Video<GameID, VideoID> | null = null
  protected set currentVideo(v) { this.#currentVideo = v }
  get currentVideo() { return this.#currentVideo }

  // video sources
  videoSources = new VideoLoader<GameID, VideoID>()

  /**
   * A video player has two video track.
   * It uses one track to preload, and the other track to play
   */
  protected ATrack = new VideoTrack<GameID, VideoID>('A', this)
  protected BTrack = new VideoTrack<GameID, VideoID>('B', this)
  onFrameHandlers: Array<(vId: string, fIdx: number, ts: number, videoFrame: HTMLVideoElement) => void> = []

  // event handlers
  onPlay?: (videoId: VideoID) => void
  onPause?: (videoId: VideoID) => void
  onLoad?: (videoId: VideoID, type: 'Video' | 'Data') => void
  onUnload?: (videoId: VideoID, type: 'Video' | 'Data') => void
  public videos: Video<GameID, VideoID>[] = []

  constructor() {
    // auto switch to the next clip
    this.addOnFrameListener(async (videoId, frameIdx, ts, videoFrame) => {
      const curVideoIdx = this.videos.findIndex(v => v.id === videoId)
      if (curVideoIdx === -1) {
        console.warn('There must be something wrong since it cannot find the video from the videoList in the videoPlayer', videoId, this.videos)
        return
      }

      // preload to the other track
      if (frameIdx + 5 === this.currentVideo?.maxFrame) {
        // should load next
        const nextVideoIdx = curVideoIdx + 1
        if (this.videos[nextVideoIdx] !== undefined) {
          this.preloadToAnotherTrack(this.videos[nextVideoIdx], true)
        }
      }

      // load to the current track
      if (frameIdx + 1 === this.currentVideo?.maxFrame) {
        const nextVideoIdx = curVideoIdx + 1
        if (this.videos[nextVideoIdx] === undefined) {
          this.pause()
          return
        }
        await this.loadVideo(this.videos[nextVideoIdx], true)
        // should also load data after extension
      }
    })

    // videoSources
    this.videoSources.onLoad = (videoId: VideoID) => {
      this.onLoad?.(videoId, 'Video')
    }
    this.videoSources.onUnload = (videoId: VideoID) => {
      this.onUnload?.(videoId, 'Video')
    }
  }

  addOnFrameListener(fn: (vId: string, frameIdx: number, ts: number, videoFrame: HTMLVideoElement) => void) {
    this.onFrameHandlers.splice(this.onFrameHandlers.length - 2, 0, fn)
  }

  // data control
  async fetchVideos() {
    for (const video of this.videos) {
      await this.videoSources.fetch(video)
    }
  }
  isLoaded(video: Video<GameID, VideoID>) {
    return this.videoSources.isLoaded(video)
  }

  // this is for assertion?
  private whichOnPause = (ev: Event) => {
    const v = ev.target as HTMLVideoElement
    if (v.id === this.currentTrack?.id) {
      this.onPause?.(v.id as VideoID)
    }
  }
  private whichOnPlay = (ev: Event) => {
    const v = ev.target as HTMLVideoElement
    if (v.id === this.currentTrack?.id) {
      this.onPlay?.(v.id as VideoID)
    }
  }

  // video track control
  async loadVideo(video: Video<GameID, VideoID>, play = false) {
    // not load
    if (this.currentTrack?.id === video.id) return
    this.currentVideo = video

    // ensure load to preTrack
    if (this.ATrack.id !== video.id && this.BTrack.id !== video.id) {
      await this.preloadToAnotherTrack(video, play)
    }

    const [trackToLoad, trackToUnload] = this.ATrack.id === video.id
      ? [this.ATrack, this.BTrack]
      : [this.BTrack, this.ATrack]
    console.debug(`TrackToLoad: ${trackToLoad.name}_${trackToLoad.id} ${trackToLoad.video?.currentTime}, TrackToUnload: ${trackToUnload.name}_${trackToUnload.id}`)

    // clean the currentTrack
    trackToUnload.unLoad()
    trackToLoad.load(this.whichOnPlay, this.whichOnPause)
    this._currentTrack = trackToLoad.video
  }

  async preloadToAnotherTrack(newVideo: Video<GameID, VideoID>, play: boolean) {
    console.log('%cpreloadToSkip', 'background: #444; color: #bada55; padding: 2px; border-radius:2px', newVideo)
    await this.videoSources?.fetch(newVideo)

    // load to the ohter track, prefer ATrack
    const trackToLoad = this.BTrack.id === this.currentTrack?.id
      ? this.ATrack
      : this.BTrack
    console.debug(`Load to track_${trackToLoad.name}`)

    trackToLoad.setVideo(newVideo, this.videoSources?.getVideo(newVideo.id))
    play && trackToLoad.play()
  }

  // video control
  play() {
    if (!this.currentTrack || !this.currentTrack.paused) return
    console.log('play video')
    this.currentTrack.playbackRate = 0.75
    this.currentTrack.play()
    this.onPlay?.(this.currentTrack?.id as VideoID)
  }

  pause() {
    if (this.currentTrack?.paused) return
    this.currentTrack?.pause()
    this.onPause?.(this.currentTrack?.id as VideoID)
  }

  async seekTo(video: Video<GameID, VideoID>, frameIdx: number) {
    await this.loadVideo(video)

    this.currentTrack!.currentTime = (frameIdx / video.frameRate) + 0.001
    console.debug('switch to video:', video, 'set currentTime to frameIdx', frameIdx)
  }
}
