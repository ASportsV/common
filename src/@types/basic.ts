/**
 * Basic geometry data type
 */
export interface Point {
    readonly x: number
    readonly y: number
}
export type Route = [Point, Point, Point, Point]

export interface BBox {
    readonly x: number;
    readonly y: number;
    readonly w: number;
    readonly h: number
}

export enum Side {
    MIDDLE = 'MIDDLE',
    LEFT = 'LEFT',
    RIGHT = 'RIGHT'
}

export enum Direction {
    N = 'NORTH',
    S = 'SOUTH',
    E = 'EAST',
    W = 'WEST',
    NE = 'NORTH_EAST',
    NW = 'NORTH_WEST',
    SE = 'SOUTH_EAST',
    SW = 'SOUTH_WEST'
}
