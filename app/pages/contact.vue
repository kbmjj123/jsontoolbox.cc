<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const colorMode = useColorMode()
const isDark = computed(() => colorMode.preference === 'dark')

useSeoMeta({
  title: () => t('contact.title'),
  description: () => 'Get in touch with the JSON Toolbox team. Send us your feedback, questions, or suggestions.',
  keywords: () => 'contact, feedback, support, JSON tools',
  ogTitle: () => `${t('contact.title')} | JSON Toolbox`,
  ogDescription: () => 'Get in touch with the JSON Toolbox team. Send us your feedback, questions, or suggestions.',
  robots: 'index, follow',
})
</script>

<template>
  <main class="min-h-screen bg-gradient-to-b from-background to-muted/20">
    <div class="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <!-- Breadcrumb -->
      <nav class="mb-8" aria-label="Breadcrumb">
        <ol class="flex items-center gap-2 text-sm text-muted-foreground">
          <li>
            <NuxtLink
              :to="localePath('/')"
              class="hover:text-primary transition-colors"
            >
              {{ t('app.nav.home') }}
            </NuxtLink>
          </li>
          <li>/</li>
          <li class="text-foreground font-medium">
            {{ t('app.nav.contact') }}
          </li>
        </ol>
      </nav>

      <!-- Header -->
      <header class="mb-12 text-center">
        <h1
          class="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          :class="isDark ? 'text-white' : 'text-gray-900'"
        >
          {{ t('contact.title') }}
        </h1>
        <p class="text-lg text-muted-foreground">
          {{ $t('blog.question_or_feedback') }}
          <NuxtLink
            :to="localePath('/privacy')"
            class="text-primary underline-offset-4 hover:underline"
          >
            {{ $t('home.privacy.link_text') }}
          </NuxtLink>.
        </p>
      </header>

      <!-- Contact Form -->
      <ContactForm form-key="e93ea445-9502-434c-843b-10dece369918" />
    </div>
  </main>
</template>
