import React, { useState, useMemo } from "react";
import { Material, User, Sector } from "../../types";
import {
  RefreshCw,
  Shield,
  AlertCircle,
  Settings,
  Edit3,
  Trash2,
  Plus,
  ArrowRightLeft,
  MinusCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const parseSafeNumber = (val: string | number | undefined | null) => {
  if (!val) return 0;
  return Number(String(val).replace(',', '.')) || 0;
};

interface Props {
  materiais: Material[];
  rawMateriais: Material[];
  currentUser: User | null;
  loading: boolean;
  saveMaterial: (e: React.FormEvent | null, mat: Partial<Material>) => Promise<any>;
  deleteMaterial: (m: Material) => Promise<void>;
  viewTab: "LGE" | "PQS";
  setViewTab: (tab: "LGE" | "PQS") => void;
  sectores: Sector[];
  warnings?: { id: string; tipo: string; lote: string; categoria: string; msg: string; days?: number; isEstoqueBaixo?: boolean }[];
}

export const AgentesManagementView: React.FC<Props> = ({
  materiais,
  rawMateriais,
  currentUser,
  loading,
  saveMaterial,
  deleteMaterial,
  viewTab,
  setViewTab,
  sectores,
  warnings = [],
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMat, setEditingMat] = useState<Partial<Material> | null>(null);

  // Config Modal State
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configValues, setConfigValues] = useState<Record<string, number>>({});

  // Use / Transfer State
  const [usingMat, setUsingMat] = useState<Material | null>(null);
  const [useAmount, setUseAmount] = useState<string>("");

  const [transferringMat, setTransferringMat] = useState<Material | null>(null);
  const [transferAmount, setTransferAmount] = useState<string>("");
  const [transferDestination, setTransferDestination] = useState<string>("");

  const filteredWarnings = useMemo(() => {
    return warnings.filter((w) => w.categoria === viewTab);
  }, [warnings, viewTab]);

  const configs = useMemo(() => {
    const configMap: Record<string, Material> = {};
    rawMateriais
      .filter((m) => m.categoria === "AGENTES_CONFIG")
      .forEach((m) => {
        configMap[m.item_epi || m.descricao] = m;
      });
    return configMap;
  }, [rawMateriais]);

  const openConfig = () => {
    setConfigValues({
      LGE_B: Number(configs["LGE_B"]?.quantidade || 0),
      LGE_C: Number(configs["LGE_C"]?.quantidade || 0),
      PQS_BC: Number(configs["PQS_BC"]?.quantidade || 0),
      PQS_ABC: Number(configs["PQS_ABC"]?.quantidade || 0),
    });
    setIsConfigOpen(true);
  };

  const saveConfig = async () => {
    // Salvar as 4 configurações
    const keys = ["LGE_B", "LGE_C", "PQS_BC", "PQS_ABC"];
    for (const key of keys) {
      const existing = configs[key];
      const payload: Partial<Material> = {
        categoria: "AGENTES_CONFIG",
        item_epi: key,
        descricao: key, // fallback
        quantidade: configValues[key],
        fora_de_carga: "SIM",
      };
      if (existing) {
        payload.id = existing.id;
      }
      await saveMaterial(null, payload);
    }
    setIsConfigOpen(false);
    alert("Configurações salvas!");
  };

  const handeUseMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usingMat) return;
    const amount = parseSafeNumber(useAmount);
    if (amount <= 0) return alert("Quantidade inválida.");

    const currentCap = parseSafeNumber(usingMat.agentes_capacidade);
    if (amount > currentCap)
      return alert("Ação bloqueada: A quantidade informada é maior que o disponível neste lote.");

    const newValue = currentCap - amount;

    await saveMaterial(null, { ...usingMat, agentes_capacidade: newValue });
    setUsingMat(null);
    setUseAmount("");
  };

  const handleTransferMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringMat) return;
    const amount = parseSafeNumber(transferAmount);
    if (amount <= 0) return alert("Quantidade inválida.");
    if (!transferDestination.trim()) return alert("Destino não informado.");

    const currentCap = parseSafeNumber(transferringMat.agentes_capacidade);
    if (amount > currentCap)
      return alert("Ação bloqueada: A quantidade informada é maior que o disponível neste lote.");

    // Remove amount from origin
    const originValue = currentCap - amount;
    await saveMaterial(null, {
      ...transferringMat,
      agentes_capacidade: originValue,
    });

    // Create new lot at destination
    const { id, ...matWithoutId } = transferringMat; // copy fields except id
    await saveMaterial(null, {
      ...matWithoutId,
      agentes_capacidade: amount,
      agentes_local_armazenamento: transferDestination,
      categoria: transferringMat.categoria,
      fora_de_carga: "SIM",
    });

    setTransferringMat(null);
    setTransferAmount("");
    setTransferDestination("");
  };

  const agentes = useMemo(() => {
    return rawMateriais.filter((m) => m.categoria === viewTab);
  }, [rawMateriais, viewTab]);

  const totalEmEstoque = useMemo(() => {
    const totais: Record<string, number> = {};
    agentes.forEach((a) => {
      const tipo = a.agentes_tipo || "INDEFINIDO";
      totais[tipo] = (totais[tipo] || 0) + parseSafeNumber(a.agentes_capacidade);
    });
    return totais;
  }, [agentes]);

  const renderForm = () => {
    return (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="overflow-hidden"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!editingMat?.agentes_tipo || !editingMat?.agentes_capacidade) {
              return alert(
                "Preencha os campos obrigatórios (Tipo e Capacidade)",
              );
            }
            await saveMaterial(null, {
              ...editingMat,
              categoria: viewTab,
              fora_de_carga: "SIM",
            });
            setIsFormOpen(false);
            setEditingMat(null);
          }}
          className="bg-gray-50 p-6 rounded-3xl border border-gray-200 mt-6 space-y-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-black uppercase text-gray-800">
              {editingMat?.id ? "Editar" : "Novo"} {viewTab}
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setEditingMat(null);
              }}
              className="text-gray-500 font-bold hover:text-gray-900 text-xs uppercase tracking-widest px-3 py-1 bg-gray-200 rounded-full"
            >
              Fechar
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1 block">
                Tipo
              </label>
              <select
                className="w-full p-3 rounded-xl border border-gray-200 bg-white"
                value={editingMat?.agentes_tipo || ""}
                onChange={(e) =>
                  setEditingMat({ ...editingMat, agentes_tipo: e.target.value })
                }
                required
              >
                <option value="">Selecione...</option>
                {viewTab === "LGE" ? (
                  <>
                    <option value="B">Classe B</option>
                    <option value="C">Classe C</option>
                  </>
                ) : (
                  <>
                    <option value="BC">Classe BC</option>
                    <option value="ABC">Classe ABC</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1 block">
                Capacidade ({viewTab === "LGE" ? "Litros" : "Kilos"})
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full p-3 rounded-xl border border-gray-200 bg-white"
                value={editingMat?.agentes_capacidade || ""}
                onChange={(e) =>
                  setEditingMat({
                    ...editingMat,
                    agentes_capacidade: e.target.value,
                  })
                }
                required
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1 block">
                Fabricante
              </label>
              <input
                type="text"
                className="w-full p-3 rounded-xl border border-gray-200 bg-white"
                value={editingMat?.agentes_fabricante || ""}
                onChange={(e) =>
                  setEditingMat({
                    ...editingMat,
                    agentes_fabricante: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1 block">
                Número do Lote
              </label>
              <input
                type="text"
                className="w-full p-3 rounded-xl border border-gray-200 bg-white"
                value={editingMat?.agentes_numero_lote || ""}
                onChange={(e) =>
                  setEditingMat({
                    ...editingMat,
                    agentes_numero_lote: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1 block">
                Validade
              </label>
              <input
                type="date"
                className="w-full p-3 rounded-xl border border-gray-200 bg-white"
                value={
                  editingMat?.agentes_validade
                    ? new Date(editingMat.agentes_validade)
                        .toISOString()
                        .split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setEditingMat({
                    ...editingMat,
                    agentes_validade: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1 block">
                Avisar validade (Dias antes)
              </label>
              <input
                type="number"
                className="w-full p-3 rounded-xl border border-gray-200 bg-white"
                value={editingMat?.agentes_aviso_validade || ""}
                onChange={(e) =>
                  setEditingMat({
                    ...editingMat,
                    agentes_aviso_validade: e.target.value,
                  })
                }
                placeholder="Ex: 30"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1 block">
                Local de Armazenamento
              </label>
              <select
                className="w-full p-3 rounded-xl border border-gray-200 bg-white font-medium text-sm"
                value={editingMat?.agentes_local_armazenamento || ""}
                onChange={(e) =>
                  setEditingMat({
                    ...editingMat,
                    agentes_local_armazenamento: e.target.value,
                  })
                }
                required
              >
                <option value="">Selecione o Setor...</option>
                {sectores.map((s) => (
                  <option key={s.id} value={s.nome}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            disabled={loading}
            type="submit"
            className="w-full bg-red-600 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-md hover:bg-red-700 flex items-center justify-center gap-2"
          >
            {loading ? (
              <RefreshCw className="animate-spin" size={18} />
            ) : (
              "Salvar Registro"
            )}
          </button>
        </form>
      </motion.div>
    );
  };

  return (
    <motion.div
      key="agentes"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter leading-none uppercase italic">
            Agentes Extintores
          </h2>
          <p className="text-gray-400 uppercase text-[9px] md:text-[10px] font-bold tracking-[0.2em] mt-2">
            Gestão de LGE e PQS
          </p>
        </div>
        {currentUser?.nivel === "ADMIN" && (
          <button
            onClick={openConfig}
            className="bg-white border flex items-center gap-2 border-gray-200 text-gray-700 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 shadow-sm"
          >
            <Settings size={16} /> Configurar Estoque Mínimo
          </button>
        )}
      </div>

      {/* Modal de Uso */}
      {usingMat && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[30px] shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-6 text-orange-600">
              <MinusCircle size={24} />
              <h3 className="font-black text-lg uppercase tracking-tighter">
                Registrar Uso
              </h3>
            </div>
            <p className="text-sm text-gray-600 font-medium mb-6">
              Quantos {viewTab === "LGE" ? "Litros" : "Kilos"} do lote{" "}
              <b>{usingMat.agentes_numero_lote || "S/N"}</b> foram utilizados?
              (Estoque atual: {usingMat.agentes_capacidade})
            </p>
            <form onSubmit={handeUseMaterial}>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={parseSafeNumber(usingMat.agentes_capacidade)}
                className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-gray-100 font-black text-xl mb-4"
                value={useAmount}
                onChange={(e) => setUseAmount(e.target.value)}
                required
                autoFocus
                placeholder="0.00"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-orange-500 text-white font-black uppercase text-xs py-3 rounded-xl hover:bg-orange-600"
                >
                  Confirma
                </button>
                <button
                  type="button"
                  onClick={() => setUsingMat(null)}
                  className="flex-1 bg-gray-100 text-gray-600 font-black uppercase text-xs py-3 rounded-xl hover:bg-gray-200"
                >
                  Cancela
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Transferência */}
      {transferringMat && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[30px] shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-6 text-indigo-600">
              <ArrowRightLeft size={24} />
              <h3 className="font-black text-lg uppercase tracking-tighter">
                Transferir
              </h3>
            </div>
            <p className="text-sm text-gray-600 font-medium mb-4">
              Quantidade a transferir do lote{" "}
              <b>{transferringMat.agentes_numero_lote || "S/N"}</b> (Atual:{" "}
              {transferringMat.agentes_capacidade})
            </p>
            <form onSubmit={handleTransferMaterial}>
              <label className="text-[10px] uppercase font-black text-gray-400 mb-1 block">
                Quantidade
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={parseSafeNumber(transferringMat.agentes_capacidade)}
                className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-gray-100 font-black text-lg mb-4"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                required
                autoFocus
                placeholder="0.00"
              />
              <label className="text-[10px] uppercase font-black text-gray-400 mb-1 block">
                Novo Destino
              </label>
              <select
                className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 font-medium text-sm mb-6"
                value={transferDestination}
                onChange={(e) => setTransferDestination(e.target.value)}
                required
              >
                <option value="">Selecione o Setor de Destino...</option>
                {sectores.map((s) => (
                  <option key={s.id} value={s.nome}>
                    {s.nome}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-500 text-white font-black uppercase text-xs py-3 rounded-xl hover:bg-indigo-600"
                >
                  Transferir
                </button>
                <button
                  type="button"
                  onClick={() => setTransferringMat(null)}
                  className="flex-1 bg-gray-100 text-gray-600 font-black uppercase text-xs py-3 rounded-xl hover:bg-gray-200"
                >
                  Cancela
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isConfigOpen && (
        <div className="bg-white p-6 rounded-[30px] border border-gray-200 shadow-sm mb-6">
          <h3 className="font-black uppercase mb-4 text-indigo-900">
            Quantidades Mínimas Exigidas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <h4 className="font-bold text-xs uppercase text-slate-500 mb-4">
                LGE (Litros)
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-black text-gray-400 mb-1 block">
                    Tipo B
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 rounded-xl border border-gray-200 bg-white"
                    value={configValues["LGE_B"]}
                    onChange={(e) =>
                      setConfigValues({
                        ...configValues,
                        LGE_B: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black text-gray-400 mb-1 block">
                    Tipo C
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 rounded-xl border border-gray-200 bg-white"
                    value={configValues["LGE_C"]}
                    onChange={(e) =>
                      setConfigValues({
                        ...configValues,
                        LGE_C: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <h4 className="font-bold text-xs uppercase text-slate-500 mb-4">
                PQS (Kg)
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-black text-gray-400 mb-1 block">
                    Tipo BC
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 rounded-xl border border-gray-200 bg-white"
                    value={configValues["PQS_BC"]}
                    onChange={(e) =>
                      setConfigValues({
                        ...configValues,
                        PQS_BC: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black text-gray-400 mb-1 block">
                    Tipo ABC
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 rounded-xl border border-gray-200 bg-white"
                    value={configValues["PQS_ABC"]}
                    onChange={(e) =>
                      setConfigValues({
                        ...configValues,
                        PQS_ABC: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              disabled={loading}
              onClick={saveConfig}
              className="flex-1 bg-indigo-600 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-md hover:bg-indigo-700 flex justify-center items-center gap-2"
            >
              {loading ? (
                <RefreshCw className="animate-spin" size={16} />
              ) : (
                "Salvar Configurações"
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsConfigOpen(false)}
              className="px-8 bg-gray-100 text-gray-600 font-black uppercase tracking-widest rounded-xl hover:bg-gray-200 text-xs"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-gray-100">
        <div className="flex bg-slate-50 p-2 rounded-3xl w-fit mb-8 shadow-inner border border-gray-100">
          <button
            onClick={() => {
              setViewTab("LGE");
              setIsFormOpen(false);
            }}
            className={cn(
              "px-8 py-3 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all",
              viewTab === "LGE"
                ? "bg-white text-red-600 shadow-md ring-1 ring-gray-100"
                : "text-gray-400 hover:text-gray-800",
            )}
          >
            LGE
          </button>
          <button
            onClick={() => {
              setViewTab("PQS");
              setIsFormOpen(false);
            }}
            className={cn(
              "px-8 py-3 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all",
              viewTab === "PQS"
                ? "bg-white text-red-600 shadow-md ring-1 ring-gray-100"
                : "text-gray-400 hover:text-gray-800",
            )}
          >
            PQS
          </button>
        </div>

        <div className="mb-6 flex flex-wrap gap-4">
          {filteredWarnings.length > 0 && (
            <div className="w-full mb-4 bg-orange-50 border border-orange-200 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="text-orange-500" size={20} />
                <h4 className="font-black text-orange-700 uppercase tracking-widest text-xs">Avisos de Validade / Lotes</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredWarnings.map((w, i) => (
                  <div key={i} className="bg-white/80 p-3 rounded-xl border border-orange-100 flex flex-col gap-1 shadow-sm">
                    <div className="flex justify-between items-start">
                      <span className="font-black text-[10px] text-orange-900 uppercase">Tipo {w.tipo} • Lote: {w.lote}</span>
                      {w.days !== undefined && (
                        <span className={cn(
                          "text-[8px] px-2 py-0.5 rounded-full font-black uppercase",
                          w.days <= 0 ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                        )}>
                          {w.days < 0 ? `Vencido há ${Math.abs(w.days)}d` : w.days === 0 ? "Vence hoje" : `Em ${w.days}d`}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-600 font-bold">{w.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {Object.entries(totalEmEstoque).map(([tipo, qtd]) => {
            const minVal = Number(
              configs[`${viewTab}_${tipo}`]?.quantidade || 0,
            );
            const isLow = minVal > 0 && qtd < minVal;
            return (
              <div
                key={tipo}
                className={cn(
                  "px-6 py-4 rounded-2xl border-2 flex flex-col gap-1",
                  isLow
                    ? "bg-red-50 border-red-200"
                    : "bg-green-50 border-green-200",
                )}
              >
                <span
                  className={cn(
                    "text-[9px] uppercase font-black tracking-widest",
                    isLow ? "text-red-500" : "text-green-600",
                  )}
                >
                  Estoque Total • Tipo {tipo}
                </span>
                <span
                  className={cn(
                    "text-2xl font-black",
                    isLow ? "text-red-700" : "text-green-700",
                  )}
                >
                  {qtd} {viewTab === "LGE" ? "Litros" : "Kilos"}
                </span>
                {minVal > 0 && (
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase",
                      isLow ? "text-red-400" : "text-green-500",
                    )}
                  >
                    Mínimo exigido: {minVal}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {currentUser?.nivel === "ADMIN" && !isFormOpen && (
          <button
            onClick={() => {
              setEditingMat({});
              setIsFormOpen(true);
            }}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-300 text-gray-500 font-bold uppercase text-xs hover:border-gray-400 hover:bg-gray-50 hover:text-gray-800 transition-all mb-6 flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Adicionar Lote de {viewTab}
          </button>
        )}

        <AnimatePresence>{isFormOpen && renderForm()}</AnimatePresence>

        <div className="mt-8 border rounded-3xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100 uppercase text-[9px] font-black text-gray-400 tracking-widest">
                  <th className="p-4">Tipo</th>
                  <th className="p-4">Capacidade</th>
                  <th className="p-4">Fabricante</th>
                  <th className="p-4">Lote</th>
                  <th className="p-4">Validade</th>
                  <th className="p-4">Local</th>
                  {currentUser?.nivel === "ADMIN" && (
                    <th className="p-4 text-center">Ações</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {agentes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-8 text-center text-gray-400 text-sm font-medium"
                    >
                      Nenhum registro encontrado.
                    </td>
                  </tr>
                ) : (
                  agentes.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors"
                      title={[
                        item.documento ? `Documento: ${item.documento}` : '',
                        item.observacoes ? `Observações: ${item.observacoes}` : ''
                      ].filter(Boolean).join('\n') || undefined}
                    >
                      <td className="p-4 font-bold text-gray-800 text-sm">
                        {item.agentes_tipo || "-"}
                      </td>
                      <td className="p-4 font-medium text-gray-600 text-xs">
                        {item.agentes_capacidade || "0"}{" "}
                        {viewTab === "LGE" ? "L" : "Kg"}
                      </td>
                      <td className="p-4 font-medium text-gray-600 text-xs">
                        {item.agentes_fabricante || "-"}
                      </td>
                      <td className="p-4 font-medium text-gray-600 text-xs">
                        {item.agentes_numero_lote || "-"}
                      </td>
                      <td className="p-4 font-medium text-gray-600 text-xs">
                        {item.agentes_validade
                          ? new Date(item.agentes_validade).toLocaleDateString(
                              "pt-BR",
                            )
                          : "-"}
                      </td>
                      <td
                        className="p-4 font-medium text-gray-600 text-xs lg:max-w-xs truncate"
                        title={item.agentes_local_armazenamento}
                      >
                        {item.agentes_local_armazenamento || "-"}
                      </td>
                      {currentUser?.nivel === "ADMIN" && (
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setUsingMat(item);
                                setUseAmount("");
                              }}
                              className="p-2 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
                              title="Registrar Uso"
                            >
                              <MinusCircle size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setTransferringMat(item);
                                setTransferAmount("");
                                setTransferDestination("");
                              }}
                              className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                              title="Transferir Quantidade"
                            >
                              <ArrowRightLeft size={14} />
                            </button>
                            <div className="w-px h-6 bg-gray-200 mx-1"></div>
                            <button
                              onClick={() => {
                                setEditingMat(item);
                                setIsFormOpen(true);
                              }}
                              className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                              title="Editar"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    "Tem certeza que deseja apagar este lote?",
                                  )
                                ) {
                                  deleteMaterial(item);
                                }
                              }}
                              className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                              title="Apagar"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
