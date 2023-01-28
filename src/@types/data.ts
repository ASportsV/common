// related to the data of a game

import { BBox, Point } from "./basic"

export interface Video<GameID extends string, VideoID extends string> {
  gameId: GameID,
  id: VideoID,
  maxFrame: number,
  startFame: number,
  width: number,
  height: number
  isTransit: boolean,
  loaded: boolean,
  frameRate: number,
  version: number
}

export interface Frame<PlayerID extends number> {
  idx: number
  // players
  players?: Player<PlayerID>[]
  mask?: CanvasImageSource // mask for all players
  // ball
  ball?: Ball
  // teamWithBall?: TeamId

  // court
  court?: [number, number][];
}

export interface PlayerTrackingData extends Point { }

/**
 * Segmentation data in frame
 */
export interface Player<PlayerID extends number> {
  readonly id: PlayerID
  // 3D tracking data
  // "tracking": {"x": 35.47, "y": 24.69, "defending": 202691}
  readonly tracking: PlayerTrackingData
  // data
  readonly bbox: BBox
  readonly keypoints: {
    nose: Point
    left_eye: Point
    right_eye: Point
    left_ear: Point
    right_ear: Point
    left_shoulder: Point
    right_shoulder: Point
    left_elbow: Point
    right_elbow: Point
    left_wrist: Point
    right_wrist: Point
    left_hip: Point
    right_hip: Point
    left_knee: Point
    right_knee: Point
    left_ankle: Point
    right_ankle: Point
  }
}

export interface Ball {
  // readonly player?: string
  // 3D tracking data
  readonly tracking: Point & { readonly h: number }
  readonly screenPos: Point
}

/**
 * @todo, need to update later
 */
export interface Placement {
  readonly idx: number;
  readonly wr?: number;
  readonly fill?: string;
}

// export enum COURT_SIDE {
//   NEAR_LEFT = 'NEAR_LEFT',
//   NEAR_RIGHT = 'NEAR_RIGHT',
//   FAR_LEFT = 'FAR_LEFT',
//   FAR_RIGHT = 'FAR_RIGHT',
//   LEFT = 'LEFT_COURT',
//   RIGHT = 'RIGHT_COURT'
// }