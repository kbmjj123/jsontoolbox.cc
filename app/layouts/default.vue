<script setup lang="ts">

</script>

<template>
	<div class="min-h-screen flex flex-col bg-surface-50 dark:bg-surface-950 transition-colors duration-300">
		<div class="fixed inset-0 z-0 pointer-events-none">
      <div class="absolute inset-0 bg-surface-50 dark:bg-surface-950 transition-colors duration-300"></div>
      <div class="absolute inset-0
        bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)]
        dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)]
        bg-[size:24px_24px]">
      </div>
      <div class="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary-500 opacity-20 blur-[100px] dark:opacity-30"></div>
    </div>
		<div class="relative z-10 flex flex-col min-h-screen">
			<Header />
			<section class="flex flex-col flex-1">
				<Breadcrumb />
				<slot></slot>
			</section>
			<Footer />
		</div>
	</div>
</template>
