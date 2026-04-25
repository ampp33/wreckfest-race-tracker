<template>
  <form @submit.prevent="onSubmit" @keydown="onFormKeydown">
    <div class="grid grid-cols-2 gap-3">
      <div class="col-span-2">
        <label class="block text-xs uppercase tracking-wide text-slate-500 mb-1">
          Date / time
        </label>
        <input
          ref="datetimeInput"
          v-model="form.datetime"
          type="datetime-local"
          class="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2"
        />
      </div>

      <div>
        <label class="block text-xs uppercase tracking-wide text-slate-500 mb-1">
          Vehicle
        </label>
        <select
          v-model="form.vehicleId"
          class="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2"
        >
          <option :value="null">— none —</option>
          <option v-for="v in vehicles" :key="v.id" :value="v.id">
            {{ v.name }}
          </option>
        </select>
      </div>

      <div>
        <label class="block text-xs uppercase tracking-wide text-slate-500 mb-1">
          Tuning
        </label>
        <input
          v-model.number="form.tuning"
          type="number"
          min="0"
          class="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2"
        />
      </div>

      <div>
        <label class="block text-xs uppercase tracking-wide text-slate-500 mb-1">
          Place
        </label>
        <input
          v-model="form.place"
          type="text"
          class="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2"
          placeholder="1st"
        />
      </div>

      <div>
        <label class="block text-xs uppercase tracking-wide text-slate-500 mb-1">
          Lap time
        </label>
        <input
          v-model="form.lapTime"
          type="text"
          class="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2"
          placeholder="1:23.456"
        />
      </div>

      <div class="col-span-2">
        <label class="block text-xs uppercase tracking-wide text-slate-500 mb-1">
          Total time (optional)
        </label>
        <input
          v-model="form.totalTime"
          type="text"
          class="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2"
          placeholder="6:12.000"
        />
      </div>

      <div class="col-span-2">
        <label class="block text-xs uppercase tracking-wide text-slate-500 mb-1">
          Notes (Ctrl+Enter to save)
        </label>
        <textarea
          ref="notesInput"
          v-model="form.notes"
          rows="2"
          class="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 resize-none"
          @input="autoExpand"
        />
      </div>
    </div>

    <p v-if="errorMessage" class="mt-3 text-sm text-red-600">{{ errorMessage }}</p>

    <div class="mt-4 flex items-center justify-between gap-3">
      <button
        type="button"
        class="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        @click="$emit('cancel')"
      >
        Cancel (Esc)
      </button>
      <div class="flex items-center gap-2">
        <!-- <button
          v-if="canDuplicateLast"
          type="button"
          class="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
          @click="onDuplicateLast"
        >
          Duplicate last
        </button> -->
        <button
          type="submit"
          :disabled="saving"
          class="px-4 py-2 text-sm bg-brand hover:bg-brand-dark text-white rounded font-semibold disabled:opacity-60"
        >
          {{ saving ? 'Saving...' : 'Save (Enter)' }}
        </button>
      </div>
    </div>
  </form>
</template>

<script>
import { parseTimeToMs, formatMsToTime } from '../utils/timeFormat.js'

function nowLocalIsoMinute() {
  const d = new Date()
  d.setSeconds(0, 0)
  const tzOffset = d.getTimezoneOffset() * 60_000
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16)
}

function emptyForm() {
  return {
    datetime: nowLocalIsoMinute(),
    vehicleId: null,
    tuning: null,
    place: '',
    lapTime: '',
    totalTime: '',
    notes: ''
  }
}

export default {
  name: 'RaceForm',
  props: {
    vehicles: { type: Array, required: true },
    defaults: { type: Object, default: () => ({}) },
    lastRace: { type: Object, default: null },
    saving: { type: Boolean, default: false },
    autofocus: { type: Boolean, default: true }
  },
  emits: ['submit', 'cancel'],
  data() {
    return {
      form: { ...emptyForm(), ...this.defaults },
      errorMessage: ''
    }
  },
  computed: {
    canDuplicateLast() {
      return Boolean(this.lastRace)
    }
  },
  mounted() {
    if (this.autofocus) {
      this.$nextTick(() => this.$refs.datetimeInput && this.$refs.datetimeInput.focus())
    }
    this.autoExpand()
  },
  methods: {
    onFormKeydown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        this.$emit('cancel')
        return
      }
      // Enter submits form unless we're inside the textarea (use Ctrl+Enter
      // there). This matches the spec's "fast input" rule.
      if (event.key === 'Enter') {
        const inTextarea = event.target && event.target.tagName === 'TEXTAREA'
        if (inTextarea && !event.ctrlKey && !event.metaKey) return
        event.preventDefault()
        this.onSubmit()
      }
    },
    autoExpand() {
      const el = this.$refs.notesInput
      if (!el) return
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`
    },
    onDuplicateLast() {
      if (!this.lastRace) return
      this.form.vehicleId = this.lastRace.vehicle_id || null
      this.form.tuning = this.lastRace.tuning ?? null
      this.form.place = this.lastRace.place || ''
      this.form.lapTime = formatMsToTime(this.lastRace.lap_time_ms)
      this.form.totalTime = this.lastRace.total_time_ms
        ? formatMsToTime(this.lastRace.total_time_ms)
        : ''
      this.form.notes = this.lastRace.notes || ''
    },
    onSubmit() {
      const lapMs = this.form.lapTime ? parseTimeToMs(this.form.lapTime) : null
      const totalMs = this.form.totalTime ? parseTimeToMs(this.form.totalTime) : null

      if (this.form.lapTime && lapMs == null) {
        this.errorMessage = 'Lap time format unrecognised (try 1:23.456)'
        return
      }
      if (this.form.totalTime && totalMs == null) {
        this.errorMessage = 'Total time format unrecognised'
        return
      }

      this.errorMessage = ''
      const payload = {
        datetime: new Date(this.form.datetime).toISOString(),
        vehicle_id: this.form.vehicleId || null,
        tuning: this.form.tuning ?? null,
        place: this.form.place || null,
        lap_time_ms: lapMs,
        total_time_ms: totalMs,
        notes: this.form.notes || null
      }
      this.$emit('submit', payload)
    }
  }
}
</script>
