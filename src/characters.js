// The 12 racers cropped from the character sheet (see scripts/crop-characters.py).
const images = import.meta.glob('./assets/characters/character-*.png', { eager: true, import: 'default' })

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
  const file = `./assets/characters/character-${String(id).padStart(2, '0')}.png`
  return { id, name, color, img: images[file] }
})

export const getCharacter = (id) => CHARACTERS.find((c) => c.id === id)
