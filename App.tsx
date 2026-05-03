import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Package, Trash2, Edit, Plus, Search, RefreshCw, Database,
  AlertCircle, Truck, ClipboardList, ShieldAlert, Boxes, X,
  Save, CheckCircle, BarChart3, LogOut, Users, FileText,
  Download, Printer, AlertTriangle, Monitor, Filter,
  ArrowRightLeft, History, Flame, Plane, Siren, Wind, Shield,
  ChevronDown, ChevronUp, Settings, CheckSquare, MessageCircle, Instagram,
  Share2, FilterX, PieChart, TrendingUp, Camera, Triangle, UserCheck, User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const EPI_FUNCTIONS = [
  'CHEFE DE EQUIPE',
  'COMBATENTE',
  'LÍDER DE RESGATE',
  'MOTORISTA',
  'RÁDIO OPERADOR',
  'RESGATISTA'
].sort();

// Libs
import { User, Material, Loan, Avaria, Sector, AuditRow, Bombeiro, EPILoan, StockPayout, LabelConfig } from './types';
import { generatePDFReport, exportToExcel, generateLoanReceipt, generateEpiLoanReceipt, generateLabelsPDF, generateComparisonPDF } from './lib/exportUtils';
import { InventoryScanner } from './components/InventoryScanner';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const getMaterialQty = (m: any) => {
  if (!m || !m.quantidade) return 1;
  const q = Number(m.quantidade);
  return isNaN(q) ? 1 : q;
};

const isOverdue = (previsao: string) => {
  if (!previsao) return false;
  try {
    // Handle YYYY-MM-DD (from input date) or ISO strings
    const dateStr = previsao.includes('T') ? previsao.split('T')[0] : previsao;
    
    let prevDate: Date;
    if (dateStr.includes('/')) {
      // Handle DD/MM/YYYY
      const [d, m, y] = dateStr.split('/').map(Number);
      prevDate = new Date(y, m - 1, d, 23, 59, 59);
    } else {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        prevDate = new Date(y, m - 1, d, 23, 59, 59);
      } else {
        prevDate = new Date(dateStr + "T23:59:59");
      }
    }
    
    if (isNaN(prevDate.getTime())) return false;
    
    const today = new Date();
    return prevDate.getTime() < today.getTime();
  } catch (e) {
    return false;
  }
}

const CATEGORIES = [
  { id: 'EPI_PRETO', label: 'EPI Preto', icon: Shield },
  { id: 'EPI_AMARELO', label: 'EPI Amarelo', icon: Shield },
  { id: 'CONSUMO', label: 'Consumo e Duradouro', icon: Package },
  { id: 'PERMANENTE', label: 'Permanente', icon: ClipboardList },
  { id: 'EXTINTORES', label: 'Extintores', icon: Flame },
].sort((a, b) => a.label.localeCompare(b.label));

const EPI_COMPONENTS = [
  'CASACO', 'CALÇA', 'BOTA', 'LUVA', 'BALACLAVA', 'CAPACETE'
].sort();

const SUB_CATEGORIES = [
  { id: 'ti', label: 'Tecnologia (TI)', icon: Monitor },
  { id: 'hi', label: 'Hidráulicos', icon: Wind },
  { id: 'aph', label: 'APH', icon: AlertCircle },
  { id: 'instr', label: 'Instrução', icon: FileText },
  { id: 'altura', label: 'Material de Altura', icon: Triangle },
].sort((a, b) => a.label.localeCompare(b.label));

const SITUACOES = [
  'PERFEITO', 
  'DESCARREGADO', 
  'CONDENADO', 
  'PROCES. DESCARG.', 
  'AVARIADO', 
  'Ñ ENCONTRADO', 
  'TRANSFERIDO', 
  'TROCA NOMEN.', 
  'CONS. DURAD.',
  'EM TRANSF.',
  'AGUARDAN. CARGA',
  'REGISTRO',
  'OREI',
  'EMPRESTADO',
  'ITEM DESCARACTZ',
  'MANUTENÇÃO',
  'EXTRAVIADO',
  'REGULAR',
  'INSERVÍVEL'
].sort();

// URL DO GOOGLE APPS SCRIPT
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyjf2eV5FYkgxqOR9BF4FYr8b8gEIEeUBC3kWrdCl3ShGOGUZYV3kc-QluHHRfp69M/exec';

const TERMS_TEXT = `TERMOS DE USO E LICENCIAMENTO - SESCINC-CO

1. LICENÇA DE USO: Este software é licenciado exclusivamente para uso institucional do SESCINC-CO. É proibida a cópia, modificação, distribuição ou engenharia reversa sem autorização expressa.
2. RESPONSABILIDADE: O usuário é responsável por manter a confidencialidade de suas credenciais de acesso. Todas as ações realizadas na plataforma são auditadas e vinculadas ao usuário logado.
3. PRIVACIDADE: Os dados inseridos destinam-se exclusivamente ao controle de materiais e equipamentos.
4. PROPRIEDADE INTELECTUAL: Todo o código-fonte, design e estrutura de dados são de propriedade protegida e protegidos por direitos autorais.
5. INFRAÇÕES: O uso indevido deste sistema pode resultar em sanções disciplinares e legais.

Ao prosseguir, você declara estar ciente e concordar com estes termos.`;

const Loader = () => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-slate-100 border-t-red-600 rounded-full animate-spin" />
        <Plane size={24} className="absolute inset-x-0 inset-y-0 m-auto text-red-600 animate-pulse" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Sincronizando Dados...</p>
    </div>
  </div>
);

import { StatusPieChart } from './components/DashboardCharts';
import { StockManagementView } from './components/StockManagementView';
import { AgentesManagementView } from './components/AgentesManagementView';

const ScrollToTopButton = () => {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      const main = document.getElementById('main-scroll-area');
      if (main && main.scrollTop > 300) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };
    const main = document.getElementById('main-scroll-area');
    main?.addEventListener('scroll', handleScroll);
    return () => main?.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button 
      onClick={() => {
        const main = document.getElementById('main-scroll-area');
        main?.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      className="fixed bottom-6 right-6 z-[100] bg-gray-900 text-white rounded-full flex items-center justify-center w-14 h-14 shadow-lg opacity-50 hover:opacity-100 transition-opacity"
      title="Voltar ao topo"
    >
      <ChevronUp size={24} />
    </button>
  );
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('sescinc_currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'LOGIN' | 'DASHBOARD' | 'ADMIN' | 'LOANS' | 'AUDIT' | 'EPI' | 'EPR' | 'INVENTORY' | 'STOCK' | 'COMPARE' | 'AGENTES' | 'CLEARANCE'>(() => {
    return (localStorage.getItem('sescinc_view') as any) || 'LOGIN';
  });

  // Persist state changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('sescinc_currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('sescinc_currentUser');
      localStorage.removeItem('sescinc_view');
      localStorage.removeItem('sescinc_token');
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('sescinc_view', view);
    }
  }, [view, currentUser]);

  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    return localStorage.getItem('sescinc_token');
  });

  const logout = () => {
    localStorage.removeItem('sescinc_currentUser');
    localStorage.removeItem('sescinc_token');
    localStorage.removeItem('sescinc_view');
    setCurrentUser(null);
    setSessionToken(null);
    setView('LOGIN');
  };

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const isPost = options.method === 'POST';
    let body: any = {};

    if (isPost && options.body) {
      try {
        body = JSON.parse(options.body as string);
      } catch {
        body = {};
      }
    }

    // Inject token and executor for security
    if (isPost) {
      body.token = sessionToken;
      body.executor = currentUser?.login;
      options.body = JSON.stringify(body);
      options.headers = { ...options.headers, 'Content-Type': 'text/plain' };
    }

    try {
      const res = await fetch(url, options);
      // We clone the response to check for invalidToken without consuming the original stream
      const clone = res.clone();
      const data = await clone.json().catch(() => ({}));

      if (data && data.invalidToken) {
        alert('Sessão expirada ou inválida. Por favor, faça login novamente.');
        logout();
        throw new Error('Invalid Session');
      }

      return res;
    } catch (err) {
      if (err instanceof Error && err.message === 'Invalid Session') throw err;
      console.error("Authenticated Fetch Error:", err);
      throw err;
    }
  };
  
  // Data State
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [rawMateriais, setRawMateriais] = useState<Material[]>([]); // ADICIONE ESTA LINHA
  const filterAbortController = useRef<AbortController | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditRow[]>([]);
  const [auditFilter, setAuditFilter] = useState('');
  const [bombeiros, setBombeiros] = useState<Bombeiro[]>([]);
  const [epiLoans, setEpiLoans] = useState<EPILoan[]>([]);
  const [stockPayouts, setStockPayouts] = useState<StockPayout[]>([]);
  const [stats, setStats] = useState<any>(null);
  
  // Filter State
  const [filters, setFilters] = useState({
    keyword: '',
    bmp: '',
    documento: '',
    setor: '',
    situacao: '',
    categoria: '',
    ti: false,
    hi: false,
    aph: false,
    instr: false,
    altura: false,
    fora_de_carga: false,
    exibir_extintores: true,
    exibir_descarregados: false,
    extintor_tipo: '',
    extintor_peso: '',
    clearanceSearch: ''
  });
  const [hasSearched, setHasSearched] = useState(false);
  const [compareInput, setCompareInput] = useState('');
  const [comparisonResult, setComparisonResult] = useState<{ missingInSystem: string[], missingInList: string[] } | null>(null);
  const [epiSubView, setEpiSubView] = useState<'GESTAO' | 'CADASTRO'>(() => (localStorage.getItem('sescinc_epiSubView') as any) || 'GESTAO');
  const [eprSubView, setEprSubView] = useState<'LISTA' | 'CADASTRO'>(() => (localStorage.getItem('sescinc_eprSubView') as any) || 'LISTA');
  const [agentesSubView, setAgentesSubView] = useState<'LGE' | 'PQS'>(() => (localStorage.getItem('sescinc_agentesSubView') as any) || 'LGE');

  useEffect(() => {
    localStorage.setItem('sescinc_epiSubView', epiSubView);
  }, [epiSubView]);
  useEffect(() => {
    localStorage.setItem('sescinc_eprSubView', eprSubView);
  }, [eprSubView]);
  useEffect(() => {
    localStorage.setItem('sescinc_agentesSubView', agentesSubView);
  }, [agentesSubView]);
  const [showMissingInListUI, setShowMissingInListUI] = useState(false);

  const clearCompareForm = () => {
    setCompareInput('');
    setComparisonResult(null);
    setShowMissingInListUI(false);
  };

  const compareBmps = async () => {
    if (!compareInput.trim()) return;
    
    setLoading(true);
    try {
      // Busca a lista COMPLETA de materiais, ignorando filtros de categoria da UI
      const params = new URLSearchParams({
        action: 'read',
        fora_de_carga: 'all'
      });
      
      let data;
      if (!SCRIPT_URL || SCRIPT_URL.includes('SUA_URL')) {
        const res = await fetch(`/api/search?${params}`);
        if (res.ok) data = await res.json();
      } else {
        const res = await fetch(`${SCRIPT_URL}?${params}`);
        if (res.ok) data = await res.json();
      }

      if (!Array.isArray(data)) {
        addToast('Erro ao buscar dados para comparação', 'error');
        setLoading(false);
        return;
      }

      const allMaterials = data as Material[];
      
      const inputBmps = compareInput.split(/[\n,;\t]/)
        .map(s => s.trim().toUpperCase())
        .filter(s => s.length > 0);
      
      const uniqueInput = Array.from(new Set(inputBmps));
      
      // Filtramos apenas os que NÃO estão descarregados para comparação
      const systemBmps = allMaterials
        .filter(m => String(m.situacao).toUpperCase() !== 'DESCARREGADO')
        .map(m => String(m.bmp || '').trim().toUpperCase())
        .filter(s => s.length > 0);
        
      const uniqueSystem = Array.from(new Set(systemBmps));

      const missingInSystem = uniqueInput.filter(b => !uniqueSystem.includes(b));
      const missingInList = uniqueSystem.filter(b => !uniqueInput.includes(b));

      setComparisonResult({ missingInSystem, missingInList });
      addToast('Comparação concluída!', 'info');
    } catch (err) {
      console.error(err);
      addToast('Erro ao realizar comparação', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Modal States
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Partial<Material> | null>(null);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returningLoanId, setReturningLoanId] = useState<any>(null);
  const [selectedReturnStatus, setSelectedReturnStatus] = useState('PERFEITO');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showSectorModal, setShowSectorModal] = useState(false);
  const [showAvariaModal, setShowAvariaModal] = useState(false);
  const [showBombeiroModal, setShowBombeiroModal] = useState(false);
  const [showEPILoanModal, setShowEPILoanModal] = useState(false);
  const [showEprRecargaModal, setShowEprRecargaModal] = useState(false);
  const [eprToRecarga, setEprToRecarga] = useState<Partial<Material> | null>(null);
  const [eprRecargaDate, setEprRecargaDate] = useState('');
  const [eprProximaRecargaDate, setEprProximaRecargaDate] = useState('');
  const [eprAvisoRecarga, setEprAvisoRecarga] = useState('');
  const [selectedForLoan, setSelectedForLoan] = useState<number[]>([]);
  const [loanQuantities, setLoanQuantities] = useState<Record<number, number>>({});
  const [newLoan, setNewLoan] = useState({ 
    solicitante: '', 
    telefone: '', 
    ramal: '', 
    setor: '', 
    previsao: '' 
  });
  const [epiLoanExtras, setEpiLoanExtras] = useState({
    telefone: '',
    ramal: '',
    setor: '',
    categoria: 'EPI_PRETO'
  });
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [newUser, setNewUser] = useState({ nome: '', login: '', senha: '123456', nivel: 'USER' });
  const [avariaData, setAvariaData] = useState({ bmp: '', descricao: '' });
  const [loginForm, setLoginForm] = useState({ login: '', senha: '' });
  const [newSectorName, setNewSectorName] = useState('');
  const [newBombeiro, setNewBombeiro] = useState({ nome_guerra: '', saram: '', tipo: 'INTERNO', funcao: 'COMBATENTE' });
  const [editingBombeiro, setEditingBombeiro] = useState<Partial<Bombeiro> | null>(null);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEpiMenuOpen, setIsEpiMenuOpen] = useState(false);
  const [isAgentesMenuOpen, setIsAgentesMenuOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(() => localStorage.getItem('sescinc_isScannerOpen') === 'true');
  useEffect(() => {
    localStorage.setItem('sescinc_isScannerOpen', String(isScannerOpen));
  }, [isScannerOpen]);

  // Label configuration states
  const [showLabelConfig, setShowLabelConfig] = useState(false);
  const [labelConfig, setLabelConfig] = useState<LabelConfig>({
    labelWidth: 60,
    labelHeight: 25,
    marginX: 15,
    marginY: 25,
    gapX: 10,
    gapY: 5,
    labelsPerRow: 2,
    labelsPerCol: 8
  });

  const eprWarnings = useMemo(() => {
    const warnings: { id: number; bmp: string; msg: string; type: 'cilindro' | 'recarga' | 'teste'; days: number }[] = [];
    const now = new Date();
    // Helper to calculate diff days
    const diffDays = (d1: Date, d2: Date) => Math.ceil((d1.getTime() - d2.getTime()) / (1000 * 3600 * 24));
    
    rawMateriais.filter(m => m.categoria === 'PERMANENTE' && (m.classificacao?.toUpperCase() === 'EPR' || m.descricao === 'EPR' || !!m.epr_fabricante || !!m.epr_validade_cilindro)).forEach(m => {
        if (m.epr_validade_cilindro && m.epr_aviso_validade_cilindro) {
          const validDate = new Date(m.epr_validade_cilindro);
          const days = diffDays(validDate, now);
          if (days <= parseInt(m.epr_aviso_validade_cilindro || '0', 10)) {
            warnings.push({ id: m.id, bmp: m.bmp || m.epi_numero || 'Sem ID', msg: `Validade do Cilindro aproxima-se: ${validDate.toLocaleDateString()}`, type: 'cilindro', days });
          }
        }
        if (m.epr_proxima_recarga && m.epr_aviso_recarga) {
          const recargaDate = new Date(m.epr_proxima_recarga);
          const days = diffDays(recargaDate, now);
          if (days <= parseInt(m.epr_aviso_recarga || '0', 10)) {
            warnings.push({ id: m.id, bmp: m.bmp || m.epi_numero || 'Sem ID', msg: `Próxima recarga aproxima-se: ${recargaDate.toLocaleDateString()}`, type: 'recarga', days });
          }
        }
        if (m.epr_proximo_teste_data && m.epr_aviso_teste) {
          const testDate = new Date(m.epr_proximo_teste_data);
          const days = diffDays(testDate, now);
          if (days <= parseInt(m.epr_aviso_teste || '0', 10)) {
            warnings.push({ id: m.id, bmp: m.bmp || m.epi_numero || 'Sem ID', msg: `Próximo teste hidrostático aproxima-se: ${testDate.toLocaleDateString()}`, type: 'teste', days });
          }
        }
    });
    return warnings.sort((a,b) => a.days - b.days);
  }, [rawMateriais]);
  const eprWarningsBadgeCount = eprWarnings.length;

  const epiWarnings = useMemo(() => {
    const warnings: { id: number; numero: string; item: string; color: string; msg: string; days: number }[] = [];
    const now = new Date();
    const diffDays = (d1: Date, d2: Date) => Math.ceil((d1.getTime() - d2.getTime()) / (1000 * 3600 * 24));
    
    rawMateriais.filter(m => m.categoria === 'EPI_PRETO' || m.categoria === 'EPI_AMARELO').forEach(m => {
        if (m.validade_epi && m.epi_aviso_validade) {
          const validDate = new Date(m.validade_epi);
          const days = diffDays(validDate, now);
          const avisoLimit = parseInt(m.epi_aviso_validade);
          if (days <= avisoLimit) {
             warnings.push({
               id: m.id,
               numero: m.epi_numero || m.bmp || 'S/N',
               item: m.item_epi || m.descricao,
               color: m.categoria === 'EPI_PRETO' ? 'PRETO' : 'AMARELO',
               msg: `Validade geral do EPI`,
               days
             });
          }
        }
    });
    return warnings.sort((a, b) => a.days - b.days);
  }, [rawMateriais]);
  const epiWarningsBadgeCount = epiWarnings.length;

  const getAgentesConfig = () => {
    const configs: Record<string, number> = {};
    rawMateriais.filter(m => m.categoria === 'AGENTES_CONFIG').forEach(m => {
      configs[m.item_epi || m.descricao] = Number(m.quantidade) || 0;
    });
    return configs;
  };

  const agentesWarnings = useMemo(() => {
    const warnings: { id: string; tipo: string; lote: string; categoria: string; msg: string; days?: number; isEstoqueBaixo?: boolean }[] = [];
    const now = new Date();
    const diffDays = (d1: Date, d2: Date) => Math.ceil((d1.getTime() - d2.getTime()) / (1000 * 3600 * 24));
    
    const configs = getAgentesConfig();
    const lgeStock: Record<string, number> = {};
    const pqsStock: Record<string, number> = {};

    rawMateriais.filter(m => m.categoria === 'LGE' || m.categoria === 'PQS').forEach(m => {
       const isLGE = m.categoria === 'LGE';
       const tipo = m.agentes_tipo || 'INDEFINIDO';
       const capacidade = Number(m.agentes_capacidade) || 0;
       
       if (isLGE) {
         lgeStock[tipo] = (lgeStock[tipo] || 0) + capacidade;
       } else {
         pqsStock[tipo] = (pqsStock[tipo] || 0) + capacidade;
       }

       if (m.agentes_validade) {
         const validDate = new Date(m.agentes_validade);
         const days = diffDays(validDate, now);
         const aviso_limit = Number(m.agentes_aviso_validade) || 30; // default 30 se não definido
         
         if (days <= aviso_limit) {
           warnings.push({
             id: m.id as any,
             categoria: m.categoria,
             tipo,
             lote: m.agentes_numero_lote || 'S/N',
             msg: `Validade se aproximando ou vencida`,
             days
           });
         }
       }
    });

    Object.keys(lgeStock).forEach(tipo => {
       const min = configs[`LGE_${tipo}`] || 0;
       if (min > 0 && lgeStock[tipo] < min) {
          warnings.push({
             id: `config_LGE_${tipo}`,
             categoria: 'LGE',
             tipo,
             lote: 'N/A',
             msg: `Estoque baixo (${lgeStock[tipo]}L). Mínimo exigido: ${min}L`,
             isEstoqueBaixo: true
          });
       }
    });

    Object.keys(pqsStock).forEach(tipo => {
       const min = configs[`PQS_${tipo}`] || 0;
       if (min > 0 && pqsStock[tipo] < min) {
          warnings.push({
             id: `config_PQS_${tipo}`,
             categoria: 'PQS',
             tipo,
             lote: 'N/A',
             msg: `Estoque baixo (${pqsStock[tipo]}kg). Mínimo exigido: ${min}kg`,
             isEstoqueBaixo: true
          });
       }
    });

    return warnings.sort((a, b) => (a.days ?? 999) - (b.days ?? 999));
  }, [rawMateriais]);
  const agentesWarningsBadgeCount = agentesWarnings.length;

  const [isBombeiroCadastroOpen, setIsBombeiroCadastroOpen] = useState(false);
  const [isEpiCadastroOpen, setIsEpiCadastroOpen] = useState(false);
  const [epiListFilterColor, setEpiListFilterColor] = useState('');
  const [epiListFilterType, setEpiListFilterType] = useState('');
  const [epiListFilterSize, setEpiListFilterSize] = useState('');
  const [epiListFilterStatus, setEpiListFilterStatus] = useState('');
  const [eprListFilterStatus, setEprListFilterStatus] = useState('');
  const [eprListFilterSector, setEprListFilterSector] = useState('');
  const [epiFilterType, setEpiFilterType] = useState('');
  const [epiFilterSize, setEpiFilterSize] = useState('');
  const [bombeiroSearch, setBombeiroSearch] = useState('');
  const [showResetPasswordScreen, setShowResetPasswordScreen] = useState(false);
  const [resetPasswordForm, setResetPasswordForm] = useState({ novaSenha: '', confirmarSenha: '' });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [, setServerTimeOffset] = useState<number>(0);
  const [toasts, setToasts] = useState<{id: number, msg: string, type: 'join' | 'leave' | 'info' | 'error'}[]>([]);
  const [inventoryState, setInventoryState] = useState<{
    foundQuantities: Record<number, number>,
    sector: string,
    filter: 'ALL' | 'FOUND' | 'NOT_FOUND',
    categories: string[]
  }>(() => {
    try {
      const saved = localStorage.getItem('sescinc_inventoryState');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migração: se era foundIds (Set/Array), converte para foundQuantities
        let foundQuantities: Record<number, number> = {};
        if (parsed.foundQuantities) {
          foundQuantities = parsed.foundQuantities;
        } else if (parsed.foundIds) {
          const ids = Array.isArray(parsed.foundIds) ? parsed.foundIds : [];
          ids.forEach((id: number) => { foundQuantities[id] = 1; });
        }

        return {
          ...parsed,
          foundQuantities,
          categories: parsed.categories || []
        };
      }
    } catch {}
    return {
      foundQuantities: {},
      sector: '',
      filter: 'ALL',
      categories: []
    };
  });

  useEffect(() => {
    localStorage.setItem('sescinc_inventoryState', JSON.stringify({
      sector: inventoryState.sector,
      filter: inventoryState.filter,
      foundQuantities: inventoryState.foundQuantities,
      categories: inventoryState.categories
    }));
  }, [inventoryState]);
  const [dashboardView, setDashboardView] = useState<'STATS' | 'WORKSPACE'>('STATS');
  const [dashboardChartOption, setDashboardChartOption] = useState<'ALL' | 'NO_DISCH'>('NO_DISCH');
  const [barChartOption, setBarChartOption] = useState<'ALL' | 'NO_DISCH'>('NO_DISCH');
  const [barChartMeasure, setBarChartMeasure] = useState<'QTY' | 'UNITS'>('UNITS');
  const [loanStatusFilter, setLoanStatusFilter] = useState<'ALL' | 'EMPRESTADO' | 'DEVOLVIDO'>('ALL');

  // Sistema de Presença via Apps Script (GitHub Pages Friendly)
  useEffect(() => {
    if (currentUser && currentUser.id !== 999 && SCRIPT_URL && !SCRIPT_URL.includes('SUA_URL')) {
      const updatePresence = async () => {
        try {
          // Heartbeat unificado: atualiza status e recebe lista de online em uma única chamada
          const res = await authenticatedFetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'updateStatus', userId: currentUser.id })
          });
          const data = await res.json();
          
          if (data.success && data.onlineUsers) {
            // Atualiza o offset de tempo do servidor
            if (data.serverTime) {
              setServerTimeOffset(Number(data.serverTime) - new Date().getTime());
            }
            // O backend já retorna a lista filtrada de quem está online
            setOnlineUsers(data.onlineUsers);
          }
        } catch (e) {
          console.error("Erro no heartbeat", e);
        }
      };

      updatePresence(); // Inicial
      const interval = setInterval(updatePresence, 90000); // Intervalo otimizado para 90 segundos
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Sincronização offline
  useEffect(() => {
    const handleUnload = () => {
      if (currentUser && currentUser.id !== 999 && SCRIPT_URL && !SCRIPT_URL.includes('SUA_URL') && sessionToken) {
        const payload = JSON.stringify({
          action: 'updateStatus',
          userId: currentUser.id,
          offline: 'true',
          token: sessionToken,
          executor: currentUser.login
        });
        navigator.sendBeacon(SCRIPT_URL, new Blob([payload], { type: 'text/plain' }));
      }
    };
    window.addEventListener('unload', handleUnload);
    return () => window.removeEventListener('unload', handleUnload);
  }, [currentUser]);

  const addToast = (msg: string, type: 'join' | 'leave' | 'info' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const fetchUsers = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      let data;
      if (!SCRIPT_URL || SCRIPT_URL.includes('SUA_URL')) {
        const res = await fetch('/api/users');
        if (res.ok) data = await res.json();
      } else {
        const res = await authenticatedFetch(SCRIPT_URL, {
          method: 'POST',
          body: JSON.stringify({ action: 'getUsers' })
        });
        if (res.ok) data = await res.json();
      }
      
      if (data && typeof data === 'object' && 'users' in data) {
        const usersArray = data.users as any[];
        if (data.serverTime) {
          const offset = Number(data.serverTime) - new Date().getTime();
          setServerTimeOffset(offset);
        }
        setUsers(usersArray.sort((a, b) => (a.nome || '').localeCompare(b.nome || '')));
      } else if (Array.isArray(data)) {
        setUsers(data.sort((a, b) => (a.nome || '').localeCompare(b.nome || '')));
      }
    } catch (e) { console.error("Error fetching users", e); }
    finally { if (showLoader) setLoading(false); }
  };

  const fetchSectors = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      let data;
      if (!SCRIPT_URL || SCRIPT_URL.includes('SUA_URL')) {
        const res = await fetch('/api/sectors');
        if (res.ok) data = await res.json();
      } else {
        const res = await authenticatedFetch(SCRIPT_URL, {
          method: 'POST',
          body: JSON.stringify({ action: 'getSectors' })
        });
        if (res.ok) data = await res.json();
      }
      if (Array.isArray(data)) setSectores(data.sort((a, b) => a.nome.localeCompare(b.nome)));
    } catch (e) { console.error("Error fetching sectors", e); }
    finally { if (showLoader) setLoading(false); }
  };

  const fetchLoans = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      let data;
      if (!SCRIPT_URL || SCRIPT_URL.includes('SUA_URL')) {
        const res = await fetch('/api/loans');
        if (res.ok) data = await res.json();
      } else {
        const res = await authenticatedFetch(SCRIPT_URL, {
          method: 'POST',
          body: JSON.stringify({ action: 'getLoans' })
        });
        if (res.ok) data = await res.json();
      }
      if (Array.isArray(data)) setLoans(data);
    } catch (e) { console.error("Error fetching loans", e); }
    finally { if (showLoader) setLoading(false); }
  };

  const fetchAudit = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      let data;
      if (!SCRIPT_URL || SCRIPT_URL.includes('SUA_URL')) {
        const res = await fetch('/api/audit');
        if (res.ok) data = await res.json();
      } else {
        const res = await authenticatedFetch(SCRIPT_URL, {
          method: 'POST',
          body: JSON.stringify({ action: 'getAudit' })
        });
        if (res.ok) data = await res.json();
      }
      if (Array.isArray(data)) setAuditLogs(data);
    } catch (e) { console.error("Error fetching audit", e); }
    finally { if (showLoader) setLoading(false); }
  };

  const executeFilter = async (targetView?: string | null, explicitFilters?: any) => {
    if (filterAbortController.current) filterAbortController.current.abort();
    filterAbortController.current = new AbortController();
    const { signal } = filterAbortController.current;

    setLoading(true);
    try {
      const activeView = targetView || view;
      // Management views (STOCK, LOANS, EPI, etc) often want to see everything (fora_de_carga: 'all'),
      // but should still respect search filters like keyword, bmp, documento etc.
      const isManagementView = activeView === 'STOCK' || activeView === 'LOANS' || activeView === 'EPI' || activeView === 'EPR' || activeView === 'DASHBOARD' || activeView === 'AGENTES' || activeView === 'INVENTORY';
      
      const f = explicitFilters 
        ? { ...filters, ...explicitFilters }
        : (isManagementView ? { ...filters, fora_de_carga: 'all' } : filters);
      
      const params = new URLSearchParams({
        action: 'read',
        keyword: (f.keyword || '').toString().trim(),
        documento: (f.documento || '').toString().trim(),
        bmp: (f.bmp || '').toString().trim(),
        setor: f.setor || '',
        situacao: f.situacao || '',
        categoria: f.categoria || '',
        item_epi: ((f as any).item_epi || '').toString(),
        ti: (f.ti || false).toString(),
        hi: (f.hi || false).toString(),
        aph: (f.aph || false).toString(),
        instr: (f.instr || false).toString(),
        altura: (f.altura || false).toString(),
        fora_de_carga: (f.fora_de_carga === 'all' ? 'all' : (f.fora_de_carga || false).toString()),
        extintor_tipo: (f.extintor_tipo || '').toString(),
        extintor_peso: (f.extintor_peso || '').toString()
      });

      let data;
      const baseUrl = (!SCRIPT_URL || SCRIPT_URL.includes('SUA_URL')) ? `/api/search` : SCRIPT_URL;
      
      const res = await authenticatedFetch(baseUrl, { 
        method: 'POST',
        signal,
        body: JSON.stringify({
          action: 'read',
          ...Object.fromEntries(params.entries())
        })
      });
      if (res.ok) data = await res.json();

      if (Array.isArray(data)) {
        const idSet = new Set<number>();
        const results = (data as any[]).map((m, idx) => {
          if (!m || typeof m !== 'object') return null;
          let rawId = m.id && m.id !== "" ? Number(m.id) : NaN;
          if (isNaN(rawId) || rawId === 0 || idSet.has(rawId)) {
            rawId = 2000000 + idx;
          }
          idSet.add(rawId);
          return { ...m, id: rawId };
        }).filter(Boolean) as Material[];
        // Manter o cache global (rawMateriais) sempre populado para os badges de aviso funcionarem
      // Se for uma busca específica (narrow), apenas atualizamos os itens encontrados no cache
        const isNarrowSearch = !!(f.keyword || f.documento || f.bmp || f.setor || f.situacao || f.categoria);
        
        if (isNarrowSearch) {
          setRawMateriais(prev => {
            const map = new Map(prev.map(m => [m.id, m]));
            results.forEach(m => {
              if (m && m.id) {
                map.set(m.id, m);
              }
            });
            return Array.from(map.values());
          });
        } else {
          // General load: update full cache
          setRawMateriais(results);
        }
        
        const isStockCategory = (cat: string) => {
          if (!cat) return false;
          const upper = cat.toUpperCase();
          return upper === 'CONSUMO' || upper === 'DURADOURO' || upper === 'CONSUMO E DURADOURO';
        };

        const filteredResults = results.filter(m => {
          const isStock = activeView === 'STOCK' ? isStockCategory(m.categoria) : true;
          
          // Helper to check truthy values for "boolean" fields from spreadsheet
          const isTruthy = (val: any) => val === true || val === 'TRUE' || val === 'S' || val === 1 || val === '1' || val === 'SIM';

          // Specialized filters (AND logic)
          if (f.keyword) {
            const kl = String(f.keyword).toLowerCase();
            const desc = String(m.descricao || '').toLowerCase();
            const bmp = String(m.bmp || '').toLowerCase();
            const doc = String(m.documento || '').toLowerCase();
            const obs = String(m.observacoes || '').toLowerCase();
            
            if (!desc.includes(kl) && !bmp.includes(kl) && !doc.includes(kl) && !obs.includes(kl)) {
              return false;
            }
          }
          if (f.bmp && String(m.bmp || '').toLowerCase().indexOf(String(f.bmp).toLowerCase()) === -1) return false;
          if (f.setor && String(m.setor || '').trim().toUpperCase() !== String(f.setor).trim().toUpperCase()) return false;
          if (f.situacao && String(m.situacao || '').trim().toUpperCase() !== String(f.situacao).trim().toUpperCase()) return false;
          if (f.categoria && String(m.categoria || '').trim().toUpperCase() !== String(f.categoria).trim().toUpperCase()) return false;
          
          if (f.documento && String(m.documento || '').toLowerCase().indexOf(String(f.documento).toLowerCase()) === -1) return false;
          if (f.ti && !isTruthy(m.ti)) return false;
          if (f.hi && !isTruthy(m.hi)) return false;
          if (f.aph && !isTruthy(m.aph)) return false;
          if (f.instr && !isTruthy(m.instr)) return false;
          if (f.altura && !isTruthy(m.altura)) return false;
          
          const isOut = isTruthy(m.fora_de_carga) || String(m.situacao).toUpperCase() === 'DESCARREGADO' || String(m.situacao).toUpperCase() === 'TRANSFERIDO';
          if (f.fora_de_carga !== 'all') {
             if (f.fora_de_carga === true && !isOut) return false;
             if (f.fora_de_carga === false && isOut) return false;
          }

          if (f.exibir_extintores === false && m.categoria?.toUpperCase().trim() === 'EXTINTORES') return false;

          // Extintor specific filters
          if (f.categoria === 'EXTINTORES' || m.categoria?.toUpperCase().trim() === 'EXTINTORES') {
            if (f.extintor_tipo && m.extintor_tipo !== f.extintor_tipo) return false;
            const mWeight = m.extintor_peso || (m as any).extintor_weight;
            if (f.extintor_peso && mWeight !== f.extintor_peso) return false;
          }

          // Standard logic for discharged
          const isExplicitlyDischarged = f.situacao === 'DESCARREGADO';
          const hideDischarged = !f.exibir_descarregados && !isExplicitlyDischarged && m.situacao === 'DESCARREGADO' && f.fora_de_carga !== true;
          
          // Requirement: Hide EPIs and Agentes from main Dashboard view
          const catStr = String(m.categoria || '').toUpperCase().trim();
          const isEpi = catStr === 'EPI_PRETO' || catStr === 'EPI_AMARELO';
          const isAgentes = catStr === 'LGE' || catStr === 'PQS' || catStr === 'AGENTES_CONFIG';
          const hideEpiOrAgentes = (activeView === 'DASHBOARD' || activeView === 'STOCK') && (isEpi || isAgentes);

          return isStock && !hideDischarged && !hideEpiOrAgentes;
        });
        setMateriais(filteredResults);
      } else {
        console.error("Dados recebidos do Google não são uma lista válida:", data);
        setMateriais([]);
        if (data && (data as any).error) alert("Erro no servidor: " + (data as any).error);
      }
      setHasSearched(true);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Filter error:", err);
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  };



  const fetchBombeiros = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      let data;
      if (!SCRIPT_URL || SCRIPT_URL.includes('SUA_URL')) {
        const res = await fetch('/api/bombeiros');
        if (res.ok) data = await res.json();
      } else {
        const res = await authenticatedFetch(SCRIPT_URL, {
          method: 'POST',
          body: JSON.stringify({ action: 'getBombeiros' })
        });
        if (res.ok) data = await res.json();
      }
      if (Array.isArray(data)) setBombeiros(data.sort((a, b) => (a.nome_guerra || '').localeCompare(b.nome_guerra || '')));
    } catch (e) { console.error("Error fetching bombeiros", e); }
    finally { if (showLoader) setLoading(false); }
  };

  const fetchEpiLoans = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      let data;
      if (!SCRIPT_URL || SCRIPT_URL.includes('SUA_URL')) {
        const res = await fetch('/api/epi_loans');
        if (res.ok) data = await res.json();
      } else {
        const res = await authenticatedFetch(SCRIPT_URL, {
          method: 'POST',
          body: JSON.stringify({ action: 'getEpiLoans' })
        });
        if (res.ok) data = await res.json();
      }
      if (Array.isArray(data)) setEpiLoans(data);
    } catch (e) { console.error("Error fetching epi loans", e); }
    finally { if (showLoader) setLoading(false); }
  };

  const fetchStockPayouts = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      if (!SCRIPT_URL || SCRIPT_URL.includes('SUA_URL')) return;
      const res = await authenticatedFetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'getStockPayouts' })
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setStockPayouts(data);
      }
    } catch (e) { console.error("Error fetching stock payouts", e); }
    finally { if (showLoader) setLoading(false); }
  };

  const fetchStats = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      if (!SCRIPT_URL || SCRIPT_URL.includes('SUA_URL')) return;
      
      const res = await authenticatedFetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'stats' })
      });
      
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) { 
      console.error("Erro ao buscar estatísticas. Verifique se o Script do Google foi implantado como 'Qualquer pessoa'.", e); 
    }
    finally { if (showLoader) setLoading(false); }
  };

  useEffect(() => {
    fetchSectors();
    if (view !== 'LOANS') fetchLoans(false); // Background fetch for badge
    
    if (view === 'DASHBOARD') {
      fetchStats(true);
      executeFilter('DASHBOARD');
    }
    if (view === 'ADMIN') fetchUsers(true);
    if (view === 'LOANS') {
      fetchLoans(true);
      executeFilter('LOANS'); // Precisamos dos materiais para mostrar os nomes
    }
    if (view === 'AUDIT') fetchAudit(true);
    if (view === 'INVENTORY') executeFilter('INVENTORY', { fora_de_carga: 'all' });
    if (view === 'STOCK') {
      fetchStockPayouts(true);
      executeFilter('STOCK');
    }
    if (view === 'EPI') {
      fetchBombeiros(true);
      fetchEpiLoans(true);
      executeFilter('EPI'); // Fetch materials to support EPI loan/payout
    }
    if (view === 'EPR') {
      executeFilter('EPR');
    }
    if (view === 'CLEARANCE') {
      fetchLoans(true);
      fetchEpiLoans(true);
      fetchBombeiros(true);
      executeFilter('CLEARANCE', { fora_de_carga: 'all' });
    }
  }, [view]);

  useEffect(() => {
    if (view === 'DASHBOARD' && dashboardView === 'STATS') {
      fetchStats(true);
    }
  }, [dashboardView]);

  const generateAnalyticReport = () => {
    const sorted = materiais
      .filter(i => i.conta && i.classe)
      .sort((a, b) => {
        const contaA = String(a.conta || "");
        const contaB = String(b.conta || "");
        if (contaA !== contaB) return contaA.localeCompare(contaB);
        
        const classeA = String(a.classe || "");
        const classeB = String(b.classe || "");
        if (classeA !== classeB) return classeA.localeCompare(classeB);
        
        const bmpA = String(a.bmp || "");
        const bmpB = String(b.bmp || "");
        return bmpA.localeCompare(bmpB);
      });

    if (sorted.length === 0) {
      alert("Nenhum item com Conta e Classe preenchidos para gerar o relatório.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Relatório Analítico de Bens</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; font-size: 11px; color: #1a1a1a; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .header-text h1 { font-size: 20px; margin: 0; font-weight: 900; letter-spacing: -0.02em; text-transform: uppercase; }
            .header-text p { margin: 5px 0 0; color: #666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; font-size: 9px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f4f4f4; border: 1px solid #ddd; padding: 10px 8px; text-align: left; text-transform: uppercase; font-size: 9px; font-weight: 900; }
            td { border: 1px solid #ddd; padding: 8px; font-weight: 500; font-variant-numeric: tabular-nums; }
            .row-even { background: #fafafa; }
            .badge { padding: 2px 5px; border-radius: 3px; font-size: 8px; font-weight: 900; text-transform: uppercase; }
            .total-section { margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
            .signature { border-top: 1px solid #000; width: 250px; text-align: center; padding-top: 10px; margin-top: 50px; }
            @media print {
              body { padding: 20px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-text">
              <h1>Relatório Analítico de Bens</h1>
              <p>SESCINC-CO / CCI - CÉLULA CONTRAINCÊNDIO</p>
            </div>
            <div style="text-align: right">
              <p style="font-weight: 900; font-size: 10px; margin: 0">EMISSÃO: ${new Date().toLocaleDateString('pt-BR')}</p>
              <p style="font-weight: 500; font-size: 9px; margin: 0; color: #666">SISTEMA DE GERENCIAMENTO DE MATERIAL</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 100px">BMP</th>
                <th>Nome do Material</th>
                <th>Setor / Localização</th>
                <th style="width: 100px">Estado / Situação</th>
              </tr>
            </thead>
            <tbody>
              ${sorted.map((i, index) => `
                <tr class="${index % 2 === 0 ? 'row-even' : ''}">
                  <td style="font-weight: 700">${i.bmp}</td>
                  <td style="text-transform: uppercase">${i.descricao}</td>
                  <td>${i.setor}</td>
                  <td><span class="badge" style="background: #eee">${i.situacao}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-section">
            <div>
              <p style="font-size: 10px; font-weight: 900; margin: 0">TOTAL DE ITENS: ${sorted.length}</p>
              <p style="font-size: 8px; color: #999; margin: 0">Relatório filtrado apenas para bens com parametrização de conta e classe.</p>
            </div>
            <div class="signature">
              <p style="font-size: 10px; font-weight: 900; margin: 0">${currentUser?.nome}</p>
              <p style="font-size: 8px; color: #666; margin: 0">Responsável pela Emissão</p>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
       printWindow.print();
    }, 500);
  };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const userToSave = editingUser?.id ? editingUser : newUser;

    // Validação SARAM (7 dígitos numéricos)
    if (!/^\d{7}$/.test(userToSave.login || '')) {
      alert('O SARAM deve conter exatamente 7 dígitos numéricos.');
      return;
    }

    setLoading(true);
    try {
      const isNewUser = !editingUser?.id;
      const action = editingUser?.id ? 'update_user' : 'create_user';
      
      const payload = { 
        ...userToSave, 
        action, 
        executor: currentUser?.login,
        ...(isNewUser ? { senha: '123456', force_reset: 'SIM' } : {})
      };

      await authenticatedFetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });
      setShowUserModal(false);
      setNewUser({ nome: '', login: '', senha: '123456', nivel: 'USER' });
      setEditingUser(null);
      fetchUsers();
    } catch (err) { alert('Erro ao salvar usuário'); }
    finally { setLoading(false); }
  };

  const saveSector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectorName) return;
    setLoading(true);
    try {
      await authenticatedFetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ nome: newSectorName, action: 'create_sector', executor: currentUser?.login })
      });
      setNewSectorName('');
      fetchSectors();
    } catch (err) { alert('Erro ao salvar setor'); }
    finally { setLoading(false); }
  };

  const deleteSector = async (id: number) => {
    if (!confirm('Deseja excluir este setor? Itens vinculados a ele podem ficar sem localização.')) return;
    setLoading(true);
    try {
      await authenticatedFetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'delete_row', table: 'SETORES', id, executor: currentUser?.login })
      });
      fetchSectors();
    } catch (err) { alert('Erro ao excluir setor'); }
    finally { setLoading(false); }
  };

  const deleteUser = async (id: number) => {
    if (!confirm('Deseja revogar o acesso deste militar?')) return;
    setLoading(true);
    try {
      await authenticatedFetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'delete_row', table: 'USUARIOS', id, executor: currentUser?.login })
      });
      fetchUsers();
    } catch (err) { alert('Erro ao excluir usuário'); }
    finally { setLoading(false); }
  };

  const createLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedForLoan.length === 0) return alert('Selecione ao menos um material');
    setLoading(true);
    try {
      const mats = materiais.filter(m => selectedForLoan.includes(m.id));
      
      // Bloqueia se houver itens com estoque zerado
      const outOfStock = mats.filter(m => (Number(m.quantidade) || 0) <= 0);
      if (outOfStock.length > 0) {
        setLoading(false);
        return alert(`Atenção: Os seguintes itens estão com estoque zerado e não podem ser emprestados: ${outOfStock.map(m => m.descricao).join(', ')}`);
      }

      const loanPayload = {
        ...newLoan,
        materiais: selectedForLoan.map(id => {
          const mat = materiais.find(m => m.id === id);
          const isConsumo = mat?.categoria === 'CONSUMO';
          const isBulkPermanente = mat?.categoria === 'PERMANENTE' && Number(mat.quantidade) > 1;
          
          return {
            id,
            qty: (isConsumo || isBulkPermanente) ? (loanQuantities[id] || 1) : 1
          };
        }),
        retirada: new Date().toISOString(),
        autorizado_por: currentUser?.nome,
        executor: currentUser?.login,
        action: 'create_loan'
      };

      try {
        const res = await authenticatedFetch(SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(loanPayload)
        });
        const result = await res.json();
        if (!result.success) {
           alert("Erro ao salvar empréstimo no banco de dados: " + (result.message || "Desconhecido"));
        }
      } catch (e) {
        console.error('Erro ao salvar empréstimo no banco de dados:', e);
      }

      // Geramos o PDF independentemente do resultado do fetch, 
      // já que o usuário relatou que os dados chegam à planilha.
      generateLoanReceipt(loanPayload, mats, currentUser?.nome || 'Admin');
      
      setShowLoanModal(false);
      fetchLoans();
      executeFilter();
      setSelectedForLoan([]);
      setLoanQuantities({});
      setNewLoan({ solicitante: '', telefone: '', ramal: '', setor: '', previsao: '' });
      
      alert('Empréstimo registrado com sucesso!');
    } catch (err) { 
      console.error('Erro no processamento do empréstimo:', err);
      if (err instanceof Error && err.message.includes('PDF')) {
        alert('Falha ao gerar o PDF da cautela. Os dados podem ter sido salvos no banco de dados.');
      }
    }
    finally { setLoading(false); }
  };

  const handleReturnLoan = async (loanId: any) => {
    setReturningLoanId(String(loanId));
    setSelectedReturnStatus('PERFEITO');
    setShowReturnModal(true);
  };

  const confirmReturnLoan = async () => {
    setLoading(true);
    try {
      const isEPI = typeof returningLoanId === 'object' && returningLoanId !== null && returningLoanId.type === 'EPI';
      const targetId = isEPI ? returningLoanId.id : returningLoanId;
      const action = isEPI ? 'return_epi' : 'return_loan';

      const res = await authenticatedFetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ 
          action, 
          id: String(targetId), 
          new_status: selectedReturnStatus,
          executor: currentUser?.login 
        })
      });
      const data = await res.json();
      if (!data.success) {
        alert("Erro na devolução: " + (data.message || "Desconhecido"));
        return;
      }

      setShowReturnModal(false);
      setReturningLoanId(null);
      alert('Comando de devolução enviado! Por favor, aguarde alguns segundos.');
      
      setTimeout(async () => {
        if (isEPI) {
          await fetchBombeiros();
          await fetchEpiLoans();
        } else {
          await fetchLoans();
          await executeFilter();
        }
        setLoading(false);
      }, 3000);

    } catch (err) {
      console.error('Erro ao processar devolução:', err);
      alert('Erro técnico ao tentar contato com o servidor.');
      setLoading(false);
    }
  };

  // Persistence check
  useEffect(() => {
    const savedUser = localStorage.getItem('sescinc_user');
    if (savedUser) {
      const u = JSON.parse(savedUser) as User;
      setCurrentUser(u);
      if (u.force_reset === 'SIM') {
        setShowResetPasswordScreen(true);
        setView('LOGIN');
      } else {
        setView('DASHBOARD');
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ ...loginForm, action: 'login' })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        setSessionToken(data.token);
        localStorage.setItem('sescinc_currentUser', JSON.stringify(data.user));
        localStorage.setItem('sescinc_token', data.token);
        
        if (data.user.force_reset === 'SIM') {
          setShowResetPasswordScreen(true);
        } else {
          setView('DASHBOARD');
        }
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Erro de conexão com o servidor do Google');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      alert('Você deve aceitar os Termos de Uso e Licenciamento para prosseguir.');
      return;
    }
    if (resetPasswordForm.novaSenha !== resetPasswordForm.confirmarSenha) {
      alert('As senhas não coincidem');
      return;
    }
    if (resetPasswordForm.novaSenha.length < 4) {
      alert('A senha deve ter pelo menos 4 caracteres');
      return;
    }
    
    setLoading(true);
    try {
      await authenticatedFetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ 
          action: 'update_user', 
          id: currentUser?.id, 
          senha: resetPasswordForm.novaSenha,
          force_reset: 'NÃO',
          executor: currentUser?.login 
        })
      });
      
      const updatedUser = { ...currentUser!, senha: resetPasswordForm.novaSenha, force_reset: 'NÃO' };
      setCurrentUser(updatedUser);
      localStorage.setItem('sescinc_user', JSON.stringify(updatedUser));
      setShowResetPasswordScreen(false);
      setView('DASHBOARD');
      alert('Senha alterada com sucesso!');
    } catch (err) {
      alert('Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  const adminResetUserPassword = async (user: User) => {
    if (!confirm(`Deseja resetar a senha de ${user.nome} para "123456"?`)) return;
    setLoading(true);
    try {
      await authenticatedFetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ 
          action: 'update_user', 
          id: user.id, 
          senha: '123456', 
          force_reset: 'SIM',
          executor: currentUser?.login 
        })
      });
      fetchUsers();
      alert('Senha resetada com sucesso! O militar deverá alterá-la no próximo acesso.');
    } catch (err) {
      alert('Erro ao resetar senha');
    } finally {
      setLoading(false);
    }
  };

  const saveBombeiro = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = editingBombeiro?.id ? editingBombeiro : newBombeiro;
    
    // Validar SARAM (7 dígitos)
    if (!/^\d{7}$/.test(dataToSave.saram || '')) {
      alert('O SARAM deve conter exatamente 7 dígitos numéricos.');
      return;
    }

    setLoading(true);
    try {
      const action = editingBombeiro?.id ? 'update_bombeiro' : 'create_bombeiro';
      await authenticatedFetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ ...dataToSave, action, executor: currentUser?.login })
      });
      setShowBombeiroModal(false);
      setNewBombeiro({ nome_guerra: '', saram: '', tipo: 'INTERNO', funcao: 'COMBATENTE' });
      setEditingBombeiro(null);
      fetchBombeiros();
    } catch (err) { alert('Erro ao salvar bombeiro'); }
    finally { setLoading(false); }
  };

  const deleteBombeiro = async (id: number) => {
    if (!confirm('Deseja excluir este militar do cadastro de EPI?')) return;
    setLoading(true);
    try {
      await authenticatedFetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'delete_row', table: 'BOMBEIROS', id, executor: currentUser?.login })
      });
      fetchBombeiros();
    } catch (err) { alert('Erro ao excluir'); }
    finally { setLoading(false); }
  };

  const returnEPI = async (loanId: number) => {
    if (!loanId) {
      alert('Erro: ID da cautela não encontrado!');
      return;
    }
    setReturningLoanId({ id: loanId, type: 'EPI' });
    setSelectedReturnStatus('PERFEITO');
    setShowReturnModal(true);
  };
  const handleLogout = async () => {
    if (currentUser?.id && SCRIPT_URL && !SCRIPT_URL.includes('SUA_URL')) {
      try {
        // Notifica o servidor para marcar como offline imediatamente - AGUARDA para garantir o envio
        await fetch(`${SCRIPT_URL}?action=updateStatus&userId=${currentUser.id}&offline=true&_=${Date.now()}`).catch(() => {});
      } catch (e) {}
    }
    localStorage.removeItem('sescinc_user');
    setCurrentUser(null);
    setView('LOGIN');
  };

  const saveMaterial = async (e: React.FormEvent, materialOverride?: any) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!currentUser || currentUser.nivel !== 'ADMIN') return alert('Acesso restrito a Administradores');
    
    // Limpeza de campos conforme a categoria do material (conforme pedido na refatoração)
    const mat: any = materialOverride || { ...editingMaterial };

    if (mat.descricao && /\b(epr|respiraç([ãa]o)|respiracao|cilindro|aut[ôo]nom[ao]|capacete|balaclava|luva|cal[çc]a|casaco|blus[ãa]o|jaqueta|bota)\b/i.test(mat.descricao) && mat.categoria !== 'EPI_PRETO' && mat.categoria !== 'EPI_AMARELO' && mat.classificacao !== 'EPR') {
      alert('Atenção: EPI ou EPR devem ser cadastrados no menu Gestão de EPIs/EPRs.');
      return;
    }

    setLoading(true);
    try {
      
      // Verificação de Unicidade de BMP e Descrição
      if (!mat.id) {
        if (mat.bmp && mat.bmp.trim() !== '') {
          const exists = materiais.find(m => m.bmp === mat.bmp);
          if (exists) {
            alert(`Erro: Já existe um item cadastrado com o BMP ${mat.bmp} (${exists.descricao}).`);
            return;
          }
        } else if (mat.descricao) {
          const exists = materiais.find(m => m.descricao?.toUpperCase() === mat.descricao?.toUpperCase());
          if (exists) {
            if (!window.confirm(`Atenção: Já existe um item com a descrição "${mat.descricao}" no banco de dados. Tem certeza que deseja cadastrar?`)) {
              return;
            }
          }
        }
      }
      
      // Auto-compute epr_proximo_teste_data se tiver teste hidrostatico e o intervalo
      if (mat.epr_teste_hidrostatico && mat.epr_proximo_teste_anos) {
        const testDate = new Date(mat.epr_teste_hidrostatico);
        const years = parseInt(mat.epr_proximo_teste_anos, 10);
        if (!isNaN(testDate.getTime()) && !isNaN(years)) {
           testDate.setUTCFullYear(testDate.getUTCFullYear() + years);
           mat.epr_proximo_teste_data = testDate.toISOString().split('T')[0];
        }
      } else {
        mat.epr_proximo_teste_data = '';
      }

      if (!mat.id && mat.categoria === 'PERMANENTE') {
        mat.quantidade = 1;
      }

      const cat = mat.categoria;
      
      // Colunas Comuns que devem ser preservadas
      const baseKeys = ['id', 'setor', 'bmp', 'situacao', 'documento', 'descricao', 'classificacao', 'data_entrada', 'observacoes', 'responsavel'];
      
      let allowedKeys = [...baseKeys];
      
      if (cat === 'EPI_PRETO' || cat === 'EPI_AMARELO') {
        allowedKeys = [...allowedKeys, 'fora_de_carga', 'item_epi', 'tamanho', 'epi_numero', 'validade_epi', 'epi_aviso_validade'];
      } else if (cat === 'CONSUMO' || cat === 'PERMANENTE') {
        allowedKeys = [...allowedKeys, 'item_epi', 'tamanho', 'epi_numero', 'validade_epi', 'fora_de_carga', 'ti', 'hi', 'aph', 'instr', 'altura', 'quantidade', 'conta', 'classe', 'epr_validade_cilindro', 'epr_aviso_validade_cilindro', 'epr_fabricante', 'epr_modelo', 'epr_ultima_recarga', 'epr_proxima_recarga', 'epr_aviso_recarga', 'epr_teste_hidrostatico', 'epr_proximo_teste_anos', 'epr_proximo_teste_data', 'epr_aviso_teste', 'epr_recargas_limite', 'epr_recargas_count'];
      } else if (cat === 'EXTINTORES') {
        allowedKeys = [...allowedKeys, 'fora_de_carga', 'extintor_tipo', 'extintor_weight', 'extintor_peso', 'conta', 'classe'];
      } else if (cat === 'LGE' || cat === 'PQS') {
        allowedKeys = [...allowedKeys, 'agentes_tipo', 'agentes_capacidade', 'agentes_fabricante', 'agentes_numero_lote', 'agentes_validade', 'agentes_aviso_validade', 'agentes_local_armazenamento'];
      } else if (cat === 'AGENTES_CONFIG') {
        allowedKeys = [...allowedKeys, 'item_epi', 'quantidade', 'descricao'];
      }
      
      // Remove campos que não pertencem à categoria
      Object.keys(mat).forEach(key => {
         if (key !== 'id' && key !== 'categoria' && !allowedKeys.includes(key)) {
            delete mat[key];
         }
      });

      const action = mat.id ? 'update_material' : 'create_material';
      const response = await authenticatedFetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ ...mat, action, executor: currentUser?.login })
      });
      const resData = await response.json();
      if (!resData.success) {
        alert(resData.message || 'Erro ao salvar material');
        return;
      }
      setShowMaterialModal(false);
      executeFilter();
    } catch (err) {
      alert('Erro ao salvar material');
    } finally {
      setLoading(false);
    }
  };

  const deleteMaterial = async (m: any) => {
    if (!confirm('Excluir permanentemente este item?')) return;
    setLoading(true);
    try {
      const response = await authenticatedFetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'delete_row', table: m.categoria, id: m.id, executor: currentUser?.login })
      });
      const res = await response.json();
      if (!res.success) {
        alert(res.message || 'Erro ao excluir');
        return;
      }
      executeFilter();
    } catch (err) {
      alert('Erro ao excluir');
    } finally {
      setLoading(false);
    }
  };

  // Login View
  if (view === 'LOGIN') {
    return (
      <div className="min-h-screen bg-[#151619] flex items-center justify-center p-4">
        <AnimatePresence>
          {loading && <Loader />}
        </AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl relative overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {showResetPasswordScreen ? (
              <motion.div 
                key="reset"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-10">
                  <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-blue-600/30">
                    <ShieldAlert size={32} />
                  </div>
                  <h1 className="text-2xl font-black uppercase tracking-widest text-gray-900 leading-tight">
                    Alterar <span className="text-blue-600">Senha</span>
                  </h1>
                  <p className="text-gray-400 text-xs mt-2 px-4 italic">Detectamos que esta é sua primeira senha ou sua senha foi resetada. Por segurança, crie uma nova senha.</p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-6">
                   <div className="space-y-2">
                    <label htmlFor="new-password" title="Nova Senha" className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Nova Senha</label>
                    <input 
                      id="new-password"
                      name="new-password"
                      type="password"
                      required 
                      autoFocus
                      className="modal-input text-gray-900"
                      value={resetPasswordForm.novaSenha}
                      onChange={e => setResetPasswordForm({...resetPasswordForm, novaSenha: e.target.value})}
                      placeholder="Mínimo 4 caracteres"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="confirm-password" title="Confirmar Nova Senha" className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Confirmar Nova Senha</label>
                    <input 
                      id="confirm-password"
                      name="confirm-password"
                      type="password"
                      required 
                      className="modal-input text-gray-900"
                      value={resetPasswordForm.confirmarSenha}
                      onChange={e => setResetPasswordForm({...resetPasswordForm, confirmarSenha: e.target.value})}
                    />
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 max-h-32 overflow-y-auto text-[10px] text-gray-500 font-medium leading-relaxed whitespace-pre-wrap scrollbar-thin">
                      {TERMS_TEXT}
                    </div>
                    
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative flex items-center mt-0.5">
                        <input 
                          type="checkbox"
                          required
                          className="peer sr-only"
                          checked={acceptedTerms}
                          onChange={e => setAcceptedTerms(e.target.checked)}
                        />
                        <div className="w-5 h-5 border-2 border-gray-200 rounded-md bg-white peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all flex items-center justify-center">
                          <CheckCircle size={14} className="text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-gray-600 group-hover:text-blue-600 transition-colors uppercase tracking-tight">Li e aceito os Termos de Uso e Licenciamento</span>
                    </label>
                  </div>

                  <div className="pt-4 flex flex-col gap-3">
                    <button 
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl flex items-center justify-center gap-3"
                    >
                      {loading ? <RefreshCw className="animate-spin" /> : 'Atualizar Credenciais'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setShowResetPasswordScreen(false);
                        handleLogout();
                      }}
                      className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest"
                    >
                      Voltar para o Login
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div 
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="text-center mb-10">
                  <div className="w-20 h-20 mx-auto mb-4 drop-shadow-xl">
                    <img 
                      src="logo-unidade.png" 
                      alt="Logo SESCINC" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        // Fallback caso a imagem suma
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = '<div class="bg-red-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg"><Siren size={32} /></div>';
                      }}
                    />
                  </div>
                  <h1 className="text-2xl font-black uppercase tracking-widest text-gray-900 leading-tight">
                    SESCINC-CO <br/><span className="text-red-600">Gestão de Material</span>
                  </h1>
                  <p className="text-gray-400 text-sm mt-2">SESCINC-CO</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="login-saram" title="Login Militar (SARAM)" className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Login Militar (SARAM)</label>
                    <input 
                      id="login-saram"
                      name="username"
                      autoComplete="username"
                      required 
                      className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-red-600 focus:bg-white outline-none transition-all text-slate-900"
                      value={loginForm.login}
                      onChange={e => setLoginForm({...loginForm, login: e.target.value})}
                      placeholder="0000000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="login-password" title="Senha de Acesso" className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Senha de Acesso</label>
                    <input 
                      id="login-password"
                      name="password"
                      autoComplete="current-password"
                      type="password"
                      required 
                      className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-red-600 focus:bg-white outline-none transition-all text-slate-900"
                      value={loginForm.senha}
                      onChange={e => setLoginForm({...loginForm, senha: e.target.value})}
                    />
                  </div>
                  <button 
                    disabled={loading}
                    className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl flex items-center justify-center gap-3"
                  >
                    {loading ? <RefreshCw className="animate-spin" /> : 'Acessar Sistema'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden relative">
      <AnimatePresence>
        {loading && <Loader />}
      </AnimatePresence>
      
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Responsive Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-[#0F172A] p-6 flex flex-col transition-transform duration-300 transform md:relative md:translate-x-0 overflow-y-auto",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center gap-3 mb-10 px-2 justify-between md:justify-start">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 flex items-center justify-center">
               <img 
                 src="logo-unidade.png" 
                 alt="" 
                 className="w-full h-full object-contain" 
                 onError={(e) => {
                   e.currentTarget.style.display = 'none';
                   e.currentTarget.parentElement!.innerHTML = '<div class="bg-red-600 p-1.5 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg></div>';
                 }}
               />
             </div>
             <div>
               <h1 className="font-bold text-lg leading-tight uppercase tracking-tighter text-white">SESCINC-CO</h1>
               <p className="text-[9px] text-red-500 font-black uppercase tracking-widest">RESERVA DE MATERIAL</p>
             </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-2 text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          <button onClick={() => { setView('DASHBOARD'); setIsMobileMenuOpen(false); }} className={cn("nav-btn text-slate-400 hover:text-white hover:bg-white/5", view === 'DASHBOARD' && "active bg-white/10 text-white")}>
             <Flame size={18} /> Painel Operacional
          </button>
          <button onClick={() => { setView('LOANS'); setIsMobileMenuOpen(false); }} className={cn("nav-btn text-slate-400 hover:text-white hover:bg-white/5 relative group", view === 'LOANS' && "active bg-white/10 text-white")}>
             <ArrowRightLeft size={18} /> Movimentações
             {(() => {
                const overdueCount = loans.filter(l => l.status === 'EMPRESTADO' && l.previsao && isOverdue(l.previsao)).length;
                if (overdueCount > 0) {
                  return (
                    <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-lg animate-pulse">
                      {overdueCount}
                    </span>
                  );
                }
                return null;
             })()}
          </button>
          <div className="flex flex-col">
            <button onClick={() => setIsAgentesMenuOpen(!isAgentesMenuOpen)} className={cn("nav-btn text-slate-400 hover:text-white hover:bg-white/5 flex justify-between items-center w-full relative", view === 'AGENTES' && "text-white")}>
               <div className="flex items-center gap-2">
                 <Flame size={18} /> Agentes Extintores
               </div>
               <div className="flex items-center gap-2">
                 {agentesWarningsBadgeCount > 0 && (
                   <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white shadow-lg animate-pulse">
                     {agentesWarningsBadgeCount}
                   </span>
                 )}
                 {isAgentesMenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
               </div>
            </button>
            <AnimatePresence>
              {isAgentesMenuOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="flex flex-col pl-6 overflow-hidden"
                >
                  <button onClick={() => { setView('AGENTES'); setAgentesSubView('LGE'); setIsMobileMenuOpen(false); }} className={cn("nav-btn flex items-center justify-between text-slate-400 hover:text-white hover:bg-white/5 py-2 relative", view === 'AGENTES' && agentesSubView === 'LGE' && "active bg-white/10 text-white")}>
                     LGE
                  </button>
                  <button onClick={() => { setView('AGENTES'); setAgentesSubView('PQS'); setIsMobileMenuOpen(false); }} className={cn("nav-btn flex items-center justify-between text-slate-400 hover:text-white hover:bg-white/5 py-2 relative", view === 'AGENTES' && agentesSubView === 'PQS' && "active bg-white/10 text-white")}>
                     PQS
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex flex-col">
            <button onClick={() => setIsEpiMenuOpen(!isEpiMenuOpen)} className={cn("nav-btn text-slate-400 hover:text-white hover:bg-white/5 flex justify-between items-center w-full relative", (view === 'EPI' || view === 'EPR') && "text-white")}>
               <div className="flex items-center gap-2">
                 <Shield size={18} /> Gestão de EPIs/EPRs
               </div>
               <div className="flex items-center gap-2">
                 {(eprWarningsBadgeCount + epiWarningsBadgeCount) > 0 && (
                   <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white shadow-lg animate-pulse">
                     {eprWarningsBadgeCount + epiWarningsBadgeCount}
                   </span>
                 )}
                 {isEpiMenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
               </div>
            </button>
            <AnimatePresence>
              {isEpiMenuOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="flex flex-col pl-6 overflow-hidden"
                >
                  <button onClick={() => { setView('EPI'); setIsMobileMenuOpen(false); }} className={cn("nav-btn flex items-center justify-between text-slate-400 hover:text-white hover:bg-white/5 py-2 relative", view === 'EPI' && "active bg-white/10 text-white")}>
                     Gestão de EPIs
                     {epiWarningsBadgeCount > 0 && (
                       <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white shadow-lg animate-pulse">
                         {epiWarningsBadgeCount}
                       </span>
                     )}
                  </button>
                  <button onClick={() => { setView('EPR'); setIsMobileMenuOpen(false); }} className={cn("nav-btn flex items-center justify-between text-slate-400 hover:text-white hover:bg-white/5 py-2 relative", view === 'EPR' && "active bg-white/10 text-white")}>
                     Gestão de EPRs
                     {eprWarningsBadgeCount > 0 && (
                       <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white shadow-lg animate-pulse">
                         {eprWarningsBadgeCount}
                       </span>
                     )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={() => { setView('STOCK'); setIsMobileMenuOpen(false); }} className={cn("nav-btn text-slate-400 hover:text-white hover:bg-white/5", view === 'STOCK' && "active bg-white/10 text-white")}>
             <Boxes size={18} /> Consumo e Duradouro
          </button>
          <button onClick={() => { setView('INVENTORY'); setIsMobileMenuOpen(false); }} className={cn("nav-btn text-slate-400 hover:text-white hover:bg-white/5", view === 'INVENTORY' && "active bg-white/10 text-white")}>
             <CheckSquare size={18} /> Inventariar
          </button>
          <button onClick={() => { setView('COMPARE'); setIsMobileMenuOpen(false); }} className={cn("nav-btn text-slate-400 hover:text-white hover:bg-white/5", view === 'COMPARE' && "active bg-white/10 text-white")}>
             <Database size={18} /> Comparador BMP
          </button>
          <button onClick={() => { setView('CLEARANCE'); setIsMobileMenuOpen(false); }} className={cn("nav-btn text-slate-400 hover:text-white hover:bg-white/5", view === 'CLEARANCE' && "active bg-white/10 text-white")}>
            <UserCheck size={18} /> Desimpedimento
          </button>
          {currentUser?.nivel === 'ADMIN' && (
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => setShowAdminMenu(!showAdminMenu)} 
                className={cn("nav-btn justify-between text-slate-400 hover:text-white", showAdminMenu && "text-white bg-white/5")}
              >
                <div className="flex items-center gap-3">
                  <Settings size={18} /> Administração
                </div>
                {showAdminMenu ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              
              <AnimatePresence>
                {showAdminMenu && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden flex flex-col gap-1 pl-4"
                  >
                    <button onClick={() => { setView('ADMIN'); setIsMobileMenuOpen(false); }} className={cn("nav-btn text-xs py-3 text-slate-400 hover:text-white", view === 'ADMIN' && "active bg-white/10 text-white")}>
                      <Users size={16} /> Gestão de Pessoal
                    </button>
                    
                    <button onClick={generateAnalyticReport} className="nav-btn text-xs py-3 text-emerald-400 hover:text-white hover:bg-emerald-500/10">
                      <FileText size={16} /> Relatório Analítico
                    </button>
                    
                    <div className="flex flex-col gap-1">
                      <button 
                        onClick={() => setShowSettingsMenu(!showSettingsMenu)} 
                        className={cn("nav-btn text-xs py-3 justify-between text-slate-400 hover:text-white", showSettingsMenu && "text-white bg-white/5")}
                      >
                        <div className="flex items-center gap-2">
                          <Settings size={14} /> Configurações
                        </div>
                        {showSettingsMenu ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                      <AnimatePresence>
                        {showSettingsMenu && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden flex flex-col gap-1 pl-4"
                          >
                            <button onClick={() => { setShowSectorModal(true); setIsMobileMenuOpen(false); }} className="nav-btn text-[10px] py-2 text-slate-400 hover:text-white">
                              <Boxes size={14} /> Gerenciar Setores
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <button onClick={() => { setView('AUDIT'); setIsMobileMenuOpen(false); }} className={cn("nav-btn text-xs py-3 text-slate-400 hover:text-white", view === 'AUDIT' && "active bg-white/10 text-white")}>
                      <ShieldAlert size={16} /> Log de Auditoria
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </nav>

        <div className="mt-auto">
          {/* Usuários Online */}
          {onlineUsers.length > 1 && (
            <div className="p-4 bg-emerald-500/10 rounded-2xl mb-4 border border-emerald-500/20">
               <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <p className="text-[9px] text-emerald-400 uppercase font-black">Militares Online ({onlineUsers.length})</p>
               </div>
               <div className="flex flex-wrap gap-1">
                  {onlineUsers.map((u, i) => (
                    <div key={u.id || i} className="group relative">
                      <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-black border border-white/10 hover:border-emerald-500 cursor-help transition-all">
                        {typeof u.nome === 'string' ? u.nome.charAt(0) : '?'}
                      </div>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-[10px] text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        {typeof u.nome === 'string' ? u.nome : (u.nome ? u.nome.nome || String(u.nome) : 'User')}
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          <div className="p-4 bg-white/5 rounded-2xl mb-4">
             <p className="text-[9px] text-gray-500 uppercase font-black mb-1">Militar Identificado</p>
             <p className="font-bold text-sm truncate">{currentUser?.nome}</p>
             <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-md mt-2 inline-block">
                {currentUser?.nivel}
             </span>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 text-red-500 hover:text-white hover:bg-red-600/10 rounded-xl transition-all text-xs font-bold uppercase tracking-widest">
            <LogOut size={16} /> Encerrar Sessão
          </button>
          
          <div className="mt-8 pt-4 border-t border-white/5 text-center">
             <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-1">Desenvolvido por SGT R.CUNHA</p>
             <a 
               href="https://instagram.com/rcunhalrc" 
               target="_blank" 
               rel="noopener noreferrer" 
               className="text-[10px] text-pink-500 hover:text-pink-400 font-black transition-colors flex items-center justify-center gap-1.5"
             >
                <Instagram size={10} /> @rcunhalrc
             </a>
          </div>
        </div>
      </aside>

      {/* Notifications Layer */}
      <div className="fixed top-8 right-8 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={cn(
                "px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-md min-w-[280px]",
                toast.type === 'join' ? "bg-emerald-500/90 border-emerald-400 text-white" : 
                toast.type === 'info' ? "bg-indigo-500/90 border-indigo-400 text-white" :
                toast.type === 'error' ? "bg-red-500/90 border-red-400 text-white" :
                "bg-gray-800/90 border-gray-700 text-gray-100"
              )}
            >
              <div className="p-2 bg-white/20 rounded-xl">
                 {toast.type === 'join' ? <CheckCircle size={18} /> : 
                  toast.type === 'info' ? <Database size={18} /> :
                  toast.type === 'error' ? <AlertTriangle size={18} /> :
                  <LogOut size={18} />}
              </div>
              <p className="text-xs font-black uppercase tracking-widest">{toast.msg}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main Container */}
      <main id="main-scroll-area" className="flex-1 p-3 md:p-10 overflow-y-auto h-[100dvh] w-full relative">
        {/* Mobile Header (Fixed/Sticky at top) */}
        <header className="md:hidden flex items-center justify-between mb-4 bg-[#0F172A] p-3 rounded-2xl shadow-lg border border-white/5">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-all">
            <Filter size={18} />
          </button>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5">
               <Plane size={14} className="text-red-600" />
               <h2 className="text-xs font-black italic text-white leading-none uppercase tracking-tighter">SESCINC-CO</h2>
            </div>
          </div>
          <div className="w-10"></div> {/* Spacer for symmetry */}
        </header>

        <div className="view-content">
          {view === 'DASHBOARD' && (
            <div key="dash-view-container">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
                <div>
                  <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter leading-none uppercase">
                    {dashboardView === 'STATS' ? 'DASHBOARD ESTATÍSTICO' : 'ÁREA DE TRABALHO'}
                  </h2>
                  <p className="text-gray-400 uppercase text-[9px] md:text-[10px] font-bold tracking-[0.2em] mt-2">DASHBOARD de Inventário - SESCINC-CO</p>
                </div>
                <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full md:w-auto overflow-hidden">
                   <button 
                     onClick={() => setDashboardView('STATS')} 
                     className={cn(
                       "flex-1 md:flex-none px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2",
                       dashboardView === 'STATS' ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:bg-gray-200/50"
                     )}
                   >
                     <BarChart3 size={16} /> Estatísticas
                   </button>
                   <button 
                     onClick={() => setDashboardView('WORKSPACE')} 
                     className={cn(
                       "flex-1 md:flex-none px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2",
                       dashboardView === 'WORKSPACE' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:bg-gray-200/50"
                     )}
                   >
                     <Boxes size={16} /> Área de Trabalho
                   </button>
                </div>
              </div>

              {dashboardView === 'STATS' && (
                <>
                  {/* Stats Cards - Resumo do Dashboard */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-10">
                 <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col justify-between">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Total de BMPs Ativos</p>
                    <div className="flex items-end justify-between">
                       <h4 className="text-3xl font-black text-gray-900">{stats?.totalAtivos || 0}</h4>
                       <div className="p-3 bg-red-50 text-red-600 rounded-2xl"><Boxes size={24} /></div>
                    </div>
                 </div>
                 <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col justify-between">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Histórico BMP (Total)</p>
                    <div className="flex items-end justify-between">
                       <h4 className="text-3xl font-black text-gray-900">{stats?.totalHistorico || 0}</h4>
                       <div className="p-3 bg-gray-50 text-gray-600 rounded-2xl"><Database size={24} /></div>
                    </div>
                 </div>
                 <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col justify-between">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Média de Prontidão</p>
                    <div className="flex items-end justify-between">
                       <h4 className="text-3xl font-black text-green-600">
                          {stats?.totalAtivos > 0 ? (((stats.byStatus['PERFEITO'] || 0) + (stats.byStatus['EM_USO'] || 0) + (stats.byStatus['EM USO'] || 0)) / stats.totalAtivos * 100).toFixed(1) : 0}%
                       </h4>
                       <div className="p-3 bg-green-50 text-green-600 rounded-2xl"><Shield size={24} /></div>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 mb-6 md:mb-10">
                 <div className="bg-white rounded-[30px] md:rounded-[40px] p-6 md:p-10 border border-gray-100 shadow-sm flex flex-col">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                       <div className="flex items-center gap-3">
                          <BarChart3 className="text-red-600" size={24} />
                           <h3 className="font-black text-xs uppercase tracking-widest text-gray-900">Distribuição por Categoria</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <div className="flex bg-gray-100 p-1 rounded-xl">
                            <button 
                              onClick={() => setBarChartOption('ALL')}
                              className={cn(
                                "px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all",
                                barChartOption === 'ALL' ? "bg-white shadow-sm text-red-600" : "text-gray-400"
                              )}
                            >
                              Com Descarregados.
                            </button>
                            <button 
                              onClick={() => setBarChartOption('NO_DISCH')}
                              className={cn(
                                "px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all",
                                barChartOption === 'NO_DISCH' ? "bg-white shadow-sm text-red-600" : "text-gray-400"
                              )}
                            >
                              Sem Descarregados.
                            </button>
                          </div>

                          <div className="flex bg-gray-100 p-1 rounded-xl">
                            <button 
                              onClick={() => setBarChartMeasure('QTY')}
                              className={cn(
                                "px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all",
                                barChartMeasure === 'QTY' ? "bg-white shadow-sm text-indigo-600" : "text-gray-400"
                              )}
                            >
                              Qtde
                            </button>
                            <button 
                              onClick={() => setBarChartMeasure('UNITS')}
                              className={cn(
                                "px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all",
                                barChartMeasure === 'UNITS' ? "bg-white shadow-sm text-indigo-600" : "text-gray-400"
                              )}
                            >
                              Unid
                            </button>
                          </div>
                        </div>
                     </div>
                     <div className="space-y-4 flex-1">
                       {(() => {
                          let baseData;
                          if (barChartMeasure === 'QTY') {
                            baseData = barChartOption === 'ALL' ? stats?.byCategory : stats?.byCategoryFiltered;
                          } else {
                            baseData = barChartOption === 'ALL' ? stats?.byCategoryUnits : stats?.byCategoryFilteredUnits;
                          }
                          
                          const entries = Object.entries(baseData || {}).filter(([catId]) => ['PERMANENTE', 'CONSUMO', 'EXTINTORES'].includes(catId));
                          if (entries.length === 0) return <div className="h-full flex items-center justify-center text-gray-400 text-[10px] uppercase font-black">Sem dados</div>;

                          const categories = entries.sort((a, b) => (b[1] as number) - (a[1] as number));
                          const catTotal = categories.reduce((acc, [_, count]) => acc + (count as number), 0);
                          
                          return categories.map(([catId, count]) => {
                             const catDef = CATEGORIES.find(c => c.id === catId);
                             const label = catDef ? catDef.label : catId.replace(/_/g, ' ');
                             const perc = catTotal > 0 ? ((count as number) / catTotal * 100) : 0;
                             
                             return (
                               <div key={catId} className="space-y-1">
                                  <div className="flex justify-between text-[10px] font-black uppercase">
                                     <span className="flex items-center gap-1">
                                       {catDef && <catDef.icon size={10} />}
                                       {label}
                                     </span>
                                     <span>{count as number} ({perc.toFixed(1)}%)</span>
                                  </div>
                                  <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                                     <motion.div 
                                       initial={{ width: 0 }} 
                                       animate={{ width: `${perc}%` }} 
                                       transition={{ duration: 1, ease: "easeOut" }}
                                       className="h-full bg-red-600" 
                                     />
                                  </div>
                               </div>
                             );
                         });
                       })()}

                    </div>
                   </div>

                 {/* Gráfico de Pizza 3D (Polido) de Saúde do Material */}
                 <div className="bg-white rounded-[30px] md:rounded-[40px] p-6 md:p-10 border border-gray-100 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                       <div className="flex items-center gap-3">
                          <ShieldAlert className="text-red-600" size={24} />
                          <h3 className="font-black text-xs uppercase tracking-widest text-gray-900">Saúde do Inventário</h3>
                       </div>
                       <div className="flex bg-gray-100 p-1 rounded-xl">
                          <button 
                            onClick={() => setDashboardChartOption('ALL')}
                            className={cn(
                              "px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all",
                              dashboardChartOption === 'ALL' ? "bg-white shadow-sm text-red-600" : "text-gray-400"
                            )}
                          >
                            Opção 1 (Total)
                          </button>
                          <button 
                            onClick={() => setDashboardChartOption('NO_DISCH')}
                            className={cn(
                              "px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all",
                              dashboardChartOption === 'NO_DISCH' ? "bg-white shadow-sm text-red-600" : "text-gray-400"
                            )}
                          >
                            Opção 2 (Sem Descarregados)
                          </button>
                       </div>
                    </div>


                    <StatusPieChart 
                      data={(() => {
                        const rawStats = stats?.byStatus || {};
                        const grouped: Record<string, number> = {
                          'EM USO': Number(rawStats['EM_USO'] || rawStats['EM USO'] || 0),
                          'AVARIADO': Number(rawStats['AVARIADO'] || 0),
                          'CONDENADO': Number(rawStats['CONDENADO'] || 0),
                          'PROCES. DESCARG.': Number(rawStats['PROCES. DESCARG.'] || 0),
                          'EM TRANSF.': Number(rawStats['EM TRANSF.'] || 0),
                          'Ñ ENCONTRADO': Number(rawStats['Ñ ENCONTRADO'] || 0),
                          'SAÍDA': Number(rawStats['DESCARREGADO'] || 0) + Number(rawStats['TRANSFERIDO'] || 0),
                          'PERFEITO': Number(rawStats['PERFEITO'] || 0),
                        };
                        
                        return Object.entries(grouped)
                          .filter(([label, value]) => {
                            if (value <= 0) return false;
                            if (dashboardChartOption === 'NO_DISCH' && label === 'SAÍDA') return false;
                            return true;
                          })
                          .map(([name, value]) => ({ name, value }));
                      })()}
                    />
                 </div>
              </div>

              <div className="bg-white rounded-[30px] md:rounded-[40px] p-6 md:p-10 border border-gray-100 shadow-sm mb-10">
                 <div className="flex items-center gap-3 mb-8">
                    <ShieldAlert className="text-red-600" size={24} />
                    <h3 className="font-black text-xs uppercase tracking-widest text-gray-900">Estatísticas de Prontidão Detalhadas</h3>
                 </div>
                 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pr-2">
                    {Object.entries(stats?.byStatus || {}).sort((a,b) => (b[1] as number) - (a[1] as number)).map(([sit, count]) => {
                       const perc = stats?.totalHistorico > 0 ? ((count as number) / stats.totalHistorico * 100) : 0;
                       return (
                         <div key={sit} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="flex justify-between items-start mb-1">
                               <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter truncate w-2/3">{sit}</p>
                               <span className="text-[8px] font-bold text-red-600 bg-red-50 px-1 rounded">{perc.toFixed(2)}%</span>
                            </div>
                            <p className="text-xl font-black text-gray-900">{count as number}</p>
                         </div>
                       );
                    })}
                    {(!stats?.byStatus || Object.keys(stats.byStatus).length === 0) && (
                      <div className="col-span-4 text-center py-10 text-gray-400 text-xs text-shading">Aguardando dados de inteligência...</div>
                    )}
                 </div>
              </div>
              </>
            )}

            {dashboardView === 'WORKSPACE' && (
              <>
              {/* Advanced Filter Panel */}
              <section className="bg-white rounded-[30px] md:rounded-[40px] p-6 md:p-8 shadow-sm border border-gray-100 mb-8 ring-1 ring-black/5">
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-2 bg-red-50 text-red-600 rounded-xl"><Filter size={20} /></div>
                   <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">Filtros de Inventário Especializado</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 md:gap-6">
                  <div className="space-y-2 lg:col-span-1">
                    <label htmlFor="filter-keyword" className="filter-label">Palavra-Chave (Geral)</label>
                    <input id="filter-keyword" name="filter-keyword" className="filter-input" value={filters.keyword} onChange={e => setFilters(prev => ({...(prev || filters), keyword: e.target.value}))} onKeyDown={e => e.key === 'Enter' && executeFilter()} placeholder="Termos gerais..." />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="filter-documento" className="filter-label">Documento</label>
                    <input id="filter-documento" name="filter-documento" className="filter-input" value={filters.documento || ''} onChange={e => setFilters(prev => ({...(prev || filters), documento: e.target.value}))} onKeyDown={e => e.key === 'Enter' && executeFilter()} placeholder="SP, OBSERVAÇÕES..." />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="filter-sector" className="filter-label">Setor / Localização</label>
                    <select id="filter-sector" name="filter-sector" className="filter-input" value={filters.setor} 
                      onChange={e => {
                        const val = e.target.value;
                        const newFilters = {...filters, setor: val};
                        setFilters(newFilters);
                        executeFilter(view, newFilters);
                      }}
                    >
                        <option value="">Todos os Setores</option>
                        {sectores.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="filter-status" className="filter-label">Estado de Conservação</label>
                    <select id="filter-status" name="filter-status" className="filter-input" value={filters.situacao} 
                      onChange={e => {
                        const val = e.target.value;
                        const newFilters = {...filters, situacao: val};
                        setFilters(newFilters);
                        executeFilter(view, newFilters);
                      }}
                    >
                        <option value="">Todas as Situações</option>
                        {SITUACOES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="filter-cat" className="filter-label">Categoria do Material</label>
                    <select id="filter-cat" name="filter-cat" className="filter-input" value={filters.categoria} 
                      onChange={e => {
                        const val = e.target.value;
                        const newFilters = {...filters, categoria: val, extintor_tipo: '', extintor_peso: ''};
                        setFilters(newFilters);
                        executeFilter(view, newFilters);
                      }}
                    >
                        <option value="">Todas Categorias</option>
                        {CATEGORIES.map(c => <option key={`cat-filter-${c.id}`} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  {(filters.categoria === 'EPI_PRETO' || filters.categoria === 'EPI_AMARELO') && (
                    <div className="space-y-2">
                      <label htmlFor="filter-epi-item" className="filter-label">Componente EPI</label>
                      <select id="filter-epi-item" name="filter-epi-item" className="filter-input" value={(filters as any).item_epi || ''} 
                        onChange={e => {
                          const val = e.target.value;
                          const newFilters = {...filters, item_epi: val};
                          setFilters(newFilters);
                          executeFilter(view, newFilters);
                        }}
                      >
                        <option value="">Todos os Itens</option>
                        {EPI_COMPONENTS.map(item => <option key={`epi-comp-filter-${item}`} value={item}>{item}</option>)}
                      </select>
                    </div>
                  )}

                  {filters.categoria === 'EXTINTORES' && (
                    <>
                      <div className="space-y-2">
                        <label htmlFor="filter-ext-tipo" className="filter-label">Tipo de Extintor</label>
                        <select id="filter-ext-tipo" name="filter-ext-tipo" className="filter-input" value={filters.extintor_tipo} 
                          onChange={e => {
                            const val = e.target.value;
                            const newFilters = {...filters, extintor_tipo: val};
                            setFilters(newFilters);
                            executeFilter(view, newFilters);
                          }}
                        >
                          <option value="">Todos os Tipos</option>
                          {Array.from(new Set(materiais.filter(m => m.categoria === 'EXTINTORES' && m.extintor_tipo).map(m => m.extintor_tipo))).sort().map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="filter-ext-peso" className="filter-label">Peso / Capacidade</label>
                        <select id="filter-ext-peso" name="filter-ext-peso" className="filter-input" value={filters.extintor_peso} 
                          onChange={e => {
                            const val = e.target.value;
                            const newFilters = {...filters, extintor_peso: val};
                            setFilters(newFilters);
                            executeFilter(view, newFilters);
                          }}
                        >
                          <option value="">Todas Capacidades</option>
                          {Array.from(new Set(materiais.filter(m => m.categoria === 'EXTINTORES' && (m.extintor_peso || (m as any).extintor_weight)).map(m => m.extintor_peso || (m as any).extintor_weight))).sort().map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-8 pt-8 border-t border-gray-50 flex flex-wrap gap-4 items-center">
                   <label htmlFor="toggle-ti" className="relative inline-flex items-center cursor-pointer bg-gray-50 p-4 rounded-2xl transition-all border-2 border-transparent has-[:checked]:bg-red-50 has-[:checked]:border-red-200 w-full sm:w-auto" key="ti-btn">
                      <input id="toggle-ti" type="checkbox" className="sr-only peer" checked={filters.ti} onChange={e => {
                        const val = e.target.checked;
                        const newFilters = {...filters, ti: val};
                        setFilters(newFilters);
                        executeFilter(view, newFilters);
                      }} />
                      <div className="w-11 h-6 shrink-0 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      <span className="ml-3 text-[10px] font-black uppercase text-gray-500 peer-checked:text-red-700">TI (Tecnologia)</span>
                   </label>
                   <label htmlFor="toggle-hi" className="relative inline-flex items-center cursor-pointer bg-gray-50 p-4 rounded-2xl transition-all border-2 border-transparent has-[:checked]:bg-red-50 has-[:checked]:border-red-200 w-full sm:w-auto" key="hi-btn">
                      <input id="toggle-hi" type="checkbox" className="sr-only peer" checked={filters.hi} onChange={e => {
                        const val = e.target.checked;
                        const newFilters = {...filters, hi: val};
                        setFilters(newFilters);
                        executeFilter(view, newFilters);
                      }} />
                      <div className="w-11 h-6 shrink-0 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      <span className="ml-3 text-[10px] font-black uppercase text-gray-500 peer-checked:text-red-700">HIDR (Hidráulicos)</span>
                   </label>
                   <label htmlFor="toggle-aph" className="relative inline-flex items-center cursor-pointer bg-gray-50 p-4 rounded-2xl transition-all border-2 border-transparent has-[:checked]:bg-red-50 has-[:checked]:border-red-200 w-full sm:w-auto" key="aph-btn">
                      <input id="toggle-aph" type="checkbox" className="sr-only peer" checked={filters.aph} onChange={e => {
                        const val = e.target.checked;
                        const newFilters = {...filters, aph: val};
                        setFilters(newFilters);
                        executeFilter(view, newFilters);
                      }} />
                      <div className="w-11 h-6 shrink-0 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      <span className="ml-3 text-[10px] font-black uppercase text-gray-500 peer-checked:text-red-700">APH (Resgate)</span>
                   </label>
                   <label htmlFor="toggle-instr" className="relative inline-flex items-center cursor-pointer bg-gray-50 p-4 rounded-2xl transition-all border-2 border-transparent has-[:checked]:bg-red-50 has-[:checked]:border-red-200 w-full sm:w-auto" key="inst-btn">
                      <input id="toggle-instr" type="checkbox" className="sr-only peer" checked={filters.instr} onChange={e => {
                        const val = e.target.checked;
                        const newFilters = {...filters, instr: val};
                        setFilters(newFilters);
                        executeFilter(view, newFilters);
                      }} />
                      <div className="w-11 h-6 shrink-0 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      <span className="ml-3 text-[10px] font-black uppercase text-gray-500 peer-checked:text-red-700">INSTR (Instrução)</span>
                   </label>
                   <label htmlFor="toggle-fc" className="relative inline-flex items-center cursor-pointer bg-gray-50 p-4 rounded-2xl transition-all border-2 border-transparent has-[:checked]:bg-red-50 has-[:checked]:border-red-200 w-full sm:w-auto" key="fc-btn">
                      <input id="toggle-fc" type="checkbox" className="sr-only peer" checked={filters.fora_de_carga} onChange={e => {
                        const val = e.target.checked;
                        const newFilters = {...filters, fora_de_carga: val};
                        setFilters(newFilters);
                        executeFilter(view, newFilters);
                      }} />
                      <div className="w-11 h-6 shrink-0 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      <span className="ml-3 text-[10px] font-black uppercase text-gray-500 peer-checked:text-red-700">Fora de Carga</span>
                   </label>
                   <label htmlFor="toggle-ext" className="relative inline-flex items-center cursor-pointer bg-gray-50 p-4 rounded-2xl transition-all border-2 border-transparent has-[:checked]:bg-red-50 has-[:checked]:border-red-200 w-full sm:w-auto" key="ext-btn">
                      <input id="toggle-ext" type="checkbox" className="sr-only peer" checked={!filters.exibir_extintores} onChange={e => {
                        const val = !e.target.checked;
                        const newFilters = {...filters, exibir_extintores: val};
                        setFilters(newFilters);
                        executeFilter(view, newFilters);
                      }} />
                      <div className="w-11 h-6 shrink-0 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      <span className="ml-3 text-[10px] font-black uppercase text-gray-500 peer-checked:text-red-700">Ocultar Extintores</span>
                   </label>
                   
                   <label htmlFor="toggle-altura" className="relative inline-flex items-center cursor-pointer bg-gray-50 p-4 rounded-2xl transition-all border-2 border-transparent has-[:checked]:bg-red-50 has-[:checked]:border-red-200 w-full sm:w-auto" key="altura-btn">
                      <input id="toggle-altura" type="checkbox" className="sr-only peer" checked={(filters as any).altura} onChange={e => {
                        const val = e.target.checked;
                        const newFilters = {...filters, altura: val};
                        setFilters(newFilters);
                        executeFilter(view, newFilters);
                      }} />
                      <div className="w-11 h-6 shrink-0 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      <span className="ml-3 text-[10px] font-black uppercase text-gray-500 peer-checked:text-red-700">Altura (NR35)</span>
                   </label>

                   <div className="ml-auto flex items-center gap-2">
                     <button
                      onClick={() => {
                        const cleared = {
                          keyword: '', bmp: '', documento: '', setor: '', situacao: '', categoria: '',
                          ti: false, hi: false, aph: false, instr: false, altura: false,
                          fora_de_carga: false, exibir_extintores: true, exibir_descarregados: false,
                          extintor_tipo: '', extintor_peso: '', clearanceSearch: ''
                        };
                        setFilters(cleared);
                        executeFilter(view, cleared);
                      }}
                      disabled={loading}
                      title="Limpar Filtros"
                      className="p-5 rounded-2xl bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                     >
                       <X size={18} />
                     </button>
                     <button
                      onClick={() => executeFilter()} disabled={loading}
                      title="Atualizar Consulta"
                      className="bg-black text-white px-8 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-800 transition-all flex items-center gap-2 shadow-xl shadow-black/10 hidden md:flex"
                     >
                       {loading ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />}
                       Pesquisar
                     </button>
                     {currentUser?.nivel === 'ADMIN' && (
                       <button onClick={() => { setEditingMaterial({}); setShowMaterialModal(true); }} className="bg-red-600 text-white px-8 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/30 flex items-center gap-2">
                          <Plus size={16} /> Cadastrar
                       </button>
                     )}
                   </div>
                </div>
              </section>

              {/* Loader de Carregamento Independente */}
              {loading && <div className="flex justify-center py-10 opacity-50"><RefreshCw className="animate-spin" /></div>}

              {/* Results Container */}
              {hasSearched ? (
                materiais.length > 0 ? (
                  <div className="bg-white rounded-[30px] md:rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 md:p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50/30 gap-4">
                       <div className="flex items-center gap-4">
                          <h4 className="font-black text-gray-900 text-xs uppercase tracking-widest">Materiais Identificados ({materiais.length})</h4>
                          {selectedForLoan.length > 0 && (
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => setShowLoanModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                              >
                                <ArrowRightLeft size={14} /> Emprestar ({selectedForLoan.length})
                              </button>
                              <button 
                                onClick={() => setSelectedForLoan([])}
                                className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-300 transition-all"
                              >
                                Limpar
                              </button>
                            </div>
                          )}
                       </div>
                       <div className="flex gap-2 w-full md:w-auto">
                         <button onClick={() => exportToExcel(materiais, 'relatorio_sescinc')} className="export-btn flex-1 justify-center bg-green-50 text-green-700">
                           <Download size={16} /> Excel
                         </button>
                         <button onClick={() => generatePDFReport(materiais, 'Relatório Geral de Carga')} className="export-btn flex-1 justify-center bg-red-50 text-red-700">
                           <FileText size={16} /> PDF
                         </button>
                       </div>
                    </div>

                    {/* Resumo por Situação (Filtrado) */}
                    <div className="px-6 md:px-8 py-4 bg-white border-b border-gray-50 flex flex-wrap gap-3">
                       {Object.entries(
                         materiais.reduce((acc, current) => {
                           const sit = current.situacao || 'Indefinido';
                           const q = Number(current.quantidade) || 1;
                           acc[sit] = (acc[sit] || 0) + q;
                           return acc;
                         }, {} as Record<string, number>)
                       ).map(([situacao, count]) => (
                         <div key={situacao} className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl flex items-center gap-2">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{situacao}</span>
                           <span className="bg-white text-slate-700 px-2 py-0.5 rounded-lg text-xs font-black shadow-sm border border-slate-100">{count}</span>
                         </div>
                       ))}
                       <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2 ml-auto shadow-lg shadow-black/5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Total Itens</span>
                          <span className="bg-red-600 text-white px-2 py-0.5 rounded-lg text-xs font-black">
                            {materiais.reduce((sum, current) => sum + (Number(current.quantidade) || 1), 0)}
                          </span>
                       </div>
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50/50">
                           <tr className="text-left">
                              <th className="table-header w-10">
                                 <input 
                                   type="checkbox" 
                                   className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-600 cursor-pointer"
                                   checked={materiais.length > 0 && materiais.every(m => selectedForLoan.includes(m.id))}
                                   onChange={(e) => {
                                     if (e.target.checked) {
                                       const newIds = materiais.map(m => m.id).filter(id => !selectedForLoan.includes(id));
                                       setSelectedForLoan([...selectedForLoan, ...newIds]);
                                     } else {
                                       const visibleIds = materiais.map(m => m.id);
                                       setSelectedForLoan(selectedForLoan.filter(id => !visibleIds.includes(id)));
                                     }
                                   }}
                                 />
                              </th>
                              <th className="table-header">BMP</th>
                              <th className="table-header text-center">Qtde</th>
                              <th className="table-header">Descrição Técnica</th>
                              <th className="table-header">Estado atual</th>
                              <th className="table-header">Setor / Posição</th>
                              <th className="table-header text-right">Ações</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                           {materiais.filter(item => item && item.id).map(item => (
                             <tr 
                               key={item.id} 
                               className="hover:bg-red-50/20 group transition-colors"
                               title={[
                                 item.documento ? `Documento: ${item.documento}` : '',
                                 item.observacoes ? `Observações: ${item.observacoes}` : ''
                               ].filter(Boolean).join('\n') || undefined}
                             >
                                <td className="p-6 w-10 text-center">
                                   <input 
                                     type="checkbox" 
                                     className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-600 cursor-pointer"
                                     checked={selectedForLoan.includes(item.id)}
                                     onChange={(e) => {
                                       if (e.target.checked) setSelectedForLoan([...selectedForLoan, item.id]);
                                       else setSelectedForLoan(selectedForLoan.filter(id => id !== item.id));
                                     }}
                                   />
                                </td>
                                <td className="p-6">
                                   <span className="font-mono font-bold text-red-600 text-sm">#{item.bmp}</span>
                                </td>
                                <td className="p-6 text-center">
                                   <span className="font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded text-xs">
                                     {item.quantidade || 1}
                                   </span>
                                </td>
                                <td className="p-6">
                                   <div className="flex flex-col">
                                      <span className="text-sm font-bold text-gray-800">
                                         {item.item_epi && <span className="text-red-600 font-black mr-1">[{item.item_epi}]</span>}
                                         {item.descricao}
                                         {item.observacoes && (
                                           <button 
                                             title={item.observacoes}
                                             onClick={() => alert(`Observações do Item #${item.bmp}:\n\n${item.observacoes}`)}
                                             className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-all"
                                           >
                                             <MessageCircle size={10} />
                                           </button>
                                         )}
                                      </span>
                                       <div className="flex items-center gap-3 mt-1">
                                          <span className="text-[9px] uppercase font-black text-gray-400">{item.categoria}</span>
                                          {item.conta && <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 rounded uppercase tracking-tighter">Conta: {item.conta}</span>}
                                          {item.classe && <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 rounded uppercase tracking-tighter">Classe: {item.classe}</span>}
                                       </div>
                                       <div className="flex gap-2 mt-1 flex-wrap">
                                          {(item.ti === true || item.ti === 'SIM') && <span className="text-[8px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded uppercase font-black">TI</span>}
                                          {(item.hi === true || item.hi === 'SIM') && <span className="text-[8px] bg-cyan-100 text-cyan-700 px-1 py-0.5 rounded uppercase font-black">HIDR</span>}
                                          {(item.aph === true || item.aph === 'SIM') && <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1 py-0.5 rounded uppercase font-black">APH</span>}
                                          {(item.instr === true || item.instr === 'SIM') && <span className="text-[8px] bg-purple-100 text-purple-700 px-1 py-0.5 rounded uppercase font-black">INSTR</span>}
                                          {(item.altura === true || item.altura === 'SIM') && <span className="text-[8px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded uppercase font-black">ALTURA</span>}
                                          {item.categoria === 'EXTINTORES' && item.extintor_tipo && (
                                            <span className="text-[8px] bg-red-600 text-white px-1 py-0.5 rounded uppercase font-black">
                                              {item.extintor_tipo} {item.extintor_peso ? `- ${item.extintor_peso}` : ''}
                                            </span>
                                          )}
                                       </div>
                                   </div>
                                </td>
                                <td className="p-6">
                                   <span className={cn(
                                      "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase ring-1",
                                      item.situacao === 'PERFEITO' ? "bg-green-50 text-green-700 ring-green-100" : "bg-red-50 text-red-700 ring-red-100"
                                   )}>
                                      {item.situacao}
                                   </span>
                                </td>
                                <td className="p-6 text-xs text-gray-500 font-medium uppercase">{item.setor}</td>
                                <td className="p-6">
                                   <div className={cn("flex justify-end gap-2 transition-opacity", selectedForLoan.includes(item.id) ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                                      {selectedForLoan.includes(item.id) && (
                                        <>
                                          <button onClick={(e) => { e.stopPropagation(); setShowLoanModal(true); }} className="ctrl-btn text-emerald-600 bg-emerald-50 px-3 flex items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all">Emprestar</button>
                                          {item.categoria === 'CONSUMO' && (
                                            <button onClick={(e) => { e.stopPropagation(); setView('STOCK'); }} className="ctrl-btn text-indigo-600 bg-indigo-50 px-3 flex items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all">Pagar</button>
                                          )}
                                        </>
                                      )}
                                      <button onClick={() => { setEditingMaterial(item); setShowMaterialModal(true); }} className="ctrl-btn text-blue-600 bg-blue-50"><Edit size={16} /></button>
                                      {currentUser?.nivel === 'ADMIN' && (
                                        <button onClick={() => deleteMaterial(item)} className="ctrl-btn text-red-600 bg-red-50"><Trash2 size={16} /></button>
                                      )}
                                   </div>
                                </td>
                             </tr>
                           ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden divide-y divide-gray-100 italic">
                        {materiais.filter(item => item && item.id).map(item => (
                            <div 
                              key={item.id} 
                              className="p-5 flex flex-col gap-4"
                              title={[
                                item.documento ? `Documento: ${item.documento}` : '',
                                item.observacoes ? `Observações: ${item.observacoes}` : ''
                              ].filter(Boolean).join('\n') || undefined}
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex flex-col gap-1">
                                       <span className="font-mono font-black text-red-600 text-xs">BMP #{item.bmp}</span>
                                       {item.quantidade && (
                                         <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold w-fit">
                                           Qtd: {item.quantidade}
                                         </span>
                                       )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {selectedForLoan.includes(item.id) && (
                                        <div className="flex flex-col gap-1 mr-2">
                                          <button onClick={(e) => { e.stopPropagation(); setShowLoanModal(true); }} className="flex-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black uppercase tracking-widest">Empréstimo</button>
                                          {item.categoria === 'CONSUMO' && (
                                            <button onClick={(e) => { e.stopPropagation(); setView('STOCK'); }} className="flex-1 px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black uppercase tracking-widest">Pagar</button>
                                          )}
                                        </div>
                                      )}
                                       <input 
                                         type="checkbox" 
                                         className="w-5 h-5 rounded border-gray-300 text-red-600"
                                         checked={selectedForLoan.includes(item.id)}
                                         onChange={(e) => {
                                           if (e.target.checked) setSelectedForLoan([...selectedForLoan, item.id]);
                                           else setSelectedForLoan(selectedForLoan.filter(id => id !== item.id));
                                         }}
                                       />
                                       <span className={cn(
                                          "px-2 py-1 rounded-lg text-[8px] font-black uppercase ring-1",
                                          item.situacao === 'PERFEITO' ? "bg-green-50 text-green-700 ring-green-100" : "bg-red-50 text-red-700 ring-red-100"
                                       )}>{item.situacao}</span>
                                    </div>
                                </div>
                                <div>
                                    <h5 className="text-sm font-bold text-gray-900 leading-tight">
                                       {item.item_epi && <span className="text-red-600 font-black mr-1">[{item.item_epi}]</span>}
                                       {item.descricao}
                                       {item.observacoes && (
                                          <button 
                                            onClick={() => alert(`Observações do Item #${item.bmp}:\n\n${item.observacoes}`)}
                                            className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-blue-50 text-blue-600 rounded-full"
                                          >
                                            <MessageCircle size={10} />
                                          </button>
                                       )}
                                    </h5>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                         <span className="text-[8px] font-black uppercase text-slate-400">{item.categoria}</span>
                                         {item.conta && <span className="text-[8px] font-bold uppercase text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">C: {item.conta}</span>}
                                         {item.classe && <span className="text-[8px] font-bold uppercase text-purple-600 bg-purple-50 px-1.5 rounded">Cl: {item.classe}</span>}
                                        <span className="text-[8px] font-bold uppercase text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{item.setor}</span>
                                        {item.categoria === 'EXTINTORES' && item.extintor_tipo && (
                                          <span className="text-[8px] font-black uppercase text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">
                                            {item.extintor_tipo} {item.extintor_peso ? `- ${item.extintor_peso}` : ''}
                                          </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 border-t border-slate-50 pt-3 mt-1">
                                    <button onClick={() => { setEditingMaterial(item); setShowMaterialModal(true); }} className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Edit size={16}/></button>
                                    {currentUser?.nivel === 'ADMIN' && (
                                        <>
                                          <button onClick={() => deleteMaterial(item)} className="p-3 bg-red-50 text-red-600 rounded-xl"><Trash2 size={16}/></button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-20 rounded-[40px] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-300">
                    <Search size={48} className="mb-4 opacity-20" />
                    <p className="text-xs font-black uppercase tracking-widest text-center">Nenhum material identificado com os filtros atuais.<br/><span className="text-[9px] mt-2 block opacity-50">Tente ajustar seus parâmetros de busca.</span></p>
                  </div>
                )
              ) : (
                <div className="h-64 md:h-80 flex flex-col items-center justify-center text-center p-10 bg-gray-50/50 border-2 border-dashed border-gray-100 rounded-[30px] md:rounded-[40px]">
                   <div className="bg-white p-5 rounded-3xl shadow-sm mb-4 text-red-600/30">
                      <Siren size={32} />
                   </div>
                   <h3 className="text-sm font-black text-gray-900 mb-2 uppercase tracking-widest">Painel Operacional Ativo</h3>
                   <p className="text-gray-400 text-[10px] max-w-xs">Configure os filtros técnicos acima e clique em "Filtrar Registro" para carregar os dados de inventário.</p>
                </div>
               )}
              </>
            )}
            </div>
          )}
          {view === 'CLEARANCE' && (
            <motion.div key="clearance" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                  <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter italic uppercase">Desimpedimento</h2>
                  <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest mt-2">Militares com cautelas pendentes</p>
                </div>
                <div className="w-full md:w-auto relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-600 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="BUSCAR MILITAR..." 
                    className="w-full md:w-80 bg-white border border-gray-100 pl-12 pr-6 py-4 rounded-2xl shadow-sm focus:ring-4 focus:ring-red-600/10 focus:border-red-600 transition-all uppercase font-black text-[10px] tracking-widest"
                    value={filters.clearanceSearch || ''}
                    onChange={e => setFilters({...filters, clearanceSearch: e.target.value})}
                  />
                </div>
              </div>

              <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50/50">
                      <tr className="text-left font-black text-[10px] text-gray-400 uppercase tracking-widest">
                        <th className="p-8">Militar</th>
                        <th className="p-8">Materiais Pendentes</th>
                        <th className="p-8">EPIs em Uso</th>
                        <th className="p-8 text-right">Situação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 uppercase italic text-[11px]">
                      {(() => {
                        const search = (filters.clearanceSearch || '').toUpperCase();
                        
                        // Map of active loans by requester
                        const activeByPerson: Record<string, { materials: any[], epis: any[] }> = {};

                        // 1. General Loans
                        loans.filter(l => l.status === 'EMPRESTADO').forEach(l => {
                          const person = l.solicitante.toUpperCase().trim();
                          if (!activeByPerson[person]) activeByPerson[person] = { materials: [], epis: [] };
                          const mats = JSON.parse(l.materiais_json || '[]').map((item: any) => {
                            const mid = typeof item === 'object' ? item.id : item;
                            const qty = typeof item === 'object' ? item.qty : 1;
                            const mat = rawMateriais.find(m => String(m.id) === String(mid)) || materiais.find(m => String(m.id) === String(mid));
                            return { desc: mat?.descricao || mat?.bmp || mid, qty };
                          });
                          activeByPerson[person].materials.push(...mats);
                        });

                        // 2. EPI Loans
                        epiLoans.filter(el => el.status === 'EM_USO').forEach(el => {
                          const bombeiro = bombeiros.find(b => b.id === el.bombeiro_id);
                          if (!bombeiro) return;
                          const person = bombeiro.nome_guerra.toUpperCase().trim();
                          if (!activeByPerson[person]) activeByPerson[person] = { materials: [], epis: [] };
                          
                          const pieces = JSON.parse(el.pecas_json || '[]').map((p: any) => ({
                            desc: `${p.type} (Nº ${p.number})`,
                            qty: 1
                          }));
                          activeByPerson[person].epis.push(...pieces);
                        });

                        const sortedPeople = Object.keys(activeByPerson)
                          .filter(p => !search || p.includes(search))
                          .sort();

                        if (sortedPeople.length === 0) {
                          return (
                            <tr>
                              <td colSpan={4} className="p-10 text-center text-gray-400 font-black uppercase text-xs">
                                Nenhum militar com pendências localizado
                              </td>
                            </tr>
                          );
                        }

                        return sortedPeople.map(person => (
                          <tr key={person} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-8 font-black text-gray-900">{person}</td>
                            <td className="p-8">
                              <div className="flex flex-wrap gap-1 max-w-md">
                                {activeByPerson[person].materials.length > 0 ? (
                                  activeByPerson[person].materials.map((m, idx) => (
                                    <span key={idx} className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-[9px] font-black">
                                      {m.desc} {m.qty > 1 ? `(x${m.qty})` : ''}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[9px] text-gray-300 font-black">-</span>
                                )}
                              </div>
                            </td>
                            <td className="p-8">
                              <div className="flex flex-wrap gap-1 max-w-md">
                                {activeByPerson[person].epis.length > 0 ? (
                                  activeByPerson[person].epis.map((e, idx) => (
                                    <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-black">
                                      {e.desc}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[9px] text-gray-300 font-black">-</span>
                                )}
                              </div>
                            </td>
                            <td className="p-8 text-right">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black bg-orange-50 text-orange-700 ring-1 ring-orange-100 uppercase">
                                Pendência Ativa
                              </span>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'STOCK' && <StockManagementView 
            materiais={materiais} 
            stockPayouts={stockPayouts}
            loading={loading}
            onRefresh={() => executeFilter()}
            showDischarged={filters.exibir_descarregados}
            onToggleDischarged={(val) => {
              setFilters(prev => ({ ...(prev || filters), exibir_descarregados: val }));
              setTimeout(() => executeFilter(), 0); 
            }}
            onSavePayout={async (payout) => {
              setLoading(true);
              try {
                const res = await authenticatedFetch(SCRIPT_URL, {
                  method: 'POST',
                  headers: { 'Content-Type': 'text/plain' },
                  body: JSON.stringify({ ...payout, action: 'create_stock_payout', executor: currentUser?.login })
                });
                const data = await res.json();
                if (data.success) {
                  alert('Baixa de estoque realizada com sucesso!');
                  executeFilter();
                  fetchStockPayouts();
                  return true;
                } else {
                  alert(data.message);
                  return false;
                }
              } catch (err) {
                alert('Erro ao realizar baixa de estoque');
                return false;
              } finally {
                setLoading(false);
              }
            }}
            onLoan={(ids) => {
              // Set the selection and show modal
              setSelectedForLoan([...ids]);
              setShowLoanModal(true);
            }}
            sectores={sectores}
            currentUser={currentUser}
            selectedForLoan={selectedForLoan}
            setSelectedForLoan={setSelectedForLoan}
          />}

          {view === 'LOANS' && (
            <motion.div key="loans" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter uppercase italic">Movimentações</h2>
                    <div className="flex gap-2 mt-4 text-[10px]">
                      {['ALL', 'EMPRESTADO', 'DEVOLVIDO'].map((status) => (
                        <button
                          key={status}
                          onClick={() => setLoanStatusFilter(status as any)}
                          className={cn(
                            "px-4 py-2 rounded-xl font-black uppercase tracking-widest transition-all",
                            loanStatusFilter === status 
                              ? "bg-black text-white shadow-lg" 
                              : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                          )}
                        >
                          {status === 'ALL' ? 'Todos' : status === 'EMPRESTADO' ? 'Emprestados' : 'Devolvidos'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => setShowLoanModal(true)} className="action-btn-main bg-black text-white w-full md:w-auto justify-center">
                     <ArrowRightLeft size={20} /> Registrar Novo Empréstimo
                  </button>
               </div>

               {(() => {
                 const overdueLoans = loans.filter(l => l.status === 'EMPRESTADO' && l.previsao && isOverdue(l.previsao));
                 if (overdueLoans.length === 0) return null;
                 return (
                   <div className="mb-6 bg-red-50 rounded-3xl p-6 border border-red-100 shadow-sm transition-all">
                     <div className="flex items-center gap-3 mb-4">
                       <AlertCircle className="text-red-500 animate-[pulse_2s_ease-in-out_infinite]" size={24} />
                       <h3 className="text-red-900 font-black text-lg uppercase tracking-tighter">Atenção! Materiais em Atraso</h3>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                       {overdueLoans.map(ol => {
                          const phone = ol.telefone || (ol as any).solicitante_telefone;
                          const matsList = JSON.parse(ol.materiais_json || '[]').map((item: any) => {
                            const mid = typeof item === 'object' ? item.id : item;
                            const qty = typeof item === 'object' ? item.qty : 1;
                            const mat = materiais.find(m => String(m.id) === String(mid));
                            return `• ${mat?.descricao || mat?.bmp || mid}${qty > 1 ? ` (x${qty})` : ''}`;
                          }).join('\n');
                          
                          const message = `Olá ${ol.solicitante}, verificamos que há materiais da Célula Contraincêndio (SESCINC-CO) pendentes de devolução (prazo: ${new Date(ol.previsao).toLocaleDateString()}):\n\n${matsList}\n\nPor favor, regularize a situação o quanto antes.`;

                          return (
                          <div key={ol.id} className="flex flex-col justify-between bg-white border border-red-100 p-4 rounded-2xl shadow-sm">
                            <div className="mb-3">
                              <p className="text-xs font-black text-red-950 uppercase line-clamp-1" title={ol.solicitante}>{ol.solicitante}</p>
                              <p className="text-[10px] text-red-600 font-bold mt-1">Venceu em: {new Date(ol.previsao).toLocaleDateString()}</p>
                            </div>
                            {phone && (
                              <a 
                                href={`https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`}
                                target="_blank" rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#1DA851] text-white rounded-xl text-[10px] font-black uppercase transition-colors shadow-sm"
                              >
                                <MessageCircle size={15} /> Notificar
                              </a>
                            )}
                          </div>
                          );
                       })}
                     </div>
                   </div>
                 );
               })()}
               
               <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                     <table className="w-full">
                        <thead className="bg-gray-50/50">
                           <tr className="text-left font-black text-[10px] text-gray-400 uppercase tracking-widest">
                              <th className="p-8">Retirada</th>
                              <th className="p-8">Solicitante</th>
                              <th className="p-8">Materiais</th>
                              <th className="p-8">Status</th>
                              <th className="p-8">Devolução</th>
                              <th className="p-8 text-right">Ações</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 uppercase italic text-[11px]">
                           {[...loans]
                             .filter(l => loanStatusFilter === 'ALL' ? true : l.status === loanStatusFilter)
                             .reverse()
                             .map(loan => {
                               const overdue = loan.status === 'EMPRESTADO' && loan.previsao && isOverdue(loan.previsao);
                               return (
                              <tr key={loan.id} className={cn("transition-colors", overdue ? "bg-red-50/40 hover:bg-red-50/60" : "hover:bg-gray-50/50")}>
                                 <td className="p-8">
                                    <div className="flex flex-col">
                                       <span className="text-xs font-black text-gray-900">{new Date(loan.retirada).toLocaleDateString()}</span>
                                       <span className="text-[9px] text-gray-400">{new Date(loan.retirada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                       <span className="text-[8px] mt-1 text-slate-500 font-bold bg-slate-100 px-1 py-0.5 rounded w-fit capitalize italic">{loan.executor || loan.autorizado_por || 'Admin'}</span>
                                    </div>
                                 </td>
                                 <td className="p-8 font-black text-gray-700">{loan.solicitante}</td>
                                 <td className="p-8">
                                    <div className="flex flex-wrap gap-1 max-w-[250px]">
                                       {JSON.parse(loan.materiais_json || '[]').map((item: any, idx: number) => {
                                          const mid = typeof item === 'object' ? item.id : item;
                                          const qty = typeof item === 'object' ? item.qty : 1;
                                          const mat = materiais.find(m => String(m.id) === String(mid));
                                          return (
                                            <span key={`${mid}-${idx}`} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black" title={mat?.descricao}>
                                              {mat?.descricao || mat?.bmp || mid} {qty > 1 ? `(x${qty})` : ''}
                                            </span>
                                          );
                                       })}
                                    </div>
                                 </td>
                                 <td className="p-8">
                                    <span className={cn(
                                       "px-3 py-1 rounded-full text-[9px] font-black",
                                       loan.status === 'DEVOLVIDO' ? "bg-green-50 text-green-700 ring-1 ring-green-100" : (overdue ? "bg-red-500 text-white shadow-md shadow-red-500/20" : "bg-red-50 text-red-700 ring-1 ring-red-100")
                                    )}>
                                       {overdue ? 'ATRASADO' : loan.status}
                                    </span>
                                 </td>
                                 <td className="p-8">
                                    {loan.status === 'DEVOLVIDO' ? (
                                      <div className="flex flex-col">
                                        <span className="font-black text-gray-900 lowercase">{loan.data_devolucao ? new Date(loan.data_devolucao).toLocaleDateString() : '-'}</span>
                                        <span className="text-[9px] text-gray-400">{loan.data_devolucao ? new Date(loan.data_devolucao).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                        <span className="text-[8px] mt-1 text-green-600 font-bold bg-green-50 px-1 py-0.5 rounded w-fit capitalize italic">Rec: {loan.executor_devolucao || '-'}</span>
                                      </div>
                                    ) : (
                                      <div className={cn("flex flex-col", overdue ? "opacity-100 text-red-600" : "opacity-40")}>
                                        <span className="text-[9px] font-black">{overdue ? 'Venceu em:' : 'Previsão:'}</span>
                                        <span className={cn("text-[10px]", overdue && "font-bold uppercase")}>{loan.previsao ? new Date(loan.previsao).toLocaleDateString() : 'Não informada'}</span>
                                      </div>
                                    )}
                                 </td>
                                 <td className="p-8 text-right">
                                    {loan.status !== 'DEVOLVIDO' && (
                                       <div className="flex gap-2 justify-end items-center">
                                          {(() => {
                                            const phone = loan.telefone || (loan as any).solicitante_telefone;
                                            if (!overdue || !phone) return null;
                                            
                                            const matsList = JSON.parse(loan.materiais_json || '[]').map((item: any) => {
                                              const mid = typeof item === 'object' ? item.id : item;
                                              const qty = typeof item === 'object' ? item.qty : 1;
                                              const mat = materiais.find(m => String(m.id) === String(mid));
                                              return `• ${mat?.descricao || mat?.bmp || mid}${qty > 1 ? ` (x${qty})` : ''}`;
                                            }).join('\n');
                                            
                                            const message = `Olá ${loan.solicitante}, verificamos que há materiais da Célula Contraincêndio (SESCINC-CO) pendentes de devolução (prazo: ${new Date(loan.previsao).toLocaleDateString()}):\n\n${matsList}\n\nPor favor, regularize a situação o quanto antes.`;

                                            return (
                                              <a 
                                                  href={`https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`}
                                                  target="_blank" rel="noopener noreferrer"
                                                  className="p-3 bg-[#25D366]/10 text-[#25D366] rounded-xl hover:bg-[#25D366] hover:text-white transition-all shadow-sm flex items-center justify-center"
                                                  title="Cobrar via WhatsApp"
                                              >
                                                 <MessageCircle size={18} />
                                              </a>
                                            );
                                          })()}
                                          <button 
                                             onClick={() => handleReturnLoan(loan.id)}
                                             className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm"
                                             title="Registrar Devolução"
                                          >
                                             <CheckCircle size={18} />
                                          </button>
                                       </div>
                                    )}
                                 </td>
                              </tr>
                               );
                             })}
                           {loans.length === 0 && (
                             <tr>
                               <td colSpan={6} className="p-20 text-center text-gray-400 font-black text-sm uppercase tracking-widest italic">
                                 Nenhum registro de movimentação encontrado
                               </td>
                             </tr>
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>
            </motion.div>
          )}

          {view === 'ADMIN' && (
            <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                <div>
                  <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter leading-none uppercase italic">Gestão de Pessoal</h2>
                  <p className="text-gray-400 uppercase text-[9px] md:text-[10px] font-bold tracking-[0.2em] mt-2">Administração de níveis de acesso militar</p>
                </div>
                <button 
                  onClick={generateAnalyticReport}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
                >
                  <FileText size={16} />
                  Gerar Relatório Analítico
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <div className="bg-white p-6 md:p-8 rounded-[30px] md:rounded-[40px] shadow-sm border border-gray-100">
                    <h3 className="font-black text-xs uppercase tracking-widest text-gray-900 mb-6">Novo Registro de Acesso</h3>
                    <form onSubmit={saveUser} className="space-y-4">
                      <div>
                        <label htmlFor="user-guerra-nome" className="modal-label">Nome de Guerra</label>
                        <input id="user-guerra-nome" name="user-guerra-nome" className="modal-input" required value={newUser.nome} onChange={e => setNewUser({...newUser, nome: e.target.value})} placeholder="Ex: SGT CUNHA" />
                      </div>
                      <div>
                        <label htmlFor="user-saram-login" className="modal-label">Login SARAM (7 dígitos)</label>
                        <input 
                          id="user-saram-login"
                          name="user-saram-login"
                          className="modal-input" 
                          required 
                          maxLength={7}
                          minLength={7}
                          pattern="\d{7}"
                          title="O SARAM deve conter exatamente 7 dígitos numéricos"
                          value={newUser.login} 
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '');
                            if (val.length <= 7) {
                              setNewUser({...newUser, login: val});
                            }
                          }} 
                          placeholder="Ex: 7012345" 
                        />
                      </div>
                      <div>
                        <label htmlFor="user-level-admin" className="modal-label">Nível Hierárquico</label>
                        <select id="user-level-admin" name="user-level-admin" className="modal-input" value={newUser.nivel} onChange={e => setNewUser({...newUser, nivel: e.target.value as any})}>
                          <option value="USER">Operacional (Padrão)</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </div>
                      <button className="w-full bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-600 transition-all shadow-lg">
                        Autorizar Acesso
                      </button>
                    </form>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="bg-white rounded-[30px] md:rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 md:p-8 bg-gray-50/50 border-b border-gray-100">
                      <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-500">Militares Autorizados ({users.length})</h4>
                    </div>
                    
                    {/* Responsive User List */}
                    <div className="hidden md:block">
                      <table className="w-full">
                        <thead className="bg-gray-50/30">
                          <tr className="text-left font-black text-[10px] text-gray-400 uppercase">
                            <th className="p-6">Militar</th>
                            <th className="p-6">Login</th>
                            <th className="p-6">Privilégios</th>
                            <th className="p-6 text-right">Controle</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {users.map(u => (
                            <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="p-6 font-bold text-gray-900">{u.nome}</td>
                              <td className="p-6 font-mono text-xs text-gray-500">{u.login}</td>
                              <td className="p-6">
                                <span className={cn(
                                  "px-2 py-1 rounded text-[9px] font-black uppercase ring-1",
                                  u.nivel === 'ADMIN' ? "bg-red-50 text-red-700 ring-red-100" : "bg-gray-50 text-gray-600 ring-gray-100"
                                )}>{u.nivel}</span>
                               <button onClick={() => { setEditingUser(u); setShowUserModal(true); }} className="p-2 text-indigo-600 bg-indigo-50 rounded-lg">
                                 <Edit size={16} />
                               </button>
                              </td>
                              <td className="p-6 text-right">
                                <div className="flex justify-end gap-2">
                                  <button title="Editar Militar" onClick={() => { setEditingUser(u); setShowUserModal(true); }} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                                    <Edit size={18} />
                                  </button>
                                  <button title="Resetar Senha (123456)" onClick={() => adminResetUserPassword(u)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                                    <RefreshCw size={18} />
                                  </button>
                                  <button onClick={() => deleteUser(u.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card List */}
                    <div className="md:hidden divide-y divide-gray-100">
                      {users.map(u => (
                        <div key={u.id} className="p-4 flex justify-between items-center bg-white">
                           <div>
                              <p className="font-bold text-gray-900 uppercase text-xs">{u.nome}</p>
                              <p className="text-[10px] text-gray-400 font-mono mt-1">{u.login}</p>
                           </div>
                           <div className="flex items-center gap-2">
                              <span className={cn(
                                "px-2 py-1 rounded text-[8px] font-black uppercase",
                                u.nivel === 'ADMIN' ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-600"
                              )}>{u.nivel}</span>
                              <button onClick={() => { setEditingUser(u); setShowUserModal(true); }} className="p-2 text-indigo-600 bg-indigo-50 rounded-lg">
                                <Edit size={16} />
                              </button>
                              <button title="Resetar Senha" onClick={() => adminResetUserPassword(u)} className="p-2 text-blue-600 bg-blue-50 rounded-lg">
                                <RefreshCw size={16} />
                              </button>
                              <button onClick={() => deleteUser(u.id)} className="p-2 text-red-600 bg-red-50 rounded-lg">
                                <Trash2 size={16} />
                              </button>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'EPI' && (
            <motion.div key="epi" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                <div>
                  <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter leading-none uppercase italic">Controle de EPI</h2>
                  <p className="text-gray-400 uppercase text-[9px] md:text-[10px] font-bold tracking-[0.2em] mt-2">Cadastro e Gerenciamento de cautelas individuais de EPI</p>
                </div>
              </div>

              <div className="flex bg-gray-100 p-2 rounded-[20px] mb-8 w-max gap-2">
                 <button
                   onClick={() => setEpiSubView('GESTAO')}
                   className={cn("px-6 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all", epiSubView === 'GESTAO' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:bg-gray-200")}
                 >
                   <Shield size={16} className="inline-block mr-2 -mt-1" />
                   Controle de Cautelas
                 </button>
                 {currentUser?.nivel === 'ADMIN' && (
                   <button
                     onClick={() => {
                       setEpiSubView('CADASTRO');
                       setEditingMaterial({ fora_de_carga: 'SIM' } as any);
                     }}
                     className={cn("px-6 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all", epiSubView === 'CADASTRO' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:bg-gray-200")}
                   >
                     <Settings size={16} className="inline-block mr-2 -mt-1" />
                     Cadastro de EPIs
                   </button>
                 )}
              </div>

              {epiSubView === 'GESTAO' && (
                <div className="flex flex-col gap-8">
                  {epiWarnings.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-[20px] p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                         <AlertCircle className="text-orange-500" size={24} />
                         <h3 className="font-black text-orange-700 tracking-tight text-lg">Avisos de Validade EPI</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {epiWarnings.map((w, i) => (
                            <div key={i} className="bg-white/80 p-4 rounded-xl border border-orange-100 flex flex-col gap-1">
                               <div className="flex justify-between items-center">
                                 <span className="font-black text-xs text-orange-800">{w.item} {w.numero} ({w.color})</span>
                                 <span className={cn("text-[9px] px-2 py-0.5 rounded-full font-bold uppercase", w.days <= 0 ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600")}>
                                   {w.days < 0 ? `Vencido há ${Math.abs(w.days)} d` : w.days === 0 ? "Vence hoje" : `Em ${w.days} d`}
                                 </span>
                               </div>
                               <span className="text-[11px] text-gray-600 font-medium">{w.msg}</span>
                               <button onClick={() => {
                                  const m = materiais.find(mat => mat.id === w.id);
                                  if (m) {
                                    setEditingMaterial(m);
                                    setEpiSubView('CADASTRO');
                                    setIsEpiCadastroOpen(true);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }
                               }} className="text-blue-600 text-[10px] font-bold mt-2 self-start hover:underline">Ver Cadastro</button>
                            </div>
                         ))}
                      </div>
                    </div>
                  )}
                  {/* Cadastro de Bombeiros - Restrito a ADMIN */}
                {currentUser?.nivel === 'ADMIN' ? (
                  <div className="w-full">
                    <div className="bg-white p-6 md:p-8 rounded-[30px] shadow-sm border border-gray-100 transition-all">
                      <button 
                        type="button" 
                        onClick={() => setIsBombeiroCadastroOpen(!isBombeiroCadastroOpen)}
                        className="w-full flex justify-between items-center outline-none"
                      >
                        <h3 className="font-black text-xs uppercase tracking-widest text-gray-900 flex items-center gap-2">
                           <Users size={16} className="text-red-600" /> Cadastro de Bombeiros
                        </h3>
                        {isBombeiroCadastroOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                      </button>
                      
                      <AnimatePresence>
                        {isBombeiroCadastroOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <form onSubmit={saveBombeiro} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                              <div>
                                <label htmlFor="epi-nome-guerra" className="modal-label">Nome de Guerra</label>
                                <input id="epi-nome-guerra" name="epi-nome-guerra" className="modal-input" required value={editingBombeiro?.nome_guerra || newBombeiro.nome_guerra} onChange={e => editingBombeiro ? setEditingBombeiro({...editingBombeiro, nome_guerra: e.target.value}) : setNewBombeiro({...newBombeiro, nome_guerra: e.target.value})} placeholder="Ex: SGT CUNHA" />
                              </div>
                              <div>
                                <label htmlFor="epi-saram" className="modal-label">SARAM (7 dígitos)</label>
                                <input 
                                  id="epi-saram"
                                  name="epi-saram"
                                  className="modal-input" required maxLength={7} minLength={7} pattern="\d{7}"
                                  value={editingBombeiro?.saram || newBombeiro.saram} 
                                  onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    if (val.length <= 7) {
                                      editingBombeiro ? setEditingBombeiro({...editingBombeiro, saram: val}) : setNewBombeiro({...newBombeiro, saram: val});
                                    }
                                  }}
                                  placeholder="0000000"
                                />
                              </div>
                              <div>
                                <label htmlFor="bombeiro-tipo" className="modal-label">Tipo de Efetivo</label>
                                <select id="bombeiro-tipo" name="bombeiro-tipo" className="modal-input" value={editingBombeiro?.tipo || newBombeiro.tipo} onChange={e => editingBombeiro ? setEditingBombeiro({...editingBombeiro, tipo: e.target.value as any}) : setNewBombeiro({...newBombeiro, tipo: e.target.value as any})}>
                                  <option value="INTERNO">Interno</option>
                                  <option value="EXTERNO">Externo</option>
                                </select>
                              </div>
                              <div>
                                <label htmlFor="bombeiro-funcao" className="modal-label">Função nO SESCINC</label>
                                <select id="bombeiro-funcao" name="bombeiro-funcao" className="modal-input" value={editingBombeiro?.funcao || newBombeiro.funcao} onChange={e => editingBombeiro ? setEditingBombeiro({...editingBombeiro, funcao: e.target.value}) : setNewBombeiro({...newBombeiro, funcao: e.target.value})}>
                                  <option value="">Selecione Função...</option>
                                  {EPI_FUNCTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                              </div>
                              <div className="md:col-span-2 lg:col-span-4 flex flex-col md:flex-row gap-4 justify-end mt-2">
                                {editingBombeiro && (
                                  <button type="button" onClick={() => setEditingBombeiro(null)} className="w-full md:w-auto px-8 bg-gray-100 text-gray-500 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">
                                    Cancelar Edição
                                  </button>
                                )}
                                <button disabled={loading} className="w-full md:w-auto px-10 bg-black text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-red-600 transition-all shadow-lg flex items-center justify-center gap-2">
                                  {loading ? <RefreshCw className="animate-spin" size={14} /> : (editingBombeiro?.id ? 'Atualizar Militar' : 'Cadastrar Militar')}
                                </button>
                              </div>
                            </form>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ) : null}

                {/* Lista de Bombeiros e Controle de EPI */}
                <div className="space-y-8 w-full">
                  {/* Filtro por Tamanho e Tipo */}
                  <div className="bg-white p-6 rounded-[30px] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
                     <div className="flex-1 w-full relative">
                        <label htmlFor="bombeiro-search" className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Buscar Bombeiro</label>
                        <div className="relative flex items-center">
                          <div className="absolute left-4 z-10 pointer-events-none">
                            <Search size={16} className="text-gray-400" />
                          </div>
                          <input 
                            id="bombeiro-search"
                            className="modal-input pl-12 bg-gray-50 border-transparent focus:bg-white text-xs w-full" 
                            style={{ paddingLeft: '48px' }}
                            placeholder="Nome ou SARAM..." 
                            autoComplete="off"
                            value={bombeiroSearch || ''}
                            onChange={e => setBombeiroSearch(e.target.value)}
                          />
                        </div>
                     </div>
                     <div className="flex-1 w-full">
                        <label htmlFor="epi-filter-type" className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Filtrar por Equipamento</label>
                        <select 
                          id="epi-filter-type"
                          className="modal-input bg-gray-50 border-transparent focus:bg-white"
                          value={epiFilterType}
                          onChange={e => {
                            setEpiFilterType(e.target.value);
                            setEpiFilterSize('');
                          }}
                        >
                          <option value="">Todos os Itens...</option>
                          {EPI_COMPONENTS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                     </div>
                     <div className="flex-1 w-full">
                        <label htmlFor="epi-filter-size" className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Filtrar por Tamanho</label>
                        <select 
                          id="epi-filter-size"
                          className="modal-input bg-gray-50 border-transparent focus:bg-white"
                          value={epiFilterSize}
                          onChange={e => setEpiFilterSize(e.target.value)}
                        >
                          <option value="">Todos os Tamanhos...</option>
                          {(() => {
                            const filteredByCat = materiais.filter(m => m.categoria === 'EPI_PRETO' || m.categoria === 'EPI_AMARELO');
                            const filteredByType = epiFilterType 
                              ? filteredByCat.filter(m => m.item_epi === epiFilterType)
                              : filteredByCat;
                            
                            const uniqueSizes = Array.from(new Set(filteredByType.filter(m => m.tamanho).map(m => m.tamanho))).sort();
                            
                            return uniqueSizes.map(s => {
                              const count = filteredByType.filter(m => String(m.tamanho) === String(s)).length;
                              return <option key={s} value={s}>{s} ({count})</option>;
                            });
                          })()}
                        </select>
                     </div>
                     {(epiFilterType || epiFilterSize) && (
                       <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex gap-6 animate-in zoom-in duration-300">
                          <div>
                            <p className="text-[8px] font-black text-red-400 uppercase tracking-widest">Em Uso</p>
                            <p className="text-xl font-black text-red-600">
                              {epiLoans.filter(l => String(l.status).trim().toUpperCase() === 'EM_USO' && (() => {
                                try {
                                  return JSON.parse(l.pecas_json).some((p: any) => 
                                    (!epiFilterType || String(p.type).trim().toUpperCase() === String(epiFilterType).trim().toUpperCase()) && 
                                    (!epiFilterSize || String(p.size).trim().toUpperCase() === String(epiFilterSize).trim().toUpperCase())
                                  );
                                } catch(e) { return false; }
                              })()).length}
                            </p>
                          </div>
                          <div className="w-px h-10 bg-red-200"></div>
                          <div>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Estoque</p>
                            <p className="text-xl font-black text-gray-900">
                              {materiais.filter(m => 
                                (!epiFilterType || m.item_epi === epiFilterType) && 
                                (!epiFilterSize || String(m.tamanho) === String(epiFilterSize)) && 
                                !epiLoans.filter(l => String(l.status).trim().toUpperCase() === 'EM_USO').some(l => {
  try {
    return JSON.parse(l.pecas_json).some((p: any) => String(p.number).trim().padStart(3, '0') === String(m.epi_numero || m.bmp || '').trim().padStart(3, '0') && String(p.type).trim().toUpperCase() === String(m.item_epi || '').trim().toUpperCase());
  } catch(e) { return false; }
})
                              ).length}
                            </p>
                          </div>
                       </div>
                     )}
                     <button 
                       onClick={() => { setEpiFilterType(''); setEpiFilterSize(''); setBombeiroSearch(''); }}
                       className="p-4 bg-gray-100 text-gray-400 rounded-2xl hover:bg-gray-200 transition-all"
                       title="Limpar Filtros"
                     >
                        <X size={20} />
                     </button>
                  </div>

                  {/* Cards de Resumo Agrupados por Cor */}
                  <div className="space-y-6">
                    {['EPI_PRETO', 'EPI_AMARELO'].map(cat => (
                      <div key={cat} className="space-y-3">
                        <div className="flex items-center gap-2 px-2">
                           <div className={cn("w-2 h-2 rounded-full", cat === 'EPI_PRETO' ? "bg-black" : "bg-yellow-400")} />
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                             {cat === 'EPI_PRETO' ? 'Conjunto EPI Preto' : 'Conjunto EPI Amarelo'}
                           </h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                           {EPI_COMPONENTS.map(piece => {
                             const inUse = epiLoans.filter(l => String(l.status).trim().toUpperCase() === 'EM_USO' && (() => {
                               try {
                                 return JSON.parse(l.pecas_json).some((p: any) => String(p.type).trim().toUpperCase() === String(piece).trim().toUpperCase() && (String(p.category).trim().toUpperCase() === String(cat).trim().toUpperCase() || String(p.category).trim().toUpperCase() === 'PERMANENTE') && (!epiFilterSize || String(p.size).trim().toUpperCase() === String(epiFilterSize).trim().toUpperCase()));
                               } catch(e) { return false; }
                             })()).length;
                             const total = materiais.filter(m => m.item_epi === piece && (m.categoria === cat || m.categoria === 'PERMANENTE') && (!epiFilterSize || String(m.tamanho) === String(epiFilterSize))).length;
                             if (total === 0 && inUse === 0) return null;
                             return (
                               <div key={piece} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                  <p className="text-[8px] font-black uppercase text-gray-400 tracking-tighter mb-1 truncate">{piece}</p>
                                  <div className="flex justify-between items-end">
                                     <span className="text-xl font-black text-gray-900">{total - inUse}</span>
                                     <span className="text-[8px] text-red-600 font-bold">USO: {inUse}</span>
                                  </div>
                               </div>
                             );
                           })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                       <h3 className="font-black text-xs uppercase tracking-widest text-gray-500">
                         Militares {bombeiroSearch ? 'Filtrados' : 'Cadastrados'} ({
                           bombeiros.filter(b => 
                             (b.nome_guerra || '').toLowerCase().includes(bombeiroSearch.toLowerCase()) || 
                             String(b.saram || '').includes(bombeiroSearch)
                           ).length
                         })
                       </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50/50">
                          <tr className="text-left">
                            <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Bombeiro</th>
                            <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">SARAM</th>
                            <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Função / Tipo</th>
                            <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">EPIs em Cautela</th>
                            <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {bombeiros.filter(b => 
                            (b.nome_guerra || '').toLowerCase().includes(bombeiroSearch.toLowerCase()) || 
                            String(b.saram || '').includes(bombeiroSearch)
                          ).map(b => (
                            <tr key={b.id} className="group hover:bg-gray-50 transition-colors">
                              <td className="p-6">
                                <span className="font-black text-gray-900 uppercase italic tracking-tighter">{b.nome_guerra}</span>
                              </td>
                              <td className="p-6 font-mono text-xs text-gray-500">{b.saram}</td>
                              <td className="p-6">
                                <div className="flex flex-col gap-1">
                                  <span className="text-[10px] font-black uppercase text-gray-900">{b.funcao}</span>
                                  <span className={cn(
                                    "text-[8px] font-black uppercase px-2 py-0.5 rounded-md w-fit",
                                    b.tipo === 'INTERNO' ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                                  )}>{b.tipo}</span>
                                </div>
                              </td>
                              <td className="p-6">
                                {epiLoans.filter(l => l.bombeiro_id === b.id && l.status === 'EM_USO').map(loan => {
                                  const pecas = JSON.parse(loan.pecas_json);
                                  return (
                                    <div key={loan.id} className="flex flex-col gap-2">
                                      <div className="flex flex-wrap gap-1">
                                        {pecas.map((p: any, idx: number) => (
                                          <div key={idx} className={cn(
                                            "min-w-[100px] p-2 rounded-xl border flex flex-col gap-0.5 shadow-sm transition-all hover:scale-105",
                                            p.category === 'EPI_PRETO' 
                                            ? "bg-gray-900 border-black text-white" 
                                            : "bg-yellow-50 border-yellow-200 text-yellow-900"
                                          )}>
                                             <div className="flex justify-between items-start">
                                                <span className="text-[7px] font-black uppercase opacity-60 tracking-widest">{p.type}</span>
                                                <div className={cn(
                                                  "w-1.5 h-1.5 rounded-full",
                                                  p.category === 'EPI_PRETO' ? "bg-white" : "bg-yellow-500"
                                                )} />
                                             </div>
                                             <span className="text-[10px] font-black italic tracking-tighter">Nº {p.number}</span>
                                             <div className="mt-1 flex items-center gap-1">
                                                <div className="px-1.5 py-0.5 bg-white/20 rounded text-[8px] font-black">
                                                  TAM: {p.size || '??'}
                                                </div>
                                             </div>
                                          </div>
                                        ))}
                                      </div>
                                      <div className="flex gap-2">
                                        <button 
                                          onClick={() => returnEPI(loan.id || (loan as any).ID)}
                                          className="text-[8px] font-black uppercase text-red-600 hover:bg-red-50 p-1 rounded w-fit flex items-center gap-1 border border-red-100"
                                        >
                                          <RefreshCw size={10} /> Devolver Tudo
                                        </button>
                                        <button 
                                          onClick={() => {
                                            const pecas = JSON.parse(loan.pecas_json);
                                            generateEpiLoanReceipt(
                                              b, 
                                              pecas, 
                                              { 
                                                telefone: loan.solicitante_telefone || '-', 
                                                ramal: loan.solicitante_ramal || '-', 
                                                setor: loan.solicitante_setor || '-' 
                                              }, 
                                              loan.executor || 'Admin'
                                            );
                                          }}
                                          className="text-[8px] font-black uppercase text-indigo-600 hover:bg-indigo-50 p-1 rounded w-fit flex items-center gap-1 border border-indigo-100"
                                        >
                                          <Printer size={10} /> Reimprimir
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </td>
                              <td className="p-6">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => { 
                                    const loan = epiLoans.find(l => l.bombeiro_id === b.id && l.status === 'EM_USO');
                                    if (loan) alert('Militar já possui EPI em cautela. É necessário devolver antes de emprestar novamente.');
                                    else { setShowEPILoanModal(true); setEditingBombeiro(b); }
                                  }} className="ctrl-btn text-emerald-600 bg-emerald-50" title="Emprestar EPI"><Truck size={16} /></button>
                                  
                                  {currentUser?.nivel === 'ADMIN' && (
                                    <>
                                      <button onClick={() => setEditingBombeiro(b)} className="ctrl-btn text-blue-600 bg-blue-50" title="Editar Militar"><Edit size={16} /></button>
                                      <button onClick={() => deleteBombeiro(b.id)} className="ctrl-btn text-red-600 bg-red-50" title="Excluir Militar"><Trash2 size={16} /></button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

              {epiSubView === 'CADASTRO' && currentUser?.nivel === 'ADMIN' && (
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 w-full transition-all">
                  <button 
                    type="button" 
                    onClick={() => setIsEpiCadastroOpen(!isEpiCadastroOpen)}
                    className="w-full flex justify-between items-center outline-none"
                  >
                   <h3 className="font-black text-xs uppercase tracking-widest text-gray-900 flex items-center gap-2">
                     <Shield size={20} className="text-red-600" /> Cadastrar Novo EPI
                   </h3>
                   {isEpiCadastroOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </button>
                  <AnimatePresence>
                    {isEpiCadastroOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                   <form onSubmit={e => e.preventDefault()} className="space-y-6 mt-8 max-w-2xl mx-auto">
                        <div className="col-span-2">
                          <label className="modal-label mb-3 border-b pb-2 border-gray-100">Selecionar Categoria do EPI</label>
                          <div className="flex gap-4">
                             <button
                               onClick={() => setEditingMaterial({...(editingMaterial || {}), categoria: 'EPI_PRETO'})}
                               className={cn("flex-1 py-4 border-2 rounded-2xl font-black uppercase text-xs transition-all", editingMaterial?.categoria === 'EPI_PRETO' ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-500 hover:border-gray-400")}
                             >
                               EPI Preto
                             </button>
                             <button
                               onClick={() => setEditingMaterial({...(editingMaterial || {}), categoria: 'EPI_AMARELO'})}
                               className={cn("flex-1 py-4 border-2 rounded-2xl font-black uppercase text-xs transition-all", editingMaterial?.categoria === 'EPI_AMARELO' ? "border-yellow-500 bg-yellow-500 text-yellow-950 shadow-lg shadow-yellow-500/30" : "border-gray-200 text-gray-500 hover:border-yellow-400")}
                             >
                               EPI Amarelo
                             </button>
                          </div>
                        </div>
                        <div className="col-span-2 mt-4">
                          <label htmlFor="epi-item" className="modal-label">Componente do Conjunto</label>
                          <select id="epi-item" name="epi-item" required className="modal-input" value={editingMaterial?.item_epi || ''} onChange={e => setEditingMaterial({...(editingMaterial || {}), item_epi: e.target.value})}>
                             <option value="">Selecione...</option>
                             {EPI_COMPONENTS.map(item => <option key={item} value={item}>{item}</option>)}
                          </select>
                        </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="epi-num" className="modal-label">Nº de Controle EPI (001 a 999)</label>
                          <input 
                            id="epi-num"
                            name="epi-num"
                            required 
                            className="modal-input" 
                            maxLength={3}
                            placeholder="Ex: 001"
                            value={editingMaterial?.epi_numero || ''} 
                            onChange={e => {
                              const val = e.target.value.replace(/\D/g, '');
                              if (val.length <= 3) setEditingMaterial({...(editingMaterial || {}), epi_numero: val});
                            }}
                          />
                        </div>
                        <div>
                          <label htmlFor="epi-tamanho" className="modal-label">Tamanho / Número</label>
                          <input 
                            id="epi-tamanho" 
                            name="epi-tamanho" 
                            required
                            className="modal-input" 
                            value={editingMaterial?.tamanho || ''} 
                            onChange={e => setEditingMaterial({...(editingMaterial || {}), tamanho: e.target.value.toUpperCase()})} 
                            placeholder="Ex: LG, 42" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="epi-validade" className="modal-label">Data de Validade</label>
                          <input 
                            id="epi-validade" 
                            name="epi-validade" 
                            type="date"
                            required
                            className="modal-input" 
                            value={editingMaterial?.validade_epi ? new Date(editingMaterial.validade_epi).toISOString().split('T')[0] : ''} 
                            onChange={e => setEditingMaterial({...(editingMaterial || {}), validade_epi: e.target.value})} 
                          />
                        </div>
                        <div>
                          <label htmlFor="epi-aviso-validade" className="modal-label">Aviso Validade (Antes)</label>
                          <select 
                            id="epi-aviso-validade" 
                            className="modal-input" 
                            value={editingMaterial?.epi_aviso_validade || ''} 
                            onChange={e => setEditingMaterial({...(editingMaterial || {}), epi_aviso_validade: e.target.value})}
                          >
                            <option value="">Sem aviso</option>
                            <option value="15">15 dias</option>
                            <option value="30">1 mês</option>
                            <option value="60">2 meses</option>
                            <option value="90">3 meses</option>
                            <option value="180">6 meses</option>
                            <option value="365">1 ano</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="epi-status" className="modal-label">Situação Inicial</label>
                          <select id="epi-status" name="epi-status" required className="modal-input" value={editingMaterial?.situacao || ''} onChange={e => setEditingMaterial({...(editingMaterial || {}), situacao: e.target.value})}>
                             <option value="">Selecione...</option>
                             {SITUACOES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="epi-setor" className="modal-label">Setor de Guarda</label>
                          <select id="epi-setor" name="epi-setor" required className="modal-input" value={editingMaterial?.setor || ''} onChange={e => setEditingMaterial({...(editingMaterial || {}), setor: e.target.value})}>
                             <option value="">Selecione...</option>
                             {sectores.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col justify-end pb-1">
                          <label className="modal-label mb-3">Item Fora de Carga?</label>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={editingMaterial?.fora_de_carga === true || editingMaterial?.fora_de_carga === 'SIM'} 
                              onChange={e => setEditingMaterial({...(editingMaterial || {} as any), fora_de_carga: e.target.checked ? 'SIM' : 'NÃO'})} 
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                            <span className="ml-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                              {editingMaterial?.fora_de_carga === 'SIM' ? 'SIM' : 'NÃO'}
                            </span>
                          </label>
                        </div>
                        <div>
                          <label htmlFor="epi-bmp" className="modal-label">
                            Número BMP {editingMaterial?.fora_de_carga === 'NÃO' ? '(Obrigatório)' : '(Opcional)'}
                          </label>
                          <input 
                            id="epi-bmp"
                            name="epi-bmp"
                            required={editingMaterial?.fora_de_carga === 'NÃO'}
                            className="modal-input" 
                            value={editingMaterial?.bmp || ''} 
                            onChange={e => setEditingMaterial({...(editingMaterial || {}), bmp: e.target.value})} 
                            placeholder={editingMaterial?.fora_de_carga === 'NÃO' ? "Obrigatório" : "Ex: 501234"} 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="epi-doc" className="modal-label">Documento /SP</label>
                          <input 
                            id="epi-doc"
                            name="epi-doc"
                            className="modal-input" 
                            value={editingMaterial?.documento || ''} 
                            onChange={e => setEditingMaterial({...(editingMaterial || {}), documento: e.target.value})} 
                            placeholder="Ex: SP 1234" 
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="epi-desc" className="modal-label">Descrição</label>
                        <textarea 
                          id="epi-desc"
                          name="epi-desc"
                          rows={2}
                          className="modal-input resize-none" 
                          value={editingMaterial?.descricao || ''} 
                          onChange={e => setEditingMaterial({...(editingMaterial || {}), descricao: e.target.value})} 
                          placeholder="Descrição detalhada do EPI..." 
                        />
                      </div>

                      <div>
                        <label htmlFor="epi-obs" className="modal-label">Observações</label>
                        <textarea 
                          id="epi-obs"
                          name="epi-obs"
                          rows={2}
                          className="modal-input resize-none" 
                          value={editingMaterial?.observacoes || ''} 
                          onChange={e => setEditingMaterial({...(editingMaterial || {}), observacoes: e.target.value})} 
                          placeholder="Detalhes adicionais..." 
                        />
                      </div>

                      <button 
                         type="button"
                         onClick={async () => {
                           if (!editingMaterial?.categoria || !editingMaterial?.item_epi || !editingMaterial?.epi_numero || !editingMaterial?.tamanho || !editingMaterial?.validade_epi || !editingMaterial?.situacao || !editingMaterial?.setor) {
                             return alert('Preencha todos os campos do EPI.');
                           }
                           if (editingMaterial?.fora_de_carga === 'NÃO' && !editingMaterial?.bmp) {
                             return alert('O número BMP é obrigatório quando o EPI está em carga.');
                           }
                           setLoading(true);
                           try {
                             const action = editingMaterial.id ? 'update_material' : 'create_material';
                             const copy: any = { 
                               ...editingMaterial, 
                               bmp: editingMaterial.bmp || '',
                               descricao: `${editingMaterial.item_epi} - ${editingMaterial.categoria.replace('_', ' ')} Nº ${editingMaterial.epi_numero}`,
                             };
                             const response = await authenticatedFetch(SCRIPT_URL, {
                               method: 'POST',
                               headers: { 'Content-Type': 'text/plain' },
                               body: JSON.stringify({ ...copy, action, executor: currentUser?.login })
                             });
                             const resData = await response.json();
                             if (!resData.success) {
                               alert(resData.message || 'Erro ao salvar EPI');
                               return;
                             }
                             executeFilter();
                             setEditingMaterial(null);
                             alert('EPI Salvo com Sucesso!');
                           } catch (err) {
                             alert('Erro ao salvar EPI');
                           } finally {
                             setLoading(false);
                           }
                         }}
                         disabled={loading} 
                         className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all shadow-xl flex items-center justify-center gap-2"
                      >
                        {loading ? <RefreshCw className="animate-spin" size={16} /> : (editingMaterial?.id ? 'Atualizar EPI' : 'Adicionar EPI ao Sistema')}
                      </button>
                      
                      {editingMaterial?.id && (
                        <button type="button" onClick={() => setEditingMaterial(null)} className="w-full text-gray-500 py-3 uppercase font-black text-[10px] tracking-widest">
                          Cancelar Edição
                        </button>
                      )}
                   </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {epiSubView === 'CADASTRO' && currentUser?.nivel === 'ADMIN' && (
                <div className="mt-12 space-y-6">
                  {/* Filtros da Lista de EPIs */}
                  <div className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 w-full">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Cor</label>
                      <select className="modal-input bg-gray-50 border-transparent focus:bg-white" value={epiListFilterColor} onChange={e => setEpiListFilterColor(e.target.value)}>
                        <option value="">Todas</option>
                        <option value="EPI_PRETO">Preto</option>
                        <option value="EPI_AMARELO">Amarelo</option>
                      </select>
                    </div>
                    <div className="flex-1 w-full">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Tipo de Peça</label>
                      <select className="modal-input bg-gray-50 border-transparent focus:bg-white" value={epiListFilterType} onChange={e => { setEpiListFilterType(e.target.value); setEpiListFilterSize(''); }}>
                        <option value="">Todos</option>
                        {EPI_COMPONENTS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="flex-1 w-full">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Tamanho</label>
                      <select className="modal-input bg-gray-50 border-transparent focus:bg-white" value={epiListFilterSize} onChange={e => setEpiListFilterSize(e.target.value)}>
                        <option value="">Todos</option>
                        {Array.from(new Set(materiais.filter(m => {
                          const catStr = String(m.categoria || '').toUpperCase().trim();
                          const itemStr = String(m.item_epi || m.descricao || '').toUpperCase().trim();
                          return (catStr === 'EPI_PRETO' || catStr === 'EPI_AMARELO') && (!epiListFilterType || itemStr === epiListFilterType) && m.tamanho;
                        }).map(m => m.tamanho))).sort().map(s => (
                          <option key={String(s)} value={String(s)}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 w-full">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Situação</label>
                      <select className="modal-input bg-gray-50 border-transparent focus:bg-white" value={epiListFilterStatus} onChange={e => setEpiListFilterStatus(e.target.value)}>
                        <option value="">Todas</option>
                        <option value="PERFEITO">Perfeito</option>
                        <option value="REGULAR">Regular</option>
                        <option value="INSERVÍVEL">Inservível</option>
                      </select>
                    </div>
                    <button 
                      onClick={() => { setEpiListFilterColor(''); setEpiListFilterType(''); setEpiListFilterSize(''); setEpiListFilterStatus(''); }}
                      className="mt-6 md:mt-4 p-3 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors" title="Limpar Filtros"
                    ><FilterX size={16} /></button>
                  </div>

                  {/* Estatísticas (se Tipo estiver selecionado) */}
                  {epiListFilterType && (() => {
                    const episOfThisType = materiais.filter(m => {
                      const catStr = String(m.categoria || '').toUpperCase().trim();
                      const itemStr = String(m.item_epi || m.descricao || '').toUpperCase().trim();
                      return (catStr === 'EPI_PRETO' || catStr === 'EPI_AMARELO') && 
                      itemStr === epiListFilterType &&
                      (!epiListFilterColor || catStr === epiListFilterColor);
                    });
                    const totalOfThisType = episOfThisType.length;
                    
                    const inUseLoans = epiLoans.filter(l => String(l.status).trim().toUpperCase() === 'EM_USO');
                    let inUseBySize: Record<string, number> = {};
                    let totalBySize: Record<string, number> = {};

                    episOfThisType.forEach(m => {
                      const sz = m.tamanho || 'N/D';
                      totalBySize[sz] = (totalBySize[sz] || 0) + 1;
                      
                      const isEmUso = inUseLoans.some(l => {
                        try {
                          return JSON.parse(l.pecas_json).some((p: any) => String(p.number).trim().padStart(3, '0') === String(m.epi_numero || m.bmp || '').trim().padStart(3, '0') && String(p.type).trim().toUpperCase() === String(m.item_epi || '').trim().toUpperCase());
                        } catch(e) { return false; }
                      });
                      if (isEmUso) {
                        inUseBySize[sz] = (inUseBySize[sz] || 0) + 1;
                      }
                    });

                    return (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {Object.keys(totalBySize).sort().map(sz => {
                          const inUse = inUseBySize[sz] || 0;
                          const total = totalBySize[sz];
                          const perc = total > 0 ? Math.round((inUse / total) * 100) : 0;
                          return (
                            <div key={sz} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-1 items-center justify-center relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-2 opacity-10">
                                <PieChart size={40} />
                              </div>
                              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{epiListFilterType} TAM {sz}</span>
                              <span className="text-2xl font-black text-gray-900">{inUse} <span className="text-sm text-gray-400 font-normal">/ {total}</span></span>
                              <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded flex items-center gap-1">
                                <TrendingUp size={10} /> {perc}% em uso
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                      <h3 className="font-black text-xs uppercase tracking-widest text-gray-500">
                        EPIs Cadastrados no Sistema ({materiais.filter(m => {
                          const cat = String(m.categoria || '').toUpperCase().trim();
                          if (cat !== 'EPI_PRETO' && cat !== 'EPI_AMARELO') return false;
                          if (epiListFilterColor && cat !== epiListFilterColor) return false;
                          if (epiListFilterType && String(m.item_epi || m.descricao || '').toUpperCase().trim() !== epiListFilterType) return false;
                          if (epiListFilterSize && String(m.tamanho) !== String(epiListFilterSize)) return false;
                          if (epiListFilterStatus && String(m.situacao || '').toUpperCase().trim() !== epiListFilterStatus) return false;
                          return true;
                        }).length})
                      </h3>
                    </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50/50">
                        <tr className="text-left">
                          <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Componente</th>
                          <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Nº / BMP</th>
                          <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Tamanho</th>
                          <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Validade</th>
                          <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Situação</th>
                          <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {materiais.filter(m => {
                          const cat = String(m.categoria || '').toUpperCase().trim();
                          if (cat !== 'EPI_PRETO' && cat !== 'EPI_AMARELO') return false;
                          if (epiListFilterColor && cat !== epiListFilterColor) return false;
                          if (epiListFilterType && String(m.item_epi || m.descricao || '').toUpperCase().trim() !== epiListFilterType) return false;
                          if (epiListFilterSize && String(m.tamanho) !== String(epiListFilterSize)) return false;
                          if (epiListFilterStatus && String(m.situacao || '').toUpperCase().trim() !== epiListFilterStatus) return false;
                          return true;
                        }).map(m => (
                          <tr 
                            key={m.id} 
                            className="group hover:bg-gray-50 transition-colors"
                            title={[
                              m.documento ? `Documento: ${m.documento}` : '',
                              m.observacoes ? `Observações: ${m.observacoes}` : ''
                            ].filter(Boolean).join('\n') || undefined}
                          >
                            <td className="p-6">
                              <div className="flex items-center gap-2">
                                <div className={cn("w-2 h-2 rounded-full", m.categoria === 'EPI_PRETO' ? "bg-black" : "bg-yellow-400")} />
                                <div className="flex flex-col">
                                  <span className="font-black text-gray-900 uppercase italic tracking-tighter">{m.item_epi}</span>
                                  {m.descricao && <span className="text-[10px] text-gray-400 normal-case italic leading-tight">{m.descricao}</span>}
                                </div>
                              </div>
                            </td>
                            <td className="p-6">
                              <div className="flex flex-col">
                                <span className="text-xs font-black">Nº {m.epi_numero}</span>
                                {m.bmp && <span className="text-[10px] text-gray-400">BMP: {m.bmp}</span>}
                              </div>
                            </td>
                            <td className="p-6 text-xs font-bold text-gray-600 uppercase">{m.tamanho}</td>
                            <td className="p-6">
                              <span className={cn(
                                "text-[10px] font-black uppercase px-2 py-1 rounded-lg",
                                m.validade_epi && new Date(m.validade_epi) < new Date() ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                              )}>
                                {m.validade_epi ? new Date(m.validade_epi).toLocaleDateString('pt-BR') : 'Sem Data'}
                              </span>
                            </td>
                            <td className="p-6">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase text-gray-500">{m.situacao}</span>
                                {(() => {
                                  const loan = epiLoans.find(l => 
                                    String(l.status).trim().toUpperCase() === 'EM_USO' && 
                                    (() => {
                                      try {
                                        return JSON.parse(l.pecas_json).some((p: any) => 
                                          String(p.number).trim().padStart(3, '0') === String(m.epi_numero || m.bmp || '').trim().padStart(3, '0') && 
                                          String(p.type).trim().toUpperCase() === String(m.item_epi || '').trim().toUpperCase()
                                        );
                                      } catch(e) { return false; }
                                    })()
                                  );
                                  if (loan) {
                                    const bombeiro = bombeiros.find(b => String(b.id) === String(loan.bombeiro_id));
                                    return (
                                      <span className="text-[9px] font-bold text-red-600 mt-1 uppercase">
                                        {bombeiro ? bombeiro.nome_guerra : `ID ${loan.bombeiro_id}`}
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </td>
                            <td className="p-6">
                               <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => {
                                    setEditingMaterial(m);
                                    setIsEpiCadastroOpen(true);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }} className="ctrl-btn text-blue-600 bg-blue-50"><Edit size={16} /></button>
                                  <button onClick={() => deleteMaterial(m)} className="ctrl-btn text-red-600 bg-red-50"><Trash2 size={16} /></button>
                               </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                 </div>
                </div>
              )}
            </motion.div>
          )}

          {view === 'EPR' && (
            <motion.div key="epr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                <div>
                  <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter leading-none uppercase italic">Controle de EPRs</h2>
                  <p className="text-gray-400 uppercase text-[9px] md:text-[10px] font-bold tracking-[0.2em] mt-2">Gestão e Cadastro de Equipamentos de Proteção Respiratória</p>
                </div>
              </div>

              <div className="flex bg-gray-100 p-2 rounded-[20px] mb-8 w-max gap-2">
                 <button
                   onClick={() => setEprSubView('LISTA')}
                   className={cn("px-6 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all", eprSubView === 'LISTA' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:bg-gray-200")}
                 >
                   <Shield size={16} className="inline-block mr-2 -mt-1" />
                   Lista de EPRs
                 </button>
                 {currentUser?.nivel === 'ADMIN' && (
                   <button
                     onClick={() => {
                        setEprSubView('CADASTRO');
                        setEditingMaterial({ responsavel: currentUser?.nome } as any);
                     }}
                     className={cn("px-6 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all", eprSubView === 'CADASTRO' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:bg-gray-200")}
                   >
                     <Settings size={16} className="inline-block mr-2 -mt-1" />
                     Cadastro de EPR
                   </button>
                 )}
              </div>

              {eprSubView === 'LISTA' && eprWarnings.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-[20px] p-6 mb-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                     <AlertCircle className="text-orange-500" size={24} />
                     <h3 className="font-black text-orange-700 tracking-tight text-lg">Avisos de Manutenção EPR</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {eprWarnings.map((w, i) => (
                        <div key={i} className="bg-white/80 p-4 rounded-xl border border-orange-100 flex flex-col gap-1">
                           <div className="flex justify-between items-center">
                             <span className="font-black text-xs text-orange-800">BMP: {w.bmp}</span>
                             <span className={cn("text-[9px] px-2 py-0.5 rounded-full font-bold uppercase", w.days <= 0 ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600")}>
                               {w.days < 0 ? `Atrasado ${Math.abs(w.days)} d` : w.days === 0 ? "Vence hoje" : `Em ${w.days} d`}
                             </span>
                           </div>
                           <span className="text-[11px] text-gray-600 font-medium">{w.msg}</span>
                           <button onClick={() => {
                              const m = materiais.find(mat => mat.id === w.id);
                              if (m) {
                                setEditingMaterial(m);
                                setEprSubView('CADASTRO');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }
                           }} className="text-blue-600 text-[10px] font-bold mt-2 self-start hover:underline">Ver Cadastro</button>
                        </div>
                     ))}
                  </div>
                </div>
              )}

              {eprSubView === 'LISTA' && (
                <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h3 className="font-black text-xs uppercase tracking-widest text-gray-500">
                      EPRs Cadastrados ({materiais.filter(m => m.categoria === 'PERMANENTE' && (m.classificacao?.toUpperCase() === 'EPR' || (m as any)['classificação']?.toUpperCase() === 'EPR' || (m as any)['Classificação']?.toUpperCase() === 'EPR' || m.descricao === 'EPR' || !!m.epr_fabricante || !!m.epr_validade_cilindro) && (!eprListFilterStatus || m.situacao === eprListFilterStatus) && (!eprListFilterSector || m.setor === eprListFilterSector)).length})
                    </h3>
                    <div className="flex gap-2 w-full md:w-auto">
                      <select className="modal-input bg-gray-50 border-transparent focus:bg-white text-xs w-full md:w-48" value={eprListFilterStatus} onChange={e => setEprListFilterStatus(e.target.value)}>
                        <option value="">Todas as Situações</option>
                        {SITUACOES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <select className="modal-input bg-gray-50 border-transparent focus:bg-white text-xs w-full md:w-48" value={eprListFilterSector} onChange={e => setEprListFilterSector(e.target.value)}>
                        <option value="">Todos os Locais</option>
                        {sectores.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50/50">
                        <tr className="text-left">
                          <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Nº Controle/BMP</th>
                          <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Descrição</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {materiais.filter(m => m.categoria === 'PERMANENTE' && (m.classificacao?.toUpperCase() === 'EPR' || (m as any)['classificação']?.toUpperCase() === 'EPR' || (m as any)['Classificação']?.toUpperCase() === 'EPR' || m.descricao === 'EPR' || !!m.epr_fabricante || !!m.epr_validade_cilindro) && (!eprListFilterStatus || m.situacao === eprListFilterStatus) && (!eprListFilterSector || m.setor === eprListFilterSector)).map(m => (
                          <React.Fragment key={m.id}>
                            <tr 
                              className="hover:bg-gray-50/50 transition-colors"
                              title={[
                                m.documento ? `Documento: ${m.documento}` : '',
                                m.observacoes ? `Observações: ${m.observacoes}` : ''
                              ].filter(Boolean).join('\n') || undefined}
                            >
                              <td className="p-6 text-xs font-black text-gray-900">{m.bmp || m.epi_numero || '-'}</td>
                              <td className="p-6 text-xs text-gray-900">{m.descricao || '-'}</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td colSpan={2} className="p-6 border-t border-gray-100">
                                <div className="flex flex-col gap-4 md:gap-0 md:flex-row md:items-center md:justify-between">
                                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-[11px] text-gray-600">
                                    <div>
                                      <span className="font-black uppercase tracking-widest">Fabricante</span>
                                      <div className="mt-1 text-gray-900">{m.epr_fabricante || '-'}</div>
                                    </div>
                                    <div>
                                      <span className="font-black uppercase tracking-widest">Modelo</span>
                                      <div className="mt-1 text-gray-900">{m.epr_modelo || '-'}</div>
                                    </div>
                                    <div>
                                      <span className="font-black uppercase tracking-widest">Validade</span>
                                      <div className="mt-1 text-gray-900">{m.epr_validade_cilindro ? new Date(m.epr_validade_cilindro).toLocaleDateString() : '-'}</div>
                                    </div>
                                    <div>
                                      <span className="font-black uppercase tracking-widest">Teste Hidrostático</span>
                                      <div className="mt-1 text-gray-900">{m.epr_teste_hidrostatico ? new Date(m.epr_teste_hidrostatico).toLocaleDateString() : '-'}{m.epr_proximo_teste_anos ? ` · ${m.epr_proximo_teste_anos} anos` : ''}</div>
                                    </div>
                                    <div>
                                      <span className="font-black uppercase tracking-widest">Recargas</span>
                                      <div className="mt-1 text-gray-900">{m.epr_recargas_count || 0} feitas{m.epr_recargas_limite ? ` · Lim: ${m.epr_recargas_limite}` : ''}</div>
                                    </div>
                                    <div>
                                      <span className="font-black uppercase tracking-widest">Localização</span>
                                      <div className="mt-1 text-gray-900">{m.setor || '-'}</div>
                                    </div>
                                    <div>
                                      <span className="font-black uppercase tracking-widest">Situação</span>
                                      <div className="mt-1 inline-flex items-center gap-2 text-gray-900">
                                        <span className={cn("px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest", m.situacao === 'PERFEITO' ? 'bg-emerald-50 text-emerald-600' : m.situacao === 'EMPRESTADO' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600')}>
                                          {m.situacao}
                                        </span>
                                        {m.situacao === 'EMPRESTADO' && (() => {
                                          const activeLoan = loans.find(l => {
                                            try {
                                              const mats = JSON.parse(l.materiais_json || '[]');
                                              return l.status === 'EMPRESTADO' && mats.some((item: any) => 
                                                String(typeof item === 'object' ? item.id : item) === String(m.id)
                                              );
                                            } catch(e) { return false; }
                                          });
                                          if (activeLoan) {
                                            return (
                                              <span className="text-[9px] font-black uppercase tracking-wider text-amber-700">
                                                {activeLoan.solicitante.split(' ')[0]}{(activeLoan as any).solicitante_setor ? ` - ${(activeLoan as any).solicitante_setor}` : ''}
                                              </span>
                                            );
                                          }
                                          return null;
                                        })()}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 justify-start md:justify-end">
                                    <button onClick={() => { 
                                      setEprToRecarga(m); 
                                      setEprRecargaDate(new Date().toISOString().split('T')[0]);
                                      setEprProximaRecargaDate(m.epr_proxima_recarga ? new Date(m.epr_proxima_recarga).toISOString().split('T')[0] : '');
                                      setEprAvisoRecarga(m.epr_aviso_recarga || '');
                                      setShowEprRecargaModal(true); 
                                    }} className="ctrl-btn text-indigo-600 bg-indigo-50 px-3 flex items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all font-sans whitespace-nowrap">Recarregar</button>
                                    {currentUser?.nivel === 'ADMIN' && (
                                      <>
                                        <button onClick={() => {
                                          setEditingMaterial(m);
                                          setEprSubView('CADASTRO');
                                          window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }} className="ctrl-btn text-blue-600 bg-blue-50"><Edit size={16} /></button>
                                        <button onClick={() => deleteMaterial(m)} className="ctrl-btn text-red-600 bg-red-50"><Trash2 size={16} /></button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {eprSubView === 'CADASTRO' && currentUser?.nivel === 'ADMIN' && (
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 max-w-4xl mx-auto">
                   <h3 className="font-black text-xs uppercase tracking-widest text-gray-900 mb-6 flex items-center gap-2">
                     <Shield size={20} className="text-red-600" /> {editingMaterial?.id ? 'Editar EPR' : 'Cadastrar Novo EPR'}
                   </h3>
                   <form onSubmit={e => {
                      const matToSave = {
                        ...(editingMaterial || {}),
                        categoria: 'PERMANENTE',
                        classificacao: 'EPR',
                        responsavel: editingMaterial?.responsavel || currentUser?.nome || ''
                      } as any;
                      saveMaterial(e, matToSave);
                   }} className="space-y-6">
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         <div>
                           <label htmlFor="epr-bmp" className="modal-label">Nº Controle / BMP {editingMaterial?.fora_de_carga === 'SIM' ? '(Opcional)' : '(Obrigatório)'}</label>
                           <input id="epr-bmp" className="modal-input" required={editingMaterial?.fora_de_carga !== 'SIM'} value={editingMaterial?.bmp || ''} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), bmp: e.target.value})} placeholder={editingMaterial?.fora_de_carga === 'SIM' ? "Opcional p/ fora de carga" : "Número do equipamento..."} />
                         </div>
                         <div>
                           <label htmlFor="epr-desc" className="modal-label">Descrição</label>
                           <input id="epr-desc" className="modal-input" required value={editingMaterial?.descricao || ''} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), descricao: e.target.value})} placeholder="Ex: CONJUNTO EPR COMPLETO" />
                         </div>
                         <div>
                           <label htmlFor="epr-setor" className="modal-label">Setor</label>
                           <select id="epr-setor" required className="modal-input" value={editingMaterial?.setor || ''} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), setor: e.target.value})}>
                             <option value="">Selecione...</option>
                             {sectores.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                           </select>
                         </div>
                         <div>
                           <label htmlFor="epr-situacao" className="modal-label">Situação</label>
                           <select id="epr-situacao" required className="modal-input" value={editingMaterial?.situacao || ''} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), situacao: e.target.value})}>
                             <option value="">Selecione...</option>
                             {SITUACOES.map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                         </div>
                         <div className="flex flex-col justify-end pb-1">
                           <label className="modal-label mb-3">Item Fora de Carga?</label>
                           <label className="relative inline-flex items-center cursor-pointer">
                             <input type="checkbox" className="sr-only peer" checked={editingMaterial?.fora_de_carga === true || editingMaterial?.fora_de_carga === 'SIM'} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), fora_de_carga: e.target.checked ? 'SIM' : 'NÃO'})} />
                             <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                             <span className="ml-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                               {editingMaterial?.fora_de_carga === 'SIM' ? 'SIM' : 'NÃO'}
                             </span>
                           </label>
                         </div>
                         <div>
                           <label htmlFor="epr-fabricante" className="modal-label">Fabricante</label>
                           <input id="epr-fabricante" className="modal-input" value={editingMaterial?.epr_fabricante || ''} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), epr_fabricante: e.target.value})} placeholder="Fabricante..." />
                         </div>
                         <div>
                           <label htmlFor="epr-modelo" className="modal-label">Modelo</label>
                           <input id="epr-modelo" className="modal-input" value={editingMaterial?.epr_modelo || ''} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), epr_modelo: e.target.value})} placeholder="Modelo..." />
                         </div>
                         <div className="flex flex-col gap-4 col-span-1 border border-gray-100 rounded-3xl p-4 bg-gray-50/30">
                          <label htmlFor="epr-validade-cil" className="modal-label">Validade do Cilindro</label>
                          <input id="epr-validade-cil" type="date" className="modal-input" required value={editingMaterial?.epr_validade_cilindro ? new Date(editingMaterial.epr_validade_cilindro).toISOString().split('T')[0] : ''} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), epr_validade_cilindro: e.target.value})} />
                          
                          <label htmlFor="epr-aviso-cil" className="modal-label">Aviso Validade (Antes)</label>
                          <select id="epr-aviso-cil" className="modal-input" value={editingMaterial?.epr_aviso_validade_cilindro || ''} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), epr_aviso_validade_cilindro: e.target.value})}>
                            <option value="">Sem aviso</option>
                            <option value="15">15 dias</option>
                            <option value="30">1 mês</option>
                            <option value="60">2 meses</option>
                            <option value="90">3 meses</option>
                            <option value="180">6 meses</option>
                            <option value="365">1 ano</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="epr-data-ent" className="modal-label">Mês/Ano de Entrada</label>
                          <input id="epr-data-ent" type="date" required className="modal-input" value={editingMaterial?.data_entrada ? new Date(editingMaterial.data_entrada).toISOString().split('T')[0] : ''} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), data_entrada: e.target.value})} />
                        </div>
                        <div className="flex flex-col gap-4 col-span-1 border border-gray-100 rounded-3xl p-4 bg-gray-50/30">
                          <label htmlFor="epr-recarga" className="modal-label">Data da Última Recarga</label>
                          <input id="epr-recarga" type="date" className="modal-input" value={editingMaterial?.epr_ultima_recarga ? new Date(editingMaterial.epr_ultima_recarga).toISOString().split('T')[0] : ''} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), epr_ultima_recarga: e.target.value})} />
                          
                          <label htmlFor="epr-proxima-recarga" className="modal-label">Data da Próx. Recarga</label>
                          <input id="epr-proxima-recarga" type="date" className="modal-input" value={editingMaterial?.epr_proxima_recarga ? new Date(editingMaterial.epr_proxima_recarga).toISOString().split('T')[0] : ''} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), epr_proxima_recarga: e.target.value})} />
                          
                          <label htmlFor="epr-aviso-recarga" className="modal-label">Aviso Recarga (Antes)</label>
                          <select id="epr-aviso-recarga" className="modal-input" value={editingMaterial?.epr_aviso_recarga || ''} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), epr_aviso_recarga: e.target.value})}>
                            <option value="">Sem aviso</option>
                            <option value="15">15 dias</option>
                            <option value="30">1 mês</option>
                            <option value="60">2 meses</option>
                            <option value="90">3 meses</option>
                            <option value="180">6 meses</option>
                            <option value="365">1 ano</option>
                          </select>
                          
                          <label htmlFor="epr-recargas-limite" className="modal-label mt-2">Limite de Recargas</label>
                          <input id="epr-recargas-limite" type="number" min="0" className="modal-input" value={editingMaterial?.epr_recargas_limite || ''} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), epr_recargas_limite: e.target.value})} placeholder="Ilimitado" />
                        </div>
                        <div className="flex flex-col gap-4 col-span-1 border border-gray-100 rounded-3xl p-4 bg-gray-50/30">
                          <label htmlFor="epr-teste-hid" className="modal-label">Teste Hidrostático</label>
                          <input id="epr-teste-hid" type="date" className="modal-input" required value={editingMaterial?.epr_teste_hidrostatico ? new Date(editingMaterial.epr_teste_hidrostatico).toISOString().split('T')[0] : ''} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), epr_teste_hidrostatico: e.target.value})} />
                          
                          <label htmlFor="epr-aviso-teste" className="modal-label">Aviso Teste (Antes)</label>
                          <select id="epr-aviso-teste" className="modal-input" value={editingMaterial?.epr_aviso_teste || ''} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), epr_aviso_teste: e.target.value})}>
                            <option value="">Sem aviso</option>
                            <option value="15">15 dias</option>
                            <option value="30">1 mês</option>
                            <option value="60">2 meses</option>
                            <option value="90">3 meses</option>
                            <option value="180">6 meses</option>
                            <option value="365">1 ano</option>
                          </select>
                        </div>
                       </div>
                       
                       <div className="bg-gray-50 border border-gray-100 rounded-3xl p-6">
                          <label className="modal-label mb-4 block">Frequência do Próximo Teste Hidrostático</label>
                          <div className="flex gap-4 max-w-sm">
                             <button
                               type="button"
                               onClick={() => setEditingMaterial({...(editingMaterial || {} as any), epr_proximo_teste_anos: 5})}
                               className={cn("flex-1 py-4 border-2 rounded-2xl font-black tracking-widest uppercase transition-all", editingMaterial?.epr_proximo_teste_anos === 5 ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-500 hover:border-gray-400 bg-white")}
                             >
                               5 Anos
                             </button>
                             <button
                               type="button"
                               onClick={() => setEditingMaterial({...(editingMaterial || {} as any), epr_proximo_teste_anos: 10})}
                               className={cn("flex-1 py-4 border-2 rounded-2xl font-black tracking-widest uppercase transition-all", editingMaterial?.epr_proximo_teste_anos === 10 ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-500 hover:border-gray-400 bg-white")}
                             >
                               10 Anos
                             </button>
                          </div>
                          {!editingMaterial?.epr_proximo_teste_anos && <p className="text-red-500 text-[10px] mt-2 font-bold uppercase tracking-widest pl-2">Por favor, selecione uma opção</p>}
                          
                          {editingMaterial?.epr_teste_hidrostatico && editingMaterial?.epr_proximo_teste_anos && (
                             <div className="mt-4 p-4 bg-blue-50 text-blue-600 rounded-2xl text-[11px] font-bold">
                               Próximo Teste Hidrostático (Calculado): {
                                 (() => {
                                   const testDate = new Date(editingMaterial.epr_teste_hidrostatico);
                                   testDate.setUTCFullYear(testDate.getUTCFullYear() + parseInt(editingMaterial.epr_proximo_teste_anos as any, 10));
                                   return testDate.toLocaleDateString();
                                 })()
                               }
                             </div>
                          )}
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                         <div>
                           <label htmlFor="epr-nf" className="modal-label">Documento/SP</label>
                           <input id="epr-nf" className="modal-input" value={editingMaterial?.documento || ''} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), documento: e.target.value})} placeholder="..." />
                         </div>
                       </div>
                       
                       <div>
                         <label htmlFor="epr-obs" className="modal-label">Observações</label>
                         <textarea id="epr-obs" className="modal-input min-h-[100px] resize-none" value={editingMaterial?.observacoes || ''} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), observacoes: e.target.value})} placeholder="Avarias, detalhes adicionais..."></textarea>
                       </div>
                       
                      <button 
                         type="submit" 
                         disabled={loading || !editingMaterial?.epr_proximo_teste_anos} 
                         className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {loading ? <RefreshCw className="animate-spin" size={16} /> : (editingMaterial?.id ? 'Atualizar EPR' : 'Adicionar EPR')}
                      </button>
                      
                      {editingMaterial?.id && (
                        <button type="button" onClick={() => { setEditingMaterial(null); setEprSubView('LISTA'); }} className="w-full text-gray-500 py-3 uppercase font-black text-[10px] tracking-widest">
                          Cancelar Edição
                        </button>
                      )}
                   </form>
                </div>
              )}
            </motion.div>
          )}

          {view === 'AGENTES' && (
             <AgentesManagementView 
               materiais={materiais}
               rawMateriais={rawMateriais}
               currentUser={currentUser}
               loading={loading}
               saveMaterial={saveMaterial}
               deleteMaterial={deleteMaterial}
               viewTab={agentesSubView}
               setViewTab={setAgentesSubView}
               sectores={sectores}
               warnings={agentesWarnings}
             />
          )}

          {view === 'INVENTORY' && (
            <motion.div key="inv" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
                <div>
                  <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter leading-none uppercase">CONFERÊNCIA DE INVENTÁRIO</h2>
                  <p className="text-gray-400 uppercase text-[9px] md:text-[10px] font-bold tracking-[0.2em] mt-2">Checklist de Verificação Física de Carga</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                   <button 
                     onClick={() => setIsScannerOpen(true)}
                     className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg active:scale-95"
                   >
                     <Camera size={18} />
                     Escaneamento QR
                   </button>
                   <button 
                     onClick={() => {
                       if (!inventoryState.sector) return alert('Selecione um setor primeiro');
                       const sectorItems = materiais.filter(m => m.setor === inventoryState.sector);
                       if (sectorItems.length === 0) return alert('Nenhum item encontrado neste setor');
                       setShowLabelConfig(true);
                     }}
                     className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95"
                   >
                     <Printer size={18} />
                     Gerar Etiquetas
                   </button>
                </div>
              </div>

              {isScannerOpen && (
                <InventoryScanner 
                  onClose={() => setIsScannerOpen(false)}
                  onScan={(bmp) => {
                    const cleanBmp = bmp.trim().toUpperCase();
                    const material = rawMateriais.find(m => String(m.bmp || m.id).toUpperCase() === cleanBmp);
                    
                    if (material) {
                      const totalQty = getMaterialQty(material);
                      const currentFound = inventoryState.foundQuantities[material.id] || 0;
                      if (currentFound < totalQty) {
                        // Novo: Checar se o material pertence a este setor
                        if (inventoryState.sector && material.setor !== inventoryState.sector) {
                          if (window.confirm(`ATENÇÃO: O item ${material.bmp} (${material.descricao}) está registrado no setor ${material.setor}.\n\nDeseja realizar a TRANSFERÊNCIA para o setor ${inventoryState.sector} agora?`)) {
                             // Tenta salvar com o novo setor
                             const updatedMaterial = { ...material, setor: inventoryState.sector };
                             
                             // Precisamos garantir que o usuário tenha permissão ou avisar se não tiver
                             if (currentUser?.nivel !== 'ADMIN') {
                               addToast("Apenas administradores podem realizar transferências automáticas.", "error");
                               return;
                             }

                             saveMaterial(null as any, updatedMaterial).then(() => {
                               addToast(`${material.bmp} transferido para ${inventoryState.sector} e registrado.`, 'info');
                                let foundVal = 1;
                                if (totalQty > 1 && material.categoria === 'CONSUMO') {
                                  const input = window.prompt(`Quantas unidades de ${material.descricao} encontrou? (Total: ${totalQty})`, String(totalQty));
                                  if (input !== null) {
                                    const parsed = parseInt(input);
                                    if (!isNaN(parsed)) foundVal = Math.min(parsed, totalQty);
                                  }
                                } else {
                                  foundVal = totalQty;
                                }

                                setInventoryState(prev => ({ 
                                  ...prev, 
                                  foundQuantities: { ...prev.foundQuantities, [material.id]: foundVal } 
                                }));
                             }).catch(err => {
                               console.error("Erro na transferência", err);
                               addToast("Falha ao salvar transferência no banco de dados.", "error");
                             });
                             return;
                          } else {
                             // Usuário negou a transferência, mas talvez queira apenas registrar que encontrou o item aqui?
                             // O pedido diz: "informa que não pertence... pergunta se quer transferir... caso sim altera"
                             // Se não, provavelmente não registra como encontrado no inventário deste setor (pois não é deste setor e não foi transferido)
                             return;
                          }
                        }

                        let foundVal = 1;
                        if (totalQty > 1 && material.categoria === 'CONSUMO') {
                           const input = window.prompt(`Quantas unidades de ${material.descricao} encontrou? (Total: ${totalQty})`, String(totalQty));
                           if (input !== null) {
                             const parsed = parseInt(input);
                             if (!isNaN(parsed)) foundVal = Math.min(parsed, totalQty);
                           } else {
                             return; // Cancelou
                           }
                        } else {
                           foundVal = totalQty;
                        }

                        addToast(`Item encontrado: ${material.bmp} - ${material.descricao} (${foundVal}/${totalQty})`, 'info');
                        setInventoryState(prev => ({ 
                          ...prev, 
                          foundQuantities: { ...prev.foundQuantities, [material.id]: foundVal } 
                        }));
                      } else {
                        addToast(`Item ${material.bmp} já foi registrado`, 'info');
                      }
                    } else {
                      addToast(`BMP ${cleanBmp} não encontrado no sistema`, 'error');
                    }
                  }}
                />
              )}

              {/* Inventory Progress */}
              {inventoryState.sector && (
                <div className="mb-8 p-6 bg-white rounded-[40px] border border-gray-100 shadow-sm">
                   {/* ... rest removed for multi-edit ... */}
                   <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Progresso do Inventário: <span className="text-gray-900">{inventoryState.sector}</span></p>
                      </div>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => {
                            if (window.confirm("Deseja realmente LIMPAR o inventário em andamento? Todo o progresso de itens encontrados e o setor selecionado serão resetados.")) {
                                setInventoryState({ sector: '', foundQuantities: {}, filter: 'ALL', categories: [] });
                              addToast("Inventário reiniciado.", "info");
                            }
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors"
                        >
                          <Trash2 size={16} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Limpar</span>
                        </button>

                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Encontrados</span>
                             <span className="text-xl font-black text-green-600 italic">
                               {materiais
                                 .filter(m => m && m.setor === inventoryState.sector && (inventoryState.categories.length === 0 || inventoryState.categories.includes(m.categoria)))
                                 .reduce((acc, m) => acc + (inventoryState.foundQuantities[m.id] || 0), 0)}
                             </span>
                           </div>
                           <div className="flex items-center gap-2 -mt-1 justify-end">
                             <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Esperado</span>
                             <span className="text-sm font-black text-blue-600">
                               {materiais
                                 .filter(m => m && m.setor === inventoryState.sector && (inventoryState.categories.length === 0 || inventoryState.categories.includes(m.categoria)))
                                 .reduce((acc, m) => acc + getMaterialQty(m), 0)}
                             </span>
                          </div>
                        </div>
                      </div>
                   </div>
                   <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${(materiais.filter(m => m && m.setor === inventoryState.sector && (inventoryState.categories.length === 0 || inventoryState.categories.includes(m.categoria))).reduce((acc, m) => acc + (inventoryState.foundQuantities[m.id] || 0), 0) / (materiais.filter(m => m && m.setor === inventoryState.sector && (inventoryState.categories.length === 0 || inventoryState.categories.includes(m.categoria))).reduce((acc, m) => acc + getMaterialQty(m), 0) || 1)) * 100}%` 
                        }}
                        className="h-full bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.3)]"
                      />
                   </div>
                </div>
              )}

              {/* Inventory Filters */}
              <div className="bg-white rounded-[30px] p-6 mb-8 border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <div>
                    <label htmlFor="inv-sector-filter" className="filter-label">Setor para Inventariar</label>
                    <select id="inv-sector-filter" name="inv-sector-filter" className="filter-input" value={inventoryState.sector} onChange={e => {
                      const newSector = e.target.value;
                      setInventoryState({ ...inventoryState, sector: newSector });
                      if (newSector) {
                        executeFilter('INVENTORY', { setor: newSector, fora_de_carga: 'all' });
                      }
                    }}>
                       <option value="">Selecione um Setor...</option>
                       {sectores.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="filter-label">Estado de Verificação</label>
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                       <button onClick={() => setInventoryState({...inventoryState, filter: 'ALL'})} className={cn("flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all", inventoryState.filter === 'ALL' ? "bg-white shadow-sm" : "text-gray-400")}>Todos</button>
                       <button onClick={() => setInventoryState({...inventoryState, filter: 'FOUND'})} className={cn("flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all", inventoryState.filter === 'FOUND' ? "bg-white shadow-sm text-green-600" : "text-gray-400")}>Encontrados</button>
                       <button onClick={() => setInventoryState({...inventoryState, filter: 'NOT_FOUND'})} className={cn("flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all", inventoryState.filter === 'NOT_FOUND' ? "bg-white shadow-sm text-red-600" : "text-gray-400")}>Faltantes</button>
                    </div>
                 </div>
                 
                 <div>
                    <label className="filter-label">Categorias para Inventariar</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                       {CATEGORIES.map(cat => {
                          const isSelected = inventoryState.categories.includes(cat.id);
                          return (
                            <button 
                              key={cat.id}
                              onClick={() => {
                                const newCats = isSelected 
                                  ? inventoryState.categories.filter(id => id !== cat.id)
                                  : [...inventoryState.categories, cat.id];
                                setInventoryState({...inventoryState, categories: newCats});
                              }}
                              className={cn("px-3 py-1.5 text-[9px] font-black uppercase rounded-lg border transition-all", 
                                isSelected ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100")}
                            >
                              {cat.label}
                            </button>
                          );
                       })}
                       {inventoryState.categories.length > 0 && (
                         <button 
                           onClick={() => setInventoryState({...inventoryState, categories: []})}
                           className="px-3 py-1.5 text-[9px] font-black uppercase rounded-lg border bg-gray-900 text-white border-gray-900 transition-all hover:bg-gray-800"
                         >
                           Limpar Filtro
                         </button>
                       )}
                    </div>
                 </div>

                 <div>
                    <label className="filter-label">Opções de Carga</label>
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                       <button 
                         onClick={() => {
                           const val = !filters.exibir_descarregados;
                           setFilters(prev => ({ ...prev, exibir_descarregados: val }));
                           setTimeout(() => executeFilter(), 0);
                         }} 
                         className={cn("flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase rounded-lg transition-all", filters.exibir_descarregados ? "bg-white shadow-sm text-amber-600" : "text-gray-400")}
                       >
                         <Filter size={14} />
                         {filters.exibir_descarregados ? "Exibindo Desc." : "Ocultar Desc."}
                       </button>
                    </div>
                 </div>
                 <div className="flex items-end gap-2">
                    <button 
                      onClick={() => {
                        if (!inventoryState.sector) return alert('Selecione um setor primeiro');
                        const items = materiais.filter(m => m.setor === inventoryState.sector);
                        const filtered = items.filter(m => {
                          if (inventoryState.categories.length > 0 && !inventoryState.categories.includes(m.categoria)) return false;
                          const foundQty = inventoryState.foundQuantities[m.id] || 0;
                          const totalQty = getMaterialQty(m);
                          if (inventoryState.filter === 'FOUND') return foundQty === totalQty;
                          if (inventoryState.filter === 'NOT_FOUND') return foundQty < totalQty;
                          return true;
                        });
                        generatePDFReport(filtered, `Inventário: ${inventoryState.sector} (${inventoryState.filter})`);
                      }}
                      className="flex-1 bg-black text-white h-[46px] rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg"
                    >
                       <Printer size={16} /> PDF
                    </button>
                    <button 
                      onClick={() => {
                        if (!inventoryState.sector) return alert('Selecione um setor primeiro');
                        const items = materiais.filter(m => {
                          const sectorMatch = m.setor === inventoryState.sector;
                          const categoryMatch = inventoryState.categories.length === 0 || inventoryState.categories.includes(m.categoria);
                          return sectorMatch && categoryMatch;
                        });
                        const found = items.filter(m => (inventoryState.foundQuantities[m.id] || 0) === getMaterialQty(m));
                        const missing = items.filter(m => (inventoryState.foundQuantities[m.id] || 0) < getMaterialQty(m));
                        const text = `*RELATÓRIO DE INVENTÁRIO - ${inventoryState.sector}*\n\n` +
                          `✅ Encontrados: ${found.length}\n` +
                          `❌ Faltantes: ${missing.length}\n\n` +
                          `*Itens Faltantes:*\n` +
                          (missing.length > 0 ? missing.map(m => `- ${m.bmp}: ${m.descricao}`).join('\n') : '_Nenhum item faltando_');
                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
                      }}
                      className="flex-1 bg-green-600 text-white h-[46px] rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg"
                    >
                       <MessageCircle size={16} /> Zap
                    </button>
                 </div>
              </div>

              {/* Items for Inventory - UPDATED */}
              <div className="space-y-4 mb-20">
                 {materiais
                   .filter(m => m && (!inventoryState.sector || m.setor === inventoryState.sector))
                    .filter(m => inventoryState.categories.length === 0 || (m && inventoryState.categories.includes(m.categoria)))
                   .filter(m => {
                       const foundQty = inventoryState.foundQuantities[m.id] || 0; 
                       const totalQty = getMaterialQty(m);
                       if (inventoryState.filter === 'FOUND') return foundQty === totalQty;
                       if (inventoryState.filter === 'NOT_FOUND') return foundQty < totalQty;
                       return true;
                   })
                   .map(m => {
                       const foundQty = inventoryState.foundQuantities[m.id] || 0; 
                       const totalQty = getMaterialQty(m);
                       const isFullyFound = foundQty === totalQty;
                       const isPartial = foundQty > 0 && foundQty < totalQty;
                      return (
                         <div key={m.id} className={cn("bg-white p-6 rounded-[30px] border flex items-center justify-between transition-all", isFullyFound ? "border-green-100 bg-green-50/10 shadow-sm" : isPartial ? "border-amber-100 bg-amber-50/10 shadow-sm" : "border-gray-100 shadow-sm")}>
                           <div className="flex items-center gap-6">
                              <button 
                                onClick={() => {
                                   if (totalQty > 1 && m.categoria === 'CONSUMO') {
                                      const input = window.prompt(`Informe a quantidade encontrada de ${m.descricao} (Total disponível: ${totalQty})`, String(foundQty || totalQty));
                                      if (input !== null) {
                                         const parsed = parseInt(input);
                                         if (!isNaN(parsed)) {
                                           const newVal = Math.max(0, Math.min(parsed, totalQty));
                                           setInventoryState({...inventoryState, foundQuantities: {...inventoryState.foundQuantities, [m.id]: newVal}});
                                         }
                                      }
                                   } else {
                                      const newVal = isFullyFound ? 0 : totalQty;
                                      setInventoryState({...inventoryState, foundQuantities: {...inventoryState.foundQuantities, [m.id]: newVal}});
                                   }
                                }}
                                className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all", isFullyFound ? "bg-green-600 text-white shadow-lg shadow-green-200" : isPartial ? "bg-amber-500 text-white shadow-lg shadow-amber-200" : "bg-gray-100 text-gray-400 hover:bg-gray-200")}
                              >
                                 <CheckSquare size={24} />
                              </button>
                              <div>
                                 <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-black bg-gray-900 text-white px-2 py-0.5 rounded leading-none">BMP {m.bmp}</span>
                                    {m.epi_numero && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 rounded">Nº {m.epi_numero}</span>}
                                 </div>
                                 <h4 className="font-bold text-gray-900 uppercase tracking-tight">{m.descricao}</h4>
                                 <div className="flex gap-4 mt-1">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase"><span className="text-gray-300">Setor:</span> {m.setor}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase"><span className="text-gray-300">Qnt:</span> {foundQty}/{totalQty}</p>
                                 </div>
                              </div>
                           </div>
                           <div className="hidden md:block">
                              <span className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest", isFullyFound ? "bg-green-100 text-green-700" : isPartial ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-400")}>
                                 {isFullyFound ? 'Concluído' : isPartial ? 'Parcial' : 'Pendente'}
                              </span>
                           </div>
                        </div>
                      )
                   })}
                 
                 {inventoryState.sector && materiais.filter(m => m.setor === inventoryState.sector).length === 0 && (
                   <div className="text-center py-20 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-100">
                      <Package size={48} className="mx-auto text-gray-200 mb-4" />
                      <p className="text-gray-400 font-bold uppercase text-xs">Nenhum item cadastrado neste setor.</p>
                   </div>
                 )}
                 
                 {!inventoryState.sector && (
                   <div className="text-center py-20 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-100">
                      <Filter size={48} className="mx-auto text-gray-200 mb-4" />
                      <p className="text-gray-400 font-bold uppercase text-xs">Selecione um setor acima para iniciar a conferência.</p>
                   </div>
                 )}
              </div>
            </motion.div>
          )}

          {view === 'AUDIT' && (
            <motion.div key="audit" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
               <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter leading-none text-red-600 uppercase">AUDITORIA</h2>
                    <p className="text-gray-400 uppercase text-[9px] md:text-[10px] font-bold tracking-[0.2em] mt-2">Log de ações e segurança militar</p>
                  </div>
                  <div className="w-full md:w-80">
                      <div className="relative">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                         <input 
                           className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-gray-200 focus:border-red-600 outline-none transition-all shadow-sm"
                           placeholder="Buscar no Log..."
                           value={auditFilter}
                           onChange={e => setAuditFilter(e.target.value)}
                         />
                      </div>
                  </div>
               </div>

               <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full">
                     <thead className="bg-gray-50/50">
                        <tr className="text-left">
                           <th className="table-header">Data / Hora</th>
                           <th className="table-header">Militar</th>
                           <th className="table-header">Ação</th>
                           <th className="table-header">Detalhes do Evento</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                        {auditLogs.filter(log => {
                          if (!log) return false;
                          const filter = (auditFilter || '').toLowerCase();
                          const usuario = (log.usuario || '').toLowerCase();
                          const acao = (log.acao || '').toLowerCase();
                          const detalhes = (log.detalhes || '').toLowerCase();
                          return usuario.includes(filter) || acao.includes(filter) || detalhes.includes(filter);
                        }).reverse().map(log => (
                          <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-6 text-xs font-mono text-gray-500">{log.data}</td>
                            <td className="p-6">
                               <span className="font-bold text-gray-900">{log.usuario}</span>
                            </td>
                            <td className="p-6">
                               <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-[9px] font-black uppercase tracking-widest ring-1 ring-red-100">
                                  {log.acao}
                               </span>
                            </td>
                            <td className="p-6 text-sm text-gray-600">{log.detalhes}</td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
                  {auditLogs.length === 0 && <p className="text-center py-20 text-gray-400 uppercase text-[10px] font-black tracking-widest">Nenhum evento registrado</p>}
               </div>
            </motion.div>
          )}

          {view === 'COMPARE' && (
            <div key="compare-view">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter leading-none text-indigo-600 uppercase">COMPARADOR BMP</h2>
                    <p className="text-gray-400 uppercase text-[9px] md:text-[10px] font-bold tracking-[0.2em] mt-2">Cruze dados do Relatório Analítico com o sistema</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-8">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4 block">Cole a coluna de BMPs do Relatório</label>
                    <textarea 
                      className="w-full h-[400px] p-6 bg-gray-50 border border-gray-200 rounded-[30px] font-mono text-sm focus:border-indigo-500 outline-none transition-all resize-none"
                      placeholder="Exemplo:
501234
501235
501236"
                      value={compareInput}
                      onChange={(e) => setCompareInput(e.target.value)}
                    />
                    <div className="flex gap-4 mt-6">
                      <button 
                        onClick={compareBmps}
                        disabled={!compareInput.trim() || loading}
                        className="flex-1 py-5 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-3xl hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 active:scale-95 text-xs"
                      >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                        Comparar
                      </button>
                      <button 
                        onClick={clearCompareForm}
                        className="px-8 py-5 bg-gray-100 text-gray-500 font-black uppercase tracking-widest rounded-3xl hover:bg-gray-200 transition-all flex items-center justify-center gap-3 active:scale-95 text-xs"
                      >
                        <Trash2 size={18} />
                        Limpar
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6 overflow-y-auto max-h-[80vh] pr-2">
                    {!comparisonResult ? (
                      <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 border-4 border-dashed border-gray-100 rounded-[40px] bg-gray-50/50">
                        <Database size={64} className="text-gray-200 mb-6" />
                        <h3 className="text-gray-300 font-black uppercase text-sm tracking-[0.3em]">Aguardando Dados</h3>
                        <p className="text-gray-300 text-[10px] uppercase font-bold mt-2">Os resultados aparecerão aqui após a análise</p>
                      </div>
                    ) : (
                      <>
                        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-8">
                           <div className="flex items-center justify-between mb-6 border-b border-red-50 pb-4">
                              <h3 className="text-sm font-black text-red-600 uppercase tracking-widest flex items-center gap-3">
                                <AlertTriangle size={20} /> Faltando no Sistema ({comparisonResult.missingInSystem.length})
                              </h3>
                              <div className="flex gap-2">
                                {!showMissingInListUI && comparisonResult.missingInList.length > 0 && (
                                  <button
                                    onClick={() => setShowMissingInListUI(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
                                  >
                                    Ver no Sistema ({comparisonResult.missingInList.length})
                                  </button>
                                )}
                                {comparisonResult.missingInSystem.length > 0 && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        const text = `*RELATÓRIO DE BMPs FALTANTES NO SISTEMA*\n\nEstes BMPs constam no registro mas não foram encontrados no sistema:\n\n${comparisonResult.missingInSystem.map(bmp => `• ${bmp}`).join('\n')}`;
                                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                                      }}
                                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg shadow-green-500/20"
                                    >
                                      <MessageCircle size={14} />
                                    </button>
                                    <button
                                      onClick={() => generateComparisonPDF(comparisonResult)}
                                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg active:scale-95"
                                      title="Exportar PDF"
                                    >
                                      <FileText size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>
                           </div>
                           <div className="max-h-[300px] overflow-y-auto pr-4 space-y-2">
                              {comparisonResult.missingInSystem.length === 0 ? (
                                <div className="flex items-center gap-3 text-green-600 bg-green-50 p-4 rounded-2xl font-bold text-xs uppercase">
                                  <CheckCircle size={18} /> Todos os BMPs da lista já estão cadastrados!
                                </div>
                              ) : (
                                comparisonResult.missingInSystem.map(bmp => (
                                  <div key={bmp} className="flex items-center justify-between px-5 py-3 bg-red-50 text-red-700 rounded-2xl text-[11px] font-mono font-black border border-red-100">
                                    <span>#{bmp}</span>
                                    <span className="text-[9px] font-black uppercase opacity-60">Não Encontrado</span>
                                  </div>
                                ))
                              )}
                           </div>
                        </div>

                        {showMissingInListUI && (
                          <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-8"
                          >
                             <div className="flex items-center justify-between mb-6 border-b border-indigo-50 pb-4">
                                <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest flex items-center gap-3">
                                  <Search size={20} /> Estão no sistema mas não estão mais no REGSITRO ({comparisonResult.missingInList.length})
                                </h3>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setShowMissingInListUI(false)}
                                    className="px-4 py-2 text-[10px] font-black uppercase text-gray-400 hover:text-gray-600 transition-all"
                                  >
                                    Ocultar
                                  </button>
                                  {comparisonResult.missingInList.length > 0 && (
                                    <button
                                      onClick={() => {
                                        const text = `*RELATÓRIO DE BMPs FALTANTES NO REGISTRO*\n\nEstes BMPs constam no sistema mas não foram informados na sua lista:\n\n${comparisonResult.missingInList.map(bmp => `• ${bmp}`).join('\n')}`;
                                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                                      }}
                                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                                    >
                                      Compartilhar
                                    </button>
                                  )}
                                </div>
                             </div>
                             <div className="max-h-[300px] overflow-y-auto pr-4 space-y-2">
                                {comparisonResult.missingInList.length === 0 ? (
                                  <div className="flex items-center gap-3 text-green-600 bg-green-50 p-4 rounded-2xl font-bold text-xs uppercase">
                                    <CheckCircle size={18} /> Todos os BMPs do sistema foram informados na lista!
                                  </div>
                                ) : (
                                  comparisonResult.missingInList.map(bmp => (
                                    <div key={bmp} className="flex items-center justify-between px-5 py-3 bg-indigo-50 text-indigo-700 rounded-2xl text-[11px] font-mono font-black border border-indigo-100">
                                      <span>#{bmp}</span>
                                      <span className="text-[9px] font-black uppercase opacity-60">Apenas no Sistema</span>
                                    </div>
                                  ))
                                )}
                             </div>
                          </motion.div>
                        )}
                      </>
                    )}
                  </div>
               </div>
            </div>
          )}
        </div>
        
        {/* Hover Action Button to Scroll to Top */}
        <ScrollToTopButton />
      </main>

      {/* EPR Recarga Modal */}
      <AnimatePresence>
        {showEprRecargaModal && eprToRecarga && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowEprRecargaModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-[32px] md:rounded-[40px] shadow-2xl w-full max-w-md relative overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 sticky top-0 z-10 hidden md:flex">
                <h3 className="text-xl font-black text-gray-900 tracking-tighter uppercase italic">Recarga EPR <span className="text-indigo-600 font-mono">#{eprToRecarga.bmp || eprToRecarga.epi_numero}</span></h3>
                <button onClick={() => setShowEprRecargaModal(false)} className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-all"><X size={20} /></button>
              </div>
              <div className="p-8 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6 md:hidden">
                   <h3 className="text-xl font-black text-gray-900 tracking-tighter uppercase italic">Recarga EPR <span className="text-indigo-600 font-mono">#{eprToRecarga.bmp || eprToRecarga.epi_numero}</span></h3>
                   <button onClick={() => setShowEprRecargaModal(false)} className="text-gray-400 hover:text-red-600 p-2"><X size={20} /></button>
                </div>
                
                {(() => {
                  const count = parseInt(eprToRecarga.epr_recargas_count as any, 10) || 0;
                  const lim = parseInt(eprToRecarga.epr_recargas_limite as any, 10) || 0;
                  const exceeded = lim > 0 && count >= lim;
                  const remaining = lim > 0 ? lim - count : null;
                  
                  return (
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      if (!eprToRecarga || !eprRecargaDate) return;
                      setLoading(true);
                      try {
                        const res = await authenticatedFetch(SCRIPT_URL, {
                          method: 'POST',
                          headers: { 'Content-Type': 'text/plain' },
                          body: JSON.stringify({
                            action: 'update_material',
                            categoria: eprToRecarga.categoria,
                            id: eprToRecarga.id,
                            epr_recargas_count: count + 1,
                            epr_ultima_recarga: eprRecargaDate,
                            epr_proxima_recarga: eprProximaRecargaDate,
                            epr_aviso_recarga: eprAvisoRecarga,
                            executor: currentUser?.login
                          })
                        });
                        const resData = await res.json();
                        if (resData.success) {
                          alert('Recarga registrada com sucesso!');
                          setShowEprRecargaModal(false);
                          setEprToRecarga(null);
                          setEprRecargaDate('');
                          setEprProximaRecargaDate('');
                          setEprAvisoRecarga('');
                          executeFilter('EPR');
                        } else {
                          alert(res.message);
                        }
                      } catch (err) {
                        alert('Erro ao registrar recarga.');
                      } finally {
                        setLoading(false);
                      }
                    }} className="flex flex-col gap-6">
                      
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-2 relative overflow-hidden">
                        {exceeded && <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />}
                        {!exceeded && <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />}
                        <h4 className="font-black text-slate-800 uppercase tracking-widest text-[10px]">Status de Recargas</h4>
                        <p className={cn("text-xs font-bold leading-relaxed", exceeded ? "text-red-600" : "text-slate-600")}>
                          {exceeded ? 'Este EPR já atingiu o limite.' : (
                            <>Esse EPR foi recarregado <strong>{count}</strong> vezes{lim > 0 && remaining !== null ? ` e restam ainda ${remaining} recargas a serem feitas definidas pelo administrador` : ''}.</>
                          )}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="modal-label">Data da Recarga</label>
                        <input type="date" required disabled={exceeded || loading} className="modal-input" value={eprRecargaDate} onChange={e => setEprRecargaDate(e.target.value)} />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="modal-label">Próxima Recarga</label>
                        <input type="date" disabled={exceeded || loading} className="modal-input" value={eprProximaRecargaDate} onChange={e => setEprProximaRecargaDate(e.target.value)} />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="modal-label">Aviso de Recarga (Antes)</label>
                        <select className="modal-input" disabled={exceeded || loading} value={eprAvisoRecarga} onChange={e => setEprAvisoRecarga(e.target.value)}>
                          <option value="">Sem aviso</option>
                          <option value="15">15 dias</option>
                          <option value="30">1 mês</option>
                          <option value="60">2 meses</option>
                          <option value="90">3 meses</option>
                          <option value="180">6 meses</option>
                          <option value="365">1 ano</option>
                        </select>
                      </div>
                      
                      {!exceeded && (
                        <button type="submit" disabled={loading || !eprRecargaDate} className="w-full bg-indigo-600 text-white rounded-2xl py-4 font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 mt-4 shadow-xl shadow-indigo-600/30">
                          {loading ? <RefreshCw className="animate-spin" size={16} /> : 'Registrar Recarga'}
                        </button>
                      )}
                      
                    </form>
                  );
                })()}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Material Modal */}
      <AnimatePresence>
        {showMaterialModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMaterialModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-w-3xl rounded-[40px] p-10 shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="text-2xl font-black">{editingMaterial?.id ? 'Atualizar Ficha Técnica' : 'Novos Dados de Carga'}</h3>
                   <button onClick={() => setShowMaterialModal(false)} className="p-3 hover:bg-gray-100 rounded-full"><X size={24}/></button>
                </div>
                <form onSubmit={saveMaterial} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="mat-bmp" className="modal-label">Número BMP {editingMaterial?.fora_de_carga === 'SIM' ? '(Opcional)' : '(Obrigatório)'}</label>
                          <input 
                            id="mat-bmp"
                            name="mat-bmp"
                            required={editingMaterial?.fora_de_carga !== 'SIM'} 
                            className="modal-input" 
                            value={editingMaterial?.bmp || ''} 
                            onChange={e => setEditingMaterial({...(editingMaterial || {}), bmp: e.target.value})} 
                            placeholder={editingMaterial?.fora_de_carga === 'SIM' ? "Opcional p/ fora de carga" : "Ex: 501234"} 
                          />
                        </div>
                        <div>
                          <label htmlFor="mat-doc" className="modal-label">Documento</label>
                          <input 
                            id="mat-doc"
                            name="mat-doc"
                            className="modal-input" 
                            value={editingMaterial?.documento || ''} 
                            onChange={e => setEditingMaterial({...(editingMaterial || {}), documento: e.target.value})} 
                            placeholder="SP, OBSERVAÇÕES..." 
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="mat-qty" className="modal-label">Quantidade</label>
                        <input 
                          id="mat-qty"
                          name="mat-qty"
                          type="number"
                          min="1"
                          disabled={!editingMaterial?.id && editingMaterial?.categoria === 'PERMANENTE'}
                          className={cn("modal-input", (!editingMaterial?.id && editingMaterial?.categoria === 'PERMANENTE') ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "")} 
                          value={(!editingMaterial?.id && editingMaterial?.categoria === 'PERMANENTE') ? 1 : (editingMaterial?.quantidade || 1)} 
                          onChange={e => setEditingMaterial({...(editingMaterial || {}), quantidade: parseInt(e.target.value) || 1})} 
                        />
                      </div>
                      <div className="pt-2">
                        <label htmlFor="mat-size" className="modal-label">Tamanho / Modelo</label>
                        <input id="mat-size" name="mat-size" className="modal-input" value={editingMaterial?.tamanho || ''} onChange={e => setEditingMaterial({...(editingMaterial || {}), tamanho: e.target.value})} placeholder="Ex: 41, G" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="mat-conta" className="modal-label">Conta (Sem Letras)</label>
                          <input 
                            id="mat-conta" 
                            name="mat-conta" 
                            className="modal-input" 
                            value={editingMaterial?.conta || ''} 
                            onChange={e => {
                              const val = e.target.value.replace(/[a-zA-ZÀ-ÿ]/g, '');
                              setEditingMaterial({...(editingMaterial || {}), conta: val});
                            }} 
                            placeholder="Apenas nº e símbolos" 
                          />
                        </div>
                        <div>
                          <label htmlFor="mat-classe" className="modal-label">Classe (4 Números)</label>
                          <input 
                            id="mat-classe" 
                            name="mat-classe" 
                            className="modal-input" 
                            maxLength={4}
                            value={editingMaterial?.classe || ''} 
                            onChange={e => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                              setEditingMaterial({...(editingMaterial || {}), classe: val});
                            }} 
                            placeholder="Ex: 1234" 
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="mat-desc" className="modal-label">Descrição Detalhada</label>
                        <textarea id="mat-desc" name="mat-desc" required rows={4} className="modal-input resize-none" value={editingMaterial?.descricao || ''} onChange={e => setEditingMaterial({...(editingMaterial || {}), descricao: e.target.value})} placeholder="Ex: MANGUEIRA DE INCÊNDIO..." />
                        {(editingMaterial?.descricao && /\b(epr|respiraç([ãa]o)|respiracao|cilindro|aut[ôo]nom[ao]|capacete|balaclava|luva|cal[çc]a|casaco|blus[ãa]o|jaqueta|bota)\b/i.test(editingMaterial.descricao) && editingMaterial?.categoria !== 'EPI_PRETO' && editingMaterial?.categoria !== 'EPI_AMARELO' && editingMaterial?.classificacao !== 'EPR') && (
                          <div className="mt-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-start gap-2">
                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                            <span>Atenção: EPI ou EPR devem ser cadastrados no menu "Gestão de EPIs/EPRs".</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <label htmlFor="mat-obs" className="modal-label">Observações Internas (Não obrigatório)</label>
                        <textarea 
                          id="mat-obs"
                          name="mat-obs"
                          rows={3} 
                          className="modal-input resize-none border-gray-100 bg-gray-50/50" 
                          value={editingMaterial?.observacoes || ''} 
                          onChange={e => setEditingMaterial({...(editingMaterial || {}), observacoes: e.target.value})} 
                          placeholder="Ex: Item em processo de descarga, aguardando parecer técnico..." 
                        />
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div>
                        <label htmlFor="mat-sector" className="modal-label">Setor / Localização Exata</label>
                        <select id="mat-sector" name="mat-sector" required className="modal-input" value={editingMaterial?.setor || ''} onChange={e => setEditingMaterial({...(editingMaterial || {}), setor: e.target.value})}>
                           <option value="">Selecione o Setor...</option>
                           {sectores.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="mat-status" className="modal-label">Situação Operacional</label>
                        <select id="mat-status" name="mat-status" required className="modal-input" value={editingMaterial?.situacao || ''} onChange={e => setEditingMaterial({...(editingMaterial || {}), situacao: e.target.value})}>
                           <option value="">Selecione Situação...</option>
                           {SITUACOES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="mat-cat" className="modal-label">Tipo de Material</label>
                        <select id="mat-cat" name="mat-cat" required className="modal-input" value={editingMaterial?.categoria || ''} onChange={e => setEditingMaterial({...(editingMaterial || {}), categoria: e.target.value})}>
                           <option value="">Selecione Categoria...</option>
                           {CATEGORIES.filter(c => c.id !== 'EPI_PRETO' && c.id !== 'EPI_AMARELO').map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>
                      </div>
                      
                      {/* Classificações Adicionais moved to toggles below */}
                      
                      {/* EPI fields moved to dedicated EPI form */}

                      {editingMaterial?.categoria === 'EXTINTORES' && (
                        <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-300 space-y-4">
                          <div>
                            <label htmlFor="mat-ext-type" className="modal-label">Tipo de Extintor</label>
                            <select 
                              id="mat-ext-type"
                              name="mat-ext-type"
                              className="modal-input" 
                              value={editingMaterial?.extintor_tipo || ''} 
                              onChange={e => setEditingMaterial({...(editingMaterial || {}), extintor_tipo: e.target.value})}
                            >
                              <option value="">Selecione o Agente...</option>
                              <option value="ÁGUA (H2O)">ÁGUA (H2O)</option>
                              <option value="CLASSE D">CLASSE D (METAIS)</option>
                              <option value="CO2">CO2 (DIÓXIDO DE CARBONO)</option>
                              <option value="ESPUMA MECÂNICA">ESPUMA MECÂNICA</option>
                              <option value="OUTROS">OUTROS</option>
                              <option value="PQS ABC">PQS ABC</option>
                              <option value="PQS BC">PQS BC</option>
                            </select>
                          </div>
                          <div>
                            <label htmlFor="mat-ext-weight" className="modal-label">Peso / Capacidade (kg/L)</label>
                            <input 
                              id="mat-ext-weight"
                              name="mat-ext-weight"
                              className="modal-input" 
                              value={editingMaterial?.extintor_peso || ''} 
                              onChange={e => setEditingMaterial({...(editingMaterial || {}), extintor_peso: e.target.value})} 
                              placeholder="Ex: 4kg, 6kg, 10L, 50kg" 
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                       {(editingMaterial?.categoria === 'CONSUMO' || editingMaterial?.categoria === 'PERMANENTE') && SUB_CATEGORIES.map(sub => (
                         <label key={sub.id} className="relative inline-flex items-center cursor-pointer bg-gray-50 p-4 rounded-2xl transition-all border-2 border-transparent has-[:checked]:bg-red-50 has-[:checked]:border-red-200">
                           <input 
                             type="checkbox" 
                             className="sr-only peer" 
                             checked={editingMaterial?.[sub.id as keyof Material] === true || editingMaterial?.[sub.id as keyof Material] === 'SIM'} 
                             onChange={e => setEditingMaterial({...(editingMaterial || {}), [sub.id]: e.target.checked ? 'SIM' : 'NÃO'})} 
                           />
                           <div className="w-11 h-6 shrink-0 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                           <span className="ml-3 text-[10px] font-black uppercase text-gray-500 peer-checked:text-red-700">{sub.label}</span>
                         </label>
                       ))}
                       {(editingMaterial?.categoria === 'CONSUMO' || editingMaterial?.categoria === 'PERMANENTE' || editingMaterial?.categoria === 'EXTINTORES') && (
                         <label className="relative inline-flex items-center cursor-pointer bg-gray-50 p-4 rounded-2xl transition-all border-2 border-transparent has-[:checked]:bg-red-50 has-[:checked]:border-red-200">
                            <input type="checkbox" className="sr-only peer" checked={editingMaterial?.fora_de_carga === true || editingMaterial?.fora_de_carga === 'SIM'} onChange={e => setEditingMaterial({...(editingMaterial || {}), fora_de_carga: e.target.checked ? 'SIM' : 'NÃO'})} />
                            <div className="w-11 h-6 shrink-0 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                            <span className="ml-3 text-[10px] font-black uppercase text-gray-500 peer-checked:text-red-700">Material Fora de Carga</span>
                         </label>
                       )}
                    </div>
                   <button className="col-span-2 bg-red-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-red-700 flex items-center justify-center gap-3">
                      <Save size={20} /> Salvar Alterações
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sector Management Modal */}
      <AnimatePresence>
        {showSectorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSectorModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="text-2xl font-black uppercase tracking-tighter">Gestão de Setores</h3>
                   <button onClick={() => setShowSectorModal(false)} className="p-3 hover:bg-gray-100 rounded-full"><X size={24}/></button>
                </div>
                
                <form onSubmit={saveSector} className="mb-8 flex gap-2">
                   <div className="flex-1">
                     <label htmlFor="new-sector-name" className="sr-only">Nome do Novo Setor</label>
                     <input 
                       id="new-sector-name"
                       name="new-sector-name"
                       className="modal-input w-full" 
                       value={newSectorName} 
                       onChange={e => setNewSectorName(e.target.value)} 
                       placeholder="Nome do Novo Setor"
                       required
                     />
                   </div>
                   <button disabled={loading} className="bg-red-600 text-white p-4 rounded-2xl hover:bg-red-700 transition-colors">
                      {loading ? <RefreshCw className="animate-spin" size={20} /> : <Plus size={20} />}
                   </button>
                </form>

                <div className="space-y-3">
                   {sectores.map(s => (
                     <div key={s.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl group hover:bg-red-50 transition-colors">
                        <span className="font-bold text-gray-700 group-hover:text-red-700">{s.nome}</span>
                        <button onClick={() => deleteSector(s.id)} className="p-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                           <Trash2 size={16} />
                        </button>
                     </div>
                   ))}
                   {sectores.length === 0 && <p className="text-center text-gray-400 text-xs py-10">Nenhum setor cadastrado.</p>}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Loan Modal */}
      <AnimatePresence>
        {showLoanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLoanModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="text-2xl font-black uppercase tracking-tighter">Novo Empréstimo</h3>
                   <button onClick={() => setShowLoanModal(false)} className="p-3 hover:bg-gray-100 rounded-full"><X size={24}/></button>
                </div>
                
                <form onSubmit={createLoan} className="space-y-6">
                   <div>
                      <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Itens Selecionados ({selectedForLoan.length})</p>
                      <div className="max-h-48 overflow-y-auto space-y-2 mb-4 bg-gray-50 p-4 rounded-2xl">
                         {materiais.filter(m => selectedForLoan.includes(m.id)).map(m => {
                            const isConsumo = m.categoria === 'CONSUMO';
                            const currentQty = loanQuantities[m.id] || 1;
                            return (
                              <div key={m.id} className="text-xs font-bold text-gray-600 flex flex-col gap-1 border-b border-gray-100 pb-2 last:border-0 last:pb-0 mb-2">
                                 <div className="flex justify-between items-center">
                                    <span className="flex-1 pr-2 truncate">#{m.bmp || 'S/N'} - {m.descricao}</span>
                                    {isConsumo ? (
                                      <div className="flex items-center gap-2">
                                         <span className="text-[9px] uppercase text-gray-400">Qtd:</span>
                                         <input 
                                           type="number" 
                                           min="1" 
                                           max={Number(m.quantidade) || 1} 
                                           className="w-12 h-7 bg-white border border-gray-200 rounded text-center text-[10px] font-black"
                                           value={currentQty}
                                           onChange={e => {
                                             const val = Math.max(1, Math.min(Number(m.quantidade) || 1, parseInt(e.target.value) || 1));
                                             setLoanQuantities({...loanQuantities, [m.id]: val});
                                           }}
                                         />
                                         <span className="text-[9px] text-gray-400">/ {m.quantidade}</span>
                                      </div>
                                    ) : (
                                      <span className="text-[9px] text-gray-400 italic">Unidade única</span>
                                    )}
                                 </div>
                              </div>
                            );
                         })}
                         {selectedForLoan.length === 0 && <p className="text-[10px] text-red-500 font-bold italic">Nenhum item selecionado na tabela!</p>}
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div>
                         <label htmlFor="loan-solicitante" className="modal-label">Nome de quem está retirando</label>
                         <input id="loan-solicitante" name="loan-solicitante" required className="modal-input" value={newLoan.solicitante} onChange={e => setNewLoan({...newLoan, solicitante: e.target.value.toUpperCase()})} placeholder="Ex: Sgt Fulano / Militar tal" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label htmlFor="loan-telefone" className="modal-label">Telefone (xx)-xxxxxxxxx</label>
                           <input 
                             id="loan-telefone" 
                             name="loan-telefone" 
                             required 
                             className="modal-input" 
                             value={newLoan.telefone} 
                             onChange={e => {
                               const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                               let formatted = digits;
                               if (digits.length > 2) {
                                 formatted = `(${digits.slice(0, 2)})${digits.slice(2)}`;
                               }
                               setNewLoan({...newLoan, telefone: formatted});
                             }} 
                             placeholder="(00)000000000" 
                           />
                        </div>
                        <div>
                           <label htmlFor="loan-ramal" className="modal-label">Ramal (4 dígitos)</label>
                           <input 
                             id="loan-ramal" 
                             name="loan-ramal" 
                             required 
                             className="modal-input" 
                             maxLength={4}
                             value={newLoan.ramal} 
                             onChange={e => setNewLoan({...newLoan, ramal: e.target.value.replace(/\D/g, '')})} 
                             placeholder="0000" 
                           />
                        </div>
                      </div>

                      <div>
                         <label htmlFor="loan-setor" className="modal-label">Setor do Solicitante</label>
                         <input id="loan-setor" name="loan-setor" required className="modal-input" value={newLoan.setor} onChange={e => setNewLoan({...newLoan, setor: e.target.value.toUpperCase()})} placeholder="Ex: Secretaria, Garagem, etc" />
                      </div>

                      <div>
                         <label htmlFor="loan-previsao" className="modal-label">Previsão de Devolução</label>
                         <input id="loan-previsao" name="loan-previsao" required type="date" className="modal-input" value={newLoan.previsao} onChange={e => setNewLoan({...newLoan, previsao: e.target.value})} />
                      </div>
                   </div>

                   <button disabled={loading || selectedForLoan.length === 0} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-red-700 flex items-center justify-center gap-3 disabled:opacity-50">
                      {loading ? <RefreshCw className="animate-spin" /> : <><ArrowRightLeft size={20} /> Finalizar e Gerar Recibo</>}
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Return Status Modal */}
      <AnimatePresence>
        {showReturnModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowReturnModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="text-2xl font-black uppercase tracking-tighter">Registrar Devolução</h3>
                   <button onClick={() => setShowReturnModal(false)} className="p-3 hover:bg-gray-100 rounded-full"><X size={24}/></button>
                </div>
                
                <div className="space-y-6">
                   <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl">
                      <p className="text-xs text-amber-900 font-bold leading-relaxed mb-4">
                        Ao devolver os itens, selecione em qual situação eles retornarão ao estoque. 
                        Isso atualizará automaticamente o status de todos os materiais vinculados a este empréstimo.
                      </p>
                      
                      {returningLoanId && typeof returningLoanId !== 'object' && (
                        <div className="space-y-2 border-t border-amber-200/50 pt-4">
                           <p className="text-[10px] font-black uppercase text-amber-800 mb-2">Itens para conferência:</p>
                           {(() => {
                              const loanIdStr = String(returningLoanId);
                              const loan = loans.find(l => String(l.id) === loanIdStr);
                              if (!loan) return null;
                              try {
                                 const items = JSON.parse(loan.materiais_json || '[]');
                                 return items.map((item: any, idx: number) => {
                                    const mid = typeof item === 'object' ? item.id : item;
                                    const qty = typeof item === 'object' ? item.qty : 1;
                                    const mat = materiais.find(m => String(m.id) === String(mid));
                                    return (
                                      <div key={idx} className="flex justify-between items-center text-[11px] font-bold text-amber-900 bg-white/50 px-3 py-2 rounded-xl">
                                         <span className="truncate pr-2">{mat?.descricao || 'Material '+mid}</span>
                                         <span className="bg-amber-200 px-2 py-0.5 rounded-lg text-[9px] whitespace-nowrap">Qtd: {qty}</span>
                                      </div>
                                    );
                                 });
                              } catch(e) { return <p className="text-[10px] italic">Erro ao ler itens</p>; }
                           })()}
                        </div>
                      )}
                   </div>

                   <div className="space-y-4">
                      <label className="modal-label">Situação de Retorno</label>
                      <div className="flex flex-col gap-2">
                        {SITUACOES.filter(s => s !== 'EMPRESTADO').map(sit => (
                          <button 
                            key={sit}
                            type="button"
                            onClick={() => setSelectedReturnStatus(sit)}
                            className={cn(
                              "w-full py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-between",
                              selectedReturnStatus === sit 
                                ? "bg-red-600 border-red-700 text-white shadow-lg shadow-red-200" 
                                : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
                            )}
                          >
                            {sit}
                            {selectedReturnStatus === sit && <CheckCircle size={16} />}
                          </button>
                        ))}
                      </div>
                   </div>

                   <button 
                    onClick={confirmReturnLoan}
                    disabled={loading} 
                    className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-red-600 flex items-center justify-center gap-3 disabled:opacity-50"
                   >
                      {loading ? <RefreshCw className="animate-spin" size={20} /> : <><CheckCircle size={20} /> Confirmar Entrega</>}
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* User Management Modal */}
      <AnimatePresence>
        {showUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowUserModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="text-2xl font-black uppercase tracking-tighter">Cadastro de Pessoal</h3>
                   <button onClick={() => setShowUserModal(false)} className="p-3 hover:bg-gray-100 rounded-full"><X size={24}/></button>
                </div>
                
                <form onSubmit={saveUser} className="space-y-4 mb-10">
                   <div><label htmlFor="modal-user-nome" className="modal-label">Nome Completo</label><input id="modal-user-nome" name="modal-user-nome" required className="modal-input" value={editingUser?.nome || ''} onChange={e => setEditingUser({ ...(editingUser || {}), nome: e.target.value})} placeholder="Ex: 2S Fulano" /></div>
                   <div>
                     <label htmlFor="modal-user-login" className="modal-label">Usuário (SARAM - 7 dígitos)</label>
                     <input id="modal-user-login" name="modal-user-login" required className="modal-input" maxLength={7} minLength={7}
                       pattern="\d{7}"
                       title="O SARAM deve conter exatamente 7 dígitos numéricos"
                       value={editingUser?.login || ''} 
                       onChange={e => {
                         const val = e.target.value.replace(/\D/g, '');
                         if (val.length <= 7) {
                           setEditingUser({ ...(editingUser || {}), login: val});
                         }
                       }} 
                       placeholder="0000000"
                     />
                   </div>
                   <div><label htmlFor="modal-user-level" className="modal-label">Nível de Acesso</label>
                      <select id="modal-user-level" name="modal-user-level" required className="modal-input"                         value={editingUser?.id ? (editingUser?.nivel || '') : (newUser.nivel || '')} 
                        onChange={e => {
                          const val = e.target.value as 'ADMIN' | 'USER';
                          if (editingUser?.id) {
                            setEditingUser({ ...editingUser, nivel: val });
                          } else {
                            setNewUser({ ...newUser, nivel: val });
                          }
                        }}>
                         <option value="">Selecione...</option>
                         <option value="USER">Usuário Comum</option>
                         <option value="ADMIN">Administrador</option>
                      </select>
                   </div>
                   <button disabled={loading} className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl">
                      {loading ? <RefreshCw className="animate-spin" /> : 'Salvar Militar'}
                   </button>
                </form>

                <div className="space-y-3">
                   <p className="text-[10px] font-black uppercase text-gray-400 pl-2">Militares Cadastrados</p>
                   {users.map(user => (
                     <div key={user.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                        <div>
                           <p className="font-bold text-sm">{user.nome}</p>
                           <p className="text-[10px] text-gray-400 font-mono italic">{user.login} • {user.nivel}</p>
                        </div>
                     </div>
                   ))}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEPILoanModal && editingBombeiro && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowEPILoanModal(false); setEditingBombeiro(null); }} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-w-lg rounded-[40px] p-10 shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-8">
                   <div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter">Cautela de EPI</h3>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{editingBombeiro.nome_guerra} • {editingBombeiro.saram}</p>
                   </div>
                   <button onClick={() => { setShowEPILoanModal(false); setEditingBombeiro(null); }} className="p-3 hover:bg-gray-100 rounded-full"><X size={24}/></button>
                </div>
                
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const selectedPecas: any[] = [];
                  let hasError = false;

                  EPI_COMPONENTS.forEach(comp => {
                    const number = (form.elements.namedItem(`number_${comp}`) as HTMLInputElement).value;
                    const selectedCat = (form.elements.namedItem(`category_${comp}`) as HTMLSelectElement).value;
                    
                    if (number) {
                      // Buscar pelo número de controle 001-999 em vez do BMP
                      // Garantir o preenchimento com zeros à esquerda (ex: 1 -> 001) para comparação correta
                      const paddedNumber = number.padStart(3, '0');
                      const mat = materiais.find(m => {
                        const mNum = String(m.epi_numero || m.bmp || '').trim().padStart(3, '0');
                        const mItem = String(m.item_epi || m.descricao || '').toUpperCase().trim();
                        const mDesc = String(m.descricao || '').toUpperCase().trim();
                        const mCat = String(m.categoria || '').toUpperCase().trim();
                        const targetCat = selectedCat.toUpperCase().trim();

                        const isRightNumber = mNum === paddedNumber;
                        const isRightComponent = mItem === comp || (mItem === '' && mDesc.includes(comp));
                        const isRightCategory = mCat === targetCat;

                        return isRightNumber && isRightComponent && isRightCategory;
                      });
                      if (!mat) {
                        alert(`Atenção: A peça Nº ${number} de ${comp} (${selectedCat === 'EPI_PRETO' ? 'PRETO' : 'AMARELO'}) não foi localizada. Verifique o número e a cor.`);
                        hasError = true;
                        return;
                      }
                      if (mat.situacao !== 'PERFEITO' && mat.situacao !== 'ITEM DESCARACTZ') {
                        alert(`Atenção: A peça #${number} está com situação "${mat.situacao}" e não deve ser emprestada.`);
                        hasError = true;
                        return;
                      }
                      
                      // Para EPIs individuais (identificados por epi_numero), se a quantidade estiver vazia, assumimos 1. 
                      // Se houver valor numérico, respeitamos ele.
                      const rawQty = String(mat.quantidade || "").trim();
                      const qty = rawQty === "" ? 1 : parseInt(rawQty);

                      if (qty <= 0) {
                        alert(`Atenção: A peça #${number} (${comp}) está com estoque zerado.`);
                        hasError = true;
                        return;
                      }
                      selectedPecas.push({ 
                        type: comp, 
                        number,
                        size: mat.tamanho || 'N/A',
                        category: mat.categoria
                      });
                    }
                  });

                  if (hasError) return;

                  if (selectedPecas.length === 0) {
                    alert('Selecione pelo menos uma peça de EPI!');
                    return;
                  }

                  setLoading(true);
                  try {
                    const res = await authenticatedFetch(SCRIPT_URL, {
                      method: 'POST',
                      headers: { 'Content-Type': 'text/plain' },
                      body: JSON.stringify({
                        action: 'create_epi_loan',
                        bombeiro_id: editingBombeiro.id,
                        pecas_json: JSON.stringify(selectedPecas),
                        telefone: epiLoanExtras.telefone,
                        ramal: epiLoanExtras.ramal,
                        setor: epiLoanExtras.setor,
                        executor: currentUser?.login
                      })
                    });
                    const resData = await res.json();
                    if (!resData.success) {
                       alert("Erro ao salvar cautela: " + (resData.message || "Desconhecido"));
                       setLoading(false);
                       return;
                    }

                    // Gerar PDF da Cautela de EPI
                    generateEpiLoanReceipt(editingBombeiro, selectedPecas, epiLoanExtras, currentUser?.nome || 'Admin');

                    setShowEPILoanModal(false);
                    setEditingBombeiro(null);
                    alert('Cautela de EPI enviada! O banco de dados será atualizado em breve.');
                    setTimeout(() => {
                      fetchEpiLoans();
                      executeFilter('EPI');
                      setLoading(false);
                    }, 1500);
                  } catch (err) { 
                    alert('Erro ao registrar cautela');
                    setLoading(false);
                  }
                }} className="space-y-6">
                   <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-6">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest pl-1">Cor Predominante (Afeta apenas seleção inicial)</p>
                      <div className="flex gap-4">
                         <button
                           type="button"
                           onClick={() => setEpiLoanExtras({...epiLoanExtras, categoria: 'EPI_PRETO'})}
                           className={cn(
                             "flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ring-1",
                             epiLoanExtras.categoria === 'EPI_PRETO' 
                               ? "bg-slate-900 text-white ring-slate-900 shadow-lg shadow-slate-900/20" 
                               : "bg-white text-slate-400 ring-slate-100 hover:bg-slate-50"
                           )}
                         >
                           EPI Preto
                         </button>
                         <button
                           type="button"
                           onClick={() => setEpiLoanExtras({...epiLoanExtras, categoria: 'EPI_AMARELO'})}
                           className={cn(
                             "flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ring-1",
                             epiLoanExtras.categoria === 'EPI_AMARELO' 
                               ? "bg-yellow-500 text-yellow-950 ring-yellow-500 shadow-lg shadow-yellow-500/30" 
                               : "bg-white text-slate-400 ring-slate-100 hover:bg-slate-50"
                           )}
                         >
                           EPI Amarelo
                         </button>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {EPI_COMPONENTS.map(comp => (
                        <div key={comp} className="space-y-2 flex flex-col">
                           <label htmlFor={`epi-loan-${comp}`} className="modal-label">{comp}</label>
                           <div className="flex bg-gray-50 p-1 border border-gray-200 rounded-2xl w-full">
                              <select key={`cat_${comp}_${epiLoanExtras.categoria}`} name={`category_${comp}`} defaultValue={epiLoanExtras.categoria} className="bg-transparent text-xs font-bold px-2 outline-none border-r border-gray-200 text-gray-500 w-[110px]">
                                <option value="EPI_PRETO">PRETO</option>
                                <option value="EPI_AMARELO">AMARELO</option>
                              </select>
                              <input 
                               id={`epi-loan-${comp}`}
                               name={`number_${comp}`}
                               className="bg-transparent flex-1 px-3 py-3 text-sm outline-none w-full" 
                               placeholder="Nº (Ex: 001)" 
                              />
                           </div>
                        </div>
                      ))}
                   </div>

                   <div className="space-y-4 border-t border-gray-100 pt-6">
                      <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Dados de Contato do Solicitante</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="modal-label">Telefone (xx)-xxxxxxxxx</label>
                           <input 
                             required 
                             className="modal-input" 
                             value={epiLoanExtras.telefone} 
                             onChange={e => {
                               const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                               let formatted = digits;
                               if (digits.length > 2) {
                                 formatted = `(${digits.slice(0, 2)})${digits.slice(2)}`;
                               }
                               setEpiLoanExtras({...epiLoanExtras, telefone: formatted});
                             }} 
                             placeholder="(00)000000000" 
                           />
                        </div>
                        <div>
                           <label className="modal-label">Ramal (4 dígitos)</label>
                           <input 
                             required 
                             className="modal-input" 
                             maxLength={4}
                             value={epiLoanExtras.ramal} 
                             onChange={e => setEpiLoanExtras({...epiLoanExtras, ramal: e.target.value.replace(/\D/g, '')})} 
                             placeholder="0000" 
                           />
                        </div>
                      </div>
                      <div>
                         <label className="modal-label">Setor Atual do Militar</label>
                         <input required className="modal-input" value={epiLoanExtras.setor} onChange={e => setEpiLoanExtras({...epiLoanExtras, setor: e.target.value.toUpperCase()})} placeholder="Ex: Garagem, SCI, etc" />
                      </div>
                   </div>

                   <div className="bg-gray-50 p-6 rounded-3xl border border-dashed border-gray-200">
                      <p className="text-[10px] text-gray-400 font-black uppercase mb-2">Instrução</p>
                      <p className="text-xs text-gray-600 leading-relaxed italic">Digite a numeração apenas das peças que estão sendo entregues ao militar agora.</p>
                   </div>

                   <button disabled={loading || epiLoanExtras.ramal.length !== 4} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-red-700 mt-4 flex items-center justify-center gap-2">
                      {loading ? <RefreshCw className="animate-spin" size={20} /> : <><Shield size={20} /> Confirmar Cautela de EPI</>}
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showLabelConfig && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLabelConfig(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white w-full max-w-lg rounded-3xl md:rounded-[40px] p-6 md:p-10 shadow-2xl overflow-y-auto max-h-[95vh]"
          >
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight uppercase">Configurações de Etiquetas</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Ajuste o layout antes de gerar o PDF</p>
              </div>
              <button onClick={() => setShowLabelConfig(false)} className="p-3 hover:bg-gray-100 rounded-full"><X size={24}/></button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="modal-label">Margem Superior (mm)</label>
                <input 
                  type="number" 
                  className="modal-input" 
                  value={labelConfig.marginY} 
                  onChange={e => setLabelConfig({...labelConfig, marginY: Number(e.target.value)})} 
                />
              </div>
              <div className="space-y-2">
                <label className="modal-label">Margem Esquerda (mm)</label>
                <input 
                  type="number" 
                  className="modal-input" 
                  value={labelConfig.marginX} 
                  onChange={e => setLabelConfig({...labelConfig, marginX: Number(e.target.value)})} 
                />
              </div>
              <div className="space-y-2">
                <label className="modal-label">Colunas por Linha</label>
                <input 
                  type="number" 
                  className="modal-input" 
                  value={labelConfig.labelsPerRow} 
                  onChange={e => setLabelConfig({...labelConfig, labelsPerRow: Number(e.target.value)})} 
                />
              </div>
              <div className="space-y-2">
                <label className="modal-label">Linhas por Página</label>
                <input 
                  type="number" 
                  className="modal-input" 
                  value={labelConfig.labelsPerCol} 
                  onChange={e => setLabelConfig({...labelConfig, labelsPerCol: Number(e.target.value)})} 
                />
              </div>
              <div className="space-y-2">
                <label className="modal-label">Largura Etiqueta (mm)</label>
                <input 
                  type="number" 
                  className="modal-input" 
                  value={labelConfig.labelWidth} 
                  onChange={e => setLabelConfig({...labelConfig, labelWidth: Number(e.target.value)})} 
                />
              </div>
              <div className="space-y-2">
                <label className="modal-label">Altura Etiqueta (mm)</label>
                <input 
                  type="number" 
                  className="modal-input" 
                  value={labelConfig.labelHeight} 
                  onChange={e => setLabelConfig({...labelConfig, labelHeight: Number(e.target.value)})} 
                />
              </div>
              <div className="space-y-2">
                <label className="modal-label">Espaçamento Horiz. (mm)</label>
                <input 
                  type="number" 
                  className="modal-input" 
                  value={labelConfig.gapX} 
                  onChange={e => setLabelConfig({...labelConfig, gapX: Number(e.target.value)})} 
                />
              </div>
              <div className="space-y-2">
                <label className="modal-label">Espaçamento Vert. (mm)</label>
                <input 
                  type="number" 
                  className="modal-input" 
                  value={labelConfig.gapY} 
                  onChange={e => setLabelConfig({...labelConfig, gapY: Number(e.target.value)})} 
                />
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button 
                onClick={() => setLabelConfig({
                  labelWidth: 60,
                  labelHeight: 25,
                  marginX: 15,
                  marginY: 25,
                  gapX: 10,
                  gapY: 5,
                  labelsPerRow: 2,
                  labelsPerCol: 8
                })}
                className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-all"
              >
                Resetar Padrão
              </button>
              <button 
                onClick={() => {
                  const sectorItems = materiais.filter(m => m.setor === inventoryState.sector);
                  generateLabelsPDF(sectorItems, labelConfig);
                  setShowLabelConfig(false);
                }}
                className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-600/25 hover:bg-blue-700 transition-all"
              >
                Gerar PDF com Configurações
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .nav-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-radius: 20px;
          color: #94a3b8;
          font-weight: 700;
          font-size: 14px;
          transition: all 0.2s;
        }
        .nav-btn.active {
          background-color: #dc2626;
          color: white;
          box-shadow: 0 10px 20px rgba(220, 38, 38, 0.2);
        }
        .filter-label {
          display: block;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          color: #94a3b8;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
          padding-left: 4px;
        }
        .filter-input {
          width: 100%;
          padding: 12px 16px;
          background-color: #f8fafc;
          border-radius: 16px;
          font-size: 14px;
          border: 2px solid transparent;
          transition: all 0.2s;
          outline: none;
          color: #1e293b;
        }
        .filter-input:focus {
          border-color: #dc2626;
          background-color: white;
        }
        .toggle-btn {
          display: inline-flex;
          align-items: center;
          cursor: pointer;
        }
        .toggle-box {
          position: relative;
          width: 44px;
          height: 24px;
          background-color: #e2e8f0;
          border-radius: 100px;
          transition: all 0.2s;
        }
        .toggle-box::after {
          content: "";
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background-color: white;
          border-radius: 50%;
          transition: all 0.2s;
        }
        .peer:checked + .toggle-box::after {
          transform: translateX(20px);
        }
        .table-header {
          padding: 24px;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          color: #64748b;
          letter-spacing: 0.1em;
        }
        .ctrl-btn {
          padding: 10px;
          border-radius: 14px;
          transition: all 0.2s;
        }
        .export-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .action-btn-main {
           display: flex;
           align-items: center;
           gap: 10px;
           padding: 16px 24px;
           border-radius: 20px;
           font-weight: 900;
           text-transform: uppercase;
           font-size: 11px;
           letter-spacing: 0.1em;
           transition: all 0.2s;
        }
        .modal-label {
           display: block;
           font-size: 10px;
           font-weight: 900;
           text-transform: uppercase;
           color: #64748b;
           margin-bottom: 8px;
        }
        .modal-input {
           width: 100%;
           padding: 16px;
           background-color: #f8fafc;
           border-radius: 20px;
           border: 2px solid transparent;
           outline: none;
           transition: all 0.2s;
           color: #1e293b;
        }
        .modal-input:focus {
           border-color: #dc2626;
           background-color: white;
        }
      `}} />
    </div>
  );
}