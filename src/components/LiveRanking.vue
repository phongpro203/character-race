<script setup>
import { getCharacter } from '../characters'

defineProps({
  ranking: { type: Array, required: true },
})
</script>

<template>
  <aside class="card ranking">
    <h3 class="ranking__title title-font">📊 LIVE RANKING</h3>
    <TransitionGroup tag="ol" name="rank" class="ranking__list">
      <li v-for="(r, i) in ranking" :key="r.id" class="ranking__item" :class="`ranking__item--${i + 1}`">
        <span class="ranking__pos title-font">{{ i + 1 }}</span>
        <img :src="getCharacter(r.character).img" alt="" />
        <span class="truncate">{{ r.name }}</span>
      </li>
    </TransitionGroup>
  </aside>
</template>

<style scoped>
.ranking { padding: 10px; }
.ranking__title { margin: 0 0 8px; font-size: 1.1rem; text-align: center; color: var(--c-bg1); }
.ranking__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; position: relative; }
.ranking__item {
  display: flex; align-items: center; gap: 6px; padding: 3px 8px; border-radius: 12px;
  background: #f4f1ff; font-weight: 800; font-size: 0.9rem; min-width: 0;
}
.ranking__item img { width: 26px; height: 26px; object-fit: contain; flex: none; }
.ranking__pos { width: 20px; text-align: center; flex: none; }
.ranking__item--1 { background: #ffe98a; }
.ranking__item--2 { background: #e3e9f0; }
.ranking__item--3 { background: #ffd2ad; }
.rank-move { transition: transform 0.3s ease; }
</style>
