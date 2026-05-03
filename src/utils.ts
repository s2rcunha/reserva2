export const getMaterialQty = (m: any) => {
  if (!m || !m.quantidade) return 1;
  const q = Number(m.quantidade);
  return isNaN(q) ? 1 : q;
};

export const isOverdue = (previsao: string) => {
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
};
