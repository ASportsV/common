import { Evt, TPlayerOption } from '../@types'
import { evtFactories } from '../@utils'

const data: Readonly<Evt[]> = [

  evtFactories.PlayerHit({ player: 1, from: 22, to: 31, data: { hit: 26 } }),
  evtFactories.BallPlacement({ player: 1, from: 41, to: 43, data: { idx: 21, hit: 42 } }),

  evtFactories.PlayerHit({ player: 0, from: 44, to: 48, data: { hit: 46 } }),

  ///////////////////>>>>>>>>
  /**
   * The case of covering backhand down the line
   * 1. looked ---> fov
   * 2. backend down the line --> potentialPlayerDistances, potential Routes
   * 3. get him close to the net ---> potential distances
   */
  evtFactories.BallPlacement({
    player: TPlayerOption.Near, from: 71, to: 73, data: {
      idx: 21, hit: 72,
      fov: TPlayerOption.Far, //@hack, directly use the opponent's pos
      coveredArea: true
    }
  }),

  evtFactories.PlayerHit({
    player: TPlayerOption.Far, from: 78, to: 89,
    data: {
      hit: 84,
      potentialRoutes: [
        [{ "x": 1194, "y": 196 }, { "x": 1236, "y": 105 }, { "x": 1322, "y": 579 }, { "x": 1349, "y": 789 }]
      ],

    }
  }),

  evtFactories.PlayerMove({
    player: TPlayerOption.Near, from: 89, to: 90, data: {
      hit: 89,
      potentialPlayerDistances: [
        { to: { x: 400, y: -60 } }
      ]
    }
  }),
  ///////////////////<<<<<<

  evtFactories.BallPlacement({ player: 1, from: 138, to: 140, data: { idx: 21, hit: 139 } }),
] as const

export default data