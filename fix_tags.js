
const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Update SUB_CATEGORIES map
const subRegex = /\{SUB_CATEGORIES\.map\(sub => \(\s+<label key=\{sub\.id\} className="toggle-btn bg-gray-50 p-4 rounded-2xl">/g;
content = content.replace(subRegex, '{SUB_CATEGORIES.map(sub => (\n                         <label key={sub.id} className="toggle-btn bg-gray-50 p-4 rounded-2xl border-2 border-transparent transition-all has-[:checked]:bg-blue-50 has-[:checked]:border-blue-200">');

// Update sub-category labels
const labelRegex = /<span className="ml-3 text-\[10px\] font-black uppercase text-gray-500">\{sub\.label\}<\/span>/g;
content = content.replace(labelRegex, '<span className="ml-3 text-[10px] font-black uppercase text-gray-500 peer-checked:text-blue-700">{sub.label}</span>');

// Update Fora de Carga block
const foraLabelRegex = /<label className="toggle-btn bg-gray-50 p-4 rounded-2xl">\s+<input type="checkbox" className="sr-only peer" checked=\{editingMaterial\?\.fora_de_carga === true || editingMaterial\?\.fora_de_carga === 'SIM'\} onChange=\{e => setEditingMaterial\(\{...editingMaterial, fora_de_carga: e.target.checked \? 'SIM' : 'NÃO'\}\) \} \/>\s+<div className="toggle-box peer-checked:bg-red-600"><\/div>\s+<span className="ml-3 text-\[10px\] font-black uppercase text-gray-500">Material Fora de Carga<\/span>\s+<\/label>/g;

// Fallback simpler replacements for the "Fora de Carga" part
content = content.replace('className="toggle-box peer-checked:bg-red-600"></div>', 'className="toggle-box peer-checked:bg-blue-600"></div>');
content = content.replace('text-gray-500">Material Fora de Carga</span>', 'text-gray-500 peer-checked:text-blue-700">Material Fora de Carga</span>');
content = content.replace('<label className="toggle-btn bg-gray-50 p-4 rounded-2xl">\n                         <input type="checkbox"', '<label className="toggle-btn bg-gray-50 p-4 rounded-2xl border-2 border-transparent transition-all has-[:checked]:bg-blue-50 has-[:checked]:border-blue-200">\n                         <input type="checkbox"');

fs.writeFileSync(filePath, content);
console.log('Successfully updated App.tsx tags');
