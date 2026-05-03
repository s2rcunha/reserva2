import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface Props {
  data: { name: string; value: number }[];
}


const SITUATION_COLORS: Record<string, string> = {
  'EM USO': '#3B82F6',             // azul
  'AVARIADO': '#EAB308',           // amarelo
  'CONDENADO': '#EF4444',          // vermelho
  'PROCES. DESCARG.': '#93C5FD',   // azul fraco
  'EM TRANSF.': '#A855F7',         // roxo
  'Ñ ENCONTRADO': '#78350F',       // marrom
  'SAÍDA': '#14532D',              // verde escuro
  'PERFEITO': '#22C55E',           // verde claro
};

const DEFAULT_COLORS = [
  '#dc2626', // Red 600
  '#ea580c', // Orange 600
  '#f59e0b', // Amber 500
  '#3b82f6', // Blue 500
  '#6b7280', // Gray 500
  '#94a3b8', // Slate 400
  '#16a34a', // Green 600
];

export const StatusPieChart: React.FC<Props> = ({ data }) => {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
        <p className="text-[10px] font-black uppercase text-gray-400 font-black italic">Sem dados de estoque</p>
      </div>
    );
  }

  return (
    <div className="h-[400px] w-full flex items-center justify-center overflow-hidden">
      <PieChart width={400} height={400}>
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
            <feOffset dx="2" dy="4" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.5" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <Pie
          data={data}
          cx="50%"
          cy="40%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={5}
          dataKey="value"
          stroke="none"
          style={{ filter: 'url(#shadow)' }}
          label={({ percent }: any) => percent ? `${(percent * 100).toFixed(0)}%` : ''}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={SITUATION_COLORS[entry.name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            borderRadius: '20px', 
            border: 'none', 
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
            fontSize: '10px',
            fontWeight: '900',
            textTransform: 'uppercase'
          }}
          formatter={(value: any) => {
            const percent = ((value / total) * 100).toFixed(1);
            return [`${value} (${percent}%)`, 'Quantidade'];
          }}
        />
        <Legend 
          verticalAlign="bottom" 
          height={80}
          formatter={(value, entry: any) => {
            const { payload } = entry;
            const percent = ((payload.value / total) * 100).toFixed(1);
            return (
              <span className="text-[9px] font-black uppercase text-gray-500 tracking-tighter leading-none">
                {value}: {payload.value} ({percent}%)
              </span>
            );
          }}
        />
      </PieChart>
    </div>
  );
};
