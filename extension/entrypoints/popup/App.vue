<script setup lang="ts">
import PopupHeader from '../../components/PopupHeader.vue'
import ConfigSection from '../../components/ConfigSection.vue'
import PopularTools from '../../components/PopularTools.vue'
import PrivacyFooter from '../../components/PrivacyFooter.vue'
import { useExtensionOptions } from '../../composables/useExtensionOptions'

// Module singleton: importing it applies the stored theme + i18n locale on mount.
useExtensionOptions()
</script>

<template>
  <!-- Config on top, then traffic links back to the site. No tools live here. -->
  <div class="scrollbar-hide flex max-h-[580px] w-[400px] flex-col gap-2.5 overflow-y-auto bg-surface-50 p-3 dark:bg-surface-950">
    <PopupHeader />
    <ConfigSection />
    <PopularTools />
    <PrivacyFooter />
  </div>
</template>
