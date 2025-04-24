<template>
  <!-- Add Child Dialog -->
  <el-dialog @open="resetFormWithValidation(childForm, childFormRef)" title="Add Child" align-center v-model="addDialogVisible" width="30%">
    <el-form ref="childFormRef" :model="childForm"
             :rules="childInformationRules"
             status-icon label-width="120px">
      <el-form-item label="Name" prop="name">
        <el-input 
          v-model="childForm.name"
          autocomplete="off"
          placeholder="Enter child's full name"
          :maxlength="30"
        >
          <template #suffix>
            <el-tooltip content="Enter the child's full name" placement="top">
              <i class="el-icon-question"></i>
            </el-tooltip>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="Sex" prop="sex">
        <el-radio-group v-model="childForm.sex">
          <el-radio-button label="Male" value="Male" />
          <el-radio-button label="Female" value="Female" />
        </el-radio-group>
      </el-form-item>
      <el-form-item label="Birthday" prop="date_of_birth">
        <el-date-picker 
          v-model="childForm.date_of_birth" 
          type="date" 
          placeholder="Select birth date" 
          value-format="YYYY-MM-DD" 
          :disabled-date="disableFutureDate"
        />
        <div class="form-tip">Birth date cannot be in the future</div>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitForm">Submit</el-button>
        <el-button @click="resetFormData(childForm)">Reset</el-button>
      </el-form-item>
    </el-form>
  </el-dialog>

  <!-- Edit Child Dialog -->
  <el-dialog title="Edit Child" v-model="editDialogVisible" width="30%" align-center>
    <el-form ref="editFormRef" :model="childForm" :rules="childInformationRules" status-icon label-width="120px">
      <el-form-item label="Name" prop="name">
        <el-input v-model="childForm.name" autocomplete="off"/>
      </el-form-item>
      <el-form-item label="Sex" prop="sex">
        <el-select v-model="childForm.sex">
          <el-option value="Male" label="Male"></el-option>
          <el-option value="Female" label="Female"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="Birthday" prop="date_of_birth">
        <el-date-picker v-model="childForm.date_of_birth" 
                        type="date" 
                        placeholder="Select Date" 
                        value-format="YYYY-MM-DD" 
                        :disabled-date="disableFutureDate"/>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitEditForm">Submit</el-button>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { addDialogVisible, editDialogVisible, currentChildId, fetchChildren } from '../store'
import { disableFutureDate } from '../store'
import { childInformationRules, childForm } from '../utils/formModels'
import { resetFormData, resetFormWithValidation } from '../utils/formHelpers'
import axios from 'axios'
import { ElMessage, ElLoading } from 'element-plus'

// Form DOM references for validation and reset operations
const childFormRef = ref(null)
const editFormRef = ref(null)

// Validates and submits new child form to backend
const submitForm = () => {
  childFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const loading = ElLoading.service({
          lock: true,
          text: 'Adding child...',
          background: 'rgba(255, 255, 255, 0.7)'
        });
        
        const response = await axios.post('http://127.0.0.1:5000/children/', childForm);
         
        if (response.status >= 200 && response.status < 300) {
          ElMessage.success('Child added successfully');
          await fetchChildren(); // Wait for refresh to complete
          addDialogVisible.value = false;
          childFormRef.value.resetFields();
          resetFormData(childForm);
        } else {
          ElMessage.error(`Failed to add child: ${response.statusText}`);
        }
      } catch (error) {
        console.error('Failed to add child:', error);
        
        if (error.response) {
          ElMessage.error(`Error: ${error.response.data.message || 'Server error'}`);
        } else if (error.request) {
          ElMessage.error('No response from server. Please check your connection.');
        } else {
          ElMessage.error(`Error: ${error.message}`);
        }
      } finally {
        // Always close loading indicator
        ElLoading.service().close();
      }
    } else {
      console.log('Validation failed for adding child');
      ElMessage.warning('Please fix form errors before submitting');
      return false;
    }
  });
}

// Validates and submits edited child data
const submitEditForm = () => {
  editFormRef.value.validate((valid) => {
    if (valid) {
      axios.put(`http://127.0.0.1:5000/children/${currentChildId.value}`, childForm)
          .then(() => {
            ElMessage.success('Child updated successfully')
            fetchChildren()
            editDialogVisible.value = false
            resetFormData(childForm)
          })
          .catch(error => {
            console.error('Failed to update child:', error)
            ElMessage.error('Failed to update child')
          })
    } else {
      console.log('Validation failed for editing child')
      return false
    }
  })
}
</script>

<style scoped>
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style> 