import { ref } from 'vue'

/**
 * Sound architecture. Drop files into /public/sounds (see README.txt there)
 * or change the paths below. Missing files fail silently.
 */
const SOUND_PATHS = {
  countdown: 'sounds/countdown.mp3',
  music: 'sounds/race-music.mp3',
  boost: 'sounds/boost.mp3',
  finish: 'sounds/finish.mp3',
  winner: 'sounds/winner.mp3',
}

const enabled = ref(localStorage.getItem('cr-sound') !== 'off')
const cache = {}

function get(name) {
  if (!cache[name]) {
    const audio = new Audio(import.meta.env.BASE_URL + SOUND_PATHS[name])
    audio.preload = 'auto'
    if (name === 'music') {
      audio.loop = true
      audio.volume = 0.4
    }
    cache[name] = audio
  }
  return cache[name]
}

export function useSound() {
  function play(name) {
    if (!enabled.value) return
    const audio = get(name)
    audio.currentTime = 0
    audio.play().catch(() => {}) // file missing or autoplay blocked
  }

  function stop(name) {
    const audio = cache[name]
    if (audio) audio.pause()
  }

  function stopAll() {
    Object.keys(cache).forEach(stop)
  }

  function toggle() {
    enabled.value = !enabled.value
    localStorage.setItem('cr-sound', enabled.value ? 'on' : 'off')
    if (!enabled.value) stopAll()
  }

  return { enabled, play, stop, stopAll, toggle }
}
