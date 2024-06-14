export function withContainer(callback) {
  const div = document.createElement("div");
  document.body.appendChild(div);
  callback(div);
  div.remove();
}
