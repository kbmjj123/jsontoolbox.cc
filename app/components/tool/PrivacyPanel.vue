<template>
  <div class="mx-auto max-w-xl">
    <!-- Toggle button -->
    <button
      @click="expanded = !expanded"
      class="flex items-center gap-1.5 text-xs text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300 transition-colors mx-auto"
    >
      <Icon name="lucide:lock" class="w-3.5 h-3.5" />
      <span>{{ $t('privacy_notice.panel_title') }}</span>
      <Icon
        :name="expanded ? 'lucide:chevron-up' : 'lucide:chevron-down'"
        class="w-3.5 h-3.5 transition-transform"
      />
    </button>

    <!-- Expandable panel -->
    <Transition name="panel">
      <div
        v-if="expanded"
        class="mt-3 rounded-xl border border-surface-200 bg-white p-5 dark:border-surface-700 dark:bg-surface-800"
      >
        <ul class="space-y-2.5 text-sm text-surface-600 dark:text-surface-400">
          <li class="flex items-start gap-2">
            <Icon name="lucide:check-circle-2" class="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
            <span>{{ $t('privacy_notice.panel_client_side') }}</span>
          </li>
          <li class="flex items-start gap-2">
            <Icon name="lucide:check-circle-2" class="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
            <span>{{ $t('privacy_notice.panel_no_server') }}</span>
          </li>
          <li class="flex items-start gap-2">
            <Icon name="lucide:info" class="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <span>{{ $t('privacy_notice.panel_third_party') }}</span>
          </li>
          <li class="flex items-start gap-2">
            <Icon name="lucide:github" class="w-4 h-4 text-surface-500 shrink-0 mt-0.5" />
            <span>{{ $t('privacy_notice.panel_open_source') }}</span>
          </li>
        </ul>

        <div class="mt-4 flex items-center gap-4 pt-3 border-t border-surface-100 dark:border-surface-700">
          <!-- How to verify (reuse PrivacyNotice's popover link style) -->
          <NuxtLinkLocale
            to="/privacy"
            class="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            {{ $t('privacy_notice.full_details') }}
            <Icon name="lucide:arrow-right" class="w-3 h-3" />
          </NuxtLinkLocale>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const expanded = ref(false)
</script>
