import type { Evt } from '../@types'
import { evtFactories } from '../@utils'

const data: Readonly<Evt[]> = [

    evtFactories.PlayerHit({ player: 0, from: 0, to: 4, data: { hit: 2 } }),
    evtFactories.BallPlacement({ player: 0, from: 12, to: 14, data: { hit: 13 } }),

    evtFactories.PlayerHit({ player: 1, from: 15, to: 19, data: { hit: 17 } }),
    evtFactories.BallPlacement({ player: 1, from: 24, to: 26, data: { hit: 25 } }),

    evtFactories.PlayerHit({ player: 0, from: 27, to: 29, data: { hit: 27 } }),
    evtFactories.BallPlacement({ player: 0, from: 34, to: 36, data: { hit: 35 } }),

    evtFactories.PlayerHit({ player: 1, from: 37, to: 41, data: { hit: 39 } }),
    evtFactories.BallPlacement({ player: 1, from: 50, to: 52, data: { hit: 51 } }),

    evtFactories.PlayerHit({ player: 0, from: 53, to: 56, data: { hit: 54 } }),
    evtFactories.BallPlacement({ player: 0, from: 59, to: 61, data: { hit: 60 } }),

    evtFactories.PlayerHit({ player: 1, from: 65, to: 68, data: { hit: 67 } }),
    evtFactories.BallPlacement({ player: 1, from: 74, to: 77, data: { hit: 75 } }),

    evtFactories.PlayerHit({ player: 0, from: 79, to: 83, data: { hit: 80 } }),
    evtFactories.BallPlacement({ player: 0, from: 85, to: 87, data: { hit: 86 } }),

    evtFactories.PlayerHit({ player: 1, from: 89, to: 92, data: { hit: 95 } }),
    evtFactories.BallPlacement({ player: 1, from: 103, to: 105, data: { hit: 104 } }),

    evtFactories.PlayerHit({ player: 0, from: 109, to: 113, data: { hit: 111 } }),
    evtFactories.BallPlacement({ player: 0, from: 114, to: 116, data: { hit: 115 } }),

    evtFactories.PlayerHit({ player: 1, from: 118, to: 127, data: { hit: 122 } }),
] as const

export default data