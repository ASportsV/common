import type { TDataOption } from '../@types'

export const toPause = new Set<TDataOption>([
    'action', 'ballSpeed',
    'technique', 'playerDirection', 'gravityCenter',
    'distance',
    'fov',
    
    // tactical
    'potentialRoutes', 'potentialPlacements', 'potentialPlayerDistances'
])
