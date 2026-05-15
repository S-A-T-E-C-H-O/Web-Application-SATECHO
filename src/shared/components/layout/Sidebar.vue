<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/bounded-contexts/auth/application/stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()
const isUserMenuOpen = ref(false)

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

const closeSession = () => {
  authStore.logout()
  isUserMenuOpen.value = false
  router.push('/login')
}
</script>

<template>
  <aside class="sidebar">
    <div class="logo">
      <span class="material-symbols-outlined logo-icon">eco</span>
      <div>
        <h2>AgroSafe</h2>
        <small>Field Management</small>
      </div>
    </div>

    <nav class="nav-menu">
      <router-link to="/dashboard/agronomist" class="nav-link" exact-active-class="active">
        <span class="material-symbols-outlined">dashboard</span>
        Dashboard
      </router-link>
      <router-link to="/dashboard/agronomist/parcels" class="nav-link" active-class="active">
        <span class="material-symbols-outlined">local_florist</span>
        Parcels
      </router-link>
      <router-link to="/dashboard/agronomist/priority-cases" class="nav-link" active-class="active">
        <span class="material-symbols-outlined">warning</span>
        Priority Cases
        <span class="badge red">2</span>
      </router-link>
      <a href="#" class="nav-link">
        <span class="material-symbols-outlined">bar_chart</span>
        Analysis
      </a>
      <a href="#" class="nav-link">
        <span class="material-symbols-outlined">tune</span>
        Thresholds
      </a>
      <a href="#" class="nav-link">
        <span class="material-symbols-outlined">security</span>
        Security
      </a>
      <a href="#" class="nav-link">
        <span class="material-symbols-outlined">sensors</span>
        Devices
      </a>
      <a href="#" class="nav-link">
        <span class="material-symbols-outlined">notifications</span>
        Notifications
      </a>
    </nav>

    <div class="sidebar-user-wrapper">
      <button class="sidebar-user" @click="toggleUserMenu">
        <img src="https://i.pravatar.cc/150?img=11" alt="User Profile" class="avatar">
        <div class="user-info">
          <strong>Dr. Mateo Vargas</strong>
          <small>Agronomist</small>
        </div>
        <span class="material-symbols-outlined expand-icon">expand_more</span>
      </button>

      <div v-if="isUserMenuOpen" class="sidebar-user-menu">
        <button class="sidebar-user-menu-item" @click="closeSession">
          <span class="material-symbols-outlined">logout</span>
          Log out
        </button>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 250px;
  background-color: #fcfcfc;
  border-right: 1px solid #eaeaea;
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: sticky;
  top: 0;
}

.logo {
  padding: 24px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 32px;
  color: #456c4c;
}

.logo h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
  font-weight: 700;
}

.logo small {
  font-size: 11px;
  color: #888;
}

.nav-menu {
  flex: 1;
  padding: 10px 0;
  display: flex;
  flex-direction: column;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  color: #666;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  position: relative;
}

.nav-link:hover {
  background-color: #f5f5f5;
  color: #333;
}

.nav-link.active {
  background-color: #edf2ed;
  color: #456c4c;
  border-right: 4px solid #456c4c;
}

.nav-link .material-symbols-outlined {
  font-size: 20px;
}

.badge {
  margin-left: auto;
  background: #c62828;
  color: white;
  font-size: 11px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 10px;
}

/* User Profile & Logout Menu */
.sidebar-user-wrapper {
  position: relative;
  border-top: 1px solid #eaeaea;
}

.sidebar-user {
  width: 100%;
  border: none;
  background: transparent;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s;
}

.sidebar-user:hover {
  background: #f5f5f5;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.user-info strong {
  font-size: 14px;
  color: #333;
}

.user-info small {
  font-size: 12px;
  color: #888;
}

.expand-icon {
  color: #888;
  font-size: 20px;
}

.sidebar-user-menu {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 84px; /* Just above the user button */
  background: #fff;
  border: 1px solid #eaeaea;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(16, 24, 40, 0.12);
  z-index: 12;
  padding: 6px;
}

.sidebar-user-menu-item {
  width: 100%;
  min-height: 38px;
  border: 0;
  background: transparent;
  border-radius: 8px;
  color: #ad1f1f;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
}

.sidebar-user-menu-item:hover {
  background: #f8ecec;
}

.sidebar-user-menu-item .material-symbols-outlined {
  font-size: 18px;
}
</style>
