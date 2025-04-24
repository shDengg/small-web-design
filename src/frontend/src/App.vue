<script setup>
import { computed, onMounted, watch } from 'vue'
import { currentChildId, children, editDialogVisible, getCurrentChild, fetchChildren, addDialogVisible } from './store'
import AppHeader from './components/AppHeader.vue'
import ChildrenList from './components/ChildrenList.vue'
import Dashboard from './components/Dashboard.vue'
import ChildForms from './components/ChildForms.vue'
import RecordDialogs from './components/RecordDialogs.vue'

// Check if this is the first visit based on children data
const isFirstVisit = computed(() => children.value.length === 0)

// When app mounts, fetch children data
onMounted(async () => {
  await fetchChildren()
  
  // If there are children, set the first one as current
  if (children.value.length > 0 && !currentChildId.value) {
    currentChildId.value = children.value[0].id
  }
})

// Function to show the add child dialog
const showAddChildDialog = () => {
  addDialogVisible.value = true
}

// Update child data when currentChildId changes
watch(currentChildId, () => {
  if (currentChildId.value) {
    getCurrentChild()
  }
}, { immediate: true })
</script>

<template>
  <div class="app-container">
    <app-header />
    
    <div class="main-content">
      <div class="left-panel" v-if="!isFirstVisit">
        <children-list />
        </div>
      
      <div class="right-panel" v-if="!isFirstVisit && currentChildId">
        <dashboard />
      </div>
      
      <div class="welcome-container" v-if="isFirstVisit">
        <div class="welcome-content">
          <h1>Welcome to Children Care Tracker</h1>
          <p>Track your child's sleep, feeding, growth, and more in one simple app.</p>
          <el-button type="primary" size="large" @click="showAddChildDialog">Get Started</el-button>
          </div>
          </div>
        </div>
        
    <child-forms />
    <record-dialogs />
          </div>
          </template>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
}

#app {
  height: 100%;
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f7fa;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.left-panel {
  width: 450px;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  padding: 20px;
}

.right-panel {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.welcome-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f5ff;
}

.welcome-content {
  text-align: center;
  padding: 40px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  max-width: 600px;
}

.welcome-content h1 {
  color: #409EFF;
  margin-bottom: 20px;
}

.welcome-content p {
  color: #606266;
  font-size: 18px;
  margin-bottom: 30px;
}

@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
  }
  
  .left-panel {
    width: 100%;
    max-height: 250px;
  }
}
</style>
