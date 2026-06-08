<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  demo: string
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Run this example',
})

const copied = ref(false)

const command = computed(() => [
  'if [ -d graphql-slides/.git ]; then cd graphql-slides; elif [ -f package.json ] && grep -q \'"graphql-slides"\' package.json; then :; else git clone https://github.com/salamaashoush/graphql-slides.git graphql-slides && cd graphql-slides; fi',
  'test -d node_modules || npm ci',
  `npm run examples -- ${props.demo}`,
].join(' && '))

async function copy() {
  try {
    await navigator.clipboard.writeText(command.value)
    copied.value = true
    window.setTimeout(() => {
      copied.value = false
    }, 1800)
  } catch {
    copied.value = false
  }
}
</script>

<template>
  <div class="copy-command">
    <div class="copy-command__label">{{ label }}</div>
    <div class="copy-command__row">
      <code class="copy-command__code">{{ command }}</code>
      <button class="copy-command__button" type="button" @click="copy">
        {{ copied ? 'copied' : 'copy' }}
      </button>
    </div>
    <div class="copy-command__hint" aria-live="polite">
      {{ copied ? 'Command copied to clipboard.' : 'Skips clone/install if already present.' }}
    </div>
  </div>
</template>

<style scoped>
.copy-command {
  --tn-bg: #1a1b26;
  --tn-bg2: #24283b;
  --tn-bg3: #2f344d;
  --tn-fg: #c0caf5;
  --tn-blue: #7aa2f7;
  --tn-green: #9ece6a;
  --tn-comment: #565f89;
  margin-top: 0.75rem;
  text-align: left;
}
.copy-command__label {
  color: var(--tn-comment);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}
.copy-command__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.45rem;
  align-items: stretch;
}
.copy-command__code {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border: 1px solid var(--tn-bg3);
  border-radius: 0.45rem;
  background: var(--tn-bg2);
  color: var(--tn-fg);
  padding: 0.45rem 0.6rem;
  font-size: 0.62rem;
}
.copy-command__button {
  border: 1px solid var(--tn-blue);
  border-radius: 0.45rem;
  background: var(--tn-blue);
  color: var(--tn-bg);
  font: inherit;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0 0.75rem;
  cursor: pointer;
}
.copy-command__button:focus-visible {
  outline: 3px solid var(--tn-green);
  outline-offset: 3px;
}
.copy-command__hint {
  min-height: 1rem;
  margin-top: 0.25rem;
  color: var(--tn-comment);
  font-size: 0.62rem;
}
</style>
