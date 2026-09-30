<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { CHARACTERS, getCharacter } from '../characters'

const props = defineProps({
  // previous setup, so "THIẾT LẬP LẠI" keeps what was entered
  initial: { type: Object, default: null },
})
const emit = defineEmits(['start'])

const DURATIONS = [10, 20, 30, 45, 60]
const MIN_PLAYERS = 2
const MAX_PLAYERS = CHARACTERS.length

const count = ref(props.initial?.players.length ?? 4)
const players = reactive(props.initial?.players.map((p) => ({ ...p })) ?? [])
const duration = ref(props.initial?.duration ?? 20)
const customMode = ref(!DURATIONS.includes(duration.value))
const customSeconds = ref(customMode.value ? duration.value : 25)
const pickerFor = ref(-1) // index of the player choosing a character
const submitted = ref(false)

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const usedIds = computed(() => new Set(players.map((p) => p.character)))

function freeCharacterId() {
  return shuffle(CHARACTERS.filter((c) => !usedIds.value.has(c.id)))[0].id
}

// keep the number of rows in sync with the selected player count
watch(
  count,
  (n) => {
    while (players.length > n) players.pop()
    while (players.length < n) players.push({ id: players.length, name: '', character: freeCharacterId() })
  },
  { immediate: true },
)

function randomizeAll() {
  const ids = shuffle(CHARACTERS.map((c) => c.id))
  players.forEach((p, i) => (p.character = ids[i]))
}

function pick(charId) {
  if (usedIds.value.has(charId) && players[pickerFor.value].character !== charId) return
  players[pickerFor.value].character = charId
  pickerFor.value = -1
}

const seconds = computed(() => (customMode.value ? Number(customSeconds.value) : duration.value))
const secondsValid = computed(() => Number.isFinite(seconds.value) && seconds.value >= 5 && seconds.value <= 300)
const nameErrors = computed(() => players.map((p) => !p.name.trim()))
const canStart = computed(() => secondsValid.value && !nameErrors.value.some(Boolean))

function submit() {
  submitted.value = true
  if (!canStart.value) return
  emit('start', {
    players: players.map((p, i) => ({ id: i, name: p.name.trim(), character: p.character })),
    duration: Math.round(seconds.value * 10) / 10,
  })
}
</script>

<template>
  <section class="setup">
    <header class="setup__hero">
      <h1 class="setup__logo title-font">
        <span>CHARACTER</span>
        <span class="setup__logo-race">RACE!</span>
      </h1>
      <div class="setup__parade">
        <img v-for="c in CHARACTERS" :key="c.id" :src="c.img" :alt="c.name" :style="{ animationDelay: c.id * -0.13 + 's' }" />
      </div>
    </header>

    <div class="setup__grid">
      <!-- Players -->
      <div class="card panel">
        <div class="panel__head">
          <h2 class="title-font">👥 Người chơi</h2>
          <div class="stepper">
            <button class="btn btn--white stepper__btn" :disabled="count <= MIN_PLAYERS" @click="count--">−</button>
            <span class="stepper__value title-font">{{ count }}</span>
            <button class="btn btn--white stepper__btn" :disabled="count >= MAX_PLAYERS" @click="count++">+</button>
          </div>
        </div>
        <input v-model.number="count" class="range" type="range" :min="MIN_PLAYERS" :max="MAX_PLAYERS" />

        <ul class="players">
          <li v-for="(p, i) in players" :key="i" class="player" :class="{ 'player--error': submitted && nameErrors[i] }">
            <button
              class="player__avatar"
              :style="{ '--char-color': getCharacter(p.character).color }"
              title="Chọn nhân vật"
              @click="pickerFor = i"
            >
              <img :src="getCharacter(p.character).img" :alt="getCharacter(p.character).name" />
              <span class="player__swap">🔄</span>
            </button>
            <label class="player__field">
              <span class="player__label">Người chơi {{ i + 1 }}</span>
              <input v-model="p.name" maxlength="24" :placeholder="`Nhập tên người chơi ${i + 1}`" @keyup.enter="submit" />
              <span v-if="submitted && nameErrors[i]" class="player__err">Tên không được để trống</span>
            </label>
          </li>
        </ul>

        <button class="btn btn--blue" @click="randomizeAll">🎲 Random nhân vật</button>
      </div>

      <!-- Duration -->
      <div class="card panel">
        <h2 class="title-font">⏱️ Thời gian đua</h2>
        <div class="chips">
          <button
            v-for="d in DURATIONS"
            :key="d"
            class="chip"
            :class="{ 'chip--active': !customMode && duration === d }"
            @click="(duration = d), (customMode = false)"
          >
            {{ d }}s
          </button>
          <button class="chip" :class="{ 'chip--active': customMode }" @click="customMode = true">Tùy chỉnh</button>
        </div>
        <label v-if="customMode" class="custom">
          <input v-model.number="customSeconds" type="number" min="5" max="300" step="1" />
          <span>giây</span>
        </label>
        <p v-if="!secondsValid" class="player__err">Thời gian từ 5 đến 300 giây</p>

        <div class="summary">
          <p><b>{{ count }}</b> tay đua · <b>{{ secondsValid ? seconds : '?' }}</b> giây</p>
          <p class="summary__hint">Ai sẽ về đích đầu tiên? 🤔</p>
        </div>
      </div>
    </div>

    <div class="setup__cta">
      <button class="btn btn--green btn--big title-font start-btn" @click="submit">🏁 BẮT ĐẦU CUỘC ĐUA</button>
      <p v-if="submitted && !canStart" class="setup__warn">Vui lòng nhập đủ tên cho tất cả người chơi!</p>
    </div>

    <!-- Character picker -->
    <Transition name="pop">
      <div v-if="pickerFor >= 0" class="picker" @click.self="pickerFor = -1">
        <div class="card picker__box">
          <h3 class="title-font">Chọn nhân vật cho {{ players[pickerFor].name || `Người chơi ${pickerFor + 1}` }}</h3>
          <div class="picker__grid">
            <button
              v-for="c in CHARACTERS"
              :key="c.id"
              class="picker__item"
              :class="{
                'picker__item--mine': players[pickerFor].character === c.id,
                'picker__item--taken': usedIds.has(c.id) && players[pickerFor].character !== c.id,
              }"
              :style="{ '--char-color': c.color }"
              @click="pick(c.id)"
            >
              <img :src="c.img" :alt="c.name" />
              <span class="truncate">{{ c.name }}</span>
              <small v-if="usedIds.has(c.id) && players[pickerFor].character !== c.id">
                {{ players.find((p) => p.character === c.id)?.name || 'Đã chọn' }}
              </small>
            </button>
          </div>
          <button class="btn btn--white" @click="pickerFor = -1">Đóng</button>
        </div>
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.setup { max-width: 1100px; margin: 0 auto; padding: 16px 16px 40px; }

.setup__hero { text-align: center; margin-bottom: 12px; }
.setup__logo {
  margin: 8px 0 0;
  font-size: clamp(2.4rem, 9vw, 5rem);
  line-height: 0.95;
  color: #fff;
  text-shadow: 0 5px 0 var(--c-ink), 0 0 0 var(--c-ink);
  -webkit-text-stroke: 3px var(--c-ink);
  paint-order: stroke fill;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0 16px;
}
.setup__logo-race { color: var(--c-yellow); transform: rotate(-4deg); display: inline-block; }
.setup__parade { display: flex; justify-content: center; gap: 2px; margin-top: 6px; flex-wrap: nowrap; overflow: hidden; }
.setup__parade img { width: clamp(28px, 7vw, 64px); animation: hop 0.6s ease-in-out infinite; filter: drop-shadow(0 3px 0 rgba(43, 27, 90, 0.35)); }
@keyframes hop { 50% { transform: translateY(-8px) rotate(-4deg); } }

.setup__grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 18px; align-items: start; }
@media (max-width: 800px) { .setup__grid { grid-template-columns: 1fr; } }

.panel { padding: 18px; display: flex; flex-direction: column; gap: 12px; }
.panel h2 { margin: 0; font-size: 1.5rem; }
.panel__head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }

.stepper { display: flex; align-items: center; gap: 8px; }
.stepper__btn { padding: 2px 14px; font-size: 1.4rem; }
.stepper__value { font-size: 2rem; min-width: 44px; text-align: center; }
.range { width: 100%; accent-color: var(--c-bg1); }

.players { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 10px; }
.player {
  display: flex; align-items: center; gap: 10px;
  background: #f4f1ff; border: 3px solid #d9d2ff; border-radius: 16px; padding: 6px 10px 6px 6px;
  animation: slide-in 0.25s ease-out;
}
.player--error { border-color: var(--c-red); background: #fff0f3; }
@keyframes slide-in { from { opacity: 0; transform: translateY(8px) scale(0.96); } }

.player__avatar {
  position: relative; flex: none; width: 58px; height: 58px; border-radius: 14px;
  border: 3px solid var(--c-ink); background: radial-gradient(circle at 50% 60%, #fff 30%, var(--char-color));
  cursor: pointer; padding: 0; transition: transform 0.15s;
}
.player__avatar:hover { transform: scale(1.08) rotate(-3deg); }
.player__avatar img { width: 100%; height: 100%; object-fit: contain; }
.player__swap { position: absolute; right: -8px; bottom: -8px; font-size: 0.8rem; background: #fff; border: 2px solid var(--c-ink); border-radius: 50%; width: 22px; height: 22px; line-height: 18px; }
.player__field { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.player__label { font-weight: 800; font-size: 0.85rem; color: #6a5cff; }
.player__field input {
  width: 100%; border: 3px solid var(--c-ink); border-radius: 12px; padding: 6px 10px;
  font-size: 1rem; font-weight: 700; outline: none; background: #fff;
}
.player__field input:focus { border-color: var(--c-bg1); box-shadow: 0 0 0 3px rgba(106, 92, 255, 0.3); }
.player__err { color: var(--c-red); font-weight: 700; font-size: 0.8rem; margin: 2px 0 0; }

.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip {
  border: 3px solid var(--c-ink); background: #fff; border-radius: 14px; padding: 8px 16px;
  font-family: var(--font-title); font-size: 1.2rem; cursor: pointer; box-shadow: 0 4px 0 var(--c-ink);
  transition: transform 0.12s, background 0.12s;
}
.chip:hover { transform: translateY(-2px); }
.chip:active { transform: translateY(3px); box-shadow: 0 1px 0 var(--c-ink); }
.chip--active { background: var(--c-yellow); transform: translateY(-2px) rotate(-2deg); }
.custom { display: flex; align-items: center; gap: 8px; font-weight: 800; }
.custom input { width: 110px; border: 3px solid var(--c-ink); border-radius: 12px; padding: 8px 10px; font-size: 1.2rem; font-weight: 800; }

.summary { margin-top: 6px; background: linear-gradient(135deg, #fff6c9, #ffe0f0); border: 3px dashed var(--c-ink); border-radius: 16px; padding: 10px 14px; }
.summary p { margin: 0; font-size: 1.15rem; }
.summary__hint { font-size: 0.95rem !important; opacity: 0.75; }

.setup__cta { text-align: center; margin-top: 26px; }
.start-btn { animation: pulse 1.6s ease-in-out infinite; }
@keyframes pulse { 50% { transform: scale(1.05); } }
.setup__warn { color: #fff; font-weight: 800; text-shadow: 0 2px 0 var(--c-ink); }

.picker { position: fixed; inset: 0; background: rgba(43, 27, 90, 0.6); display: grid; place-items: center; z-index: 50; padding: 12px; }
.picker__box { padding: 18px; max-width: 640px; width: 100%; max-height: 92vh; overflow: auto; text-align: center; }
.picker__box h3 { margin: 0 0 12px; font-size: 1.4rem; }
.picker__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px; margin-bottom: 14px; }
.picker__item {
  position: relative; border: 3px solid var(--c-ink); border-radius: 16px; padding: 6px;
  background: radial-gradient(circle at 50% 45%, #fff 35%, var(--char-color)); cursor: pointer;
  display: flex; flex-direction: column; align-items: center; font-weight: 800; transition: transform 0.12s;
}
.picker__item:hover { transform: translateY(-3px) scale(1.04); }
.picker__item img { width: 76px; height: 76px; object-fit: contain; }
.picker__item span { max-width: 100%; }
.picker__item small { position: absolute; top: 4px; left: 4px; right: 4px; background: var(--c-ink); color: #fff; border-radius: 8px; font-size: 0.7rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.picker__item--mine { outline: 4px solid var(--c-green); outline-offset: 2px; }
.picker__item--taken { filter: grayscale(1); opacity: 0.45; cursor: not-allowed; }
.picker__item--taken:hover { transform: none; }

.pop-enter-active, .pop-leave-active { transition: opacity 0.2s; }
.pop-enter-from, .pop-leave-to { opacity: 0; }
</style>
