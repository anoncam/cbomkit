<script setup lang="ts">
import { computed } from 'vue'
import CarbonChart from '@/components/charts/CarbonChart.vue'
import { useCbomStore } from '@/stores/cbom'
import { getDetections } from '@/lib/cbom'
import { countNames, countOccurrences } from '@/lib/info'
import { capitalizeFirstLetter } from '@/lib/general'
import {
  getColorScale,
  getComplianceLevels,
  getComplianceRepartition,
  hasValidComplianceResults,
  isLoadingCompliance,
  isUsingLocalComplianceService,
} from '@/lib/compliance'
import type { DetectionFilter } from '@/types/filter'

const emit = defineEmits<{
  (event: 'filter-change', filter: DetectionFilter): void
}>()

const cbomStore = useCbomStore()

const detections = computed(() => {
  void cbomStore.cbom
  void cbomStore.dependencies
  return getDetections()
})

const sharedOptions = computed(() => ({
  resizable: true,
  toolbar: { enabled: true },
  legend: { alignment: 'center' as const, enabled: true },
}))

// ── Compliance donut ────────────────────────────────────────────────────────────
const complianceData = computed(() => {
  const counts = getComplianceRepartition(cbomStore.policyCheckResult, detections.value)
  const levels = getComplianceLevels(cbomStore.policyCheckResult)
  const labelMap = Object.fromEntries(levels.map((l) => [l.id, l.label]))
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0)
  if (total === 0) return []
  return Object.entries(counts).map(([id, value]) => ({
    group: labelMap[Number(id)] ?? String(id),
    value,
  }))
})

const complianceOptions = computed(() => ({
  ...sharedOptions.value,
  donut: {
    center: {
      label: `Crypto assets${isUsingLocalComplianceService(cbomStore.policyCheckResult) ? '*' : ''}`,
    },
    alignment: 'center' as const,
  },
  color: {
    scale: getColorScale(cbomStore.policyCheckResult, detections.value),
  },
}))

// ── Asset name circle pack ──────────────────────────────────────────────────────
const nameItems = computed(() => countNames(detections.value)[0])

const nameData = computed(() =>
  nameItems.value.map((item) => ({ ...item, name: item.name.toUpperCase() })),
)

const nameOptions = computed(() => ({
  ...sharedOptions.value,
  legend: { enabled: false },
}))

// ── Primitives donut ────────────────────────────────────────────────────────────
const primitiveCounts = computed(() => countOccurrences(detections.value, 'primitive'))

const primitiveData = computed(() =>
  primitiveCounts.value[0].map((entry) => ({
    ...entry,
    group: capitalizeFirstLetter(entry.group),
  })),
)

const primitiveOptions = computed(() => ({
  ...sharedOptions.value,
  donut: {
    center: { label: 'Primitives', number: primitiveCounts.value[1] },
    alignment: 'center' as const,
  },
}))

// ── Functions donut ─────────────────────────────────────────────────────────────
const functionCounts = computed(() => countOccurrences(detections.value, 'cryptoFunctions'))

const functionData = computed(() =>
  functionCounts.value[0].map((entry) => ({
    ...entry,
    group: capitalizeFirstLetter(entry.group),
  })),
)

const functionOptions = computed(() => ({
  ...sharedOptions.value,
  donut: {
    center: { label: 'Functions', number: functionCounts.value[1] },
    alignment: 'center' as const,
  },
}))

// ── Treemap: primitive → algorithm (new chart) ──────────────────────────────────
interface TreemapLeaf {
  name: string
  value: number
}
interface TreemapParent {
  name: string
  children: TreemapLeaf[]
}

const treemapData = computed<TreemapParent[]>(() => {
  const buckets = new Map<string, Map<string, number>>()
  for (const detection of detections.value) {
    const primitive = detection.cryptoProperties?.algorithmProperties?.primitive ?? 'unknown'
    const algorithm = detection.name ?? 'unnamed'
    if (!buckets.has(primitive)) buckets.set(primitive, new Map())
    const inner = buckets.get(primitive)!
    inner.set(algorithm, (inner.get(algorithm) ?? 0) + 1)
  }
  const rows: TreemapParent[] = []
  for (const [primitive, children] of buckets) {
    const childList: TreemapLeaf[] = []
    for (const [name, value] of children) {
      childList.push({ name, value })
    }
    rows.push({ name: capitalizeFirstLetter(primitive), children: childList })
  }
  return rows
})

const treemapOptions = computed(() => ({
  resizable: true,
  toolbar: { enabled: true },
  legend: { enabled: false },
}))

// ── Click → filter dispatch ─────────────────────────────────────────────────────
// Carbon Charts puts the clicked datum in slightly different shapes depending on
// the chart type: pie/donut hand back `{ data: { group, value }, ... }` (d3 wrap),
// treemap leaves give `{ name, value }`, and circle-pack returns the node data.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrap(datum: any): any {
  if (datum && typeof datum === 'object' && 'data' in datum) return datum.data
  return datum
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onComplianceClick(raw: any) {
  const datum = unwrap(raw)
  emit('filter-change', { kind: 'compliance', value: datum?.group ?? null })
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onPrimitiveClick(raw: any) {
  const datum = unwrap(raw)
  emit('filter-change', { kind: 'primitive', value: (datum?.group ?? '').toLowerCase() || null })
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onFunctionClick(raw: any) {
  const datum = unwrap(raw)
  emit('filter-change', { kind: 'function', value: (datum?.group ?? '').toLowerCase() || null })
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onNameClick(raw: any) {
  const datum = unwrap(raw)
  emit('filter-change', { kind: 'name', value: datum?.name ?? datum?.group ?? null })
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onTreemapClick(raw: any) {
  const datum = unwrap(raw)
  const value = datum?.name ?? null
  emit('filter-change', { kind: 'name', value })
}

const isEmpty = computed(() => detections.value.length === 0)
const isLoading = computed(() => isLoadingCompliance(cbomStore.policyCheckResult))
const hasCompliance = computed(() => hasValidComplianceResults(cbomStore.policyCheckResult))
</script>

<template>
  <section class="charts" aria-label="CBOM statistics">
    <div class="charts__grid">
      <article class="charts__card">
        <header class="charts__card-header">
          <h3>Compliance</h3>
          <p v-if="isUsingLocalComplianceService(cbomStore.policyCheckResult)" class="muted">
            *Local approximation
          </p>
        </header>
        <div class="charts__body">
          <div v-if="isLoading" class="state state--loading">
            <cds-loading active overlay="false" />
            <p>Evaluating compliance…</p>
          </div>
          <p v-else-if="!hasCompliance" class="state state--empty">
            Compliance results unavailable.
          </p>
          <p v-else-if="complianceData.length === 0" class="state state--empty">
            No assets detected yet.
          </p>
          <CarbonChart
            v-else
            type="donut"
            :data="complianceData"
            :options="complianceOptions"
            @datum-click="onComplianceClick"
          />
        </div>
      </article>

      <article class="charts__card">
        <header class="charts__card-header">
          <h3>Asset names</h3>
          <p class="muted">{{ nameItems.length }} unique</p>
        </header>
        <div class="charts__body">
          <p v-if="isEmpty" class="state state--empty">No assets detected.</p>
          <CarbonChart
            v-else
            type="circle-pack"
            :data="nameData"
            :options="nameOptions"
            @datum-click="onNameClick"
          />
        </div>
      </article>

      <article class="charts__card">
        <header class="charts__card-header">
          <h3>Primitives</h3>
          <p class="muted">{{ primitiveCounts[1] }} distinct</p>
        </header>
        <div class="charts__body">
          <p v-if="isEmpty || primitiveData.length === 0" class="state state--empty">
            No primitive metadata.
          </p>
          <CarbonChart
            v-else
            type="donut"
            :data="primitiveData"
            :options="primitiveOptions"
            @datum-click="onPrimitiveClick"
          />
        </div>
      </article>

      <article class="charts__card">
        <header class="charts__card-header">
          <h3>Functions</h3>
          <p class="muted">{{ functionCounts[1] }} distinct</p>
        </header>
        <div class="charts__body">
          <p v-if="isEmpty || functionData.length === 0" class="state state--empty">
            No function metadata.
          </p>
          <CarbonChart
            v-else
            type="donut"
            :data="functionData"
            :options="functionOptions"
            @datum-click="onFunctionClick"
          />
        </div>
      </article>

      <article class="charts__card charts__card--wide">
        <header class="charts__card-header">
          <h3>Primitive → algorithm breakdown</h3>
          <p class="muted">Click a tile to filter the table below</p>
        </header>
        <div class="charts__body charts__body--tall">
          <p v-if="treemapData.length === 0" class="state state--empty">
            No data to break down.
          </p>
          <CarbonChart
            v-else
            type="treemap"
            :data="treemapData"
            :options="treemapOptions"
            @datum-click="onTreemapClick"
          />
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.charts__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.charts__card {
  background: var(--cds-layer);
  border: 1px solid var(--cds-border-subtle);
  padding: 16px 20px 20px;
  display: flex;
  flex-direction: column;
  min-height: 320px;
}

.charts__card--wide {
  grid-column: 1 / -1;
}

.charts__card-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.charts__card-header h3 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--cds-text-primary);
}

.muted {
  margin: 0;
  font-size: 0.75rem;
  color: var(--cds-text-secondary);
}

.charts__body {
  flex: 1;
  min-height: 240px;
  position: relative;
}

.charts__body--tall {
  min-height: 360px;
}

.state {
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
  color: var(--cds-text-helper);
  font-size: 0.875rem;
  text-align: center;
}

.state--empty {
  font-style: italic;
}

.state--loading p {
  margin: 0;
}
</style>
