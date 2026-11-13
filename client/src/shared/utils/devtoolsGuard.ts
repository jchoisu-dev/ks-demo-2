
const REDIRECT_URL = "about:blank";
const CHECK_INTERVAL_MS = 1000;
const PAUSE_THRESHOLD_MS = 100;

const isEditable = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

const isDevtoolsShortcut = (event: KeyboardEvent) => {
  const key = event.key.toLowerCase();
  const modifier = event.ctrlKey || event.metaKey;
  if (event.key == "F12") return true;
  if (modifier && event.shiftKey && ["i", "j", "c"].includes(key)) return true;
  if (event.metaKey && event.altKey && ["i", "j", "c", "u"].includes(key)) return true;
  if (event.ctrlKey && !event.shiftKey && key == "u") return true;
  return false;
};

const leave = () => window.location.replace(REDIRECT_URL);

export const startDevtoolsGuard = () => {
  if (!import.meta.env.PROD || import.meta.env.VITE_PUBLIC_DEVTOOLS_GUARD == "off") return;

  window.addEventListener("keydown", (event) => {
    if (!isDevtoolsShortcut(event)) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);

  window.addEventListener("contextmenu", (event) => {
    if (isEditable(event.target)) return;
    event.preventDefault();
  }, true);

  window.setInterval(() => {
    const start = performance.now();
    // eslint-disable-next-line no-debugger
    debugger;
    if (performance.now() - start > PAUSE_THRESHOLD_MS) leave();
  }, CHECK_INTERVAL_MS);
};
