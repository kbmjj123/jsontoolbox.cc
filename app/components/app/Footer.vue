<template>
	<footer
		class="border-t border-surface-200/50 bg-surface-50/80 pt-16 pb-8 backdrop-blur-xl dark:border-surface-700/50 dark:bg-surface-900/80">
		<div class="max-w-[1400px] mx-auto px-6">

			<div class="flex flex-col lg:flex-row gap-12 mb-16">

				<div class="lg:w-1/4 flex-shrink-0">
					<NuxtLinkLocale to="/" :title="$t('app.name')" class="flex items-center gap-2 mb-6 group w-fit">
						<img
							src="/favicon.svg"
							alt="JSON Toolbox Logo"
							class="h-8 w-8"
						/>
						<span class="text-2xl font-black tracking-tight text-surface-900 dark:text-surface-100">
							<span class="text-primary-600 dark:text-primary-400">JSON</span>Toolbox
						</span>
					</NuxtLinkLocale>

					<p class="text-sm text-surface-500 leading-relaxed mb-6 dark:text-surface-400">
						{{ $t('app.description') || 'Free, client-side JSON tools for developers. Format, validate, convert — all in your browser.' }}
					</p>

					<div class="mb-4 flex items-center gap-2 text-xs font-bold text-surface-500 dark:text-surface-400">
						<span class="relative flex h-2 w-2">
							<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-75"></span>
							<span class="relative inline-flex h-2 w-2 rounded-full bg-accent-500"></span>
						</span>
						<span>All Systems Operational</span>
					</div>

					<div class="mb-8 flex items-center gap-2 text-xs text-surface-400 dark:text-surface-500">
						<p>&copy; {{ new Date().getFullYear() }} {{ $t('app.footer.copyright') }}</p>
						<span class="text-surface-300 dark:text-surface-700">|</span>
						<span>100% Client-Side</span>
					</div>

					<div class="flex gap-3">
						<a href="https://github.com/kbmjj123/jsontoolbox.cc" title="github" target="_blank"
							class="flex h-11 w-11 items-center justify-center rounded-xl border border-surface-200 bg-white/50 text-surface-500 transition-all hover:border-primary-200 hover:bg-white hover:text-primary-600 hover:shadow-sm dark:border-surface-700/50 dark:bg-surface-900 dark:text-surface-400 dark:hover:border-surface-600 dark:hover:text-surface-100">
							<Icon name="lucide:github" class="w-5 h-5" />
						</a>
						<a href="https://twitter.com/jsontoolbox" title="twitter"
							class="flex h-11 w-11 items-center justify-center rounded-xl border border-surface-200 bg-white/50 text-surface-500 transition-all hover:border-primary-200 hover:bg-white hover:text-primary-600 hover:shadow-sm dark:border-surface-700/50 dark:bg-surface-900 dark:text-surface-400 dark:hover:border-surface-600 dark:hover:text-surface-100">
							<Icon name="lucide:twitter" class="w-5 h-5" />
						</a>
					</div>
				</div>

				<div class="flex-1">
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-10">

						<div v-for="cat in categoriesWithSub" :key="cat.id">
							<strong
								class="mb-5 text-xs font-bold uppercase tracking-widest text-surface-900 dark:text-surface-100 flex items-center gap-2">
								<NuxtLinkLocale :title="cat.pdesc" :to="'/tools/'+cat.type">{{ cat.h2 }}</NuxtLinkLocale>
							</strong>

							<ul class="space-y-3">
								<li v-for="tool in cat.tools.slice(0, 5).sort((a: ProcessedTool, b: ProcessedTool) => a.sort - b.sort)" :key="tool.path">
									<NuxtLinkLocale :title="tool.name" :to="tool.path"
										class="text-sm font-medium text-surface-500 hover:text-primary-600 hover:translate-x-1 transition-all inline-block dark:text-surface-400 dark:hover:text-primary-400">
										{{ tool.name }}
									</NuxtLinkLocale>
								</li>

								<li v-if="cat.tools.length > 5">
									<NuxtLinkLocale :title="`${$t('app.footer.view_all')}${cat.h2}`" :to="`/tools/${cat.type}`"
										class="text-xs font-bold text-primary-600 flex items-center gap-1 hover:underline mt-2 dark:text-primary-400">
										{{ $t('app.footer.view_all') }}
										<Icon name="lucide:arrow-right" class="w-3 h-3" />
									</NuxtLinkLocale>
								</li>
							</ul>
						</div>

					<!-- Support links -->
					<div>
						<strong
							class="mb-5 text-xs font-bold uppercase tracking-widest text-surface-900 dark:text-surface-100">
							{{ $t('app.footer.support_title') || 'Support' }}
						</strong>
						<ul class="space-y-3">
							<li>
								<NuxtLinkLocale to="/about"
									class="text-sm font-medium text-surface-500 hover:text-primary-600 hover:translate-x-1 transition-all inline-block dark:text-surface-400 dark:hover:text-primary-400">
									{{ $t('app.footer.support.about_us') }}
								</NuxtLinkLocale>
							</li>
							<li>
								<NuxtLinkLocale to="/contact"
									class="text-sm font-medium text-surface-500 hover:text-primary-600 hover:translate-x-1 transition-all inline-block dark:text-surface-400 dark:hover:text-primary-400">
									{{ $t('app.footer.support.contact') }}
								</NuxtLinkLocale>
							</li>
							<li>
								<NuxtLinkLocale to="/privacy"
									class="text-sm font-medium text-surface-500 hover:text-primary-600 hover:translate-x-1 transition-all inline-block dark:text-surface-400 dark:hover:text-primary-400">
									{{ $t('app.footer.support.privacy') }}
								</NuxtLinkLocale>
							</li>
							<li>
								<NuxtLinkLocale to="/terms-of-service"
									class="text-sm font-medium text-surface-500 hover:text-primary-600 hover:translate-x-1 transition-all inline-block dark:text-surface-400 dark:hover:text-primary-400">
									{{ $t('app.footer.support.terms') }}
								</NuxtLinkLocale>
							</li>
						</ul>
					</div>

					</div>
				</div>

			</div>

		</div>
	</footer>
</template>

<script setup lang="ts">
const { allCategories, subTools } = useTools()

// 将 sub 工具合并到对应分类的工具列表中
const categoriesWithSub = computed(() => {
  return allCategories.value.map(cat => {
    const subInCat = subTools.value.filter(t => t.category === cat.type)
    if (subInCat.length === 0) return cat
    return {
      ...cat,
      tools: [...cat.tools, ...subInCat].sort((a: any, b: any) => a.sort - b.sort),
    }
  })
})
</script>
