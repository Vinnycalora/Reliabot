import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const AnalyticsChart = ({ userId }) => {
    const [data, setData] = useState([]);

    useEffect(() => {
        if (!userId) return;

        fetch(`${import.meta.env.VITE_API_BASE_URL}/analytics/${userId}`)
            .then(res => res.json())
            .then(result => {
                // Transform daily_counts into array format
                const formatted = Object.entries(result.daily_counts).map(([date, count]) => ({
                    date: date.slice(5), // show MM-DD
                    tasks: count
                }));
                setData(formatted);
            })
            .catch(err => console.error("Failed to load analytics:", err));
    }, [userId]);

    return (
        <div className="bg-[#1a1a1d] p-6 rounded-xl border border-gray-700 mt-6">
            <h3 className="text-xl font-semibold mb-4 text-sky-400">📊 Task Completions (Last 7 Days)</h3>
            {data.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="date" stroke="#ccc" />
                        <YAxis stroke="#ccc" />
                        <Tooltip />
                        <Line type="monotone" dataKey="tasks" stroke="#38bdf8" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <p className="text-gray-400">No data to display yet.</p>
            )}
        </div>
    );
};

export default AnalyticsChart;
