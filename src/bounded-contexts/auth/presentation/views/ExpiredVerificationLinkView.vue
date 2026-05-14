<template>
  <div class="expired-page">

    <!-- TOPBAR -->
    <header class="topbar">
      <div class="topbar-content">
        <h1>SATECHO</h1>

        <button class="language-button">
          <span class="material-symbols-outlined">
            language
          </span>
          ES
        </button>
      </div>
    </header>

    <!-- MAIN -->
    <main class="expired-main">

      <div class="expired-card">

        <!-- ICON -->
        <div class="expired-icon">
          <span class="material-symbols-outlined">
            history_toggle_off
          </span>
        </div>

        <!-- CONTENT -->
        <h2>
          El enlace ha expirado
        </h2>

        <p>
          Lo sentimos, el enlace de verificación ya no es válido
          o ha expirado por motivos de seguridad.
          Puedes solicitar uno nuevo ahora mismo.
        </p>

        <!-- ACTION -->
        <button class="primary-button">
          Solicitar nuevo enlace
        </button>

        <!-- BACK -->
        <RouterLink
            to="/login"
            class="back-link"
        >
          <span class="material-symbols-outlined">
            arrow_back
          </span>

          Volver al inicio de sesión
        </RouterLink>

      </div>

      <!-- EXTRA TEXT -->
      <div class="security-message">
        Crecimiento seguro: nuestra prioridad es la integridad
        de sus datos agrícolas.
      </div>

    </main>

    <!-- FOOTER -->
    <footer class="footer">
      <p>
        © 2024 SATECHO Precision Agriculture.
        Todos los derechos reservados.
      </p>
    </footer>

  </div>
</template>

<style scoped>
.expired-page {
  min-height: 100vh;
  background: var(--color-background);
  display: flex;
  flex-direction: column;
}

/* TOPBAR */

.topbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background: rgba(255,255,255,.75);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0,0,0,.05);
  z-index: 100;
}

.topbar-content {
  max-width: 1200px;
  margin: 0 auto;
  height: 76px;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.topbar h1 {
  font-size: 28px;
  font-weight: 800;
  color: var(--color-primary);
}

.language-button {
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: var(--color-text-secondary);
  font-weight: 700;
}

/* MAIN */

.expired-main {
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 140px 24px 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

/* CARD */

.expired-card {
  width: 100%;
  max-width: 560px;
  background: white;
  border-radius: 28px;
  padding: 56px;
  border: 1px solid #ececec;
  box-shadow: 0 10px 40px rgba(0,0,0,.05);
  text-align: center;
}

.expired-icon {
  width: 88px;
  height: 88px;
  margin: 0 auto 28px;
  border-radius: 999px;
  background: #ffdbcc;
  display: flex;
  justify-content: center;
  align-items: center;
}

.expired-icon span {
  font-size: 46px;
  color: #885036;
}

.expired-card h2 {
  font-size: 36px;
  font-weight: 800;
  margin-bottom: 18px;
  color: var(--color-text-primary);
}

.expired-card p {
  font-size: 16px;
  line-height: 1.8;
  color: var(--color-text-secondary);
  margin-bottom: 36px;
}

/* BUTTON */

.primary-button {
  width: 100%;
  height: 56px;
  border: none;
  border-radius: 16px;
  background: var(--color-primary);
  color: white;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  transition: .25s;
}

.primary-button:hover {
  transform: translateY(-2px);
  opacity: .95;
}

/* BACK LINK */

.back-link {
  margin-top: 28px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: var(--color-text-secondary);
  font-weight: 700;
  transition: .2s;
}

.back-link:hover {
  color: var(--color-primary);
}

.back-link:hover span {
  transform: translateX(-4px);
}

.back-link span {
  transition: .2s;
}

/* MESSAGE */

.security-message {
  margin-top: 42px;
  text-align: center;
  color: #8a8a8a;
  font-size: 14px;
  max-width: 520px;
  line-height: 1.7;
}

/* FOOTER */

.footer {
  border-top: 1px solid #ececec;
  padding: 24px;
  text-align: center;
}

.footer p {
  color: #999;
  font-size: 13px;
}

/* RESPONSIVE */

@media (max-width: 768px) {

  .expired-card {
    padding: 40px 28px;
  }

  .expired-card h2 {
    font-size: 30px;
  }

}
</style>