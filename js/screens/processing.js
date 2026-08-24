function renderProcessing(container, onNext) {
  container.innerHTML = `
    <div class="screen bg-gradient-deep">
      ${window.Chrome.renderChrome(true)}
      <h1 class="brand-title">Analizando<br /><strong>tu fórmula...</strong></h1>
      <p class="brand-subtitle">Combinando tus componentes.</p>
      <div class="processing-spinner">
        <div class="processing-dot"></div>
        <div class="processing-dot"></div>
        <div class="processing-dot"></div>
      </div>
    </div>
  `;

  window.SessionState.computeResult();

  const state = window.SessionState.getState();
  if (state.leadInfo) {
    const orderId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    window.SessionState.setOrderId(orderId);
    window.Leads.submitLead({
      action: "registrar",
      id: orderId,
      nombre: state.leadInfo.nombre,
      apellido: state.leadInfo.apellido,
      empresa: state.leadInfo.empresa,
      correo: state.leadInfo.correo,
      telefono: state.leadInfo.telefono,
      bebida: state.selectedDrink.name,
    });
  }

  setTimeout(onNext, 1800);
}

window.Screens = window.Screens || {};
window.Screens.processing = renderProcessing;