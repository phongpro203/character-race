// Headless check of the race engine: node scripts/simulate-races.mjs [races]
// Verifies: predetermined winner always finishes first, winners are uniform,
// finish time ~= chosen duration, lead changes happen, finish is close.
import { useRaceEngine } from '../src/composables/useRaceEngine.js'

let now = 0
let pending = null
globalThis.requestAnimationFrame = (cb) => (pending = cb)
globalThis.cancelAnimationFrame = () => (pending = null)
const origWarn = console.warn
console.warn = () => {} // onBeforeUnmount outside a component

const RACES = Number(process.argv[2] || 3000)
const stats = { wrong: 0, wins: {}, timeErr: [], leadChanges: [], gap: [], winnerNotLeadAt80: 0 }

for (let k = 0; k < RACES; k++) {
  const n = 2 + (k % 11)
  const dur = [10, 20, 30, 45, 60][k % 5]
  let finishedWinner = null
  const e = useRaceEngine({ onFinish: (w) => (finishedWinner = w) })
  e.setup(Array.from({ length: n }, (_, i) => ({ id: i, name: 'P' + i, character: i + 1 })), dur)
  e.start()
  now = 0
  let leader = -1, changes = 0, checked80 = false
  while (pending && now < dur * 3000) {
    now += 1000 / 60
    const cb = pending; pending = null; cb(now)
    const top = [...e.racers].sort((a, b) => b.position - a.position)[0]
    if (e.elapsed.value > dur * 0.1 && top.id !== leader) { if (leader !== -1) changes++; leader = top.id }
    if (!checked80 && e.elapsed.value >= dur * 0.8) { checked80 = true; if (top !== e.racers.find((r) => r.finished) && !top.finished) stats._pending80 = top.id }
  }
  const res = e.results.value
  const best = [...e.racers].sort((a, b) => b.position - a.position)[0]
  if (!finishedWinner || best.id !== finishedWinner.id) stats.wrong++
  if (stats._pending80 !== undefined && stats._pending80 !== finishedWinner.id) stats.winnerNotLeadAt80++
  delete stats._pending80
  stats.wins[`${n}:${finishedWinner.id}`] = (stats.wins[`${n}:${finishedWinner.id}`] || 0) + 1
  stats.timeErr.push((e.elapsed.value - dur) / dur)
  stats.leadChanges.push(changes)
  stats.gap.push(1 - res[1].position)
}
console.warn = origWarn

const avg = (a) => a.reduce((s, x) => s + x, 0) / a.length
console.log('races:', RACES)
console.log('predetermined winner NOT first:', stats.wrong)
console.log('avg |time error| %:', (avg(stats.timeErr.map(Math.abs)) * 100).toFixed(2), 'max %:', (Math.max(...stats.timeErr.map(Math.abs)) * 100).toFixed(2))
console.log('avg lead changes:', avg(stats.leadChanges).toFixed(1), 'races w/o change:', stats.leadChanges.filter((c) => c === 0).length)
console.log('winner not leading at 80% time:', ((stats.winnerNotLeadAt80 / RACES) * 100).toFixed(1) + '%')
console.log('avg gap to 2nd at finish (% track):', (avg(stats.gap) * 100).toFixed(2))
// uniformity for 4 players
const four = [0, 1, 2, 3].map((i) => stats.wins[`4:${i}`] || 0)
console.log('wins by seat with 4 players:', four)
