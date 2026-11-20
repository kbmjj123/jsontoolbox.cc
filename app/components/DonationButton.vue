<script setup lang="ts">
const donationUrl = 'https://ko-fi.com/kbmjj123'

const { locale } = useI18n()

defineProps({
  text: {
    type: String,
    default: 'Buy me a coffee'
  },
  minimal: {
    type: Boolean,
    default: false
  }
})

// 中文直接展示收款码；其他语言直接跳转捐款页，不需要中间弹窗再点一次
const isChinese = computed(() => locale.value.startsWith('zh'))
const showQrModal = ref(false)

const baseClass = 'group inline-flex items-center justify-center gap-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 dark:ring-offset-surface-950'

const qrImages = reactive({
  wechat: { error: false },
  alipay: { error: false }
})

function onImgError(type: 'wechat' | 'alipay') {
  qrImages[type].error = true
}
</script>

<template>
  <!-- 中文：点击一次即显示微信 / 支付宝收款码 -->
  <button
    v-if="isChinese"
    type="button"
    :aria-label="minimal ? text : undefined"
    :class="[
      baseClass,
      minimal
        ? 'h-10 w-10 bg-yellow-400 hover:bg-yellow-300'
        : 'bg-[#FFDD00] px-5 py-2.5 font-semibold text-slate-900 hover:bg-[#FFEA00] shadow-sm hover:shadow-md'
    ]"
    @click="showQrModal = true"
  >
    <Icon
      name="lucide:coffee"
      class="h-5 w-5 text-slate-900 transition-transform duration-300 group-hover:-rotate-12"
    />
    <span v-if="!minimal" class="font-['Cookie'] font-medium tracking-wide">
      {{ text }}
    </span>
  </button>

  <!-- 其他语言：直接打开捐款页 -->
  <a
    v-else
    :href="donationUrl"
    target="_blank"
    rel="noopener noreferrer"
    :aria-label="minimal ? text : undefined"
    :class="[
      baseClass,
      minimal
        ? 'h-10 w-10 bg-yellow-400 hover:bg-yellow-300'
        : 'bg-[#FFDD00] px-5 py-2.5 font-semibold text-slate-900 hover:bg-[#FFEA00] shadow-sm hover:shadow-md'
    ]"
  >
    <Icon
      name="lucide:coffee"
      class="h-5 w-5 text-slate-900 transition-transform duration-300 group-hover:-rotate-12"
    />
    <span v-if="!minimal" class="font-['Cookie'] font-medium tracking-wide">
      {{ text }}
    </span>
  </a>

  <Modal v-if="isChinese" v-model="showQrModal" size="lg">
    <div class="p-6 md:p-8">
      <h3 class="mb-6 text-center text-xl font-bold text-surface-900 dark:text-white">
        请我喝杯咖啡 ☕
      </h3>

      <div class="grid grid-cols-2 gap-6">
        <div class="flex flex-col items-center gap-3">
          <div class="text-sm font-semibold text-surface-700 dark:text-surface-300">
            微信支付
          </div>
          <div class="flex h-40 w-40 items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-800">
            <img
              v-show="!qrImages.wechat.error"
              src="/qr/wechat-pay.png"
              alt="WeChat Pay"
              class="h-36 w-36 rounded-lg object-cover"
              @error="onImgError('wechat')"
            />
            <Icon v-if="qrImages.wechat.error" name="lucide:image-off" class="h-8 w-8 text-surface-400" />
          </div>
        </div>

        <div class="flex flex-col items-center gap-3">
          <div class="text-sm font-semibold text-surface-700 dark:text-surface-300">
            支付宝
          </div>
          <div class="flex h-40 w-40 items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-800">
            <img
              v-show="!qrImages.alipay.error"
              src="/qr/alipay.png"
              alt="Alipay"
              class="h-36 w-36 rounded-lg object-cover"
              @error="onImgError('alipay')"
            />
            <Icon v-if="qrImages.alipay.error" name="lucide:image-off" class="h-8 w-8 text-surface-400" />
          </div>
        </div>
      </div>

      <p class="mt-6 text-center text-sm text-surface-500 dark:text-surface-400">
        扫一扫上方二维码，请我喝杯咖啡吧！
      </p>
    </div>
  </Modal>
</template>
