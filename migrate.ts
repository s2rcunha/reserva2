import mysql from 'mysql2/promise';
import XLSX from 'xlsx';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const filePath = './Cópia de CONTROLE MATERIAL CARGA 2025 ( SENDO ATUALIZADO ).xlsx';

async function migrate() {
  let connection;
  try {
    const dbConfig = {
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      port: parseInt(process.env.MYSQL_PORT || '3306')
    };

    console.log('Iniciando migração...');
    connection = await mysql.createConnection(dbConfig);

    // Criar tabela se não existir
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS materiais (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setor VARCHAR(100),
        bmp VARCHAR(50),
        situacao VARCHAR(100),
        documento VARCHAR(255),
        descricao TEXT,
        categoria VARCHAR(50),
        quantidade INT DEFAULT 1,
        data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    const workbook = XLSX.readFile(filePath);
    const mappings: Record<string, string> = {
      'EPI': 'EPI',
      'CONSUMO E DURADOURO': 'CONSUMO',
      'EXTINTORES': 'EXTINTOR',
      'PERMANENTE ': 'PERMANENTE',
      'CONTROLE BMP': 'BMP'
    };

    for (const [sheetName, catName] of Object.entries(mappings)) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;

      const data: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (data.length < 2) continue;

      console.log(`Migrando itens da aba ${sheetName}...`);

      // Detectar cabeçalhos (procurar linha que contém BMP ou DESCRIÇÃO)
      let headerRowIndex = 0;
      for (let i = 0; i < Math.min(data.length, 5); i++) {
        if (data[i].some((cell: any) => String(cell).includes('BMP') || String(cell).includes('DESCRIÇÃO'))) {
          headerRowIndex = i;
          break;
        }
      }

      const headers = data[headerRowIndex];
      const rows = data.slice(headerRowIndex + 1);

      for (const row of rows) {
        if (!row || row.length === 0) continue;

        // Mapeamento dinâmico baseado na posição das colunas
        const getVal = (searchTerms: string[]) => {
          const idx = headers.findIndex((h: any) => searchTerms.some(term => String(h).toUpperCase().includes(term)));
          return idx !== -1 ? row[idx] : null;
        };

        const setor = getVal(['SETOR']) || '';
        const bmp = getVal(['BMP']) || '';
        const situacao = getVal(['SITUAÇÃO']) || '';
        const documento = getVal(['DOCUMENTO']) || '';
        const descricao = getVal(['DESCRIÇÃO']) || '';

        if (!descricao && !bmp) continue;

        await connection.execute(
          'INSERT INTO materiais (setor, bmp, situacao, documento, descricao, categoria) VALUES (?, ?, ?, ?, ?, ?)',
          [setor, bmp, situacao, documento, descricao, catName]
        );
      }
    }

    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro na migração:', error);
  } finally {
    if (connection) await connection.end();
  }
}

migrate();
