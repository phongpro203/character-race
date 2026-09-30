import { ref, reactive, computed, onBeforeUnmount } from 'vue'

/**
 * Race engine.
 *
 * The winner is drawn once, at start(), with equal probability for every
 * player, and is kept in a closure (never exposed while racing). Everything
 * else is "physics" whose only job is to make the race look exciting:
 *
 *  - every racer chases a randomly re-rolled target speed (mood), with random
 *    boosts / slumps and small per-frame noise;
 *  - velocity approaches the target with a per-racer acceleration rate, so
 *    motion is never linear;
 *  - a rubber band keeps the pack bunched so the lead keeps changing;
 *  - a global pace factor makes the field arrive at the finish near `duration`.
 *
 * How the predetermined winner is guaranteed (blended in, never a swap):
 *  - progress < 0.7: winner bias = 0 (mid race the winner is even nudged back
 *    if it leads, so it usually has to overtake at the end);
 *  - 0.7 - 0.92: the winner is softly pulled to hang just behind the best rival;
 *  - > 0.92: the winner is steered to cross the line at `duration`;
 *  - late in the race every rival's speed is capped so it would reach the line
 *    a little AFTER `duration`, which produces a close finish. A hard clamp
 *    (FINISH_GUARD) is the final safety net.
 */

const TUNING = {
  cruiseSpread: 0.18,      // cruise speed = 1 ± this (1 = exactly on schedule)
  moodSeconds: [0.5, 1.6], // how often a racer re-rolls its mood
  boostChance: 0.2,
  boostMul: 1.45,
  slumpChance: 0.15,
  slumpMul: 0.7,
  moodSpan: [0.4, 1.0],    // how long a boost / slump lasts (s)
  accelRate: [1.6, 3.6],   // per-racer responsiveness (1/s)
  noise: 0.12,             // per-frame jitter on target speed
  rubberBand: 3,           // pull toward the pack average
  minSpeed: 0.35,          // speed clamp, in "schedule" units
  maxSpeed: 2.4,
  biasStart: 0.7,
  biasMid: 0.9,
  finalPush: 0.92,
  rivalCapFrom: 0.8,
  rankingIntervalMs: 150,
}

const FINISH_GUARD = 0.997
const rand = (min, max) => min + Math.random() * (max - min)
const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
const lerp = (a, b, t) => a + (b - a) * t
const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

/** Uniform integer in [0, n) using the crypto RNG when available. */
function randomIndex(n) {
  if (globalThis.crypto?.getRandomValues) {
    return globalThis.crypto.getRandomValues(new Uint32Array(1))[0] % n
  }
  return Math.floor(Math.random() * n)
}

/** Winner bias weight by race progress: 0 → gentle → strong. */
function winnerBias(rp) {
  if (rp < TUNING.biasStart) return 0
  if (rp < TUNING.biasMid) return 0.35 * smoothstep(TUNING.biasStart, TUNING.biasMid, rp)
  return lerp(0.35, 1, smoothstep(TUNING.biasMid, 1, rp))
}

export function useRaceEngine({ onBoost, onFinish } = {}) {
  const racers = reactive([])
  const ranking = ref([])
  const results = ref([])
  const elapsed = ref(0)
  const duration = ref(20)
  const status = ref('idle') // idle | running | finished

  const timeLeft = computed(() => Math.max(0, duration.value - elapsed.value))
  const timeProgress = computed(() => clamp(elapsed.value / duration.value, 0, 1))

  let predeterminedWinner = -1
  let rafId = 0
  let lastTs = 0
  let lastRankingTs = 0

  function createRacer(player, i) {
    return {
      id: player.id ?? i,
      name: player.name,
      character: player.character,
      position: 0,
      velocity: 0,
      boost: 0,
      finished: false,
      // UI helpers
      speedRatio: 0,
      lean: 0,
      stride: 0, // run-cycle frame counter, advances faster at higher speed
      // internal motion state
      cruise: 1,
      slump: 0,
      moodTimer: rand(0.2, 0.8),
      accelRate: rand(...TUNING.accelRate),
      reserve: 0,
    }
  }

  function rollMood(r, rp) {
    // calmer, more even pack in the first 20% of the race
    const amp = rp < 0.2 ? 0.5 : 1
    r.cruise = 1 + rand(-1, 1) * TUNING.cruiseSpread * amp
    const x = Math.random()
    if (x < TUNING.boostChance * amp) {
      r.boost = rand(...TUNING.moodSpan)
      onBoost?.(r)
    } else if (x < (TUNING.boostChance + TUNING.slumpChance) * amp) {
      r.slump = rand(...TUNING.moodSpan)
    }
    r.moodTimer = rand(...TUNING.moodSeconds)
  }

  function updateRanking() {
    ranking.value = [...racers].sort((a, b) => b.position - a.position)
  }

  function step(dt) {
    const T = duration.value
    const t = elapsed.value
    const rp = t / T
    const s0 = 1 / T // "on schedule" speed, track fraction per second
    const n = racers.length
    const winner = racers[predeterminedWinner]

    let sum = 0
    let bestRival = 0
    let leader = racers[0]
    for (const r of racers) {
      sum += r.position
      if (r !== winner) bestRival = Math.max(bestRival, r.position)
      if (r.position > leader.position) leader = r
    }
    const avg = sum / n
    // keep the field's average on schedule so the race lasts ~duration
    const pace = clamp(1 + (rp * 0.985 - avg) * 3, 0.7, 1.4)

    for (const r of racers) {
      r.moodTimer -= dt
      if (r.moodTimer <= 0) rollMood(r, rp)
      r.boost = Math.max(0, r.boost - dt)
      r.slump = Math.max(0, r.slump - dt)

      // natural target speed, in schedule units
      let target = r.cruise
      if (r.boost > 0) target *= TUNING.boostMul
      if (r.slump > 0) target *= TUNING.slumpMul
      target += (avg - r.position) * TUNING.rubberBand * (1 + rp)
      target *= pace
      target += rand(-1, 1) * TUNING.noise

      if (r === winner) {
        // mid race: a leading winner eases off so the finish has an overtake
        if (rp > 0.45 && rp < 0.8 && r === leader) target *= 0.92
        const w = winnerBias(rp)
        if (w > 0) {
          const needed = rp < TUNING.finalPush
            ? 1 + (bestRival - 0.012 - r.position) * 6
            : (1 - r.position) / Math.max(T - t, 0.25) / s0
          target = lerp(target, needed, w)
          // make the final surge read as a visible boost
          if (rp >= TUNING.finalPush && target > 1.2 && r.boost <= 0) {
            r.boost = 0.4
            onBoost?.(r)
          }
        }
      } else if (rp > TUNING.rivalCapFrom) {
        // rivals may not arrive before the winner's scheduled finish
        const arriveIn = Math.max(T - t + r.reserve, 0.05)
        target = Math.min(target, (1 - r.position) / arriveIn / s0)
      }

      target = clamp(target, TUNING.minSpeed, TUNING.maxSpeed) * s0
      const prev = r.velocity
      r.velocity += (target - r.velocity) * Math.min(1, r.accelRate * dt)
      r.position += r.velocity * dt
      if (r !== winner) r.position = Math.min(r.position, FINISH_GUARD)

      r.speedRatio = r.velocity / s0
      r.stride += dt * clamp(8 + 6 * r.speedRatio, 8, 22)
      r.lean = clamp(((r.velocity - prev) / dt / s0) * 0.9, -1, 1)
    }

    if (winner.position >= 1) finish()
  }

  function loop(ts) {
    if (status.value !== 'running') return
    const dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.05) : 0
    lastTs = ts
    if (dt > 0) {
      elapsed.value += dt
      step(dt)
    }
    if (ts - lastRankingTs >= TUNING.rankingIntervalMs) {
      lastRankingTs = ts
      updateRanking()
    }
    if (status.value === 'running') rafId = requestAnimationFrame(loop)
  }

  function finish() {
    const winner = racers[predeterminedWinner]
    winner.position = 1
    winner.finished = true
    status.value = 'finished'
    cancelAnimationFrame(rafId)
    updateRanking()
    // winner first, the rest by their final progress
    results.value = [winner, ...racers.filter((r) => r !== winner).sort((a, b) => b.position - a.position)]
    onFinish?.(winner, results.value)
  }

  /** Prepare a fresh race (lanes visible at the start line, not moving yet). */
  function setup(players, seconds) {
    stop()
    duration.value = seconds
    elapsed.value = 0
    results.value = []
    racers.splice(0, racers.length, ...players.map(createRacer))
    for (const r of racers) r.reserve = 0.2 + seconds * rand(0.01, 0.05)
    // decided now, kept hidden until the finish line
    predeterminedWinner = randomIndex(racers.length)
    status.value = 'idle'
    updateRanking()
  }

  function start() {
    if (!racers.length || status.value === 'running') return
    status.value = 'running'
    lastTs = 0
    lastRankingTs = 0
    rafId = requestAnimationFrame(loop)
  }

  function stop() {
    cancelAnimationFrame(rafId)
    if (status.value === 'running') status.value = 'idle'
  }

  onBeforeUnmount(stop)

  return { racers, ranking, results, elapsed, duration, timeLeft, timeProgress, status, setup, start, stop }
}
