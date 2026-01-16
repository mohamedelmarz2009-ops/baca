import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Label } from 'recharts';

interface ScoreGaugeProps {
  score: number;
}

const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score }) => {
  const data = [
    { name: 'Score', value: score },
    { name: 'Remaining', value: 100 - score },
  ];

  let color = '#ef4444'; // Red
  if (score > 50) color = '#f59e0b'; // Orange
  if (score > 80) color = '#10b981'; // Green

  return (
    <div className="h-64 w-full flex flex-col items-center justify-center bg-cyber-panel rounded-lg border border-slate-700 shadow-xl relative">
      <h3 className="text-slate-400 text-sm uppercase tracking-widest absolute top-4">Security Score</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            startAngle={180}
            endAngle={0}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            <Cell key="score" fill={color} />
            <Cell key="rest" fill="#334155" />
            <Label
              value={`${score}`}
              position="center"
              className="text-4xl font-bold fill-slate-100 font-mono"
            />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute bottom-6 text-slate-500 text-xs">
         / 100 POINTS
      </div>
    </div>
  );
};

export default ScoreGauge;
