import { reactive, ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import axios from 'axios'
import { ElMessage, ElLoading } from 'element-plus'

// Children data store - holds list of all children
export const children = ref([])

// Current date/time for display purposes
export const currentDateTime = ref(dayjs().format('dddd, MMMM D, YYYY HH:mm:ss'))

// Timer for real-time clock updates
let timeUpdateInterval = null

// Function to start the real-time clock
export const startRealtimeClock = () => {
  // Update immediately
  updateCurrentTime()
  
  // Then set up interval to update every second
  if (!timeUpdateInterval) {
    timeUpdateInterval = setInterval(updateCurrentTime, 1000)
  }
}

// Function to stop the clock (for cleanup)
export const stopRealtimeClock = () => {
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval)
    timeUpdateInterval = null
  }
}

// Active child ID for operations
export const currentChildId = ref(null)

// Computed property to get selected child's data
export const selectedChild = computed(() => {
  return children.value.find(c => c.id === currentChildId.value) || {}
})

// Dialog visibility control flags
export const addDialogVisible = ref(false)
export const editDialogVisible = ref(false)
export const sleepRecordDialogVisible = ref(false)
export const changeNappyDialogVisible = ref(false)
export const feedRecordDialogVisible = ref(false)
export const medicationRecordDialogVisible = ref(false)
export const growthRecordDialogVisible = ref(false)
export const temperatureRecordDialogVisible = ref(false)

// Report date selection (defaults to current day)
export const reportDate = ref(dayjs().format("YYYY-MM-DD"))

// Records collections
export const sleepRecords = ref([])
export const changeNappyRecords = ref([])
export const feedRecords = ref([])
export const medicationRecords = ref([])
export const growthRecords = ref([])
export const temperatureRecords = ref([])

// Update the current time function
export const updateCurrentTime = () => {
  currentDateTime.value = dayjs().format('dddd, MMMM D, YYYY HH:mm:ss')
}

// Fetches all children from the backend
export const getChildren = () => {
  axios.get('http://127.0.0.1:5000/children/')
      .then(res => {
        children.value.splice(0, children.value.length, ...res.data.results)
        console.log('Children list updated')
      })
      .catch(error => {
        console.error('Failed to fetch children:', error)
        ElMessage.error('Failed to fetch children')
      })
}

// Promise-based version of getChildren for async/await usage
export const fetchChildren = async () => {
  try {
    const res = await axios.get('http://127.0.0.1:5000/children/')
    children.value.splice(0, children.value.length, ...res.data.results)
    console.log('Children list updated')
    return res.data.results
  } catch (error) {
    console.error('Failed to fetch children:', error)
    ElMessage.error('Failed to fetch children')
    throw error
  }
}

// Get current child data and fetch all related records
export const getCurrentChild = async () => {
  if (!currentChildId.value) return
  
  try {
    // Fetch all records for the current child
    await fetchAllRecordsForCurrentChild()
  } catch (error) {
    console.error('Failed to get current child data:', error)
    ElMessage.error('Failed to load child data')
  }
}

// Computed properties for dashboard
export const todaySleepHours = computed(() => {
  if (!sleepRecords.value.length) return '0h 0m'
  
  const today = dayjs().format('YYYY-MM-DD')
  const todayRecords = sleepRecords.value.filter(r => r.sleep_date === today)
  
  if (todayRecords.length === 0) return '0h 0m'
  
  let totalMinutes = 0
  todayRecords.forEach(record => {
    const start = dayjs(`2000-01-01 ${record.start_time}`)
    const end = dayjs(`2000-01-01 ${record.end_time}`)
    let diffMinutes = end.diff(start, 'minute')
    
    // Handle overnight sleep that crosses midnight
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60
    }
    
    totalMinutes += diffMinutes
  })
  
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  
  return `${hours}h ${minutes}m`
})

export const todayFeedsCount = computed(() => {
  if (!feedRecords.value.length) return '0'
  
  const today = dayjs().format('YYYY-MM-DD')
  return feedRecords.value.filter(r => r.feed_date === today).length
})

export const todayNappyCount = computed(() => {
  if (!changeNappyRecords.value.length) return '0'
  
  const today = dayjs().format('YYYY-MM-DD')
  return changeNappyRecords.value.filter(r => r.change_date === today).length
})

// Recent records
export const recentSleepRecords = computed(() => {
  return [...sleepRecords.value]
    .sort((a, b) => dayjs(`${b.sleep_date} ${b.start_time}`).diff(dayjs(`${a.sleep_date} ${a.start_time}`)))
    .slice(0, 5)
})

export const recentFeedRecords = computed(() => {
  return [...feedRecords.value]
    .sort((a, b) => dayjs(`${b.feed_date} ${b.feed_time}`).diff(dayjs(`${a.feed_date} ${a.feed_time}`)))
    .slice(0, 5)
})

export const recentNappyRecords = computed(() => {
  return [...changeNappyRecords.value]
    .sort((a, b) => dayjs(`${b.change_date} ${b.change_time}`).diff(dayjs(`${a.change_date} ${a.change_time}`)))
    .slice(0, 5)
})

export const recentMedicationRecords = computed(() => {
  return [...medicationRecords.value]
    .sort((a, b) => dayjs(`${b.medication_date} ${b.medication_time}`).diff(dayjs(`${a.medication_date} ${a.medication_time}`)))
    .slice(0, 5)
})

export const recentGrowthRecords = computed(() => {
  return [...growthRecords.value]
    .sort((a, b) => dayjs(b.growth_date).diff(dayjs(a.growth_date)))
    .slice(0, 5)
})

export const recentTemperatureRecords = computed(() => {
  return [...temperatureRecords.value]
    .sort((a, b) => dayjs(`${b.date} ${b.temperature_time}`).diff(dayjs(`${a.date} ${a.temperature_time}`)))
    .slice(0, 5)
})

// Fetch all records for selected child
export const fetchAllRecordsForCurrentChild = async () => {
  if (!currentChildId.value) return
  
  try {
    const loading = ElLoading.service({
      lock: true,
      text: 'Loading records...',
      background: 'rgba(255, 255, 255, 0.7)'
    })
    
    await Promise.all([
      fetchSleepRecords(currentChildId.value),
      fetchFeedRecords(currentChildId.value),
      fetchChangeNappyRecords(currentChildId.value),
      fetchMedicationRecords(currentChildId.value),
      fetchGrowthRecords(currentChildId.value),
      fetchTemperatureRecords(currentChildId.value)
    ])
    
    loading.close()
  } catch (error) {
    console.error('Failed to fetch child records:', error)
    ElMessage.error('Failed to load child records')
    ElLoading.service().close()
  }
}

// Individual record fetch functions
export const fetchSleepRecords = async (childID) => {
  try {
    const res = await axios.get(`http://127.0.0.1:5000/children/${childID}/sleep`)
    sleepRecords.value = res.data.results
    return res.data.results
  } catch (error) {
    console.error('Failed to fetch sleep records:', error)
    throw error
  }
}

export const fetchFeedRecords = async (childID) => {
  try {
    const res = await axios.get(`http://127.0.0.1:5000/children/${childID}/feed`)
    feedRecords.value = res.data.results
    return res.data.results
  } catch (error) {
    console.error('Failed to fetch feed records:', error)
    throw error
  }
}

export const fetchChangeNappyRecords = async (childID) => {
  try {
    const res = await axios.get(`http://127.0.0.1:5000/children/${childID}/nappy`)
    changeNappyRecords.value = res.data.results
    return res.data.results
  } catch (error) {
    console.error('Failed to fetch nappy records:', error)
    throw error
  }
}

export const fetchMedicationRecords = async (childID) => {
  try {
    const res = await axios.get(`http://127.0.0.1:5000/children/${childID}/medication`)
    medicationRecords.value = res.data.results
    return res.data.results
  } catch (error) {
    console.error('Failed to fetch medication records:', error)
    throw error
  }
}

export const fetchGrowthRecords = async (childID) => {
  try {
    const res = await axios.get(`http://127.0.0.1:5000/children/${childID}/growth`)
    growthRecords.value = res.data.results
    return res.data.results
  } catch (error) {
    console.error('Failed to fetch growth records:', error)
    throw error
  }
}

export const fetchTemperatureRecords = async (childID) => {
  try {
    const res = await axios.get(`http://127.0.0.1:5000/children/${childID}/temperature`)
    temperatureRecords.value = res.data.results
    return res.data.results
  } catch (error) {
    console.error('Failed to fetch temperature records:', error)
    throw error
  }
}

// Utility functions
export const calculateAge = (dob) => {
  if (!dob) return ''
  const birthDate = dayjs(dob)
  const now = dayjs()
  
  const days = now.diff(birthDate, 'day')
  const months = now.diff(birthDate, 'month')
  const years = Math.floor(months / 12)
  
  const remainingMonths = months % 12
  
  const yearsAndMonthsDate = birthDate.add(years, 'year').add(remainingMonths, 'month')
  const remainingDays = now.diff(yearsAndMonthsDate, 'day')
  
  if (years > 0) {
    return `${years}y ${remainingMonths}m ${remainingDays}d`
  } else if (remainingMonths > 0) {
    return `${remainingMonths}m ${remainingDays}d`
  } else {
    return `${days}d`
  }
}

export const formatDate = (date) => {
  if (!date) return ''
  return dayjs(date).format('MMM D')
}

export const disableFutureDate = (date) => {
  const selectedDate = dayjs(date)
  const today = dayjs().startOf('day')
  return selectedDate.isAfter(today)
}

export const disableBeforeBirthDate = (date) => {
  if (!selectedChild.value.date_of_birth) return false
  const birthDate = dayjs(selectedChild.value.date_of_birth)
  const selectedDate = dayjs(date)
  return selectedDate.isBefore(birthDate, 'day')
}

export const validateDate = (date) => {
  const selectedDate = dayjs(date)
  const today = dayjs().startOf('day')
  
  if (!selectedChild.value || !selectedChild.value.date_of_birth) {
    return selectedDate.isAfter(today)
  }
  
  const birthDate = dayjs(selectedChild.value.date_of_birth)
  
  return selectedDate.isAfter(today) || selectedDate.isBefore(birthDate)
}

export const calculateDuration = (start, end) => {
  if (!start || !end) return ''
  
  const startTime = dayjs(`2000-01-01 ${start}`)
  const endTime = dayjs(`2000-01-01 ${end}`)
  
  let endTimeAdjusted = endTime
  if (endTime.isBefore(startTime)) {
    endTimeAdjusted = endTime.add(1, 'day')
  }
  
  const diffMinutes = endTimeAdjusted.diff(startTime, 'minute')
  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60
  
  return `${hours}h ${minutes}m`
}

// Sleep duration calculation helper function
export const calculateSleepDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return '0h 0m'
  
  const start = dayjs(`2000-01-01 ${startTime}`)
  const end = dayjs(`2000-01-01 ${endTime}`)
  let diffMinutes = end.diff(start, 'minute')
  
  // Handle overnight sleep that crosses midnight
  if (diffMinutes < 0) {
    diffMinutes += 24 * 60
  }
  
  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60
  
  return `${hours}h ${minutes}m`
}

// Today's sleep summary
export const todaySleepSummary = computed(() => {
  const today = dayjs().format('YYYY-MM-DD')
  const todayRecords = sleepRecords.value.filter(r => r.sleep_date === today)
  
  if (!todayRecords.length) {
    return {
      hasRecords: false,
      nightHours: 0,
      dayHours: 0,
      totalHours: 0
    }
  }
  
  const nightRecords = todayRecords.filter(r => r.sleep_type === 'Night time sleep')
  const dayRecords = todayRecords.filter(r => r.sleep_type === 'Day time nap')
  
  let nightMinutes = 0
  let dayMinutes = 0
  
  nightRecords.forEach(record => {
    const start = dayjs(`2000-01-01 ${record.start_time}`)
    const end = dayjs(`2000-01-01 ${record.end_time}`)
    let diff = end.diff(start, 'minute')
    if (diff < 0) diff += 24 * 60 // handle midnight crossing
    nightMinutes += diff
  })
  
  dayRecords.forEach(record => {
    const start = dayjs(`2000-01-01 ${record.start_time}`)
    const end = dayjs(`2000-01-01 ${record.end_time}`)
    let diff = end.diff(start, 'minute')
    if (diff < 0) diff += 24 * 60 // handle midnight crossing
    dayMinutes += diff
  })
  
  const totalMinutes = nightMinutes + dayMinutes
  
  return {
    hasRecords: true,
    nightHours: (nightMinutes / 60).toFixed(2),
    dayHours: (dayMinutes / 60).toFixed(2),
    totalHours: (totalMinutes / 60).toFixed(2)
  }
}) 