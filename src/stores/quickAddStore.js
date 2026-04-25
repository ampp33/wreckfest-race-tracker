import { reactive } from 'vue'

// Centralised flag so any component (router views, NavBar, floating button,
// global keyboard shortcut) can open the QuickAdd modal without prop chains.
export const quickAddStore = reactive({
  open: false,
  prefillVariationId: null
})

export function openQuickAdd(prefillVariationId = null) {
  quickAddStore.prefillVariationId = prefillVariationId
  quickAddStore.open = true
}

export function closeQuickAdd() {
  quickAddStore.open = false
  quickAddStore.prefillVariationId = null
}
