<template>
  <div class="bg-white dark:bg-gray-800 rounded border border-slate-200 dark:border-slate-700 p-4">
    <div class="flex items-center justify-between mb-4">
      <div class="text-sm font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-200">Race Activity</div>
      <div class="flex gap-1">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="px-2.5 py-1 text-xs rounded font-medium transition-colors"
          :class="activeTab === tab.key
            ? 'bg-brand text-white'
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
          @click="activeTab = tab.key"
        >{{ tab.label }}</button>
      </div>
    </div>
    <div class="relative h-48">
      <canvas ref="canvas"></canvas>
    </div>
  </div>
</template>

<script>
import {
  Chart,
  BarController,
  BarElement,
  LinearScale,
  CategoryScale,
  Tooltip
} from 'chart.js'
import { markRaw } from 'vue'
import { prefsStore } from '../stores/prefsStore.js'

Chart.register(BarController, BarElement, LinearScale, CategoryScale, Tooltip)

function localDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export default {
  name: 'RaceActivityChart',
  props: {
    hourlyCounts: { type: Array, default: () => new Array(24).fill(0) },
    dailyCounts: { type: Object, default: () => ({}) }
  },
  data() {
    return {
      chart: null,
      activeTab: 'week',
      tabs: [
        { key: 'day', label: 'Day' },
        { key: 'week', label: 'Week' },
        { key: 'month', label: 'Month' },
        { key: 'year', label: 'Year' }
      ]
    }
  },
  computed: {
    isDark() {
      return prefsStore.darkMode
    },
    chartData() {
      const now = new Date()
      if (this.activeTab === 'day') {
        const labels = Array.from({ length: 24 }, (_, h) => {
          const ampm = h < 12 ? 'am' : 'pm'
          const hour = h % 12 || 12
          return `${hour}${ampm}`
        })
        return { labels, data: [...this.hourlyCounts] }
      }

      if (this.activeTab === 'week') {
        const days = Array.from({ length: 7 }, (_, i) => addDays(now, i - 6))
        const labels = days.map(d => d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' }))
        const data = days.map(d => this.dailyCounts[localDateStr(d)] || 0)
        return { labels, data }
      }

      if (this.activeTab === 'month') {
        const days = Array.from({ length: 30 }, (_, i) => addDays(now, i - 29))
        const labels = days.map(d => d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }))
        const data = days.map(d => this.dailyCounts[localDateStr(d)] || 0)
        return { labels, data }
      }

      // year: past 12 months
      const months = []
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        months.push(d)
      }
      const labels = months.map(d => d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }))
      const data = months.map(d => {
        const y = d.getFullYear()
        const m = d.getMonth()
        let total = 0
        for (const [dateStr, count] of Object.entries(this.dailyCounts)) {
          const pd = new Date(dateStr + 'T00:00:00')
          if (pd.getFullYear() === y && pd.getMonth() === m) total += count
        }
        return total
      })
      return { labels, data }
    }
  },
  watch: {
    chartData() {
      this.$nextTick(() => {
        if (this.chart) {
          const { labels, data } = this.chartData
          this.chart.data.labels = labels
          this.chart.data.datasets[0].data = data
          this.chart.update()
        } else {
          this.renderChart()
        }
      })
    },
    isDark() {
      this.$nextTick(() => this.renderChart())
    }
  },
  mounted() {
    this.renderChart()
  },
  beforeUnmount() {
    this.destroyChart()
  },
  methods: {
    destroyChart() {
      if (this.chart) {
        this.chart.stop()
        this.chart.destroy()
        this.chart = null
      }
    },
    renderChart() {
      this.destroyChart()
      if (!this.$refs.canvas) return

      const dark = this.isDark
      const gridColor = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'
      const tickColor = dark ? '#94a3b8' : '#64748b'
      const barColor = '#ef4444'

      const { labels, data } = this.chartData

      this.chart = markRaw(new Chart(this.$refs.canvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: barColor + 'cc',
            borderColor: barColor,
            borderWidth: 1,
            borderRadius: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 400, easing: 'easeInOutQuart' },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: dark ? '#1e293b' : '#fff',
              borderColor: dark ? '#334155' : '#e2e8f0',
              borderWidth: 1,
              titleColor: dark ? '#e2e8f0' : '#1e293b',
              bodyColor: dark ? '#94a3b8' : '#475569',
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                label: ctx => `  ${ctx.parsed.y} race${ctx.parsed.y !== 1 ? 's' : ''}`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              border: { display: false },
              ticks: {
                color: tickColor,
                font: { size: 10 },
                maxRotation: 45,
                autoSkip: true,
                maxTicksLimit: this.activeTab === 'month' ? 10 : 24
              }
            },
            y: {
              grid: { color: gridColor, drawBorder: false },
              border: { display: false },
              beginAtZero: true,
              ticks: {
                color: tickColor,
                font: { size: 11 },
                stepSize: 1,
                precision: 0
              }
            }
          }
        }
      }))
    }
  }
}
</script>
