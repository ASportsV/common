import type { Evt } from '../@types'
import { evtFactories } from '../@utils'

const data: Readonly<Evt[]> = [

    evtFactories.PlayerHit({ player: 1, from: 13, to: 25, data: { hit: 20 } }),
    evtFactories.BallPlacement({ player: 1, from: 32, to: 34, data: { idx: 21, hit: 33 } }),

    evtFactories.PlayerHit({ player: 0, from: 40, to: 46, data: { hit: 43 } }),
    evtFactories.BallPlacement({ player: 0, from: 62, to: 64, data: { idx: 21, hit: 63 } }),

    evtFactories.PlayerHit({ player: 1, from: 71, to: 77, data: { hit: 73 } }),
    evtFactories.BallPlacement({ player: 1, from: 92, to: 94, data: { idx: 21, hit: 93 } }),

    evtFactories.PlayerHit({ player: 0, from: 96, to: 104, data: { hit: 100 } }),
    evtFactories.BallPlacement({ player: 0, from: 126, to: 128, data: { idx: 21, hit: 127 } }),

    evtFactories.PlayerHit({ player: 1, from: 133, to: 144, data: { hit: 139 } }),
    evtFactories.BallPlacement({ player: 1, from: 155, to: 157, data: { idx: 21, hit: 156 } }),

    evtFactories.PlayerHit({ player: 0, from: 165, to: 171, data: { hit: 167 } }),

    evtFactories.PlayerHit({ player: 1, from: 231, to: 239, data: { hit: 235 } }),
    evtFactories.BallPlacement({ player: 1, from: 247, to: 249, data: { idx: 21, hit: 248 } }),

    evtFactories.PlayerHit({ player: 0, from: 260, to: 268, data: { hit: 264 } }),
    evtFactories.BallPlacement({ player: 0, from: 287, to: 289, data: { idx: 21, hit: 288 } }),

    evtFactories.PlayerHit({ player: 1, from: 295, to: 306, data: { hit: 300 } }),
    evtFactories.BallPlacement({ player: 1, from: 318, to: 320, data: { idx: 21, hit: 319 } }),

    evtFactories.PlayerHit({ player: 0, from: 329, to: 339, data: { hit: 332 } }),
    evtFactories.BallPlacement({ player: 0, from: 351, to: 353, data: { idx: 21, hit: 352 } }),

    evtFactories.PlayerHit({ player: 1, from: 359, to: 367, data: { hit: 361 } }),
    /////


] as const

export default data