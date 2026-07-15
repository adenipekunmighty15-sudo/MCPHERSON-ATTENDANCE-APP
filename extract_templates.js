const fs = require('fs');
const path = require('path');
const dir = 'C:\\Users\\mighty\\Desktop\\mcpherson-attendance\\frontend\\dist\\assets';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') && !f.startsWith('vendor') && !f.startsWith('index') && !f.startsWith('chart') && !f.startsWith('departments'));

files.forEach(file => {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  console.log('\n========== ' + file + ' ==========');
  // Extract template strings that contain HTML-like content
  const singleQuotes = content.match(/'[^']{100,}'/g) || [];
  const doubleQuotes = content.match(/"[^"]{100,}"/g) || [];
  
  const allStrings = [...singleQuotes, ...doubleQuotes];
  allStrings.forEach(s => {
    // Only show strings that look like HTML/Vue templates
    if (s.includes('<') && (s.includes('class=') || s.includes('div>') || s.includes('span>') || s.includes('button') || s.includes('svg'))) {
      console.log(s.substring(0, 500));
    }
  });
});
