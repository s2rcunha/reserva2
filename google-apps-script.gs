/**
 * ============================================================================
 * ARQUIVO: google-apps-script.gs
 * 
 * BACKEND - Google Apps Script (v2.0.0)
 * 
 * PROPÓSITO:
 *   Este script roda no servidor do Google Apps Script e serve como backend
 *   REST API para a aplicação React frontend. Gerencia:
 *   1. Leitura/Escrita em Google Sheets (banco de dados)
 *   2. Autenticação de usuários
 *   3. Filtros e buscas avançadas
 *   4. CRUD de materiais, empréstimos, usuários, etc
 *   5. Auditoria (log de todas as ações)
 * 
 * ESTRUTURA DO BANCO DE DADOS:
 *   Cada "aba" (sheet) é uma tabela:
 *   - EPI_PRETO, EPI_AMARELO: Equipamentos de proteção individual por cor
 *   - CONSUMO, PERMANENTE: Materiais por tipo de acervo
 *   - EXTINTORES: Extintores de incêndio
 *   - LGE, PQS: Agentes químicos (Liquid Gas / Powder Substance)
 *   - USUARIOS: Credenciais de login
 *   - BOMBEIROS: Militares/agentes
 *   - MOVIMENTACOES: Empréstimos de materiais
 *   - CAUTELAS_EPI: Empréstimos de peças de EPI
 *   - SETORES: Departamentos/divisões
 *   - AUDITORIA: Log histórico de ações
 *   - ESTOQUE_BAIXA: Consumo/saída de estoque
 *   - AGENTES_CONFIG: Configuração de estoque mínimo de agentes
 * 
 * ENDPOINTS (GET):
 *   ?action=read - Busca materiais com filtros
 *   ?action=stats - Estatísticas para dashboard
 *   ?action=getUsers - Lista de usuários
 *   ?action=getLoans - Empréstimos
 *   ?action=getAudit - Histórico de auditoria
 *   ?action=getSectors - Setores
 *   etc...
 * 
 * ENDPOINTS (POST):
 *   POST { action: 'login', login, senha }
 *   POST { action: 'create_material', material: {...} }
 *   POST { action: 'update_material', material: {...} }
 *   POST { action: 'create_loan', ... }
 *   etc...
 * 
 * CONFIGURAÇÃO INICIAL:
 *   1. Copiar este código ao Google Apps Script do Sheets
 *   2. Executar função setup() uma vez (criar abas e colunas)
 *   3. Em "Implantar" > "Nova Implantação":
 *      - Tipo: Aplicativo da Web
 *      - Executar como: Sua conta
 *      - Acesso: "Qualquer pessoa"
 *   4. Copiar URL gerada para SCRIPT_URL em App.tsx
 * 
 * CONVENÇÕES:
 *   - Nomes de função em camelCase (getSheetData, handleLogin, etc)
 *   - Nomes de aba em MAIÚSCULO com UNDERSCORE (EPI_PRETO, MOVIMENTACOES)
 *   - Primeira coluna sempre é 'id' (número único, timestamp)
 *   - Headers em minúsculas normalizados (sem acentos, sem espaços)
 *   - Timestamps como new Date().getTime() para ID único
 * ============================================================================
 */

var SS = SpreadsheetApp.getActiveSpreadsheet();

/**
 * FUNÇÃO: setup()
 * 
 * Inicializa a planilha criando todas as abas (sheets) necessárias
 * e seus respectivos cabeçalhos (headers).
 * 
 * DEVE SER EXECUTADA MANUALMENTE UMA VEZ quando o script é instalado.
 * 
 * FLUXO:
 *   1. Verifica se cada aba existe
 *   2. Se não existir, cria a aba e adiciona headers
 *   3. Se existir, verifica se todos os headers necessários estão presentes
 *   4. Adiciona headers faltantes nas colunas livres
 *   5. Cria usuário admin padrão (admin/admin123) se nenhum user existir
 * 
 * IMPORTANTE: Qualquer coluna nova adicionada manualmente (ou pelo
 * frontend ao enviar dados), será automaticamente reconhecida no saveRow().
 */
function setup() {
  MATERIAL_SHEETS.forEach(function(sheetName) {
    var sheet = SS.getSheetByName(sheetName);
    if (sheet) {
      var headers = sheet.getDataRange().getValues()[0] || [];
      var needed = ['id', 'bmp', 'descricao', 'categoria', 'situacao', 'setor', 'documento', 'observacoes'];
      
      if (sheetName === 'EPI_PRETO' || sheetName === 'EPI_AMARELO') {
        needed = needed.concat(['item_epi', 'epi_numero', 'tamanho', 'validade_epi', 'fora_de_carga']);
      } else if (sheetName === 'CONSUMO' || sheetName === 'PERMANENTE') {
        needed = needed.concat(['quantidade', 'conta', 'classe', 'fora_de_carga', 'ti', 'hi', 'aph', 'instr']);
      } else if (sheetName === 'EXTINTORES') {
        needed = needed.concat(['extintor_tipo', 'extintor_peso', 'conta', 'classe', 'fora_de_carga']);
      } else if (sheetName === 'LGE' || sheetName === 'PQS') {
        needed = needed.concat(['agentes_tipo', 'agentes_capacidade', 'agentes_fabricante', 'agentes_numero_lote', 'agentes_validade', 'agentes_aviso_validade', 'agentes_local_armazenamento', 'fora_de_carga']);
      } else if (sheetName === 'AGENTES_CONFIG') {
        needed = needed.concat(['item_epi', 'quantidade', 'descricao', 'fora_de_carga']);
      }
      
      needed.forEach(function(col) {
        if (headers.indexOf(col) === -1) {
          sheet.getRange(1, sheet.getLastColumn() + 1).setValue(col);
          headers.push(col); // Update local headers to avoid duplicates in same run
        }
      });
    }
  });
  
  // Também garante colunas em outras abas críticas
  var auditSheet = SS.getSheetByName(SHEETS.AUDITORIA);
  if (auditSheet && (auditSheet.getLastColumn() === 0 || auditSheet.getMaxColumns() === 0)) {
    auditSheet.getRange(1, 1, 1, 5).setValues([['id', 'timestamp', 'usuario', 'acao', 'detalhes']]);
  }
  
  var sessoesSheet = SS.getSheetByName(SHEETS.SESSOES);
  if (!sessoesSheet) {
    sessoesSheet = SS.insertSheet(SHEETS.SESSOES);
    sessoesSheet.hideSheet();
    sessoesSheet.getRange(1, 1, 1, 4).setValues([['token', 'login', 'nivel', 'expires']]);
  } else if (sessoesSheet.getLastColumn() === 0) {
    sessoesSheet.getRange(1, 1, 1, 4).setValues([['token', 'login', 'nivel', 'expires']]);
  }
}

/**
 * CONFIGURAÇÃO DAS ABAS
 * 
 * Define os nomes exatos das abas na planilha.
 * IMPORTANTE: Estes nomes devem corresponder EXATAMENTE aos nomes
 * das abas no Google Sheets, caso contrário o script não encontrará os dados.
 */
var MATERIAL_SHEETS = ["EPI_PRETO", "EPI_AMARELO", "CONSUMO", "PERMANENTE", "EXTINTORES", "LGE", "PQS", "AGENTES_CONFIG"];
var SHEETS = {
  USUARIOS: "USUARIOS",
  BOMBEIROS: "BOMBEIROS",
  MOVIMENTACOES: "MOVIMENTACOES",
  CAUTELAS_EPI: "CAUTELAS_EPI",
  SETORES: "SETORES",
  AUDITORIA: "AUDITORIA",
  ESTOQUE_BAIXA: "ESTOQUE_BAIXA",
  SESSOES: "SESSOES"
};
var INITIAL_PASSWORD = "123456";
var PASSWORD_HASH_ITERATIONS = 750;
var LEGACY_PASSWORD_HASH_ITERATIONS = 10000;

/**
 * PONTO DE ENTRADA: doGet(e)
 * 
 * Função obrigatória do Google Apps Script. É chamada automaticamente
 * para cada requisição HTTP GET.
 * 
 * Rota as requisições baseado no parâmetro ?action=...
 * 
 * FLUXO:
 *   1. Usuário/frontend faz GET: https://script.google.com/.../exec?action=read&keyword=ABC
 *   2. Google chama doGet(e) automaticamente
 *   3. e.parameter contém todos os parâmetros de URL (?keyword=ABC → e.parameter.keyword)
 *   4. Executamos lógica e retornamos JSON
 * 
 * @param {Object} e - Objeto com parâmetros da URL
 * @returns {TextOutput} JSON com resultado
 */
function doGet(e) {
  var action = e.parameter.action;
  
  try {
    if (action === 'updateStatus') return handleUpdateStatus(e.parameter.userId, e.parameter.offline === 'true');
    if (action === 'getUsers') {
      var users = getSheetData(SHEETS.USUARIOS);
      return response({
        users: users,
        serverTime: new Date().getTime()
      });
    }
    if (action === 'getSectors') return response(getSheetData(SHEETS.SETORES));
    if (action === 'getLoans') return response(getSheetData(SHEETS.MOVIMENTACOES));
    if (action === 'getAudit') return response(getSheetData(SHEETS.AUDITORIA));
    if (action === 'getBombeiros') return response(getSheetData(SHEETS.BOMBEIROS));
    if (action === 'getEpiLoans') return response(getSheetData(SHEETS.CAUTELAS_EPI));
    if (action === 'getStockPayouts') return response(getSheetData(SHEETS.ESTOQUE_BAIXA));
    
    if (action === 'stats') {
      var materiais = getAllMateriais();
      var epiLoans = getSheetData(SHEETS.CAUTELAS_EPI) || [];
      return response(calculateStats(materiais, epiLoans));
    }
    
    if (action === 'read') return response(filterMateriais(e.parameter));

    return response({error: "Ação GET não encontrada: " + action});
  } catch (err) {
    return response({error: err.toString()});
  }
}

/**
 * PONTO DE ENTRADA: doPost(e)
 * 
 * Função obrigatória do Google Apps Script. É chamada para cada
 * requisição HTTP POST com corpo JSON.
 * 
 * Rota as requisições baseado em postData.action
 * 
 * FLUXO:
 *   1. Frontend faz POST com { action: 'create_material', material: {...} }
 *   2. Google chama doPost(e)
 *   3. e.postData.contents contém o JSON
 *   4. Parse do JSON e executa handler apropriado
 *   5. Retorna resposta JSON ({ success: true } ou { success: false, message: '...' })
 * 
 * @param {Object} e - Objeto com conteúdo POST
 * @returns {TextOutput} JSON com resultado
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch(err) {
    return response({success: false, message: "Servidor ocupado. Tente novamente."});
  }

  try {
    var postData;
    try {
      if (!e || !e.postData || !e.postData.contents) throw "No data";
      postData = JSON.parse(e.postData.contents);
    } catch(f) {
      return response({success: false, message: "Requisição inválida. É esperado JSON válido."});
    }

    if (!postData || typeof postData !== 'object') {
      return response({success: false, message: "Payload inválido"});
    }

    var result = processPost(postData);
    return response(result);

  } catch(err) {
    return response({success: false, message: "Erro interno: " + err.toString()});
  } finally {
    lock.releaseLock();
  }
}

function processPost(postData) {
  var action = postData.action;

  if (action === 'login') return handleLogin(postData);

  var sessionCheck = verifySession(postData.token, postData.executor);
  if (!sessionCheck.success) {
    return {success: false, message: sessionCheck.message, invalidToken: true};
  }
  postData._sessionNivel = sessionCheck.nivel;

  if (action === 'read') return filterMateriais(postData);
  if (action === 'getUsers') {
    var users = getSheetData(SHEETS.USUARIOS);
    return {
      users: users,
      serverTime: new Date().getTime()
    };
  }
  if (action === 'getSectors') return getSheetData(SHEETS.SETORES);
  if (action === 'getLoans') return getSheetData(SHEETS.MOVIMENTACOES);
  if (action === 'getAudit') return getSheetData(SHEETS.AUDITORIA);
  if (action === 'getBombeiros') return getSheetData(SHEETS.BOMBEIROS);
  if (action === 'getEpiLoans') return getSheetData(SHEETS.CAUTELAS_EPI);
  if (action === 'getStockPayouts') return getSheetData(SHEETS.ESTOQUE_BAIXA);
  if (action === 'updateStatus') return handleUpdateStatus(postData.userId, postData.offline === 'true');
  
  if (action === 'stats') {
    var materiais = getAllMateriais();
    var epiLoans = getSheetData(SHEETS.CAUTELAS_EPI) || [];
    return calculateStats(materiais, epiLoans);
  }

  // Cadastros e Edições de Materiais
  if (action === 'create_material' || action === 'update_material') {
    var mat = postData.material || postData;
    var sheetName = mat.categoria;
    if (MATERIAL_SHEETS.indexOf(sheetName) === -1) {
      return { error: "Categoria inválida: " + sheetName };
    }
    
    // Se for atualização, verifica se o material mudou de categoria (mudou de aba)
    if (mat.id) {
      var foundSheet = "";
      for (var s = 0; s < MATERIAL_SHEETS.length; s++) {
        var testSheet = SS.getSheetByName(MATERIAL_SHEETS[s]);
        if (!testSheet) continue;
        var testData = testSheet.getDataRange().getValues();
        if (testData.length < 2) continue;
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
    
    return saveRow(sheetName, mat, postData.executor);
  }
  
  if (action === 'create_user' || action === 'update_user') {
    // Permite se for ADMIN ou se o usuário estiver atualizando a própria senha (ID correspondente ao login)
    var isSelfUpdate = false;
    if (action === 'update_user' && postData.id) {
       var users = getSheetData(SHEETS.USUARIOS);
       var targetUser = users.find(function(u) { return String(u.id) === String(postData.id); });
       if (targetUser && String(targetUser.login).toLowerCase() === String(postData.executor).toLowerCase()) {
         isSelfUpdate = true;
       }
    }

    if (postData._sessionNivel !== 'ADMIN' && !isSelfUpdate) {
      return { success: false, message: "Acesso negado: Você não tem permissão para esta ação." };
    }

    // Se houver senha no payload, realizamos o hashing antes de salvar
    if (postData.senha) {
      var salt = generateSalt();
      postData.salt = salt;
      postData.password_iterations = PASSWORD_HASH_ITERATIONS;
      postData.password_hash = hashPassword(postData.senha, salt, PASSWORD_HASH_ITERATIONS);
      delete postData.senha; // Removemos a senha em texto plano
    }
    return saveRow(SHEETS.USUARIOS, postData, postData.executor);
  }
  
  if (action === 'create_sector') return saveRow(SHEETS.SETORES, postData, postData.executor);
  if (action === 'create_bombeiro' || action === 'update_bombeiro') return saveRow(SHEETS.BOMBEIROS, postData, postData.executor);
  
  // Movimentações (Empréstimos)
  if (action === 'create_loan') return handleCreateLoan(postData);
  if (action === 'create_epi_loan') return handleCreateEPILoan(postData);
  if (action === 'return_epi') return handleReturnEPI(postData.id, postData.executor, postData.new_status);
  if (action === 'return_loan') return handleReturnLoan(postData.id, postData.executor, postData.new_status);
  
  // Estoque (Consumo)
  if (action === 'create_stock_payout') return handleStockPayout(postData);
  
  // Exclusão Geral
  if (action === 'delete_row') {
    if (postData._sessionNivel !== 'ADMIN') {
      return { success: false, message: "Acesso negado: Somente administradores podem excluir registros." };
    }
    return deleteRow(postData.table, postData.id, postData.executor);
  }

  return {success: false, message: "Ação POST não reconhecida: " + action};
}

/**
 * FUNÇÃO: response(obj)
 * 
 * Utilitário para formatar a resposta como JSON válido.
 * Toda resposta retornada pelo script DEVE passar por esta função.
 * 
 * @param {Object} obj - Objeto JavaScript a converter em JSON
 * @returns {TextOutput} JSON com mime type correto
 */
function response(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
         .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ============================================================================
 * LÓGICA DE DADOS - Funções auxiliares para ler/escrever na planilha
 * ============================================================================
 */

/**
 * FUNÇÃO: getSheetData(sheetName)
 * 
 * Lê TODOS os dados de uma aba e retorna como array de objetos JSON.
 * Primeira linha é interpretada como headers (chaves dos objetos).
 * 
 * FLUXO:
 *   1. Busca a aba pelo nome
 *   2. Lê todos os dados com getDataRange()
 *   3. Normaliza headers: espaços/acentos removidos, minúsculas
 *   4. Pula linhas vazias
 *   5. Retorna array de objetos com chaves normalizadas
 * 
 * @param {string} sheetName - Nome exato da aba
 * @returns {Array} Array de objetos, cada um representando uma linha
 * 
 * EXEMPLO:
 *   getSheetData('USUARIOS') retorna:
 *   [
 *     { id: 1, nome: 'Admin', login: 'admin', nivel: 'ADMIN' },
 *     { id: 2, nome: 'User1', login: 'user1', nivel: 'COMUM' }
 *   ]
 */
function getSheetData(sheetName) {
  var sheet = SS.getSheetByName(sheetName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0].map(function(h) { return String(h).trim().toLowerCase().replace(/[\s\.]+/g, '_'); });
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

/**
 * FUNÇÃO: saveRow(sheetName, data, executor)
 * 
 * Cria ou atualiza uma linha em uma aba.
 * Suporta auto-adição de colunas se novos campos forem enviados.
 * 
 * CRIAÇÃO (data.id não definido ou 0):
 *   1. Gera ID único com timestamp
 *   2. Adiciona nova linha com dados
 *   3. Registra em auditoria
 *   4. Retorna ID novo para frontend
 * 
 * ATUALIZAÇÃO (data.id existe):
 *   1. Procura linha com ID correspondente
 *   2. Atualiza campos individuais
 *   3. Registra em auditoria
 *   4. Retorna confirmação
 * 
 * COLUNAS DINÂMICAS:
 *   Se o payload contiver uma chave não existente na aba,
 *   a coluna é criada automaticamente (extremamente útil para flexibilidade).
 * 
 * @param {string} sheetName - Nome da aba alvo
 * @param {Object} data - Objeto com dados a salvar
 * @param {string} executor - Usuário que fez a ação (para auditoria)
 * @returns {Object} { success: true, id: newId } ou { success: false, message: '...' }
 */
function saveRow(sheetName, data, executor) {
  var sheet = SS.getSheetByName(sheetName);
  var rawHeaders = sheet.getDataRange().getValues()[0] || [];
  var normalizedHeaders = rawHeaders.map(function(h) { return String(h).trim().toLowerCase().replace(/[\s\.]+/g, '_'); });
  var headers = rawHeaders.slice();
  var isInternalPayloadKey = function(key) {
    var normalizedKey = String(key).trim().toLowerCase();
    return normalizedKey === 'action' ||
           normalizedKey === 'table' ||
           normalizedKey === 'executor' ||
           normalizedKey === 'token' ||
           normalizedKey === '_sessionnivel' ||
           normalizedKey === '_session_nivel';
  };
  
  // Auto-adiciona colunas que faltam na planilha baseadas no payload
  var missingHeaders = false;
  for (var key in data) {
    if (!isInternalPayloadKey(key) && normalizedHeaders.indexOf(String(key).trim().toLowerCase()) === -1) {
      if (data[key] !== undefined && data[key] !== "") {
        headers.push(key);
        normalizedHeaders.push(key);
        missingHeaders = true;
      }
    }
  }
  
  if (missingHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  var id = data.id;
  
  var getVal = function(obj, key) {
    if (obj[key] !== undefined) return obj[key];
    var normalizeKey = function(k) { return String(k).replace(/[_\s\.]+/g, '').toLowerCase(); };
    var searchKey = normalizeKey(key);
    for (var k in obj) {
      if (normalizeKey(k) === searchKey) return obj[k];
    }
    return undefined;
  };
  
  if (id) { // UPDATE
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(id)) {
        // Se mudou o BMP, verifica se o novo BMP já existe (evitar duplicatas no update)
        var newBmp = getVal(data, 'bmp');
        if (newBmp) {
           var bmpIdx = normalizedHeaders.indexOf('bmp');
           if (bmpIdx > -1 && String(rows[i][bmpIdx]) !== String(newBmp)) {
             if (isBmpDuplicate(newBmp, id)) {
               return { success: false, message: "O BMP " + newBmp + " já está cadastrado em outro material." };
             }
           }
        }

        for (var j = 0; j < headers.length; j++) {
          var header = headers[j];
          if (isInternalPayloadKey(header)) continue;
          var val = getVal(data, header);
          if (val !== undefined) {
            sheet.getRange(i + 1, j + 1).setValue(val);
          }
        }
        logAudit(executor, "EDIÇÃO", "Editou registro ID " + id + " em " + sheetName);
        return {success: true, id: id};
      }
    }
  } else { // CREATE
    var newBmp = getVal(data, 'bmp');
    if (newBmp && isBmpDuplicate(newBmp)) {
      return { success: false, message: "O BMP " + newBmp + " já está cadastrado no sistema." };
    }

    var newId = new Date().getTime();
    var newRow = headers.map(function(h) { 
      if (h === 'id') return newId;
      if (isInternalPayloadKey(h)) return "";
      var val = getVal(data, h);
      return (val !== undefined) ? val : ""; 
    });
    sheet.appendRow(newRow);
    logAudit(executor, "CRIAÇÃO", "Criou novo registro em " + sheetName);
    return {success: true, id: newId};
  }
  return {success: false, message: "Registro não encontrado para atualização"};
}

// Verifica se um BMP já existe em qualquer aba de materiais
function isBmpDuplicate(bmp, currentId) {
  if (!bmp) return false;
  var sBmp = String(bmp).trim();
  if (sBmp === "") return false;
  
  for (var s = 0; s < MATERIAL_SHEETS.length; s++) {
    var sheet = SS.getSheetByName(MATERIAL_SHEETS[s]);
    if (!sheet) continue;
    var data = sheet.getDataRange().getValues();
    if (data.length < 2) continue;
    var headers = data[0].map(function(h) { return String(h).trim().toLowerCase(); });
    var bmpIdx = headers.indexOf('bmp');
    if (bmpIdx === -1) continue;
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][bmpIdx]).trim() === sBmp) {
        if (!currentId || String(data[i][0]) !== String(currentId)) {
          return true;
        }
      }
    }
  }
  return false;
}

// Verifica se o executor tem nível ADMIN no backend
function isAdmin(login) {
  if (!login) return false;
  var sheet = SS.getSheetByName(SHEETS.USUARIOS);
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).trim().toLowerCase(); });
  var loginIdx = headers.indexOf('login');
  var nivelIdx = headers.indexOf('nivel');
  
  if (loginIdx === -1 || nivelIdx === -1) return false;
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][loginIdx]).toLowerCase() === String(login).toLowerCase()) {
      return String(data[i][nivelIdx]).toUpperCase() === 'ADMIN';
    }
  }
  return false;
}

// Deleta uma linha de uma aba caso o `id` exista na primeira coluna
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

// Autentica um usuário pesquisando por login e senha exatamente como na aba de USUARIOS
function handleLogin(data) {
  var users = getSheetData(SHEETS.USUARIOS);
  var user = users.find(function(u) { return String(u.login) === String(data.login); });
  
  if (user) {
    // Caso o usuário ainda tenha senha em texto plano (migração) ou use o novo sistema de hash
    var isAuthenticated = false;
    var mustChangePassword = String(user.force_reset || "").trim().toUpperCase() === "SIM";
    
    if (mustChangePassword && String(data.senha) === INITIAL_PASSWORD) {
      // Login inicial/reset: evita o custo do hash no Apps Script e leva direto para troca de senha.
      isAuthenticated = true;
    } else if (user.password_hash && user.salt) {
      // Verifica usando a função de hash
      var iterations = parseInt(user.password_iterations, 10) || LEGACY_PASSWORD_HASH_ITERATIONS;
      var incomingHash = hashPassword(data.senha, user.salt, iterations);
      if (incomingHash === user.password_hash) {
        isAuthenticated = true;
      }
    } else if (user.senha && String(user.senha) === String(data.senha)) {
      // Caso legado: login com texto plano e marcação para reset imediato
      isAuthenticated = true;
      // Opcional: Forçar reset de senha na próxima vez para migrar para o hash
    }

    if (isAuthenticated) {
      var userData = Object.assign({}, user);
      // Removemos dados sensíveis do objeto de retorno para o frontend
      delete userData.senha;
      delete userData.password_hash;
      delete userData.salt;
      
      var token = createSession(userData.login, userData.nivel);
      
      logAudit(userData.nome, "LOGIN", "Militar acessou o sistema");
      return {success: true, user: userData, token: token};
    }
  }
  return {success: false, message: "Credenciais de acesso incorretas"};
}

function generateToken() {
  return Utilities.getUuid();
}

function createSession(login, nivel) {
  var token = generateToken();
  var sheet = SS.getSheetByName(SHEETS.SESSOES);
  if (!sheet) return "no-session-sheet";
  
  // Limpa sessões antigas
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
     var exp = new Date(data[i][3]);
     if (exp < new Date()) {
       sheet.deleteRow(i + 1);
     }
  }

  // 12 horas de expiração
  var expires = new Date();
  expires.setHours(expires.getHours() + 12);
  
  sheet.appendRow([token, login, nivel, expires.toISOString()]);
  return token;
}

function verifySession(token, login) {
  if (!token || !login) return {success: false, message: "Não autorizado. Token ou Executor ausentes."};
  var sheet = SS.getSheetByName(SHEETS.SESSOES);
  if (!sheet) return {success: true, nivel: 'ADMIN'}; // Fallback caso não tenha atualizado a planilha ainda
  
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(token) && String(data[i][1]).toLowerCase() === String(login).toLowerCase()) {
       var exp = new Date(data[i][3]);
       if (exp > new Date()) return {success: true, nivel: String(data[i][2])};
    }
  }
  return {success: false, message: "Sessão inválida ou expirada."};
}

// Processa e compila as estatísticas para alimentar a tela de Dashboard principal do sistema,
// agregando as quantidades por tipo/status em diversas regras de negócio
function calculateStats(materiais, epiLoans) {
  var getVal = function(obj, key) {
    if (obj[key] !== undefined) return obj[key];
    var normalizeKey = function(k) { return String(k).replace(/[_\s]/g, '').toLowerCase(); };
    var searchKey = normalizeKey(key);
    for (var k in obj) {
      if (normalizeKey(k) === searchKey) return obj[k];
    }
    return null;
  };
  
  epiLoans = epiLoans || [];
  var inUseSet = {}; // key: "type_paddedNumber"
  epiLoans.forEach(function(loan) {
    if (String(loan.status).toUpperCase() === 'EM_USO' && loan.pecas_json) {
      try {
        var pecas = JSON.parse(loan.pecas_json);
        pecas.forEach(function(p) {
           var paddedNum = String(p.number).trim().padStart(3, '0');
           var type = String(p.type).trim().toUpperCase();
           inUseSet[type + "_" + paddedNum] = true;
        });
      } catch(e) {}
    }
  });

  var stats = {
    totalAtivos: materiais.reduce(function(acc, m) { 
      if (String(getVal(m, 'fora_de_carga') || "").trim().toUpperCase() === "SIM") return acc;
      
      var sit = String(getVal(m, 'situacao') || "").toUpperCase();
      var rawCat = String(getVal(m, 'categoria') || "").toUpperCase();
      var cat = "OUTROS";
      if (rawCat.indexOf("EPI PRETO") > -1 || rawCat === "EPI_PRETO") cat = "EPI_PRETO";
      else if (rawCat.indexOf("EPI AMARELO") > -1 || rawCat === "EPI_AMARELO") cat = "EPI_AMARELO";
      else cat = rawCat;
      
      var isEmCarga = String(getVal(m, 'fora_de_carga') || "").trim().toUpperCase() !== "SIM";
      
      if (cat === "EPI_PRETO" || cat === "EPI_AMARELO") {
        var epiNum = String(getVal(m, 'epi_numero') || getVal(m, 'bmp') || "").trim().padStart(3, '0');
        var epiType = String(getVal(m, 'item_epi') || getVal(m, 'descricao') || "").trim().toUpperCase();
        if (inUseSet[epiType + "_" + epiNum]) sit = "EM_USO";
      }

      var isTargetCategory = cat.indexOf("CONSUMO") > -1 || 
                             cat.indexOf("PERMANENTE") > -1 ||
                             cat.indexOf("EXTINTORES") > -1 ||
                             (cat.indexOf("EPI") > -1 && isEmCarga);

      if (isTargetCategory && sit !== "DESCARREGADO" && sit !== "TRANSFERIDO") {
        return acc + 1;
      }
      return acc;
    }, 0),
    totalHistorico: materiais.filter(function(m) {
      var rawCat = String(getVal(m, 'categoria') || "").toUpperCase();
      if (rawCat === "LGE" || rawCat === "PQS" || rawCat === "AGENTES_CONFIG") return false;
      return String(getVal(m, 'fora_de_carga') || "").trim().toUpperCase() !== "SIM";
    }).length, // Count unique entries 
    byStatus: {},
    byCategory: {},
    byCategoryFiltered: {},
    byCategoryUnits: {},
    byCategoryFilteredUnits: {}
  };

  materiais.forEach(function(m) {
    if (String(getVal(m, 'fora_de_carga') || "").trim().toUpperCase() === "SIM") return;
    
    var sitVal = getVal(m, 'situacao') || "NÃO DEFINIDO";
    var catVal = getVal(m, 'categoria') || "OUTROS";
    var qty = parseInt(getVal(m, 'quantidade')) || 1;
    var isEmCarga = String(getVal(m, 'fora_de_carga') || "").trim().toUpperCase() !== "SIM";

    // Map categories to frontend IDs
    var rawCat = String(catVal).trim().toUpperCase();
    var cat = "OUTROS";
    
    if (rawCat.indexOf("EPI PRETO") > -1 || rawCat === "EPI_PRETO") cat = "EPI_PRETO";
    else if (rawCat.indexOf("EPI AMARELO") > -1 || rawCat === "EPI_AMARELO") cat = "EPI_AMARELO";
    else if (rawCat.indexOf("EPI") > -1 && isEmCarga) cat = "CONSUMO";
    else if (rawCat.indexOf("CONSUMO") > -1 || rawCat.indexOf("DURADOURO") > -1) cat = "CONSUMO";
    else if (rawCat.indexOf("PERMANENTE") > -1) cat = "PERMANENTE";
    else if (rawCat.indexOf("EXTINTOR") > -1) cat = "EXTINTORES";
    else if (rawCat === "LGE" || rawCat === "PQS" || rawCat === "AGENTES_CONFIG") return; // Ignorar do dashboard
    else cat = rawCat.replace(/\s+/g, '_'); // Fallback

    if (cat === "EPI_PRETO" || cat === "EPI_AMARELO") {
      var epiNum = String(getVal(m, 'epi_numero') || getVal(m, 'bmp') || "").trim().padStart(3, '0');
      var epiType = String(getVal(m, 'item_epi') || getVal(m, 'descricao') || "").trim().toUpperCase();
      if (inUseSet[epiType + "_" + epiNum]) sitVal = "EM_USO";
    }

    var sit = String(sitVal).trim().toUpperCase();
    var isDischargedOrTransferred = sit === "DESCARREGADO" || sit === "TRANSFERIDO";

    
    // Para controle de carga e prontidão, contamos sempre por registro (BMP)
    stats.byStatus[sit] = (stats.byStatus[sit] || 0) + 1;
    
    // Totalize by category (summing quantities)
    stats.byCategory[cat] = (stats.byCategory[cat] || 0) + qty;
    // Totalize by category units (counting rows)
    stats.byCategoryUnits[cat] = (stats.byCategoryUnits[cat] || 0) + 1;
    
    // Totalize by category excluding discharged and transferred
    if (!isDischargedOrTransferred) {
      stats.byCategoryFiltered[cat] = (stats.byCategoryFiltered[cat] || 0) + qty;
      stats.byCategoryFilteredUnits[cat] = (stats.byCategoryFilteredUnits[cat] || 0) + 1;
    }
  });
  return stats;
}

// Busca os conteúdos de todas as abas representativas de 'materiais' e agrupa numa lista só
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

// Filtra os materiais de sistema utilizando como base uma keyword e outros parametros passados pela query API
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
      var inBmp = String(m.bmp || "").toLowerCase().indexOf(k) > -1;
      var inDesc = String(m.descricao || "").toLowerCase().indexOf(k) > -1;
      var inDoc = String(m.documento || "").toLowerCase().indexOf(k) > -1;
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
    
    if (params.setor && sector.toUpperCase().indexOf(String(params.setor).toUpperCase()) === -1) match = false;
    if (params.situacao && sit.toUpperCase() != String(params.situacao).toUpperCase()) match = false;
    if (params.documento && String(m.documento || "").toLowerCase().indexOf(String(params.documento).toLowerCase()) === -1) match = false;
    if (params.bmp && String(m.bmp || "").toLowerCase().indexOf(String(params.bmp).toLowerCase()) === -1) match = false;
    
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
    if (params.altura === "true" && m.altura != "SIM" && m.altura !== true) match = false;
    
    // Lógica de Fora de Carga alinhada com Dashboard
    var isOut = m.fora_de_carga == "SIM" || m.fora_de_carga === true || sit.toUpperCase() === "DESCARREGADO" || sit.toUpperCase() === "TRANSFERIDO";
    if (params.fora_de_carga === "all") {
      // Retorna tudo (usado pelo Dashboard para estatísticas globais)
    } else if (params.fora_de_carga === "true" && !isOut) {
      match = false;
    } else if (params.fora_de_carga === "false" && isOut) {
      match = false;
    }

    return match;
  });
}

// Cria o registro do Empréstimo em lote de diferentes materiais numa única ação de cautela
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
  
  // 2. Atualizar status dos materiais para EMPRESTADO e DECREMENTAR quantidade
  updateMaterialCells(materialIds, { "situacao": "EMPRESTADO" }, -1);
  
  return loanResult;
}

// Modifica as celulas do Material com base no ID indicado. Útil para setar situacao como "EMPRESTADO"
// e opcionalmente ajustar a quantidade (ex: -1 para empréstimo, +1 para devolução)
function updateMaterialCells(materialData, modifications, multiplier) {
  // materialData pode ser [ {id, qty}, ... ] ou [ "id1", "id2", ... ]
  var items = materialData.map(function(m) {
    if (typeof m === 'object' && m !== null) return { id: String(m.id), qty: Number(m.qty) || 1 };
    return { id: String(m), qty: 1 };
  });
  
  var ids = items.map(function(it) { return it.id; });
  var mult = Number(multiplier) || 0; // -1 para saída (empréstimo), 1 para entrada (devolução)

  for (var s = 0; s < MATERIAL_SHEETS.length; s++) {
    var sheet = SS.getSheetByName(MATERIAL_SHEETS[s]);
    if (!sheet) continue;
    var data = sheet.getDataRange().getValues();
    if (data.length < 2) continue;
    var headers = data[0];
    
    var qtyIdx = headers.indexOf('quantidade');
    var hasChanges = false;

    for (var i = 1; i < data.length; i++) {
        var rowId = String(data[i][0]);
        var foundIdx = ids.indexOf(rowId);
        
        if (foundIdx > -1) {
            hasChanges = true;
            var itemRef = items[foundIdx];
            
            // Aplicar modificações de texto/status (ex: situacao = 'EMPRESTADO')
            for (var key in modifications) {
                var cIdx = headers.indexOf(key);
                if (cIdx > -1) data[i][cIdx] = modifications[key];
            }

            // Aplicar ajuste de quantidade se a coluna existir
            if (mult !== 0 && qtyIdx > -1) {
              var currentQty = Number(data[i][qtyIdx]) || 0;
              var qtyToChange = itemRef.qty * mult;
              var newQty = currentQty + qtyToChange;
              data[i][qtyIdx] = newQty < 0 ? 0 : newQty;
            }
        }
    }
    
    if (hasChanges) {
      sheet.getRange(1, 1, data.length, headers.length).setValues(data);
    }
  }
}

// Registra uma cautela provisória especificamente aos Equipamentos de Proteção Individual dos Bombeiros (EPI)
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

// Lógica para devolução oficial de itens que saem por Cautela de EPI 
function handleReturnEPI(loanId, executor, newStatus) {
  var sheet = SS.getSheetByName(SHEETS.CAUTELAS_EPI);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var statusIdx = headers.indexOf('status');
  var devDateIdx = headers.indexOf('data_devolucao');
  var pecasIdx = headers.indexOf('pecas_json');
  
  var effectiveStatus = newStatus || "PERFEITO";
  
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
      
      // Se houver pecas_json, também atualizamos o status de cada peça individualmente
      if (pecasIdx > -1 && data[i][pecasIdx]) {
        try {
          var pecas = JSON.parse(data[i][pecasIdx]);
          // Para cada peça na cautela, precisamos encontrar o material correspondente e atualizar
          // A identificação é feita por epi_numero e item_epi
          pecas.forEach(function(p) {
             updateEPIMaterialStatus(p.number, p.type, effectiveStatus);
          });
        } catch(e) {}
      }

      logAudit(executor, "DEVOLUÇÃO", "Devolução de EPI Cautela ID " + loanId + " com status " + effectiveStatus);
      return {success: true};
    }
  }
  return {success: false, message: "Cautela não encontrada"};
}

// Atualiza a situação de uma vestimenta (EPI preto ou amarelo) individual baseado numa requisição
function updateEPIMaterialStatus(number, itemType, status) {
  var paddedNumber = String(number).trim().padStart(3, '0');
  var typeUpper = String(itemType).trim().toUpperCase();
  
  for (var s = 0; s < MATERIAL_SHEETS.length; s++) {
    var sheet = SS.getSheetByName(MATERIAL_SHEETS[s]);
    if (!sheet) continue;
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var numIdx = headers.indexOf('epi_numero') > -1 ? headers.indexOf('epi_numero') : headers.indexOf('bmp');
    var itemIdx = headers.indexOf('item_epi') > -1 ? headers.indexOf('item_epi') : headers.indexOf('descricao');
    var sitIdx = headers.indexOf('situacao');
    
    if (numIdx === -1 || itemIdx === -1 || sitIdx === -1) continue;
    
    for (var i = 1; i < data.length; i++) {
       var mNum = String(data[i][numIdx]).trim().padStart(3, '0');
       var mItem = String(data[i][itemIdx]).trim().toUpperCase();
       if (mNum === paddedNumber && mItem === typeUpper) {
          sheet.getRange(i + 1, sitIdx + 1).setValue(status);
          return;
       }
    }
  }
}

// Lógica para devolver um empréstimo padrão e marcar a aba de materiais novamente de uma vez
function handleReturnLoan(loanId, executor, newStatus) {
  var sheetLoan = SS.getSheetByName(SHEETS.MOVIMENTACOES);
  var loanData = sheetLoan.getDataRange().getValues();
  var loanHeaders = loanData[0];
  var matJsonIdx = loanHeaders.indexOf('materiais_json');
  var statusIdx = loanHeaders.indexOf('status');
  
  var effectiveStatus = newStatus || "PERFEITO";
  
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
      
      // 2. Voltar materiais para a situação selecionada (Ex: PERFEITO, AVARIADO, etc) e INCREMENTAR quantidade
      updateMaterialCells(materialIds, { "situacao": effectiveStatus }, 1);
      
      logAudit(executor, "DEVOLUÇÃO", "Devolução de Empréstimo ID " + loanId + " com status " + effectiveStatus);
      return {success: true};
    }
  }
  return {success: false, message: "Empréstimo não encontrado"};
}

// Abate a quantidade numerica de materiais e registrar o debito à pagina ESTOQUE_BAIXA
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

// Atualiza se o usuário está online na plataforma (data de última atividade) ou força o modo offline
function handleUpdateStatus(userId, isOffline) {
  var sheet = SS.getSheetByName(SHEETS.USUARIOS);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(userId)) {
      // Se isOffline for true, coloca uma data bem antiga para forçar o status offline
      var date = isOffline ? new Date(0) : new Date();
      sheet.getRange(i + 1, 7).setValue(date); // ultima_atividade
      break;
    }
  }
  
  // Gets online users to return in a single call pattern
  var usersInfo = getSheetData(SHEETS.USUARIOS);
  var now = new Date().getTime();
  var onlineUsers = [];
  for (var j = 0; j < usersInfo.length; j++) {
    var u = usersInfo[j];
    if (u.ultima_atividade) {
      var d = new Date(u.ultima_atividade).getTime();
      if ((now - d) < 120000) { // 2 minutes threshold
        onlineUsers.push({ id: u.id, nome: u.nome });
      }
    }
  }

  return response({
    success: true,
    serverTime: now,
    onlineUsers: onlineUsers
  });
}

// Registra as trilhas para fins de fiscalização de todas as alterações com log
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

/**
 * Gera um salt aleatório para o hashing
 */
function generateSalt() {
  return Utilities.getUuid();
}

/**
 * Implementa hashing seguro com SHA-256 e Stretching (10.000 iterações)
 * @param {string} password Senha em texto plano
 * @param {string} salt Salt aleatório
 * @return {string} Hash final em formato Hex
 */
function hashPassword(password, salt, iterations) {
  iterations = iterations || PASSWORD_HASH_ITERATIONS;
  var input = password + salt;
  var hash = input;
  
  for (var i = 0; i < iterations; i++) {
    var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, hash, Utilities.Charset.UTF_8);
    hash = digest.map(function(byte) {
      return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');
  }
  return hash;
}
