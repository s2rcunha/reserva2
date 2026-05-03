
import XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = './CONTROLE DE MATERIAL.xlsx';

try {
  const workbook = XLSX.readFile(filePath);
  console.log('Folhas (Sheets):', workbook.SheetNames);

  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log(`\n--- Aba: ${sheetName} ---`);
    console.log('Cabeçalhos:', data[0]);
    console.log('Amostra de dados (2 linhas):', data.slice(1, 4));
  });
} catch (error) {
  console.error('Erro ao ler a planilha:', error);
}
