<template>
  <div class="dashboard-layout">
    <Sidebar />
    <div class="main-wrapper">
      <TopNav />
      <main class="content-area">
        <p class="demo-notice">Demo data: agronomist services are pending backend integration.</p>
        <router-view></router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import Sidebar from '../components/layout/Sidebar.vue'
import TopNav from '../components/layout/TopNav.vue'
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f8f9fa;
  font-family: 'Inter', sans-serif;
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0; /* Important to prevent flex children from blowing out width */
}

.content-area {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
}

.demo-notice {
  background: #fff8df;
  border: 1px solid #f0d98d;
  border-radius: 6px;
  color: #725600;
  font-size: 13px;
  margin: 0 0 18px;
  padding: 10px 12px;
}
</style>
