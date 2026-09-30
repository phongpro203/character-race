<script setup>
import { computed } from 'vue'
import { getCharacter } from '../characters'

const props = defineProps({
  racer: { type: Object, required: true },
  index: { type: Number, required: true },
  rank: { type: Number, default: 0 },
  intense: { type: Boolean, default: false }, // last seconds of the race
  running: { type: Boolean, default: false },
})

const character = computed(() => getCharacter(props.racer.character))
const boosting = computed(() => props.running && props.racer.boost > 0)
const fast = computed(() => props.running && props.racer.speedRatio > 1.15)
const percent = computed(() => Math.min(100, Math.floor(props.racer.position * 100)))

// bob faster the faster the racer runs
const stepSeconds = computed(() => {
  const s = props.racer.speedRatio || 0
  return Math.max(0.16, 0.5 - s * 0.14).toFixed(2) + 's'
})

const bodyStyle = computed(() => {
  const r = props.racer
  const tilt = 4 + r.lean * 10 + (boosting.value ? 6 : 0)
  const scale = boosting.value ? 1.12 : 1
  return { transform: `rotate(${tilt.toFixed(1)}deg) scale(${scale})` }
})
</script>

<template>
  <div class="lane" :class="[`lane--${index % 2 ? 'odd' : 'even'}`, { 'lane--intense': intense }]">
    <div class="lane__info">
      <span class="lane__rank title-font" :class="`lane__rank--${rank}`">{{ rank || '-' }}</span>
      <span class="lane__name truncate">{{ racer.name }}</span>
      <span class="lane__pct">{{ percent }}%</span>
    </div>

    <div class="lane__track">
      <div class="lane__start" />
      <div class="lane__finish" />
      <div class="lane__progress" :style="{ width: racer.position * 100 + '%', background: character.color }" />

      <div class="lane__runner-area">
        <div class="runner" :style="{ '--p': racer.position }">
          <span class="runner__tag truncate" :style="{ background: character.color }">{{ racer.name }}</span>
          <div v-if="fast || boosting" class="runner__lines">
            <i /><i /><i />
          </div>
          <div v-if="fast" class="runner__dust">
            <i /><i /><i />
          </div>
          <div class="runner__bob" :class="{ 'runner__bob--on': running, 'runner__bob--shake': boosting }" :style="{ '--step': stepSeconds }">
            <img class="runner__img" :src="character.img" :alt="character.name" :style="bodyStyle" draggable="false" />
          </div>
          <div class="runner__shadow" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lane {
  --av: clamp(40px, 7vw, 76px);
  --info-w: clamp(100px, 16vw, 160px);
  display: flex;
  align-items: stretch;
  height: calc(var(--av) + 10px);
  border-bottom: 3px dashed rgba(255, 255, 255, 0.55);
}
.lane--even { background: #8b5a2b; }
.lane--odd { background: #7a4d22; }

.lane__info {
  flex: none; width: var(--info-w);
  display: flex; align-items: center; gap: 6px; padding: 0 8px;
  background: rgba(43, 27, 90, 0.85); color: #fff;
}
.lane__rank {
  flex: none; width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center;
  background: #fff; color: var(--c-ink); font-size: 0.95rem; border: 2px solid var(--c-ink);
}
.lane__rank--1 { background: #ffd23f; }
.lane__rank--2 { background: #d9e2ec; }
.lane__rank--3 { background: #f0a868; }
.lane__name { flex: 1; min-width: 0; font-weight: 800; font-size: clamp(0.75rem, 1.8vw, 1rem); }
.lane__pct { flex: none; font-size: 0.75rem; opacity: 0.8; font-weight: 700; }
@media (max-width: 560px) { .lane__pct { display: none; } }

.lane__track {
  position: relative; flex: 1; min-width: 0;
  background:
    repeating-linear-gradient(90deg, transparent 0 38px, rgba(255, 255, 255, 0.08) 38px 40px),
    linear-gradient(180deg, rgba(0, 0, 0, 0.12), transparent 30%, transparent 70%, rgba(0, 0, 0, 0.18));
}
.lane__start { position: absolute; top: 0; bottom: 0; left: calc(var(--av) * 0.9); width: 5px; background: #fff; opacity: 0.9; }
.lane__finish {
  position: absolute; top: 0; bottom: 0; right: 0; width: 20px;
  background: conic-gradient(#fff 25%, #111 0 50%, #fff 0 75%, #111 0) 0 0 / 10px 10px;
  border-left: 3px solid var(--c-ink);
}
.lane__progress { position: absolute; left: 0; bottom: 0; height: 4px; opacity: 0.85; border-radius: 0 4px 4px 0; }

/* runner moves inside the area between start and finish lines */
.lane__runner-area { position: absolute; top: 0; bottom: 0; left: 0; right: calc(20px - var(--av) * 0.1); }
.runner {
  position: absolute; bottom: 4px; width: var(--av); height: var(--av);
  left: calc(var(--p) * (100% - var(--av)));
  will-change: left;
}
.runner__tag {
  position: absolute; bottom: calc(100% - 8px); left: 50%; transform: translateX(-50%);
  max-width: 110px; font-size: 0.7rem; font-weight: 800; color: #fff; padding: 0 6px; border-radius: 8px;
  border: 2px solid var(--c-ink); z-index: 3; text-shadow: 0 1px 0 rgba(0, 0, 0, 0.4);
}
@media (max-width: 560px) { .runner__tag { display: none; } }

.runner__bob { position: relative; width: 100%; height: 100%; z-index: 2; }
.runner__bob--on { animation: bob var(--step) ease-in-out infinite; }
.runner__bob--shake .runner__img { animation: shake 0.08s linear infinite; }
.runner__img {
  width: 100%; height: 100%; object-fit: contain; transform-origin: 50% 90%;
  transition: transform 0.15s ease-out; filter: drop-shadow(0 2px 0 rgba(0, 0, 0, 0.35));
  user-select: none;
}
@keyframes bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-14%); }
}
@keyframes shake {
  0% { translate: 0 0; } 25% { translate: 1px -1px; } 50% { translate: -1px 1px; } 75% { translate: 1px 1px; }
}
.runner__shadow {
  position: absolute; left: 20%; right: 20%; bottom: -2px; height: 6px; border-radius: 50%;
  background: rgba(0, 0, 0, 0.35); z-index: 1;
}

.runner__lines { position: absolute; right: 85%; top: 25%; width: 60%; height: 50%; z-index: 1; }
.runner__lines i {
  position: absolute; right: 0; height: 3px; border-radius: 3px; background: rgba(255, 255, 255, 0.9);
  animation: line 0.25s linear infinite;
}
.runner__lines i:nth-child(1) { top: 10%; width: 70%; }
.runner__lines i:nth-child(2) { top: 50%; width: 100%; animation-delay: -0.1s; }
.runner__lines i:nth-child(3) { top: 85%; width: 55%; animation-delay: -0.18s; }
@keyframes line { from { transform: translateX(30%); opacity: 1; } to { transform: translateX(-60%); opacity: 0; } }

.runner__dust { position: absolute; left: 0; bottom: 0; width: 40%; height: 40%; z-index: 1; }
.runner__dust i {
  position: absolute; bottom: 0; left: 30%; width: 14px; height: 14px; border-radius: 50%;
  background: rgba(240, 220, 190, 0.85); animation: dust 0.5s ease-out infinite;
}
.runner__dust i:nth-child(2) { animation-delay: -0.17s; width: 10px; height: 10px; }
.runner__dust i:nth-child(3) { animation-delay: -0.33s; width: 8px; height: 8px; }
@keyframes dust {
  from { transform: translate(0, 0) scale(0.6); opacity: 0.9; }
  to { transform: translate(-40px, -14px) scale(1.6); opacity: 0; }
}

.lane--intense .lane__finish { animation: flash 0.5s steps(2) infinite; }
@keyframes flash { 50% { filter: brightness(1.5) drop-shadow(0 0 6px #ffd23f); } }
</style>
