export interface User {
  id: number;
  nome: string;
  login: string;
  nivel: 'ADMIN' | 'USER';
  senha?: string;
  force_reset?: boolean | string;
  ultima_atividade?: string;
}

export interface Bombeiro {
  id: number;
  nome_guerra: string;
  saram: string;
  tipo: 'INTERNO' | 'EXTERNO';
  funcao: string;
  ala?: string;
  setor?: string;
}

export interface EPILoan {
  id: number;
  bombeiro_id: number;
  pecas_json: string; // JSON with { type: string, number: string }[]
  data_retirada: string;
  data_devolucao?: string;
  solicitante_telefone?: string;
  solicitante_ramal?: string;
  solicitante_setor?: string;
  status: 'EM_USO' | 'DEVOLVIDO';
  executor?: string;
}

export interface StockPayout {
  id: number;
  material_id: number;
  solicitante: string;
  setor: string;
  quantidade: number;
  data: string;
  executor?: string;
}

export interface Material {
  id: number;
  setor: string;
  bmp: string;
  situacao: string;
  documento: string;
  descricao: string;
  categoria: string;
  item_epi?: string;
  fora_de_carga: boolean | string;
  ti: boolean | string;
  hi?: boolean | string;
  aph?: boolean | string;
  instr?: boolean | string;
  altura?: boolean | string;
  data_entrada: string;
  tamanho?: string;
  responsavel?: string;
  bombeiro_id?: number;
  epi_numero?: string;
  observacoes?: string;
  quantidade?: number | string;
  extintor_tipo?: string;
  extintor_peso?: string;
  conta?: string;
  classe?: string;
  validade_epi?: string;
  epi_aviso_validade?: string;
  classificacao?: string;
  epr_validade_cilindro?: string;
  epr_aviso_validade_cilindro?: string;
  epr_fabricante?: string;
  epr_modelo?: string;
  epr_ultima_recarga?: string;
  epr_proxima_recarga?: string;
  epr_aviso_recarga?: string;
  epr_teste_hidrostatico?: string;
  epr_proximo_teste_anos?: number | string;
  epr_proximo_teste_data?: string;
  epr_aviso_teste?: string;
  epr_recargas_count?: number | string;
  epr_recargas_limite?: number | string;
  agentes_tipo?: string; 
  agentes_capacidade?: number | string; 
  agentes_fabricante?: string;
  agentes_numero_lote?: string;
  agentes_validade?: string;
  agentes_aviso_validade?: number | string;
  agentes_local_armazenamento?: string;
}

export interface Loan {
  id: number;
  solicitante: string;
  telefone?: string;
  ramal?: string;
  setor?: string;
  materiais_json: string;
  retirada: string;
  previsao: string;
  autorizado_por: string;
  status: 'EMPRESTADO' | 'DEVOLVIDO';
  executor?: string;
  data_devolucao?: string;
  executor_devolucao?: string;
}

export interface Avaria {
  id: number;
  bmp: string;
  descricao: string;
  data: string;
  relatado_por: string;
}

export interface Sector {
  id: number;
  nome: string;
}

export interface Stats {
  totalAtivos: number;
  totalHistorico: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  byCategoryFiltered: Record<string, number>;
  byCategoryUnits: Record<string, number>;
  byCategoryFilteredUnits: Record<string, number>;
}

export interface Category {
  id: string;
  label: string;
}

export interface AuditRow {
  id: number;
  data: string;
  usuario: string;
  acao: string;
  detalhes: string;
}

export interface LabelConfig {
  labelWidth: number;
  labelHeight: number;
  marginX: number;
  marginY: number;
  gapX: number;
  gapY: number;
  labelsPerRow: number;
  labelsPerCol: number;
}
