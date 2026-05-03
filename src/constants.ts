/**
 * URL do Web App gerada após o Deploy no Google Apps Script.
 * Certifique-se de que o deploy foi feito como:
 * - Execute as: Me (seu e-mail)
 * - Who has access: Anyone
 */
export const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyjf2eV5FYkgxqOR9BF4FYr8b8gEIEeUBC3kWrdCl3ShGOGUZYV3kc-QluHHRfp69M/exec';

export const SITUACOES = ['PERFEITO','DESCARREGADO','CONDENADO','PROCES. DESCARG.','AVARIADO','Ñ ENCONTRADO','TRANSFERIDO','TROCA NOMEN.','CONS. DURAD.','EM TRANSF.','AGUARDAN. CARGA','REGISTRO','OREI','EMPRESTADO','ITEM DESCARACTZ','MANUTENÇÃO','EXTRAVIADO','REGULAR','INSERVÍVEL'].sort();
export const CATEGORIES = [
  { id: 'CONSUMO', label: 'Consumo e Duradouro' },
  { id: 'PERMANENTE', label: 'Permanente' },
  { id: 'EXTINTORES', label: 'Extintores' },
].sort((a, b) => a.label.localeCompare(b.label));

export const EPI_COMPONENTS = ['CASACO', 'CALÇA', 'BOTA', 'LUVA', 'BALACLAVA', 'CAPACETE'].sort();
export const EPI_FUNCTIONS = ['CHEFE DE EQUIPE', 'COMBATENTE', 'LÍDER DE RESGATE', 'MOTORISTA', 'RÁDIO OPERADOR', 'RESGATISTA'].sort();
export const SUB_CATEGORIES = [
  { id: 'ti', label: 'Tecnologia (TI)' },
  { id: 'hi', label: 'Hidráulicos' },
  { id: 'aph', label: 'APH' },
  { id: 'instr', label: 'Instrução' },
  { id: 'altura', label: 'Material de Altura' }
].sort((a, b) => a.label.localeCompare(b.label));

export const TERMS_TEXT = "TERMOS DE USO: Este sistema é de uso institucional para gerenciamento de carga. O acesso é pessoal e intransferível.";