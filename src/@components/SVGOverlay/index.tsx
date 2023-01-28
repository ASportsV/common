import './style.scss'
import React from 'react'

import type { Ball, Frame, Player, Video } from '../../@types'

export interface SVGLayerProps<GameID extends string, VideoID extends string, PlayerID extends number> {
  // width: number
  // height: number
  currentVideo: Video<GameID, VideoID>
  currentFrameData?: Frame<PlayerID>
  activeBBoxes?: Array<PlayerID | 'ball'>

  // animatedFrameIdx: number
  onContextMenu?: (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => void
  onClickBG?: () => void
  onClickPlayer?: (player: Player<PlayerID>, idx: number) => void
  onClickBall?: (ball: Ball) => void
  onDBClick?: () => void
}

function convertRemToPixels(rem: number) {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

export class SVGLayer<GameID extends string, VideoID extends string, PlayerID extends number> extends React.Component<SVGLayerProps<GameID, VideoID, PlayerID>> {

  render() {
    const {
      currentVideo,
      currentFrameData,
      activeBBoxes
    } = this.props
    const { height = 0, width = 0 } = currentVideo ?? {}

    const players = currentFrameData?.players ?? []
    const ball = currentFrameData?.ball ?? null

    return <svg className="overlay" height={height} width={width}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio='xMinYMin meet'
      onClick={(e) => {
        if (e.target === e.currentTarget)
          this.props.onClickBG?.()
      }}
      onContextMenu={this.props.onContextMenu}
      onDoubleClick={e => {
        if (e.target === e.currentTarget)
          this.props.onDBClick?.()
      }}
    >
      <defs>
        <filter x="0" y="0" width="1" height="1" id="solid">
          <feFlood flood-color="yellow" result="bg" />
          <feMerge>
            <feMergeNode in="bg" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {players.map((player, idx) => <rect key={idx}
        className={`bbox ${activeBBoxes?.includes(player.id) ? 'active' : ''}`}
        x={player.bbox.x}
        y={player.bbox.y}
        width={player.bbox.w}
        height={player.bbox.h}

        onContextMenu={e => {
          e.preventDefault()
          e.stopPropagation()
          // this.props.onClickPersonBBox(idx, b)
        }}
        onClick={e => {
          e.stopPropagation()
          this.props.onClickPlayer?.(player, idx)
        }}
      />)}

      {ball && <circle
        className={`ball ${activeBBoxes?.includes('ball') ? 'active' : ''}`}
        cx={ball.screenPos.x}
        cy={ball.screenPos.y}
        r={5} // hardcode value
        onClick={e => {
          e.stopPropagation()
          this.props.onClickBall?.(ball)
        }}
      >
      </circle>}
      {this.props.children}
    </svg>
  }
}