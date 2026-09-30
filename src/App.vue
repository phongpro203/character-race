<script setup>
import { ref } from 'vue'
import RaceSetup from './components/RaceSetup.vue'
import RaceTrack from './components/RaceTrack.vue'
import { useSound } from './composables/useSound'

const sound = useSound()
const screen = ref('setup') // setup | race
const config = ref(null)

function startRace(cfg) {
  config.value = cfg
  screen.value = 'race'
}
</script>

<template>
  <button class="sound-toggle btn btn--white" :title="sound.enabled.value ? 'Tắt âm thanh' : 'Bật âm thanh'" @click="sound.toggle">
    {{ sound.enabled.value ? '🔊 ON' : '🔇 OFF' }}
  </button>

  <Transition name="screen" mode="out-in">
    <RaceSetup v-if="screen === 'setup'" :initial="config" @start="startRace" />
    <RaceTrack v-else :config="config" @reset="screen = 'setup'" />
  </Transition>
</template>

<style>
.sound-toggle { position: fixed; top: 10px; right: 10px; z-index: 70; padding: 6px 14px; font-size: 0.95rem; }
.screen-enter-active, .screen-leave-active { transition: opacity 0.25s, transform 0.25s; }
.screen-enter-from { opacity: 0; transform: translateY(20px); }
.screen-leave-to { opacity: 0; transform: translateY(-20px); }
</style>

<style>
/* keep the fixed sound button from covering the timer / logo on small screens */
@media (max-width: 1000px) {
  #app { padding-top: 48px; }
}
</style>
