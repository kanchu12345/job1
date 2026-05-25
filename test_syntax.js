const fs = require('fs');
const acorn = require('acorn');

const html = fs.readFileSync('submit.html', 'utf8');
const scriptRegex = /<script>([\s\S]*?)<\/script>/g;

let match;
while ((match = scriptRegex.exec(html)) !== null) {
  const code = match[1];
  // Skip JSON or non-JS scripts if any
  try {
    acorn.parse(code, { ecmaVersion: 2020 });
    console.log("Valid script block length: ", code.length);
  } catch(e) {
    console.error("Syntax Error in script:", e.message);
  }
}
