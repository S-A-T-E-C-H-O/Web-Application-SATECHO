<template>
  <main class="auth-layout">
    <slot />
  </main>
</template>

<style scoped>
.auth-layout {
  min-height: 100vh;

  display: flex;
  justify-content: center;
  align-items: center;

  padding: 24px;
}
</style>