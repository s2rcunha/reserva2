/**
 * SISTEMA SESCINC-C0 - BACKEND GOOGLE SHEETS
 * Versão: 2.0.0
 * 
 * INSTRUÇÕES:
 * 1. Cole este código no Apps Script da sua Planilha.
 * 2. Certifique-se de que os nomes das abas na planilha coincidem com os definidos em 'SHEETS'.
 * 3. IMPORTANTE: Adicione as colunas 'observacoes', 'quantidade', 'extintor_tipo', 'extintor_peso', 'conta' e 'classe' (minúsculo) na aba MATERIAIS.
 * 4. Adicione a coluna 'executor' nas abas MOVIMENTACOES, CAUTELAS_EPI e ESTOQUE_BAIXA.
 * 5. No Google Apps Script, após colar o código, execute a função 'setup()' uma vez para garantir que as colunas existam.
 * 6. Implantar > Nova Implantação > Aplicativo da Web > Acesso: Qualquer Pessoa.
 */

var SS = SpreadsheetApp.getActiveSpreadsheet();

// Função para configurar as colunas iniciais (opcional, mas recomendado executar uma vez)
function setup() {
  var sheetMat = SS.getSheetByName(SHEETS.MATERIAIS);
  if (sheetMat) {
    var headers = sheetMat.getRange(1, 1, 1, sheetMat.getLastColumn()).getValues()[0];
    var needed = ['conta', 'classe'];
    needed.forEach(function(col) {
      if (headers.indexOf(col) === -1) {
        sheetMat.getRange(1, sheetMat.getLastColumn() + 1).setValue(col);
      }
    });
  }
}

// --- CONFIGURAÇÃO DAS ABAS (Nomes devem ser exatos na Planilha) ---
var MATERIAL_SHEETS = ["EPI_PRETO", "EPI_AMARELO", "CONSUMO", "PERMANENTE", "EXTINTORES"];
var SHEETS = {
  USUARIOS: "USUARIOS",
  BOMBEIROS: "BOMBEIROS",
  MOVIMENTACOES: "MOVIMENTACOES",
  CAUTELAS_EPI: "CAUTELAS_EPI",
  SETORES: "SETORES",
  AUDITORIA: "AUDITORIA",
  ESTOQUE_BAIXA: "ESTOQUE_BAIXA"
};

// --- PONTO DE ENTRADA PARA LEITURA (GET) ---
function doGet(e) {
  var action = e.parameter.action;
  
  try {
    if (action === 'updateStatus') return handleUpdateStatus(e.parameter.userId);
    if (action === 'getUsers') return response(getSheetData(SHEETS.USUARIOS));
    if (action === 'getSectors') return response(getSheetData(SHEETS.SETORES));
    if (action === 'getLoans') return response(getSheetData(SHEETS.MOVIMENTACOES));
    if (action === 'getAudit') return response(getSheetData(SHEETS.AUDITORIA));
    if (action === 'getBombeiros') return response(getSheetData(SHEETS.BOMBEIROS));
    if (action === 'getEpiLoans') return response(getSheetData(SHEETS.CAUTELAS_EPI));
    if (action === 'getStockPayouts') return response(getSheetData(SHEETS.ESTOQUE_BAIXA));
    
    if (action === 'stats') {
      var materiais = getAllMateriais();
      return response(calculateStats(materiais));
    }
    
    if (action === 'read') return response(filterMateriais(e.parameter));

    return response({error: "Ação GET não encontrada: " + action});
  } catch (err) {
    return response({error: err.toString()});
  }
}

// --- PONTO DE ENTRADA PARA ESCRITA (POST) ---
function doPost(e) {
  var postData;
  try {
    postData = JSON.parse(e.postData.contents);
  } catch(f) {
    // Fallback para caso o cabeçalho não venha como JSON
    postData = e.postData.contents; 
  }
  
  var action = postData.action;
  
  try {
    if (action === 'login') return response(handleLogin(postData));
    
    // Cadastros e Edições
    if (action === 'create_material' || action === 'update_material') {
      var mat = postData.material || postData;
      var sheetName = mat.categoria;
      if (MATERIAL_SHEETS.indexOf(sheetName) === -1) {
        return response({ error: "Categoria inválida: " + sheetName });
      }
      
      // Se for atualização, verifica se o material mudou de categoria (mudou de aba)
      if (mat.id) {
        var foundSheet = "";
        for (var s = 0; s < MATERIAL_SHEETS.length; s++) {
          var testSheet = SS.getSheetByName(MATERIAL_SHEETS[s]);
          if (!testSheet) continue;
          var testData = testSheet.getDataRange().getValues();
          for (var r = 1; r < testData.length; r++) {
            if (String(testData[r][0]) === String(mat.id)) {
              foundSheet = MATERIAL_SHEETS[s];
              break;
            }
          }
          if (foundSheet) break;
        }
        
        // Se encontrou em uma aba diferente da nova categoria, remove da antiga
        if (foundSheet && foundSheet !== sheetName) {
           deleteRow(foundSheet, mat.id, "SISTEMA (Troca de Categoria)");
        }
      }
      
      return response(saveRow(sheetName, mat, postData.executor));
    }
    if (action === 'create_user' || action === 'update_user') return response(saveRow(SHEETS.USUARIOS, postData, postData.executor));
    if (action === 'create_sector') return response(saveRow(SHEETS.SETORES, postData, postData.executor));
    if (action === 'create_bombeiro' || action === 'update_bombeiro') return response(saveRow(SHEETS.BOMBEIROS, postData, postData.executor));
    
    // Movimentações
    if (action === 'create_loan') return response(handleCreateLoan(postData));
    if (action === 'create_epi_loan') return response(handleCreateEPILoan(postData));
    if (action === 'return_epi') return response(handleReturnEPI(postData.id, postData.executor));
    if (action === 'return_loan') return response(handleReturnLoan(postData.id, postData.executor));
    
    // Estoque
    if (action === 'create_stock_payout') return response(handleStockPayout(postData));
    
    // Exclusão Geral
    if (action === 'delete_row') return response(deleteRow(postData.table, postData.id, postData.executor));

    return response({success: false, message: "Ação POST não reconhecida: " + action});
  } catch (err) {
    return response({success: false, message: err.toString()});
  }
}

// --- FUNÇÃO DE RESPOSTA ---
function response(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
         .setMimeType(ContentService.MimeType.JSON);
}

// --- LÓGICA DE DADOS ---

function getSheetData(sheetName) {
  var sheet = SS.getSheetByName(sheetName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0].map(function(h) { return String(h).trim(); });
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var hasData = false;
    for (var k = 0; k < data[i].length; k++) {
      if (data[i][k] !== "") { hasData = true; break; }
    }
    if (!hasData) continue;
    
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    result.push(obj);
  }
  return result;
}

function saveRow(sheetName, data, executor) {
  var sheet = SS.getSheetByName(sheetName);
  var headers = sheet.getDataRange().getValues()[0] || [];
  
  // Auto-adiciona colunas que faltam na planilha baseadas no payload
  var missingHeaders = false;
  for (var key in data) {
    if (key !== 'action' && key !== 'table' && key !== 'executor' && headers.indexOf(key) === -1) {
      if (data[key] !== undefined && data[key] !== "") {
        headers.push(key);
        missingHeaders = true;
      }
    }
  }
  
  if (missingHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  var id = data.id;
  
  if (id) { // UPDATE
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(id)) {
        for (var j = 0; j < headers.length; j++) {
          var header = headers[j];
          if (data[header] !== undefined) {
            sheet.getRange(i + 1, j + 1).setValue(data[header]);
          }
        }
        logAudit(executor, "EDIÇÃO", "Editou registro ID " + id + " em " + sheetName);
        return {success: true, id: id};
      }
    }
  } else { // CREATE
    var newId = new Date().getTime();
    var newRow = headers.map(function(h) { 
      if (h === 'id') return newId;
      return (data[h] !== undefined) ? data[h] : ""; 
    });
    sheet.appendRow(newRow);
    logAudit(executor, "CRIAÇÃO", "Criou novo registro em " + sheetName);
    return {success: true, id: newId};
  }
  return {success: false, message: "Registro não encontrado para atualização"};
}

function deleteRow(sheetName, id, executor) {
  var sheet = SS.getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      logAudit(executor, "EXCLUSÃO", "Excluiu ID " + id + " de " + sheetName);
      return {success: true};
    }
  }
  return {success: false, message: "Registro não encontrado para exclusão"};
}

// --- LÓGICAS ESPECÍFICAS ---

function handleLogin(data) {
  var users = getSheetData(SHEETS.USUARIOS);
  var user = users.find(function(u) { return String(u.login) === String(data.login) && String(u.senha) === String(data.senha); });
  if (user) {
    var userData = Object.assign({}, user);
    delete userData.senha;
    return {success: true, user: userData};
  }
  return {success: false, message: "Credenciais de acesso incorretas"};
}

function calculateStats(materiais) {
  var getVal = function(obj, key) {
    if (obj[key] !== undefined) return obj[key];
    var lowerKey = key.toLowerCase();
    for (var k in obj) {
      if (k.toLowerCase() === lowerKey) return obj[k];
    }
    return null;
  };

  var stats = {
    totalAtivos: materiais.filter(function(m) { 
      var fdc = getVal(m, 'fora_de_carga');
      var sit = getVal(m, 'situacao');
      return String(fdc).toUpperCase() != "SIM" && String(sit).toUpperCase() != "DESCARREGADO"; 
    }).length,
    totalHistorico: materiais.length,
    byStatus: {},
    byCategory: {}
  };
  materiais.forEach(function(m) {
    var sitVal = getVal(m, 'situacao') || "NÃO DEFINIDO";
    var catVal = getVal(m, 'categoria') || "OUTROS";

    var sit = String(sitVal).trim().toUpperCase();
    
    // Map categories to frontend IDs
    var rawCat = String(catVal).trim().toUpperCase();
    var cat = "OUTROS";
    if (rawCat.indexOf("EPI PRETO") > -1) cat = "EPI_PRETO";
    else if (rawCat.indexOf("EPI AMARELO") > -1) cat = "EPI_AMARELO";
    else if (rawCat.indexOf("CONSUMO") > -1) cat = "CONSUMO";
    else if (rawCat.indexOf("PERMANENTE") > -1) cat = "PERMANENTE";
    else if (rawCat.indexOf("EXTINTOR") > -1) cat = "EXTINTORES";
    else cat = rawCat.replace(/\s+/g, '_'); // Fallback
    
    stats.byStatus[sit] = (stats.byStatus[sit] || 0) + 1;
    stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;
  });
  return stats;
}

function getAllMateriais() {
  var results = [];
  for (var i = 0; i < MATERIAL_SHEETS.length; i++) {
    var data = getSheetData(MATERIAL_SHEETS[i]);
    for (var j = 0; j < data.length; j++) {
      if (!data[j].categoria) data[j].categoria = MATERIAL_SHEETS[i];
      results.push(data[j]);
    }
  }
  return results;
}

function filterMateriais(params) {
  var data = [];
  if (params.categoria && MATERIAL_SHEETS.indexOf(params.categoria) > -1) {
    data = getSheetData(params.categoria);
    for (var i = 0; i < data.length; i++) {
      if (!data[i].categoria) data[i].categoria = params.categoria;
    }
  } else {
    data = getAllMateriais();
  }
  return data.filter(function(m) {
    var match = true;
    
    // Normalize and trim values
    var cat = String(m.categoria || "").trim();
    var sector = String(m.setor || "").trim();
    var sit = String(m.situacao || "").trim();
    
    if (params.keyword) {
      var k = params.keyword.toLowerCase();
      var inBmp = String(m.bmp).toLowerCase().indexOf(k) > -1;
      var inDesc = String(m.descricao).toLowerCase().indexOf(k) > -1;
      var inDoc = String(m.documento).toLowerCase().indexOf(k) > -1;
      var inObs = String(m.observacoes || "").toLowerCase().indexOf(k) > -1;
      var inExtTipo = String(m.extintor_tipo || "").toLowerCase().indexOf(k) > -1;
      // Handle both possible field names for extinguisher weight
      var inExtPeso = String(m.extintor_peso || m.extintor_weight || "").toLowerCase().indexOf(k) > -1;
      var inCat = cat.toLowerCase().indexOf(k) > -1;
      var inSetor = sector.toLowerCase().indexOf(k) > -1;
      var inConta = String(m.conta || "").toLowerCase().indexOf(k) > -1;
      var inClasse = String(m.classe || "").toLowerCase().indexOf(k) > -1;
      
      if (!inBmp && !inDesc && !inDoc && !inObs && !inExtTipo && !inExtPeso && !inCat && !inSetor && !inConta && !inClasse) match = false;
    }
    
    if (params.setor && sector.toUpperCase() != String(params.setor).toUpperCase()) match = false;
    if (params.situacao && sit.toUpperCase() != String(params.situacao).toUpperCase()) match = false;
    
    if (params.categoria) {
      var pCat = String(params.categoria).toUpperCase();
      var mCat = cat.toUpperCase();
      // Allow partial match for safety but prioritize exact match
      if (mCat != pCat && mCat.indexOf(pCat) === -1 && pCat.indexOf(mCat) === -1) match = false;
    }

    if (params.extintor_tipo && String(m.extintor_tipo || "").toUpperCase() != String(params.extintor_tipo).toUpperCase()) match = false;
    if (params.extintor_peso && String(m.extintor_peso || m.extintor_weight || "").toUpperCase() != String(params.extintor_peso).toUpperCase()) match = false;
    
    // Boolean filters (check for "SIM" or true literal)
    if (params.ti === "true" && m.ti != "SIM" && m.ti !== true) match = false;
    if (params.hi === "true" && m.hi != "SIM" && m.hi !== true) match = false;
    if (params.aph === "true" && m.aph != "SIM" && m.aph !== true) match = false;
    if (params.instr === "true" && m.instr != "SIM" && m.instr !== true) match = false;
    
    // Fora de Carga logic
    if (params.fora_de_carga === "true" && m.fora_de_carga != "SIM" && m.fora_de_carga !== true) match = false;
    if (params.fora_de_carga === "false" && (m.fora_de_carga == "SIM" || m.fora_de_carga === true)) match = false;
    
    return match;
  });
}

function handleCreateLoan(postData) {
  var materialIds = postData.materiais || [];
  if (typeof materialIds === 'string') materialIds = JSON.parse(materialIds);
  
  // 1. Registrar a movimentação
  var loanResult = saveRow(SHEETS.MOVIMENTACOES, {
    solicitante: postData.solicitante,
    solicitante_telefone: postData.telefone,
    solicitante_ramal: postData.ramal,
    solicitante_setor: postData.setor,
    retirada: postData.retirada || new Date().toISOString(),
    previsao: postData.previsao,
    autorizado_por: postData.autorizado_por,
    status: "EMPRESTADO",
    materiais_json: JSON.stringify(materialIds)
  }, postData.autorizado_por);
  
  // 2. Atualizar status dos materiais para EMPRESTADO
  updateMaterialCells(materialIds, { "situacao": "EMPRESTADO" });
  
  return loanResult;
}

function updateMaterialCells(materialIds, modifications) {
  var ids = materialIds.map(function(item) {
    return String(typeof item === 'object' ? item.id : item);
  });
  for (var s = 0; s < MATERIAL_SHEETS.length; s++) {
    var sheet = SS.getSheetByName(MATERIAL_SHEETS[s]);
    if (!sheet) continue;
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    for (var i = 1; i < data.length; i++) {
        if (ids.indexOf(String(data[i][0])) > -1) {
            for (var key in modifications) {
                var cIdx = headers.indexOf(key);
                if (cIdx > -1) sheet.getRange(i + 1, cIdx + 1).setValue(modifications[key]);
            }
        }
    }
  }
}

function handleCreateEPILoan(postData) {
  // O sistema de EPI usa numeração de controle, então aqui registramos apenas a cautela
  var result = saveRow(SHEETS.CAUTELAS_EPI, {
    bombeiro_id: postData.bombeiro_id,
    pecas_json: postData.pecas_json,
    solicitante_telefone: postData.telefone,
    solicitante_ramal: postData.ramal,
    solicitante_setor: postData.setor,
    data_retirada: new Date().toISOString(),
    status: "EM_USO",
    executor: postData.executor
  }, postData.executor);
  
  // Poderia adicionar lógica para marcar o material de EPI como EMPRESTADO também
  return result;
}

function handleReturnEPI(loanId, executor) {
  var sheet = SS.getSheetByName(SHEETS.CAUTELAS_EPI);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var statusIdx = headers.indexOf('status');
  var devDateIdx = headers.indexOf('data_devolucao');
  
  if (statusIdx === -1) {
    statusIdx = headers.length;
    sheet.getRange(1, statusIdx + 1).setValue('status');
    headers.push('status');
  }
  if (devDateIdx === -1) {
    devDateIdx = headers.length;
    sheet.getRange(1, devDateIdx + 1).setValue('data_devolucao');
    headers.push('data_devolucao');
  }

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(loanId)) {
      sheet.getRange(i + 1, devDateIdx + 1).setValue(new Date().toISOString()); // data_devolucao
      sheet.getRange(i + 1, statusIdx + 1).setValue("DEVOLVIDO"); // status
      logAudit(executor, "DEVOLUÇÃO", "Devolução de EPI Cautela ID " + loanId);
      return {success: true};
    }
  }
  return {success: false, message: "Cautela não encontrada"};
}

function handleReturnLoan(loanId, executor) {
  var sheetLoan = SS.getSheetByName(SHEETS.MOVIMENTACOES);
  var loanData = sheetLoan.getDataRange().getValues();
  var loanHeaders = loanData[0];
  var matJsonIdx = loanHeaders.indexOf('materiais_json');
  var statusIdx = loanHeaders.indexOf('status');
  
  for (var i = 1; i < loanData.length; i++) {
    if (String(loanData[i][0]) === String(loanId)) {
      var materialIds = [];
      try {
        materialIds = JSON.parse(loanData[i][matJsonIdx]);
      } catch(e) {
        // Tenta tratar como string simples se falhar o parse
        materialIds = [loanData[i][matJsonIdx]];
      }
      
      // 1. Marcar empréstimo como DEVOLVIDO e registrar data/executor
      sheetLoan.getRange(i + 1, statusIdx + 1).setValue("DEVOLVIDO");
      
      var returnDateIdx = loanHeaders.indexOf('data_devolucao');
      var returnExecutorIdx = loanHeaders.indexOf('executor_devolucao');
      
      if (returnDateIdx > -1) {
        sheetLoan.getRange(i + 1, returnDateIdx + 1).setValue(new Date().toLocaleString());
      }
      if (returnExecutorIdx > -1) {
        sheetLoan.getRange(i + 1, returnExecutorIdx + 1).setValue(executor);
      }
      
      // 2. Voltar materiais para PERFEITO (DISPONÍVEL)
      updateMaterialCells(materialIds, { "situacao": "PERFEITO" });
      
      logAudit(executor, "DEVOLUÇÃO", "Devolução de Empréstimo ID " + loanId);
      return {success: true};
    }
  }
  return {success: false, message: "Empréstimo não encontrado"};
}

function handleStockPayout(postData) {
  var materialId = postData.material_id;
  var quantity = Number(postData.quantidade);
  
  var matRowIndex = -1;
  var currentStock = 0;
  var targetSheet = null;
  var qtyIdx = -1;
  
  for (var s = 0; s < MATERIAL_SHEETS.length; s++) {
    var sheetMat = SS.getSheetByName(MATERIAL_SHEETS[s]);
    if (!sheetMat) continue;
    var matData = sheetMat.getDataRange().getValues();
    var headersMat = matData[0];
    var cIdx = headersMat.indexOf('quantidade');
    
    for (var i = 1; i < matData.length; i++) {
      if (String(matData[i][0]) === String(materialId)) {
        targetSheet = sheetMat;
        qtyIdx = cIdx;
        matRowIndex = i + 1;
        currentStock = Number(matData[i][cIdx]) || 0;
        break;
      }
    }
    if (matRowIndex !== -1) break;
  }
  
  if (matRowIndex === -1) return {success: false, message: "Material não encontrado"};
  if (currentStock < quantity) return {success: false, message: "Estoque insuficiente. Disponível: " + currentStock};
  
  var payoutResult = saveRow(SHEETS.ESTOQUE_BAIXA, {
    material_id: materialId,
    solicitante: postData.solicitante,
    solicitante_telefone: postData.telefone,
    solicitante_ramal: postData.ramal,
    solicitante_setor: postData.setorSolicitante,
    setor: postData.setor,
    quantidade: quantity,
    data: new Date().toISOString(),
    executor: postData.executor
  }, postData.executor);
  
  if (payoutResult.success && targetSheet && qtyIdx > -1) {
    targetSheet.getRange(matRowIndex, qtyIdx + 1).setValue(currentStock - quantity);
    logAudit(postData.executor, "BAIXA ESTOQUE", "Pagamento de " + quantity + " unidades do material ID " + materialId);
  }
  
  return payoutResult;
}

function handleUpdateStatus(userId) {
  var sheet = SS.getSheetByName(SHEETS.USUARIOS);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(userId)) {
      sheet.getRange(i + 1, 7).setValue(new Date()); // ultima_atividade
      return ContentService.createTextOutput("ok");
    }
  }
  return ContentService.createTextOutput("erro: usuario nao encontrado");
}

function logAudit(user, acao, detalhes) {
  var sheet = SS.getSheetByName(SHEETS.AUDITORIA);
  if (!sheet) return;
  sheet.appendRow([
    new Date().getTime(),
    new Date().toLocaleString(),
    user || "Sistema",
    acao,
    detalhes
  ]);
}
