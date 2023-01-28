// import { TPlayerOption } from '../@types'
// import { Evt } from '../@types/event'
// import { evtFactories } from "./type"



// export const lookUpLastHitEvt = (globalFrameIdx: number, evt?: Evt): TPlayerOption => {
//     if (!evt) return TPlayerOption.Far
//     if (evtFactories.PlayerHit.match(evt) && evt.data.hit <= globalFrameIdx) return evt.player
//     return lookUpLastHitEvt(globalFrameIdx, evt.preEvt)
// }

export {}