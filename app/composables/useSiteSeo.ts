export const useSiteSeo = () => {
	const config = useRuntimeConfig()
	const { locale } = useI18n()

	const {
		umamiAnalyticsId,
		siteVerification,
	} = config.public

	// 搜索引擎站点验证 (Meta Tags)
	const verificationMeta = computed(() => {
		const meta: { name: string; content: string }[] = []

		if (siteVerification?.google) {
			meta.push({ name: 'google-site-verification', content: siteVerification.google })
		}
		if (siteVerification?.bing) {
			meta.push({ name: 'msvalidate.01', content: siteVerification.bing })
		}
		if (siteVerification?.baidu) {
			meta.push({ name: 'baidu-site-verification', content: siteVerification.baidu })
		}
		if (siteVerification?.yandex) {
			meta.push({ name: 'yandex-verification', content: siteVerification.yandex })
		}

		return meta
	})

	type ScriptEntry = {
		src?: string
		defer?: boolean
		async?: boolean
		crossorigin?: '' | 'anonymous' | 'use-credentials'
		innerHTML?: string
		'data-website-id'?: string
		'data-host-url'?: string
	}

	const customScripts = computed(() => {
		const scripts: ScriptEntry[] = []

		if (umamiAnalyticsId) {
			scripts.push({
				src: `https://cdn.jsontoolbox.cc/script/script.js`,
				defer: true,
				'data-website-id': umamiAnalyticsId,
				'data-host-url': 'https://umami.jsontoolbox.cc'
			})
		}

		return scripts
	})

	return {
		verificationMeta,
		customScripts,
	}
}
