import { reactive } from 'vue'
import { getSession, onAuthChange } from '../services/authService.js'

// Lightweight reactive store. We use a plain reactive object instead of
// Pinia/Vuex because the app's shared state is small.
export const authStore = reactive({
  session: null,
  ready: false,

  get user() {
    return this.session ? this.session.user : null
  },

  get isAuthenticated() {
    return Boolean(this.session)
  }
})

let initialized = false

export async function initAuthStore() {
  if (initialized) return
  initialized = true

  try {
    authStore.session = await getSession()
  } catch (err) {
    console.error('Failed to load session', err)
    authStore.session = null
  } finally {
    authStore.ready = true
  }

  onAuthChange(session => {
    authStore.session = session
  })
}
