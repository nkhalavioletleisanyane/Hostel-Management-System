import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface OccupancyDonutProps {
  occupied: number;
  vacant: number;
  percent: number;
}

const COLORS = ['#4a5e2a', '#d9e880', '#d4891a'];

const OccupancyDonut: React.FC<OccupancyDonutProps> = ({ occupied, vacant, percent }) => {
  const data = [
    { name: 'Occupied', value: occupied },
    { name: 'Vacant',   value: vacant },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', width: 160, height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={70}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#fff', border: '1px solid #d8d5cc', borderRadius: 10, fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <span style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: -1, color: '#1a1a1a' }}>{percent}%</span>
          <span style={{ fontSize: '0.7rem', color: '#6b6b5e', fontWeight: 500 }}>Occupied</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
        {data.map((entry, i) => (
          <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#2d2d2d' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i], flexShrink: 0, display: 'inline-block' }} />
            <span style={{ flex: 1 }}>{entry.name}</span>
            <span style={{ fontWeight: 700 }}>{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OccupancyDonut;
