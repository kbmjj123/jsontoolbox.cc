export default defineAppConfig({
	// 社会化分享配置
	socialList: [
		{
			title: 'twitter',
			icon: 'lucide:twitter',
			link: 'https://x.com/jsontoolbox'
		},
		{
			title: 'github',
			icon: 'lucide:github',
			link: 'https://github.com/kbmjj123/jsontoolbox.cc'
		}
	],
	// 可配置的分享至三方平台
	availableSocialNetworks: [
		'facebook',
		'twitter',
		'weibo'
	],
	icon: {
		mode: 'css',
		cssLayer: 'base'
	}
})
