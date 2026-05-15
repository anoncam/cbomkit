<script setup lang="ts">
// Placeholder for the visualizer page. Real implementation lands in PR #3.
</script>

<template>
  <section class="results">
    <h1>Results</h1>
    <p>The redesigned visualizer ships in PR #3 of the Vue 3 migration.</p>
  </section>
</template>

<style scoped>
.results {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.results h1 {
  margin: 0;
  font-weight: 300;
}

.results p {
  color: var(--cds-text-secondary);
}
</style>
