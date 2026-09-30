<script setup>
import { computed } from 'vue'
import { getCharacter } from '../characters'

const props = defineProps({
  results: { type: Array, required: true },
})
defineEmits(['rematch', 'reset'])

const winner = computed(() => props.results[0])
const winnerChar = computed(() => getCharacter(winner.value.character))
const MEDALS = ['🥇', '🥈', '🥉']

// confetti pieces with random position / color / timing
const COLORS = ['#ffd23f', '#ff4d6d', '#3ddc84', '#2fb6ff', '#a44dff', '#ff8a1f']
const confetti = Array.from({ length: 90 }, (_, i) => ({
  left: Math.random() * 100 + '%',
  background: COLORS[i % COLORS.length],
  animationDelay: Math.random() * 2.5 + 's',
  animationDuration: 2.5 + Math.random() * 2.5 + 's',
  width: 6 + Math.random() * 8 + 'px',
  height: 10 + Math.random() * 10 + 'px',
  '--drift': (Math.random() * 200 - 100).toFixed(0) + 'px',
}))
</script>

<template>
  <div class="winner">
    <div class="winner__confetti" aria-hidden="true">
      <i v-for="(c, i) in confetti" :key="i" :style="c" />
    </div>

    <div class="card winner__box">
      <div class="winner__spot" />
      <p class="winner__label title-font">🏆 WINNER 🏆</p>
      <div class="winner__avatar" :style="{ '--char-color': winnerChar.color }">
        <img :src="winnerChar.img" :alt="winnerChar.name" />
      </div>
      <h2 class="winner__name title-font">
        <span class="truncate">{{ winner.name.toUpperCase() }}</span> WINS!
      </h2>

      <ol class="results">
        <li v-for="(r, i) in results" :key="r.id" class="results__item" :class="{ 'results__item--top': i < 3 }">
          <span class="results__pos">{{ MEDALS[i] || i + 1 + '.' }}</span>
          <img :src="getCharacter(r.character).img" alt="" />
          <span class="results__name truncate">{{ r.name }}</span>
          <span class="results__pct">{{ i === 0 ? 'Về đích' : Math.floor(r.position * 100) + '%' }}</span>
        </li>
      </ol>

      <div class="winner__actions">
        <button class="btn btn--green" @click="$emit('rematch')">🔁 ĐUA LẠI</button>
        <button class="btn btn--white" @click="$emit('reset')">⚙️ THIẾT LẬP LẠI</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.winner { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; padding: 12px; background: rgba(43, 27, 90, 0.7); animation: fade 0.3s; overflow: auto; }
@keyframes fade { from { opacity: 0; } }

.winner__confetti { position: fixed; inset: 0; pointer-events: none; overflow: hidden; }
.winner__confetti i { position: absolute; top: -20px; border-radius: 2px; animation: fall linear infinite; }
@keyframes fall {
  to { transform: translate(var(--drift), 110vh) rotate(720deg); }
}

.winner__box {
  position: relative; width: min(460px, 100%); padding: 18px 18px 20px; text-align: center; overflow: hidden;
  animation: pop-in 0.5s cubic-bezier(0.2, 1.5, 0.4, 1);
  background: linear-gradient(180deg, #fff7d1, #fff 45%);
}
@keyframes pop-in { from { transform: scale(0.4) rotate(-6deg); opacity: 0; } }
.winner__spot {
  position: absolute; left: 50%; top: -120px; width: 520px; height: 520px; transform: translateX(-50%);
  background: repeating-conic-gradient(rgba(255, 210, 63, 0.35) 0 12deg, transparent 12deg 24deg);
  border-radius: 50%; animation: spin 12s linear infinite; pointer-events: none;
  mask-image: radial-gradient(circle, #000 20%, transparent 60%);
}
@keyframes spin { to { transform: translateX(-50%) rotate(360deg); } }
.winner__label { position: relative; margin: 0; font-size: 1.6rem; color: var(--c-orange); -webkit-text-stroke: 1.5px var(--c-ink); paint-order: stroke fill; }
.winner__avatar {
  position: relative; width: 150px; height: 150px; margin: 4px auto 0; border-radius: 50%;
  background: radial-gradient(circle, #fff 35%, var(--char-color) 70%, transparent 71%);
  box-shadow: 0 0 40px 10px rgba(255, 210, 63, 0.8);
  animation: winner-bounce 0.7s ease-in-out infinite;
}
.winner__avatar img { width: 100%; height: 100%; object-fit: contain; }
@keyframes winner-bounce {
  0%, 100% { transform: translateY(0) scale(1, 1); }
  15% { transform: translateY(0) scale(1.1, 0.9); }
  50% { transform: translateY(-22px) scale(0.95, 1.05) rotate(-4deg); }
}
.winner__name {
  position: relative; margin: 8px 0 12px; font-size: clamp(1.6rem, 7vw, 2.4rem); color: var(--c-yellow);
  -webkit-text-stroke: 2px var(--c-ink); paint-order: stroke fill; text-shadow: 0 4px 0 var(--c-ink);
  display: flex; justify-content: center; gap: 10px; min-width: 0;
}
.winner__name .truncate { max-width: 60%; }

.results { position: relative; list-style: none; padding: 0; margin: 0 0 16px; display: flex; flex-direction: column; gap: 4px; max-height: 34vh; overflow: auto; }
.results__item { display: flex; align-items: center; gap: 8px; background: #f4f1ff; border-radius: 12px; padding: 4px 10px; font-weight: 800; min-width: 0; }
.results__item--top { background: #fff1b8; font-size: 1.1rem; }
.results__item img { width: 30px; height: 30px; object-fit: contain; flex: none; }
.results__pos { width: 30px; flex: none; }
.results__name { flex: 1; text-align: left; min-width: 0; }
.results__pct { flex: none; font-size: 0.8rem; opacity: 0.7; }

.winner__actions { position: relative; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
</style>
