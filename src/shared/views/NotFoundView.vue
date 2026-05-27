<script setup>
</script>

<template>
  <div class="not-found-page">
    <header class="topbar">
      <div class="topbar-content">
        <h1>SATECHO</h1>
        <button class="language-button">
          <span class="material-symbols-outlined">
            language
          </span>
          EN
        </button>
      </div>
    </header>

    <main class="not-found-content">
      <div class="error-card">
        <span class="error-code">
          404
        </span>
        <h2>
          Page not found
        </h2>
        <p>
          The page you're trying to access doesn't exist
          or may have been moved.
        </p>
        <RouterLink
            to="/"
            class="back-button"
        >
          <span class="material-symbols-outlined">
            arrow_back
          </span>
          Return to home
        </RouterLink>
      </div>
    </main>

    <footer class="footer">
      <p>
        © 2024 SATECHO. Intelligent Stewardship.
      </p>
    </footer>

  </div>
</template>

<style scoped>

.not-found-page{
  min-height:100vh;
  display:flex;
  flex-direction:column;
  background:#f6f7f4;
}

.topbar{
  height:72px;
  border-bottom:1px solid #e5e7e3;
  background:white;
}

.topbar-content{
  max-width:1100px;
  height:100%;
  margin:auto;
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:0 2rem;
}

.topbar h1{
  color:#4d6b4d;
  font-size:2rem;
  font-weight:700;
}

.language-button{
  border:none;
  background:transparent;
  display:flex;
  gap:.4rem;
  align-items:center;
  cursor:pointer;
}

.not-found-content{
  flex:1;
  display:flex;
  justify-content:center;
  align-items:center;
  padding:3rem;
}

.error-card{
  background:white;
  width:600px;
  border-radius:24px;
  padding:4rem;
  text-align:center;

  border:1px solid #e5e7e3;

  box-shadow:
      0 8px 30px rgba(0,0,0,.04);
}

.icon-container{
  width:90px;
  height:90px;

  margin:auto;

  border-radius:22px;

  display:flex;
  align-items:center;
  justify-content:center;

  background:#dcebd7;
}

.error-icon{
  font-size:45px;
  color:#4d6b4d;
}

.error-code{
  display:block;
  margin-top:2rem;

  color:#4d6b4d;

  font-size:4rem;
  font-weight:700;
}

h2{
  margin-top:1rem;
  font-size:2rem;
}

p{
  margin-top:1rem;
  color:#666;
  line-height:1.7;
}

.back-button{
  margin-top:2rem;

  display:inline-flex;
  align-items:center;
  gap:.5rem;

  padding:1rem 1.8rem;

  background:#4d6b4d;
  color:white;

  border-radius:12px;

  text-decoration:none;

  transition:all .3s ease;
}

.back-button:hover{
  background:#3f583f;
  color:white;
  transform:translateY(-2px);
}

.back-button:visited{
  color:white;
}

.back-button:active{
  color:white;
}

.footer{
  border-top:1px solid #e5e7e3;
  padding:1.5rem;
  text-align:center;
  color:#999;
}

</style>