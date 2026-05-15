<template>
  <header class="topnav">
    <div class="search-bar">
      <span class="material-symbols-outlined search-icon">search</span>
      <input type="text" placeholder="Search parcels, crops, or alerts...">
    </div>
    
    <div class="actions">
      <button class="icon-btn">
        <span class="material-symbols-outlined">help_outline</span>
      </button>
      <button class="icon-btn">
        <span class="material-symbols-outlined">settings</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.topnav {
  height: 70px;
  background-color: #ffffff;
  border-bottom: 1px solid #eaeaea;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
}

.search-bar {
  display: flex;
  align-items: center;
  background-color: #fcfcfc;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  padding: 8px 16px;
  width: 400px;
}

.search-icon {
  color: #999;
  font-size: 20px;
  margin-right: 8px;
}

.search-bar input {
  border: none;
  background: transparent;
  width: 100%;
  font-size: 14px;
  color: #333;
  outline: none;
}

.search-bar input::placeholder {
  color: #bbb;
}

.actions {
  display: flex;
  gap: 16px;
}

.icon-btn {
  background: transparent;
  border: none;
  color: #555;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 50%;
  transition: background 0.2s;
}

.icon-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.icon-btn .material-symbols-outlined {
  font-size: 24px;
}
</style>
