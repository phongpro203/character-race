<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRaceEngine } from '../composables/useRaceEngine'
import { useSound } from '../composables/useSound'
import RacerLane from './RacerLane.vue'
import LiveRanking from './LiveRanking.vue'
import Countdown from './Countdown.vue'
import WinnerModal from './WinnerModal.vue'

const props = defineProps({
  config: { type: Object, required: true }, // { players, duration }
})
const emit = defineEmits(['reset'])

const sound = useSound()
const showCountdown = ref(false)
const showWinner = ref(false)
let winnerTimer = 0
let lastBoostSound = 0

const engine = useRaceEngine({
  onBoost() {
    // throttle so many racers boosting at once don't spam the speaker
    const now = performance.now()
    if (now - lastBoostSound > 700) {
      lastBoostSound = now
      sound.play('boost')
    }
  },
  onFinish() {
    sound.stop('music')
    sound.play('finish')
    winnerTimer = setTimeout(() => {
      showWinner.value = true
      sound.play('winner')
    }, 900)
  },
})
const { racers, ranking, results, timeLeft, timeProgress, status } = engine

const running = computed(() => status.value === 'running')
const intense = computed(() => running.value && timeLeft.value <= 3)
const rankOf = computed(() => new Map(ranking.value.map((r, i) => [r.id, i + 1])))

function newRace() {
  clearTimeout(winnerTimer)
  showWinner.value = false
  engine.setup(props.config.players, props.config.duration)
  showCountdown.value = true
}

function onCountdownDone() {
  showCountdown.value = false
  sound.play('music')
  engine.start()
}

function backToSetup() {
  engine.stop()
  sound.stopAll()
  emit('reset')
}

onMounted(newRace)
onBeforeUnmount(() => {
  clearTimeout(winnerTimer)
  sound.stopAll()
})
</script>

<template>
  <section class="race" :class="{ 'race--intense': intense }">
    <!-- Timer -->
    <header class="card timer">
      <div class="timer__row">
        <span class="timer__label title-font">TIME LEFT:</span>
        <span class="timer__value title-font">{{ timeLeft.toFixed(1) }}s</span>
      </div>
      <div class="timer__bar">
        <div class="timer__fill" :style="{ width: (1 - timeProgress) * 100 + '%' }" />
      </div>
    </header>

    <div class="race__body">
      <div class="track card">
        <div class="track__labels">
          <span>START</span>
          <span>🏁 FINISH</span>
        </div>
        <RacerLane
          v-for="(r, i) in racers"
          :key="r.id"
          :racer="r"
          :index="i"
          :rank="rankOf.get(r.id)"
          :intense="intense"
          :running="running"
        />
      </div>
      <LiveRanking class="race__ranking" :ranking="ranking" />
    </div>

    <div class="race__actions">
      <button class="btn btn--white" @click="backToSetup">⬅️ Thiết lập</button>
    </div>

    <Countdown v-if="showCountdown" @tick="sound.play('countdown')" @done="onCountdownDone" />
    <WinnerModal v-if="showWinner" :results="results" @rematch="newRace" @reset="backToSetup" />
  </section>
</template>

<style scoped>
.race { max-width: 1280px; margin: 0 auto; padding: 12px; }

.timer { padding: 10px 16px; margin-bottom: 12px; }
.timer__row { display: flex; justify-content: center; align-items: baseline; gap: 10px; }
.timer__label { font-size: clamp(1.1rem, 3vw, 1.6rem); color: var(--c-bg1); }
.timer__value { font-size: clamp(1.6rem, 5vw, 2.4rem); min-width: 3.6em; font-variant-numeric: tabular-nums; }
.timer__bar { height: 16px; border: 3px solid var(--c-ink); border-radius: 999px; overflow: hidden; background: #eee; margin-top: 4px; }
.timer__fill {
  height: 100%; border-radius: 999px;
  background: repeating-linear-gradient(-45deg, var(--c-green) 0 12px, #2fc574 12px 24px);
  transition: width 0.1s linear;
}
.race--intense .timer { animation: alarm 0.5s ease-in-out infinite; background: #fff0f3; }
.race--intense .timer__value { color: var(--c-red); animation: beat 0.5s ease-in-out infinite; display: inline-block; }
.race--intense .timer__fill { background: repeating-linear-gradient(-45deg, var(--c-red) 0 12px, #e8364f 12px 24px); }
.race--intense .track { animation: tremble 0.15s linear infinite; }
@keyframes alarm { 50% { box-shadow: 0 6px 0 rgba(43, 27, 90, 0.35), 0 0 24px 6px rgba(255, 77, 109, 0.8); } }
@keyframes beat { 50% { transform: scale(1.18); } }
@keyframes tremble { 50% { transform: translateY(1px); } }

.race__body { display: grid; grid-template-columns: 1fr 200px; gap: 12px; align-items: start; }
@media (max-width: 900px) {
  .race__body { grid-template-columns: 1fr; }
  .race__ranking :deep(.ranking__list) { flex-direction: row; flex-wrap: wrap; }
  .race__ranking :deep(.ranking__item) { flex: 1 1 130px; }
}

.track { overflow: hidden; padding: 0; background: #5aa832; }
.track__labels {
  display: flex; justify-content: space-between; padding: 4px 12px;
  background: repeating-linear-gradient(90deg, #3d8a1f 0 20px, #4f9e2b 20px 40px);
  color: #fff; font-family: var(--font-title); font-size: 0.9rem; text-shadow: 0 2px 0 var(--c-ink);
}

.race__actions { margin-top: 14px; text-align: center; }
</style>
