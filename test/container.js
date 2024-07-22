export async function withContainer(callback) {
  const div = document.createElement("div");
  document.body.appendChild(div);
  await callback(div);
  div.remove();
}
