
export interface Interval { start: number, end: number }
export interface Clip<VideoID extends string> {
    videoId: VideoID
    id: number
    interval: Interval
    // hackEvents?: PlayerHackEvt[]
    // audio?: boolean
    // text: string
    // terms: SpacyRet[]
}