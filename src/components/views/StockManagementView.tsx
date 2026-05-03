import React, { useState } from 'react';
import { 
  Plus, Search, RefreshCw, Package, Trash2, Edit, 
  ArrowRightLeft, History, Filter, Boxes, X, Save,
  CheckCircle, AlertCircle, User, MapPin, Calendar, Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Material, Sector, StockPayout } from '../../types';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StockManagementViewProps {
  materiais: Material[];
  stockPayouts: StockPayout[];
  loading: boolean;
  onRefresh: () => void;
  onSavePayout: (payout: any) => Promise<boolean>;
  onLoan: (ids: number[]) => void;
  onEdit: (m: Material) => void;
  onDelete: (m: Material) => void;
  sectores: Sector[];
  currentUser: any;
  selectedForLoan: number[];
  setSelectedForLoan: (ids: number[]) => void;
  showDischarged: boolean;
  onToggleDischarged: (val: boolean) => void;
}

export function StockManagementView({ 
  materiais, 
  stockPayouts,
  loading, 
  onRefresh, 
  onSavePayout, 
  onLoan,
  onEdit,
  onDelete,
  sectores,
  currentUser,
  selectedForLoan,
  setSelectedForLoan,
  showDischarged,
  onToggleDischarged
}: StockManagementViewProps) {
  const [filterKeyword, setFilterKeyword] = useState('');
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [payoutForm, setPayoutForm] = useState({
    solicitante: '',
    telefone: '',
    ramal: '',
    setorSolicitante: '',
    setor: '',
    quantidade: 1
  });

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    return `(${digits.slice(0, 2)})${digits.slice(2)}`;
  };
  const [showZeroStockOnly, setShowZeroStockOnly] = useState(false);

  const filtered = materiais.filter(m => {
    const safeDesc = String(m.descricao || '').toLowerCase();
    const safeSetor = String(m.setor || '').toLowerCase();
    const safeBmp = String(m.bmp || '').toLowerCase();
    const kw = filterKeyword.toLowerCase();

    const matchesKeyword = safeDesc.includes(kw) || 
                          safeSetor.includes(kw) ||
                          safeBmp.includes(kw);
    const qty = Number(m.quantidade) || 0;
    const matchesZeroStock = showZeroStockOnly ? qty === 0 : true;
    return matchesKeyword && matchesZeroStock;
  });

  const handleOpenPayout = (m: Material) => {
    setSelectedMaterial(m);
    setPayoutForm({
      solicitante: '',
      telefone: '',
      ramal: '',
      setorSolicitante: '',
      setor: m.setor,
      quantidade: 1
    });
    setShowPayoutModal(true);
  };

  const handleSubmitPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) return;
    
    const qty = Number(payoutForm.quantidade);
    const available = Number(selectedMaterial.quantidade) || 0;
    
    if (qty <= 0) {
      alert('Quantidade deve ser maior que zero');
      return;
    }
    
    if (qty > available) {
      alert(`Estoque insuficiente. Disponível: ${available}`);
      return;
    }

    const success = await onSavePayout({
      material_id: selectedMaterial.id,
      ...payoutForm
    });

    if (success) {
      setShowPayoutModal(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Consumo e Duradouro</h2>
          <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-wider">Gerenciamento de itens de consumo e duradouros</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => setShowHistory(true)}
            className="flex-1 md:flex-none h-11 px-6 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <History size={16} />
            Histórico
          </button>
          <button 
            onClick={() => setShowZeroStockOnly(!showZeroStockOnly)}
            className={cn(
              "flex-1 md:flex-none h-11 px-6 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border",
              showZeroStockOnly ? "bg-red-50 border-red-200 text-red-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            {showZeroStockOnly ? <AlertCircle size={16} /> : <Filter size={16} />}
            {showZeroStockOnly ? "Ver Todos" : "Estoque Zero"}
          </button>
          <button 
            onClick={() => onToggleDischarged(!showDischarged)}
            className={cn(
              "flex-1 md:flex-none h-11 px-6 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border",
              showDischarged ? "bg-amber-50 border-amber-200 text-amber-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            <Filter size={16} />
            {showDischarged ? "Ocultar Desc." : "Exibir Desc."}
          </button>
          <button 
            onClick={onRefresh}
            disabled={loading}
            className="flex-1 md:flex-none h-11 px-6 bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10 disabled:opacity-50"
          >
            <RefreshCw size={16} className={cn(loading && "animate-spin")} />
            {loading ? "Sincronizando..." : "Atualizar"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative group flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-red-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar material de consumo..."
              className="w-full h-12 pl-12 pr-6 bg-white border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
              value={filterKeyword}
              onChange={(e) => setFilterKeyword(e.target.value)}
            />
          </div>
          {selectedForLoan.length > 0 && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onLoan(selectedForLoan)}
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

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 w-10">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-600 cursor-pointer"
                    checked={filtered.length > 0 && filtered.every(item => selectedForLoan.includes(item.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const newIds = filtered.map(item => item.id).filter(id => !selectedForLoan.includes(id));
                        setSelectedForLoan([...selectedForLoan, ...newIds]);
                      } else {
                        const filteredIds = filtered.map(item => item.id);
                        setSelectedForLoan(selectedForLoan.filter(id => !filteredIds.includes(id)));
                      }
                    }}
                  />
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Material</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Setor</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Estoque</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((item) => {
                const qty = Number(item.quantidade) || 0;
                const isSelected = selectedForLoan.includes(item.id);
                return (
                  <tr 
                    key={item.id} 
                    className="hover:bg-slate-50/50 transition-colors group"
                    title={[
                      item.documento ? `Documento: ${item.documento}` : '',
                      item.observacoes ? `Observações: ${item.observacoes}` : ''
                    ].filter(Boolean).join('\n') || undefined}
                  >
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-600 cursor-pointer"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedForLoan([...selectedForLoan, item.id]);
                          else setSelectedForLoan(selectedForLoan.filter(id => id !== item.id));
                        }}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                          qty === 0 ? "bg-red-50 text-red-500" : (item.situacao === 'EMPRESTADO' ? "bg-orange-50 text-orange-500" : "bg-blue-50 text-blue-500")
                        )}>
                          <Package size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 leading-tight group-hover:text-red-600 transition-colors uppercase italic">{item.descricao}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.categoria}</span>
                            {item.situacao === 'EMPRESTADO' && (
                              <span className="text-[8px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-black uppercase tracking-widest">Emprestado</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-lg uppercase tracking-wider">
                        {item.setor}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "inline-flex items-center px-3 py-1 rounded-xl text-xs font-black shadow-sm border",
                        qty === 0 ? "bg-red-600 text-white border-red-700" : "bg-green-50 text-green-700 border-green-100"
                      )}>
                        {qty} unid
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        {currentUser?.nivel === 'ADMIN' && (
                          <>
                            <button 
                              onClick={() => onEdit(item)}
                              className="h-9 w-9 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                              title="Editar Item"
                            >
                              <Edit size={14} />
                            </button>
                            <button 
                              onClick={() => onDelete(item)}
                              className="h-9 w-9 flex items-center justify-center bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                              title="Excluir Item"
                            >
                              <Trash2 size={14} />
                            </button>
                            <div className="w-px h-6 bg-slate-100 my-auto mx-1" />
                          </>
                        )}
                        <button 
                          onClick={() => handleOpenPayout(item)}
                          disabled={qty === 0}
                          className="h-9 px-4 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all flex items-center gap-2 disabled:bg-slate-200 disabled:text-slate-400"
                        >
                          <ArrowRightLeft size={14} />
                          Pagar
                        </button>
                        <button 
                          onClick={() => {
                            if (!isSelected) {
                              const newSelection = [...selectedForLoan, item.id];
                              setSelectedForLoan(newSelection);
                              onLoan(newSelection);
                            } else {
                              onLoan(selectedForLoan);
                            }
                          }}
                          className="h-9 px-4 bg-white text-slate-700 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest hover:border-red-500 hover:text-red-600 transition-all flex items-center gap-2"
                        >
                          <History size={14} />
                          Emprestar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                        <Boxes size={32} />
                      </div>
                      <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Nenhum item encontrado no estoque</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Pagamento */}
      <AnimatePresence>
        {showPayoutModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowPayoutModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shadow-sm">
                      <ArrowRightLeft size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Pagar Material</h3>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Baixa Permanente de Estoque</p>
                    </div>
                  </div>
                  <button onClick={() => setShowPayoutModal(false)} className="bg-slate-50 p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                    <X size={20} />
                  </button>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl mb-8 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Item Selecionado</p>
                  <p className="text-sm font-black text-slate-900 uppercase">{selectedMaterial?.descricao}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-black text-slate-500 bg-white px-2 py-0.5 rounded-lg border border-slate-100 uppercase">
                      Estoque: {selectedMaterial?.quantidade} unid
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmitPayout} className="space-y-6">
                  <div>
                    <label htmlFor="payout-user" className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2 ml-1">Militar / Solicitante</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors" size={18} />
                      <input 
                        id="payout-user"
                        name="payout-user"
                        required
                        type="text" 
                        value={payoutForm.solicitante}
                        onChange={e => setPayoutForm({...payoutForm, solicitante: e.target.value.toUpperCase()})}
                        className="w-full h-12 pl-12 pr-6 bg-slate-50 border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all font-medium uppercase"
                        placeholder="NOME DO MILITAR"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="payout-phone" className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2 ml-1">Telefone</label>
                      <input 
                        id="payout-phone"
                        name="payout-phone"
                        required
                        type="text" 
                        value={payoutForm.telefone}
                        onChange={e => setPayoutForm({...payoutForm, telefone: formatPhone(e.target.value)})}
                        className="w-full h-12 px-6 bg-slate-50 border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all font-medium"
                        placeholder="(xx)xxxxxxxxx"
                      />
                    </div>
                    <div>
                      <label htmlFor="payout-ramal" className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2 ml-1">Ramal</label>
                      <input 
                        id="payout-ramal"
                        name="payout-ramal"
                        required
                        type="text" 
                        maxLength={4}
                        value={payoutForm.ramal}
                        onChange={e => setPayoutForm({...payoutForm, ramal: e.target.value.replace(/\D/g, '')})}
                        className="w-full h-12 px-6 bg-slate-50 border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all font-medium"
                        placeholder="0000"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="payout-sol-sector" className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2 ml-1">Setor do Solicitante</label>
                    <input 
                      id="payout-sol-sector"
                      name="payout-sol-sector"
                      required
                      type="text" 
                      value={payoutForm.setorSolicitante}
                      onChange={e => setPayoutForm({...payoutForm, setorSolicitante: e.target.value.toUpperCase()})}
                      className="w-full h-12 px-6 bg-slate-50 border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all font-medium uppercase"
                      placeholder="SETOR DO MILITAR"
                    />
                  </div>

                  <div>
                    <label htmlFor="payout-sector" className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2 ml-1">Setor Destino</label>
                    <div className="relative group">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors" size={18} />
                      <select 
                        id="payout-sector"
                        name="payout-sector"
                        required
                        value={payoutForm.setor}
                        onChange={e => setPayoutForm({...payoutForm, setor: e.target.value})}
                        className="w-full h-12 pl-12 pr-6 bg-slate-50 border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all font-medium appearance-none"
                      >
                        <option value="">Selecione o setor</option>
                        {sectores.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="payout-qty" className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2 ml-1">Quantidade</label>
                    <div className="relative group">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors" size={18} />
                      <input 
                        id="payout-qty"
                        name="payout-qty"
                        required
                        type="number" 
                        min="1"
                        max={Number(selectedMaterial?.quantidade) || 1}
                        value={payoutForm.quantidade}
                        onChange={e => setPayoutForm({...payoutForm, quantidade: Number(e.target.value)})}
                        className="w-full h-12 pl-12 pr-6 bg-slate-50 border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all font-medium"
                      />
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 mt-2 ml-1 uppercase">Máximo disponível: {selectedMaterial?.quantidade}</p>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setShowPayoutModal(false)}
                      className="flex-1 h-12 border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      disabled={loading || payoutForm.ramal.length !== 4}
                      className="flex-1 h-12 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                    >
                      {loading ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                      Confirmar Pagamento
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Histórico de Pagamentos */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-8 border-b border-slate-50">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
                      <History size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Histórico de Pagamentos</h3>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Registros de baixas de estoque de consumo</p>
                    </div>
                  </div>
                  <button onClick={() => setShowHistory(false)} className="bg-slate-50 p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <table className="w-full">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Material</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Destino / Solicitante</th>
                      <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Qtd</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Executor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[...stockPayouts].reverse().map((payout) => {
                      const material = materiais.find(m => m.id === payout.material_id);
                      return (
                        <tr key={payout.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-slate-900">
                                {new Date(payout.data).toLocaleDateString('pt-BR')}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold">
                                {new Date(payout.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs font-black text-slate-900 uppercase">
                              {material?.descricao || `ID #${payout.material_id}`}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-red-600 uppercase italic">
                                {payout.setor}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                {payout.solicitante}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-black">
                              {payout.quantidade}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex items-center justify-end gap-2">
                                <span className="text-[9px] font-black text-white bg-slate-900 px-2 py-0.5 rounded uppercase tracking-tighter shadow-sm">
                                   {payout.executor || 'Admin'}
                                </span>
                             </div>
                          </td>
                        </tr>
                      );
                    })}
                    {stockPayouts.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-xs font-black uppercase tracking-widest">
                          Nenhum registro de pagamento encontrado
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
