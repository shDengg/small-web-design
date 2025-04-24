import { reactive } from 'vue'
import dayjs from 'dayjs'

// Basic child information form
export const childForm = reactive({
  name: '',
  sex: '',
  date_of_birth: ''
})

// Sleep tracking form
export const sleepRecordForm = reactive({
  sleep_date: dayjs().format('YYYY-MM-DD'),
  sleep_type: '',
  sleep_time: [null, null]
})

// Nappy change tracking form
export const changeNappyRecordForm = reactive({
  change_date: dayjs().format('YYYY-MM-DD'),
  change_time: dayjs().format('HH:mm'),
  change_type: ''
})

// Feeding tracking form
export const feedRecordForm = reactive({
  feed_date: dayjs().format('YYYY-MM-DD'),
  feed_time: dayjs().format('HH:mm'),
  feed_type: '',
  food_name: '',
  feed_amount: '' // Amount in ml for liquid feeds
})

// Medication tracking form
export const medicationRecordForm = reactive({
  medication_date: dayjs().format('YYYY-MM-DD'),
  medication_time: dayjs().format('HH:mm'),
  medication_type: '',
  dosage: ''
})

// Growth tracking form
export const growthRecordForm = reactive({
  growth_date: dayjs().format('YYYY-MM-DD'),
  weight: '',
  height: ''
})

// Temperature tracking form
export const temperatureRecordForm = reactive({
  date: dayjs().format('YYYY-MM-DD'),
  temperature_time: dayjs().format('HH:mm'),
  temperature: ''
})

// Basic child information validation
export const childInformationRules = reactive({
  name: [{ required: true, message: 'Please input child name', trigger: 'change' }],
  sex: [{ required: true, message: 'Please select sex', trigger: 'change' }],
  date_of_birth: [{ required: true, message: 'Please select date of birth', trigger: 'change' }]
})

// Sleep record time range validation
export const sleepFormRules = reactive({
  sleep_type: [{ required: true, message: 'Please select sleep type', trigger: 'blur' }],
  start_datetime: [{ required: true, message: 'Please select start date and time', trigger: 'change' }],
  end_datetime: [{ 
    required: true, 
    message: 'Please select end date and time', 
    trigger: 'change' 
  }, {
    validator: (rule, value, callback, source) => {
      if (!source.start_datetime || !value) {
        callback()
        return
      }

      const startDatetime = dayjs(source.start_datetime)
      const endDatetime = dayjs(value)
      
      const startDay = startDatetime.format('YYYY-MM-DD')
      const endDay = endDatetime.format('YYYY-MM-DD')
      const isDifferentDay = startDay !== endDay

      if (endDatetime.isBefore(startDatetime)) {
        if (source.sleep_type === 'Night time sleep' && isDifferentDay) {
          callback()
          return
        }
        
        callback(new Error('End time must be after start time'))
        return
      }

      const durationMinutes = endDatetime.diff(startDatetime, 'minute')
      
      if (durationMinutes < 15) {
        callback(new Error('Sleep duration too short (less than 15 minutes)'))
        return
      } 
      
      if (durationMinutes > 24 * 60) {
        callback(new Error('Sleep duration exceeds 24 hours. For extremely long sleeps, please record in multiple entries.'))
        return
      }

      if (source.sleep_type === 'Night time sleep') {
        const daysDiff = endDatetime.diff(startDatetime, 'day')
        if (daysDiff > 1) {
          callback(new Error('Night sleep should not span more than one night. Please record multiple sleep sessions.'))
          return
        }
      } else if (source.sleep_type === 'Day time nap') {
        if (isDifferentDay) {
          callback(new Error('Day time naps should start and end on the same day'))
          return
        }
      }
      
      callback()
    },
    trigger: 'change'
  }]
})

// Nappy change record validation
export const changeNappyRecordRules = reactive({
  change_date: [{ required: true, message: 'Please select change date', trigger: 'change' }],
  change_time: [{ required: true, message: 'Please select change time', trigger: 'change' }],
  change_type: [{ required: true, message: 'Please select change type', trigger: 'change' }]
})

// Feeding record validation with amount checks
export const feedRecordRules = reactive({
  feed_date: [{ required: true, message: 'Please select feed date', trigger: 'change' }],
  feed_time: [{ required: true, message: 'Please select feed time', trigger: 'change' }],
  feed_type: [{ required: true, message: 'Please select feed type', trigger: 'change' }],
  food_name: [{ required: true, message: 'Please input food name', trigger: 'change' }],
  feed_amount: [
    { required: true, message: 'Please input feed amount', trigger: 'change' },
    { 
      validator: (rule, value, callback) => {
        const amount = parseFloat(value)

        // Only validate numeric values for liquid feeds
        if (feedRecordForm.feed_type === 'Liquid') {
          if (isNaN(amount)) {
            callback(new Error('Amount must be a number for liquid feeds'))
          } else if (amount < 5 || amount > 1000) {
            callback(new Error('Liquid amount should be between 5ml and 1000ml'))
          } else {
            callback()
          }
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
})

// Medication record validation
export const medicationRecordRules = reactive({
  medication_date: [{ required: true, message: 'Please select medication date', trigger: 'change' }],
  medication_time: [{ required: true, message: 'Please select medication time', trigger: 'change' }],
  medication_type: [{ required: true, message: 'Please input medication type', trigger: 'change' }],
  dosage: [{ required: true, message: 'Please input dosage', trigger: 'change' }]
})

// Growth measurements validation
export const growthRecordRules = reactive({
  growth_date: [{ required: true, message: 'Please select growth date', trigger: 'change' }],
  height: [
    { required: true, message: 'Please input height', trigger: 'change' },
    { 
      validator: (rule, value, callback) => {
        const height = parseFloat(value)
        if (isNaN(height)) {
          callback(new Error('Height must be a number'))
        } else if (height < 20 || height > 200) {
          callback(new Error('Height should be between 20cm and 200cm'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  weight: [
    { required: true, message: 'Please input weight', trigger: 'change' },
    { 
      validator: (rule, value, callback) => {
        const weight = parseFloat(value)
        if (isNaN(weight)) {
          callback(new Error('Weight must be a number'))
        } else if (weight < 0.5 || weight > 80) {
          callback(new Error('Weight should be between 0.5kg and 80kg'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
})

// Temperature record validation
export const temperatureRecordRules = reactive({
  date: [{ required: true, message: 'Please select record date', trigger: 'change' }],
  temperature_time: [{ required: true, message: 'Please select record time', trigger: 'change' }],
  temperature: [
    { required: true, message: 'Please input temperature', trigger: 'change' },
    { 
      validator: (rule, value, callback) => {
        const temp = parseFloat(value)
        if (isNaN(temp)) {
          callback(new Error('Temperature must be a number'))
        } else if (temp < 35 || temp > 42) {
          callback(new Error('Temperature should be between 35°C and 42°C'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}) 