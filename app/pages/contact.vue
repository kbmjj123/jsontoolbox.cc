<template>
  <div class="py-12">
    <div class="mx-auto max-w-[800px] px-5">
      <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-100 mb-8">
        Contact Us
      </h1>

      <div class="prose prose-surface dark:prose-invert max-w-none">
        <p class="text-lg text-surface-600 dark:text-surface-400">
          Have questions, suggestions, or feedback? We'd love to hear from you.
        </p>

        <h2>Get in Touch</h2>
        <p>
          You can reach us through the following channels:
        </p>

        <ul>
          <li><strong>GitHub:</strong> <a href="https://github.com/kbmjj123/jsontoolbox.cc" target="_blank">github.com/kbmjj123/jsontoolbox.cc</a></li>
          <li><strong>Twitter:</strong> <a href="https://twitter.com/solomaker282" target="_blank">@jsontoolbox</a></li>
          <li><strong>Email:</strong> <a href="mailto:hello@jsontoolbox.cc">hello@jsontoolbox.cc</a></li>
        </ul>

        <h2>Report Issues</h2>
        <p>
          Found a bug or have a feature request? Please open an issue on our
          <a href="https://github.com/kbmjj123/jsontoolbox.cc/issues" target="_blank">GitHub Issues</a> page.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

useSeoMeta({
  title: 'Contact — Get Support',
  description: 'Get in touch with JSON Toolbox team.',
})
</script>
