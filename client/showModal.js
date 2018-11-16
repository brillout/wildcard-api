module.exports = showModal;

function showModal(html) {
  const modalEl = window.document.createElement('div');
  const id = '@brillout/fetch-error-handler/modal';
  modalEl.id = id;
  Object.assign(modalEl.style, {
    zIndex: 10000000,
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    width: '100vw',
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });

  const modalContentEl = window.document.createElement('div');
  Object.assign(modalContentEl.style, {
    padding: '10px 20px',
    borderRadius: '5px',
    background: 'white',
  });

  modalEl.appendChild(modalContentEl);
  document.body.appendChild(modalEl);

  update(html);

  return {close, update};

  function close() {
    modalEl.parentElement.removeChild(modalEl);
  }
  function update(html) {
    modalContentEl.innerHTML = html;
  }
}
