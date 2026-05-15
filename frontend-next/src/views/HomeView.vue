<script setup lang="ts">
import { useRouter } from 'vue-router'
import FileUploader from '@/components/home/FileUploader.vue'
import { showResultFromUpload } from '@/lib/cbom'
import { getComplianceReport } from '@/services/api'
import { getTitle, isViewerOnly } from '@/config'
import sampleCbom from '@/data/sample-cbom.json'
import type { Cbom } from '@/types/cbom'

const router = useRouter()

function loadSample() {
  const cbom = sampleCbom as Cbom
  showResultFromUpload(cbom, 'keycloak-cbom.json (sample)')
  void getComplianceReport(cbom)
  void router.push({ name: 'results' })
}

function goToResults() {
  void router.push({ name: 'results' })
}
</script>

<template>
  <section class="home">
    <header class="home__intro">
      <h1>{{ getTitle() }}</h1>
      <p>
        Visualize a Cryptography Bill of Materials. Drop a CBOM JSON file below,
        or load a sample to explore the new redesigned visualizer.
      </p>
      <p v-if="isViewerOnly()" class="home__viewer-note">
        Running in viewer-only mode — scanning is disabled.
      </p>
    </header>

    <div class="home__actions">
      <FileUploader class="home__uploader" @uploaded="goToResults" />
      <button class="home__sample" type="button" @click="loadSample">
        Try the sample CBOM
      </button>
    </div>

    <p class="home__hint">
      Other examples are available at
      <a
        href="https://github.com/anoncam/cbomkit/tree/main/example"
        target="_blank"
        rel="noopener"
      >cbomkit/example</a>.
    </p>
  </section>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 24px;
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

.home__viewer-note {
  margin-top: 8px !important;
  color: var(--cds-text-helper) !important;
  font-style: italic;
}

.home__actions {
  display: flex;
  gap: 16px;
  align-items: stretch;
  flex-wrap: wrap;
}

.home__uploader {
  flex: 1 1 320px;
}

.home__sample {
  appearance: none;
  background: var(--cds-button-primary, #0f62fe);
  color: var(--cds-text-on-color, #ffffff);
  border: 0;
  padding: 0 24px;
  font-size: 0.875rem;
  cursor: pointer;
  min-height: 88px;
  min-width: 200px;
}

.home__sample:hover {
  filter: brightness(1.1);
}

.home__hint {
  font-size: 0.8125rem;
  color: var(--cds-text-helper);
  margin: 0;
}

.home__hint a {
  color: var(--cds-link-primary);
}
</style>
