
import Dexie from 'dexie';
import { CacheFrameData, VideoDataVersion } from '../@types'

interface BaseTables<PID extends number> {
  frames: CacheFrameData<PID>,
  videoDataVersions: VideoDataVersion
}

export class Database<PID extends number, T extends Record<string, any> = {}, K = T & BaseTables<PID>> extends Dexie {
  // meta
  public readonly myTables: { [k in keyof K]: Dexie.Table<K[k]> }

  constructor(stores?: Record<keyof T, string>) {
    super("Database");
    this.version(6).stores({
      frames: "[gameId+videoId+idx]",
      videoDataVersions: "[gameId+videoId]",
      ...(stores ?? {})
    });

    this.myTables = ['frames', 'videoDataVersions', ...Object.keys(stores ?? {})]
      .reduce((o, d) => {
        o[d as keyof K] = this.table(d)
        return o
      }, {} as Record<keyof K, Dexie.Table<any>>)

  }
}