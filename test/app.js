const STORAGE_KEY = "portal-smoke-test-state";

const checkboxes = Array.from(document.querySelectorAll("[data-check-id]"));
const notesInput = document.querySelector("#notes-input");
const resetButton = document.querySelector("#reset-btn");

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function applySavedState() {
  const saved = loadState();

  checkboxes.forEach((checkbox) => {
    checkbox.checked = Boolean(saved.checks?.[checkbox.dataset.checkId]);
  });

  notesInput.value = saved.notes || "";
}

function persistChecks() {
  const saved = loadState();
  const checks = {};

  checkboxes.forEach((checkbox) => {
    checks[checkbox.dataset.checkId] = checkbox.checked;
  });

  saveState({
    ...saved,
    checks,
    notes: notesInput.value
  });
}

function resetState() {
  localStorage.removeItem(STORAGE_KEY);

  checkboxes.forEach((checkbox) => {
    checkbox.checked = false;
  });

  notesInput.value = "";
}

checkboxes.forEach((checkbox) => {
  checkbox.addEventListener("change", persistChecks);
});

notesInput.addEventListener("input", persistChecks);
resetButton.addEventListener("click", resetState);

applySavedState();
