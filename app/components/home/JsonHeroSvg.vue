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

const tokens = computed<Record<string, string>>(() => ({
  '@@PIPELINE@@': t('home.hero.svg.pipeline'),
  '@@LOCAL@@': t('home.hero.svg.local'),
  '@@RAW_JSON@@': t('home.hero.svg.raw_json'),
  '@@INPUT@@': t('home.hero.svg.input'),
  '@@FORMAT@@': t('home.hero.svg.format'),
  '@@READABLE@@': t('home.hero.svg.readable'),
  '@@EXPLORE@@': t('home.hero.svg.explore'),
  '@@TREE@@': t('home.hero.svg.tree'),
  '@@TABLE@@': t('home.hero.svg.table'),
  '@@VIEW@@': t('home.hero.svg.view'),
  '@@CONVERT@@': t('home.hero.svg.convert'),
  '@@CSV@@': t('home.hero.svg.csv'),
  '@@PARSE@@': t('home.hero.svg.parse'),
  '@@READY@@': t('home.hero.svg.ready'),
  '@@NO_UPLOAD@@': t('home.hero.svg.no_upload'),
  '@@PROCESSED_LOCALLY@@': t('home.hero.svg.processed_locally'),
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
