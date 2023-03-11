import "./style.scss";
import React from "react";

import { Interval, Clip, BaseVideo } from '../../@types'
import { intervalIdGen, localFIdxToGlobalFIdx } from '../../@utils'

import { Interval as CInterval } from './Interval'

function pad(num: number) {
  return ("0" + num).slice(-2);
}
function hhmmss(secs: number) {
  const t = Math.floor(secs * 1000);
  // const ms = t % 1000;
  secs = Math.floor(t / 1000);
  let minutes = Math.floor(secs / 60);
  secs = secs % 60;
  minutes = minutes % 60;
  return `${pad(minutes)}:${pad(secs)}`;
}

interface BaseProps<GameID extends string, VideoID extends string> {
  mode?: 'S' | 'M' | 'L'

  videos: BaseVideo<GameID, VideoID>[];
  currentVideoIdx: number;
  currentFrameIdx: number

  // style
  containerHeightPadding?: number

  // encodedData?: TDataOption[]
  children?: (globalTrackWidth: number, globalMaxFrames: number) => React.ReactNode
  onClickInterval?: (clipId: number, globalFrameIdx: number) => void;  // 给父组件上传起止帧
}

export type TimelineProps<GameID extends string, VideoID extends string> = BaseProps<GameID, VideoID> & ({
  enableClips: false
} | {
  enableClips: true
  clips: Clip<VideoID>[]
  focusedClipId: number

  onUpsertClip?: (id: number, interval: Partial<Interval> | null) => void
})

// interface xProps {
  // showEvents: boolean
  // handlers
  // onParse: (id: number, rawtext: string, visFunc: (entities: Entity[]) => void) => void
  // onChangeText?: (id: number, rawtext: string) => void
// }

interface State {
  isDrawing: { intervalId: number, ox: number, omx: number } | null;  // omx: 全局用于dx ox: 本地坐标系
}

export class Timeline<GameID extends string, VideoID extends string> extends React.Component<TimelineProps<GameID, VideoID>, State> {

  get globalMaxFrames() { return this.props.videos.reduce((o, v) => o + v.maxFrame, -1) }
  get trackWidthFactor() {
    return this.globalMaxFrames < 500 ? 4 : 1
  }
  get totalTrackWidth() {
    return this.globalMaxFrames * this.trackWidthFactor
  }
  get globalCurFrameIdx() {
    const { currentFrameIdx, currentVideoIdx, videos } = this.props
    return localFIdxToGlobalFIdx(currentVideoIdx, currentFrameIdx, videos)
  }
  get maxTime() { return this.props.videos.reduce((o, v) => o + v.maxFrame / v.frameRate, 0) }
  get numberOfImg() { return Math.ceil(this.maxTime) * 2 }
  get intervalSelectorHeight() {
    const { mode = 'M' } = this.props
    return mode === 'M'
      ? 60
      : mode === 'S'
        ? 30
        : 90
  }
  get containerHeight() {
    const { containerHeightPadding = 60 } = this.props
    return this.intervalSelectorHeight + containerHeightPadding
  }

  #pointer = React.createRef<HTMLDivElement>()
  imgWidth = (this.intervalSelectorHeight * 1920) / 1080
  parentOffsetx: number = 0
  state: State = {
    isDrawing: null,
  }

  canvas?: HTMLCanvasElement
  ctx?: CanvasRenderingContext2D

  componentDidMount() {
    const { enableClips } = this.props

    if (enableClips) {
      window.addEventListener('mousemove', this.onDrawing)
      window.addEventListener('mouseup', this.onDrawEnd)
    }
  }

  componentDidUpdate(prevProps: Readonly<TimelineProps<GameID, VideoID>>): void {
    if (prevProps.currentFrameIdx !== this.props.currentFrameIdx) {
      if (this.#pointer.current) {
        const bbox = this.#pointer.current.getBoundingClientRect()
        if (bbox.left > (window.innerWidth || document.documentElement.clientWidth) || bbox.right < 0) {
          this.#pointer.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
        }
        // ;(this.#pointer.current as any).scrollIntoViewIfNeeded(true)
      }
    }

    // const { pickedPlayers } = this.props
    // if (Object.keys(preProps.pickedPlayers).length < Object.keys(pickedPlayers).length) {
    //   const { ctx, globalCurFrameIdx } = this
    //   const maxFIdx = Math.max(...Object.keys(pickedPlayers).map(f => +f))
    //   const { lv1Players, lv2Players } = pickedPlayers[maxFIdx]
    //   const maxY = 40

    //   const playersOn = Object.values(lv2Players).filter(p => p.on)
    //   let y1 = maxY - playersOn.length * 5
    //   ctx!.lineWidth = 1
    //   ctx!.strokeStyle = 'red'
    //   ctx!.beginPath()
    //   ctx?.moveTo(globalCurFrameIdx, y1)
    //   ctx?.lineTo(globalCurFrameIdx, maxY)
    //   ctx!.stroke()

    //   const lv1NotOnNotEmpty = Object.keys(lv1Players)
    //     .filter(pId => !playersOn.find(p => p.id === +pId) && lv1Players[+pId as PlayerId].type !== KeyPlayerType.EMPTY_PLAYER)
    //   ctx!.strokeStyle = '#f5f5f5'
    //   let y2 = y1 - lv1NotOnNotEmpty.length * 5
    //   ctx?.beginPath()
    //   ctx?.moveTo(globalCurFrameIdx, y2)
    //   ctx?.lineTo(globalCurFrameIdx, y1)
    //   ctx!.stroke()


    //   const lv1NotOnEmpty = Object.keys(lv1Players)
    //     .filter(pId => !playersOn.find(p => p.id === +pId) && lv1Players[+pId as PlayerId].type === KeyPlayerType.EMPTY_PLAYER)
    //   ctx!.strokeStyle = '#f5f5f5'
    //   let y3 = y2 - lv1NotOnEmpty.length * 5
    //   ctx?.beginPath()
    //   ctx?.moveTo(globalCurFrameIdx, y3)
    //   ctx?.lineTo(globalCurFrameIdx, y2)
    //   ctx!.stroke()
    // }


    // const { ctx } = this
    // if (prevProps.videos.length !== this.props.videos.length && ctx) {
    //   ctx!.lineWidth = 1
    //   ctx!.strokeStyle = 'green'
    //   ctx!.beginPath()
    //   ctx?.moveTo(0, 40 - 5 * 3)
    //   ctx?.lineTo(this.totalTrackWidth, 40 - 5 * 3)
    //   ctx!.stroke()

    //   ctx!.beginPath()
    //   ctx?.moveTo(0, 40 - 5 * 4)
    //   ctx?.lineTo(this.totalTrackWidth, 40 - 5 * 4)
    //   ctx!.stroke()
    // }
  }

  componentWillUnmount() {
    window.removeEventListener('mousemove', this.onDrawing)
    window.removeEventListener('mouseup', this.onDrawEnd)
  }

  /** Draw interval */
  onDrawStart = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (e.button !== 0) return;

    const parentDim = e.currentTarget.parentElement!.getBoundingClientRect()
    this.parentOffsetx = -parentDim.x + e.currentTarget.scrollLeft
    const mx = e.clientX // 鼠标点击位置, 全局坐标系
    const ox = mx + this.parentOffsetx // interval初始位置, 本地坐标系

    // click on progressbar
    if (e.clientY >= parentDim.bottom - 8) return

    if (!this.props.enableClips) {
      const globalFrameIdx = this.pos2frame(ox)
      this.props.onClickInterval?.(-1, globalFrameIdx)
    } else {
      const { clips } = this.props
      // if click within an interval
      if (clips.find(i => this.frame2pos(i.interval.start) <= ox && ox <= this.frame2pos(i.interval.end))) {
        const curFrame = this.pos2frame(ox)
        this.props.onClickInterval?.(-1, curFrame)
      } else {
        // 获取一个新的id
        const newIntervalId = intervalIdGen()
        // 新建一个interval 维护interval起始点从小到大
        let i = 0;
        for (; i < clips.length; i++) {
          if (this.frame2pos(clips[i].interval.start) > ox) {
            break;
          }
        }

        const startFrame = this.pos2frame(ox)
        const endFrame = this.pos2frame(ox + 0)
        const newInterval: Interval = {
          // x: ox,
          // w: 0,
          start: startFrame,
          end: endFrame
        }
        this.props.onUpsertClip?.(newIntervalId, newInterval)

        this.setState({
          isDrawing: { intervalId: newIntervalId, omx: mx, ox: ox },
        })
      }
    }
  }

  onDrawing = (e: MouseEvent) => {
    const { isDrawing } = this.state
    if (e.button !== 0 || isDrawing === null || !this.props.enableClips) return;

    const { clips } = this.props
    const mx = e.clientX
    const drawingInterval = clips.find(int => int.id === isDrawing.intervalId) // 浅复制 指针
    if(!drawingInterval) return

    // 更新这个interval的x和width
    let dx = mx - isDrawing.omx // 先获取x方向上的差值
    // 防止重叠
    const { wx, ex } = this.getEW(drawingInterval.id)!
    const maxdx = ex - isDrawing.ox
    const mindx = wx - isDrawing.ox
    if (dx < mindx) {
      dx = mindx
    } else if (dx > maxdx) {
      dx = maxdx
    }

    const startFrame = dx > 0 ? drawingInterval.interval.start : this.pos2frame(Math.max(isDrawing.ox + dx, 0))
    const w = Math.abs(dx)
    const endFrame = startFrame + this.pos2frame(w)
    this.props.onUpsertClip?.(drawingInterval.id, { start: startFrame, end: endFrame })
  }

  onDrawEnd = (e: MouseEvent) => {
    const { isDrawing } = this.state
    if (e.button !== 0 || isDrawing === null || !this.props.enableClips) return
    const { clips } = this.props
    const drawingIntervalIdx = clips.findIndex(int => int.id === isDrawing.intervalId)
    if(drawingIntervalIdx === -1) return

    const drawingInterval = clips[drawingIntervalIdx]

    this.setState({ isDrawing: null })
    const { start, end } = drawingInterval.interval
    if (end - start <= 2) {
      this.props.onUpsertClip?.(drawingInterval.id, null)
    }
    this.props.onClickInterval?.(drawingInterval.id, start)
  }

  updateInterval = (clipId: number, newInterval: { x?: number, w?: number }, end_ = false) => {
    if (!this.props.enableClips) return

    const { clips } = this.props
    const targetIntervalIdx = clips.findIndex(int => int.id === clipId)
    const targetInterval = clips[targetIntervalIdx].interval

    const start = newInterval.x ? this.pos2frame(newInterval.x) : targetInterval.start
    const end = newInterval.w ? (this.pos2frame(newInterval.w) + start) : targetInterval.end

    this.props.onUpsertClip?.(clipId, ((end - start <= 2) && end_) ? null : { start, end })
  }

  getEW = (intervalIdx: number) => {
    if (!this.props.enableClips) return

    const { clips } = this.props
    const { numberOfImg } = this

    const intervalCount = clips.findIndex(int => int.id === intervalIdx)!
    let ex = 0, wx = 0

    if (intervalCount === 0) {
      wx = this.parentOffsetx
    } else {
      wx = this.frame2pos(clips[intervalCount - 1].interval.end) + 1
    }

    if (intervalCount === clips.length - 1) {
      ex = (this.intervalSelectorHeight * 1920) / 1080 * numberOfImg + this.parentOffsetx
    } else {
      ex = this.frame2pos(clips[intervalCount + 1].interval.start) - 1
    }

    return { wx, ex }
  }

  pos2frame = (pos: number) => {
    const { totalTrackWidth: trackWidth, globalMaxFrames: maxFrame } = this
    return Math.round(Math.min(pos, trackWidth) / trackWidth * maxFrame)
  }
  frame2pos = (frame: number) => {
    const { totalTrackWidth: trackWidth, globalMaxFrames: maxFrame } = this
    return (frame / maxFrame) * (trackWidth)
  }

  // renderIndicator() {
  //   const { events, maxFrame, clips, encodedData = [] } = this.props
  //   const { imgWidth, numberOfImg } = this

  //   const indicators = []
  //   for (const clip of clips) {
  //     const { interval } = clip
  //     const coverEvents = events.filter(evt => evt.to >= interval.start && evt.from <= interval.end)
  //     for (const coverEvt of coverEvents) {
  //       if ((coverEvt?.type === EvtType.PlayerHit || coverEvt?.type === EvtType.PlayerMove)
  //         && encodedData.some(k => toPause.has(k))) {
  //         indicators.push(coverEvt)
  //         break
  //       }
  //     }
  //   }

  //   // render indicators
  //   return indicators.map(evt => {
  //     return <div key={`${evt.type}_${evt.from}_${evt.to}`} className={'trigger'} style={{
  //       left: `${imgWidth * numberOfImg * evt.data.hit! / maxFrame}px`,
  //     }}>

  //     </div>
  //   })
  // }

  renderClips() {
    if (!this.props.enableClips) return
    const { clips, focusedClipId } = this.props
    const { isDrawing } = this.state

    return clips.map(({ id: intervalId, interval }, idx) =>
      <CInterval
        key={intervalId}
        id={intervalId}
        x={this.frame2pos(interval.start)}
        w={this.frame2pos(interval.end - interval.start)}
        style={{ height: `${this.intervalSelectorHeight + 10}px` }}
        focused={focusedClipId === intervalId}
        onMoving={this.updateInterval}
        onAdjusting={this.updateInterval}
        onAdjustingEnd={this.updateInterval}
        getEW={this.getEW}
        initializing={isDrawing?.intervalId === intervalId}
        onClickInterval={(id) => {
          this.props.onClickInterval?.(intervalId, interval.start)
        }}
        {...interval}
      />
    )
  }

  render() {
    const { currentFrameIdx, videos } = this.props;
    const { maxTime, globalMaxFrames: maxFrame, intervalSelectorHeight, globalCurFrameIdx, containerHeight } = this

    const currentTime = currentFrameIdx / (videos[0]?.frameRate ?? 30)

    return (
      <div className="timeline-container" style={{ flex: `0 0 ${containerHeight}px` }}>
        <div className="timeline"
          onMouseDown={this.onDrawStart}>
          <div className="time-info">
            <span>
              {" "}
              {hhmmss(currentTime)} ({currentFrameIdx}) / {hhmmss(maxTime)} ({maxFrame})
            </span>
          </div>
          <div className="pointer" ref={this.#pointer}
            style={{
              left: `calc(12px + ${this.frame2pos(globalCurFrameIdx)}px)`,
            }}
          ></div>

          <div id="timeline-progress" className="track-container">
            {videos.map(v => <div
              key={v.id}
              className="track"
              style={{
                width: `${v.maxFrame * this.trackWidthFactor}px`,
                height: intervalSelectorHeight,
                backgroundColor: v.isTransit ? '#515151' : 'rgb(116 99 57)',
                opacity: ((v.isTransit || v.loadedData === 1) && v.loadedVideo === 1) ? 1 : 0.5
              }}>
              <span className="video-name">{v.id}</span>
              {/* {this.renderIndicator()} */}
              {this.props.children?.(this.totalTrackWidth, this.globalMaxFrames)}
            </div>
            )}
            {/*<div className="track">
               {Array(numberOfImg).fill(0)
                .map((_, idx) => (
                  <img
                    alt='bg'
                    key={`img_${idx}`}
                    className="img"
                    src={`/assets/${videoId}/reduced_frames/${Math.floor(
                      (maxFrame * idx) / numberOfImg
                    )}.jpg`}
                    // x={idx * imgWidth}
                    draggable="false"
                    height={this.intervalSelectorHeight}
                    width={imgWidth}
                  />
                ))} 
            </div>*/}
            {this.renderClips()}
          </div>

          {/* <canvas
            ref={ref => {
              if (!ref || this.canvas) return
              this.canvas = ref
              this.ctx = ref.getContext('2d')!
            }}
            className="debug-timeline"
            width={`${this.totalTrackWidth}px`}
            height={`${40}px`}>
          </canvas> */}

        </div>
      </div>
    );
  }
}
