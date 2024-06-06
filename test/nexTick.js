export function nextTick(ms = 20) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
