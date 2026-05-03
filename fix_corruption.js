import fs from 'fs';
const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');
// The corrupted lines seem to be around 2252
// I will look for the line containing "laceholder" and check nearby
const index = lines.findIndex(l => l.includes('laceholder="Ex: 4kg, 6kg, 10L, 50kg"'));
if (index !== -1) {
  console.log('Found corruption at index', index);
  // Remove lines that look wrong
  // 2252:                   </div>laceholder="Ex: 4kg, 6kg, 10L, 50kg" 
  // 2253:                          </div>
  // 2254:                        </div>
  // 2255:                   </div>
  // 2256:                   <div className="col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4"> (KEEP THIS ONE)
  
  // Actually, let's just replace the specific weird sequence
  const start = index;
  let end = index;
  while (end < lines.length && !lines[end].includes('grid grid-cols-2 md:grid-cols-3 gap-4')) {
    end++;
  }
  
  if (end > start) {
    console.log('Removing lines from', start, 'to', end - 1);
    lines.splice(start, end - start, '                   </div>');
    fs.writeFileSync('src/App.tsx', lines.join('\n'));
    console.log('Fixed!');
  }
} else {
  console.log('Corruption not found');
}
