export interface Toast {
  id: number
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration: number
}

const toasts = ref<Toast[]>([])
let nextId = 0

const MAX_VISIBLE = 3
const DEFAULT_DURATION = 2500

function add(type: Toast['type'], message: string, duration = DEFAULT_DURATION) {
  const id = nextId++
  toasts.value.push({ id, type, message, duration })
  if (toasts.value.length > MAX_VISIBLE) toasts.value.shift()
  setTimeout(() => remove(id), duration)
}

function remove(id: number) {
  const idx = toasts.value.findIndex(t => t.id === id)
  if (idx !== -1) toasts.value.splice(idx, 1)
}

export const useToast = () => ({
  toasts: readonly(toasts),
  success: (msg: string, duration?: number) => add('success', msg, duration),
  error: (msg: string, duration?: number) => add('error', msg, duration),
  info: (msg: string, duration?: number) => add('info', msg, duration),
  warning: (msg: string, duration?: number) => add('warning', msg, duration),
  remove,
})
