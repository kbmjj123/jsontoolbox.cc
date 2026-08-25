<template>
  <div class="rounded-2xl transition-all">

    <div v-if="success"
      class="flex flex-col items-center justify-center py-12 text-center animate-[scaleIn_0.3s_ease-out]">
      <div
        class="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
        <Icon name="lucide:check-circle-2" class="h-10 w-10" />
      </div>
      <h2 class="mb-2 text-2xl font-bold text-surface-900 dark:text-surface-0">
        {{ $t('contact.form.success_title') }}
      </h2>
      <p class="text-surface-600 dark:text-surface-400">
        {{ $t('contact.form.success_desc') }}
      </p>
      <button @click="resetForm"
        class="mt-8 rounded-lg border border-surface-300 px-6 py-2 text-sm font-bold bg-primary-600 text-white hover:bg-surface-50 hover:text-primary-600 transition-colors dark:border-surface-700 dark:hover:bg-surface-800">
        {{ $t('contact.form.send_another') }}
      </button>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      
      <input type="hidden" name="access_key" :value="accessKey">
      <input type="checkbox" name="botcheck" class="hidden" style="display: none;">

      <div class="flex flex-col gap-2">
        <label class="text-sm font-bold text-surface-700 dark:text-surface-300">
          {{ $t('contact.form.email') }} <span class="text-red-500">*</span>
        </label>
        <input v-model="form.email" required type="email" name="email"
          class="rounded-xl border border-surface-300 bg-surface-50 px-4 py-3 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-700 dark:bg-surface-800 text-surface-900 dark:text-surface-0 transition-all" />
      </div>

      <div class="flex flex-col gap-3">
        <label class="text-sm font-bold text-surface-700 dark:text-surface-300">
          {{ $t('contact.form.subject') }}
        </label>

        <input type="hidden" name="subject" :value="form.subject">

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div v-for="option in subjectOptions" :key="option" @click="form.subject = option"
            class="cursor-pointer rounded-xl border px-4 py-3 text-sm font-bold transition-all duration-200"
            :class="form.subject === option
              ? 'border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-500 dark:bg-primary-900/20 dark:text-primary-400'
              : 'border-surface-300 bg-surface-50 text-surface-600 hover:border-surface-400 hover:bg-surface-100 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400'">
            <div class="flex items-center gap-2">
              <div class="flex h-4 w-4 items-center justify-center rounded-full border"
                :class="form.subject === option ? 'border-primary-600 bg-primary-600' : 'border-surface-400'">
                <div v-if="form.subject === option" class="h-1.5 w-1.5 rounded-full bg-white"></div>
              </div>
              <span>{{ $t(`contact.form.subjects.${option}`, option) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-sm font-bold text-surface-700 dark:text-surface-300">
          {{ $t('contact.form.message') }} <span class="text-red-500">*</span>
        </label>
        <textarea v-model="form.message" required name="message" rows="5"
          class="resize-none rounded-xl border border-surface-300 bg-surface-50 px-4 py-3 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-0 transition-all"></textarea>
      </div>

      <button type="submit" :disabled="isSubmitting"
        class="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-4 text-base font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-primary-600/30 disabled:opacity-70 disabled:cursor-wait dark:hover:shadow-[0_0_20px_rgba(0,82,212,0.4)]">
        <Icon v-if="isSubmitting" name="lucide:loader-2" class="h-5 w-5 animate-spin" />
        <span v-else>{{ $t('contact.form.submit') }}</span>
      </button>

      <p v-if="error" class="text-center text-sm font-bold text-red-500 bg-red-50 dark:bg-red-900/20 py-2 rounded-lg">
        {{ error }}
      </p>

    </form>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const route = useRoute()
const { t } = useI18n()
const accessKey = config.public.formKey

// 定义可选的主题 (建议在 i18n 文件里加上对应的翻译)
const subjectOptions = ['general', 'bug', 'feature', 'business']

const form = reactive({
  email: '',
  subject: 'general', // 默认选中第一个
  message: ''
})

const isSubmitting = ref(false)
const success = ref(false)
const error = ref<string | null>(null)

/**
 * 收集浏览器和系统信息，便于问题定位
 */
const getBrowserInfo = (): string => {
  const ua = navigator.userAgent
  const screen = window.screen
  const languages = navigator.languages?.join(', ') || navigator.language || 'unknown'

  // 解析浏览器信息
  let browser = 'Unknown'
  let browserVersion = ''
  let os = 'Unknown'

  // 检测浏览器
  if (ua.includes('Firefox/')) {
    browser = 'Firefox'
    browserVersion = ua.split('Firefox/')[1]?.split(' ')[0] || ''
  } else if (ua.includes('Edg/')) {
    browser = 'Edge'
    browserVersion = ua.split('Edg/')[1]?.split(' ')[0] || ''
  } else if (ua.includes('Chrome/') && !ua.includes('Chromium')) {
    browser = 'Chrome'
    browserVersion = ua.split('Chrome/')[1]?.split(' ')[0] || ''
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    browser = 'Safari'
    browserVersion = ua.split('Version/')[1]?.split(' ')[0] || ''
  }

  // 检测操作系统
  if (ua.includes('Windows')) {
    os = 'Windows'
  } else if (ua.includes('Mac OS')) {
    os = 'macOS'
  } else if (ua.includes('Linux')) {
    os = 'Linux'
  } else if (ua.includes('Android')) {
    os = 'Android'
  } else if (ua.includes('iPhone') || ua.includes('iPad')) {
    os = 'iOS'
  }

  return [
    `Browser: ${browser} ${browserVersion}`.trim(),
    `OS: ${os}`,
    `Screen: ${screen.width}×${screen.height}`,
    `Language: ${languages}`,
    `User Agent: ${ua}`
  ].join('\n')
}

const handleSubmit = async (e: Event) => {
  isSubmitting.value = true
  error.value = null

  try {
    // 使用 Web3Forms 的 API
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        access_key: accessKey,
        ...form,
        from_url: window.location.href, // 记录来源页面
        browser_info: getBrowserInfo() // 添加浏览器信息
      })
    })

    const result = await response.json()

    if (result.success) {
      success.value = true
      // 清空表单但不清空主题
      form.message = ''
      form.email = ''
    } else {
      error.value = result.message || t('contact.form.error_submit')
    }
  } catch (err) {
    error.value = t('contact.form.error_network')
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  success.value = false
}
onMounted(() => {
	// 1. 如果 URL 里有 ?subject=bug，自动选中 Bug
  if (route.query.subject && typeof route.query.subject === 'string') {
    // 确保参数在你的选项列表中
    if (subjectOptions.includes(route.query.subject)) {
      form.subject = route.query.subject
    }
  }

  // 2. (可选) 自动在 Message 里预填来源
  if (route.query.source) {
    form.message = `[From tool: ${route.query.source}]\n\n`
  }
})
</script>