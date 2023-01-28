import type { Evt } from '../@types'
import { evtFactories } from '../@utils'

const data: Readonly<Evt[]> = [

    evtFactories.PlayerHit({ player: 1, from: 15, to: 20, data: { hit: 19 } }),
    evtFactories.BallPlacement({ player: 1, from: 20, to: 22, data: { hit: 21 } }),
    evtFactories.BallPlacement({ player: 1, from: 29, to: 31, data: { hit: 30 } }),

    evtFactories.PlayerHit({ player: 0, from: 31, to: 34, data: { hit: 32 } }),
    evtFactories.BallPlacement({ player: 0, from: 43, to: 45, data: { hit: 44 } }),

    evtFactories.PlayerHit({ player: 1, from: 48, to: 52, data: { hit: 50 } }),

] as const

export default data