/**
 * GOOGLE APPS SCRIPT V2 - BACKEND SESCINC-C0
 * Tabelas: MATERIAIS, USUARIOS, EMPRESTIMOS, AVARIAS
 */

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = [
    { name: 'USUARIOS', head: ['ID', 'NOME', 'LOGIN', 'SENHA', 'NIVEL'] },
    { name: 'MATERIAIS', head: ['ID', 'SETOR', 'BMP', 'SITUACAO', 'DOCUMENTO', 'DESCRICAO', 'CATEGORIA', 'ITEM_EPI', 'EPI_NUMERO', 'FORA_DE_CARGA', 'TI', 'HI', 'APH', 'INSTR', 'DATA_ENTRADA', 'TAMANHO', 'RESPONSAVEL'] },
    { name: 'EMPRESTIMOS', head: ['ID', 'SOLICITANTE', 'MATERIAIS_JSON', 'RETIRADA', 'PREVISAO', 'AUTORIZADO_POR', 'STATUS'] },
    { name: 'AVARIAS', head: ['ID', 'BMP', 'DESCRICAO', 'DATA', 'RELATADO_POR'] },
    { name: 'SETORES', head: ['ID', 'NOME'] },
    { name: 'AUDITORIA', head: ['ID', 'DATA', 'USUARIO', 'ACAO', 'DETALHES'] }
  ];
  
  sheets.forEach(s => {
    let sheet = ss.getSheetByName(s.name);
    if (!sheet) {
      sheet = ss.insertSheet(s.name);
      sheet.appendRow(s.head);
    } else {
      // Auto-update headers that might be missing
      let existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).getValues()[0];
      s.head.forEach(h => {
        if (!existingHeaders.includes(h) && !existingHeaders.includes(h.toLowerCase())) {
          sheet.getRange(1, existingHeaders.length + 1).setValue(h);
          existingHeaders.push(h);
        }
      });
    }
  });
  
  // Criar Usuário Admin Padrão se não existir
  const uSheet = ss.getSheetByName('USUARIOS');
  if (uSheet.getLastRow() === 1) {
    uSheet.appendRow(['1', 'Administrador', 'admin', 'admin123', 'ADMIN']);
  }
}

function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (action === 'read') return handleRead(ss, e.parameter);
  if (action === 'stats') return handleStats(ss);
  if (action === 'getUsers') return handleTable(ss, 'USUARIOS');
  if (action === 'getLoans') return handleTable(ss, 'EMPRESTIMOS');
  if (action === 'getSectors') return handleTable(ss, 'SETORES');
  if (action === 'getAudit') return handleTable(ss, 'AUDITORIA');
  
  return Response({ error: 'Ação inválida' });
}

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const data = JSON.parse(e.postData.contents);
  const action = data.action;

  if (action === 'login') return handleLogin(ss, data);
  if (action === 'create_material') return handleCreateMaterial(ss, data);
  if (action === 'update_material') return handleUpdateRow(ss, 'MATERIAIS', data);
  if (action === 'delete_row') return handleDeleteRow(ss, data.table, data.id, data.executor);
  if (action === 'create_user') return handleCreateUser(ss, data);
  if (action === 'create_loan') return handleCreateLoan(ss, data);
  if (action === 'create_avaria') return handleCreateAvaria(ss, data);
  if (action === 'create_sector') return handleCreateSector(ss, data);

  return Response({ error: 'Ação POST inválida' });
}

function handleLogin(ss, data) {
  const sheet = ss.getSheetByName('USUARIOS');
  const values = sheet.getDataRange().getValues();
  const user = values.find(r => r[2] === data.login && r[3] === data.senha);
  
  if (user) {
    return Response({ 
      success: true, 
      user: { id: user[0], nome: user[1], login: user[2], nivel: user[4] } 
    });
  }
  return Response({ success: false, message: 'Login ou senha incorretos' });
}

function handleRead(ss, params) {
  const sheet = ss.getSheetByName('MATERIAIS');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  let result = rows.map((row, index) => {
    const obj = { id: row[0] || (index + 2) }; // Usa a coluna ID real se existir
    headers.forEach((h, i) => {
      const key = String(h).toLowerCase().trim();
      if (key) obj[key] = row[i];
    });
    return obj;
  });

  // Filtros Avançados
  if (params.keyword) {
    const keywords = params.keyword.toLowerCase().split(/\s+/).filter(k => k.length > 0);
    result = result.filter(r => {
      // Extended search to include item_epi and epi_numero for better EPI finding
      const searchStr = `${r.bmp} ${r.descricao} ${r.item_epi || ''} ${r.epi_numero || ''}`.toLowerCase();
      return keywords.every(kw => searchStr.includes(kw));
    });
  }
  if (params.bmp) result = result.filter(r => String(r.bmp).includes(params.bmp));
  if (params.setor) result = result.filter(r => String(r.setor) === params.setor);
  if (params.situacao) result = result.filter(r => String(r.situacao) === params.situacao);
  if (params.categoria) result = result.filter(r => String(r.categoria) === params.categoria);
  if (params.item_epi) result = result.filter(r => String(r.item_epi) === params.item_epi);
  if (params.ti === 'true') result = result.filter(r => r.ti === true || String(r.ti).toUpperCase() === 'SIM');
  if (params.hi === 'true') result = result.filter(r => r.hi === true || String(r.hi).toUpperCase() === 'SIM');
  if (params.aph === 'true') result = result.filter(r => r.aph === true || String(r.aph).toUpperCase() === 'SIM');
  if (params.instr === 'true') result = result.filter(r => r.instr === true || String(r.instr).toUpperCase() === 'SIM');
  if (params.fora_de_carga === 'false') result = result.filter(r => r.fora_de_carga === false || String(r.fora_de_carga).toUpperCase() !== 'SIM');

  return Response(result);
}

function handleTable(ss, tableName) {
  const sheet = ss.getSheetByName(tableName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  return Response(rows.map((row, index) => {
    const obj = { id: row[0] || (index + 2) };
    headers.forEach((h, i) => {
      const key = String(h).toLowerCase().trim();
      if (key) obj[key] = row[i];
    });
    return obj;
  }));
}

function handleCreateMaterial(ss, data) {
  const sheet = ss.getSheetByName('MATERIAIS');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).getValues()[0];
  
  // Auto-adiciona colunas que faltam baseadas no payload
  let missingHeaders = false;
  for (let key in data) {
    if (key !== 'action' && key !== 'executor' && !headers.includes(key.toUpperCase()) && !headers.includes(key.toLowerCase()) && data[key] !== "") {
      headers.push(key.toUpperCase());
      missingHeaders = true;
    }
  }
  
  if (missingHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  const newRow = headers.map(h => data[String(h).toLowerCase()] || "");
  sheet.appendRow(newRow);
  
  logAudit(ss, data.executor || "Desconhecido", "CADASTRO_MATERIAL", `BMP: ${data.bmp} - ${data.descricao}`);
  return Response({ success: true });
}

function handleUpdateRow(ss, table, data) {
  const sheet = ss.getSheetByName(table);
  const dataValues = sheet.getDataRange().getValues();
  let rowIndex = data.id; // Assume que é o índice da linha inicialmente
  
  if (data.id > 100000) { // É provável que seja um ID de timestamp
    const foundIndex = dataValues.findIndex((row, idx) => idx > 0 && String(row[0]) === String(data.id));
    if (foundIndex !== -1) rowIndex = foundIndex + 1;
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).getValues()[0];
  
  // Auto-adiciona colunas que faltam baseadas no payload
  let missingHeaders = false;
  for (let key in data) {
    if (key !== 'action' && key !== 'executor' && key !== 'table' && key !== 'id' && !headers.includes(key.toUpperCase()) && !headers.includes(key.toLowerCase()) && data[key] !== "") {
      headers.push(key.toUpperCase());
      missingHeaders = true;
    }
  }
  
  if (missingHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  headers.forEach((h, i) => {
    const key = String(h).toLowerCase().trim();
    const val = data[key];
    if (val !== undefined && key !== 'id') sheet.getRange(rowIndex, i + 1).setValue(val);
  });
  
  logAudit(ss, data.executor || "Desconhecido", `EDICAO_${table}`, `ID: ${data.id}`);
  return Response({ success: true });
}

function handleDeleteRow(ss, table, id, executor) {
  const sheet = ss.getSheetByName(table);
  const dataValues = sheet.getDataRange().getValues();
  let rowIndex = id;
  
  if (id > 100000) {
    const foundIndex = dataValues.findIndex((row, idx) => idx > 0 && String(row[0]) === String(id));
    if (foundIndex !== -1) rowIndex = foundIndex + 1;
  }

  sheet.deleteRow(rowIndex);
  
  logAudit(ss, executor || "Desconhecido", `EXCLUSAO_${table}`, `ID: ${id}`);
  return Response({ success: true });
}

function handleCreateUser(ss, data) {
  const sheet = ss.getSheetByName('USUARIOS');
  sheet.appendRow([
    new Date().getTime(),
    data.nome,
    data.login,
    data.senha,
    data.nivel
  ]);
  
  logAudit(ss, data.executor || "Desconhecido", "CADASTRO_USUARIO", `Nome: ${data.nome}`);
  return Response({ success: true });
}

function handleCreateAvaria(ss, data) {
  const sheet = ss.getSheetByName('AVARIAS');
  sheet.appendRow([
    new Date().getTime(),
    data.bmp,
    data.descricao,
    new Date().toLocaleString(),
    data.relatado_por
  ]);
  
  logAudit(ss, data.relatado_por, "REGISTRO_AVARIA", `BMP: ${data.bmp}`);
  return Response({ success: true });
}

function handleCreateSector(ss, data) {
  const sheet = ss.getSheetByName('SETORES');
  sheet.appendRow([
    new Date().getTime(),
    data.nome
  ]);
  
  logAudit(ss, data.executor || "Desconhecido", "CADASTRO_SETOR", `Nome: ${data.nome}`);
  return Response({ success: true });
}

function handleCreateLoan(ss, data) {
  const sheet = ss.getSheetByName('EMPRESTIMOS');
  sheet.appendRow([
    new Date().getTime(),
    data.solicitante,
    JSON.stringify(data.materiais),
    data.retirada,
    data.previsao,
    data.autorizado_por,
    'ATIVO'
  ]);
  
  logAudit(ss, data.autorizado_por, "REGISTRO_EMPRESTIMO", `Solicitante: ${data.solicitante}`);
  return Response({ success: true });
}

function handleStats(ss) {
  const mSheet = ss.getSheetByName('MATERIAIS');
  const data = mSheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  const stats = {
    totalHistorico: rows.length,
    totalAtivos: 0,
    byCategory: {},
    byStatus: {}
  };

  const catIdx = headers.indexOf('CATEGORIA');
  const sitIdx = headers.indexOf('SITUACAO');

  rows.forEach(row => {
    const cat = String(row[catIdx] || 'OUTROS').toUpperCase();
    const sit = String(row[sitIdx] || 'NÃO INFORMADO').toUpperCase();
    
    stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;
    stats.byStatus[sit] = (stats.byStatus[sit] || 0) + 1;
    
    // De acordo com o critério militar, itens "Ativos" são os que não estão em situação de saída definitiva
    if (sit !== 'DESCARREGADO' && sit !== 'TRANSFERIDO' && sit !== 'CONDENADO') {
      stats.totalAtivos++;
    }
  });

  return Response(stats);
}

function logAudit(ss, user, action, details) {
  const sheet = ss.getSheetByName('AUDITORIA');
  sheet.appendRow([
    new Date().getTime(),
    new Date().toLocaleString(),
    user,
    action,
    details
  ]);
}

function Response(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
