import type { Player, Ball } from '../@types';

export interface CacheFrameData<PlayerID extends number> {
    gameId: string
    videoId: string
    idx: number

    mask?: Blob
    // default as string
    players: Player<PlayerID>[]
    ball: Ball
    teamWithBall?: string
}

export interface VideoDataVersion {
    gameId: string
    videoId: string
    version: number
}