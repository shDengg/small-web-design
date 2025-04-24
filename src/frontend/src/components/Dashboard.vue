<template>
  <div class="dashboard-panel">
    <!-- Child dashboard when a child is selected -->
    <div v-if="currentChildId" class="dashboard-content">
      <!-- Dashboard header with child's name and age -->
      <div class="dashboard-header">
        <h2>{{ selectedChild.name }}</h2>
        <div class="child-quick-stats">
          <div class="stat">{{ calculateAge(selectedChild.date_of_birth) }}</div>
          <div class="stat">{{ selectedChild.sex }}</div>
        </div>
      </div>
      
      <!-- Action cards for various tracking functions -->
      <div class="dashboard-cards">
        <div class="action-card sleep" @click="handleSleepRecord(currentChildId)">
          <i class="el-icon-timer card-icon"></i>
          <div class="card-title">Sleep</div>
        </div>
        
        <div class="action-card feed" @click="handleFeedRecord(currentChildId)">
          <i class="el-icon-bowl card-icon"></i>
          <div class="card-title">Feed</div>
        </div>
        
        <div class="action-card nappy" @click="handleChangeNappyRecord(currentChildId)">
          <i class="el-icon-toilet-paper card-icon"></i>
          <div class="card-title">Nappy</div>
        </div>
        
        <div class="action-card medication" @click="handleMedicationRecord(currentChildId)">
          <i class="el-icon-first-aid-kit card-icon"></i>
          <div class="card-title">Medication</div>
        </div>
        
        <div class="action-card growth" @click="handleGrowthRecord(currentChildId)">
          <i class="el-icon-data-line card-icon"></i>
          <div class="card-title">Growth</div>
        </div>
        
        <div class="action-card temperature" @click="handleTemperatureRecord(currentChildId)">
          <i class="el-icon-thermometer card-icon"></i>
          <div class="card-title">Temperature</div>
        </div>
      </div>
      
      <!-- Today's summary section -->
      <div class="summary-section">
        <div class="summary-header">
          <h3>Today's Summary</h3>
          <div class="summary-date">{{ formatFullDate(dayjs().format('YYYY-MM-DD')) }}</div>
        </div>
        <div class="summary-cards">
          <div class="summary-card sleep">
            <i class="el-icon-timer summary-icon"></i>
            <div>
              <div class="summary-value">{{ todaySleepHours }}</div>
              <div class="summary-label">Hours of Sleep</div>
              <div class="summary-trend" v-if="yesterdaySleepHours">
                <span :class="compareSleepTime(todaySleepHours, yesterdaySleepHours) > 0 ? 'increase' : 'decrease'">
                  {{ compareSleepTime(todaySleepHours, yesterdaySleepHours) > 0 ? '↑' : '↓' }} 
                  {{ formatSleepDifference(todaySleepHours, yesterdaySleepHours) }} vs yesterday
                </span>
              </div>
            </div>
          </div>
          
          <div class="summary-card feed">
            <i class="el-icon-bowl summary-icon"></i>
            <div>
              <div class="summary-value">{{ todayFeedsCount }}</div>
              <div class="summary-label">Feeds</div>
              <div class="summary-details" v-if="lastFeed">
                Last: {{ lastFeed.feed_time }} ({{ lastFeed.feed_type }})
              </div>
            </div>
          </div>
          
          <div class="summary-card nappy">
            <i class="el-icon-toilet-paper summary-icon"></i>
            <div>
              <div class="summary-value">{{ todayNappyCount }}</div>
              <div class="summary-label">Nappy Changes</div>
              <div class="summary-details" v-if="lastNappy">
                Last: {{ lastNappy.change_time }} ({{ lastNappy.change_type }})
              </div>
            </div>
          </div>
          
          <div class="summary-card medication">
            <i class="el-icon-first-aid-kit summary-icon"></i>
            <div>
              <div class="summary-value">{{ todayMedicationCount }}</div>
              <div class="summary-label">Medications</div>
              <div class="summary-details" v-if="lastMedication">
                Last: {{ lastMedication.medication_type }}
              </div>
            </div>
          </div>
          
          <div class="summary-card temperature">
            <i class="el-icon-thermometer summary-icon"></i>
            <div>
              <div class="summary-header-row">
                <div class="summary-value" :class="{ 'fever-value': isCurrentTemperatureFever }">{{ latestTemperature }}</div>
                <div class="temperature-indicator" v-if="isCurrentTemperatureFever">Fever</div>
              </div>
              <div class="summary-label">Temperature</div>
              <div class="summary-details" v-if="latestTemperatureRecord">
                {{ formatDate(latestTemperatureRecord.date) }} {{ latestTemperatureRecord.temperature_time }}
              </div>
            </div>
          </div>
          
          <div class="summary-card growth" v-if="latestGrowth">
            <i class="el-icon-data-line summary-icon"></i>
            <div>
              <div class="summary-header-row">
                <div class="summary-value">{{ latestGrowth.weight }}kg</div>
                <div class="summary-value">{{ latestGrowth.height }}cm</div>
              </div>
              <div class="summary-label">Latest Growth</div>
              <div class="summary-details">
                {{ formatDate(latestGrowth.growth_date) }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Recent activities section -->
      <div class="recent-records">
        <div class="recent-header">
          <h3>Recent Activities</h3>
          <div class="time-range-selector">
            <el-radio-group v-model="activitiesTimeRange" size="small">
              <el-radio-button label="week">Last 7 days</el-radio-button>
              <el-radio-button label="month">Last 30 days</el-radio-button>
              <el-radio-button label="year">Last 12 months</el-radio-button>
            </el-radio-group>
          </div>
        </div>
        <el-tabs v-model="activeTabName" @tab-change="handleTabChange">
          <el-tab-pane label="Sleep" name="sleep">
            <el-empty v-if="!filteredSleepRecords.length" description="No sleep records in selected time range"></el-empty>
            <div v-else>
              <div class="records-summary sleep">
                <div class="records-summary-item">
                  <div class="summary-title">Total Sleep Time</div>
                  <div class="summary-data">{{ calculateTotalSleepTime(filteredSleepRecords) }}</div>
                </div>
                <div class="records-summary-item">
                  <div class="summary-title">Average Daily Sleep</div>
                  <div class="summary-data">{{ calculateAverageDailySleep(filteredSleepRecords) }}</div>
                </div>
                <div class="records-summary-item">
                  <div class="summary-title">Records Count</div>
                  <div class="summary-data">{{ filteredSleepRecords.length }}</div>
                </div>
              </div>
              <div v-for="date in filteredSleepDatesSorted.slice(0, displayLimit)" :key="date" class="daily-sleep-records">
                <div class="daily-header">
                  <div class="daily-date">{{ formatDate(date) }}</div>
                  <div class="daily-total sleep">{{ filteredSleepRecordsByDate[date].totalHours }}</div>
                </div>
                <el-timeline>
                  <el-timeline-item
                    v-for="record in filteredSleepRecordsByDate[date].records"
                    :key="record.id"
                    :timestamp="formatDate(record.sleep_date) + ' ' + record.start_time"
                    type="primary"
                  >
                    <div class="timeline-content sleep">
                      <div class="record-type">{{ record.sleep_type }}</div>
                      <div class="record-time">{{ record.start_time }} - {{ record.end_time }}</div>
                      <div class="record-duration">{{ calculateDuration(record.start_time, record.end_time) }}</div>
                    </div>
                  </el-timeline-item>
                </el-timeline>
              </div>
              <div v-if="filteredSleepDatesSorted.length > displayLimit" class="load-more">
                <el-button type="text" @click="loadMore">Load More</el-button>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="Feed" name="feed">
            <el-empty v-if="!filteredFeedRecords.length" description="No feed records in selected time range"></el-empty>
            <div v-else>
              <div class="records-summary feed">
                <div class="records-summary-item">
                  <div class="summary-title">Total Feeds</div>
                  <div class="summary-data">{{ filteredFeedRecords.length }}</div>
                </div>
                <div class="records-summary-item" v-if="filteredLiquidFeedTotal > 0">
                  <div class="summary-title">Total Liquid</div>
                  <div class="summary-data">{{ filteredLiquidFeedTotal }}ml</div>
                </div>
              </div>
              <el-timeline>
                <el-timeline-item
                  v-for="record in filteredFeedRecords.slice(0, displayLimit * 3)"
                  :key="record.id"
                  :timestamp="formatDate(record.feed_date) + ' ' + record.feed_time"
                  type="warning"
                >
                  <div class="timeline-content feed">
                    <div class="record-type">{{ record.feed_type }}</div>
                    <div class="record-details">{{ record.food_name }}</div>
                    <div v-if="record.feed_type === 'Liquid'" class="record-amount">{{ record.feed_amount }}ml</div>
                    <div v-else class="record-amount">{{ record.feed_amount }}</div>
                  </div>
                </el-timeline-item>
              </el-timeline>
              <div v-if="filteredFeedRecords.length > displayLimit * 3" class="load-more">
                <el-button type="text" @click="loadMore">Load More</el-button>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="Nappy" name="nappy">
            <el-empty v-if="!filteredNappyRecords.length" description="No nappy records in selected time range"></el-empty>
            <div v-else>
              <div class="records-summary nappy">
                <div class="records-summary-item">
                  <div class="summary-title">Total Changes</div>
                  <div class="summary-data">{{ filteredNappyRecords.length }}</div>
                </div>
                <div class="records-summary-item">
                  <div class="summary-title">Last Change</div>
                  <div class="summary-data">{{ formatTimeAgo(filteredNappyRecords[0].change_date, filteredNappyRecords[0].change_time) }}</div>
                </div>
              </div>
              <el-timeline>
                <el-timeline-item
                  v-for="record in filteredNappyRecords.slice(0, displayLimit * 3)"
                  :key="record.id"
                  :timestamp="formatDate(record.change_date) + ' ' + record.change_time"
                  type="success"
                >
                  <div class="timeline-content nappy">
                    <div class="record-type">{{ record.change_type }}</div>
                  </div>
                </el-timeline-item>
              </el-timeline>
              <div v-if="filteredNappyRecords.length > displayLimit * 3" class="load-more">
                <el-button type="text" @click="loadMore">Load More</el-button>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="Medication" name="medication">
            <el-empty v-if="!filteredMedicationRecords.length" description="No medication records in selected time range"></el-empty>
            <div v-else>
              <div class="records-summary medication">
                <div class="records-summary-item">
                  <div class="summary-title">Total Medications</div>
                  <div class="summary-data">{{ filteredMedicationRecords.length }}</div>
                </div>
                <div class="records-summary-item">
                  <div class="summary-title">Last Medication</div>
                  <div class="summary-data">{{ formatTimeAgo(filteredMedicationRecords[0].medication_date, filteredMedicationRecords[0].medication_time) }}</div>
                </div>
              </div>
              <el-timeline>
                <el-timeline-item
                  v-for="record in filteredMedicationRecords.slice(0, displayLimit * 3)"
                  :key="record.id"
                  :timestamp="formatDate(record.medication_date) + ' ' + record.medication_time"
                  type="danger"
                >
                  <div class="timeline-content medication">
                    <div class="record-type">{{ record.medication_type }}</div>
                    <div class="record-dosage">Dosage: {{ record.dosage }}</div>
                  </div>
                </el-timeline-item>
              </el-timeline>
              <div v-if="filteredMedicationRecords.length > displayLimit * 3" class="load-more">
                <el-button type="text" @click="loadMore">Load More</el-button>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="Growth" name="growth">
            <el-empty v-if="!filteredGrowthRecords.length" description="No growth records in selected time range"></el-empty>
            <div v-else>
              <div class="records-summary growth">
                <div class="records-summary-item">
                  <div class="summary-title">Latest Weight</div>
                  <div class="summary-data">{{ filteredGrowthRecords[0].weight }}kg</div>
                </div>
                <div class="records-summary-item">
                  <div class="summary-title">Latest Height</div>
                  <div class="summary-data">{{ filteredGrowthRecords[0].height }}cm</div>
                </div>
              </div>
              <el-timeline>
                <el-timeline-item
                  v-for="record in filteredGrowthRecords.slice(0, displayLimit * 3)"
                  :key="record.id"
                  :timestamp="formatDate(record.growth_date)"
                  type="success"
                >
                  <div class="timeline-content growth">
                    <div class="record-type">Growth Record</div>
                    <div class="record-measurements">Weight: {{ record.weight }}kg | Height: {{ record.height }}cm</div>
                  </div>
                </el-timeline-item>
              </el-timeline>
              <div v-if="filteredGrowthRecords.length > displayLimit * 3" class="load-more">
                <el-button type="text" @click="loadMore">Load More</el-button>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="Temperature" name="temperature">
            <el-empty v-if="!filteredTemperatureRecords.length" description="No temperature records in selected time range"></el-empty>
            <div v-else>
              <div class="records-summary temperature">
                <div class="records-summary-item">
                  <div class="summary-title">Latest Reading</div>
                  <div class="summary-data" :class="{ 'fever-value': parseFloat(filteredTemperatureRecords[0].temperature) > 37.5 }">
                    {{ filteredTemperatureRecords[0].temperature }}°C
                    <span v-if="parseFloat(filteredTemperatureRecords[0].temperature) > 37.5" class="temperature-indicator">Fever</span>
                  </div>
                </div>
                <div class="records-summary-item">
                  <div class="summary-title">Time</div>
                  <div class="summary-data">{{ formatTimeAgo(filteredTemperatureRecords[0].date, filteredTemperatureRecords[0].temperature_time) }}</div>
                </div>
              </div>
              <el-timeline>
                <el-timeline-item
                  v-for="record in filteredTemperatureRecords.slice(0, displayLimit * 3)"
                  :key="record.id"
                  :timestamp="formatDate(record.date) + ' ' + record.temperature_time"
                  :type="parseFloat(record.temperature) > 37.5 ? 'danger' : 'info'"
                >
                  <div class="timeline-content temperature">
                    <div class="record-type">Temperature</div>
                    <div class="record-temperature" :class="{ fever: parseFloat(record.temperature) > 37.5 }">
                      {{ record.temperature }}°C
                    </div>
                  </div>
                </el-timeline-item>
              </el-timeline>
              <div v-if="filteredTemperatureRecords.length > displayLimit * 3" class="load-more">
                <el-button type="text" @click="loadMore">Load More</el-button>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    
    <!-- Empty state when no child is selected -->
    <div class="empty-dashboard" v-else>
      <div class="empty-content">
        <i class="el-icon-select"></i>
        <h3>Select a child to view their dashboard</h3>
        <p>Click on a child from the list on the left to see their details and records</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { 
  currentChildId, selectedChild, 
  todaySleepHours, todayFeedsCount, todayNappyCount,
  recentSleepRecords, recentFeedRecords, recentNappyRecords,
  recentMedicationRecords, recentGrowthRecords, recentTemperatureRecords,
  calculateAge, formatDate, calculateDuration,
  sleepRecords, feedRecords, changeNappyRecords, medicationRecords, growthRecords, temperatureRecords
} from '../store'

import {
  sleepRecordDialogVisible,
  feedRecordDialogVisible,
  changeNappyDialogVisible,
  medicationRecordDialogVisible,
  growthRecordDialogVisible,
  temperatureRecordDialogVisible
} from '../store'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

// Format full date display (e.g., "Monday, January 1, 2023")
const formatFullDate = (dateStr) => {
  return dayjs(dateStr).format('dddd, MMMM D, YYYY')
}

// New computed properties for Today's Summary
const todayMedicationCount = computed(() => {
  if (!medicationRecords.value.length) return '0'
  
  const today = dayjs().format('YYYY-MM-DD')
  return medicationRecords.value.filter(r => r.medication_date === today).length
})

// Get yesterday's sleep hours for comparison
const yesterdaySleepHours = computed(() => {
  if (!sleepRecords.value.length) return null
  
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
  const yesterdayRecords = sleepRecords.value.filter(r => r.sleep_date === yesterday)
  
  if (yesterdayRecords.length === 0) return null
  
  let totalMinutes = 0
  yesterdayRecords.forEach(record => {
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

// Group sleep records by date and calculate per-day totals
const sleepRecordsByDate = computed(() => {
  if (!recentSleepRecords.value.length) return {}
  
  // Group records by date
  const grouped = {}
  recentSleepRecords.value.forEach(record => {
    if (!grouped[record.sleep_date]) {
      grouped[record.sleep_date] = []
    }
    grouped[record.sleep_date].push(record)
  })
  
  // Calculate totals for each date
  const result = {}
  for (const date in grouped) {
    let totalMinutes = 0
    grouped[date].forEach(record => {
      const start = dayjs(`2000-01-01 ${record.start_time}`)
      const end = dayjs(`2000-01-01 ${record.end_time}`)
      let diffMinutes = end.diff(start, 'minute')
      
      // Handle overnight sleep that crosses midnight
      if (diffMinutes < 0) {
        diffMinutes += 24 * 60
      }
      
      totalMinutes += diffMinutes
    })
    
    // Calculate hours and minutes for formatted display
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    
    result[date] = {
      records: grouped[date],
      totalHours: `${hours}h ${minutes}m`,
      totalMinutes: totalMinutes
    }
  }
  
  return result
})

// Get the sorted dates of sleep records
const sleepDatesSorted = computed(() => {
  return Object.keys(sleepRecordsByDate.value).sort((a, b) => dayjs(b).diff(dayjs(a)))
})

// Get latest feed record
const lastFeed = computed(() => {
  if (!feedRecords.value.length) return null
  
  const today = dayjs().format('YYYY-MM-DD')
  const todayFeeds = feedRecords.value
    .filter(r => r.feed_date === today)
    .sort((a, b) => dayjs(b.feed_time, 'HH:mm').diff(dayjs(a.feed_time, 'HH:mm')))
  
  return todayFeeds.length > 0 ? todayFeeds[0] : null
})

// Get latest nappy change record
const lastNappy = computed(() => {
  if (!changeNappyRecords.value.length) return null
  
  const today = dayjs().format('YYYY-MM-DD')
  const todayChanges = changeNappyRecords.value
    .filter(r => r.change_date === today)
    .sort((a, b) => dayjs(b.change_time, 'HH:mm').diff(dayjs(a.change_time, 'HH:mm')))
  
  return todayChanges.length > 0 ? todayChanges[0] : null
})

// Get latest medication record
const lastMedication = computed(() => {
  if (!medicationRecords.value.length) return null
  
  const today = dayjs().format('YYYY-MM-DD')
  const todayMeds = medicationRecords.value
    .filter(r => r.medication_date === today)
    .sort((a, b) => dayjs(b.medication_time, 'HH:mm').diff(dayjs(a.medication_time, 'HH:mm')))
  
  return todayMeds.length > 0 ? todayMeds[0] : null
})

// Temperature tracking
const latestTemperatureRecord = computed(() => {
  if (!temperatureRecords.value.length) return null
  
  const sortedRecords = [...temperatureRecords.value]
    .sort((a, b) => dayjs(`${b.date} ${b.temperature_time}`).diff(dayjs(`${a.date} ${a.temperature_time}`)))
  
  return sortedRecords.length > 0 ? sortedRecords[0] : null
})

const latestTemperature = computed(() => {
  return latestTemperatureRecord.value ? `${latestTemperatureRecord.value.temperature}°C` : '-'
})

const isCurrentTemperatureFever = computed(() => {
  if (!latestTemperatureRecord.value) return false
  return parseFloat(latestTemperatureRecord.value.temperature) > 37.5
})

const latestGrowth = computed(() => {
  if (!growthRecords.value.length) return null
  
  const sortedRecords = [...growthRecords.value]
    .sort((a, b) => dayjs(b.growth_date).diff(dayjs(a.growth_date)))
  
  return sortedRecords.length > 0 ? sortedRecords[0] : null
})

// Calculate total liquid feed amount
const liquidFeedTotal = computed(() => {
  if (!recentFeedRecords.value.length) return 0
  
  return recentFeedRecords.value
    .filter(record => record.feed_type === 'Liquid')
    .reduce((total, record) => total + (parseInt(record.feed_amount) || 0), 0)
})

// Format time ago for timestamps
const formatTimeAgo = (date, time) => {
  if (!date || !time) return 'Unknown'
  const dateTime = dayjs(`${date} ${time}`)
  return dateTime.fromNow()
}

// Function handlers for opening record dialogs
const handleSleepRecord = (childID) => {
  sleepRecordDialogVisible.value = true
}

const handleFeedRecord = (childID) => {
  feedRecordDialogVisible.value = true
}

const handleChangeNappyRecord = (childID) => {
  changeNappyDialogVisible.value = true
}

const handleMedicationRecord = (childID) => {
  medicationRecordDialogVisible.value = true
}

const handleGrowthRecord = (childID) => {
  growthRecordDialogVisible.value = true
}

const handleTemperatureRecord = (childID) => {
  temperatureRecordDialogVisible.value = true
}

// New function to calculate total sleep time
const calculateTotalSleepTime = (records) => {
  let totalMinutes = 0
  records.forEach(record => {
    const start = dayjs(`2000-01-01 ${record.start_time}`)
    const end = dayjs(`2000-01-01 ${record.end_time}`)
    let diffMinutes = end.diff(start, 'minute')
    
    // Handle overnight sleep that crosses midnight
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60
    }
    
    totalMinutes += diffMinutes
  })
  
  // Format as hours and minutes instead of decimal hours
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  
  return `${hours}h ${minutes}m`
}

// Helper function to convert sleep time string (e.g. "8h 30m") to minutes
const getSleepMinutes = (sleepTimeStr) => {
  if (!sleepTimeStr) return 0
  
  try {
    const hourMatch = sleepTimeStr.match(/(\d+)h/)
    const minuteMatch = sleepTimeStr.match(/(\d+)m/)
    
    const hours = hourMatch ? parseInt(hourMatch[1]) : 0
    const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0
    
    return hours * 60 + minutes
  } catch (e) {
    console.error('Error parsing sleep time:', e)
    return 0
  }
}

// Compare two sleep time strings and return the difference in minutes
const compareSleepTime = (time1, time2) => {
  const minutes1 = getSleepMinutes(time1)
  const minutes2 = getSleepMinutes(time2)
  return minutes1 - minutes2
}

// Format the difference between two sleep times
const formatSleepDifference = (time1, time2) => {
  const diffMinutes = Math.abs(compareSleepTime(time1, time2))
  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60
  
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  } else {
    return `${minutes}m`
  }
}

// Active tab management
const activeTabName = ref('sleep')

// Handle tab change
const handleTabChange = (tab) => {
  activeTabName.value = tab
  displayLimit.value = 5 // Reset display limit when switching tabs
}

// Display limit for records
const displayLimit = ref(5)

// Load more records
const loadMore = () => {
  displayLimit.value += 5
}

// Initialize time range from localStorage if available
onMounted(() => {
  const savedTimeRange = localStorage.getItem('activitiesTimeRange')
  if (savedTimeRange && ['week', 'month', 'year'].includes(savedTimeRange)) {
    activitiesTimeRange.value = savedTimeRange
  }
})

// Time range selector for Recent Activities section
const activitiesTimeRange = ref('week') // Default to weekly view

// Save time range preference to localStorage when it changes
watch(activitiesTimeRange, (newValue) => {
  localStorage.setItem('activitiesTimeRange', newValue)
  displayLimit.value = 5 // Reset display limit when time range changes
})

// Filter records by selected time range
const filteredSleepRecords = computed(() => {
  const startDate = getTimeRangeStartDate()
  return sleepRecords.value
    .filter(record => dayjs(record.sleep_date).isAfter(dayjs(startDate)) || dayjs(record.sleep_date).isSame(dayjs(startDate), 'day'))
    .sort((a, b) => dayjs(`${b.sleep_date} ${b.start_time}`).diff(dayjs(`${a.sleep_date} ${a.start_time}`)))
})

const filteredFeedRecords = computed(() => {
  const startDate = getTimeRangeStartDate()
  return feedRecords.value
    .filter(record => dayjs(record.feed_date).isAfter(dayjs(startDate)) || dayjs(record.feed_date).isSame(dayjs(startDate), 'day'))
    .sort((a, b) => dayjs(`${b.feed_date} ${b.feed_time}`).diff(dayjs(`${a.feed_date} ${a.feed_time}`)))
})

const filteredNappyRecords = computed(() => {
  const startDate = getTimeRangeStartDate()
  return changeNappyRecords.value
    .filter(record => dayjs(record.change_date).isAfter(dayjs(startDate)) || dayjs(record.change_date).isSame(dayjs(startDate), 'day'))
    .sort((a, b) => dayjs(`${b.change_date} ${b.change_time}`).diff(dayjs(`${a.change_date} ${a.change_time}`)))
})

const filteredMedicationRecords = computed(() => {
  const startDate = getTimeRangeStartDate()
  return medicationRecords.value
    .filter(record => dayjs(record.medication_date).isAfter(dayjs(startDate)) || dayjs(record.medication_date).isSame(dayjs(startDate), 'day'))
    .sort((a, b) => dayjs(`${b.medication_date} ${b.medication_time}`).diff(dayjs(`${a.medication_date} ${a.medication_time}`)))
})

const filteredGrowthRecords = computed(() => {
  const startDate = getTimeRangeStartDate()
  return growthRecords.value
    .filter(record => dayjs(record.growth_date).isAfter(dayjs(startDate)) || dayjs(record.growth_date).isSame(dayjs(startDate), 'day'))
    .sort((a, b) => dayjs(b.growth_date).diff(dayjs(a.growth_date)))
})

const filteredTemperatureRecords = computed(() => {
  const startDate = getTimeRangeStartDate()
  return temperatureRecords.value
    .filter(record => dayjs(record.date).isAfter(dayjs(startDate)) || dayjs(record.date).isSame(dayjs(startDate), 'day'))
    .sort((a, b) => dayjs(`${b.date} ${b.temperature_time}`).diff(dayjs(`${a.date} ${a.temperature_time}`)))
})

// Group filtered sleep records by date and calculate per-day totals
const filteredSleepRecordsByDate = computed(() => {
  if (!filteredSleepRecords.value.length) return {}
  
  // Group records by date
  const grouped = {}
  filteredSleepRecords.value.forEach(record => {
    if (!grouped[record.sleep_date]) {
      grouped[record.sleep_date] = []
    }
    grouped[record.sleep_date].push(record)
  })
  
  // Calculate totals for each date
  const result = {}
  for (const date in grouped) {
    let totalMinutes = 0
    grouped[date].forEach(record => {
      const start = dayjs(`2000-01-01 ${record.start_time}`)
      const end = dayjs(`2000-01-01 ${record.end_time}`)
      let diffMinutes = end.diff(start, 'minute')
      
      // Handle overnight sleep that crosses midnight
      if (diffMinutes < 0) {
        diffMinutes += 24 * 60
      }
      
      totalMinutes += diffMinutes
    })
    
    // Calculate hours and minutes for formatted display
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    
    result[date] = {
      records: grouped[date],
      totalHours: `${hours}h ${minutes}m`,
      totalMinutes: totalMinutes
    }
  }
  
  return result
})

// Get the sorted dates of filtered sleep records
const filteredSleepDatesSorted = computed(() => {
  return Object.keys(filteredSleepRecordsByDate.value).sort((a, b) => dayjs(b).diff(dayjs(a)))
})

// Calculate total liquid feed amount for filtered records
const filteredLiquidFeedTotal = computed(() => {
  if (!filteredFeedRecords.value.length) return 0
  
  return filteredFeedRecords.value
    .filter(record => record.feed_type === 'Liquid')
    .reduce((total, record) => total + (parseInt(record.feed_amount) || 0), 0)
})

// Format label for selected time range
const formatTimeRangeLabel = () => {
  const now = dayjs()
  const startDate = dayjs(getTimeRangeStartDate())
  
  switch (activitiesTimeRange.value) {
    case 'week':
      return startDate.format('MMM D') + ' - ' + now.format('MMM D')
    case 'month':
      return startDate.format('MMM D') + ' - ' + now.format('MMM D')
    case 'year':
      return startDate.format('MMM YYYY') + ' - ' + now.format('MMM YYYY')
    default:
      return startDate.format('MMM D') + ' - ' + now.format('MMM D')
  }
}

// Get start date based on selected time range
const getTimeRangeStartDate = () => {
  const now = dayjs()
  
  switch (activitiesTimeRange.value) {
    case 'week':
      return now.subtract(7, 'day').format('YYYY-MM-DD')
    case 'month':
      return now.subtract(30, 'day').format('YYYY-MM-DD')
    case 'year':
      return now.subtract(365, 'day').format('YYYY-MM-DD')
    default:
      return now.subtract(7, 'day').format('YYYY-MM-DD')
  }
}

// New function to calculate average daily sleep
const calculateAverageDailySleep = (records) => {
  if (!records.length) return '0h 0m'
  
  // Get unique dates in the records
  const uniqueDates = [...new Set(records.map(record => record.sleep_date))]
  if (uniqueDates.length === 0) return '0h 0m'
  
  // Calculate total minutes
  let totalMinutes = 0
  records.forEach(record => {
    const start = dayjs(`2000-01-01 ${record.start_time}`)
    const end = dayjs(`2000-01-01 ${record.end_time}`)
    let diffMinutes = end.diff(start, 'minute')
    
    // Handle overnight sleep that crosses midnight
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60
    }
    
    totalMinutes += diffMinutes
  })
  
  // Calculate average minutes per day
  const avgMinutesPerDay = Math.round(totalMinutes / uniqueDates.length)
  
  // Format as hours and minutes
  const hours = Math.floor(avgMinutesPerDay / 60)
  const minutes = avgMinutesPerDay % 60
  
  return `${hours}h ${minutes}m`
}
</script>

<style scoped>
.dashboard-panel {
  flex: 1;
  padding: 16px 24px;
  overflow-y: auto;
}

.dashboard-header {
  margin-bottom: 24px;
}

.dashboard-header h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1d1d1f;
}

.child-quick-stats {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.stat {
  background: #f1f5f9;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 14px;
  color: #64748b;
}

.dashboard-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.action-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.1);
}

.card-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.card-title {
  font-weight: 500;
  font-size: 16px;
}

/* Category-specific styling */
.sleep {
  color: #2980b9;
  background-color: #e6f9fd;
}

.feed {
  color: #e67e22;
  background-color: #fff2e8;
}

.nappy {
  color: #9b59b6;
  background-color: #f5e6fd;
}

.medication {
  color: #8e44ad;
  background-color: #f0e5fd;
}

.growth {
  color: #1d804b;
  background-color: #e6f7ed;
}

.temperature {
  color: #2c64cc;
  background-color: #e8f0fd;
}

/* Summary section */
.summary-section {
  margin-top: 32px;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.summary-date {
  color: #64748b;
  font-size: 14px;
}

.summary-section h3 {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
}

.summary-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.summary-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  min-width: 160px;
  flex: 1;
  min-width: calc(33% - 16px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  display: flex;
  align-items: flex-start;
}

.summary-icon {
  font-size: 24px;
  margin-right: 16px;
  color: #409EFF;
}

.summary-value {
  font-size: 24px;
  font-weight: 600;
  color: #1d1d1f;
}

.summary-label {
  font-size: 14px;
  color: #64748b;
  margin-top: 4px;
}

.summary-details {
  font-size: 12px;
  color: #64748b;
  margin-top: 8px;
}

.summary-trend {
  font-size: 12px;
  margin-top: 8px;
}

.increase {
  color: #10b981;
}

.decrease {
  color: #ef4444;
}

.summary-header-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.temperature-indicator {
  background-color: #ef4444;
  color: white;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 500;
}

.fever-value {
  color: #ef4444;
}

/* Records summary styling */
.records-summary {
  background: white;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.records-summary-item {
  flex: 1;
  min-width: 120px;
}

.summary-title {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 4px;
}

.summary-data {
  font-size: 18px;
  font-weight: 600;
}

/* Daily sleep records */
.daily-sleep-records {
  margin-bottom: 24px;
}

.daily-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  background-color: #f8fafc;
  margin-bottom: 12px;
}

.daily-date {
  font-weight: 500;
  font-size: 16px;
  color: #475569;
}

.daily-total {
  font-weight: 600;
  font-size: 15px;
  padding: 2px 10px;
  border-radius: 16px;
}

.daily-total.sleep {
  color: #2980b9;
  background-color: #e6f9fd;
}

/* Recent records section */
.recent-records {
  margin-top: 32px;
}

.recent-records h3 {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 16px;
}

.recent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.time-range-selector {
  display: flex;
  gap: 16px;
}

:deep(.el-radio-button__inner) {
  padding: 6px 16px;
  font-size: 14px;
}

:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: #409EFF;
  border-color: #409EFF;
  box-shadow: -1px 0 0 0 #409EFF;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .dashboard-panel {
    padding: 16px;
  }
  
  .dashboard-cards {
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  }
  
  .summary-cards {
    flex-direction: column;
  }
  
  .summary-card {
    width: 100%;
    min-width: 100%;
  }
  
  .recent-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .time-range-selector {
    width: 100%;
  }
  
  :deep(.el-radio-group) {
    width: 100%;
    display: flex;
  }
  
  :deep(.el-radio-button) {
    flex: 1;
  }
  
  :deep(.el-radio-button__inner) {
    width: 100%;
    text-align: center;
  }
}

@media (min-width: 769px) and (max-width: 1200px) {
  .summary-card {
    min-width: calc(50% - 16px);
  }
}

:deep(.el-timeline-item__node) {
  width: 16px;
  height: 16px;
}

.timeline-content {
  padding: 8px 12px;
  border-radius: 8px;
  background-color: #f8f9fa;
}

.record-type {
  font-weight: 500;
  margin-bottom: 4px;
}

.record-time, .record-details, .record-dosage, .record-measurements, .record-amount, .record-duration {
  font-size: 14px;
  color: #64748b;
}

.record-temperature {
  font-weight: 600;
  font-size: 16px;
}

.record-temperature.fever {
  color: #e74c3c;
}

/* Empty state */
.empty-dashboard {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-content {
  text-align: center;
  color: #64748b;
  padding: 32px;
}

.empty-content i {
  font-size: 64px;
  margin-bottom: 16px;
  color: #cbd5e1;
}

.empty-content h3 {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #475569;
}

.empty-content p {
  font-size: 15px;
  max-width: 400px;
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  margin-bottom: 20px;
}

.load-more button {
  font-size: 14px;
  color: #409EFF;
}
</style> 