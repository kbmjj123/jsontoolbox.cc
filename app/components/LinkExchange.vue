<template>
	<div v-if="links.length" class="group w-full min-w-0 pt-3.5 mt-3.5">
		<div class="flex items-center gap-2.5">
			<!-- Label -->
			<!-- <span
				class="shrink-0 text-[10px] font-body uppercase tracking-[0.08em] text-[var(--color-text-muted)] whitespace-nowrap">
				🔗 Friend Links
			</span> -->

			<!-- Marquee container -->
			<div class="flex-1 min-w-0 overflow-hidden"
				style="mask-image: linear-gradient(90deg, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%)">
				<div class="flex items-center gap-2 w-fit animate-link-scroll group-hover:[animation-play-state:paused]">
					<template v-for="(link, i) in loopedLinks" :key="`${i}-${link.name}`">
						<span v-if="i > 0" class="shrink-0 text-[10px] text-[var(--color-text-muted)] opacity-40">·</span>

						<!-- Image badge -->
						<a v-if="link.type === 'image'" :href="link.url" target="_blank" rel="noopener noreferrer"
							class="shrink-0 flex items-center leading-none opacity-70 hover:opacity-100 transition-opacity duration-150">
							<img :src="link.imageUrl" :width="link.imageWidth ?? 200" :height="link.imageHeight ?? 40"
								:alt="link.alt ?? link.name" loading="lazy" class="h-7 w-auto" v-bind="link.externalKV" />
						</a>

						<!-- Text link -->
						<a v-else :href="link.url" target="_blank" rel="noopener noreferrer"
							class="shrink-0 text-[11px] font-body text-[var(--color-text-muted)] hover:text-[var(--color-text-link)] no-underline whitespace-nowrap transition-colors duration-150">{{
								link.name }}</a>
					</template>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import linksData from '~/assets/config/exchange-links.json'

export interface ExchangeLink {
	name: string
	url: string
	type: 'text' | 'image'
	imageUrl?: string
	imageWidth?: number
	imageHeight?: number
	alt?: string
	externalKV?: Record<string, string>
}

const links = linksData as ExchangeLink[]
// Duplicate links twice for seamless infinite scroll — the CSS translateX(-50%) needs two copies
const loopedLinks = computed(() => [...links, ...links])
</script>