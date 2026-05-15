<script setup lang="ts">
import CarbonChart from '@/components/charts/CarbonChart.vue'

const placeholderData = [
  { group: 'Quantum-safe', value: 65 },
  { group: 'Quantum-vulnerable', value: 24 },
  { group: 'Unknown', value: 11 },
]

const donutOptions = {
  title: 'Compliance (sample data — PR #1 scaffold)',
  resizable: true,
  donut: {
    center: {
      label: 'Assets',
    },
    alignment: 'center',
  },
  height: '320px',
  toolbar: { enabled: false },
}
</script>

<template>
  <section class="home">
    <header class="home__intro">
      <h1>CBOMkit</h1>
      <p>
        Vue 3 frontend scaffold. PR #1 of the
        <a href="https://github.com/anoncam/cbomkit/blob/vue3-migration/frontend/MIGRATION.md">
          Vue 3 migration
        </a>
        — feature parity ports begin in PR #2; visualizer redesign in PR #3.
      </p>
    </header>

    <div class="home__chart-card">
      <CarbonChart type="donut" :data="placeholderData" :options="donutOptions" />
    </div>
  </section>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.home__intro h1 {
  margin: 0 0 12px;
  font-weight: 300;
  font-size: 2.5rem;
}

.home__intro p {
  margin: 0;
  color: var(--cds-text-secondary);
  max-width: 60ch;
}

.home__intro a {
  color: var(--cds-link-primary);
}

.home__chart-card {
  background: var(--cds-layer);
  border: 1px solid var(--cds-border-subtle);
  border-radius: 4px;
  padding: 16px;
}
</style>
