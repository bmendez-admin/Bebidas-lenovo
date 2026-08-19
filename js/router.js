const appContainer = document.getElementById("app");

function goTo(screenName, ...args) {
  const renderFn = window.Screens[screenName];
  renderFn(appContainer, ...args);
}

window.Router = { goTo };