import Dexie from 'dexie';
import { BBox } from '../@types'

interface Frame {
    persons: Array<{
        bbox: BBox
        data: ImageData
    }>
    videoId: string
    idx: number
}

interface RawFrame {
    frame: string
    videoId: string
    idx: number
}

//
// Declare Database
//
export class Database extends Dexie {
    public frames: Dexie.Table<Frame, number>; // id is number in this case
    public rawVideo: Dexie.Table<RawFrame, number>;

    constructor() {
        super("Database");
        this.version(2).stores({
            frames: "[idx+videoId]",
            rawVideo: "[idx+videoId]",
        });
        this.frames = this.table('frames')
        this.rawVideo = this.table('rawVideo')
    }
}

export const db = new Database()
