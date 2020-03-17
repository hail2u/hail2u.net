const prettifyURL = () => {
  if (location.hash === "#top") {
    history.replaceState(
      null,
      "",
      `${location.pathname}${location.search}`
    );
  }
};

window.addEventListener("hashchange", prettifyURL);
