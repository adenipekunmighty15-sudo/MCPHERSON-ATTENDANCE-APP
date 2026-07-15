const fs = require('fs');
const content = fs.readFileSync('src/pages/Chat.vue', 'utf8');
const templateMatch = content.match(/<template>([\s\S]*)<\/template>/);
if (templateMatch) {
  const template = templateMatch[1];
  const lines = template.split('\n');
  let balance = 0;
  lines.forEach((line, i) => {
    const open = (line.match(/<div/g) || []).length;
    const close = (line.match(/<\/div>/g) || []).length;
    balance += open - close;
    if (open > 0 || close > 0) {
      console.log('Line ' + (i+1) + ': +' + open + ' -' + close + ' = ' + balance + ' | ' + line.trim().substring(0,80));
    }
  });
}