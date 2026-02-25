/**
 * Popup script — opens the settings/options page.
 */

document.getElementById("open-settings").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});
