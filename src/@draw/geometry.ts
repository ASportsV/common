import type { Point, Route } from "../@types"

interface Style {
  fillStyle?: string | CanvasGradient | CanvasPattern | { pattern: CanvasPattern, opacity: number }
  lineWidth?: number
  strokeStyle?: string
  font?: string
  textBaseline?: CanvasTextBaseline
  lineCap?: CanvasLineCap
  lineJoin?: CanvasLineJoin
}
type Entries<T> = {
  [K in keyof T]: [K, T[K]]
}[keyof T][]

// type Style = Partial<Pick<CanvasRenderingContext2D, 'fillStyle' | 'strokeStyle' | 'lineWidth' | 'font' | 'textBaseline'>>

function entries<T extends {}>(obj: T): Entries<T> {
  return Object.entries(obj) as any;
}

function applyStyle(ctx: CanvasRenderingContext2D, style: Style = {}) {
  entries(style).forEach((e) => {
    if (e?.[0] === 'lineWidth' && e[1] !== undefined) {
      ctx.lineWidth = e[1] // value
    }
    if (e?.[0] === 'strokeStyle' && e[1] !== undefined) {
      ctx.strokeStyle = e[1]//value
    }
    if (e?.[0] === 'font' && e[1]) {
      ctx.font = e[1]
    }
    if (e?.[0] === 'textBaseline' && e[1]) {
      ctx.textBaseline = e[1]
    }
    if (e?.[0] === 'lineCap' && e[1]) {
      ctx.lineCap = e[1]
    }
    if (e?.[0] === 'lineJoin' && e[1]) {
      ctx.lineJoin = e[1]
    }
  })

  if (style.fillStyle) {
    const value = style.fillStyle
    if (typeof value === 'object' && 'pattern' in value && 'opacity' in value) {
      ctx.fillStyle = value.pattern
      ctx.globalAlpha = value.opacity;
    } else {
      ctx.fillStyle = value
    }
  }
}

function drawLine(ctx: CanvasRenderingContext2D, sx: number, sy: number, dx: number, dy: number, style: Style = {}) {
  ctx.save()
  applyStyle(ctx, style)
  ctx.beginPath()
  ctx.moveTo(sx, sy)
  ctx.lineTo(dx, dy)
  ctx.stroke()
}

function drawHLine(ctx: CanvasRenderingContext2D, sx: number, sy: number, dx: number, style: Style = {}) {
  drawLine(ctx, sx, sy, dx, sy, style)
}

function drawPolygon(ctx: CanvasRenderingContext2D, points: Point[], style?: Style): void;
function drawPolygon(ctx: CanvasRenderingContext2D, points: [number, number][], style?: Style): void;
function drawPolygon(ctx: CanvasRenderingContext2D, points: [number, number][] | Point[], style: Style = {}): void {

  if (points.length === 0) return
  const pointsToDraw: [number, number][] = Array.isArray(points[0])
    ? points as [number, number][]
    : (points as Point[]).map(p => ([p.x, p.y])) as [number, number][]

  let [x, y] = pointsToDraw[0]

  ctx.save()
  applyStyle(ctx, style)

  ctx.beginPath()
  ctx.moveTo(x, y)
  for (let i = 1, len = pointsToDraw.length; i < len; ++i) {
    ([x, y] = pointsToDraw[i]);
    ctx.lineTo(x, y)
  }
  ctx.closePath();
  ctx.stroke()

  ctx.fill();
  ctx.restore()
}


function drawPolyline(ctx: CanvasRenderingContext2D, points: [number, number][] | Point[], style: Style = {}): void {

  if (points.length === 0) return
  const pointsToDraw: [number, number][] = Array.isArray(points[0])
    ? points as [number, number][]
    : (points as Point[]).map(p => ([p.x, p.y])) as [number, number][]

  let [x, y] = pointsToDraw[0]

  ctx.save()
  applyStyle(ctx, style)

  ctx.beginPath()
  ctx.moveTo(x, y)
  for (let i = 1, len = pointsToDraw.length; i < len; ++i) {
    ([x, y] = pointsToDraw[i]);
    ctx.lineTo(x, y)
  }
  // ctx.closePath();
  ctx.stroke()

  // ctx.fill();
  ctx.restore()
}


function drawCurve(ctx: CanvasRenderingContext2D, route: Route, style: Style = {}) {

  ctx.save()
  applyStyle(ctx, style)

  ctx.beginPath();
  ctx.moveTo(route[0].x, route[0].y)
  ctx.bezierCurveTo(
    route[1].x, route[1].y,
    route[2].x, route[2].y,
    route[3].x, route[3].y
  )
  ctx.stroke()
  // ctx.fill();
  ctx.restore()
  // ctx.fillStyle = ctx.strokeStyle
  // triangleAt(ctx, route[2], route[3], 10)
}

function triangleAt(ctx: CanvasRenderingContext2D, from: Point, center: Point, r: number, style: Style = {}) {
  ctx.save()
  applyStyle(ctx, style)

  // draw arrow
  let x_center = center.x;
  let y_center = center.y;

  let angle, x, y
  ctx.beginPath();

  angle = Math.atan2(center.y - from.y, center.x - from.x)
  x_center -= r * Math.cos(angle);
  y_center -= r * Math.sin(angle);
  x = r * Math.cos(angle) + x_center
  y = r * Math.sin(angle) + y_center
  ctx.moveTo(x, y);

  angle += (1 / 3) * (2 * Math.PI)
  x = r * Math.cos(angle) + x_center
  y = r * Math.sin(angle) + y_center
  ctx.lineTo(x, y);

  angle += (1 / 3) * (2 * Math.PI)
  x = r * Math.cos(angle) + x_center
  y = r * Math.sin(angle) + y_center
  ctx.lineTo(x, y);

  ctx.closePath();


  ctx.fill();
  ctx.restore()
}

interface ArrowParams {
  from: Point
  to: Point
  arrowSize: number
  z?: boolean
  double?: boolean
}
function drawArrow(ctx: CanvasRenderingContext2D, { from, to, arrowSize, z = false, double = false }: ArrowParams, style: Style = {}) {
  // draw line
  ctx.save()
  applyStyle(ctx, style)

  if (z) {
    ctx.transform(1, 0, -0.2, .8, from.x, from.y);
  }
  const nFrom = z ? { x: 0, y: 0 } : from
  const nTo = z ? { x: to.x - from.x, y: to.y - from.y } : to

  if (double) {
    triangleAt(ctx, nTo, nFrom, arrowSize, style)
  }

  ctx.beginPath();
  const angle = Math.atan2(nTo.y - nFrom.y, nTo.x - nFrom.x)
  ctx.moveTo(nFrom.x + arrowSize * Math.cos(angle), nFrom.y + arrowSize * Math.sin(angle));
  ctx.lineTo(nTo.x - arrowSize * Math.cos(angle), nTo.y - arrowSize * Math.sin(angle));
  ctx.stroke();
  ctx.fill();

  triangleAt(ctx, nFrom, nTo, arrowSize, style)
  ctx.restore()
}

interface CircleParams {
  x: number, y: number, r: number, angle?: number, z?: boolean
}
function drawCircle(ctx: CanvasRenderingContext2D, { x, y, r, angle = 2 * Math.PI, z = false }: CircleParams, style: Style = {}) {
  ctx.save()
  applyStyle(ctx, style)

  if (z) {
    ctx.transform(1, 0, -0.2, .5, x, y);
  }
  x = z ? 0 : x
  y = z ? 0 : y

  ctx.beginPath();
  ctx.arc(x, y, r, 0, angle)
  ctx.lineTo(x, y)

  ctx.stroke()
  ctx.fill();

  ctx.restore()
}

interface RingParams extends CircleParams {
  r2: number
}
function drawRing(ctx: CanvasRenderingContext2D, { x, y, r, r2, angle = 2 * Math.PI, z = false }: RingParams, style: Style = {}) {
  ctx.save()
  applyStyle(ctx, style)

  // draw outer
  drawCircle(ctx, { x, y, r: r2, angle, z })

  // cut inner
  ctx.globalCompositeOperation = 'destination-out'
  drawCircle(ctx, { x, y, r, angle, z })

  ctx.restore()
}

interface RoundedRectParams {
  x: number
  y: number
  w: number
  h: number
  r: number
  z?: boolean
}
function drawRoundedRect(ctx: CanvasRenderingContext2D, { x, y, w, h, r, z = false }: RoundedRectParams, style: Style = {}) {
  ctx.save()
  applyStyle(ctx, style)

  if (z) {
    ctx.transform(1, 0, -0.1, .9, x, y);
  }
  x = z ? 0 : x
  y = z ? 0 : y

  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();

  ctx.stroke()
  ctx.fill();

  ctx.restore()
}

interface TextParams {
  x: number,
  y: number,
  text: string
  z?: boolean
}
/**
 * use top left as the default baseline
 * @param ctx 
 * @param param1 
 * @param style 
 */
function drawText(ctx: CanvasRenderingContext2D, { x, y, text, z = false }: TextParams, style: Style = {}) {
  ctx.save()
  applyStyle(ctx, style)
  ctx.textBaseline = 'top'

  if (z) {
    ctx.transform(1, 0, -0.1, .9, x, y);
  }
  x = z ? 0 : x
  y = z ? 0 : y

  ctx.strokeText(text, x, y)
  ctx.fillText(text, x, y)
  ctx.restore()
}

interface ConeParams {
  x: number
  y: number
  r: number
  h: number
  r1?: number
}
type Point3D = [number, number, number]
function drawCone(ctx: CanvasRenderingContext2D, { x, y, r, h, r1 = 0 }: ConeParams, style: Style = {}) {
  ctx.save()
  applyStyle(ctx, style)

  const dAlpha = 0.1;

  const nodes: Point3D[] = [
    // [0, -h, 0]
  ];
  const uNodes: Point3D[] = []

  const faces: [Point3D, Point3D, Point3D, Point3D][] = [];
  //creating nodes
  let alpha = 0;
  // let i = 1;
  for (let i = 0; alpha <= 2 * Math.PI + dAlpha; ++i) {
    // while () {
    let x = r * Math.cos(alpha);
    let z = r * Math.sin(alpha);
    nodes[i] = [x, 0, z];
    alpha += dAlpha;

    x = r1 * Math.cos(alpha);
    z = r1 * Math.sin(alpha);
    uNodes[i] = [x, -(1 - r1 / r) * h, z];
  }

  //creating faces
  let p = 0;
  for (let n = 0; n < nodes.length - 1; n++) {
    let face: [Point3D, Point3D, Point3D, Point3D] = [uNodes[p], nodes[p], nodes[p + 1], uNodes[p + 1]];
    faces[n] = face;
    p += 1;
  }

  // Rotate shape around the x-axis
  function rotateX3D(theta: number) {
    const sinTheta = Math.sin(-theta);
    const cosTheta = Math.cos(-theta);

    for (let n = 0; n < nodes.length; n++) {
      let node = nodes[n];
      let y = node[1];
      let z = node[2];
      node[1] = y * cosTheta - z * sinTheta;
      node[2] = z * cosTheta + y * sinTheta;

      node = uNodes[n];
      y = node[1];
      z = node[2];
      node[1] = y * cosTheta - z * sinTheta;
      node[2] = z * cosTheta + y * sinTheta;
    }
  }

  //rotateZ3D(10 * Math.PI / 180);
  rotateX3D((20 * Math.PI) / 180);

  ctx.translate(x, y);

  // Draw faces
  for (let i = 0; i < faces.length; i++) {
    const [v0, v1, v2, v3] = faces[i]
    ctx.beginPath();
    ctx.moveTo(v0[0], v0[1]);
    ctx.lineTo(v1[0], v1[1]);
    ctx.lineTo(v2[0], v2[1]);
    ctx.lineTo(v3[0], v3[1]);
    ctx.lineTo(v0[0], v0[1]);
    ctx.fill();
    // ctx.stroke();
    ctx.closePath();
  }

  ctx.restore()
}

interface LabelParams {
  x: number,
  y: number,
  w: number, h: number,
  text: string
}
function drawLabel(ctx: CanvasRenderingContext2D, { x, y, w, h, text }: LabelParams, style: Style = {}) {
  ctx.save()
  applyStyle(ctx, style)

  ctx.beginPath()
  ctx.moveTo(x, y);
  ctx.lineTo(x + 100, y - 50)
  ctx.stroke()

  ctx.rect(x + 100, y - 50, w, h)
  ctx.stroke()
  ctx.fillStyle = '#fff'
  ctx.fill()
  applyStyle(ctx, style)

  // ctx.strokeText(text, x + 110, y - 50)
  ctx.fillText(text, x + 105, y - 50 + 5)
  ctx.restore()
}


export {
  drawLine as line,
  drawHLine as hLine,
  drawPolygon as polygon,
  drawPolyline as polyline,
  drawArrow as arrow,
  drawCurve as curve,
  drawCircle as circle,
  drawRing as ring,
  drawRoundedRect as roundedRect,
  drawText as text,
  drawCone as cone,
  drawLabel as label,
}

/**
 * Draws a cardinal spline through given point array. Points must be arranged
 * as: [x1, y1, x2, y2, ..., xn, yn]. It adds the points to the current path.
 *
 * The method continues previous path of the context. If you don't want that
 * then you need to use moveTo() with the first point from the input array.
 *
 * The points for the cardinal spline are returned as a new array.
 *
 * @param {CanvasRenderingContext2D} ctx - context to use
 * @param {Array} points - point array
 * @param {Number} [tension=0.5] - tension. Typically between [0.0, 1.0] but can be exceeded
 * @param {Number} [numOfSeg=20] - number of segments between two points (line resolution)
 * @param {Boolean} [close=false] - Close the ends making the line continuous
 * @returns {Float32Array} New array with the calculated points that was added to the path
 */
export function _curve(ctx: CanvasRenderingContext2D, _points: Point[], tension: number = 0.5, numOfSeg: number = 20, close: boolean = false) {
  const points = _points.flatMap(p => ([p.x, p.y]))

  // let i = 1,
  let l = points.length,
    rPos = 0,
    rLen = (l - 2) * numOfSeg + 2 + (close ? 2 * numOfSeg : 0),
    res = new Float32Array(rLen);

  let pts = [...points];
  if (close) {
    pts.unshift(points[l - 1]);				// insert end point as first point
    pts.unshift(points[l - 2]);
    pts.push(points[0], points[1]); 		// first point as last point
  } else {
    pts.unshift(points[1]);					// copy 1. point and insert at beginning
    pts.unshift(points[0]);
    pts.push(points[l - 2], points[l - 1]);	// duplicate end-points
  }

  // cache inner-loop calculations as they are based on t alone
  const cache = new Float32Array((numOfSeg + 2) * 4)
  let cachePtr = 4;
  cache[0] = 1;								// 1,0,0,0
  for (let i = 1; i < numOfSeg; i++) {
    let st = i / numOfSeg,
      st2 = st * st,
      st3 = st2 * st,
      st23 = st3 * 2,
      st32 = st2 * 3;

    cache[cachePtr++] = st23 - st32 + 1;	// c1
    cache[cachePtr++] = st32 - st23;		// c2
    cache[cachePtr++] = st3 - 2 * st2 + st;	// c3
    cache[cachePtr++] = st3 - st2;			// c4
  }
  cache[++cachePtr] = 1;						// 0,1,0,0

  // calc. points
  parse(pts, cache, points.length);

  if (close) {
    //l = points.length;
    pts = [];
    pts.push(points[l - 4], points[l - 3], points[l - 2], points[l - 1]); // second last and last
    pts.push(points[0], points[1], points[2], points[3]); // first and second
    parse(pts, cache, 4);
  }

  function parse(pts: number[], cache: Float32Array, l: number) {

    for (let i = 2, t; i < l; i += 2) {

      let pt1 = pts[i],
        pt2 = pts[i + 1],
        pt3 = pts[i + 2],
        pt4 = pts[i + 3],

        t1x = (pt3 - pts[i - 2]) * tension,
        t1y = (pt4 - pts[i - 1]) * tension,
        t2x = (pts[i + 4] - pt1) * tension,
        t2y = (pts[i + 5] - pt2) * tension;

      for (t = 0; t < numOfSeg; t++) {

        var c = t << 2, //t * 4;

          c1 = cache[c],
          c2 = cache[c + 1],
          c3 = cache[c + 2],
          c4 = cache[c + 3];

        res[rPos++] = c1 * pt1 + c2 * pt3 + c3 * t1x + c4 * t2x;
        res[rPos++] = c1 * pt2 + c2 * pt4 + c3 * t1y + c4 * t2y;
      }
    }
  }

  // add last point
  l = close ? 0 : points.length - 2;
  res[rPos++] = points[l];
  res[rPos] = points[l + 1];

  // add lines to path
  ctx.moveTo(points[0], points[1]);
  for (let i = 0, len = res.length; i < len; i += 2) {
    ctx.lineTo(res[i], res[i + 1]);
  }
  // stroke path
  ctx.stroke();

  return res;
}