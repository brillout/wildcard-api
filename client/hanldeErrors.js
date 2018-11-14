window.addEventListener("error", function (e) {
  alert("Error occurred: " + e.error.message);
  return false;
})

window.onerror = function (message, file, line, col, error) {
  alert("Error occurred: " + error.message);
  return false;
};

window.addEventListener("error", function (e) {
  alert("Error occurred: " + e.error.message);
  return false;
})

window.addEventListener('unhandledrejection', function (e) {
  alert("Error occurred: " + e.reason.message);
})
