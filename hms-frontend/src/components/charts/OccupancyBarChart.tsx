import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import type { BlockOccupancy } from '../../types';

interface OccupancyBarChartProps {
  data: BlockOccupancy[];
}

const OccupancyBarChart: React.FC<OccupancyBarChartProps> = ({ data }) => (
  <ResponsiveContainer width="100%" height={180}>
    <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barSize={22} barGap={4}>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
      <XAxis dataKey="block" tick={{ fontSize: 12, fill: 'var(--clr-text-muted)', fontWeight: 600 }} axisLine={false} tickLine={false} />
      <YAxis tick={{ fontSize: 11, fill: 'var(--clr-text-muted)' }} axisLine={false} tickLine={false} />
      <Tooltip
        contentStyle={{
          background: 'var(--chart-tooltip-bg)',
          border: '1px solid var(--chart-tooltip-border)',
          borderRadius: 10,
          fontSize: 12,
          color: 'var(--clr-text)',
        }}
        cursor={{ fill: 'var(--clr-primary-pale)' }}
      />
      <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
      <Bar dataKey="occupied" name="Occupied" fill="var(--chart-primary)" radius={[4,4,0,0]} />
      <Bar dataKey="vacant"   name="Vacant"   fill="var(--chart-secondary)" radius={[4,4,0,0]} />
    </BarChart>
  </ResponsiveContainer>
);

export default OccupancyBarChart;
