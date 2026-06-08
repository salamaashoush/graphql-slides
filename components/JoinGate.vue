<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { join, getParticipant, quizEnabled, type Participant } from '../lib/leaderboard'

const name = ref('')
const me = ref<Participant | null>(null)
const busy = ref(false)
const error = ref('')

onMounted(() => {
  me.value = getParticipant()
})

async function submit() {
  if (busy.value || !name.value.trim()) return
  busy.value = true
  error.value = ''
  me.value = await join(name.value)
  if (!me.value) {
    error.value = 'Could not join the quiz. Try a different name or refresh the page.'
  }
  busy.value = false
}

function leave() {
  localStorage.removeItem('gqlquiz.participant')
  me.value = null
  name.value = ''
}
</script>

<template>
  <div class="join">
    <template v-if="me">
      <div class="join-in">
        You're in as <strong>{{ me.name }}</strong> — answer the live questions to climb the board.
      </div>
      <button class="join-leave" @click="leave">not you? change name</button>
    </template>
    <template v-else>
      <form class="join-form" @submit.prevent="submit">
        <label class="join-label" for="quiz-name">Your name</label>
        <div class="join-row">
          <input
            id="quiz-name"
            v-model="name"
            class="join-input"
            type="text"
            name="name"
            maxlength="32"
            autocomplete="name"
            enterkeyhint="go"
            required
            aria-describedby="join-error join-note"
          />
          <button class="join-btn" :disabled="busy" type="submit">
            {{ busy ? 'joining…' : 'join the quiz' }}
          </button>
        </div>
        <div v-if="error" id="join-error" class="join-error" aria-live="polite">
          {{ error }}
        </div>
      </form>
      <div v-if="!quizEnabled" id="join-note" class="join-note">
        scoring backend not configured — quizzes still work, just won't be recorded
      </div>
    </template>
  </div>
</template>

<style scoped>
.join {
  --tn-bg: #1a1b26;
  --tn-bg2: #24283b;
  --tn-fg: #c0caf5;
  --tn-blue: #7aa2f7;
  --tn-green: #9ece6a;
  --tn-comment: #565f89;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
}
.join-form {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.6rem;
}
.join-label {
  color: var(--tn-fg);
  font-weight: 700;
  text-align: left;
}
.join-row {
  display: flex;
  gap: 0.6rem;
}
.join-input {
  background: var(--tn-bg2);
  border: 1px solid var(--tn-comment);
  border-radius: 0.5rem;
  padding: 0.55rem 0.9rem;
  color: var(--tn-fg);
  font-size: 1rem;
  outline: none;
  min-width: 16rem;
}
.join-input:focus-visible {
  border-color: var(--tn-blue);
  outline: 3px solid var(--tn-blue);
  outline-offset: 3px;
}
.join-btn {
  background: var(--tn-blue);
  color: var(--tn-bg);
  font-weight: 700;
  border: none;
  border-radius: 0.5rem;
  padding: 0.55rem 1.1rem;
  cursor: pointer;
}
.join-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.join-btn:focus-visible,
.join-leave:focus-visible {
  outline: 3px solid var(--tn-blue);
  outline-offset: 3px;
}
.join-in {
  font-size: 1.1rem;
  color: var(--tn-fg);
}
.join-in strong {
  color: var(--tn-green);
}
.join-leave {
  background: none;
  border: none;
  color: var(--tn-comment);
  font-size: 0.75rem;
  cursor: pointer;
  text-decoration: underline;
}
.join-note {
  font-size: 0.72rem;
  color: var(--tn-comment);
}
.join-error {
  max-width: 25rem;
  color: #f7768e;
  font-size: 0.78rem;
  text-align: left;
}
</style>
