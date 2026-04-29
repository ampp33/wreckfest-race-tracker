<template>
  <div class="max-w-6xl mx-auto px-4 py-6 pb-24">
    <p v-if="loading" class="text-sm text-slate-500">Loading…</p>

    <div v-else-if="!track">
      <p class="text-sm text-slate-500">Track not found.</p>
      <router-link to="/" class="text-brand text-sm hover:underline">← Back to tracks</router-link>
    </div>

    <div v-else>
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
        <div class="flex gap-4 min-w-0 flex-1">
          <img
            v-if="track"
            :src="trackImage"
            :alt="track.name"
            class="w-auto h-24 sm:h-32 object-cover rounded border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
            @click="openImageModal"
          />
          <div class="min-w-0">
            <router-link to="/" class="text-xs text-slate-500 hover:text-brand">← All tracks</router-link>
            <h1 class="text-2xl font-bold mt-1 truncate">{{ track.name }}</h1>
            <p class="text-sm text-slate-500">{{ currentVariation && currentVariation.name }}</p>
            <div class="flex flex-wrap gap-2 mt-2">
              <router-link
                v-for="v in track.track_variations"
                :key="v.id"
                :to="`/track/${track.slug}/${v.slug}`"
                class="flex items-center gap-2 pl-1 pr-3 py-1 text-xs rounded border"
                :class="v.id === currentVariation.id
                  ? 'bg-brand text-white border-brand'
                  : 'border-slate-300 dark:border-slate-600 hover:border-brand'"
              >
                <img
                  :src="variationImageUrl(track.slug, v.slug)"
                  alt=""
                  aria-hidden="true"
                  class="w-8 h-6 object-contain bg-black rounded"
                  loading="lazy"
                />
                <span>{{ v.name }}</span>
              </router-link>
            </div>
          </div>
        </div>

        <button
          type="button"
          class="self-start px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded text-sm font-semibold shrink-0"
          @click="onAddRow"
        >
          + Add Race
        </button>
      </div>

      <!-- Track Notes -->
      <div class="mb-4 bg-white dark:bg-gray-800 rounded border border-slate-200 dark:border-slate-700 p-3">
        <div v-if="!notesEditMode" class="flex items-start gap-2">
          <div
            v-if="trackNotesHtml"
            class="flex-1 text-sm prose prose-sm dark:prose-invert max-w-none"
            v-html="trackNotesHtml"
          />
          <p
            v-else
            class="flex-1 text-sm text-slate-400 dark:text-slate-500 italic"
          >Add notes about this track…</p>
          <button
            type="button"
            class="text-slate-400 hover:text-brand shrink-0 mt-0.5"
            title="Edit notes"
            @click="startEditNotes"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
            </svg>
          </button>
        </div>
        <div v-else class="flex flex-col gap-2">
          <textarea
            ref="notesTextarea"
            v-model="notesInput"
            rows="4"
            class="w-full text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-gray-900 text-slate-800 dark:text-slate-200 px-2 py-1.5 resize-y focus:outline-none focus:ring-1 focus:ring-brand"
            placeholder="Notes about this track…"
          />
          <div class="flex gap-2 justify-end">
            <button
              type="button"
              class="px-3 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 hover:border-slate-500 dark:hover:border-slate-400"
              @click="cancelEditNotes"
            >Cancel</button>
            <button
              type="button"
              class="px-3 py-1 text-sm rounded bg-brand hover:bg-brand-dark text-white font-semibold"
              @click="saveNotes"
            >Save</button>
          </div>
        </div>
      </div>

      <!-- Turn Annotations -->
      <VariationAnnotations
        v-if="currentVariation"
        :image-url="variationMapImage"
        :alt="currentVariation.name"
        :annotations="annotations"
        @save="onSaveAnnotations"
      />

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div class="bg-white dark:bg-gray-800 rounded border border-slate-200 dark:border-slate-700 p-3">
          <div class="text-xs uppercase text-slate-500">Goal lap time</div>
          <div class="flex items-center gap-2 mt-1">
            <LapTimeInput v-model="goalInputMs" @blur="onSaveGoal" />
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded border border-slate-200 dark:border-slate-700 p-3">
          <div class="text-xs uppercase text-slate-500">Personal best</div>
          <div class="font-mono text-lg mt-1">{{ pbDisplay }}</div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded border border-slate-200 dark:border-slate-700 p-3">
          <div class="text-xs uppercase text-slate-500">Total races</div>
          <div class="font-mono text-lg mt-1">{{ races.length }}</div>
        </div>
      </div>

      <LapTimeChart :races="races" :vehicles="vehicles" />

      <div class="overflow-x-auto bg-white dark:bg-gray-800 rounded border border-slate-200 dark:border-slate-700">
        <table class="min-w-full text-sm">
          <thead class="bg-slate-50 dark:bg-gray-900 text-left text-xs uppercase text-slate-500">
            <tr>
              <th class="py-2 pl-3 pr-3">When</th>
              <th class="py-2 pr-3">Vehicle</th>
              <th class="py-2 pr-3 text-center">Tune</th>
              <th class="py-2 pr-3 text-center">Place</th>
              <th class="py-2 pr-3">Lap</th>
              <th class="py-2 pr-3">Δ goal</th>
              <th class="py-2 pr-3">Total</th>
              <th class="py-2 pr-3">Notes</th>
              <th class="py-2 pr-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <RaceRow
              v-for="race in races"
              :key="race.id"
              :race="race"
              :vehicles="vehicles"
              :goal-lap-time-ms="goalLapTimeMs"
              :personal-best-ms="personalBestMs"
              @update="onUpdateRace"
              @delete="onDeleteRace"
            />
            <tr v-if="!races.length">
              <td colspan="9" class="py-6 text-center text-sm text-slate-500">
                No races yet — click <span class="font-semibold">+ Add Race</span> to log one.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Hero image modal -->
  <Teleport to="body">
    <div
      v-if="showImageModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      @click.self="closeImageModal"
    >
      <div class="relative max-w-4xl w-full mx-4">
        <button
          type="button"
          class="absolute -top-8 right-0 text-white/80 hover:text-white"
          aria-label="Close"
          @click="closeImageModal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
        <img
          :src="trackImage"
          :alt="track && track.name"
          class="w-full max-h-[85vh] object-contain rounded"
        />
      </div>
    </div>
  </Teleport>
</template>

<script>
import RaceRow from '../components/RaceRow.vue'
import LapTimeChart from '../components/LapTimeChart.vue'
import VariationAnnotations from '../components/VariationAnnotations.vue'
import { getTrackBySlug, findVariation } from '../services/trackService.js'
import { getVehicles } from '../services/vehicleService.js'
import { getRacesByVariation, updateRace, deleteRace } from '../services/raceService.js'
import { getGoalForVariation, upsertGoal } from '../services/goalService.js'
import { getAnnotationsForVariation, saveAnnotations } from '../services/annotationService.js'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { authStore } from '../stores/authStore.js'
import { pushToast } from '../stores/toastStore.js'
import { formatMsToTime } from '../utils/timeFormat.js'
import LapTimeInput from '../components/LapTimeInput.vue'
import { trackImageUrl, variationImageUrl } from '../utils/imageUrl.js'
import { openQuickAdd, quickAddStore } from '../stores/quickAddStore.js'

export default {
  name: 'TrackDetailPage',
  components: { RaceRow, LapTimeChart, LapTimeInput, VariationAnnotations },
  data() {
    return {
      loading: true,
      track: null,
      currentVariation: null,
      vehicles: [],
      races: [],
      goal: null,
      goalInputMs: null,
      annotations: [],
      quickAddStore,
      showImageModal: false,
      notesEditMode: false,
      notesInput: ''
    }
  },
  computed: {
    trackImage() {
      return this.track ? trackImageUrl(this.track.slug) : ''
    },
    goalLapTimeMs() {
      return this.goal ? this.goal.goal_lap_time_ms : null
    },
    personalBestMs() {
      const valid = this.races
        .map(r => r.lap_time_ms)
        .filter(v => v != null)
      if (!valid.length) return null
      return Math.min(...valid)
    },
    pbDisplay() {
      return this.personalBestMs != null ? formatMsToTime(this.personalBestMs) : '—'
    },
    trackNotes() {
      return this.goal ? (this.goal.notes || '') : ''
    },
    trackNotesHtml() {
      if (!this.trackNotes) return ''
      return DOMPurify.sanitize(marked.parse(this.trackNotes))
    },
    variationMapImage() {
      return this.track && this.currentVariation
        ? variationImageUrl(this.track.slug, this.currentVariation.slug)
        : ''
    }
  },
  watch: {
    '$route.params': {
      handler() {
        this.loadAll()
      },
      immediate: false
    },
    'quickAddStore.open'(isOpen) {
      if (!isOpen && this._quickAddOpenedHere) {
        this._quickAddOpenedHere = false
        this.loadRaces()
      }
    }
  },
  async mounted() {
    await this.loadAll()
    this._escHandler = (e) => { if (e.key === 'Escape') this.closeImageModal() }
    document.addEventListener('keydown', this._escHandler)
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this._escHandler)
  },
  methods: {
    variationImageUrl,
    async loadAll() {
      this.loading = true
      const slug = this.$route.params.trackSlug
      const variationSlug = this.$route.params.variationSlug
      try {
        const [track, vehicles] = await Promise.all([
          getTrackBySlug(slug),
          getVehicles()
        ])
        this.track = track
        this.vehicles = vehicles
        this.currentVariation = findVariation(track, variationSlug)
        if (!this.currentVariation) {
          pushToast('Variation not found', 'error')
          return
        }
        await Promise.all([this.loadRaces(), this.loadGoal(), this.loadAnnotations()])
      } catch (err) {
        pushToast(err.message || 'Failed to load track', 'error')
      } finally {
        this.loading = false
      }
    },
    async loadRaces() {
      this.races = await getRacesByVariation(this.currentVariation.id)
    },
    async loadGoal() {
      this.goal = await getGoalForVariation(this.currentVariation.id)
      this.goalInputMs = this.goal ? this.goal.goal_lap_time_ms : null
    },
    async loadAnnotations() {
      this.annotations = await getAnnotationsForVariation(this.currentVariation.id)
    },
    openImageModal() {
      this.showImageModal = true
    },
    closeImageModal() {
      this.showImageModal = false
    },
    startEditNotes() {
      this.notesInput = this.trackNotes
      this.notesEditMode = true
      this.$nextTick(() => this.$refs.notesTextarea?.focus())
    },
    cancelEditNotes() {
      this.notesEditMode = false
    },
    async saveNotes() {
      try {
        const userId = authStore.user && authStore.user.id
        this.goal = await upsertGoal({
          variationId: this.currentVariation.id,
          goalLapTimeMs: this.goalLapTimeMs,
          notes: this.notesInput,
          userId
        })
        this.notesEditMode = false
        pushToast('Notes saved', 'success', 1500)
      } catch (err) {
        pushToast(err.message || 'Failed to save notes', 'error')
      }
    },
    async onSaveAnnotations(annotations) {
      try {
        const userId = authStore.user && authStore.user.id
        this.annotations = await saveAnnotations({
          variationId: this.currentVariation.id,
          annotations,
          userId
        })
        pushToast('Annotations saved', 'success', 1500)
      } catch (err) {
        pushToast(err.message || 'Failed to save annotations', 'error')
      }
    },
    onAddRow() {
      this._quickAddOpenedHere = true
      openQuickAdd(this.currentVariation.id)
    },
    async onUpdateRace({ id, patch }) {
      try {
        const updated = await updateRace(id, patch)
        const idx = this.races.findIndex(r => r.id === id)
        if (idx !== -1) this.races.splice(idx, 1, updated)
        pushToast('Race updated', 'success', 1500)
      } catch (err) {
        pushToast(err.message || 'Failed to update race', 'error')
      }
    },
    async onDeleteRace(id) {
      try {
        await deleteRace(id)
        this.races = this.races.filter(r => r.id !== id)
        pushToast('Race deleted', 'success', 1500)
      } catch (err) {
        pushToast(err.message || 'Failed to delete race', 'error')
      }
    },
    async onSaveGoal() {
      const ms = this.goalInputMs
      if (!ms) return
      if (this.goal && this.goal.goal_lap_time_ms === ms) return
      try {
        const userId = authStore.user && authStore.user.id
        this.goal = await upsertGoal({
          variationId: this.currentVariation.id,
          goalLapTimeMs: ms,
          notes: this.trackNotes,
          userId
        })
        pushToast('Goal saved', 'success', 1500)
      } catch (err) {
        pushToast(err.message || 'Failed to save goal', 'error')
      }
    }
  }
}
</script>
