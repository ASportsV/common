
import { Database } from "./Database"
import { loadFramesFromDBToMem } from './loadFrames'

declare const self: DedicatedWorkerGlobalScope;
export default {} as typeof Worker & { new(): Worker };

if (process.env.NODE_ENV !== 'production') {
  (global as any).$RefreshReg$ = () => { };
  (global as any).$RefreshSig$ = () => () => { };
}

onmessage = async (e) => {
  const db = new Database()

  switch (e.data[0]) {
    case 'Frames':
      const frames = await loadFramesFromDBToMem(e.data[1], db)
      postMessage(['Frames', frames])
      break
  }
}
