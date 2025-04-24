import Chart from 'chart.js/auto'
import dayjs from 'dayjs'
import { selectedChild } from '../store'

// Chart instances for data visualization management
let sleepChartInstance = null
let feedChartInstance = null
let nappyChartInstance = null
let weightChartInstance = null
let heightChartInstance = null
let temperatureChartInstance = null
let combinedGrowthChartInstance = null

// Function to cleanup charts when dialogs are closed
export const cleanupCharts = () => {
  if (sleepChartInstance) {
    sleepChartInstance.destroy()
    sleepChartInstance = null
  }
  if (feedChartInstance) {
    feedChartInstance.destroy()
    feedChartInstance = null
  }
  if (nappyChartInstance) {
    nappyChartInstance.destroy()
    nappyChartInstance = null
  }
  if (weightChartInstance) {
    weightChartInstance.destroy()
    weightChartInstance = null
  }
  if (heightChartInstance) {
    heightChartInstance.destroy()
    heightChartInstance = null
  }
  if (temperatureChartInstance) {
    temperatureChartInstance.destroy()
    temperatureChartInstance = null
  }
  if (combinedGrowthChartInstance) {
    combinedGrowthChartInstance.destroy()
    combinedGrowthChartInstance = null
  }
}

// Render Sleep Chart (shows sleep patterns)
export const renderSleepChart = (sleepChartRef, sleepRecords) => {
  if (!sleepChartRef.value) return
  
  const nightSleeps = sleepRecords.filter(r => r.sleep_type === 'Night time sleep')
  const daySleeps = sleepRecords.filter(r => r.sleep_type === 'Day time nap')
  
  const labels = sleepRecords.map(record => record.sleep_date)
    .filter((date, index, self) => self.indexOf(date) === index)
    .sort((a, b) => new Date(a) - new Date(b))
  
  // Compute sleep durations
  const nightData = labels.map(date => {
    const records = nightSleeps.filter(r => r.sleep_date === date)
    let totalMinutes = 0
    records.forEach(record => {
      const start = dayjs(`2000-01-01 ${record.start_time}`)
      const end = dayjs(`2000-01-01 ${record.end_time}`)
      let diff = end.diff(start, 'minute')
      if (diff < 0) diff += 24 * 60 // handle midnight crossing
      totalMinutes += diff
    })
    return totalMinutes / 60 // convert to hours
  })
  
  const dayData = labels.map(date => {
    const records = daySleeps.filter(r => r.sleep_date === date)
    let totalMinutes = 0
    records.forEach(record => {
      const start = dayjs(`2000-01-01 ${record.start_time}`)
      const end = dayjs(`2000-01-01 ${record.end_time}`)
      let diff = end.diff(start, 'minute')
      if (diff < 0) diff += 24 * 60 // handle midnight crossing
      totalMinutes += diff
    })
    return totalMinutes / 60 // convert to hours
  })
  
  // Format date labels for display
  const displayLabels = labels.map(date => dayjs(date).format('MMM D'))
  
  // Calculate total durations for each day (night + day sleep)
  const totalSleepData = labels.map((date, index) => {
    return nightData[index] + dayData[index]
  })
  
  // Check if today is in the dataset
  const today = dayjs().format('YYYY-MM-DD')
  const todayIndex = labels.indexOf(today)
  let todaySleepHours = null
  
  if (todayIndex !== -1) {
    todaySleepHours = totalSleepData[todayIndex]
  }
  
  if (sleepChartInstance) sleepChartInstance.destroy()
  
  sleepChartInstance = new Chart(sleepChartRef.value, {
    type: 'bar',
    data: {
      labels: displayLabels,
      datasets: [
        {
          label: 'Night Sleep (hours)',
          data: nightData,
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Day Naps (hours)',
          data: dayData,
          backgroundColor: 'rgba(255, 206, 86, 0.7)',
          borderColor: 'rgba(255, 206, 86, 1)',
          borderWidth: 1
        },
        {
          label: 'Total Sleep',
          data: totalSleepData,
          type: 'line',
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'transparent',
          borderWidth: 2,
          fill: false,
          tension: 0.1,
          pointBorderColor: 'rgba(75, 192, 192, 1)',
          pointBackgroundColor: 'rgba(75, 192, 192, 1)',
          pointRadius: 3,
          pointHoverRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: { 
            display: true, 
            text: 'Date',
            font: { weight: 'bold' }
          },
          stacked: true
        },
        y: {
          title: { 
            display: true, 
            text: 'Hours',
            font: { weight: 'bold' }
          },
          stacked: true,
          suggestedMin: 0,
          suggestedMax: 16
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            afterLabel: function(context) {
              const datasetLabel = context.dataset.label
              const value = context.raw
              const date = labels[context.dataIndex]
              
              if (datasetLabel.includes('Night')) {
                const records = nightSleeps.filter(r => r.sleep_date === date)
                if (records.length === 0) return []
                
                return records.map(r => `${r.start_time} - ${r.end_time}`)
              } else if (datasetLabel.includes('Day')) {
                const records = daySleeps.filter(r => r.sleep_date === date)
                if (records.length === 0) return []
                
                return records.map(r => `${r.start_time} - ${r.end_time}`)
              } else if (datasetLabel === 'Total Sleep') {
                return [`Total: ${value.toFixed(2)} hours`]
              }
            }
          }
        },
        title: {
          display: todaySleepHours !== null,
          text: todaySleepHours !== null ? `Today's Total Sleep: ${todaySleepHours.toFixed(2)} hours` : '',
          font: {
            size: 16,
            weight: 'bold'
          },
          padding: {
            top: 10,
            bottom: 20
          },
          color: 'rgba(54, 162, 235, 1)'
        }
      }
    }
  })
  
  return sleepChartInstance
}

// Render Feed Chart (shows feeding patterns)
export const renderFeedChart = (feedChartRef, feedRecords) => {
  if (!feedChartRef.value) return
  
  const liquidFeeds = feedRecords.filter(r => r.feed_type === 'Liquid')
  const solidFeeds = feedRecords.filter(r => r.feed_type === 'Solid')
  
  const labels = feedRecords.map(record => record.feed_date)
    .filter((date, index, self) => self.indexOf(date) === index)
    .sort((a, b) => new Date(a) - new Date(b))
    .slice(-14) // Show last 14 days
    
  // Format date labels for display
  const displayLabels = labels.map(date => dayjs(date).format('MMM D'))
    
  // Count feeds by type for each day
  const liquidData = labels.map(date => 
    liquidFeeds.filter(r => r.feed_date === date).length
  )
  
  const solidData = labels.map(date => 
    solidFeeds.filter(r => r.feed_date === date).length
  )
  
  // Calculate liquid amounts for secondary axis
  const liquidAmounts = labels.map(date => {
    const dayRecords = liquidFeeds.filter(r => r.feed_date === date)
    return dayRecords.reduce((sum, record) => {
      const amount = parseFloat(record.feed_amount) || 0
      return sum + amount
    }, 0)
  })
  
  if (feedChartInstance) feedChartInstance.destroy()
  
  feedChartInstance = new Chart(feedChartRef.value, {
    type: 'bar',
    data: {
      labels: displayLabels,
      datasets: [
        {
          label: 'Liquid Feeds',
          data: liquidData,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
          order: 1,
          yAxisID: 'y'
        },
        {
          label: 'Solid Feeds',
          data: solidData,
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1,
          order: 2,
          yAxisID: 'y'
        },
        {
          label: 'Liquid Amount (ml)',
          data: liquidAmounts,
          type: 'line',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          tension: 0.4,
          pointStyle: 'rectRot',
          pointRadius: 5,
          pointBorderColor: 'rgba(255, 99, 132, 1)',
          order: 0,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: { 
            display: true, 
            text: 'Date',
            font: { weight: 'bold' }
          }
        },
        y: {
          title: { 
            display: true, 
            text: 'Number of Feeds',
            font: { weight: 'bold' }
          },
          suggestedMin: 0,
          suggestedMax: 10,
          position: 'left',
          ticks: {
            stepSize: 1
          }
        },
        y1: {
          title: { 
            display: true, 
            text: 'Liquid Amount (ml)',
            font: { weight: 'bold' }
          },
          position: 'right',
          suggestedMin: 0,
          grid: {
            drawOnChartArea: false
          }
        }
      }
    }
  })
  
  return feedChartInstance
}

// Render Nappy Change Chart
export const renderNappyChart = (nappyChartRef, changeNappyRecords) => {
  if (!nappyChartRef.value) return
  
  const labels = changeNappyRecords.map(record => record.change_date)
    .filter((date, index, self) => self.indexOf(date) === index)
    .sort((a, b) => new Date(a) - new Date(b))
  
  // Format date labels for display
  const displayLabels = labels.map(date => dayjs(date).format('MMM D'))
  
  // Count nappy changes by type
  const wetData = labels.map(date => 
    changeNappyRecords.filter(r => r.change_date === date && r.change_type === 'Wet(Pee)nappy').length
  )
  
  const soiledData = labels.map(date => 
    changeNappyRecords.filter(r => r.change_date === date && r.change_type === 'Soiled(Poo)nappy').length
  )
  
  const mixedData = labels.map(date => 
    changeNappyRecords.filter(r => r.change_date === date && r.change_type === 'Mixed(Pee+Poo)nappy').length
  )
  
  const dryData = labels.map(date => 
    changeNappyRecords.filter(r => r.change_date === date && r.change_type === 'Dry nappy').length
  )
  
  if (nappyChartInstance) nappyChartInstance.destroy()
  
  nappyChartInstance = new Chart(nappyChartRef.value, {
    type: 'bar',
    data: {
      labels: displayLabels,
      datasets: [
        {
          label: 'Wet',
          data: wetData,
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Soiled',
          data: soiledData,
          backgroundColor: 'rgba(255, 159, 64, 0.7)',
          borderColor: 'rgba(255, 159, 64, 1)',
          borderWidth: 1
        },
        {
          label: 'Mixed',
          data: mixedData,
          backgroundColor: 'rgba(153, 102, 255, 0.7)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1
        },
        {
          label: 'Dry',
          data: dryData,
          backgroundColor: 'rgba(201, 203, 207, 0.7)',
          borderColor: 'rgba(201, 203, 207, 1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: { 
            display: true, 
            text: 'Date',
            font: { weight: 'bold' }
          },
          stacked: true
        },
        y: {
          title: { 
            display: true, 
            text: 'Number of Changes',
            font: { weight: 'bold' }
          },
          stacked: true,
          suggestedMin: 0,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  })
  
  return nappyChartInstance
}

// Render Weight Chart for Growth Records
export const renderWeightChart = (weightChartRef, growthRecords) => {
  if (!weightChartRef.value) return
  
  // Handle empty data case with a message chart
  if (!growthRecords || !growthRecords.length) {
    if (weightChartInstance) weightChartInstance.destroy()
    
    weightChartInstance = new Chart(weightChartRef.value, {
      type: 'bar',
      data: {
        labels: ['No Data'],
        datasets: [{
          label: 'Weight Records',
          data: [0],
          backgroundColor: 'rgba(200, 200, 200, 0.2)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        scales: {
          y: {
            display: false,
            beginAtZero: true
          }
        }
      }
    })
    
    return weightChartInstance
  }
  
  // Sort by date for chronological display
  const sortedRecords = [...growthRecords].sort((a, b) => 
    new Date(a.growth_date) - new Date(b.growth_date)
  )
  
  // Calculate age in months for each record
  const childDOB = dayjs(selectedChild.value?.date_of_birth || new Date())
  
  // Enhanced x-axis data with better formatting
  const ages = sortedRecords.map(record => {
    const ageInMonths = dayjs(record.growth_date).diff(childDOB, 'month', true);
    // Use years for ages > 12 months
    if (ageInMonths >= 12) {
      return `${(ageInMonths / 12).toFixed(1)}y`;
    }
    return `${ageInMonths.toFixed(1)}m`;
  });
  
  const weights = sortedRecords.map(record => Number(record.weight))
  const dates = sortedRecords.map(record => record.growth_date)
  
  // Calculate optimized bounds with better padding
  const minWeight = Math.min(...weights)
  const maxWeight = Math.max(...weights)
  // Buffer of 20% below min and above max, but at least 1kg
  const range = Math.max(maxWeight - minWeight, 5)
  const buffer = Math.max(range * 0.2, 1)
  
  const yMin = Math.max(0, Math.floor(minWeight - buffer))
  const yMax = Math.ceil(maxWeight + buffer)
  
  if (weightChartInstance) weightChartInstance.destroy()
  
  console.log('Rendering weight chart with data:', weights.length, 'records')
  
  weightChartInstance = new Chart(weightChartRef.value, {
    type: 'line',
    data: {
      labels: ages,
      datasets: [
        {
          label: 'Weight (kg)',
          data: weights,
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 6,
          pointHoverRadius: 8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: { 
            display: true, 
            text: 'Age',
            font: { weight: 'bold', size: 14 }
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            font: { size: 12 },
            padding: 5
          }
        },
        y: { 
          title: { 
            display: true, 
            text: 'Weight (kg)',
            font: { weight: 'bold', size: 14 }
          }, 
          min: yMin,
          max: yMax,
          ticks: {
            font: { size: 12 },
            padding: 8,
            callback: function(value) {
              return value.toFixed(1); // Show one decimal place
            },
            stepSize: (yMax - yMin) <= 10 ? 0.5 : 1 // Dynamic step size based on range
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            font: { size: 13, weight: 'bold' }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 13 },
          padding: 10,
          callbacks: {
            title: function(context) {
              const idx = context[0].dataIndex
              return `${dayjs(dates[idx]).format('YYYY-MM-DD')}`
            },
            label: function(context) {
              const idx = context.dataIndex;
              const ageValue = ages[idx];
              return [
                `Age: ${ageValue}`,
                `Weight: ${weights[idx].toFixed(2)} kg`
              ];
            }
          }
        }
      }
    }
  })
  
  return weightChartInstance
}

// Render Height Chart for Growth Records
export const renderHeightChart = (heightChartRef, growthRecords) => {
  if (!heightChartRef.value) return
  
  // Handle empty data case with a message chart
  if (!growthRecords || !growthRecords.length) {
    if (heightChartInstance) heightChartInstance.destroy()
    
    heightChartInstance = new Chart(heightChartRef.value, {
      type: 'bar',
      data: {
        labels: ['No Data'],
        datasets: [{
          label: 'Height Records',
          data: [0],
          backgroundColor: 'rgba(200, 200, 200, 0.2)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        scales: {
          y: {
            display: false,
            beginAtZero: true
          }
        }
      }
    })
    
    return heightChartInstance
  }
  
  // Sort by date for chronological display
  const sortedRecords = [...growthRecords].sort((a, b) => 
    new Date(a.growth_date) - new Date(b.growth_date)
  )
  
  // Calculate age in months for each record
  const childDOB = dayjs(selectedChild.value?.date_of_birth || new Date())
  
  // Enhanced x-axis data with better formatting
  const ages = sortedRecords.map(record => {
    const ageInMonths = dayjs(record.growth_date).diff(childDOB, 'month', true);
    // Use years for ages > 12 months
    if (ageInMonths >= 12) {
      return `${(ageInMonths / 12).toFixed(1)}y`;
    }
    return `${ageInMonths.toFixed(1)}m`;
  });
  
  const heights = sortedRecords.map(record => Number(record.height))
  const dates = sortedRecords.map(record => record.growth_date)
  
  // Calculate optimized bounds with better padding
  const minHeight = Math.min(...heights)
  const maxHeight = Math.max(...heights)
  // Buffer of 10% below min and above max, but at least 5cm
  const range = Math.max(maxHeight - minHeight, 20)
  const buffer = Math.max(range * 0.1, 5)
  
  const yMin = Math.max(0, Math.floor(minHeight - buffer))
  const yMax = Math.ceil(maxHeight + buffer)
  // Ensure step size is appropriate for the range
  const stepSize = range <= 20 ? 1 : (range <= 50 ? 5 : 10)
  
  if (heightChartInstance) heightChartInstance.destroy()
  
  console.log('Rendering height chart with data:', heights.length, 'records')
  
  heightChartInstance = new Chart(heightChartRef.value, {
    type: 'line',
    data: {
      labels: ages,
      datasets: [
        {
          label: 'Height (cm)',
          data: heights,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 6,
          pointHoverRadius: 8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: { 
            display: true, 
            text: 'Age',
            font: { weight: 'bold', size: 14 }
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            font: { size: 12 },
            padding: 5
          }
        },
        y: { 
          title: { 
            display: true, 
            text: 'Height (cm)',
            font: { weight: 'bold', size: 14 }
          }, 
          min: yMin,
          max: yMax,
          ticks: {
            font: { size: 12 },
            padding: 8,
            stepSize: stepSize
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            font: { size: 13, weight: 'bold' }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 13 },
          padding: 10,
          callbacks: {
            title: function(context) {
              const idx = context[0].dataIndex
              return `${dayjs(dates[idx]).format('YYYY-MM-DD')}`
            },
            label: function(context) {
              const idx = context.dataIndex;
              const ageValue = ages[idx];
              return [
                `Age: ${ageValue}`,
                `Height: ${heights[idx].toFixed(1)} cm`
              ];
            }
          }
        }
      }
    }
  })
  
  return heightChartInstance
}

// Render Temperature Chart 
export const renderTemperatureChart = (temperatureChartRef, temperatureRecords) => {
  if (!temperatureChartRef.value) return
  
  // Sort records by date and time for proper chronological display
  const sortedRecords = [...temperatureRecords].sort((a, b) => {
    const dateA = dayjs(`${a.date} ${a.temperature_time}`)
    const dateB = dayjs(`${b.date} ${b.temperature_time}`)
    return dateA - dateB
  })
  
  // Create formatted labels and temperature data
  const labels = sortedRecords.map(record => 
    `${dayjs(record.date).format('MMM D')} ${record.temperature_time}`
  )
  
  const temperatureData = sortedRecords.map(record => Number(record.temperature))
  const rawDates = sortedRecords.map(record => `${record.date} ${record.temperature_time}`)
  
  // Calculate better min/max values for the chart
  const minTemp = Math.min(...temperatureData, 36.0)
  const maxTemp = Math.max(...temperatureData, 38.5)
  const yAxisMin = Math.floor(minTemp * 10) / 10 - 0.5
  const yAxisMax = Math.ceil(maxTemp * 10) / 10 + 0.5
  
  // Calculate normal range boundaries with appropriate length
  const normalLow = Array(labels.length).fill(36.5)
  const normalHigh = Array(labels.length).fill(37.5)
  const feverLine = Array(labels.length).fill(38.0)
  
  if (temperatureChartInstance) temperatureChartInstance.destroy()
  
  temperatureChartInstance = new Chart(temperatureChartRef.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Temperature (°C)',
          data: temperatureData,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          fill: false,
          tension: 0.4,
          pointRadius: 6,
          pointHoverRadius: 8,
          borderWidth: 2,
          order: 1
        },
        {
          label: 'Normal Low (36.5°C)',
          data: normalLow,
          borderColor: 'rgba(75, 192, 192, 0.7)',
          borderDash: [5, 5],
          borderWidth: 1,
          pointRadius: 0,
          fill: false,
          order: 4
        },
        {
          label: 'Normal High (37.5°C)',
          data: normalHigh,
          borderColor: 'rgba(75, 192, 192, 0.7)',
          borderDash: [5, 5],
          borderWidth: 1,
          pointRadius: 0,
          fill: '+1',
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          order: 3
        },
        {
          label: 'Fever (38.0°C+)',
          data: feverLine,
          borderColor: 'rgba(255, 159, 64, 0.8)',
          borderDash: [3, 3],
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
          order: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            title: (context) => {
              const idx = context[0].dataIndex
              return `Temperature at ${dayjs(rawDates[idx]).format('MMM D, YYYY HH:mm')}`
            },
            label: (context) => {
              if (context.dataset.label === 'Temperature (°C)') {
                const value = context.parsed.y
                let status = 'Normal'
                if (value >= 38.0) status = 'Fever'
                else if (value >= 37.5) status = 'Elevated'
                return `${context.dataset.label}: ${value}°C (${status})`
              }
              return context.dataset.label
            }
          }
        },
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 15,
            filter: function(item) {
              return !item.text.includes('Normal Range')
            }
          }
        }
      },
      scales: {
        x: {
          title: { 
            display: true, 
            text: 'Date & Time',
            font: {
              weight: 'bold'
            }
          },
          ticks: { 
            maxRotation: 45, 
            minRotation: 45 
          },
          grid: {
            display: false
          }
        },
        y: {
          title: { 
            display: true, 
            text: 'Temperature (°C)',
            font: {
              weight: 'bold'
            }
          },
          min: yAxisMin,
          max: yAxisMax,
          ticks: {
            stepSize: 0.5,
            callback: function(value) {
              return value + '°C'
            }
          }
        }
      }
    }
  })
  
  return temperatureChartInstance
}

// Render Combined Growth Chart (Height and Weight in one chart)
export const renderCombinedGrowthChart = (chartRef, growthRecords) => {
  if (!chartRef.value) return
  
  // Handle empty data case with a message chart
  if (!growthRecords || !growthRecords.length) {
    if (combinedGrowthChartInstance) combinedGrowthChartInstance.destroy()
    
    combinedGrowthChartInstance = new Chart(chartRef.value, {
      type: 'bar',
      data: {
        labels: ['No Data'],
        datasets: [{
          label: 'Growth Records',
          data: [0],
          backgroundColor: 'rgba(200, 200, 200, 0.2)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        scales: {
          y: {
            display: false,
            beginAtZero: true
          }
        }
      }
    })
    
    return combinedGrowthChartInstance
  }
  
  // Sort by date for chronological display
  const sortedRecords = [...growthRecords].sort((a, b) => 
    new Date(a.growth_date) - new Date(b.growth_date)
  )
  
  // Calculate age in months for each record
  const childDOB = dayjs(selectedChild.value?.date_of_birth || new Date())
  
  // Enhanced x-axis data with better formatting
  const ages = sortedRecords.map(record => {
    const ageInMonths = dayjs(record.growth_date).diff(childDOB, 'month', true);
    // Use years for ages > 12 months
    if (ageInMonths >= 12) {
      return `${(ageInMonths / 12).toFixed(1)}y`;
    }
    return `${ageInMonths.toFixed(1)}m`;
  });
  
  // Format dates for display
  const formattedDates = sortedRecords.map(record => 
    dayjs(record.growth_date).format('MM/DD')
  );
  
  // Create composite labels with date and age
  const compositeLabels = formattedDates.map((date, index) => 
    `${date} (${ages[index]})`
  );
  
  const heights = sortedRecords.map(record => Number(record.height))
  const weights = sortedRecords.map(record => Number(record.weight))
  const dates = sortedRecords.map(record => record.growth_date)
  
  if (combinedGrowthChartInstance) combinedGrowthChartInstance.destroy()
  
  console.log('Rendering combined growth chart with data:', heights.length, 'records')
  
  combinedGrowthChartInstance = new Chart(chartRef.value, {
    type: 'line',
    data: {
      labels: compositeLabels,
      datasets: [
        {
          label: 'Height (cm)',
          data: heights,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 6,
          pointHoverRadius: 8,
          yAxisID: 'y-height'
        },
        {
          label: 'Weight (kg)',
          data: weights,
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 6,
          pointHoverRadius: 8,
          yAxisID: 'y-weight'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: { 
            display: true, 
            text: 'Date (Age)',
            font: { weight: 'bold', size: 14 }
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            font: { size: 11 },
            padding: 5,
            autoSkip: false,
            maxRotation: 45,
            minRotation: 45
          }
        },
        'y-height': { 
          type: 'linear',
          position: 'left',
          title: { 
            display: true, 
            text: 'Height (cm)',
            font: { weight: 'bold', size: 14 },
            color: 'rgba(54, 162, 235, 1)'
          },
          ticks: {
            font: { size: 12 },
            padding: 8,
            color: 'rgba(54, 162, 235, 1)'
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        'y-weight': {
          type: 'linear',
          position: 'right',
          title: { 
            display: true, 
            text: 'Weight (kg)',
            font: { weight: 'bold', size: 14 },
            color: 'rgba(255, 99, 132, 1)'
          },
          ticks: {
            font: { size: 12 },
            padding: 8,
            color: 'rgba(255, 99, 132, 1)'
          },
          grid: {
            display: false
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Child Growth Chart',
          font: { size: 16, weight: 'bold' }
        },
        legend: {
          labels: {
            font: { size: 13, weight: 'bold' }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 13 },
          padding: 10,
          callbacks: {
            title: function(context) {
              const idx = context[0].dataIndex
              return `${dayjs(dates[idx]).format('YYYY-MM-DD')}`
            },
            label: function(context) {
              const idx = context.dataIndex;
              const ageValue = ages[idx];
              
              if (context.dataset.label.includes('Height')) {
                return [
                  `Age: ${ageValue}`,
                  `Height: ${heights[idx].toFixed(1)} cm`
                ];
              } else {
                return [
                  `Age: ${ageValue}`,
                  `Weight: ${weights[idx].toFixed(2)} kg`
                ];
              }
            }
          }
        }
      }
    }
  })
  
  return combinedGrowthChartInstance
} 