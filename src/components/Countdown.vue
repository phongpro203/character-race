<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const emit = defineEmits(['tick', 'done'])
const STEPS = ['3', '2', '1', 'GO!']
const current = ref(0)
let timer = 0

function next() {
  emit('tick', STEPS[current.value])
  timer = setTimeout(() => {
    if (current.value < STEPS.length - 1) {
      current.value++
      next()
    } else {
      emit('done')
    }
  }, current.value === STEPS.length - 1 ? 600 : 850)
}

onMounted(next)
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="countdown">
    <Transition name="count" mode="out-in">
      <span :key="current" class="countdown__num title-font" :class="{ 'countdown__num--go': current === STEPS.length - 1 }">
        {{ STEPS[current] }}
      </span>
    </Transition>
  </div>
</template>

<style scoped>
.countdown { position: fixed; inset: 0; display: grid; place-items: center; background: rgba(43, 27, 90, 0.45); z-index: 40; pointer-events: none; }
.countdown__num {
  font-size: clamp(7rem, 30vw, 16rem); color: var(--c-yellow);
  -webkit-text-stroke: 6px var(--c-ink); paint-order: stroke fill; text-shadow: 0 10px 0 var(--c-ink);
}
.countdown__num--go { color: var(--c-green); }
.count-enter-active { animation: count-in 0.45s cubic-bezier(0.2, 1.6, 0.4, 1); }
.count-leave-active { transition: all 0.2s ease-in; }
.count-leave-to { opacity: 0; transform: scale(2); }
@keyframes count-in { from { opacity: 0; transform: scale(0.2) rotate(-20deg); } }
</style>
