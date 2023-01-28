import { Evt, TPlayerOption } from '../@types'
import { evtFactories } from '../@utils'

const data: Readonly<Evt[]> = [

    evtFactories.BallPlacement({ player: TPlayerOption.Near, from: 2, to: 4, data: { hit: 3 } }),
    evtFactories.PlayerHit({ player: TPlayerOption.Far, from: 10, to: 18, data: { hit: 15 } }),
    evtFactories.BallPlacement({ player: TPlayerOption.Far, from: 42, to: 44, data: { hit: 43 } }),

    evtFactories.PlayerHit({ player: TPlayerOption.Near, from: 45, to: 52, data: { hit: 49 } }),
    evtFactories.BallPlacement({ player: TPlayerOption.Near, from: 76, to: 78, data: { hit: 77 } }),

    evtFactories.PlayerHit({ player: TPlayerOption.Far, from: 85, to: 95, data: { hit: 92 } }),
    evtFactories.BallPlacement({ player: TPlayerOption.Far, from: 114, to: 116, data: { hit: 115 } }),

    evtFactories.PlayerHit({ player: TPlayerOption.Near, from: 124, to: 129, data: { hit: 126 } }),
    evtFactories.BallPlacement({ player: TPlayerOption.Near, from: 184, to: 187, data: { hit: 185 } }),

    evtFactories.PlayerHit({ player: TPlayerOption.Far, from: 200, to: 210, data: { hit: 207 } }),
    evtFactories.BallPlacement({ player: TPlayerOption.Far, from: 222, to: 224, data: { hit: 223 } }),

] as const

export default data