<template>
  <!-- Sleep Record Dialog with Chart -->
  <el-dialog v-model="sleepRecordDialogVisible" title="Sleep Records" width="50%">
    <el-form ref="sleepRecordFormRef" :model="sleepRecordForm" :rules="sleepFormRules">
      <el-form-item label="Sleep Type" prop="sleep_type">
        <el-select v-model="sleepRecordForm.sleep_type" placeholder="Select sleep type" @change="handleSleepTypeChange">
          <el-option value="Night time sleep" label="Night time sleep"></el-option>
          <el-option value="Day time nap" label="Day time nap"></el-option>
        </el-select>
        <div class="form-tip">Night sleep typically starts in the evening and ends the next morning</div>
      </el-form-item>

      <el-form-item label="Start Date & Time" prop="start_datetime">
        <el-date-picker 
          v-model="sleepRecordForm.start_datetime" 
          type="datetime"
          placeholder="Select start date and time" 
          format="YYYY-MM-DD HH:mm"
          value-format="YYYY-MM-DD HH:mm"
          :disabled-date="validateDate"
          :picker-options="startTimePickerOptions"
        />
        <div class="form-tip">When the sleep started. For night sleep, this should be the actual day when sleep began.</div>
      </el-form-item>

      <el-form-item label="End Date & Time" prop="end_datetime">
        <el-date-picker 
          v-model="sleepRecordForm.end_datetime" 
          type="datetime"
          placeholder="Select end date and time" 
          format="YYYY-MM-DD HH:mm"
          value-format="YYYY-MM-DD HH:mm"
          :disabled-date="validateEndDate"
          :picker-options="endTimePickerOptions"
        />
        <div class="form-tip" v-if="sleepRecordForm.sleep_type === 'Night time sleep'">
          When the sleep ended. For night sleep, this can be the next morning (up to 24 hours after start time).
        </div>
        <div class="form-tip" v-else>
          When the sleep ended. Day time naps must start and end on the same calendar day.
        </div>
      </el-form-item>

      <el-form-item v-if="sleepDurationDisplay">
        <div class="sleep-duration-display">
          <span class="duration-label">Duration:</span>
          <span class="duration-value">{{ sleepDurationDisplay }}</span>
        </div>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="addSleepRecord">Add Record</el-button>
      </el-form-item>

    </el-form>
    
    <!-- Today's Sleep Summary -->
    <div v-if="todaySleepSummary.hasRecords" class="sleep-summary-card">
      <h3>Today's Sleep Summary</h3>
      <div class="sleep-summary-content">
        <div class="sleep-summary-item">
          <div class="summary-label">Night Sleep</div>
          <div class="summary-value">{{ todaySleepSummary.nightHours }} hours</div>
        </div>
        <div class="sleep-summary-item">
          <div class="summary-label">Day Naps</div>
          <div class="summary-value">{{ todaySleepSummary.dayHours }} hours</div>
        </div>
        <div class="sleep-summary-item total">
          <div class="summary-label">Total Sleep</div>
          <div class="summary-value">{{ todaySleepSummary.totalHours }} hours</div>
        </div>
      </div>
    </div>
    
    <el-table :data="sleepRecords" style="margin-top: 20px;">
      <el-table-column prop="sleep_date" label="Sleep Date"></el-table-column>
      <el-table-column prop="sleep_type" label="Sleep Type"></el-table-column>
      <el-table-column label="Sleep Time">
        <template #default="scope">
          <div>Start: {{ formatDateTime(scope.row.sleep_date, scope.row.start_time) }}</div>
          <div>End: {{ formatEndDateTime(scope.row.sleep_date, scope.row.end_time) }}</div>
        </template>
      </el-table-column>
      <el-table-column label="Duration">
        <template #default="scope">
          {{ calculateSleepDuration(scope.row.start_time, scope.row.end_time) }}
        </template>
      </el-table-column>
      <el-table-column label="Operation">
        <template #default="scope">
          <el-button size="small" @click="deleteSleepRecord(scope.row.id)">Delete</el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- Sleep Chart Canvas -->
    <div class="chart-container">
      <canvas ref="sleepChartRef"></canvas>
    </div>
  </el-dialog>

  <!-- Change Nappy Record Dialog with Chart -->
  <el-dialog v-model="changeNappyDialogVisible" title="Change Nappy Records" width="50%">
    <el-form ref="changeNappyFormRef" :model="changeNappyRecordForm" :rules="changeNappyRecordRules">
      <el-form-item label="Date" prop="change_date">
        <el-date-picker v-model="changeNappyRecordForm.change_date" placeholder="Select Date" value-format="YYYY-MM-DD" :disabled-date="validateDate"/>
      </el-form-item>
      <el-form-item label="Change Time" prop="change_time">
        <el-time-picker v-model="changeNappyRecordForm.change_time"
                        placeholder="Select Change Time"
                        format="HH:mm"
                        value-format="HH:mm"
        />
      </el-form-item>
      <el-form-item label="Change Type" prop="change_type">
        <el-select v-model="changeNappyRecordForm.change_type">
          <el-option value="Wet(Pee)nappy" label="Wet(Pee)nappy"></el-option>
          <el-option value="Soiled(Poo)nappy" label="Soiled(Poo)nappy"></el-option>
          <el-option value="Mixed(Pee+Poo)nappy" label="Mixed(Pee+Poo)nappy"></el-option>
          <el-option value="Dry nappy" label="Dry nappy"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="addChangeNappyRecord">Add Change Record</el-button>
      </el-form-item>
    </el-form>
    <el-table :data="changeNappyRecords" style="margin-top: 20px;">
      <el-table-column prop="change_date" label="Change Date"></el-table-column>
      <el-table-column prop="change_time" label="Change Time"></el-table-column>
      <el-table-column prop="change_type" label="Change Type"></el-table-column>
      <el-table-column label="Operation">
        <template #default="scope">
          <el-button size="small" @click="deleteChangeNappyRecord(scope.row.id)">Delete</el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- Nappy Chart Canvas -->
    <div class="chart-container">
      <canvas ref="nappyChartRef"></canvas>
    </div>
  </el-dialog>

  <!-- Feed Record Dialog with Milk Chart -->
  <el-dialog v-model="feedRecordDialogVisible" title="Feed Records" width="50%">
    <el-form ref="feedRecordFormRef" :model="feedRecordForm" :rules="feedRecordRules">
      <el-form-item label="Feed Date" prop="feed_date">
        <el-date-picker 
          v-model="feedRecordForm.feed_date" 
          placeholder="Select date" 
          value-format="YYYY-MM-DD" 
          :disabled-date="validateDate"
        />
        <div class="form-tip">Cannot be before birth date or in the future</div>
      </el-form-item>
      
      <el-form-item label="Feed Time" prop="feed_time">
        <el-time-picker 
          v-model="feedRecordForm.feed_time"
          placeholder="Select time"
          format="HH:mm"
          value-format="HH:mm"
        />
      </el-form-item>
      
      <el-form-item label="Feed Type" prop="feed_type">
        <el-select 
          v-model="feedRecordForm.feed_type" 
          placeholder="Select type"
          @change="feedTypeChanged"
        >
          <el-option value="Liquid" label="Liquid"></el-option>
          <el-option value="Solid" label="Solid"></el-option>
        </el-select>
        <div class="form-tip">Liquid includes milk, formula, water. Solid includes pureed foods, finger foods, etc.</div>
      </el-form-item>
      
      <el-form-item label="Food Name" prop="food_name">
        <el-input 
          v-model="feedRecordForm.food_name" 
          :placeholder="feedRecordForm.feed_type === 'Liquid' ? 'e.g., Formula, Breast milk, Water' : 'e.g., Banana, Rice cereal, Yogurt'"
        ></el-input>
      </el-form-item>
      
      <el-form-item label="Feed Amount" prop="feed_amount">
        <el-input 
          v-model="feedRecordForm.feed_amount" 
          :placeholder="feedRecordForm.feed_type === 'Liquid' ? 'Enter amount in ml' : 'Describe portion size'">
          <template #append v-if="feedRecordForm.feed_type === 'Liquid'">ml</template>
        </el-input>
        <div class="form-tip" v-if="feedRecordForm.feed_type === 'Liquid'">For liquid feeds, enter the amount in milliliters (between 5-1000ml)</div>
        <div class="form-tip" v-else>For solid feeds, describe the portion size (e.g., small, medium, large)</div>
      </el-form-item>
      
      <el-form-item>
        <el-button type="primary" @click="addFeedRecord">Add Feed Record</el-button>
      </el-form-item>
    </el-form>
    <el-table :data="feedRecords" style="margin-top: 20px;">
      <el-table-column prop="feed_date" label="Feed Date"></el-table-column>
      <el-table-column prop="feed_time" label="Feed Time"></el-table-column>
      <el-table-column prop="feed_type" label="Feed Type"></el-table-column>
      <el-table-column prop="food_name" label="Food Name"></el-table-column>
      <el-table-column label="Amount">
        <template #default="scope">
          <span v-if="scope.row.feed_type === 'Liquid'">{{ scope.row.feed_amount }} ml</span>
          <span v-else>{{ scope.row.feed_amount }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Operation">
        <template #default="scope">
          <el-button size="small" @click="deleteFeedRecord(scope.row.id)">Delete</el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- Feed Chart Canvas -->
    <div class="chart-container">
      <canvas ref="feedChartRef"></canvas>
    </div>
  </el-dialog>

  <!-- Medication Record Dialog -->
  <el-dialog v-model="medicationRecordDialogVisible" title="Medication Records" width="50%">
    <el-form ref="medicationFormRef" :model="medicationRecordForm" :rules="medicationRecordRules">
      <el-form-item label="Date" prop="medication_date">
        <el-date-picker 
          v-model="medicationRecordForm.medication_date" 
          placeholder="Select date" 
          value-format="YYYY-MM-DD" 
          :disabled-date="validateDate"
        />
      </el-form-item>
      <el-form-item label="Time" prop="medication_time">
        <el-time-picker 
          v-model="medicationRecordForm.medication_time"
          placeholder="Select time"
          format="HH:mm"
          value-format="HH:mm"
        />
      </el-form-item>
      <el-form-item label="Medication" prop="medication_type">
        <el-input v-model="medicationRecordForm.medication_type" placeholder="Enter medication name"></el-input>
      </el-form-item>
      <el-form-item label="Dosage" prop="dosage">
        <el-input v-model="medicationRecordForm.dosage" placeholder="Enter dosage amount"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="addMedicationRecord">Add Medication Record</el-button>
      </el-form-item>
    </el-form>
    <el-table :data="medicationRecords" style="margin-top: 20px;">
      <el-table-column prop="medication_date" label="Date"></el-table-column>
      <el-table-column prop="medication_time" label="Time"></el-table-column>
      <el-table-column prop="medication_type" label="Medication"></el-table-column>
      <el-table-column prop="dosage" label="Dosage"></el-table-column>
      <el-table-column label="Operation">
        <template #default="scope">
          <el-button size="small" @click="deleteMedicationRecord(scope.row.id)">Delete</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>

  <!-- Growth Record Dialog with Charts -->
  <el-dialog v-model="growthRecordDialogVisible" title="Growth Records" width="50%">
    <el-form ref="growthRecordFormRef" :model="growthRecordForm" :rules="growthRecordRules">
      <el-form-item label="Date" prop="growth_date">
        <el-date-picker 
          v-model="growthRecordForm.growth_date" 
          placeholder="Select date" 
          value-format="YYYY-MM-DD" 
          :disabled-date="validateDate"
        />
      </el-form-item>
      <el-form-item label="Height" prop="height">
        <el-input v-model="growthRecordForm.height" placeholder="Enter height">
          <template #append>cm</template>
        </el-input>
      </el-form-item>
      <el-form-item label="Weight" prop="weight">
        <el-input v-model="growthRecordForm.weight" placeholder="Enter weight">
          <template #append>kg</template>
        </el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="addGrowthRecord">Add Growth Record</el-button>
      </el-form-item>
    </el-form>
    <el-table :data="growthRecords" style="margin-top: 20px;">
      <el-table-column prop="growth_date" label="Date"></el-table-column>
      <el-table-column label="Age">
        <template #default="scope">
          {{ calculateAgeAtRecordDate(scope.row.growth_date) }} months
        </template>
      </el-table-column>
      <el-table-column prop="height" label="Height (cm)"></el-table-column>
      <el-table-column prop="weight" label="Weight (kg)"></el-table-column>
      <el-table-column label="Operation">
        <template #default="scope">
          <el-button size="small" @click="deleteGrowthRecord(scope.row.id)">Delete</el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- Combined Growth Chart Canvas -->
    <div class="chart-container">
      <canvas ref="combinedGrowthChartRef"></canvas>
    </div>
  </el-dialog>

  <!-- Temperature Record Dialog with Chart -->
  <el-dialog v-model="temperatureRecordDialogVisible" title="Temperature Records" width="50%">
    <el-form ref="temperatureFormRef" :model="temperatureRecordForm" :rules="temperatureRecordRules">
      <el-form-item label="Date" prop="date">
        <el-date-picker 
          v-model="temperatureRecordForm.date" 
          placeholder="Select date" 
          value-format="YYYY-MM-DD" 
          :disabled-date="validateDate"
        />
      </el-form-item>
      <el-form-item label="Time" prop="temperature_time">
        <el-time-picker 
          v-model="temperatureRecordForm.temperature_time"
          placeholder="Select time"
          format="HH:mm"
          value-format="HH:mm"
        />
      </el-form-item>
      <el-form-item label="Temperature" prop="temperature">
        <el-input v-model="temperatureRecordForm.temperature" placeholder="Enter temperature">
          <template #append>°C</template>
        </el-input>
        <div class="form-tip">Normal temperature is 36.5-37.5°C. Fever is 38.0°C and above.</div>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="addTemperatureRecord">Add Temperature Record</el-button>
      </el-form-item>
    </el-form>
    <el-table :data="temperatureRecords" style="margin-top: 20px;" :row-class-name="setFeverRowClass">
      <el-table-column prop="date" label="Date"></el-table-column>
      <el-table-column prop="temperature_time" label="Time"></el-table-column>
      <el-table-column label="Temperature">
        <template #default="scope">
          <span :class="{ 'fever-value': parseFloat(scope.row.temperature) >= 38.0 }">
            {{ scope.row.temperature }}°C
          </span>
        </template>
      </el-table-column>
      <el-table-column label="Status">
        <template #default="scope">
          <el-tag v-if="parseFloat(scope.row.temperature) >= 38.0" type="danger">Fever</el-tag>
          <el-tag v-else-if="parseFloat(scope.row.temperature) >= 37.5" type="warning">Elevated</el-tag>
          <el-tag v-else type="success">Normal</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Operation">
        <template #default="scope">
          <el-button size="small" @click="deleteTemperatureRecord(scope.row.id)">Delete</el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- Temperature Chart Canvas -->
    <div class="chart-container">
      <canvas ref="temperatureChartRef"></canvas>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import {
  currentChildId, selectedChild, validateDate,
  sleepRecordDialogVisible, sleepRecords,
  changeNappyDialogVisible, changeNappyRecords,
  feedRecordDialogVisible, feedRecords,
  medicationRecordDialogVisible, medicationRecords,
  growthRecordDialogVisible, growthRecords,
  temperatureRecordDialogVisible, temperatureRecords,
  fetchSleepRecords, fetchChangeNappyRecords, fetchFeedRecords,
  fetchMedicationRecords, fetchGrowthRecords, fetchTemperatureRecords,
  todaySleepSummary, calculateSleepDuration
} from '../store'

import {
  sleepFormRules, changeNappyRecordRules, feedRecordRules,
  medicationRecordRules, growthRecordRules, temperatureRecordRules,
  changeNappyRecordForm, feedRecordForm, medicationRecordForm,
  growthRecordForm, temperatureRecordForm
} from '../utils/formModels'

import { resetFormWithValidation, completeFormReset } from '../utils/formHelpers'

import {
  renderSleepChart, renderNappyChart, renderFeedChart,
  renderTemperatureChart, renderCombinedGrowthChart,
  cleanupCharts
} from '../utils/chartHelpers'

import axios from 'axios'
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

// Form DOM references for validation and reset operations
const sleepRecordFormRef = ref(null)
const changeNappyFormRef = ref(null)
const feedRecordFormRef = ref(null)
const medicationFormRef = ref(null)
const growthRecordFormRef = ref(null)
const temperatureFormRef = ref(null)

// Chart DOM element references for rendering visualizations
const sleepChartRef = ref(null)
const feedChartRef = ref(null)
const nappyChartRef = ref(null)
const combinedGrowthChartRef = ref(null)
const temperatureChartRef = ref(null)

// Time picker options for sleep records
const startTimePickerOptions = {
  selectableRange: '00:00:00 - 23:59:59'
}

const endTimePickerOptions = {
  selectableRange: '00:00:00 - 23:59:59'
}

// Sleep record form - only this one needs to be a ref for the new format
const sleepRecordForm = ref({
  sleep_type: 'Night time sleep',
  start_datetime: '',
  end_datetime: ''
})

// Additional validation function for end date
const validateEndDate = (date) => {
  // If no start date selected yet, use regular validation
  if (!sleepRecordForm.value.start_datetime) {
    return validateDate(date);
  }
  
  const startDate = dayjs(sleepRecordForm.value.start_datetime);
  const currentDate = dayjs(date);
  
  // For night sleep, allow selecting the next day
  if (sleepRecordForm.value.sleep_type === 'Night time sleep') {
    // Allow selecting today or tomorrow of the start date
    const maxDate = startDate.add(1, 'day').endOf('day');
    return currentDate.isBefore(startDate.startOf('day')) || currentDate.isAfter(maxDate);
  } else {
    // For day naps, only allow selecting the same day
    return currentDate.isBefore(startDate.startOf('day')) || 
           currentDate.isAfter(startDate.endOf('day')) || 
           validateDate(date);
  }
}

// Format full datetime display
const formatDateTime = (date, time) => {
  return `${date} ${time}`
}

// Format end datetime with next day indicator if needed
const formatEndDateTime = (date, time) => {
  // Look up the corresponding sleep record to get both start and end time
  const sleepRecord = sleepRecords.value.find(r => 
    r.sleep_date === date && r.end_time === time
  )
  
  if (sleepRecord) {
    const startTime = sleepRecord.start_time
    const endTime = time
    
    // Parse time strings into hours and minutes
    const [startHour, startMinute] = startTime.split(':').map(Number)
    const [endHour, endMinute] = endTime.split(':').map(Number)
    
    // If end time is earlier in the day than start time, it likely indicates next day
    if (endHour < startHour || (endHour === startHour && endMinute < startMinute)) {
      // It's an overnight record
      const nextDay = dayjs(date).add(1, 'day').format('YYYY-MM-DD')
      return `${nextDay} ${time} (next day)`
    }
  }
  
  return `${date} ${time}`
}

// Calculate sleep duration display
const sleepDurationDisplay = computed(() => {
  if (!sleepRecordForm.value.start_datetime || !sleepRecordForm.value.end_datetime) {
    return null
  }
  
  const start = dayjs(sleepRecordForm.value.start_datetime)
  const end = dayjs(sleepRecordForm.value.end_datetime)
  
  if (end.isBefore(start)) {
    return null
  }
  
  const diffMinutes = end.diff(start, 'minute')
  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60
  
  return `${hours}h ${minutes}m`
})

// Handle sleep type change
const handleSleepTypeChange = () => {
  // If night time sleep is selected, set some reasonable defaults
  if (sleepRecordForm.value.sleep_type === 'Night time sleep') {
    const now = dayjs()
    const today = now.format('YYYY-MM-DD')
    
    // For night sleep, default to 8:00 PM to 6:00 AM the next day
    // If it's already past 8:00 PM, use current time as start
    if (now.hour() >= 20) {
      sleepRecordForm.value.start_datetime = now.format('YYYY-MM-DD HH:mm')
    } else {
      sleepRecordForm.value.start_datetime = `${today} 20:00`
    }
    
    // Set end time to 6:00 AM the next day
    sleepRecordForm.value.end_datetime = dayjs(today).add(1, 'day').format('YYYY-MM-DD') + ' 06:00'
  } else {
    // For day naps, set reasonable default times based on current time
    const now = dayjs()
    const today = now.format('YYYY-MM-DD')
    
    // If it's morning (before noon), set nap time at noon
    // If it's afternoon, use current time as start
    if (now.hour() < 12) {
      sleepRecordForm.value.start_datetime = `${today} 12:00`
      sleepRecordForm.value.end_datetime = `${today} 14:00` // 2-hour nap
    } else {
      sleepRecordForm.value.start_datetime = now.format('YYYY-MM-DD HH:mm')
      sleepRecordForm.value.end_datetime = now.add(1, 'hour').format('YYYY-MM-DD HH:mm') // 1-hour nap
    }
  }
}

// Sleep Record Functions
const addSleepRecord = () => {
  sleepRecordFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const loading = ElLoading.service({
          lock: true,
          text: 'Adding sleep record...',
          background: 'rgba(255, 255, 255, 0.7)'
        })
        
        // Extract date and time information
        const start = dayjs(sleepRecordForm.value.start_datetime)
        const end = dayjs(sleepRecordForm.value.end_datetime)
        
        // Form validation already checked start/end time relationship
        // No need to manually check end.isBefore(start) here
        
        // Calculate duration for validation
        const durationMinutes = end.diff(start, 'minute')
        
        // Warn if sleep duration is unusually long (more than 16 hours)
        if (durationMinutes > 16 * 60) {
          if (!confirm('This sleep record is longer than 16 hours. Are you sure this is correct?')) {
            loading.close()
            return
          }
        }
        
        // Always use the start date as the sleep_date for consistency
        // This ensures overnight sleep records are stored with the day they started
        const sleepDate = start.format('YYYY-MM-DD')
        
        // Create payload for API
        const payload = {
          sleep_date: sleepDate,
          sleep_type: sleepRecordForm.value.sleep_type,
          start_time: start.format('HH:mm'),
          end_time: end.format('HH:mm')
        }
        
        // Add a flag to indicate overnight sleep for proper handling in the backend
        if (sleepRecordForm.value.sleep_type === 'Night time sleep' && 
            start.format('YYYY-MM-DD') !== end.format('YYYY-MM-DD')) {
          payload.is_overnight = true
        }
        
        const response = await axios.post(`http://127.0.0.1:5000/children/${currentChildId.value}/sleep`, payload)
        
        if (response.status >= 200 && response.status < 300) {
          ElMessage.success('Sleep record added successfully')
          
          // Keep the sleep type for easier consecutive entries
          const previousType = sleepRecordForm.value.sleep_type
          
          // Reset the form
          sleepRecordForm.value = {
            sleep_type: previousType,
            start_datetime: '',
            end_datetime: ''
          }
          
          // Re-apply defaults based on sleep type
          handleSleepTypeChange()
          
          await fetchSleepRecords(currentChildId.value)
          nextTick(() => renderSleepChart(sleepChartRef, sleepRecords.value))
        }
      } catch (error) {
        console.error('Failed to add sleep record:', error)
        const errorMsg = error.response?.data?.message || error.message || 'Failed to add sleep record'
        ElMessage.error(errorMsg)
      } finally {
        ElLoading.service().close()
      }
    }
  })
}

const deleteSleepRecord = (recordID) => {
  axios.delete(`http://127.0.0.1:5000/children/${currentChildId.value}/sleep/${recordID}`)
      .then(() => {
        ElMessage.success('Sleep record deleted successfully')
        fetchSleepRecords(currentChildId.value).then(() => {
          nextTick(() => renderSleepChart(sleepChartRef, sleepRecords.value))
        })
      })
      .catch(error => {
        console.error('Failed to delete sleep record:', error)
        ElMessage.error('Failed to delete sleep record')
      })
}

// Initialize sleep form when dialog opens
watch(sleepRecordDialogVisible, (newVal) => {
  if (newVal) {
    // Initialize with defaults when opening the dialog
    handleSleepTypeChange()
    nextTick(() => renderSleepChart(sleepChartRef, sleepRecords.value))
  } else {
    cleanupCharts()
  }
})

// Nappy Change Functions
const addChangeNappyRecord = () => {
  changeNappyFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const loading = ElLoading.service({
          lock: true,
          text: 'Adding nappy change record...',
          background: 'rgba(255, 255, 255, 0.7)'
        })
        
        const response = await axios.post(`http://127.0.0.1:5000/children/${currentChildId.value}/nappy`, changeNappyRecordForm)
        
        if (response.status >= 200 && response.status < 300) {
          ElMessage.success('Nappy change record added successfully')
          completeFormReset(changeNappyFormRef, changeNappyRecordForm)
          await fetchChangeNappyRecords(currentChildId.value)
          nextTick(() => renderNappyChart(nappyChartRef, changeNappyRecords.value))
        }
      } catch (error) {
        console.error('Failed to add nappy change record:', error)
        const errorMsg = error.response?.data?.message || error.message || 'Failed to add nappy change record'
        ElMessage.error(errorMsg)
      } finally {
        ElLoading.service().close()
      }
    }
  })
}

const deleteChangeNappyRecord = (recordID) => {
  axios.delete(`http://127.0.0.1:5000/children/${currentChildId.value}/nappy/${recordID}`)
      .then(() => {
        ElMessage.success('Nappy change record deleted successfully')
        fetchChangeNappyRecords(currentChildId.value).then(() => {
          nextTick(() => renderNappyChart(nappyChartRef, changeNappyRecords.value))
        })
      })
      .catch(error => {
        console.error('Failed to delete nappy change record:', error)
        ElMessage.error('Failed to delete nappy change record')
      })
}

// Feed Record Functions
const feedTypeChanged = () => {
  // Clear validation errors when feed type changes
  if (feedRecordFormRef.value) {
    feedRecordFormRef.value.clearValidate('feed_amount')
  }
}

const addFeedRecord = () => {
  feedRecordFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const loading = ElLoading.service({
          lock: true,
          text: 'Adding feed record...',
          background: 'rgba(255, 255, 255, 0.7)'
        })
        
        const response = await axios.post(`http://127.0.0.1:5000/children/${currentChildId.value}/feed`, feedRecordForm)
        
        if (response.status >= 200 && response.status < 300) {
          ElMessage.success('Feed record added successfully')
          completeFormReset(feedRecordFormRef, feedRecordForm)
          await fetchFeedRecords(currentChildId.value)
          nextTick(() => renderFeedChart(feedChartRef, feedRecords.value))
        }
      } catch (error) {
        console.error('Failed to add feed record:', error)
        const errorMsg = error.response?.data?.message || error.message || 'Failed to add feed record'
        ElMessage.error(errorMsg)
      } finally {
        ElLoading.service().close()
      }
    }
  })
}

const deleteFeedRecord = (recordID) => {
  axios.delete(`http://127.0.0.1:5000/children/${currentChildId.value}/feed/${recordID}`)
      .then(() => {
        ElMessage.success('Feed record deleted successfully')
        fetchFeedRecords(currentChildId.value).then(() => {
          nextTick(() => renderFeedChart(feedChartRef, feedRecords.value))
        })
      })
      .catch(error => {
        console.error('Failed to delete feed record:', error)
        ElMessage.error('Failed to delete feed record')
      })
}

// Medication Record Functions
const addMedicationRecord = () => {
  medicationFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const loading = ElLoading.service({
          lock: true,
          text: 'Adding medication record...',
          background: 'rgba(255, 255, 255, 0.7)'
        })
        
        const response = await axios.post(`http://127.0.0.1:5000/children/${currentChildId.value}/medication`, medicationRecordForm)
        
        if (response.status >= 200 && response.status < 300) {
          ElMessage.success('Medication record added successfully')
          completeFormReset(medicationFormRef, medicationRecordForm)
          await fetchMedicationRecords(currentChildId.value)
        }
      } catch (error) {
        console.error('Failed to add medication record:', error)
        const errorMsg = error.response?.data?.message || error.message || 'Failed to add medication record'
        ElMessage.error(errorMsg)
      } finally {
        ElLoading.service().close()
      }
    }
  })
}

const deleteMedicationRecord = (recordID) => {
  axios.delete(`http://127.0.0.1:5000/children/${currentChildId.value}/medication/${recordID}`)
      .then(() => {
        ElMessage.success('Medication record deleted successfully')
        fetchMedicationRecords(currentChildId.value)
      })
      .catch(error => {
        console.error('Failed to delete medication record:', error)
        ElMessage.error('Failed to delete medication record')
      })
}

// Growth Record Functions
const calculateAgeAtRecordDate = (recordDate) => {
  if (!selectedChild.value.date_of_birth) return ''
  const birthDate = dayjs(selectedChild.value.date_of_birth)
  const recordDateObj = dayjs(recordDate)
  return recordDateObj.diff(birthDate, 'month', true).toFixed(1)
}

const addGrowthRecord = () => {
  growthRecordFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const loading = ElLoading.service({
          lock: true,
          text: 'Adding growth record...',
          background: 'rgba(255, 255, 255, 0.7)'
        })
        
        const response = await axios.post(`http://127.0.0.1:5000/children/${currentChildId.value}/growth`, growthRecordForm)
        
        if (response.status >= 200 && response.status < 300) {
          ElMessage.success('Growth record added successfully')
          completeFormReset(growthRecordFormRef, growthRecordForm)
          await fetchGrowthRecords(currentChildId.value)
          nextTick(() => {
            renderCombinedGrowthChart(combinedGrowthChartRef, growthRecords.value)
          })
        }
      } catch (error) {
        console.error('Failed to add growth record:', error)
        const errorMsg = error.response?.data?.message || error.message || 'Failed to add growth record'
        ElMessage.error(errorMsg)
      } finally {
        ElLoading.service().close()
      }
    }
  })
}

const deleteGrowthRecord = (recordID) => {
  axios.delete(`http://127.0.0.1:5000/children/${currentChildId.value}/growth/${recordID}`)
      .then(() => {
        ElMessage.success('Growth record deleted successfully')
        // First clean up any existing charts to prevent rendering issues
        cleanupCharts()
        // Then fetch new data and render charts with explicit promise handling
        return fetchGrowthRecords(currentChildId.value)
      })
      .then(() => {
        // Wait for next tick to ensure DOM is updated
        return nextTick()
      })
      .then(() => {
        // Force re-render of combined growth chart with explicit null checks
        if (combinedGrowthChartRef.value) {
          renderCombinedGrowthChart(combinedGrowthChartRef, growthRecords.value)
          console.log('Growth chart refreshed after deletion')
        }
      })
      .catch(error => {
        console.error('Failed to delete growth record:', error)
        ElMessage.error('Failed to delete growth record')
      })
}

// Temperature Record Functions
const setFeverRowClass = ({ row }) => {
  const temp = parseFloat(row.temperature)
  if (temp >= 38.0) {
    return 'fever-row'
  } else if (temp >= 37.5) {
    return 'elevated-row'
  }
  return ''
}

const addTemperatureRecord = () => {
  temperatureFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const loading = ElLoading.service({
          lock: true,
          text: 'Adding temperature record...',
          background: 'rgba(255, 255, 255, 0.7)'
        })
        
        const response = await axios.post(`http://127.0.0.1:5000/children/${currentChildId.value}/temperature`, temperatureRecordForm)
        
        if (response.status >= 200 && response.status < 300) {
          ElMessage.success('Temperature record added successfully')
          completeFormReset(temperatureFormRef, temperatureRecordForm)
          await fetchTemperatureRecords(currentChildId.value)
          nextTick(() => renderTemperatureChart(temperatureChartRef, temperatureRecords.value))
        }
      } catch (error) {
        console.error('Failed to add temperature record:', error)
        const errorMsg = error.response?.data?.message || error.message || 'Failed to add temperature record'
        ElMessage.error(errorMsg)
      } finally {
        ElLoading.service().close()
      }
    }
  })
}

const deleteTemperatureRecord = (recordID) => {
  axios.delete(`http://127.0.0.1:5000/children/${currentChildId.value}/temperature/${recordID}`)
      .then(() => {
        ElMessage.success('Temperature record deleted successfully')
        fetchTemperatureRecords(currentChildId.value).then(() => {
          nextTick(() => renderTemperatureChart(temperatureChartRef, temperatureRecords.value))
        })
      })
      .catch(error => {
        console.error('Failed to delete temperature record:', error)
        ElMessage.error('Failed to delete temperature record')
      })
}

// Watch dialog visibility to clean up charts when closed
watch(sleepRecordDialogVisible, (newVal) => {
  if (newVal) {
    nextTick(() => renderSleepChart(sleepChartRef, sleepRecords.value))
  } else {
    cleanupCharts()
  }
})

watch(feedRecordDialogVisible, (newVal) => {
  if (newVal) {
    nextTick(() => renderFeedChart(feedChartRef, feedRecords.value))
  } else {
    cleanupCharts()
  }
})

watch(changeNappyDialogVisible, (newVal) => {
  if (newVal) {
    nextTick(() => renderNappyChart(nappyChartRef, changeNappyRecords.value))
  } else {
    cleanupCharts()
  }
})

watch(growthRecordDialogVisible, (newVal) => {
  if (newVal) {
    // First ensure we have the latest data
    fetchGrowthRecords(currentChildId.value).then(() => {
      // Then wait for the DOM to update completely
      nextTick(() => {
        console.log('Rendering growth charts with data:', growthRecords.value.length, 'records')
        // Force render combined growth chart with explicit null checks
        renderCombinedGrowthChart(combinedGrowthChartRef, growthRecords.value || [])
      })
    }).catch(error => {
      console.error('Error fetching growth records for charts:', error)
      // Still try to render combined growth chart even if fetch fails
      nextTick(() => {
        renderCombinedGrowthChart(combinedGrowthChartRef, growthRecords.value || [])
      })
    })
  } else {
    cleanupCharts()
  }
})

watch(temperatureRecordDialogVisible, (newVal) => {
  if (newVal) {
    nextTick(() => renderTemperatureChart(temperatureChartRef, temperatureRecords.value))
  } else {
    cleanupCharts()
  }
})
</script>

<style scoped>
.chart-container {
  height: 350px;
  margin-top: 20px;
  margin-bottom: 20px;
  position: relative;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.fever-value {
  color: #e74c3c;
  font-weight: bold;
}

:deep(.fever-row) {
  background-color: rgba(231, 76, 60, 0.1);
}

:deep(.elevated-row) {
  background-color: rgba(243, 156, 18, 0.1);
}

/* Sleep Summary Styling */
.sleep-summary-card {
  background-color: #f0f9ff;
  border-radius: 8px;
  padding: 16px;
  margin-top: 20px;
  border: 1px solid #bae6fd;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.sleep-summary-card h3 {
  color: #0369a1;
  font-size: 16px;
  margin-top: 0;
  margin-bottom: 12px;
}

.sleep-summary-content {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.sleep-summary-item {
  flex: 1;
  min-width: 120px;
  text-align: center;
  padding: 8px;
  border-radius: 6px;
  background-color: white;
}

.sleep-summary-item.total {
  background-color: #e0f2fe;
  font-weight: 600;
}

.summary-label {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 4px;
}

.summary-value {
  font-size: 18px;
  font-weight: 500;
  color: #0c4a6e;
}

.sleep-summary-item.total .summary-value {
  color: #0369a1;
  font-size: 20px;
}

/* Sleep Duration Display */
.sleep-duration-display {
  padding: 10px 16px;
  background-color: #f8fafc;
  border-left: 4px solid #0ea5e9;
  border-radius: 4px;
  display: flex;
  align-items: center;
  margin-top: 5px;
}

.duration-label {
  font-weight: 500;
  color: #0369a1;
  margin-right: 10px;
}

.duration-value {
  font-size: 18px;
  font-weight: 600;
  color: #0c4a6e;
}

/* Chart Container Styling */
.chart-container {
  height: 300px;
  margin-top: 24px;
}
</style> 