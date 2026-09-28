<template>
  <div class="relative">
    <!-- decorative glow behind the panel -->
    <div
      class="pointer-events-none absolute -inset-8 -z-10 rounded-[40px] bg-gradient-to-tr from-primary-500/15 via-accent-500/10 to-transparent blur-3xl dark:from-primary-500/20 dark:via-accent-500/10">
    </div>
    <ClientOnly>
      <div class="rounded-3xl [&>svg]:h-auto [&>svg]:w-full" v-html="svgHtml"></div>
      <template #fallback>
        <img :src="svgUrl" alt="JSON data flow" class="h-auto w-full rounded-3xl" />
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import rawSvg from '~/assets/svg/json-hero.svg?raw'
import svgUrl from '~/assets/svg/json-hero.svg'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const colorMode = useColorMode()

const isLight = computed(() => colorMode.value === 'light')

// Keep this list in sync with the @@TOKEN@@ placeholders in
// app/assets/svg/json-hero.svg: a token without an entry here stays visible as
// raw text, and an entry whose token no longer exists is dead weight.
const tokens = computed<Record<string, string>>(() => ({
  '@@WORKSPACE@@': t('home.hero.svg.workspace'),
  '@@LOCAL@@': t('home.hero.svg.local'),
  '@@RAW_JSON@@': t('home.hero.svg.raw_json'),
  '@@LARGE_FILE@@': t('home.hero.svg.large_file'),
  '@@LARGE_JSON_LABEL@@': t('home.hero.svg.large_json_label'),
  '@@PARSE@@': t('home.hero.svg.parse'),
  '@@READY@@': t('home.hero.svg.ready'),
  '@@RICH_PREVIEW@@': t('home.hero.svg.rich_preview'),
  '@@IMAGE_COLOR_MEDIA@@': t('home.hero.svg.image_color_media'),
  '@@RICH_TREE@@': t('home.hero.svg.rich_tree'),
  '@@EXPLORE@@': t('home.hero.svg.explore'),
  '@@TABLE_VIEW@@': t('home.hero.svg.table_view'),
  '@@VIEW@@': t('home.hero.svg.view'),
  '@@CONVERT@@': t('home.hero.svg.convert'),
  '@@FORMATS_26@@': t('home.hero.svg.formats_26'),
  '@@RUNS_IN_BROWSER@@': t('home.hero.svg.runs_in_browser'),
  '@@NO_UPLOAD@@': t('home.hero.svg.no_upload'),
}))

const svgHtml = computed(() => {
  let html = rawSvg.replace(
    'class="json-data-flow-svg"',
    `class="json-data-flow-svg${isLight.value ? ' is-light' : ''}"`
  )
  for (const [token, text] of Object.entries(tokens.value)) {
    html = html.split(token).join(text)
  }
  return html
})
</script>
