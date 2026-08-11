<template>
  <div class="py-12">
    <div class="mx-auto max-w-[800px] px-5">
      <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-100 mb-8">
        About JSON Toolbox
      </h1>

      <div class="prose prose-surface dark:prose-invert max-w-none">
        <p class="text-lg text-surface-600 dark:text-surface-400">
          JSON Toolbox is a free, open-source collection of JSON tools for developers.
          All processing happens directly in your browser — your data never leaves your device.
        </p>

        <h2>Our Mission</h2>
        <p>
          We believe developers should have access to high-quality JSON tools without
          compromising their privacy. Every tool in JSON Toolbox runs entirely in your
          browser using client-side JavaScript — no data is ever uploaded to any server.
        </p>

        <h2>Why JSON Toolbox?</h2>
        <ul>
          <li><strong>100% Client-Side:</strong> All processing happens in your browser. Your JSON data never leaves your device.</li>
          <li><strong>Free Forever:</strong> No sign-up, no limits, no hidden fees.</li>
          <li><strong>Privacy First:</strong> We don't track you, store your data, or show invasive ads.</li>
          <li><strong>Open Source:</strong> Our code is publicly available for transparency and community contributions.</li>
        </ul>

        <h2>Available Tools</h2>
        <p>
          JSON Toolbox includes tools for formatting, validating, converting, comparing,
          and exploring JSON data. Whether you're a developer debugging an API response,
          a data analyst converting JSON to CSV, or a student learning about JSON — we've got you covered.
        </p>

        <h2>Contact</h2>
        <p>
          Have questions, suggestions, or feedback? Feel free to
          <NuxtLinkLocale to="/contact">reach out to us</NuxtLinkLocale>.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

useSeoMeta({
  title: 'About — Free Online JSON Tools',
  description: 'Learn about JSON Toolbox — a free, open-source collection of JSON tools for developers.',
})
</script>
