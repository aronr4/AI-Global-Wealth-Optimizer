import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const data = [
    { name: 'Stocks (S&P 500)', value: 55 },
    { name: 'Bonds', value: 20 },
    { name: 'SIP Mutual Funds', value: 15 },
    { name: 'Cash', value: 10 },
];

const COLORS = ['#58a6ff', '#2ea043', '#e3b341', '#da3633'];

const AssetAllocationChart = () => {
    return (
        <div style={{ width: '100%', height: '100%', minHeight: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(13, 17, 23, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value) => [`${value}%`, 'Allocation']}
                    />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        formatter={(value) => <span style={{ color: '#8b949e', fontSize: '0.85rem' }}>{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AssetAllocationChart;
