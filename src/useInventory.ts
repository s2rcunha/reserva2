import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Material, Sector, User, Stats, Loan, AuditRow, Bombeiro, EPILoan, StockPayout } from './types';
import { SCRIPT_URL } from './constants';

export function useInventory(authenticatedFetch: any, currentUser: User | null) {
  const [loading, setLoading] = useState(false);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [rawMateriais, setRawMateriais] = useState<Material[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditRow[]>([]);
  const [bombeiros, setBombeiros] = useState<Bombeiro[]>([]);
  const [epiLoans, setEPILoans] = useState<EPILoan[]>([]);
  const [stockPayouts, setStockPayouts] = useState<StockPayout[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0);
  const filterAbortController = useRef<AbortController | null>(null);

  const [filters, setFilters] = useState({
    keyword: '', bmp: '', documento: '', setor: '', situacao: '',
    categoria: '', item_epi: '', ti: false, hi: false, aph: false,
    instr: false, altura: false, extintor_tipo: '', extintor_peso: '',
    fora_de_carga: false,
    exibir_extintores: true, exibir_descarregados: false
  });

  const fetchData = useCallback(async (action: string, setState: Function) => {
    try {
      const res = await authenticatedFetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (Array.isArray(data)) setState(data);
      else if (data.users) setState(data.users);
      
      if (data.serverTime) {
        setServerTimeOffset(Number(data.serverTime) - new Date().getTime());
      }
    } catch (err) {
      console.error(`Erro ao buscar ${action}:`, err);
    }
  }, [authenticatedFetch]);

  const fetchSectores = useCallback(() => fetchData('getSectors', setSectores), [fetchData]);
  const fetchUsers = useCallback(() => fetchData('getUsers', setUsers), [fetchData]);
  const fetchLoans = useCallback(() => fetchData('getLoans', setLoans), [fetchData]);
  const fetchBombeiros = useCallback(() => fetchData('getBombeiros', setBombeiros), [fetchData]);
  const fetchEPILoans = useCallback(() => fetchData('getEpiLoans', setEPILoans), [fetchData]);
  const fetchStockPayouts = useCallback(() => fetchData('getStockPayouts', setStockPayouts), [fetchData]);
  const fetchAuditLogs = useCallback(() => fetchData('getAudit', setAuditLogs), [fetchData]);

  const fetchAll = useCallback(() => {
    fetchSectores();
    fetchUsers();
    fetchLoans();
    fetchBombeiros();
    fetchEPILoans();
    fetchStockPayouts();
    fetchAuditLogs();
  }, [fetchSectores, fetchUsers, fetchLoans, fetchBombeiros, fetchEPILoans, fetchStockPayouts, fetchAuditLogs]);

  const stats = useMemo<Stats | null>(() => {
    if (rawMateriais.length === 0) return null;

    const s: Stats = {
      totalAtivos: 0,
      totalHistorico: 0,
      byStatus: {},
      byCategory: {},
      byCategoryFiltered: {},
      byCategoryUnits: {},
      byCategoryFilteredUnits: {}
    };

    rawMateriais.forEach(m => {
      const cat = String(m.categoria || 'OUTROS').toUpperCase().trim();
      const sit = String(m.situacao || 'NAO INFORMADO').toUpperCase().trim();
      const qty = Number(m.quantidade) || 1;
      const isOut = String(m.fora_de_carga || '').toUpperCase().trim() === 'SIM';

      const isEpi = cat === 'EPI_PRETO' || cat === 'EPI_AMARELO';
      if (isEpi || cat === 'LGE' || cat === 'PQS' || cat === 'AGENTES_CONFIG') return;

      s.totalHistorico++;
      s.byCategory[cat] = (s.byCategory[cat] || 0) + 1;
      s.byCategoryUnits[cat] = (s.byCategoryUnits[cat] || 0) + qty;
      s.byStatus[sit] = (s.byStatus[sit] || 0) + 1;

      const isDischarged = sit === 'DESCARREGADO' || sit === 'TRANSFERIDO';
      if (!isDischarged && !isOut) {
        s.totalAtivos += 1;
        s.byCategoryFiltered[cat] = (s.byCategoryFiltered[cat] || 0) + 1;
        s.byCategoryFilteredUnits[cat] = (s.byCategoryFilteredUnits[cat] || 0) + qty;
      }
    });

    return s;
  }, [rawMateriais]);

  const executeFilter = useCallback(async (activeView: string, explicitFilters?: any) => {
    if (filterAbortController.current) filterAbortController.current.abort();
    filterAbortController.current = new AbortController();
    const { signal } = filterAbortController.current;

    setLoading(true);
    try {
      const isManagement = ['STOCK', 'LOANS', 'EPI', 'EPR', 'CLEARANCE', 'DASHBOARD', 'AGENTES', 'INVENTORY'].includes(activeView);
      const shouldPreserveDashboardFilters = activeView === 'DASHBOARD';
      const baseFilters = explicitFilters
        ? { ...filters, ...explicitFilters }
        : (isManagement && !shouldPreserveDashboardFilters ? { ...filters, fora_de_carga: 'all' } : filters);
      const f = baseFilters;
      const isSpecificSearch = !!(f.keyword || f.documento || f.bmp);
      const isNarrowSearch = isSpecificSearch || !!(f.setor || f.situacao || f.categoria);
      
      const backendForaDeCarga = (isManagement || isSpecificSearch)
        ? 'all'
        : (f.fora_de_carga === 'all' ? 'all' : (f.fora_de_carga || false).toString());

      const res = await authenticatedFetch(SCRIPT_URL, {
        method: 'POST',
        signal,
        body: JSON.stringify({
          action: 'read',
          ...f,
          keyword: (f.keyword || '').toString().trim(),
          documento: (f.documento || '').toString().trim(),
          bmp: (f.bmp || '').toString().trim(),
          item_epi: (f.item_epi || '').toString(),
          ti: (f.ti || false).toString(),
          hi: (f.hi || false).toString(),
          aph: (f.aph || false).toString(),
          instr: (f.instr || false).toString(),
          altura: (f.altura || false).toString(),
          fora_de_carga: backendForaDeCarga,
          extintor_tipo: (f.extintor_tipo || '').toString(),
          extintor_peso: (f.extintor_peso || '').toString()
        })
      });
      
      const data = await res.json();
      if (Array.isArray(data)) {
        const idSet = new Set<number>();
        const results = (data as any[]).map((m, idx) => {
          if (!m || typeof m !== 'object') return null;
          let rawId = m.id && m.id !== '' ? Number(m.id) : NaN;
          if (isNaN(rawId) || rawId === 0 || idSet.has(rawId)) rawId = 2000000 + idx;
          idSet.add(rawId);
          return { ...m, id: rawId };
        }).filter(Boolean) as Material[];

        if (isNarrowSearch) {
          setRawMateriais(prev => {
            const map = new Map(prev.map(m => [m.id, m]));
            results.forEach(m => map.set(m.id, m));
            return Array.from(map.values());
          });
        } else {
          setRawMateriais(results);
        }
        
        const isTruthy = (val: any) => {
          const normalized = String(val || '').trim().toUpperCase();
          return val === true || val === 1 || normalized === 'TRUE' || normalized === 'S' || normalized === '1' || normalized === 'SIM';
        };
        const isStockCategory = (cat: string) => {
          const upper = String(cat || '').toUpperCase().trim();
          return upper === 'CONSUMO' || upper === 'DURADOURO' || upper === 'CONSUMO E DURADOURO';
        };

        setMateriais(results.filter(m => {
          const sit = String(m.situacao || '').toUpperCase().trim();
          const cat = String(m.categoria || '').toUpperCase().trim();
          const isDischarged = sit === 'DESCARREGADO' || sit === 'TRANSFERIDO';
          const isOut = isTruthy(m.fora_de_carga) || isDischarged;

          if (activeView === 'STOCK' && !isStockCategory(cat)) return false;

          if (f.keyword) {
            const kl = String(f.keyword).toLowerCase();
            const fields = [m.descricao, m.bmp, m.observacoes].map(v => String(v || '').toLowerCase());
            if (!fields.some(field => field.includes(kl))) return false;
          }
          if (f.bmp && String(m.bmp || '').toLowerCase().indexOf(String(f.bmp).toLowerCase()) === -1) return false;
          if (f.documento && String(m.documento || '').toLowerCase().indexOf(String(f.documento).toLowerCase()) === -1) return false;
          if (f.setor && String(m.setor || '').trim().toUpperCase() !== String(f.setor).trim().toUpperCase()) return false;
          if (f.situacao && String(m.situacao || '').trim().toUpperCase() !== String(f.situacao).trim().toUpperCase()) return false;
          if (f.categoria && cat !== String(f.categoria).trim().toUpperCase()) return false;
          if (f.item_epi && String(m.item_epi || '').trim().toUpperCase() !== String(f.item_epi).trim().toUpperCase()) return false;

          if (f.ti && !isTruthy(m.ti)) return false;
          if (f.hi && !isTruthy(m.hi)) return false;
          if (f.aph && !isTruthy(m.aph)) return false;
          if (f.instr && !isTruthy(m.instr)) return false;
          if (f.altura && !isTruthy(m.altura)) return false;

          // Sincronização com o totalAtivos: 
          // Se estivermos no Dashboard sem busca específica de fora de carga, ocultamos o que não é ativo
          const isDashboardDefault = activeView === 'DASHBOARD' && !explicitFilters;
          
          if (!isSpecificSearch) {
            if ((f.fora_de_carga === false || isDashboardDefault) && isOut) return false;
          }

          if (f.exibir_extintores === false && cat === 'EXTINTORES') return false;

          if (cat === 'EXTINTORES' || f.categoria === 'EXTINTORES') {
            if (f.extintor_tipo && m.extintor_tipo !== f.extintor_tipo) return false;
            const mWeight = m.extintor_peso || (m as any).extintor_weight;
            if (f.extintor_peso && mWeight !== f.extintor_peso) return false;
          }

          const hideDischarged = !f.exibir_descarregados && f.situacao !== 'DESCARREGADO' && sit === 'DESCARREGADO' && f.fora_de_carga !== true;
          const isEpi = cat === 'EPI_PRETO' || cat === 'EPI_AMARELO';
          const isAgentes = cat === 'LGE' || cat === 'PQS' || cat === 'AGENTES_CONFIG';
          const hideEpiOrAgentes = (activeView === 'DASHBOARD' || activeView === 'STOCK') && (isEpi || isAgentes);

          return !hideDischarged && !hideEpiOrAgentes;
        }));
      }
      setHasSearched(true);
    } catch (err: any) {
      if (err?.name !== 'AbortError') console.error("Erro ao filtrar:", err);
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [filters, authenticatedFetch]);

  const eprWarnings = useMemo(() => {
    const now = new Date();
    return rawMateriais
      .filter(m => String(m.classificacao || '').toUpperCase() === 'EPR' && String(m.situacao || '').toUpperCase() !== 'DESCARREGADO')
      .map(m => {
        const warnings = [];
        if (m.epr_proxima_recarga) {
          const date = new Date(m.epr_proxima_recarga);
          const days = Math.ceil((date.getTime() - now.getTime()) / (1000 * 3600 * 24));
          if (days <= Number(m.epr_aviso_recarga || 30)) warnings.push({ id: m.id, bmp: m.bmp, days, msg: 'Recarga programada' });
        }
        if (m.epr_validade_cilindro) {
          const date = new Date(m.epr_validade_cilindro);
          const days = Math.ceil((date.getTime() - now.getTime()) / (1000 * 3600 * 24));
          if (days <= Number(m.epr_aviso_validade_cilindro || 30)) warnings.push({ id: m.id, bmp: m.bmp, days, msg: 'Validade do cilindro' });
        }
        if (m.epr_proximo_teste_data) {
          const date = new Date(m.epr_proximo_teste_data);
          const days = Math.ceil((date.getTime() - now.getTime()) / (1000 * 3600 * 24));
          if (days <= Number(m.epr_aviso_teste || 30)) warnings.push({ id: m.id, bmp: m.bmp, days, msg: 'Teste hidrostatico' });
        }
        return warnings;
      })
      .flat()
      .filter(Boolean);
  }, [rawMateriais]);

  const epiWarnings = useMemo(() => {
    const now = new Date();
    return rawMateriais
      .filter(m => (m.categoria === 'EPI_PRETO' || m.categoria === 'EPI_AMARELO'))
      .map(m => {
        if (!m.validade_epi) return null;
        const date = new Date(m.validade_epi);
        const days = Math.ceil((date.getTime() - now.getTime()) / (1000 * 3600 * 24));
        return days <= Number(m.epi_aviso_validade || 30)
          ? { id: m.id, numero: m.epi_numero, item: m.item_epi, color: m.categoria === 'EPI_PRETO' ? 'PRETO' : 'AMARELO', days, msg: 'Validade do EPI' }
          : null;
      })
      .filter(Boolean);
  }, [rawMateriais]);

  const agentesWarnings = useMemo(() => {
    const warnings: { id: string; tipo: string; lote: string; categoria: string; msg: string; days?: number; isEstoqueBaixo?: boolean }[] = [];
    const now = new Date();
    
    // 1. Carrega as configurações de estoque mínimo
    const configs: Record<string, number> = {};
    rawMateriais.filter(m => m.categoria === 'AGENTES_CONFIG').forEach(m => {
      configs[m.item_epi || m.descricao] = Number(m.quantidade) || 0;
    });

    const lgeStock: Record<string, number> = {};
    const pqsStock: Record<string, number> = {};

    // 2. Processa Validade e Soma Estoque Total
    rawMateriais.filter(m => m.categoria === 'LGE' || m.categoria === 'PQS').forEach(m => {
       const isLGE = m.categoria === 'LGE';
       const tipo = m.agentes_tipo || 'INDEFINIDO';
       const capacidade = Number(m.agentes_capacidade) || 0;
       
       if (isLGE) lgeStock[tipo] = (lgeStock[tipo] || 0) + capacidade;
       else pqsStock[tipo] = (pqsStock[tipo] || 0) + capacidade;

       if (m.agentes_validade) {
         const validDate = new Date(m.agentes_validade);
         const days = Math.ceil((validDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
         const avisoLimit = Number(m.agentes_aviso_validade) || 30;
         
         if (days <= avisoLimit) {
           warnings.push({
             id: String(m.id),
             categoria: m.categoria,
             tipo,
             lote: m.agentes_numero_lote || 'S/N',
             msg: `Validade se aproximando ou vencida`,
             days
           });
         }
       }
    });

    // 3. Processa Alertas de Estoque Baixo
    ['LGE', 'PQS'].forEach(cat => {
      const stock = cat === 'LGE' ? lgeStock : pqsStock;
      Object.keys(stock).forEach(tipo => {
        const min = configs[`${cat}_${tipo}`] || 0;
        if (min > 0 && stock[tipo] < min) {
          warnings.push({
            id: `config_${cat}_${tipo}`,
            categoria: cat,
            tipo,
            lote: 'N/A',
            msg: `Estoque baixo (${stock[tipo]}${cat === 'LGE' ? 'L' : 'kg'}). Mínimo: ${min}${cat === 'LGE' ? 'L' : 'kg'}`,
            isEstoqueBaixo: true
          });
        }
      });
    });

    return warnings.sort((a, b) => (a.days ?? 999) - (b.days ?? 999));
  }, [rawMateriais]);

  return {
    loading, setLoading, materiais, rawMateriais, sectores, users, loans,
    auditLogs, bombeiros, epiLoans, stockPayouts, stats, filters, setFilters,
    hasSearched, executeFilter, eprWarnings, epiWarnings, agentesWarnings,
    fetchAll, serverTimeOffset,
    fetchLoans, fetchBombeiros, fetchEPILoans, fetchUsers, fetchSectores, fetchAuditLogs, fetchStockPayouts
  };
}
