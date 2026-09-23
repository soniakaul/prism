// Tiny pub/sub so any module can surface a message without prop drilling.
const listeners = new Set();

export function toast(message) {
  listeners.forEach((fn) => fn(message));
}

export function onToast(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Log the real error for debugging, show the user a plain message.
export function reportError(message, err) {
  console.error(message, err);
  toast(message);
}
