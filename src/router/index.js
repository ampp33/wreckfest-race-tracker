import { createRouter, createWebHashHistory } from 'vue-router'
import { authStore, initAuthStore } from '../stores/authStore.js'

import TrackListPage from '../pages/TrackListPage.vue'
import TrackDetailPage from '../pages/TrackDetailPage.vue'
import StatsPage from '../pages/StatsPage.vue'
import LoginPage from '../pages/LoginPage.vue'

const routes = [
  { path: '/login', name: 'login', component: LoginPage, meta: { public: true } },
  { path: '/', name: 'tracks', component: TrackListPage },
  {
    path: '/track/:trackSlug/:variationSlug',
    name: 'track-detail',
    component: TrackDetailPage
  },
  { path: '/stats', name: 'stats', component: StatsPage },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

// Hash history avoids needing a 404 fallback on GitHub Pages.
export const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach(async to => {
  await initAuthStore()
  if (to.meta.public) return true
  if (!authStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  return true
})
