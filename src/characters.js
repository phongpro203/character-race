// The 12 racers cropped from the character sheet (see scripts/crop-characters.py).
const images = import.meta.glob('./assets/characters/character-*.png', { eager: true, import: 'default' })
// 8-frame run cycles, one horizontal strip per character (see scripts/make-run-sprites.py)
const runSprites = import.meta.glob('./assets/characters/run/character-*.webp', { eager: true, import: 'default' })
export const RUN_FRAMES = 8

const META = [
  ['Racer Boy', '#ff4d4d'],
  ['Ninja', '#a44dff'],
  ['Foxy', '#ff8a1f'],
  ['Robo', '#2f8dff'],
  ['Pirate', '#d63a3a'],
  ['Knight', '#9aa4b5'],
  ['Astro', '#ff9d3c'],
  ['Punk', '#ff3fae'],
  ['Dino', '#3fbf4a'],
  ['Chef Panda', '#454545'],
  ['Alien', '#8de02b'],
  ['Skater', '#ffc21f'],
]

export const CHARACTERS = META.map(([name, color], i) => {
  const id = i + 1
  const num = String(id).padStart(2, '0')
  return {
    id,
    name,
    color,
    img: images[`./assets/characters/character-${num}.png`],
    run: runSprites[`./assets/characters/run/character-${num}.webp`],
  }
})

export const getCharacter = (id) => CHARACTERS.find((c) => c.id === id)
