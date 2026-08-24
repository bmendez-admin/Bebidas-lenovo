const ICON_REFRESH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>`;
const ICON_DOWNLOAD = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 19h16"/></svg>`;

const ESTADO_COLORES = { listo: "#4ADE80", cancelado: "#F87171", progreso: "#FBBF24" };
const ALCOHOL_COLORES = { alcoholicas: "#E1251B", sinAlcohol: "#7A126B" };

let DRINKS_BY_NAME = {};

async function cargarCatalogoBebidas() {
  try {
    const res = await fetch("../data/drinks.json");
    const drinks = await res.json();
    DRINKS_BY_NAME = {};
    drinks.forEach((d) => { DRINKS_BY_NAME[d.name] = d; });
  } catch (err) {
    DRINKS_BY_NAME = {};
  }
}

async function fetchDashboardData() {
  const url = window.CONFIG.LEADS_ENDPOINT_URL;
  if (!url) return { pedidos: [], leadsCount: 0 };

  try {
    const res = await fetch(`${url}?action=listar_dashboard`);
    const data = await res.json();
    return { pedidos: data.pedidos || [], leadsCount: data.leadsCount || 0 };
  } catch (err) {
    return { pedidos: [], leadsCount: 0 };
  }
}

function clasificarEstado(estado) {
  if (estado === "listo") return "listo";
  if (estado === "cancelado") return "cancelado";
  return "progreso";
}

function calcularMetricas(pedidos) {
  const total = pedidos.length;
  const porEstado = { listo: 0, cancelado: 0, progreso: 0 };
  const porBebida = {};
  const porAlcohol = { alcoholicas: 0, sinAlcohol: 0, desconocido: 0 };
  const porHora = {};

  pedidos.forEach((p) => {
    porEstado[clasificarEstado(p.estado)]++;

    if (p.bebida) {
      porBebida[p.bebida] = (porBebida[p.bebida] || 0) + 1;
      const drink = DRINKS_BY_NAME[p.bebida];
      if (drink) {
        porAlcohol[drink.alcoholic ? "alcoholicas" : "sinAlcohol"]++;
      } else {
        porAlcohol.desconocido++;
      }
    }

    if (p.timestamp) {
      const hora = new Date(p.timestamp).getHours();
      porHora[hora] = (porHora[hora] || 0) + 1;
    }
  });

  const rankingBebidas = Object.entries(porBebida)
    .map(([bebida, count]) => ({ bebida, count }))
    .sort((a, b) => b.count - a.count);

  const timeline = pedidos
    .slice()
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);

  return { total, porEstado, rankingBebidas, porAlcohol, porHora, timeline };
}

function formatFechaHora(timestamp) {
  const d = new Date(timestamp);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm} ${hh}:${min}`;
}

function renderKPIs(metricas) {
  document.getElementById("kpi-total").textContent = metricas.total;
  document.getElementById("kpi-listo").textContent = metricas.porEstado.listo;
  document.getElementById("kpi-cancelado").textContent = metricas.porEstado.cancelado;
  document.getElementById("kpi-progreso").textContent = metricas.porEstado.progreso;
}

function construirConicGradient(segmentos) {
  const total = segmentos.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return "conic-gradient(rgba(255,255,255,0.1) 0% 100%)";

  let acumulado = 0;
  const partes = segmentos
    .filter((s) => s.value > 0)
    .map((seg) => {
      const inicio = (acumulado / total) * 100;
      acumulado += seg.value;
      const fin = (acumulado / total) * 100;
      return `${seg.color} ${inicio}% ${fin}%`;
    });

  return `conic-gradient(${partes.join(", ")})`;
}

function renderDonutEstado(metricas) {
  const donut = document.getElementById("donut-estado");
  const segmentos = [
    { value: metricas.porEstado.listo, color: ESTADO_COLORES.listo },
    { value: metricas.porEstado.cancelado, color: ESTADO_COLORES.cancelado },
    { value: metricas.porEstado.progreso, color: ESTADO_COLORES.progreso },
  ];
  donut.style.background = construirConicGradient(segmentos);
  donut.innerHTML = `
    <div class="dash-donut-center">
      <div class="dash-donut-center-value">${metricas.total}</div>
      <div class="dash-donut-center-label">Total</div>
    </div>
  `;

  const total = metricas.total || 1;
  const pct = (v) => Math.round((v / total) * 100);

  const legend = document.getElementById("legend-estado");
  legend.innerHTML = `
    <div class="dash-legend-item"><span class="dash-legend-dot" style="background:${ESTADO_COLORES.listo}"></span>Completados<span class="dash-legend-value">${metricas.porEstado.listo}</span><span class="dash-legend-pct">(${pct(metricas.porEstado.listo)}%)</span></div>
    <div class="dash-legend-item"><span class="dash-legend-dot" style="background:${ESTADO_COLORES.cancelado}"></span>Cancelados<span class="dash-legend-value">${metricas.porEstado.cancelado}</span><span class="dash-legend-pct">(${pct(metricas.porEstado.cancelado)}%)</span></div>
    <div class="dash-legend-item"><span class="dash-legend-dot" style="background:${ESTADO_COLORES.progreso}"></span>En progreso<span class="dash-legend-value">${metricas.porEstado.progreso}</span><span class="dash-legend-pct">(${pct(metricas.porEstado.progreso)}%)</span></div>
  `;
}

function renderDonutAlcohol(metricas) {
  const donut = document.getElementById("donut-alcohol");
  const segmentos = [
    { value: metricas.porAlcohol.alcoholicas, color: ALCOHOL_COLORES.alcoholicas },
    { value: metricas.porAlcohol.sinAlcohol, color: ALCOHOL_COLORES.sinAlcohol },
  ];
  donut.style.background = construirConicGradient(segmentos);

  const totalAlcohol = metricas.porAlcohol.alcoholicas + metricas.porAlcohol.sinAlcohol || 1;
  donut.innerHTML = `
    <div class="dash-donut-center">
      <div class="dash-donut-center-value">${totalAlcohol}</div>
      <div class="dash-donut-center-label">Total</div>
    </div>
  `;

  const pct = (v) => Math.round((v / totalAlcohol) * 100);

  const legend = document.getElementById("legend-alcohol");
  legend.innerHTML = `
    <div class="dash-legend-item"><span class="dash-legend-dot" style="background:${ALCOHOL_COLORES.alcoholicas}"></span>Con alcohol<span class="dash-legend-value">${metricas.porAlcohol.alcoholicas}</span><span class="dash-legend-pct">(${pct(metricas.porAlcohol.alcoholicas)}%)</span></div>
    <div class="dash-legend-item"><span class="dash-legend-dot" style="background:${ALCOHOL_COLORES.sinAlcohol}"></span>Sin alcohol<span class="dash-legend-value">${metricas.porAlcohol.sinAlcohol}</span><span class="dash-legend-pct">(${pct(metricas.porAlcohol.sinAlcohol)}%)</span></div>
  `;
}

function renderRankingBebidas(metricas) {
  const container = document.getElementById("ranking-bebidas");

  if (metricas.rankingBebidas.length === 0) {
    container.innerHTML = `<p class="dash-empty">Aún no hay pedidos registrados</p>`;
    return;
  }

  const max = metricas.rankingBebidas[0].count;
  container.innerHTML = metricas.rankingBebidas
    .map(
      (r) => `
      <div class="dash-hbar-row">
        <span class="dash-hbar-label">${r.bebida}</span>
        <div class="dash-hbar-track"><div class="dash-hbar-fill" style="width:${(r.count / max) * 100}%"></div></div>
        <span class="dash-hbar-value">${r.count}</span>
      </div>
    `
    )
    .join("");
}

function renderActividadPorHora(metricas) {
  const container = document.getElementById("actividad-hora");
  const horas = Object.keys(metricas.porHora).map(Number);

  if (horas.length === 0) {
    container.innerHTML = `<p class="dash-empty">Sin datos de actividad</p>`;
    return;
  }

  const minHora = Math.min(...horas);
  const maxHora = Math.max(...horas);
  const max = Math.max(...Object.values(metricas.porHora));

  let cols = "";
  for (let h = minHora; h <= maxHora; h++) {
    const valor = metricas.porHora[h] || 0;
    const alturaPct = max > 0 ? Math.max((valor / max) * 100, valor > 0 ? 6 : 0) : 0;
    cols += `
      <div class="dash-vbar-col">
        <span class="dash-vbar-value">${valor > 0 ? valor : ""}</span>
        <div class="dash-vbar" style="height:${alturaPct}%" title="${valor} pedidos"></div>
        <span class="dash-vbar-hour">${String(h).padStart(2, "0")}h</span>
      </div>
    `;
  }
  container.innerHTML = cols;
}

function renderTimeline(metricas) {
  const container = document.getElementById("dash-timeline");

  if (metricas.timeline.length === 0) {
    container.innerHTML = `<p class="dash-empty">Sin actividad todavía</p>`;
    return;
  }

  container.innerHTML = metricas.timeline
    .map((p) => {
      const clase = clasificarEstado(p.estado);
      const label = clase === "listo" ? "Completado" : clase === "cancelado" ? "Cancelado" : "En progreso";
      return `
        <div class="dash-timeline-row is-${clase}">
          <div class="dash-timeline-info">
            <span class="dash-timeline-name">${p.nombre || "—"}</span>
            <span class="dash-timeline-drink">${p.bebida || "—"}</span>
          </div>
          <div class="dash-timeline-right">
            <span class="dash-timeline-time">${formatFechaHora(p.timestamp)}</span>
            <span class="dash-pill is-${clase}">${label}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderQA(metricas, leadsCount) {
  const nota = document.getElementById("dash-qa-note");
  const diferencia = leadsCount - metricas.total;

  if (diferencia === 0) {
    nota.classList.remove("has-mismatch");
    nota.textContent = `Leads capturados (${leadsCount}) y pedidos registrados (${metricas.total}) coinciden — sin sesiones incompletas.`;
  } else {
    nota.classList.add("has-mismatch");
    nota.textContent = `Atención: ${leadsCount} leads capturados vs ${metricas.total} pedidos registrados (diferencia de ${Math.abs(diferencia)}) — puede indicar sesiones que no completaron el registro del pedido.`;
  }
}

async function actualizarDashboard() {
  const boton = document.getElementById("btn-refresh");
  boton.disabled = true;

  const { pedidos, leadsCount } = await fetchDashboardData();
  const metricas = calcularMetricas(pedidos);

  renderKPIs(metricas);
  renderDonutEstado(metricas);
  renderDonutAlcohol(metricas);
  renderRankingBebidas(metricas);
  renderActividadPorHora(metricas);
  renderTimeline(metricas);
  renderQA(metricas, leadsCount);

  const ahora = new Date();
  document.getElementById("dash-updated").textContent =
    `Actualizado ${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;

  boton.disabled = false;
}

async function exportarLeads() {
  const url = window.CONFIG.LEADS_ENDPOINT_URL;
  if (!url) return;

  const boton = document.getElementById("btn-export");
  const textoOriginal = boton.innerHTML;
  boton.disabled = true;
  boton.innerHTML = "Generando...";

  try {
    const res = await fetch(`${url}?action=exportar_leads`);
    const csv = await res.text();

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const fecha = new Date().toISOString().slice(0, 10);
    link.href = URL.createObjectURL(blob);
    link.download = `leads_lenovo_lab_${fecha}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (err) {
    alert("No se pudo generar el archivo. Intenta de nuevo.");
  }

  boton.disabled = false;
  boton.innerHTML = textoOriginal;
}

(async function init() {
  document.getElementById("btn-refresh").innerHTML = `${ICON_REFRESH} Actualizar`;
  document.getElementById("btn-refresh").addEventListener("click", actualizarDashboard);
  document.getElementById("btn-export").innerHTML = `${ICON_DOWNLOAD} Exportar Excel`;
  document.getElementById("btn-export").addEventListener("click", exportarLeads);
  await cargarCatalogoBebidas();
  await actualizarDashboard();
})();