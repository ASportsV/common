import type { Evt } from '../@types'
import { evtFactories } from '../@utils'

const data: Readonly<Evt[]> = [

    evtFactories.PlayerHit({ player: 0, from: 13, to: 17, data: { hit: 16 } }),
    evtFactories.BallPlacement({ player: 0, from: 19, to: 21, data: { hit: 20 } }),
    evtFactories.BallPlacement({ player: 0, from: 29, to: 31, data: { hit: 30 } }),

    evtFactories.PlayerHit({ player: 1, from: 33, to: 38, data: { hit: 36 } }),
    evtFactories.BallPlacement({ player: 1, from: 42, to: 44, data: { hit: 43 } }),
] as const

export default data