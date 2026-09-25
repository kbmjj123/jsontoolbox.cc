/** Open/close state for the global tool-picker modal (hero upload/paste entry). */
const isPickerOpen = ref(false)

export const useToolPicker = () => {
  function openPicker() {
    isPickerOpen.value = true
  }
  function closePicker() {
    isPickerOpen.value = false
  }
  return { isPickerOpen, openPicker, closePicker }
}
