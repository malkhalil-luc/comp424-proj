// el() — small DSL for creating DOM elements (course pattern)

export function el(tag, attrs = {}, children = []) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') element.className = value;
    else if (key === 'textContent') element.textContent = value;
    else if (key.startsWith('data-')) element.setAttribute(key, value);
    else if (key in element) element[key] = value;
    else element.setAttribute(key, value);
  }
  for (const child of children) {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  }
  return element;
}
