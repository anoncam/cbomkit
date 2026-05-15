import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useCbomStore } from '@/stores/cbom'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/results',
    name: 'results',
    component: () => import('@/views/ResultsView.vue'),
    beforeEnter: () => {
      const cbomStore = useCbomStore()
      if (!cbomStore.cbom) return { name: 'home' }
      return true
    },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
