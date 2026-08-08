<template>
  <div class="py-12">
    <div class="mx-auto max-w-[800px] px-5">
      <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-100 mb-8">
        Privacy Policy
      </h1>

      <div class="prose prose-surface dark:prose-invert max-w-none">
        <p class="text-lg text-surface-600 dark:text-surface-400">
          <strong>Last updated:</strong> {{ new Date().toLocaleDateString() }}
        </p>

        <h2>Data Processing</h2>
        <p>
          All JSON processing in JSON Toolbox happens entirely in your browser.
          Your data is never uploaded to any server, stored remotely, or transmitted
          over the network. We have no access to any data you process using our tools.
        </p>

        <h2>Analytics</h2>
        <p>
          We use privacy-focused analytics to understand how our tools are used.
          This data is anonymized and does not include any personal information
          or the content of your JSON data.
        </p>

        <h2>Cookies</h2>
        <p>
          We use minimal cookies for functionality purposes only, such as
          remembering your theme preference (light/dark mode) and language settings.
        </p>

        <h2>Third-Party Services</h2>
        <p>
          We do not share any data with third-party services. Our tools are
          designed to work entirely within your browser.
        </p>

        <h2>Contact</h2>
        <p>
          If you have questions about this privacy policy, please contact us
          at <a href="mailto:hello@jsontoolbox.cc">hello@jsontoolbox.cc</a>.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

useSeoMeta({
  title: `Privacy Policy | ${t('app.name')}`,
  description: 'JSON Toolbox privacy policy — your data never leaves your browser.',
})
</script>
