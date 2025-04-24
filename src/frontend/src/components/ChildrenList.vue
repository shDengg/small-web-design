<template>
  <!-- Left panel with children list -->
  <div class="children-panel">
    <div class="panel-header">
      <h2>Children list</h2>
    </div>
    <el-table 
      :data="children" 
      class="children-table"
      :row-class-name="tableRowClassName"
      @row-click="selectChild"
      height="calc(100vh - 200px)"
    >
      <el-table-column label="Name" prop="name" align="left"/>
      <el-table-column label="Sex" prop="sex" align="center" width="80"/>
      <el-table-column label="Age" width="100" align="center">
        <template #default="scope">
          {{ calculateAge(scope.row.date_of_birth) }}
        </template>
      </el-table-column>
      <el-table-column width="160" align="center">
        <template #default="scope">
          <div class="table-actions">
            <el-button 
              size="small" 
              type="primary" 
              @click="handleEdit(scope.$index, scope.row)"
              class="action-btn edit-btn"
            >
              <i class="el-icon-edit"></i> Edit
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleDelete(scope.$index, scope.row)"
              class="action-btn delete-btn"
            >
              <i class="el-icon-delete"></i> Delete
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { children, currentChildId, editDialogVisible } from '../store'
import { calculateAge, fetchAllRecordsForCurrentChild, fetchChildren } from '../store'
import { childForm } from '../utils/formModels'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

// Function to style table rows
const tableRowClassName = ({ row, rowIndex }) => {
  // Add selected class if this row is the selected child
  if (row.id === currentChildId.value) {
    return 'selected-row'
  }
  // Keep zebra striping for better readability
  if (rowIndex % 2 === 0) {
    return 'even-row'
  }
  return 'odd-row'
}

// Add a function to directly select a child from the table
const selectChild = (row) => {
  currentChildId.value = row.id
  fetchAllRecordsForCurrentChild()
}

// Prepares form for editing an existing child
const handleEdit = (index, row) => {
  Object.assign(childForm, row)
  currentChildId.value = row.id
  editDialogVisible.value = true
}

// Confirms and processes child record deletion
const handleDelete = (index, row) => {
  ElMessageBox.confirm('This will permanently delete the child record and all related records. Continue?', 'Warning', {
    confirmButtonText: 'Yes',
    cancelButtonText: 'No',
    type: 'warning'
  }).then(() => {
    axios.delete(`http://127.0.0.1:5000/children/${row.id}`)
        .then(() => {
          ElMessage.success('Child and all related records deleted successfully')
          
          // Reset currentChildId if we deleted the currently selected child
          if (currentChildId.value === row.id) {
            currentChildId.value = null
          }
          
          // Refresh the children list
          fetchChildren().then(() => {
            // If there are still children and no child is selected, select the first one
            if (children.value.length > 0 && !currentChildId.value) {
              currentChildId.value = children.value[0].id
              fetchAllRecordsForCurrentChild()
            }
          })
        })
        .catch(error => {
          console.error('Failed to delete child:', error)
          ElMessage.error('Failed to delete child')
        })
  }).catch(() => {
    // Cancelled deletion
  })
}
</script>

<style scoped>
.children-panel {
  width: 450px;
  min-width: 300px;
  border-right: 1px solid #eaecef;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 16px 24px;
  border-bottom: 1px solid #eaecef;
}

.panel-header h2 {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
  color: #1d1d1f;
  text-align: center;
}

.children-table {
  flex: 1;
  overflow-y: auto;
}

:deep(.selected-row) {
  background-color: #ecf5ff !important;
}

:deep(.el-table--striped .even-row) {
  background-color: #f9f9f9;
}

.table-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.table-actions .el-button {
  padding: 6px 12px;
}

.action-btn {
  border-radius: 6px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-weight: 500;
}

.action-btn:hover {
  transform: translateY(-2px);
}

.edit-btn {
  background-color: #3498db;
  border-color: #3498db;
}

.delete-btn {
  background-color: #e74c3c;
  border-color: #e74c3c;
}

/* Responsive styles */
@media (max-width: 1024px) {
  .children-panel {
    width: 100%;
    min-width: auto;
    border-right: none;
    border-bottom: 1px solid #eaecef;
  }
  
  .children-table {
    max-height: 300px;
  }
}
</style> 