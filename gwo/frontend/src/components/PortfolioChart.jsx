import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'Jan', value: 100000 },
    { name: 'Feb', value: 105000 },
    { name: 'Mar', value: 102000 },
    { name: 'Apr', value: 110000 },
    { name: 'May', value: 115000 },
    { name: 'Jun', value: 112000 },
    { name: 'Jul', value: 124500 },
];

const PortfolioChart = () => {
    return (
        <div style={{ width: '100%', height: '100%', minHeight: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{
                        top: 20,
                        right: 0,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#58a6ff" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#58a6ff" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                        dataKey="name"
                        stroke="#8b949e"
                        tick={{ fill: '#8b949e', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#8b949e"
                        tick={{ fill: '#8b949e', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value / 1000}k`}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(13, 17, 23, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#58a6ff' }}
                        formatter={(value) => [`$${value.toLocaleString()}`, 'Value']}
                    />
                    <Area type="monotone" dataKey="value" stroke="#58a6ff" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PortfolioChart;
