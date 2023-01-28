import { Point } from "../@types"

export const arr2Point = (arr: [number, number]): Point => ({ x: arr[0], y: arr[1] })

export const distPoints = (p1: Point, p2: Point) => {

    const dx = p1.x - p2.x
    const dy = p1.y - p2.y

    return Math.sqrt(dx * dx + dy * dy)
}

export const diffPoints = (p1: Point, p2: Point) => ({ x: p1.x - p2.x, y: p1.y - p2.y })
export const addPoints = (p1: Point, p2: Point) => ({ x: p1.x + p2.x, y: p1.y + p2.y })
export const centerOfPoints = (points: Point[] | Array<[number, number]>): Point => {
    if (typeof points[0] === 'object') {
        const oPoints: Point[] = points as Point[]
        return {
            x: oPoints.reduce((o, p) => o + p.x, 0) / oPoints.length,
            y: oPoints.reduce((o, p) => o + p.y, 0) / oPoints.length,
        }
    }
    const aPoints: Array<[number, number]> = points as Array<[number, number]>
    return {
        x: aPoints.reduce((o, p) => o + p[0], 0) / aPoints.length,
        y: aPoints.reduce((o, p) => o + p[1], 0) / aPoints.length,
    }
}

export const extendCrossLine = (from: Point, to: Point, extend: number = 0): Point => {
    let k = (to.y - from.y) / (to.x - from.x)
    k = -1 / k

    const center = centerOfPoints([from, to])

    const theta = Math.atan(k)
    const dy = Math.abs(extend * Math.sin(theta))
    const dx = Math.abs(extend * Math.cos(theta))

    const direc = (extend / Math.abs(extend)) || 0

    return { x: center.x + direc * dx, y: center.y + direc * dy }
}

export const extendLine = (from: Point, to: Point, extend: number = 0): Point => {

    const k = (to.y - from.y) / (to.x - from.x)

    const theta = Math.atan(k)
    const dy = Math.abs(extend * Math.sin(theta))
    const dx = Math.abs(extend * Math.cos(theta))

    const direcX = (extend / Math.abs(extend)) || 0 //((to.x - from.x) / Math.abs(to.x - from.x)) || 0
    const direcY = direcX //((to.y - from.y) / Math.abs(to.y - from.y)) || 0

    return { x: to.x + direcX * dx, y: to.y + direcY * dy }
}
// perpendicular line
export const crossLine = (from: Point, to: Point, extend: number = 0): Point => {
    const k = (to.y - from.y) / (to.x - from.x)
    const k2 = -1 / k
    const theta = Math.atan(k2)
    const cP = centerOfPoints([from, to])

    const dy = Math.abs(extend * Math.sin(theta))
    const dx = Math.abs(extend * Math.cos(theta))

    const direcX = ((to.x - from.x) / Math.abs(to.x - from.x)) || 0
    const direcY = ((to.y - from.y) / Math.abs(to.y - from.y)) || 0

    return { x: cP.x + direcX * dx, y: cP.y + -direcY * dy }

}

const getLineFromPoints = (line: [Point, Point]) => {
    const k = (line[1].y - line[0].y) / (line[1].x - line[0].x)
    const b = line[0].y - k * line[0].x

    return { k, b }
}


export const intersectionOf2Lin = (line1: [Point, Point], line2: [Point, Point]): Point => {
    const { k: k1, b: b1 } = getLineFromPoints(line1)
    const { k: k2, b: b2 } = getLineFromPoints(line2)

    // console.debug(`
    //   ${line1[0].y} = ${k1 * line1[0].x + b1}
    //   ${line1[1].y} = ${k1 * line1[1].x + b1}

    //   ${line2[0].y} = ${k2 * line2[0].x + b2}
    //   ${line2[1].y} = ${k2 * line2[1].x + b2}
    // `)

    const xi = (b2 - b1) / (k1 - k2)
    const yi = k1 * xi + b1

    // console.debug(`
    //   line1: (${line1[0].x},${line1[0].y}) (${line1[1].x},${line1[1].y})
    //   line2: (${line2[0].x},${line2[0].y}) (${line2[1].x},${line2[1].y})
    // `)
    // console.debug(`
    //   xi: ${xi}, yi: ${yi}
    // `)

    return { x: xi, y: yi }
}


export const atan2Normalized = (y: number, x: number) => {
    var result = Math.atan2(y, x);
    if (result < 0) {
        result += (2 * Math.PI);
    }
    return result;
}

export function getAngle(x1: number, y1: number, x2: number, y2: number) {
    const [dx, dy] = [x2 - x1, y2 - y1]
    let radians = (dx || dy)
        ? Math.atan2(dy, dx)
        : 0
    if (radians < 0) radians += 2 * Math.PI
    return radians * (180 / Math.PI)
}

// Return: Close approximation of the length of a Cubic Bezier curve
//
// Ax,Ay,Bx,By,Cx,Cy,Dx,Dy: the 4 control points of the curve
// sampleCount [optional, default=40]: how many intervals to calculate
// Requires: cubicQxy (included below)
//
export function cubicBezierLength(A: Point, B: Point, C: Point, D: Point, sampleCount = 40) {
    var ptCount = sampleCount;
    var totDist = 0;
    var lastX = A.x;
    var lastY = A.y;
    var dx, dy;
    for (var i = 1; i < ptCount; i++) {
        var pt = cubicQxy(i / ptCount, A.x, A.y, B.x, B.y, C.x, C.y, D.x, D.y);
        dx = pt.x - lastX;
        dy = pt.y - lastY;
        totDist += Math.sqrt(dx * dx + dy * dy);
        lastX = pt.x;
        lastY = pt.y;
    }
    dx = D.x - lastX;
    dy = D.y - lastY;
    totDist += Math.sqrt(dx * dx + dy * dy);
    return Math.floor(totDist);
}


// Return: an [x,y] point along a cubic Bezier curve at interval T
//
// Attribution: Stackoverflow's @Blindman67
// Cite: http://stackoverflow.com/questions/36637211/drawing-a-curved-line-in-css-or-canvas-and-moving-circle-along-it/36827074#36827074
// As modified from the above citation
// 
// t: an interval along the curve (0<=t<=1)
// ax,ay,bx,by,cx,cy,dx,dy: control points defining the curve
//
function cubicQxy(t: number, ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx: number, dy: number) {
    ax += (bx - ax) * t;
    bx += (cx - bx) * t;
    cx += (dx - cx) * t;
    ax += (bx - ax) * t;
    bx += (cx - bx) * t;
    ay += (by - ay) * t;
    by += (cy - by) * t;
    cy += (dy - cy) * t;
    ay += (by - ay) * t;
    by += (cy - by) * t;
    return ({
        x: ax + (bx - ax) * t,
        y: ay + (by - ay) * t
    });
}

// cubic bezier percent is 0-1
export function getCubicBezierXYatPercent(startPt: Point, controlPt1: Point,
    controlPt2: Point, endPt: Point, percent: number) {
    const x = CubicN(percent, startPt.x, controlPt1.x, controlPt2.x, endPt.x);
    const y = CubicN(percent, startPt.y, controlPt1.y, controlPt2.y, endPt.y);
    return ({ x: x, y: y });
}

// cubic helper formula at percent distance
function CubicN(pct: number, a: number, b: number, c: number, d: number) {
    var t2 = pct * pct;
    var t3 = t2 * pct;
    return a + (-a * 3 + pct * (3 * a - a * pct)) * pct
        + (3 * b + pct * (-6 * b + b * 3 * pct)) * pct
        + (c * 3 - c * 3 * pct) * t2
        + d * t3;
}