import type { Evt } from '../@types'
import { evtFactories } from '../@utils'

const data: Readonly<Evt[]> = [

    evtFactories.PlayerHit({ player: 1, from: 15, to: 19, data: { hit: 17 } }),
    evtFactories.BallPlacement({ player: 1, from: 26, to: 31, data: { hit: 28 } }),

    evtFactories.PlayerHit({ player: 0, from: 34, to: 37, data: { hit: 39 } }),

    evtFactories.PlayerHit({ player: 1, from: 56, to: 62, data: { hit: 58 } }),
    evtFactories.BallPlacement({ player: 1, from: 84, to: 86, data: { hit: 89 } }),

    evtFactories.PlayerHit({ player: 0, from: 104, to: 108, data: { hit: 106 } }),

] as const

export default data