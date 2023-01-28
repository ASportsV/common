import type { Evt } from '../@types'
import { evtFactories } from '../@utils'

const data: Readonly<Evt[]> = [

    evtFactories.PlayerHit({ player: 0, from: 5, to: 12, data: { hit: 9 } }),
    evtFactories.BallPlacement({ player: 0, from: 20, to: 23, data: { idx: 21, hit:21 } }),

    evtFactories.PlayerHit({ player: 1, from: 28, to: 38, data: { hit: 36 } }),
    evtFactories.BallPlacement({ player: 1, from: 51, to: 54, data: { idx:0, hit: 52 } }),

    evtFactories.PlayerHit({ player: 0, from: 58, to: 63, data: { hit: 60 } }),
    evtFactories.BallPlacement({ player: 0, from: 79, to: 81, data: { idx:0, hit: 80 } }),

    evtFactories.PlayerHit({ player: 1, from: 92, to: 97, data: { hit: 94 } }),
    evtFactories.BallPlacement({ player: 1, from: 119, to: 121, data: { idx:0, hit: 120 } }),

    evtFactories.PlayerHit({ player: 0, from: 126, to: 134, data: { hit: 129 } }),
    evtFactories.BallPlacement({ player: 0, from: 147, to: 149, data: { idx:0, hit: 148 } }),

    evtFactories.PlayerHit({ player: 1, from: 162, to: 169, data: { hit: 164 } }),
    evtFactories.BallPlacement({ player: 1, from: 203, to: 205, data: { idx:0, hit: 204 } }),

    evtFactories.PlayerHit({ player: 0, from: 214, to: 220, data: { hit: 217 } }),
    evtFactories.BallPlacement({ player: 0, from: 233, to: 235, data: { idx:0, hit: 234 } }),

    evtFactories.PlayerHit({ player: 1, from: 246, to: 252, data: { hit: 249 } }),
    evtFactories.BallPlacement({ player: 1, from: 272, to: 274, data: { idx:0, hit: 273 } }),

    evtFactories.PlayerHit({ player: 0, from: 275, to: 281, data: { hit: 277 } }),
    evtFactories.BallPlacement({ player: 0, from: 315, to: 317, data: { idx:0, hit: 316 } }),

    evtFactories.PlayerHit({ player: 1, from: 331, to: 339, data: { hit: 336 } }),
    evtFactories.BallPlacement({ player: 1, from: 354, to: 356, data: { idx:0, hit: 355 } }),

] as const

export default data