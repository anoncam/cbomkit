<script setup lang="ts">
import { ref } from 'vue'
import ResultTitle from '@/components/results/ResultTitle.vue'
import ReturnButton from '@/components/results/ReturnButton.vue'
import KpiStrip from '@/components/results/KpiStrip.vue'
import StatisticsView from '@/components/results/StatisticsView.vue'
import DataTable from '@/components/results/DataTable.vue'
import type { DetectionFilter } from '@/types/filter'

const filter = ref<DetectionFilter | null>(null)

function handleFilterChange(next: DetectionFilter) {
  if (!next.value) {
    filter.value = null
    return
  }
  if (
    filter.value &&
    filter.value.kind === next.kind &&
    filter.value.value === next.value
  ) {
    // Click the same slice to toggle off.
    filter.value = null
    return
  }
  filter.value = next
}

function clearFilter() {
  filter.value = null
}
</script>

<template>
  <div class="results">
    <div class="results__toolbar">
      <ReturnButton />
    </div>
    <ResultTitle />
    <KpiStrip />
    <StatisticsView @filter-change="handleFilterChange" />
    <DataTable :filter="filter" @clear-filter="clearFilter" />
  </div>
</template>

<style scoped>
.results {
  display: flex;
  flex-direction: column;
}

.results__toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}
</style>
