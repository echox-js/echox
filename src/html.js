const TYPE_ELEMENT = 1;
const TYPE_TEXT = 3;

function renderHtml(string) {
  const template = document.createElement("template");
  template.innerHTML = string;
  return document.importNode(template.content, true);
}

export function html({raw: strings}) {
  let string = "";
  for (let j = 0, m = arguments.length; j < m; j++) {
    const input = strings[j];
    if (j > 0) string += "::" + j;
    string += input;
  }

  const root = renderHtml(string);
  const walker = document.createTreeWalker(root);
  const data = {};
  while (walker.nextNode()) {
    const node = walker.currentNode;
    switch (node.nodeType) {
      case TYPE_ELEMENT: {
        const {attributes} = node;
        for (let i = 0, n = attributes.length; i < n; i++) {
          const {name, value: currentValue} = attributes[i];
          if (/^::/.test(currentValue)) {
            const value = arguments[+currentValue.slice(2)];
            data[name] = value;
            node.setAttribute(name, value);
          }
        }
        break;
      }
      case TYPE_TEXT: {
        const {textContent} = node;
        if (/^::/.test(textContent)) {
          const value = arguments[+textContent.slice(2)];
          if (typeof value === "function") {
            node.textContent = value(data);
          }
        }
        break;
      }
    }
  }

  return root;
}
