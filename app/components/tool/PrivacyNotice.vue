<template>
  <div class="flex items-center gap-1.5 text-xs text-surface-400 dark:text-surface-500">
    <Icon name="lucide:shield-check" class="w-3.5 h-3.5 text-green-500 shrink-0" />
    <span>{{ $t('privacy_notice.label') }}</span>

    <!-- How to verify popover -->
    <div class="relative" ref="popoverRef">
      <button
        @click="showVerify = !showVerify"
        class="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 underline underline-offset-2 whitespace-nowrap"
      >
        {{ $t('privacy_notice.how_to_verify') }}
      </button>

      <Transition name="popover">
        <div
          v-if="showVerify"
          class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 rounded-xl border border-surface-200 bg-white p-4 shadow-lg dark:border-surface-700 dark:bg-surface-800 z-50"
        >
          <!-- Arrow -->
          <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-3 h-3 rotate-45 border-r border-b border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800" />

          <p class="text-xs font-bold text-surface-700 dark:text-surface-200 mb-3">
            {{ $t('privacy_notice.verify_title') }}
          </p>

          <ol class="space-y-2 text-xs text-surface-600 dark:text-surface-400">
            <li class="flex items-start gap-2">
              <span class="flex-none flex h-5 w-5 items-center justify-center rounded-full bg-primary-50 text-primary-600 text-[10px] font-bold dark:bg-primary-900/30 dark:text-primary-400">1</span>
              <span>{{ $t('privacy_notice.verify_step1') }}</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="flex-none flex h-5 w-5 items-center justify-center rounded-full bg-primary-50 text-primary-600 text-[10px] font-bold dark:bg-primary-900/30 dark:text-primary-400">2</span>
              <span>{{ $t('privacy_notice.verify_step2') }}</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="flex-none flex h-5 w-5 items-center justify-center rounded-full bg-primary-50 text-primary-600 text-[10px] font-bold dark:bg-primary-900/30 dark:text-primary-400">3</span>
              <span>{{ $t('privacy_notice.verify_step3') }}</span>
            </li>
          </ol>

          <NuxtLinkLocale
            to="/privacy"
            @click="showVerify = false"
            class="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            {{ $t('privacy_notice.full_details') }}
            <Icon name="lucide:arrow-right" class="w-3 h-3" />
          </NuxtLinkLocale>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
const showVerify = ref(false)
const popoverRef = ref<HTMLElement>()

// Click outside to close
onClickOutside(popoverRef, () => {
  showVerify.value = false
})
</script>
