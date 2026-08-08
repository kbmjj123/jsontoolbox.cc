<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps({
  error: Object as () => NuxtError
})

const localePath = useLocalePath()

const handleError = () => clearError({ redirect: localePath('/') })

// SEO: 防止 Google 收录错误页面
useSeoMeta({
  title: `Error ${props.error?.statusCode || '404'}`,
  robots: 'noindex, nofollow',
  description: 'An error occurred while accessing this page.'
})

onMounted(() => {
  console.error('异常信息：', props.error?.stack)
});
</script>

<template>
  <NuxtLayout>
    <div class="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-6 py-12 sm:py-24 lg:px-8">
      <div class="absolute top-1/2 left-1/2 -z-10 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-100/40 blur-[100px] dark:bg-primary-900/20 pointer-events-none"></div>

      <div class="text-center w-full max-w-2xl">
        <div class="mx-auto mb-8 flex justify-center">
          <div class="text-9xl font-black text-surface-200 dark:text-surface-800">
            {{ props.error?.statusCode || 404 }}
          </div>
        </div>

        <h1 class="mt-2 text-3xl font-bold tracking-tight text-surface-900 dark:text-surface-50 sm:text-4xl">
          {{
            props.error?.statusCode === 404
              ? $t('error.not_found.title')
              : $t('error.generic.title')
          }}
        </h1>

        <p class="mx-auto mt-4 max-w-lg text-base leading-relaxed text-surface-600 dark:text-surface-400">
          {{
            props.error?.statusCode === 404
              ? $t('error.not_found.desc')
              : $t('error.generic.desc')
          }}
        </p>

        <div class="mt-10 flex items-center justify-center gap-x-6">
          <button
            @click="handleError"
            class="group flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-600/20 transition-all hover:-translate-y-0.5 hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            <Icon name="lucide:arrow-left" class="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            {{ $t('system.backToHome') }}
          </button>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
