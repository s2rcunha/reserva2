import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Material, LabelConfig } from '../types';
import QRCode from 'qrcode';

// Helper para carregar imagem
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
};

export const generateLabelsPDF = async (materiais: Material[], config?: LabelConfig) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const labelWidth = config?.labelWidth ?? 60;
  const labelHeight = config?.labelHeight ?? 25;
  const marginX = config?.marginX ?? 15;
  const gapX = config?.gapX ?? 10;
  const gapY = config?.gapY ?? 5;
  const labelsPerRow = config?.labelsPerRow ?? 2;
  const labelsPerCol = config?.labelsPerCol ?? 8;
  const marginY = config?.marginY ?? 25;

  let currentX = marginX;
  let currentY = marginY;
  let labelCount = 0;

  // Tenta carregar o logo. Se falhar, segue sem logo.
  let logoData: string | null = null;
  try {
    const img = await loadImage('logo-unidade.png');
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0);
      logoData = canvas.toDataURL('image/png');
    }
  } catch (err) {
    console.warn('Logo logo-unidade.png não encontrado. Usando apenas texto.');
  }

  for (const m of materiais) {
    if (labelCount > 0 && labelCount % (labelsPerRow * labelsPerCol) === 0) {
      doc.addPage();
      currentX = marginX;
      currentY = marginY;
    }

    // Bordas da etiqueta (opcional, mas bom para recorte)
    doc.setDrawColor(230);
    doc.rect(currentX, currentY, labelWidth, labelHeight);

    // QR Code
    try {
      const qrDataUrl = await QRCode.toDataURL(String(m.bmp || m.id), {
        margin: 1,
        width: 100
      });
      doc.addImage(qrDataUrl, 'PNG', currentX + 40, currentY + 2, 18, 18);
    } catch (e) {
      console.error('Erro ao gerar QR Code', e);
    }

    // Logo
    if (logoData) {
      doc.addImage(logoData, 'PNG', currentX + 2, currentY + 2, 8, 8);
    }

    // Texto Institucional (se não tiver logo, usa um placeholder)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(150);
    doc.text("SESCINC / BACO", currentX + (logoData ? 12 : 2), currentY + 4);
    doc.text("SISTEMA DE GESTÃO", currentX + (logoData ? 12 : 2), currentY + 7);

    // BMP e Descrição
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`BMP: ${m.bmp || 'S/N'}`, currentX + 2, currentY + 15);
    
    doc.setFontSize(5);
    const desc = (m.descricao || 'Sem descrição').substring(0, 40);
    doc.text(desc, currentX + 2, currentY + 20, { maxWidth: 35 });

    // Update coordinates
    labelCount++;
    if (labelCount % labelsPerRow === 0) {
      currentX = marginX;
      currentY += labelHeight + gapY;
    } else {
      currentX += labelWidth + gapX;
    }
  }

  doc.save(`etiquetas_${new Date().getTime()}.pdf`);
};

// Helper robusto para chamar o autoTable em diferentes ambientes (Vite/Build)
const callAutoTable = (doc: jsPDF, options: any) => {
  try {
    if (typeof (doc as any).autoTable === 'function') {
      (doc as any).autoTable(options);
    } else {
      // @ts-ignore
      const at = autoTable.default || autoTable;
      if (typeof at === 'function') {
        at(doc, options);
      } else {
        console.error('Plugin autoTable não encontrado');
      }
    }
  } catch (err) {
    console.error('Erro ao executar autoTable:', err);
  }
};

export const exportToExcel = (data: any[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Materiais");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

export const generatePDFReport = (materiais: Material[], title: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text("SESCINC-CO - Relatório de Materiais", 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(title, 14, 30);
  doc.text(`Data: ${new Date().toLocaleString()}`, 14, 35);
  
  const tableData = materiais.map(m => [
    m.bmp || '-',
    m.quantidade || 1,
    m.descricao || '-',
    m.setor || '-',
    m.situacao || '-',
    m.categoria || '-'
  ]);

  callAutoTable(doc, {
    startY: 45,
    head: [['BMP', 'Qtd', 'Descrição', 'Setor', 'Situação', 'Categoria']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [220, 38, 38] }, // Red 600
    styles: { fontSize: 8 }
  });

  doc.save(`relatorio_${new Date().getTime()}.pdf`);
};

export const generateLoanReceipt = (loan: any, materiais: Material[], adminName: string) => {
  try {
    const doc = new jsPDF();
    
    doc.setFontSize(14);
    doc.text("COMANDO DA AERONÁUTICA", 105, 20, { align: 'center' });
    doc.text("SESCINC-CO", 105, 28, { align: 'center' });
    doc.text("CAUTELA DE EMPRÉSTIMO DE MATERIAL", 105, 45, { align: 'center' });
    
    doc.setFontSize(11);
    doc.text(`Solicitante: ${loan.solicitante || 'Não informado'}`, 20, 60);
    doc.text(`Setor: ${loan.setor || 'Não informado'}`, 20, 67);
    doc.text(`Telefone: ${loan.telefone || '-'}`, 20, 74);
    doc.text(`Ramal: ${loan.ramal || '-'}`, 80, 74);
    
    const dataRetirada = loan.retirada ? new Date(loan.retirada) : new Date();
    doc.text(`Data/Hora Retirada: ${isNaN(dataRetirada.getTime()) ? 'Data inválida' : dataRetirada.toLocaleString()}`, 20, 81);
    
    const dataPrevisao = loan.previsao ? new Date(loan.previsao) : null;
    const txtPrevisao = dataPrevisao && !isNaN(dataPrevisao.getTime()) ? dataPrevisao.toLocaleDateString() : 'A combinar';
    doc.text(`Previsão de Entrega: ${txtPrevisao}`, 20, 88);
    
    doc.text(`Autorizado por: ${adminName}`, 20, 95);
    
    doc.text("Materiais:", 20, 105);
    const tableData = materiais.map(m => {
      let qty = 1;
      if (loan.materiais && Array.isArray(loan.materiais)) {
        const item = loan.materiais.find((i: any) => (i.id === m.id || i === m.id));
        if (item && typeof item === 'object') qty = item.qty || 1;
      }
      return [m.bmp || '-', qty, m.descricao || '-', m.situacao || '-'];
    });
    
    callAutoTable(doc, {
      startY: 110,
      head: [['BMP', 'Qtd', 'Descrição', 'Condição']],
      body: tableData,
      headStyles: { fillColor: [0, 0, 0] },
      styles: { fontSize: 9 },
      didDrawPage: (data: any) => {
        // Guardamos o finalY de forma mais segura caso o metadata global falhe
        (doc as any)._lastY = data.cursor.y;
      }
    });

    // Tenta pegar o Y final da tabela para as assinaturas
    const lastY = (doc as any)._lastY || (doc as any).lastAutoTable?.finalY || 150;
    const finalY = Math.min(lastY + 30, 270); // Evita passar do fim da página
    
    doc.line(20, finalY, 90, finalY);
    doc.text("Assinatura do Solicitante", 55, finalY + 5, { align: 'center' });
    
    doc.line(120, finalY, 190, finalY);
    doc.text("Assinatura do Responsável", 155, finalY + 5, { align: 'center' });
    
    const fileName = `recibo_emprestimo_${(loan.solicitante || 'militar').replace(/[^a-z0-9]/gi, '_')}.pdf`;
    doc.save(fileName);
    console.log('PDF gerado com sucesso:', fileName);
  } catch (err) {
    console.error('Erro na geração do PDF:', err);
    throw new Error('Falha técnica ao gerar o arquivo PDF');
  }
};

export const generateEpiLoanReceipt = (bombeiro: any, pecas: any[], extras: any, adminName: string) => {
  try {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(14);
    doc.text("COMANDO DA AERONÁUTICA", 105, 20, { align: 'center' });
    doc.text("SESCINC-CO", 105, 28, { align: 'center' });
    doc.text("RECIBO DE CAUTELA DE EPI", 105, 45, { align: 'center' });
    
    // Militar Info
    doc.setFontSize(11);
    doc.text(`Militar: ${bombeiro.nome_guerra || 'Não informado'}`, 20, 60);
    doc.text(`SARAM: ${bombeiro.saram || 'Não informado'}`, 20, 67);
    doc.text(`Setor: ${extras.setor || 'Não informado'}`, 20, 74);
    doc.text(`Telefone: ${extras.telefone || '-'}`, 20, 81);
    doc.text(`Ramal: ${extras.ramal || '-'}`, 80, 81);
    
    doc.text(`Data/Hora: ${new Date().toLocaleString()}`, 20, 88);
    doc.text(`Autorizado por: ${adminName}`, 20, 95);
    
    doc.text("Equipamentos de Proteção Individual:", 20, 105);
    
    const tableData = pecas.map(p => [
      p.category === 'EPI_PRETO' ? 'PRETO' : 'AMARELO',
      p.type,
      String(p.number).padStart(3, '0'),
      p.size || 'N/A'
    ]);
    
    callAutoTable(doc, {
      startY: 110,
      head: [['Cor', 'Componente', 'Nº Controle', 'Tamanho']],
      body: tableData,
      headStyles: { fillColor: [0, 0, 0] },
      styles: { fontSize: 9 },
      didDrawPage: (data: any) => {
        (doc as any)._lastY = data.cursor.y;
      }
    });

    const lastY = (doc as any)._lastY || 150;
    const finalY = Math.min(lastY + 40, 265);
    
    // Termo de responsabilidade
    doc.setFontSize(8);
    const termo = "Declaro ter recebido os equipamentos acima listados em perfeitas condições de uso, comprometendo-me a utilizá-los exclusivamente em serviço e zelar pela sua guarda e conservação. Em caso de extravio ou dano por mau uso, estou ciente de que poderei ser responsabilizado conforme a legislação vigente.";
    doc.text(termo, 20, finalY - 15, { maxWidth: 170, align: 'justify' });

    doc.line(20, finalY + 10, 90, finalY + 10);
    doc.text("Assinatura do Militar", 55, finalY + 15, { align: 'center' });
    
    doc.line(120, finalY + 10, 190, finalY + 10);
    doc.text("Assinatura do Responsável", 155, finalY + 15, { align: 'center' });
    
    const fileName = `cautela_epi_${bombeiro.nome_guerra.replace(/[^a-z0-9]/gi, '_')}_${new Date().getTime()}.pdf`;
    doc.save(fileName);
  } catch (err) {
    console.error('Erro na geração do PDF de EPI:', err);
    alert('Erro ao gerar PDF da cautela');
  }
};

export const generateComparisonPDF = (result: { missingInSystem: string[], missingInList: string[] }) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text("Relatório Comparativo de BMPs", 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Data: ${new Date().toLocaleString()}`, 14, 30);
  
  let currentY = 45;

  if (result.missingInSystem.length > 0) {
    doc.setTextColor(220, 38, 38);
    doc.setFontSize(14);
    doc.text(`Faltando no Sistema (${result.missingInSystem.length})`, 14, currentY);
    currentY += 10;
    
    const missingSystemData = result.missingInSystem.map(bmp => [bmp, "Não cadastrado"]);
    callAutoTable(doc, {
      startY: currentY,
      head: [['BMP', 'Status']],
      body: missingSystemData,
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38] },
      styles: { fontSize: 8 }
    });
    currentY = (doc as any).lastAutoTable.finalY + 15;
  }

  if (result.missingInList.length > 0) {
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    doc.setTextColor(79, 70, 229);
    doc.setFontSize(14);
    doc.text(`Faltando na Planilha (${result.missingInList.length})`, 14, currentY);
    currentY += 10;

    const missingListData = result.missingInList.map(bmp => [bmp, "Presente no Sistema"]);
    callAutoTable(doc, {
      startY: currentY,
      head: [['BMP', 'Status']],
      body: missingListData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 8 }
    });
  }

  doc.save(`comparativo_bmps_${new Date().getTime()}.pdf`);
};
