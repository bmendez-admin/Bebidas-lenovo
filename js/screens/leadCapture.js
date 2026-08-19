function renderLeadCapture(container, onNext) {
  container.innerHTML = `
    <div class="screen bg-gradient-deep">
      ${window.Chrome.renderChrome(false)}
      <p class="eyebrow">Antes de comenzar</p>
      <h1 class="brand-title">Cuéntanos un<br /><strong>poco sobre ti</strong></h1>
      <form class="lead-form" id="lead-form">
        <input class="lead-input" type="text" name="nombre" placeholder="Nombre" required />
        <input class="lead-input" type="text" name="apellido" placeholder="Apellido" required />
        <input class="lead-input" type="email" name="correo" placeholder="Correo" required />
        <input class="lead-input" type="tel" name="telefono" placeholder="Teléfono" required />
      </form>
      <p class="lead-error" id="lead-error"></p>
      <button class="cta-button" id="btn-lead-continue">Continuar</button>
    </div>
  `;

  const form = container.querySelector("#lead-form");
  const errorEl = container.querySelector("#lead-error");

  container.querySelector("#btn-lead-continue").addEventListener("click", () => {
    if (!form.reportValidity()) {
      errorEl.textContent = "Completa todos los campos para continuar.";
      return;
    }

    const formData = new FormData(form);
    const leadInfo = {
      nombre: formData.get("nombre"),
      apellido: formData.get("apellido"),
      correo: formData.get("correo"),
      telefono: formData.get("telefono"),
    };

    window.SessionState.setLeadInfo(leadInfo);
    onNext();
  });
}

function submitLead(payload) {
  const url = window.CONFIG.LEADS_ENDPOINT_URL;
  if (!url) return;

  const body = new URLSearchParams(payload);

  fetch(url, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: body.toString(),
  }).catch(() => {});
}

window.Leads = { submitLead };

window.Screens = window.Screens || {};
window.Screens.leadCapture = renderLeadCapture;