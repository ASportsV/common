import type { BasePlayer, Ball } from '../@types';

export interface CacheFrameData<PlayerID extends number> {
    gameId: string
    videoId: string
    idx: number

    mask?: Blob
    // default as string
    players: BasePlayer<PlayerID>[]
    ball: Ball
    teamWithBall?: string
}

export interface VideoDataVersion {
    gameId: string
    videoId: string
    version: number
}