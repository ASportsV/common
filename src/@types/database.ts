import type { Player, Ball } from '../@types';

export interface CacheFrameData {
    gameId: string
    videoId: string
    idx: number

    mask?: Blob
    // default as string
    players: Player<string>[]
    ball: Ball
    teamWithBall?: string
}

export interface VideoDataVersion {
    gameId: string
    videoId: string
    version: number
}