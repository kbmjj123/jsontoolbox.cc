import { createApp } from 'vue'
import App from './App.vue'
import i18n from '../../i18n'
import '../../assets/tailwind.css'
import './style.css'

// No @kbmjj123/json-editor/style.css import: the popup no longer hosts a
// JsonEditor. The editor only lives in the content script's /wc element.
createApp(App).use(i18n).mount('#app')
