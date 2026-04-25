<template>
  <div class="min-h-screen flex flex-col">
    <NavBar v-if="auth.isAuthenticated && !isLoginRoute" />

    <main class="flex-1">
      <p
        v-if="!auth.ready"
        class="text-sm text-slate-500 px-4 py-6"
      >
        Loading session…
      </p>
      <router-view v-else />
    </main>

    <QuickAddModal v-if="auth.isAuthenticated" />
    <FloatingQuickAddButton v-if="auth.isAuthenticated && !isLoginRoute" />
    <ToastContainer />
  </div>
</template>

<script>
import NavBar from './components/NavBar.vue'
import QuickAddModal from './components/QuickAddModal.vue'
import FloatingQuickAddButton from './components/FloatingQuickAddButton.vue'
import ToastContainer from './components/ToastContainer.vue'
import { authStore } from './stores/authStore.js'
import { prefsStore, applyDarkModeClass } from './stores/prefsStore.js'
import { openQuickAdd, quickAddStore } from './stores/quickAddStore.js'

export default {
  name: 'App',
  components: { NavBar, QuickAddModal, FloatingQuickAddButton, ToastContainer },
  data() {
    return {
      auth: authStore,
      prefs: prefsStore
    }
  },
  computed: {
    isLoginRoute() {
      return this.$route && this.$route.name === 'login'
    }
  },
  mounted() {
    applyDarkModeClass()
    document.addEventListener('keydown', this.onGlobalKeydown)
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.onGlobalKeydown)
  },
  methods: {
    onGlobalKeydown(event) {
      // "Q" opens QuickAdd from anywhere — but only if the user isn't typing
      // into a field, and only if they're authenticated and the modal isn't
      // already open.
      if (event.key !== 'q' && event.key !== 'Q') return
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (!authStore.isAuthenticated) return
      if (quickAddStore.open) return
      if (this.isTypingTarget(event.target)) return

      event.preventDefault()
      openQuickAdd()
    },
    isTypingTarget(el) {
      if (!el) return false
      const tag = (el.tagName || '').toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
      if (el.isContentEditable) return true
      return false
    }
  }
}
</script>
