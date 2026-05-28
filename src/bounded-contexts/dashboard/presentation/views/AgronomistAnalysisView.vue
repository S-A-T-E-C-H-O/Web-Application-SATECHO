<script setup>
import { ref } from 'vue'

const selectedMetric = ref('ec-ph')

const parcelRows = [
  {
    name: 'Agro Valle',
    crop: 'Blueberries',
    ec: '1.4',
    ph: '6.2',
    status: 'Optimal',
  },
  {
    name: 'Finca Santa Rosa',
    crop: 'Avocado',
    ec: '1.6',
    ph: '6.5',
    status: 'Optimal',
  },
  {
    name: 'Huerta Los Pinos',
    crop: 'Citrus',
    ec: '1.5',
    ph: '6.8',
    status: 'Optimal',
  },
  {
    name: 'Campo Verde',
    crop: 'Table Grapes',
    ec: '1.5',
    ph: '6.4',
    status: 'Optimal',
  },
]
</script>

<template>
  <main class="analysis-page">
    <section class="analysis-topbar">
      <div>
        <h1>Multi-Parcel EC/pH Analysis</h1>
        <p>
          Aggregated soil metrics across active monitoring zones.
        </p>
      </div>
      <div class="filters">
        <button class="filter-button">
          <span class="material-symbols-outlined">
            calendar_month
          </span>
          Last 7 Days
        </button>
        <div class="metric-toggle">
          <button
              class="toggle-btn active"
          >
            EC & pH
          </button>
          <button
              class="toggle-btn"
          >
            Moisture
          </button>
        </div>
      </div>
    </section>

    <section class="metrics-grid">
      <article class="metric-card">
        <small>Average EC</small>
        <h2>1.5 <span>mS/cm</span></h2>
        <p>→ Stable within optimal range</p>
      </article>
      <article class="metric-card">
        <small>Average pH</small>
        <h2>6.4</h2>
        <p>→ Ideal acidity level</p>
      </article>
      <article class="metric-card">
        <small>Parcels Above Limit</small>
        <h2>0</h2>
        <p>● All monitored zones nominal</p>
      </article>
      <article class="metric-card">
        <small>Active Alerts</small>
        <h2>1</h2>
        <p>Preventive irrigation scheduled</p>
      </article>

    </section>
    <section class="analysis-content">
      <article class="chart-card">
        <div class="card-header">
          <div>
            <h2>EC & pH Trend Analysis</h2>
            <p>
              Aggregated data across 4 selected parcels
            </p>
          </div>
          <div class="chart-legend">
            <div class="legend-item">
              <span class="dot ec"></span>
              EC (Ref: 1.8)
            </div>
            <div class="legend-item">
              <span class="dot ph"></span>
              pH (5.8 - 7.0)
            </div>
          </div>
        </div>
        <div class="chart-placeholder">
          <div class="chart-line ec-line"></div>
          <div class="chart-line ph-line"></div>
        </div>
      </article>

      <aside class="insights-card">
        <h2>
          Agronomic Insights
        </h2>
        <div class="insight-badge">
          Interpretation: Normal
        </div>
        <p>
          Soil electroconductivity and pH levels remain highly stable across
          all selected parcels.
        </p>
        <div class="recommendation-box">
          <strong>
            Recommendation
          </strong>
          <p>
            Continue standard fertigation protocol.
            Next scheduled sampling in 4 days.
          </p>
        </div>
      </aside>
    </section>

    <section class="table-card">
      <div class="table-header">
        <h2>Parcel Details</h2>
        <button class="export-btn">
          Export Data
        </button>
      </div>
      <table>
        <thead>
        <tr>
          <th>Parcel Name</th>
          <th>Crop Type</th>
          <th>Avg EC</th>
          <th>Avg pH</th>
          <th>Status</th>
        </tr>
        </thead>
        <tbody>
        <tr
            v-for="parcel in parcelRows"
            :key="parcel.name"
        >
          <td>{{ parcel.name }}</td>
          <td>{{ parcel.crop }}</td>
          <td>{{ parcel.ec }}</td>
          <td>{{ parcel.ph }}</td>
          <td>
              <span class="status-badge">
                {{ parcel.status }}
              </span>
          </td>
        </tr>
        </tbody>
      </table>
    </section>
  </main>
</template>

<style scoped>
.analysis-page{
  padding:32px;
  display:flex;
  flex-direction:column;
  gap:24px;
  background:#f7f8f5;
  min-height:100vh;
}

.analysis-topbar{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:20px;
}

.analysis-topbar h1{
  font-size:36px;
  color:#222;
  margin-bottom:6px;
}

.analysis-topbar p{
  color:#777;
}

.filters{
  display:flex;
  align-items:center;
  gap:12px;
}

.filter-button{
  border:1px solid #ddd;
  background:white;
  border-radius:12px;
  padding:10px 16px;
  display:flex;
  align-items:center;
  gap:8px;
  cursor:pointer;
}

.metric-toggle{
  background:white;
  border:1px solid #ddd;
  border-radius:12px;
  overflow:hidden;
  display:flex;
}

.toggle-btn{
  padding:10px 18px;
  border:none;
  background:transparent;
  cursor:pointer;
}

.toggle-btn.active{
  background:#456c4c;
  color:white;
}

.metrics-grid{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:20px;
}

.metric-card{
  background:white;
  border-radius:18px;
  padding:24px;
  border:1px solid #ececec;
}

.metric-card small{
  color:#777;
}

.metric-card h2{
  margin:18px 0 10px;
  font-size:42px;
  color:#222;
}

.metric-card h2 span{
  font-size:18px;
  color:#777;
}

.metric-card p{
  color:#666;
  font-size:14px;
}

.analysis-content{
  display:grid;
  grid-template-columns:2fr 1fr;
  gap:24px;
}

.chart-card,
.insights-card,
.table-card{
  background:white;
  border-radius:20px;
  border:1px solid #ececec;
}

.chart-card{
  padding:24px;
}

.card-header{
  display:flex;
  justify-content:space-between;
  margin-bottom:24px;
}

.card-header h2{
  margin-bottom:6px;
}

.chart-legend{
  display:flex;
  gap:16px;
}

.legend-item{
  display:flex;
  align-items:center;
  gap:8px;
  font-size:14px;
  color:#666;
}

.dot{
  width:10px;
  height:10px;
  border-radius:50%;
}

.dot.ec{
  background:#6b8f71;
}

.dot.ph{
  background:#c47b5c;
}

.chart-placeholder{
  position:relative;
  height:320px;
  border-radius:16px;
  background:
      linear-gradient(to bottom,
      transparent 24%,
      #efefef 25%,
      transparent 26%);
}

.chart-line{
  position:absolute;
  width:100%;
  height:4px;
  border-radius:999px;
}

.ec-line{
  background:#6b8f71;
  top:56%;
}

.ph-line{
  background:#c47b5c;
  top:46%;
}

.insights-card{
  padding:24px;
  display:flex;
  flex-direction:column;
  gap:20px;
}

.insight-badge{
  background:#dcefdc;
  color:#456c4c;
  width:fit-content;
  padding:8px 14px;
  border-radius:999px;
  font-size:14px;
  font-weight:600;
}

.recommendation-box{
  background:#f6f7f3;
  border-radius:16px;
  padding:18px;
}

.table-card{
  overflow:hidden;
}

.table-header{
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:24px;
}

.export-btn{
  border:none;
  background:transparent;
  color:#456c4c;
  font-weight:600;
  cursor:pointer;
}

table{
  width:100%;
  border-collapse:collapse;
}

th{
  text-align:left;
  padding:18px 24px;
  background:#fafafa;
  color:#777;
  font-size:14px;
}

td{
  padding:22px 24px;
  border-top:1px solid #f0f0f0;
}

.status-badge{
  background:#dcefdc;
  color:#456c4c;
  padding:6px 12px;
  border-radius:999px;
  font-size:13px;
  font-weight:600;
}

@media (max-width:1200px){
  .metrics-grid{
    grid-template-columns:repeat(2,1fr);
  }

  .analysis-content{
    grid-template-columns:1fr;
  }
}

@media (max-width:768px){
  .analysis-topbar{
    flex-direction:column;
  }

  .metrics-grid{
    grid-template-columns:1fr;
  }
}
</style>