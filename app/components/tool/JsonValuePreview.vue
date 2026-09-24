<template>
  <!-- Type chip + one-click actions, rendered next to a leaf value -->
  <span v-if="kind" class="ml-1 inline-flex items-center gap-0.5 align-middle">
    <button
      @click.stop="inspect"
      class="inline-flex items-center gap-1 rounded-full border border-surface-200 bg-surface-50 px-1.5 py-[1px] text-[10px] font-medium text-surface-600 transition-colors hover:bg-surface-100 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
      :title="$t('value.inspect')"
    >
      <Icon :name="getTypeIcon(kind)" class="w-3 h-3" />
      <span>{{ label }}</span>
    </button>

    <!-- URL: open / copy -->
    <button
      v-if="kind === 'url'"
      @click.stop="openLink"
      class="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
      :title="$t('value.openUrl')"
    >
      <Icon name="lucide:external-link" class="w-3 h-3" />
    </button>
    <button
      v-if="kind === 'url'"
      @click.stop="copyValue"
      class="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
      :title="$t('value.copyUrl')"
    >
      <Icon :name="copied ? 'lucide:check' : 'lucide:copy'" class="w-3 h-3" />
    </button>

    <!-- Email: mailto / copy -->
    <a
      v-if="kind === 'email'"
      :href="`mailto:${stringValue}`"
      @click.stop
      class="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
      :title="$t('value.mailto')"
    >
      <Icon name="lucide:send" class="w-3 h-3" />
    </a>
    <button
      v-if="kind === 'email'"
      @click.stop="copyValue"
      class="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
      :title="$t('value.copyValue')"
    >
      <Icon :name="copied ? 'lucide:check' : 'lucide:copy'" class="w-3 h-3" />
    </button>
  </span>
</template>

<script setup lang="ts">
import { detectValueKind, type ValueKind } from '~/utils/mediaPreview'
import { getTypeIcon } from '~/composables/useSmartJsonValue'
import { copyToClipboard } from '~/utils'
import { useToast } from '~/composables/useToast'

const props = defineProps<{ value: unknown }>()
const { t } = useI18n()
const toast = useToast()

// Provided by the root JsonTreeNode — the inspector is a single shared instance.
const inspector = inject<{ open: (value: unknown) => void } | null>('valueInspector', null)

const kind = computed<ValueKind | null>(() => detectValueKind(props.value))
const stringValue = computed(() => (typeof props.value === 'string' ? props.value : String(props.value ?? '')))
const copied = ref(false)

const label = computed(() => {
  switch (kind.value) {
    case 'image': return t('value.image')
    case 'audio': return t('media.audio')
    case 'video': return t('media.video')
    case 'pdf': return t('media.pdf')
    case 'url': return t('value.url')
    case 'email': return t('value.email')
    case 'color': return t('value.color')
    case 'timestamp': return t('value.timestamp')
    case 'jwt': return t('value.jwt')
    case 'base64': return t('value.base64')
    case 'uuid': return t('value.uuid')
    case 'ip': return t('value.ip')
    case 'markdown': return t('value.markdown')
    case 'regex': return t('value.regex')
    default: return ''
  }
})

function inspect() {
  inspector?.open(props.value)
}

function openLink() {
  window.open(stringValue.value, '_blank', 'noopener,noreferrer')
}

async function copyValue() {
  const ok = await copyToClipboard(stringValue.value)
  if (!ok) return
  copied.value = true
  toast.success('✓ Copied')
  setTimeout(() => { copied.value = false }, 2000)
}
</script>
