<template>
  <div class="py-12">
    <div class="mx-auto max-w-[800px] px-5">
      <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-100 mb-8">
        Terms of Service
      </h1>

      <div class="prose prose-surface dark:prose-invert max-w-none">
        <p class="text-lg text-surface-600 dark:text-surface-400">
          <strong>Last updated:</strong> {{ new Date().toLocaleDateString() }}
        </p>

        <h2>Acceptance of Terms</h2>
        <p>
          By using JSON Toolbox, you agree to these Terms of Service.
          If you do not agree, please do not use our tools.
        </p>

        <h2>Use of Service</h2>
        <p>
          JSON Toolbox provides free, client-side JSON processing tools.
          You may use these tools for any lawful purpose. All processing
          happens in your browser — we do not store or process your data.
        </p>

        <h2>Disclaimer</h2>
        <p>
          JSON Toolbox is provided "as is" without warranties of any kind.
          We are not responsible for any data loss or damages resulting
          from the use of our tools.
        </p>

        <h2>Changes to Terms</h2>
        <p>
          We reserve the right to modify these terms at any time.
          Continued use of JSON Toolbox after changes constitutes
          acceptance of the new terms.
        </p>

        <h2>Contact</h2>
        <p>
          If you have questions about these terms, please contact us
          at <a href="mailto:hello@jsontoolbox.cc">hello@jsontoolbox.cc</a>.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

useSeoMeta({
  title: `Terms of Service | ${t('app.name')}`,
  description: 'JSON Toolbox terms of service.',
})
</script>
