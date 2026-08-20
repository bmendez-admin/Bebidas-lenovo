const POLL_INTERVAL_MS = 4000;
const MAX_VISIBLE_PREPARACION = 6;
const MAX_VISIBLE_LISTO = 6;
const LISTO_INACTIVIDAD_LIMPIAR_MS = 5 * 60 * 1000;
const LEAVE_ANIM_MS = 300;

const ICON_CLOCK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>`;
const ICON_FLAME = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2c1 3-2 4-2 7a4 4 0 008 0c0-2-1-3-1-3s2 1 2 5a7 7 0 11-14 0c0-5 4-6 4-6s-1-2 3-3z"/></svg>`;
const ICON_CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>`;

let DRINKS_BY_NAME = {};
const prepElements = new Map();
const listoElements = new Map();

let listoQueue = [];
const listoVistos = new Set();
let listoLastChange = Date.now();

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
  if (!url) return { preparacion: [], preparacionTotal: 0, listo: [] };

  try {
    const res = await fetch(`${url}?action=listar_pedidos`);
    const data = await res.json();
    const todos = data.pedidos || [];

    const preparacionCompleta = todos
      .filter((p) => p.estado === "pendiente" || p.estado === "en_preparacion")
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const listoBackend = todos
      .filter((p) => p.estado === "listo")
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const idsListoBackend = new Set(listoBackend.map((p) => p.id));
    listoQueue = listoQueue.filter((id) => idsListoBackend.has(id));

    let huboLlegadaNueva = false;
    listoBackend.forEach((p) => {
      if (!listoVistos.has(p.id)) {
        listoVistos.add(p.id);
        listoQueue.push(p.id);
        huboLlegadaNueva = true;
      }
    });

    if (huboLlegadaNueva) {
      listoLastChange = Date.now();
      while (listoQueue.length > MAX_VISIBLE_LISTO) {
        listoQueue.shift();
      }
    }

    if (listoQueue.length > 0 && Date.now() - listoLastChange > LISTO_INACTIVIDAD_LIMPIAR_MS) {
      listoQueue = [];
    }

    const listoPorId = {};
    listoBackend.forEach((p) => { listoPorId[p.id] = p; });
    const listo = listoQueue
      .map((id) => listoPorId[id])
      .filter(Boolean)
      .slice()
      .reverse();

    return {
      preparacion: preparacionCompleta.slice(0, MAX_VISIBLE_PREPARACION),
      preparacionTotal: preparacionCompleta.length,
      listo,
    };
  } catch (err) {
    return { preparacion: [], preparacionTotal: 0, listo: [] };
  }
}

function minutosTranscurridos(timestamp) {
  return Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
}

function colorUrgencia(minutos) {
  if (minutos <= 3) return "#4ADE80";
  if (minutos <= 8) return "#FBBF24";
  return "#F87171";
}

function crearTarjeta(pedido) {
  const el = document.createElement("div");
  el.className = "estado-card is-new";
  el.dataset.id = pedido.id;

  const drink = DRINKS_BY_NAME[pedido.bebida];
  const imgSrc = drink ? `../assets/img/ingredients/${drink.id}.png` : "";
  const fallback = drink ? `../assets/img/drinks/${drink.id}.png` : "";

  el.innerHTML = `
    ${imgSrc ? `<img class="estado-card-image" src="${imgSrc}" data-fallback="${fallback}" alt="${pedido.bebida}" />` : ""}
    <div class="estado-card-body">
      <div class="estado-card-drink">${pedido.bebida}</div>
      <div class="estado-card-customer">${pedido.nombre}</div>
      <span class="estado-status-pill"></span>
      <span class="estado-card-time"></span>
    </div>
    <div class="estado-progress"></div>
  `;

  const img = el.querySelector(".estado-card-image");
  if (img) img.addEventListener("error", () => { img.src = img.dataset.fallback; });

  return el;
}

function actualizarTarjeta(el, pedido) {
  el.classList.remove("is-pendiente", "is-preparando", "is-listo");
  const pill = el.querySelector(".estado-status-pill");
  const timeEl = el.querySelector(".estado-card-time");

  if (pedido.estado === "pendiente") {
    el.classList.add("is-pendiente");
    pill.innerHTML = `${ICON_CLOCK} Pendiente`;
  } else if (pedido.estado === "en_preparacion") {
    el.classList.add("is-preparando");
    pill.innerHTML = `${ICON_FLAME} ¡Preparando!`;
  } else if (pedido.estado === "listo") {
    el.classList.add("is-listo");
    pill.innerHTML = `${ICON_CHECK} ¡Listo!`;
  }

  if (pedido.estado === "listo") {
    timeEl.textContent = "";
  } else {
    const minutos = minutosTranscurridos(pedido.timestamp);
    timeEl.textContent = minutos < 1 ? "recién llegó" : `hace ${minutos} min`;
    timeEl.style.color = colorUrgencia(minutos);
  }
}

function renderColumna(containerId, countId, pedidos, elementsMap, emptyHtml, totalReal) {
  const container = document.getElementById(containerId);
  document.getElementById(countId).textContent = totalReal !== undefined ? totalReal : pedidos.length;

  const idsActuales = new Set(pedidos.map((p) => p.id));

  for (const id of Array.from(elementsMap.keys())) {
    if (!idsActuales.has(id)) {
      const el = elementsMap.get(id);
      elementsMap.delete(id);
      el.classList.add("is-leaving");
      setTimeout(() => el.remove(), LEAVE_ANIM_MS);
    }
  }

  if (pedidos.length === 0) {
    if (elementsMap.size === 0) {
      container.innerHTML = emptyHtml;
    }
    return;
  }

  if (container.querySelector(".estado-empty")) {
    container.innerHTML = "";
  }

  pedidos.forEach((pedido) => {
    let el = elementsMap.get(pedido.id);
    if (!el) {
      el = crearTarjeta(pedido);
      elementsMap.set(pedido.id, el);
      container.appendChild(el);
    } else {
      el.classList.remove("is-new");
    }
    actualizarTarjeta(el, pedido);
  });

  let cola = container.querySelector(".estado-queue-hint");
  const ocultos = totalReal !== undefined ? totalReal - pedidos.length : 0;
  if (ocultos > 0) {
    if (!cola) {
      cola = document.createElement("p");
      cola.className = "estado-queue-hint";
      container.appendChild(cola);
    } else {
      container.appendChild(cola);
    }
    cola.textContent = `+${ocultos} en cola, esperando espacio`;
  } else if (cola) {
    cola.remove();
  }
}

const EMPTY_PREPARACION = `
  <div class="estado-empty">
    <svg class="estado-empty-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 3h14l-2 12H7L5 3z"/><path d="M9 15v4a1 1 0 001 1h4a1 1 0 001-1v-4"/></svg>
    <p class="estado-empty-text">No hay pedidos en preparación</p>
  </div>
`;

const EMPTY_LISTO = `
  <div class="estado-empty">
    <svg class="estado-empty-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 6L9 17l-5-5"/></svg>
    <p class="estado-empty-text">Aquí aparecerán tus bebidas listas</p>
  </div>
`;

async function iniciarPolling() {
  async function tick() {
    const { preparacion, preparacionTotal, listo } = await fetchPedidos();
    renderColumna("cards-preparacion", "count-preparacion", preparacion, prepElements, EMPTY_PREPARACION, preparacionTotal);
    renderColumna("cards-listo", "count-listo", listo, listoElements, EMPTY_LISTO);
  }

  await tick();
  setInterval(tick, POLL_INTERVAL_MS);
}

(async function init() {
  await cargarCatalogoBebidas();
  iniciarPolling();
})();