<template>
	<div class="trustpilot-container">
		<div ref="trustBox" data-locale="en-US" data-template-id="56278e9abfbbba0bdcd568bc"
			data-businessunit-id="696ee80a82d359c458821622" data-style-height="52px" data-style-width="100%"
			data-token="ec6f697b-a225-4ebf-aa29-988130ae4e46" data-theme="light">

			<a href="https://www.trustpilot.com/review/bulkpictools.com" target="_blank" rel="noopener" class="group flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all active:scale-95
        bg-surface-100 text-surface-700 hover:bg-amber-50 hover:text-amber-700 
        dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-amber-900/20 dark:hover:text-amber-400">
				<Icon name="lucide:message-square-warning" class="h-4 w-4 transition-transform group-hover:scale-110" />
				Trustpilot
			</a>
		</div>
	</div>
</template>

<script setup lang="ts">
const trustBox = ref<HTMLElement | null>(null);

useHead({
	script: [
		{
			src: '//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js',
			async: true,
			type: 'text/javascript'
		}
	]
})

onMounted(() => {
	//@ts-ignore
	if (window.Trustpilot) {
		//@ts-ignore
		window.Trustpilot.loadFromElement(trustBox.value);
	}
})
</script>