import { SCRIPT_URL } from './constants';
import { Material, User, Bombeiro } from './types';
import { generateLoanReceipt } from './lib/exportUtils';

export function useInventoryActions(
  authenticatedFetch: any,
  currentUser: User | null,
  refreshData: () => void,
  rawMateriais: Material[],
  setLoading?: (loading: boolean) => void
) {
  const post = async (payload: any) => {
    const res = await authenticatedFetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  };

  const saveMaterial = async (material: Partial<Material>): Promise<any> => {
    if (!currentUser || currentUser.nivel !== 'ADMIN') {
      alert('Acesso restrito a Administradores');
      return { success: false };
    }

    if (setLoading) setLoading(true);

    try {
      const mat: any = { ...(material || {}) };

      if (mat.descricao && /\b(epr|respiraç([ãa]o)|respiracao|cilindro|aut[ôo]nom[ao]|capacete|balaclava|luva|cal[çc]a|casaco|blus[ãa]o|jaqueta|bota)\b/i.test(mat.descricao) && mat.categoria !== 'EPI_PRETO' && mat.categoria !== 'EPI_AMARELO' && mat.classificacao !== 'EPR') {
        alert('Atenção: EPI ou EPR devem ser cadastrados no menu Gestão de EPIs/EPRs.');
        if (setLoading) setLoading(false);
        return { success: false };
      }

      if (!mat.id) {
        if (mat.bmp && mat.bmp.trim() !== '') {
          const exists = rawMateriais.find(m => String(m.bmp).trim() === String(mat.bmp).trim());
          if (exists) {
            alert(`Erro: Já existe um item cadastrado com o BMP ${mat.bmp} (${exists.descricao}).`);
            if (setLoading) setLoading(false);
            return { success: false };
          }
        } else if (mat.descricao) {
          const exists = rawMateriais.find(m => m.descricao?.toUpperCase() === mat.descricao?.toUpperCase());
          if (exists && !window.confirm(`Atenção: Já existe um item com a descrição "${mat.descricao}" no banco de dados. Tem certeza que deseja cadastrar?`)) {
            if (setLoading) setLoading(false);
            return { success: false };
          }
        }
      }

      if (mat.epr_teste_hidrostatico && mat.epr_proximo_teste_anos) {
        const testDate = new Date(mat.epr_teste_hidrostatico);
        const years = parseInt(String(mat.epr_proximo_teste_anos), 10);
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

      const baseKeys = ['id', 'setor', 'bmp', 'situacao', 'documento', 'descricao', 'classificacao', 'data_entrada', 'observacoes', 'responsavel'];
      let allowedKeys = [...baseKeys];

      if (mat.categoria === 'EPI_PRETO' || mat.categoria === 'EPI_AMARELO') {
        allowedKeys = [...allowedKeys, 'fora_de_carga', 'item_epi', 'tamanho', 'epi_numero', 'validade_epi', 'epi_aviso_validade'];
      } else if (mat.categoria === 'CONSUMO' || mat.categoria === 'PERMANENTE') {
        allowedKeys = [...allowedKeys, 'item_epi', 'tamanho', 'epi_numero', 'validade_epi', 'fora_de_carga', 'ti', 'hi', 'aph', 'instr', 'altura', 'quantidade', 'conta', 'classe', 'epr_validade_cilindro', 'epr_aviso_validade_cilindro', 'epr_fabricante', 'epr_modelo', 'epr_ultima_recarga', 'epr_proxima_recarga', 'epr_aviso_recarga', 'epr_teste_hidrostatico', 'epr_proximo_teste_anos', 'epr_proximo_teste_data', 'epr_aviso_teste', 'epr_recargas_limite', 'epr_recargas_count'];
      } else if (mat.categoria === 'EXTINTORES') {
        allowedKeys = [...allowedKeys, 'fora_de_carga', 'extintor_tipo', 'extintor_weight', 'extintor_peso', 'conta', 'classe'];
      } else if (mat.categoria === 'LGE' || mat.categoria === 'PQS') {
        allowedKeys = [...allowedKeys, 'agentes_tipo', 'agentes_capacidade', 'agentes_fabricante', 'agentes_numero_lote', 'agentes_validade', 'agentes_aviso_validade', 'agentes_local_armazenamento'];
      } else if (mat.categoria === 'AGENTES_CONFIG') {
        allowedKeys = [...allowedKeys, 'item_epi', 'quantidade', 'descricao'];
      }

    Object.keys(mat).forEach(key => {
      if (key !== 'id' && key !== 'categoria' && !allowedKeys.includes(key)) {
        delete mat[key];
      }
    });

    const action = mat.id ? 'update_material' : 'create_material';
      const data = await post({ ...mat, action, executor: currentUser?.login });
      if (!data.success) {
        alert(data.message || 'Erro ao salvar material');
        return data;
      }
      refreshData();
      return data;
    } finally {
      if (setLoading) setLoading(false);
    }
  };

  const deleteMaterial = async (id: number, categoria: string) => {
    if (!confirm('Excluir permanentemente este item?')) return { success: false };
    if (setLoading) setLoading(true);
    try {
      const data = await post({ action: 'delete_row', table: categoria, id, executor: currentUser?.login });
      if (!data.success) alert(data.message || 'Erro ao excluir');
      else refreshData();
      return data;
    } finally {
      if (setLoading) setLoading(false);
    }
  };

  const saveUser = async (user: Partial<User>) => {
    if (!/^\d{7}$/.test(user.login || '')) {
      alert('O SARAM deve conter exatamente 7 dígitos numéricos.');
      return { success: false };
    }

    if (setLoading) setLoading(true);
    const action = user.id ? 'update_user' : 'create_user';
    try {
      const data = await post({
        ...user,
        action,
        executor: currentUser?.login,
        ...(!user.id ? { senha: '123456', force_reset: 'SIM' } : {})
      });
      if (data.success) refreshData();
      return data;
    } finally {
      if (setLoading) setLoading(false);
    }
  };

  const deleteUser = async (id: number) => {
    if (!confirm('Deseja revogar o acesso deste militar?')) return { success: false };
    if (setLoading) setLoading(true);
    try {
      const data = await post({ action: 'delete_row', table: 'USUARIOS', id, executor: currentUser?.login });
      if (data.success) refreshData();
      return data;
    } finally {
      if (setLoading) setLoading(false);
    }
  };

  const saveBombeiro = async (bombeiro: Partial<Bombeiro>) => {
    if (!/^\d{7}$/.test(bombeiro.saram || '')) {
      alert('O SARAM deve conter exatamente 7 dígitos numéricos.');
      return { success: false };
    }

    if (setLoading) setLoading(true);
    const action = bombeiro.id ? 'update_bombeiro' : 'create_bombeiro';
    try {
      const data = await post({ ...bombeiro, action, executor: currentUser?.login });
      if (data.success) refreshData();
      return data;
    } finally {
      if (setLoading) setLoading(false);
    }
  };

  const deleteBombeiro = async (id: number) => {
    if (!confirm('Deseja excluir este militar do cadastro de EPI?')) return { success: false };
    if (setLoading) setLoading(true);
    try {
      const data = await post({ action: 'delete_row', table: 'BOMBEIROS', id, executor: currentUser?.login });
      if (data.success) refreshData();
      return data;
    } finally {
      if (setLoading) setLoading(false);
    }
  };

  const saveSector = async (nome: string) => {
    if (setLoading) setLoading(true);
    try {
      const data = await post({ nome, action: 'create_sector', executor: currentUser?.login });
      if (data.success) refreshData();
      return data;
    } finally {
      if (setLoading) setLoading(false);
    }
  };

  const deleteSector = async (id: number) => {
    if (!confirm('Deseja excluir este setor? Itens vinculados a ele podem ficar sem localização.')) return { success: false };
    if (setLoading) setLoading(true);
    try {
      const data = await post({ action: 'delete_row', table: 'SETORES', id, executor: currentUser?.login });
      if (data.success) refreshData();
      return data;
    } finally {
      if (setLoading) setLoading(false);
    }
  };

  const createLoan = async (loanData: any, selectedMats: Material[], quantities: Record<number, number>) => {
    if (selectedMats.length === 0) {
      alert('Selecione ao menos um material');
      return { success: false };
    }

    const outOfStock = selectedMats.filter(m => (Number(m.quantidade) || 0) <= 0);
    if (outOfStock.length > 0) {
      alert(`Atenção: Os seguintes itens estão com estoque zerado e não podem ser emprestados: ${outOfStock.map(m => m.descricao).join(', ')}`);
      return { success: false };
    }

    if (setLoading) setLoading(true);
    try {
      const payload = {
        ...loanData,
        materiais: selectedMats.map(m => {
          const isConsumo = m.categoria === 'CONSUMO';
          const isBulkPermanente = m.categoria === 'PERMANENTE' && Number(m.quantidade) > 1;
          return { id: m.id, qty: (isConsumo || isBulkPermanente) ? (quantities[m.id] || 1) : 1 };
        }),
        retirada: new Date().toISOString(),
        autorizado_por: currentUser?.nome,
        executor: currentUser?.login,
        action: 'create_loan'
      };

      const data = await post(payload);
      if (!data.success) {
        alert("Erro ao salvar empréstimo no banco de dados: " + (data.message || "Desconhecido"));
      }

      generateLoanReceipt(payload, selectedMats, currentUser?.nome || 'Admin');
      refreshData();
      return data;
    } finally {
      if (setLoading) setLoading(false);
    }
  };

  return {
    saveMaterial,
    deleteMaterial,
    saveUser,
    deleteUser,
    saveBombeiro,
    deleteBombeiro,
    saveSector,
    deleteSector,
    createLoan
  };
}
