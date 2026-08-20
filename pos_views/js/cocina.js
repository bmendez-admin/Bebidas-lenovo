const POLL_INTERVAL_MS = 4000;
const MAX_VISIBLE_COLA = 6;
const CHECK_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>`;

let DRINKS_BY_NAME = {};
let queueElements = new Map();
let selectedId = null;
let localmenteEntregados = new Set();
let preparandoLocal = new Set();
let ultimoTotalPendientes = 0;

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

async function fetchPedidos() {
  const url = window.CONFIG.LEADS_ENDPOINT_URL;
  if (!url) return { visibles: [], total: 0 };

  try {
    const res = await fetch(`${url}?action=listar_pedidos`);
    const data = await res.json();
    const completa = (data.pedidos || [])
      .filter((p) => (p.estado === "pendiente" || p.estado === "en_preparacion") && !localmenteEntregados.has(p.id))
      .map((p) => (preparandoLocal.has(p.id) ? { ...p, estado: "en_preparacion" } : p))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return { visibles: completa.slice(0, MAX_VISIBLE_COLA), total: completa.length };
  } catch (err) {
    return { visibles: [], total: 0 };
  }
}

function actualizarEstadoPedido(id, estado) {
  const url = window.CONFIG.LEADS_ENDPOINT_URL;
  if (!url) return;

  const body = new URLSearchParams({ action: "actualizar_pedido", id, estado });

  fetch(url, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: body.toString(),
  }).catch(() => {});
}

function minutosTranscurridos(timestamp) {
  const then = new Date(timestamp).getTime();
  return Math.floor((Date.now() - then) / 60000);
}

function urgencia(minutos) {
  if (minutos <= 3) return { color: "#4ADE80", label: minutos < 1 ? "recién llegó" : `hace ${minutos} min` };
  if (minutos <= 8) return { color: "#FBBF24", label: `hace ${minutos} min` };
  return { color: "#F87171", label: `hace ${minutos} min` };
}

function crearTarjetaCola(pedido) {
  const el = document.createElement("div");
  el.className = "kds-queue-card is-new";
  el.dataset.id = pedido.id;
  el.innerHTML = `
    <div class="kds-queue-top">
      <span class="kds-queue-number"></span>
      <span class="kds-queue-time"></span>
    </div>
    <span class="kds-queue-processing-badge">EN PREPARACIÓN</span>
    <div class="kds-queue-name">${pedido.nombre}</div>
    <div class="kds-queue-drink">${pedido.bebida}</div>
  `;
  el.addEventListener("click", () => seleccionarPedido(pedido));
  return el;
}

function actualizarTarjetaCola(el, pedido, index) {
  const minutos = minutosTranscurridos(pedido.timestamp);
  const u = urgencia(minutos);
  el.style.setProperty("--urgency-color", u.color);
  el.querySelector(".kds-queue-number").textContent = `PEDIDO #${index + 1}`;
  el.querySelector(".kds-queue-time").textContent = u.label;
  el.classList.toggle("is-selected", pedido.id === selectedId);
  el.classList.toggle("is-preparing", pedido.estado === "en_preparacion");
}

function renderCola(pedidos, total) {
  const container = document.getElementById("kds-queue");
  const count = document.getElementById("kds-count");
  count.textContent = total;
  ultimoTotalPendientes = total;

  if (pedidos.length === 0) {
    container.innerHTML = `
      <div class="kds-empty">
        <svg class="kds-empty-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 3h14l-2 12H7L5 3z"/><path d="M9 15v4a1 1 0 001 1h4a1 1 0 001-1v-4"/></svg>
        <p class="kds-empty-text">Sin pedidos pendientes</p>
      </div>
    `;
    queueElements.clear();
    return;
  }

  if (container.querySelector(".kds-empty")) {
    container.innerHTML = "";
  }

  const idsActuales = new Set(pedidos.map((p) => p.id));

  for (const id of Array.from(queueElements.keys())) {
    if (!idsActuales.has(id)) {
      queueElements.get(id).remove();
      queueElements.delete(id);
    }
  }

  pedidos.forEach((pedido, index) => {
    let el = queueElements.get(pedido.id);
    if (!el) {
      el = crearTarjetaCola(pedido);
      queueElements.set(pedido.id, el);
    } else {
      el.classList.remove("is-new");
    }
    actualizarTarjetaCola(el, pedido, index);
    container.appendChild(el);
  });

  let cola = container.querySelector(".kds-queue-hint");
  const ocultos = total - pedidos.length;
  if (ocultos > 0) {
    if (!cola) {
      cola = document.createElement("p");
      cola.className = "kds-queue-hint";
      container.appendChild(cola);
    } else {
      container.appendChild(cola);
    }
    cola.textContent = `+${ocultos} en cola, esperando espacio`;
  } else if (cola) {
    cola.remove();
  }
}

function seleccionarPedido(pedido) {
  selectedId = pedido.id;
  if (pedido.estado !== "en_preparacion") {
    actualizarEstadoPedido(pedido.id, "en_preparacion");
    pedido.estado = "en_preparacion";
    preparandoLocal.add(pedido.id);
  }
  queueElements.forEach((el, id) => el.classList.toggle("is-selected", id === pedido.id));
  renderDetalle(pedido);
}

function renderDetalle(pedido) {
  const detail = document.getElementById("kds-detail");
  const drink = DRINKS_BY_NAME[pedido.bebida];

  const imgSrc = drink
    ? `../assets/img/ingredients/${drink.id}.png`
    : "";
  const fallbackSrc = drink ? `../assets/img/drinks/${drink.id}.png` : "";
  const ingredientes = drink ? drink.ingredients : [];

  detail.innerHTML = `
    <div class="kds-detail-content">
      <p class="kds-detail-eyebrow">Pedido para</p>
      ${imgSrc ? `<img class="kds-detail-image" id="detail-img" src="${imgSrc}" alt="${pedido.bebida}" />` : ""}
      <h1 class="kds-detail-drink">${pedido.bebida}</h1>
      <p class="kds-detail-customer">Cliente: <strong>${pedido.nombre}</strong></p>
      ${ingredientes.length ? `
        <p class="kds-detail-ingredients-label">Ingredientes</p>
        <div class="kds-detail-ingredients">
          ${ingredientes.map((i) => `<span class="kds-ingredient-pill">${i}</span>`).join("")}
        </div>
      ` : ""}
      <button class="kds-complete-button" id="btn-complete">${CHECK_ICON} Pedido listo</button>
    </div>
  `;

  const img = document.getElementById("detail-img");
  if (img && fallbackSrc) {
    img.addEventListener("error", () => { img.src = fallbackSrc; });
  }

  document.getElementById("btn-complete").addEventListener("click", () => {
    localmenteEntregados.add(pedido.id);
    actualizarEstadoPedido(pedido.id, "listo");

    const el = queueElements.get(pedido.id);
    if (el) el.remove();
    queueElements.delete(pedido.id);

    if (selectedId === pedido.id) {
      selectedId = null;
      detail.innerHTML = `
        <div class="kds-detail-empty">
          <svg class="kds-empty-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M5 12l7-7M5 12l7 7"/></svg>
          <p class="kds-empty-text">Selecciona un pedido de la cola</p>
        </div>
      `;
    }

    const count = document.getElementById("kds-count");
    ultimoTotalPendientes = Math.max(0, ultimoTotalPendientes - 1);
    count.textContent = ultimoTotalPendientes;

    if (queueElements.size === 0 && ultimoTotalPendientes === 0) {
      document.getElementById("kds-queue").innerHTML = `
        <div class="kds-empty">
          <svg class="kds-empty-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 3h14l-2 12H7L5 3z"/><path d="M9 15v4a1 1 0 001 1h4a1 1 0 001-1v-4"/></svg>
          <p class="kds-empty-text">Sin pedidos pendientes</p>
        </div>
      `;
    }
  });
}

async function iniciarPolling() {
  async function tick() {
    const { visibles, total } = await fetchPedidos();
    renderCola(visibles, total);
  }

  await tick();
  setInterval(tick, POLL_INTERVAL_MS);
}

(async function init() {
  await cargarCatalogoBebidas();
  iniciarPolling();
})();