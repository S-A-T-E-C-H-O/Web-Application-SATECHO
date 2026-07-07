<template>
  <div class="dashboard-layout">
    <Sidebar />
    <div class="main-wrapper">
      <TopNav />
      <main class="content-area">
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
  --sidebar-width: 250px;
  display: flex;
  min-height: 100vh;
  background-color: #f8f9fa;
  font-family: 'Inter', sans-serif;
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  margin-left: var(--sidebar-width, 250px);
}
.content-area {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
}
</style>
