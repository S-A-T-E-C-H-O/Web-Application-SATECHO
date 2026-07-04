<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAdminStore } from '@/bounded-contexts/admin/application/stores/admin.store'

const store = useAdminStore()
const roleFilter = ref('')

const load = () => store.loadUsers({ role: roleFilter.value || undefined })

onMounted(load)

const toggleBlock = (user) => {
  if (user.blocked) {
    store.unblockUser(user.id)
  } else {
    store.blockUser(user.id)
  }
}

const statusLabel = computed(() => (user) => (user.blocked ? 'Blocked' : 'Active'))
</script>

<template>
  <div class="content-page">
    <div class="page-heading">
      <h1>Users</h1>
      <p>Manage every account registered on the platform.</p>
    </div>

    <div class="toolbar">
      <label class="select-filter">
        <span>Role</span>
        <select v-model="roleFilter" @change="load">
          <option value="">All</option>
          <option value="FARMER">Farmer</option>
          <option value="AGRONOMIST">Agronomist</option>
          <option value="ADMIN">Admin</option>
        </select>
      </label>
    </div>

    <p v-if="store.error" class="error-text">{{ store.error }}</p>

    <table class="data-table">
      <thead>
        <tr>
          <th>Email</th>
          <th>Full name</th>
          <th>Role(s)</th>
          <th>Status</th>
          <th>Registered</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in store.users" :key="user.id">
          <td>{{ user.email }}</td>
          <td>{{ user.fullName }}</td>
          <td>{{ (user.roles || []).join(', ') }}</td>
          <td>
            <span :class="['status-pill', user.blocked ? 'danger' : 'success']">{{ statusLabel(user) }}</span>
          </td>
          <td>{{ user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—' }}</td>
          <td>
            <button class="outline-button slim" @click="toggleBlock(user)">
              {{ user.blocked ? 'Unblock' : 'Block' }}
            </button>
          </td>
        </tr>
        <tr v-if="!store.isLoading && store.users.length === 0">
          <td colspan="6" class="empty-cell">No users found.</td>
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

.toolbar {
  display: flex;
  gap: 12px;
}

.select-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #555;
}

.select-filter select {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #ddd;
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
