export const extent = (d: number[]) => {
  return [
    Math.min(...d),
    Math.max(...d)
  ] as [number, number]
}

export function standardDeviation(array?: number[]) {
  if (!array || array.length === 0) return 0
  const n = array.length
  const mean = array.reduce((a, b) => a + b) / n
  return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)
}

export function ArrayToDict<T, K extends keyof T>(arr: T[], key: K) {
  return arr.reduce((o, f) => {
    o[f[key] as any] = f
    return o
  }, {} as Record<string | number | symbol, T>)
}

export function union<T>(setA: Set<T>, setB: Set<T>) {
  const _union = new Set(setA);
  for (const elem of setB) {
    _union.add(elem);
  }
  return _union;
}


if (process.env.NODE_ENV !== 'production') {
  (global as any).$RefreshReg$ = () => { };
  (global as any).$RefreshSig$ = () => () => { };
}