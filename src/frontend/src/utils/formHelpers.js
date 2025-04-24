import { nextTick } from 'vue'
import dayjs from 'dayjs'

// Resets form data and clears validation states
export const resetFormWithValidation = (form, formRef) => {
  resetFormData(form)
  if (formRef && formRef.value) {
    formRef.value.resetFields()
  }
}

// Clears all form fields to empty values
export const resetFormData = (form) => {
  Object.keys(form).forEach(key => {
    if (key === 'sleep_time') {
      form[key] = [null, null]
    } else if (key === 'sleep_date' || key === 'change_date' || key === 'feed_date' || 
              key === 'medication_date' || key === 'growth_date' || key === 'date') {
      form[key] = dayjs().format('YYYY-MM-DD')
    } else if (key === 'change_time' || key === 'feed_time' || 
              key === 'medication_time' || key === 'temperature_time') {
      form[key] = dayjs().format('HH:mm')
    } else {
      form[key] = ''
    }
  })
}

// More complete form reset that handles DOM updates
export const completeFormReset = (formRef, formData) => {
  if (!formRef || !formRef.value) return
  
  // First reset the data
  resetFormData(formData)
  
  // Use nextTick to ensure DOM is updated before resetting form validation
  nextTick(() => {
    formRef.value.resetFields()
    formRef.value.clearValidate()
  })
} 