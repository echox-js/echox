import * as apps from "./apps";

function removeEmptyTextNode(root) {
  const removed = [];
  const walker = document.createTreeWalker(root);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() === "") {
      removed.push(node);
    }
  }
  removed.forEach((node) => node.remove());
  return root;
}

describe("Snapshots", () => {
  for (const [name, render] of Object.entries(apps)) {
    it(`App: ${name} should match snapshot`, () => {
      const root = render();
      expect(removeEmptyTextNode(root)).toMatchFileSnapshot(`./output/${name}.html`);
      root.destroy?.();
    });
  }
});
