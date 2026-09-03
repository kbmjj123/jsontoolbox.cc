<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4"
        @click.self="handleBackdropClick"
      >
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="handleBackdropClick"></div>
        <div class="relative w-full max-w-md rounded-2xl bg-white shadow-xl dark:bg-surface-900 border border-surface-200 dark:border-surface-700">
          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-4 border-b border-surface-100 dark:border-surface-700">
            <h3 class="text-sm font-bold text-surface-900 dark:text-surface-100">
              {{ headerTitle }}
            </h3>
            <button
              @click="$emit('close')"
              class="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
            >
              <Icon name="lucide:x" class="w-4 h-4" />
            </button>
          </div>

          <!-- Body -->
          <div class="px-5 py-4 space-y-4">
            <!-- Analyzing -->
            <template v-if="state === 'analyzing' || state === 'generating'">
              <div class="flex flex-col items-center gap-3 py-6">
                <div class="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                <p class="text-sm text-surface-500 dark:text-surface-400">
                  {{ $t('share.preparing') }}
                </p>
              </div>
            </template>

            <!-- Sensitive Warning -->
            <template v-else-if="state === 'sensitive-warning'">
              <div class="space-y-3">
                <div class="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-800 dark:bg-amber-900/20">
                  <Icon name="lucide:shield-alert" class="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div class="text-xs text-amber-700 dark:text-amber-300">
                    <p class="font-bold">{{ $t('share.riskTitle') }}</p>
                    <p class="mt-1">{{ $t('share.riskDescription') }}</p>
                    <p v-if="sensitiveFieldNames" class="mt-1 font-medium">
                      {{ $t('share.detectedFields', { fields: sensitiveFieldNames }) }}
                    </p>
                  </div>
                </div>
              </div>
            </template>

            <!-- Ready -->
            <template v-else-if="state === 'ready'">
              <p class="text-xs text-surface-500 dark:text-surface-400">
                {{ $t('share.description') }}
              </p>

              <!-- Title (optional) -->
              <div class="space-y-1">
                <label class="text-xs font-medium text-surface-600 dark:text-surface-300">
                  {{ $t('share.titleLabel') }}
                </label>
                <input
                  v-model="shareTitle"
                  type="text"
                  :placeholder="$t('share.titlePlaceholder')"
                  class="w-full rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-sm dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <!-- Options -->
              <div class="space-y-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input v-model="includeReadonly" type="checkbox" class="rounded border-surface-300 dark:border-surface-600 text-primary-500 focus:ring-primary-500" />
                  <span class="text-xs text-surface-600 dark:text-surface-300">{{ $t('share.readonly') }}</span>
                </label>
                <label v-if="hasToolSettings" class="flex items-center gap-2 cursor-pointer">
                  <input v-model="includeSettings" type="checkbox" class="rounded border-surface-300 dark:border-surface-600 text-primary-500 focus:ring-primary-500" />
                  <span class="text-xs text-surface-600 dark:text-surface-300">{{ $t('share.includeSettings') }}</span>
                </label>
              </div>

              <!-- Info -->
              <div class="rounded-lg bg-surface-50 dark:bg-surface-800 px-3 py-2 text-[11px] text-surface-400 dark:text-surface-500 space-y-1">
                <p>{{ $t('share.dataLocal') }}</p>
                <p>{{ $t('share.securityNote') }}</p>
              </div>
            </template>

            <!-- Success -->
            <template v-else-if="state === 'success'">
              <div class="flex flex-col items-center gap-3 py-4">
                <div class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Icon name="lucide:check" class="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <p class="text-sm font-medium text-surface-900 dark:text-surface-100">
                  {{ $t('share.copied') }}
                </p>
                <p class="text-xs text-surface-500 dark:text-surface-400 text-center">
                  {{ $t('share.copiedHint') }}
                </p>
              </div>

              <!-- URL length indicator -->
              <UrlLengthIndicator :length="urlLength" />
            </template>

            <!-- Too Large -->
            <template v-else-if="state === 'too-large'">
              <div class="space-y-3">
                <div class="flex items-start gap-2.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2.5 dark:border-orange-800 dark:bg-orange-900/20">
                  <Icon name="lucide:alert-triangle" class="w-4 h-4 shrink-0 mt-0.5 text-orange-600 dark:text-orange-400" />
                  <div class="text-xs text-orange-700 dark:text-orange-300">
                    <p class="font-bold">{{ $t('share.tooLargeTitle') }}</p>
                    <p class="mt-1">{{ $t('share.tooLargeDescription') }}</p>
                  </div>
                </div>
              </div>
            </template>

            <!-- Error -->
            <template v-else-if="state === 'error'">
              <div class="space-y-3">
                <div class="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 dark:border-red-800 dark:bg-red-900/20">
                  <Icon name="lucide:alert-circle" class="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                  <div class="text-xs text-red-700 dark:text-red-300">
                    <p class="font-bold">{{ $t('share.errorTitle') }}</p>
                    <p class="mt-1">{{ errorMessage || $t('share.errorDescription') }}</p>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between px-5 py-3 border-t border-surface-100 dark:border-surface-700">
            <!-- Sensitive Warning Actions -->
            <template v-if="state === 'sensitive-warning'">
              <button
                @click="$emit('close')"
                class="px-4 py-1.5 text-xs font-medium text-surface-600 dark:text-surface-400 hover:text-surface-800 dark:hover:text-surface-200"
              >
                {{ $t('share.review') }}
              </button>
              <button
                @click="$emit('share-anyway')"
                class="btn-primary px-4 py-1.5 text-xs"
              >
                {{ $t('share.shareAnyway') }}
              </button>
            </template>

            <!-- Ready Actions -->
            <template v-else-if="state === 'ready'">
              <button
                @click="$emit('close')"
                class="px-4 py-1.5 text-xs font-medium text-surface-600 dark:text-surface-400 hover:text-surface-800 dark:hover:text-surface-200"
              >
                {{ $t('system.cancel') }}
              </button>
              <button
                @click="$emit('generate')"
                class="btn-primary px-4 py-1.5 text-xs"
              >
                {{ $t('share.copyLink') }}
              </button>
            </template>

            <!-- Success Actions -->
            <template v-else-if="state === 'success'">
              <div class="flex items-center gap-2">
                <button
                  @click="$emit('download')"
                  class="px-3 py-1.5 text-xs text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
                >
                  {{ $t('share.downloadJson') }}
                </button>
                <button
                  v-if="canNativeShare"
                  @click="$emit('native-share')"
                  class="px-3 py-1.5 text-xs text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
                >
                  {{ $t('share.shareViaDevice') }}
                </button>
              </div>
              <div class="flex items-center gap-2">
                <button
                  @click="$emit('copy-again')"
                  class="px-3 py-1.5 text-xs font-medium text-surface-600 dark:text-surface-300 border border-surface-200 dark:border-surface-600 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800"
                >
                  {{ $t('share.copyAgain') }}
                </button>
                <button
                  @click="$emit('open-link')"
                  class="btn-primary px-3 py-1.5 text-xs"
                >
                  {{ $t('share.openLink') }}
                </button>
              </div>
            </template>

            <!-- Too Large Actions -->
            <template v-else-if="state === 'too-large'">
              <button
                @click="$emit('download')"
                class="px-4 py-1.5 text-xs font-medium text-surface-600 dark:text-surface-400 hover:text-surface-800 dark:hover:text-surface-200"
              >
                {{ $t('share.downloadJson') }}
              </button>
              <button
                @click="$emit('download-package')"
                class="btn-primary px-4 py-1.5 text-xs"
              >
                {{ $t('share.downloadPackage') }}
              </button>
            </template>

            <!-- Error Actions -->
            <template v-else-if="state === 'error'">
              <button
                @click="$emit('download')"
                class="px-4 py-1.5 text-xs font-medium text-surface-600 dark:text-surface-400 hover:text-surface-800 dark:hover:text-surface-200"
              >
                {{ $t('share.downloadJson') }}
              </button>
              <button
                @click="$emit('retry')"
                class="btn-primary px-4 py-1.5 text-xs"
              >
                {{ $t('share.retry') }}
              </button>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { ShareModalState } from '~/composables/useShareJson'
import type { SharePayloadV1 } from '~/utils/share'

const props = defineProps<{
  state: ShareModalState
  payload?: SharePayloadV1 | null
  sensitiveFields?: Array<{ path: string; key: string }>
  urlLength?: number
  errorMessage?: string
  canNativeShare?: boolean
}>()

const emit = defineEmits<{
  close: []
  'share-anyway': []
  generate: []
  'copy-again': []
  'open-link': []
  download: []
  'download-package': []
  'native-share': []
  retry: []
}>()

const { t } = useI18n()

const shareTitle = defineModel<string>('title', { default: '' })
const includeReadonly = defineModel<boolean>('readonly', { default: true })
const includeSettings = defineModel<boolean>('settings', { default: true })

const isOpen = computed(() => props.state !== 'idle')

const headerTitle = computed(() => {
  switch (props.state) {
    case 'sensitive-warning': return t('share.riskTitle')
    case 'too-large': return t('share.tooLargeTitle')
    case 'error': return t('share.errorTitle')
    case 'success': return t('share.successTitle')
    default: return t('share.title')
  }
})

const sensitiveFieldNames = computed(() => {
  if (!props.sensitiveFields?.length) return ''
  const names = [...new Set(props.sensitiveFields.map(f => f.key))].slice(0, 3)
  return names.join(', ')
})

const hasToolSettings = computed(() => {
  if (!props.payload?.toolState) return false
  return !!(props.payload.toolState.indentSize || props.payload.toolState.sortKeys)
})

function handleBackdropClick() {
  if (props.state !== 'generating') {
    emit('close')
  }
}
</script>
