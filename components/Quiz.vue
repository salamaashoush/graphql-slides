<script setup lang="ts">
import { ref, computed } from 'vue'
import { recordAnswer } from '../lib/leaderboard'

interface Props {
  question: string
  options: string[]
  answer: number
  explanation?: string
  /** stable id used to record the answer for the leaderboard */
  qid?: string
  multiline?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  explanation: '',
  qid: '',
  multiline: false,
})

const selected = ref<number | null>(null)
const revealed = ref(false)

function choose(i: number) {
  if (revealed.value) return
  selected.value = i
  revealed.value = true
  if (props.qid) {
    void recordAnswer(props.qid, i, i === props.answer)
  }
}

function reset() {
  selected.value = null
  revealed.value = false
}

const letters = 'ABCDEFGH'.split('')

function stateOf(i: number): 'correct' | 'wrong' | 'idle' | 'missed' {
  if (!revealed.value) return 'idle'
  if (i === props.answer) return 'correct'
  if (i === selected.value) return 'wrong'
  return 'missed'
}

const isCorrect = computed(() => revealed.value && selected.value === props.answer)
</script>

<template>
  <div class="quiz">
    <div class="quiz-head">
      <span class="quiz-q" :class="{ 'quiz-q--multi': multiline }">{{ question }}</span>
    </div>

    <ul class="quiz-opts">
      <li
        v-for="(opt, i) in options"
        :key="i"
        class="quiz-opt"
        :class="`is-${stateOf(i)}`"
        @click="choose(i)"
      >
        <span class="quiz-letter">{{ letters[i] }}</span>
        <span class="quiz-text" v-html="opt" />
        <span v-if="stateOf(i) === 'correct'" class="quiz-mark">✓</span>
        <span v-else-if="stateOf(i) === 'wrong'" class="quiz-mark">✗</span>
      </li>
    </ul>

    <transition name="quiz-fade">
      <div v-if="revealed" class="quiz-explain" :class="isCorrect ? 'is-good' : 'is-bad'">
        <div class="quiz-verdict">{{ isCorrect ? 'Correct!' : 'Not quite —' }}</div>
        <div class="quiz-why" v-html="explanation" />
        <button class="quiz-reset" @click="reset">try again</button>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.quiz {
  --tn-bg: #1a1b26;
  --tn-bg2: #24283b;
  --tn-fg: #c0caf5;
  --tn-blue: #7aa2f7;
  --tn-cyan: #7dcfff;
  --tn-green: #9ece6a;
  --tn-red: #f7768e;
  --tn-purple: #bb9af7;
  --tn-comment: #565f89;
  margin-top: 0.4rem;
  font-size: 0.92rem;
}
.quiz-head {
  margin-bottom: 1.1rem;
}
.quiz-q {
  display: block;
  font-weight: 600;
  font-size: 1.15rem;
  color: var(--tn-cyan);
  line-height: 1.35;
}
.quiz-q--multi { font-size: 1rem; }
.quiz-opts {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.5rem;
}
.quiz-opt {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.6rem 0.85rem;
  border: 1px solid var(--tn-bg2);
  background: rgba(36, 40, 59, 0.55);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.16s ease;
}
.quiz-opt.is-idle:hover {
  border-color: var(--tn-blue);
  transform: translateX(3px);
}
.quiz-opt.is-correct {
  border-color: var(--tn-green);
  background: rgba(158, 206, 106, 0.16);
}
.quiz-opt.is-wrong {
  border-color: var(--tn-red);
  background: rgba(247, 118, 142, 0.14);
}
.quiz-opt.is-missed { opacity: 0.5; }
.quiz-letter {
  flex: none;
  width: 1.5rem;
  height: 1.5rem;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 0.75rem;
  border-radius: 0.4rem;
  background: var(--tn-bg2);
  color: var(--tn-blue);
}
.quiz-opt.is-correct .quiz-letter { background: var(--tn-green); color: var(--tn-bg); }
.quiz-opt.is-wrong .quiz-letter { background: var(--tn-red); color: var(--tn-bg); }
.quiz-text { flex: 1; }
.quiz-text :deep(code) {
  background: var(--tn-bg);
  padding: 0.05rem 0.3rem;
  border-radius: 0.25rem;
  font-size: 0.85em;
  color: var(--tn-purple);
}
.quiz-mark { font-weight: 800; font-size: 1.05rem; }
.quiz-opt.is-correct .quiz-mark { color: var(--tn-green); }
.quiz-opt.is-wrong .quiz-mark { color: var(--tn-red); }
.quiz-explain {
  margin-top: 0.85rem;
  padding: 0.7rem 0.9rem;
  border-radius: 0.5rem;
  border-left: 3px solid var(--tn-blue);
  background: rgba(36, 40, 59, 0.7);
}
.quiz-explain.is-good { border-left-color: var(--tn-green); }
.quiz-explain.is-bad { border-left-color: var(--tn-red); }
.quiz-verdict {
  font-weight: 700;
  margin-bottom: 0.25rem;
}
.is-good .quiz-verdict { color: var(--tn-green); }
.is-bad .quiz-verdict { color: var(--tn-red); }
.quiz-why { color: var(--tn-fg); line-height: 1.45; }
.quiz-why :deep(code) {
  background: var(--tn-bg);
  padding: 0.05rem 0.3rem;
  border-radius: 0.25rem;
  color: var(--tn-purple);
}
.quiz-reset {
  margin-top: 0.5rem;
  font-size: 0.7rem;
  color: var(--tn-comment);
  background: none;
  border: 1px solid var(--tn-comment);
  border-radius: 0.4rem;
  padding: 0.15rem 0.5rem;
  cursor: pointer;
}
.quiz-reset:hover { color: var(--tn-fg); border-color: var(--tn-fg); }
.quiz-fade-enter-active { transition: all 0.25s ease; }
.quiz-fade-enter-from { opacity: 0; transform: translateY(-6px); }
</style>
