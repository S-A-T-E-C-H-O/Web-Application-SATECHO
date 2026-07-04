<script setup>
import { onMounted } from 'vue'
import { useAdminStore } from '@/bounded-contexts/admin/application/stores/admin.store'

const store = useAdminStore()

onMounted(() => store.loadFarms())

const toggleActive = (farm) => {
  if (farm.active) {
    if (!window.confirm(`Deactivate "${farm.name}"? Its devices will stop accepting telemetry.`)) return
    store.deactivateFarm(farm.id)
  } else {
    store.reactivateFarm(farm.id)
  }
}
</script>

<template>
  <div class="content-page">
    <div class="page-heading">
      <h1>Farms</h1>
      <p>Oversee every farm registered on the platform.</p>
    </div>

    <p v-if="store.error" class="error-text">{{ store.error }}</p>

    <table class="data-table">
      <thead>
        <tr>
          <th>Farm ID</th>
          <th>Name</th>
          <th>Owner</th>
          <th>Plan</th>
          <th>Active devices</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="farm in store.farms" :key="farm.id">
          <td>{{ farm.id }}</td>
          <td>{{ farm.name }}</td>
          <td>{{ farm.ownerEmail || '—' }}</td>
          <td>{{ farm.planTier || '—' }}</td>
          <td>{{ farm.activeDeviceCount }}</td>
          <td>
            <span :class="['status-pill', farm.active ? 'success' : 'danger']">{{ farm.active ? 'Active' : 'Inactive' }}</span>
          </td>
          <td>
            <button class="outline-button slim" @click="toggleActive(farm)">
              {{ farm.active ? 'Deactivate' : 'Reactivate' }}
            </button>
          </td>
        </tr>
        <tr v-if="!store.isLoading && store.farms.length === 0">
          <td colspan="7" class="empty-cell">No farms found.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.content-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-heading h1 {
  margin: 0 0 6px;
  font-size: 24px;
}

.page-heading p {
  margin: 0;
  color: #666;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
}

.data-table th,
.data-table td {
  text-align: left;
  padding: 12px 14px;
  border-bottom: 1px solid #eee;
  font-size: 14px;
}

.status-pill {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-pill.success {
  background: #e5f5ea;
  color: #2e7d43;
}

.status-pill.danger {
  background: #fbe6e6;
  color: #c62828;
}

.outline-button.slim {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #ccc;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
}

.error-text {
  color: #c62828;
}

.empty-cell {
  text-align: center;
  color: #888;
  padding: 24px;
}
</style>
