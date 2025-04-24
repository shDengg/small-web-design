<template>
  <header class="dashboard-header">
    <div class="branding">
      <h1>Children Care Tracker</h1>
      <div class="current-datetime">
        {{ currentDateTime }}
      </div>
    </div>
    <div class="header-actions">
      <el-button class="add-button" @click="addDialogVisible = true">
        <i class="el-icon-plus"></i> Add Child
      </el-button>
      
      <div class="report-controls">
        <el-date-picker 
          v-model="reportDate" 
          type="date" 
          placeholder="Select Report Date" 
          value-format="YYYY-MM-DD"
          class="date-picker"
          :disabled-date="disableFutureDate"
        ></el-date-picker>
        <el-button class="report-button" @click="generateDailyReport">
          Generate Report
        </el-button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { currentDateTime, reportDate, addDialogVisible, currentChildId } from '../store'
import { disableFutureDate, startRealtimeClock, stopRealtimeClock } from '../store'
import { jsPDF } from 'jspdf'
import axios from 'axios'
import { ElMessage, ElLoading } from 'element-plus'
import dayjs from 'dayjs'
import { onMounted, onUnmounted } from 'vue'

// Start the real-time clock when component is mounted
onMounted(() => {
  startRealtimeClock()
})

// Clean up the interval when component is unmounted
onUnmounted(() => {
  stopRealtimeClock()
})

// Enhanced PDF Daily Report Generation
async function generateDailyReport() {
  if (!currentChildId.value) {
    ElMessage.error('Please select a child from the table first.')
    return
  }

  try {
    // Show loading indicator
    const loading = ElLoading.service({
      lock: true,
      text: 'Generating report...',
      background: 'rgba(255, 255, 255, 0.7)'
    });

    // Fetch dynamic data from the enhanced backend endpoint
    const response = await axios.get(`http://127.0.0.1:5000/api/children/${currentChildId.value}/daily-report`, {
      params: { date: reportDate.value }
    });
    
    const reportData = response.data;
    const childData = reportData.child;
    const recordsData = reportData.records;
    
    // Generate PDF with optimized layout
    const doc = new jsPDF();
    
    // Constants for document layout
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    
    // Function to manage page breaks and reset y position
    const checkPageBreak = (yPosition, requiredSpace = 40) => {
      if (yPosition + requiredSpace > pageHeight - 20) {
        doc.addPage();
        // Add header to new page
        doc.setFillColor(41, 128, 185); // Blue header
        doc.rect(0, 0, 22, pageWidth, 'F'); 
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Daily Report', pageWidth / 2, 14, { align: 'center' });
        return 35; // Return new y position after page break
      }
      return yPosition;
    };
    
    // Set up the header
    doc.setFillColor(41, 128, 185); // Blue header
    doc.rect(0, 0, pageWidth, 22, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Daily Report', pageWidth / 2, 14, { align: 'center' });
    
    let y = 30;
    
    // CHILD INFORMATION
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Name: ${childData.name}`, margin, y);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${dayjs(reportDate.value).format('DD/MM/YYYY')}`, margin, y + 10);
    
    y += 25;
    
    // MEALS SECTION
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Meals:', margin, y);
    y += 10;
    
    // Format meals from feeding records
    if (recordsData.feeding && recordsData.feeding.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      // Sort by time
      const sortedFeeds = [...recordsData.feeding].sort((a, b) => 
        a.feed_time.localeCompare(b.feed_time));
      
      for (const feed of sortedFeeds) {
        const mealText = `${feed.feed_type} at ${feed.feed_time}: ${feed.food_name}: ${feed.feed_amount}.`;
        doc.text(mealText, margin + 5, y);
        y += 8;
        y = checkPageBreak(y);
      }
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text("No meals recorded for this day.", margin + 5, y);
      y += 8;
    }
    
    y += 5;
    
    // SLEEP TIME SECTION
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Sleep time:', margin, y);
    y += 10;
    
    if (recordsData.sleep && recordsData.sleep.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      // Sort by sleep type and start time
      const sortedSleep = [...recordsData.sleep].sort((a, b) => {
        if (a.sleep_type !== b.sleep_type) {
          return a.sleep_type === "Day time nap" ? -1 : 1;
        }
        return a.start_time.localeCompare(b.start_time);
      });
      
      for (const sleep of sortedSleep) {
        const sleepText = `${sleep.sleep_type}: ${sleep.start_time} to ${sleep.end_time}`;
        doc.text(sleepText, margin + 5, y);
        y += 8;
        y = checkPageBreak(y);
      }
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text("No sleep records for this day.", margin + 5, y);
      y += 8;
    }
    
    y += 5;
    
    // NAPPY CHANGES/TOILET SECTION
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Nappy changes/Toilet:', margin, y);
    y += 10;
    
    if (recordsData.nappy && recordsData.nappy.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      // Sort by time
      const sortedNappy = [...recordsData.nappy].sort((a, b) => 
        a.change_time.localeCompare(b.change_time));
      
      for (const nappy of sortedNappy) {
        const nappyText = `${nappy.change_type} nappy at ${nappy.change_time}`;
        doc.text(nappyText, margin + 5, y);
        y += 8;
        y = checkPageBreak(y);
      }
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text("No nappy changes recorded for this day.", margin + 5, y);
      y += 8;
    }
    
    y += 5;
    
    // TEMPERATURE SECTION
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Temperature:', margin, y);
    y += 10;
    
    if (recordsData.temperature && recordsData.temperature.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      // Sort by time
      const sortedTemp = [...recordsData.temperature].sort((a, b) => 
        a.temperature_time.localeCompare(b.temperature_time));
      
      for (const temp of sortedTemp) {
        // Add visual indicators for elevated temperatures
        const tempValue = parseFloat(temp.temperature);
        let tempText = `${temp.temperature} degrees at ${temp.temperature_time}`;
        
        if (tempValue >= 38.0) {
          doc.setTextColor(231, 76, 60); // Red for fever
        } else if (tempValue >= 37.5) {
          doc.setTextColor(243, 156, 18); // Orange for elevated
        }
        
        doc.text(tempText, margin + 5, y);
        doc.setTextColor(0, 0, 0); // Reset text color
        y += 8;
        y = checkPageBreak(y);
      }
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text("No temperature records for this day.", margin + 5, y);
      y += 8;
    }
    
    y += 5;
    
    // MEDICATION SECTION
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Medication:', margin, y);
    y += 10;
    
    if (recordsData.medication && recordsData.medication.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      // Sort by time
      const sortedMeds = [...recordsData.medication].sort((a, b) => 
        a.medication_time.localeCompare(b.medication_time));
      
      for (const med of sortedMeds) {
        const medText = `${med.medication_type} at ${med.medication_time}`;
        doc.text(medText, margin + 5, y);
        y += 8;
        y = checkPageBreak(y);
      }
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text("No medication given this day.", margin + 5, y);
      y += 8;
    }
    
    // Generate and save PDF
    const filename = `${childData.name}_DailyReport_${reportDate.value}.pdf`;
    doc.save(filename);
    
    ElMessage.success(`Report saved as ${filename}`);
  } catch (error) {
    console.error('Failed to generate report:', error);
    ElMessage.error('Failed to generate report: ' + (error.message || 'Unknown error'));
  } finally {
    ElLoading.service().close();
  }
}
</script>

<style scoped>
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #eaecef;
}

.branding {
  display: flex;
  flex-direction: column;
}

.branding h1 {
  font-size: 22px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0;
}

.current-datetime {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.header-actions {
  display: flex;
  gap: 16px;
}

.add-button {
  background-color: #3498db;
  color: white;
  border: none;
  font-weight: 500;
}

.report-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-picker {
  width: 180px;
}

.report-button {
  background-color: #2ecc71;
  color: white;
  border: none;
  font-weight: 500;
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .header-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .report-controls {
    width: 100%;
  }
}
</style> 