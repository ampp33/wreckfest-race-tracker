<template>
  <button
    v-if="visible"
    type="button"
    class="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-brand hover:bg-brand-dark text-white text-2xl font-bold shadow-lg flex items-center justify-center"
    aria-label="Quick add race (Q)"
    title="Quick add race (Q)"
    @click="onClick"
  >
    +
  </button>
</template>

<script>
import { authStore } from '../stores/authStore.js'
import { openQuickAdd, quickAddStore } from '../stores/quickAddStore.js'

export default {
  name: 'FloatingQuickAddButton',
  data() {
    return {
      auth: authStore,
      qa: quickAddStore
    }
  },
  computed: {
    visible() {
      return this.auth.isAuthenticated && !this.qa.open
    }
  },
  methods: {
    onClick() {
      openQuickAdd()
    }
  }
}
</script>
