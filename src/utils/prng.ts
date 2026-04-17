/**
 * mulberry32 seeded PRNG，用于 mock 数据稳定性：
 * - 每次 HMR / reload 都得到同样的数值，便于与截图/对比。
 * - 上线后由后端真实数据替换，无性能影响。
 */

export function mulberry32(seed: number): () => number {
  let s = seed >>> 0
  return function () {
    s = (s + 0x6D2B79F5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function createRng(seed = 20260416) {
  const r = mulberry32(seed)
  function rand(min: number, max: number, digits = 2): number {
    const v = r() * (max - min) + min
    const p = Math.pow(10, digits)
    return Math.round(v * p) / p
  }
  function pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(r() * arr.length)]
  }
  function pickInt(min: number, max: number): number {
    return Math.floor(r() * (max - min + 1)) + min
  }
  return { next: r, rand, pick, pickInt }
}
