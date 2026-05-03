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

// Libs e Tipos
import { User, Material, Loan, Avaria, Sector, AuditRow, Bombeiro, EPILoan, StockPayout, LabelConfig } from './types';
import { 
  generatePDFReport, exportToExcel, generateLoanReceipt, 
  generateEpiLoanReceipt, generateLabelsPDF, generateComparisonPDF 
} from './lib/exportUtils';

// Constantes e Utilitários
import { 
  SCRIPT_URL, EPI_FUNCTIONS, CATEGORIES, EPI_COMPONENTS, 
  SUB_CATEGORIES, SITUACOES, TERMS_TEXT 
} from './constants';
import { getMaterialQty, isOverdue } from './utils';
import { cn } from './lib/utils';

// Componentes de Visualização
import { DashboardView } from './components/views/DashboardView';
import { AdminView } from './components/views/AdminView';
import { LoansView } from './components/views/LoansView';
import { AuditView } from './components/views/AuditView';
import { InventoryView } from './components/views/InventoryView';
import { CompareView } from './components/views/CompareView';
import { ClearanceView } from './components/views/ClearanceView';
import { StockManagementView } from './components/views/StockManagementView';
import { AgentesManagementView } from './components/views/AgentesManagementView';
import { EpiView } from './components/views/EpiView';
import { EprView } from './components/views/EprView';

// Modais
import { MaterialModal } from './components/modals/MaterialModal';
import { LoanModal } from './components/modals/LoanModal';
import { UserModal } from './components/modals/UserModal';
import { ReturnLoanModal } from './components/modals/ReturnLoanModal';
import { LabelConfigModal } from './components/modals/LabelConfigModal';
import { EPIDetailsModal } from './components/modals/EPIDetailsModal';
import { SectorModal } from './components/modals/SectorModal';
import { EPILoanModal } from './components/modals/EPILoanModal';
import { EprRecargaModal } from './components/modals/EprRecargaModal';

// Componentes Base e Layout
import { InventoryScanner } from './components/InventoryScanner';
import { Loader } from './components/common/Loader';
import { ScrollToTopButton } from './components/common/ScrollToTop';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/common/ToastContainer';
import { LoginView } from './components/views/LoginView';

// Hooks customizados
import { useAuth } from './useAuth';
import { useInventory } from './useInventory';
import { useInventoryActions } from './useInventoryActions';
import { usePresence } from './usePresence';

export default function App() {
  const { currentUser, setCurrentUser, logout, authenticatedFetch, sessionToken, setSessionToken } = useAuth();
  const { 
    loading, setLoading, materiais, rawMateriais, sectores, users, loans, auditLogs, 
    bombeiros, epiLoans, stockPayouts, stats, filters, setFilters, 
    hasSearched, executeFilter, eprWarnings, epiWarnings, agentesWarnings,
    fetchAll, serverTimeOffset,
    fetchLoans, fetchBombeiros, fetchEPILoans, fetchUsers, fetchSectores,
    fetchStockPayouts
  } = useInventory(authenticatedFetch, currentUser);

  const { 
    saveMaterial, deleteMaterial, saveUser, deleteUser, 
    saveBombeiro, deleteBombeiro, saveSector, deleteSector, createLoan 
  } = useInventoryActions(
    authenticatedFetch, currentUser, () => {
      executeFilter(view);
      fetchAll();
    }, rawMateriais, setLoading
  );

  const { onlineUsers } = usePresence(currentUser, authenticatedFetch);

  // --- Estados de Navegação e UI ---
  const [view, setView] = useState<'LOGIN' | 'DASHBOARD' | 'ADMIN' | 'LOANS' | 'AUDIT' | 'EPI' | 'EPR' | 'INVENTORY' | 'STOCK' | 'COMPARE' | 'AGENTES' | 'CLEARANCE'>(() => {
    return (localStorage.getItem('sescinc_view') as any) || 'LOGIN';
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEpiMenuOpen, setIsEpiMenuOpen] = useState(false);
  const [isAgentesMenuOpen, setIsAgentesMenuOpen] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  // --- Estados das Views ---
  const [dashboardView, setDashboardView] = useState<'STATS' | 'WORKSPACE'>('STATS');
  const [dashboardChartOption, setDashboardChartOption] = useState<'NO_DISCH' | 'ALL'>('NO_DISCH');
  const [barChartOption, setBarChartOption] = useState<'NO_DISCH' | 'ALL'>('NO_DISCH');
  const [barChartMeasure, setBarChartMeasure] = useState<'QTY' | 'UNITS'>('QTY');
  const [loanStatusFilter, setLoanStatusFilter] = useState<'ALL' | 'EMPRESTADO' | 'DEVOLVIDO'>('ALL');
  const [epiSubView, setEpiSubView] = useState<'GESTAO' | 'CADASTRO'>('GESTAO');
  const [eprSubView, setEprSubView] = useState<'LISTA' | 'CADASTRO'>('LISTA');
  const [agentesSubView, setAgentesSubView] = useState<'LGE' | 'PQS'>('LGE');

  const [isBombeiroCadastroOpen, setIsBombeiroCadastroOpen] = useState(false);
  const [isEpiCadastroOpen, setIsEpiCadastroOpen] = useState(false);
  const [epiListFilterColor, setEpiListFilterColor] = useState('');
  const [epiListFilterType, setEpiListFilterType] = useState('');
  const [epiListFilterSize, setEpiListFilterSize] = useState('');
  const [epiListFilterStatus, setEpiListFilterStatus] = useState('');
  const [epiFilterType, setEpiFilterType] = useState('');
  const [epiFilterSize, setEpiFilterSize] = useState('');
  const [bombeiroSearch, setBombeiroSearch] = useState('');

  // --- Estados de Modais e Edição ---
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Partial<Material> | null>(null);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showSectorModal, setShowSectorModal] = useState(false);
  const [showEPILoanModal, setShowEPILoanModal] = useState(false);
  const [showEprRecargaModal, setShowEprRecargaModal] = useState(false);
  const [showLabelConfig, setShowLabelConfig] = useState(false);
  
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [newUser, setNewUser] = useState<Partial<User>>({ nome: '', login: '', senha: '123456', nivel: 'USER' });
  const [newBombeiro, setNewBombeiro] = useState<Partial<Bombeiro>>({ nome_guerra: '', saram: '', tipo: 'INTERNO', funcao: 'COMBATENTE' });
  const [editingBombeiro, setEditingBombeiro] = useState<Partial<Bombeiro> | null>(null);
  const [eprToRecarga, setEprToRecarga] = useState<Partial<Material> | null>(null);
  
  const [selectedForLoan, setSelectedForLoan] = useState<number[]>([]);
  const [loanQuantities, setLoanQuantities] = useState<Record<number, number>>({});
  const [returningLoanId, setReturningLoanId] = useState<any>(null);
  const [selectedReturnStatus, setSelectedReturnStatus] = useState('PERFEITO');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [newSectorName, setNewSectorName] = useState('');

  const [showResetPasswordScreen, setShowResetPasswordScreen] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginForm, setLoginForm] = useState({ login: '', senha: '' });
  const [resetPasswordForm, setResetPasswordForm] = useState({ novaSenha: '', confirmarSenha: '' });
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [newLoan, setNewLoan] = useState({ 
    solicitante: '', telefone: '', ramal: '', setor: '', previsao: '' 
  });
  const [epiLoanExtras, setEpiLoanExtras] = useState<any>({
    telefone: '', ramal: '', setor: '', categoria: 'EPI_PRETO'
  });

  const [labelConfig, setLabelConfig] = useState<LabelConfig>({
    labelWidth: 60, labelHeight: 25, marginX: 15, marginY: 25,
    gapX: 10, gapY: 5, labelsPerRow: 2, labelsPerCol: 8
  });

  const [toasts, setToasts] = useState<{id: number, msg: string, type: 'join' | 'leave' | 'info' | 'error'}[]>([]);
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [showMissingInListUI, setShowMissingInListUI] = useState(false);
  const [compareInput, setCompareInput] = useState('');
  const [auditFilter, setAuditFilter] = useState('');

  // --- Estado de Inventário ---
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

  const [eprRecargaDate, setEprRecargaDate] = useState('');
  const [eprProximaRecargaDate, setEprProximaRecargaDate] = useState('');
  const [eprAvisoRecarga, setEprAvisoRecarga] = useState('');

  // --- Efeitos de Carregamento ---
  useEffect(() => {
    if (!currentUser || view === 'LOGIN') return;
    fetchAll();
    executeFilter(view);
    localStorage.setItem('sescinc_view', view);
  }, [view, currentUser]);

  const addToast = (msg: string, type: 'join' | 'leave' | 'info' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  // --- Lógica de Negócio Complementar ---
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const userToSave = editingUser?.id ? editingUser : newUser;
    const res = await saveUser(userToSave);
    if (res.success) {
      setShowUserModal(false);
      setEditingUser(null);
      setNewUser({ nome: '', login: '', senha: '123456', nivel: 'USER' });
      fetchUsers();
    }
  };

  const handleSaveBombeiro = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = editingBombeiro?.id ? editingBombeiro : newBombeiro;
    const res = await saveBombeiro(dataToSave);
    if (res.success) {
      setIsBombeiroCadastroOpen(false);
      setEditingBombeiro(null);
      setNewBombeiro({ nome_guerra: '', saram: '', tipo: 'INTERNO', funcao: 'COMBATENTE' });
      fetchBombeiros();
    }
  };

  const handleSaveMaterial = async (e: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    const res = await saveMaterial(editingMaterial || {});
    if (res.success) {
      setShowMaterialModal(false);
      setEditingMaterial(null);
    }
  };

  const handleSaveSector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectorName) return;
    const res = await saveSector(newSectorName);
    if (res.success) {
      setNewSectorName('');
      fetchSectores();
    }
  };

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const mats = materiais.filter(m => selectedForLoan.includes(m.id));
    const res = await createLoan(newLoan, mats, loanQuantities);
    if (res.success) {
      setShowLoanModal(false);
      setSelectedForLoan([]);
      setLoanQuantities({});
      setNewLoan({ solicitante: '', telefone: '', ramal: '', setor: '', previsao: '' });
    }
  };

  const agentesWarningsBadgeCount = agentesWarnings.length;
  const eprWarningsBadgeCount = eprWarnings.length;
  const epiWarningsBadgeCount = epiWarnings.length;

  const compareBmps = async () => {
    if (!compareInput.trim()) return;
    
    setLoading(true);
    try {
      const res = await authenticatedFetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'read', fora_de_carga: 'all' })
      });
      const data = await res.json();

      if (!Array.isArray(data)) {
        addToast('Erro ao buscar dados para comparação', 'error');
        return;
      }

      const allMaterials = data as Material[];
      const inputBmps = compareInput.split(/[\n,;\t]/).map(s => s.trim().toUpperCase()).filter(s => s.length > 0);
      const uniqueInput = Array.from(new Set(inputBmps));
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
      if (err instanceof Error && err.message === 'Invalid Session') return;
      console.error(err);
      addToast('Erro ao realizar comparação', 'error');
    } finally {
      setLoading(false);
    }
  };
  const clearCompareForm = () => { setCompareInput(''); setComparisonResult(null); };

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
        return String(a.bmp || "").localeCompare(String(b.bmp || ""));
      });

    if (sorted.length === 0) {
      alert("Nenhum item com Conta e Classe para o relatório.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Relatório Analítico</title>
          <style>
            body { font-family: sans-serif; padding: 20px; font-size: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #000; padding: 5px; text-align: left; }
            h1 { font-size: 14px; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <h1>SESCINC-CO - Relatório Analítico de Bens</h1>
          <p>Gerado em: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>CONTA</th>
                <th>CLASSE</th>
                <th>BMP</th>
                <th>DESCRIÇÃO</th>
                <th>SETOR</th>
                <th>SITUAÇÃO</th>
              </tr>
            </thead>
            <tbody>
              ${sorted.map(i => `
                <tr>
                  <td>${i.conta}</td>
                  <td>${i.classe}</td>
                  <td>${i.bmp}</td>
                  <td>${i.descricao}</td>
                  <td>${i.setor}</td>
                  <td>${i.situacao}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div style="margin-top: 30px; border-top: 1px solid #000; width: 200px; text-align: center;">
            <p>${currentUser?.nome}</p>
            <p>Responsável</p>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
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
          await fetchEPILoans();
        } else {
          await fetchLoans();
          await executeFilter(view);
        }
        setLoading(false);
      }, 3000);

    } catch (err) {
      if (err instanceof Error && err.message === 'Invalid Session') return;
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
    setLoginError('');
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
        setLoginError(data.message || 'Login falhou. Verifique suas credenciais.');
      }
    } catch (err) {
      setLoginError('Erro de conexão com o servidor do Google');
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
      if (err instanceof Error && err.message === 'Invalid Session') return;
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
      if (err instanceof Error && err.message === 'Invalid Session') return;
      alert('Erro ao resetar senha');
    } finally {
      setLoading(false);
    }
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

  // Login View
  if (view === 'LOGIN' && !currentUser) {
    return (
      <LoginView 
        loginData={loginForm}
        setLoginData={setLoginForm}
        handleLogin={handleLogin}
        loading={loading}
        loginError={loginError}
      />
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
      <Sidebar 
        view={view}
        setView={setView}
        currentUser={currentUser}
        logout={handleLogout}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        loans={loans}
        agentesWarningsBadgeCount={agentesWarningsBadgeCount}
        eprWarningsBadgeCount={eprWarningsBadgeCount}
        epiWarningsBadgeCount={epiWarningsBadgeCount}
        onlineUsers={onlineUsers}
        generateAnalyticReport={generateAnalyticReport}
        isAgentesMenuOpen={isAgentesMenuOpen}
        setIsAgentesMenuOpen={setIsAgentesMenuOpen}
        setAgentesSubView={setAgentesSubView}
        agentesSubView={agentesSubView}
        isEpiMenuOpen={isEpiMenuOpen}
        setIsEpiMenuOpen={setIsEpiMenuOpen}
        showAdminMenu={showAdminMenu}
        setShowAdminMenu={setShowAdminMenu}
        showSettingsMenu={showSettingsMenu}
        setShowSettingsMenu={setShowSettingsMenu}
        setShowSectorModal={setShowSectorModal}
      />

      {/* Notifications Layer */}
      <ToastContainer toasts={toasts} />

      {/* Main Container */}
      <main id="main-scroll-area" className="flex-1 p-3 md:p-10 overflow-y-auto h-[100dvh] w-full relative">
        {/* Mobile Header (Fixed/Sticky at top) */}
        <Header setIsMobileMenuOpen={setIsMobileMenuOpen} />

        <div className="view-content">
          {view === 'DASHBOARD' && (
            <DashboardView 
              dashboardView={dashboardView}
              setDashboardView={setDashboardView}
              stats={stats}
              barChartOption={barChartOption}
              setBarChartOption={(v: any) => setBarChartOption(v)}
              barChartMeasure={barChartMeasure}
              setBarChartMeasure={(v: any) => setBarChartMeasure(v)}
              dashboardChartOption={dashboardChartOption}
              setDashboardChartOption={(v: any) => setDashboardChartOption(v)}
              filters={filters}
              setFilters={setFilters}
              executeFilter={executeFilter}
              sectores={sectores}
              materiais={materiais}
              loading={loading}
              currentUser={currentUser}
              setEditingMaterial={setEditingMaterial}
              setShowMaterialModal={setShowMaterialModal}
              hasSearched={hasSearched}
              selectedForLoan={selectedForLoan}
              setSelectedForLoan={setSelectedForLoan}
              setShowLoanModal={setShowLoanModal}
              deleteMaterial={(m: Material) => deleteMaterial(m.id, m.categoria)}
              setView={setView as any}
            />
          )}

          {view === 'CLEARANCE' && (
             <ClearanceView 
               loans={loans}
               epiLoans={epiLoans}
               bombeiros={bombeiros}
               rawMateriais={rawMateriais}
               materiais={materiais}
               filters={filters}
               setFilters={setFilters}
             />
          )}


          {view === 'STOCK' && <StockManagementView 
            materiais={materiais} 
            stockPayouts={stockPayouts}
            loading={loading}
            onRefresh={() => executeFilter(view)}
            showDischarged={filters.exibir_descarregados}
            onToggleDischarged={(val) => {
              const nextFilters = { ...filters, exibir_descarregados: val };
              setFilters(nextFilters);
              executeFilter(view, nextFilters);
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
                  executeFilter(view);
                  fetchStockPayouts();
                  return true;
                } else {
                  alert(data.message);
                  return false;
                }
              } catch (err) {
                if (err instanceof Error && err.message === 'Invalid Session') return false;
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
            onEdit={(m) => { setEditingMaterial(m); setShowMaterialModal(true); }}
            onDelete={(m: Material) => deleteMaterial(m.id, m.categoria)}
          />}

          {view === 'LOANS' && (
             <LoansView 
               loans={loans}
               materiais={rawMateriais}
               loanStatusFilter={loanStatusFilter}
               setLoanStatusFilter={setLoanStatusFilter}
               setShowLoanModal={setShowLoanModal}
               handleReturnLoan={handleReturnLoan}
             />
          )}


          {view === 'ADMIN' && (
             <AdminView 
               users={users}
               newUser={newUser}
               setNewUser={setNewUser}
             saveUser={handleSaveUser}
               deleteUser={deleteUser}
               adminResetUserPassword={adminResetUserPassword}
               setEditingUser={setEditingUser}
               setShowUserModal={setShowUserModal}
               generateAnalyticReport={generateAnalyticReport}
             />
          )}

          {view === 'EPI' && (
            <EpiView 
              epiSubView={epiSubView}
              setEpiSubView={setEpiSubView}
              epiWarnings={epiWarnings}
              currentUser={currentUser}
              isBombeiroCadastroOpen={isBombeiroCadastroOpen}
              setIsBombeiroCadastroOpen={setIsBombeiroCadastroOpen}
              editingBombeiro={editingBombeiro}
              setEditingBombeiro={setEditingBombeiro}
              newBombeiro={newBombeiro}
              setNewBombeiro={setNewBombeiro}
              saveBombeiro={handleSaveBombeiro}
              bombeiroSearch={bombeiroSearch}
              setBombeiroSearch={setBombeiroSearch}
              epiFilterType={epiFilterType}
              setEpiFilterType={setEpiFilterType}
              epiFilterSize={epiFilterSize}
              setEpiFilterSize={setEpiFilterSize}
              materiais={materiais}
              epiLoans={epiLoans}
              bombeiros={bombeiros}
              returnEPI={returnEPI}
              setShowEPILoanModal={setShowEPILoanModal}
              isEpiCadastroOpen={isEpiCadastroOpen}
              setIsEpiCadastroOpen={setIsEpiCadastroOpen}
              editingMaterial={editingMaterial}
              setEditingMaterial={setEditingMaterial}
              loading={loading}
              saveMaterial={async (e, mat) => {
                if (e && e.preventDefault) e.preventDefault();
                return saveMaterial(mat);
              }}
              executeFilter={() => executeFilter(view)}
              sectores={sectores}
              authenticatedFetch={authenticatedFetch}
              epiListFilterColor={epiListFilterColor}
              setEpiListFilterColor={setEpiListFilterColor}
              epiListFilterType={epiListFilterType}
              setEpiListFilterType={setEpiListFilterType}
              epiListFilterSize={epiListFilterSize}
              setEpiListFilterSize={setEpiListFilterSize}
              epiListFilterStatus={epiListFilterStatus}
              setEpiListFilterStatus={setEpiListFilterStatus}
              deleteMaterial={(m: Material) => deleteMaterial(m.id, m.categoria)}
              deleteBombeiro={deleteBombeiro}
            />
          )}

          {view === 'EPR' && (
             <EprView 
               materiais={materiais}
               loans={loans}
               sectores={sectores}
               currentUser={currentUser}
               loading={loading}
               saveMaterial={async (e, mat) => {
                 if (e && e.preventDefault) e.preventDefault();
                 return saveMaterial(mat);
               }}
               deleteMaterial={(m: Material) => deleteMaterial(m.id, m.categoria)}
               eprWarnings={eprWarnings}
               setEditingMaterial={setEditingMaterial}
               editingMaterial={editingMaterial}
               setEprToRecarga={setEprToRecarga}
               setEprRecargaDate={setEprRecargaDate}
               setEprProximaRecargaDate={setEprProximaRecargaDate}
               setEprAvisoRecarga={setEprAvisoRecarga}
               setShowEprRecargaModal={setShowEprRecargaModal}
               eprSubView={eprSubView}
               setEprSubView={setEprSubView}
             />
          )}
          {view === 'AGENTES' && (
             <AgentesManagementView 
               materiais={materiais}
               rawMateriais={rawMateriais}
               currentUser={currentUser}
               loading={loading}
               saveMaterial={async (e, mat) => {
                 if (e && e.preventDefault) e.preventDefault();
                 return saveMaterial(mat);
               }}
               deleteMaterial={(m: Material) => deleteMaterial(m.id, m.categoria)}
               viewTab={agentesSubView}
               setViewTab={setAgentesSubView}
               sectores={sectores}
               warnings={agentesWarnings}
             />
          )}

          {view === 'INVENTORY' && (
            <InventoryView 
              view={view}
              isScannerOpen={isScannerOpen}
              setIsScannerOpen={setIsScannerOpen}
              inventoryState={inventoryState}
              setInventoryState={setInventoryState}
              materiais={materiais}
              rawMateriais={rawMateriais}
              sectores={sectores}
              currentUser={currentUser}
              saveMaterial={saveMaterial}
              addToast={addToast}
              filters={filters}
              setFilters={setFilters}
              executeFilter={() => executeFilter(view)}
              setShowLabelConfig={setShowLabelConfig}
            />
          )}


          {view === 'AUDIT' && (
            <AuditView 
              auditLogs={auditLogs}
              users={users}
              auditFilter={auditFilter}
              setAuditFilter={setAuditFilter}
            />
          )}

          {view === 'COMPARE' && (
            <CompareView 
              compareInput={compareInput}
              setCompareInput={setCompareInput}
              compareBmps={compareBmps}
              clearCompareForm={clearCompareForm}
              loading={loading}
              comparisonResult={comparisonResult}
              showMissingInListUI={showMissingInListUI}
              setShowMissingInListUI={setShowMissingInListUI}
              generateComparisonPDF={generateComparisonPDF}
            />
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
                          alert(resData.message);
                        }
                      } catch (err) {
                        if (err instanceof Error && err.message === 'Invalid Session') return;
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

      <MaterialModal 
        showMaterialModal={showMaterialModal}
        setShowMaterialModal={setShowMaterialModal}
        editingMaterial={editingMaterial}
        setEditingMaterial={setEditingMaterial}
        saveMaterial={handleSaveMaterial}
        sectores={sectores}
      />

      <SectorModal 
        show={showSectorModal}
        onClose={() => setShowSectorModal(false)}
        loading={loading}
        saveSector={handleSaveSector}
        newSectorName={newSectorName}
        setNewSectorName={setNewSectorName}
        sectores={sectores}
        deleteSector={deleteSector}
      />

      <LoanModal 
        showLoanModal={showLoanModal}
        setShowLoanModal={setShowLoanModal}
        loading={loading}
        materiais={materiais}
        selectedForLoan={selectedForLoan}
        loanQuantities={loanQuantities}
        setLoanQuantities={setLoanQuantities}
        newLoan={newLoan}
        setNewLoan={setNewLoan}
        createLoan={handleCreateLoan}
      />

      <ReturnLoanModal 
        showReturnModal={showReturnModal}
        setShowReturnModal={setShowReturnModal}
        returningLoanId={returningLoanId}
        loans={loans}
        materiais={materiais}
        selectedReturnStatus={selectedReturnStatus}
        setSelectedReturnStatus={setSelectedReturnStatus}
        confirmReturnLoan={confirmReturnLoan}
        loading={loading}
      />

      <UserModal 
        showUserModal={showUserModal}
        setShowUserModal={setShowUserModal}
        editingUser={editingUser}
        setEditingUser={setEditingUser}
        saveUser={handleSaveUser}
        newUser={newUser}
        setNewUser={setNewUser}
        users={users}
        loading={loading}
      />

      <EPILoanModal 
        show={showEPILoanModal}
        onClose={() => { setShowEPILoanModal(false); setEditingBombeiro(null); }}
        loading={loading}
        editingBombeiro={editingBombeiro}
        epiLoanExtras={epiLoanExtras}
        setEpiLoanExtras={setEpiLoanExtras}
        onSubmit={async (e) => {
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
                bombeiro_id: editingBombeiro?.id,
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
            generateEpiLoanReceipt(editingBombeiro as any, selectedPecas, epiLoanExtras, currentUser?.nome || 'Admin');

            setShowEPILoanModal(false);
            setEditingBombeiro(null);
            alert('Cautela de EPI enviada! O banco de dados será atualizado em breve.');
            setTimeout(() => {
              fetchEPILoans();
              executeFilter(view);
              setLoading(false);
            }, 1500);
          } catch (err) { 
            if (err instanceof Error && err.message === 'Invalid Session') return;
            alert('Erro ao registrar cautela');
            setLoading(false);
          }
        }}
      />


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
