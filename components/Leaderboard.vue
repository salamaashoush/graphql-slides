<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { getLeaderboard, onAnswersChange, quizEnabled, type LeaderRow } from '../lib/leaderboard'

const rows = ref<LeaderRow[]>([])
const loading = ref(false)
let stop: (() => void) | null = null

async function refresh() {
  loading.value = true
  rows.value = await getLeaderboard(10)
  loading.value = false
}

onMounted(() => {
  refresh()
  stop = onAnswersChange(refresh)
})
onUnmounted(() => stop?.())

const podium = computed(() => rows.value.slice(0, 3))
const rest = computed(() => rows.value.slice(3))
const medals = ['🥇', '🥈', '🥉']
</script>

<template>
  <div class="lb">
    <div v-if="!quizEnabled" class="lb-empty">
      Scoring backend not configured. Set <code>VITE_SUPABASE_URL</code> +
      <code>VITE_SUPABASE_ANON_KEY</code> and redeploy to enable the live board.
    </div>

    <template v-else>
      <div v-if="!rows.length" class="lb-empty">
        {{ loading ? 'loading…' : 'no answers yet — be the first!' }}
      </div>

      <div v-else class="lb-podium">
        <div
          v-for="(row, i) in podium"
          :key="row.name"
          class="lb-top"
          :class="`lb-top-${i + 1}`"
        >
          <div class="lb-medal">{{ medals[i] }}</div>
          <div class="lb-name">{{ row.name }}</div>
          <div class="lb-score">{{ row.correct }} <span>correct</span></div>
        </div>
      </div>

      <ul v-if="rest.length" class="lb-rest">
        <li v-for="(row, i) in rest" :key="row.name">
          <span class="lb-rank">{{ i + 4 }}</span>
          <span class="lb-rname">{{ row.name }}</span>
          <span class="lb-rscore">{{ row.correct }} / {{ row.answered }}</span>
        </li>
      </ul>

      <button class="lb-refresh" @click="refresh">refresh</button>
    </template>
  </div>
</template>

<style scoped>
.lb {
  --tn-bg2: #24283b;
  --tn-bg3: #2f344d;
  --tn-fg: #c0caf5;
  --tn-blue: #7aa2f7;
  --tn-green: #9ece6a;
  --tn-yellow: #e0af68;
  --tn-comment: #565f89;
  width: 100%;
  max-width: 46rem;
  margin: 0 auto;
}
.lb-empty {
  color: var(--tn-comment);
  text-align: center;
  padding: 2rem 0;
}
.lb-empty code {
  color: var(--tn-blue);
}
.lb-podium {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 1.2rem;
}
.lb-top {
  flex: 1;
  background: rgba(36, 40, 59, 0.7);
  border: 1px solid var(--tn-bg3);
  border-radius: 0.6rem;
  padding: 1rem 0.8rem;
  text-align: center;
}
.lb-top-1 {
  border-color: var(--tn-yellow);
  transform: scale(1.08);
  background: rgba(224, 175, 104, 0.12);
}
.lb-top-2 { border-color: #c0caf5; }
.lb-top-3 { border-color: #ff9e64; }
.lb-medal { font-size: 1.8rem; }
.lb-name {
  font-weight: 700;
  font-size: 1.15rem;
  color: var(--tn-fg);
  margin: 0.2rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lb-score {
  color: var(--tn-green);
  font-weight: 700;
}
.lb-score span {
  color: var(--tn-comment);
  font-weight: 400;
  font-size: 0.8rem;
}
.lb-rest {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem;
  display: grid;
  gap: 0.35rem;
}
.lb-rest li {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.4rem 0.8rem;
  background: rgba(36, 40, 59, 0.5);
  border-radius: 0.45rem;
}
.lb-rank {
  width: 1.5rem;
  color: var(--tn-comment);
  font-weight: 700;
  text-align: center;
}
.lb-rname {
  flex: 1;
  color: var(--tn-fg);
}
.lb-rscore {
  color: var(--tn-comment);
  font-variant-numeric: tabular-nums;
}
.lb-refresh {
  display: block;
  margin: 0 auto;
  font-size: 0.75rem;
  color: var(--tn-comment);
  background: none;
  border: 1px solid var(--tn-comment);
  border-radius: 0.4rem;
  padding: 0.2rem 0.7rem;
  cursor: pointer;
}
</style>
