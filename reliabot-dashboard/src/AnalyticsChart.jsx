import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const AnalyticsChart = ({ userId }) => {
    const [data, setData] = useState([]);

    useEffect(() => {
        if (!userId) return;

        fetch(`${import.meta.env.VITE_API_BASE_URL}/analytics/${userId}`)
            .then(res => res.json())
            .then(result => {
                const combined = {};

                for (const [date, count] of Object.entries(result.daily_counts)) {
                    const key = date.slice(5); // MM-DD
                    combined[key] = { date: key, tasks: count, time: 0 };
                }

                for (const [date, time] of Object.entries(result.completion_time_minutes || {})) {
                    const key = date.slice(5);
                    if (!combined[key]) combined[key] = { date: key, tasks: 0, time: 0 };
                    combined[key].time = time;
                }

                setData(Object.values(combined).sort((a, b) => a.date.localeCompare(b.date)));
            })
            .catch(err => console.error("Failed to load analytics:", err));
    }, [userId]);

    return (
        <div className="bg-[#1a1a1d] p-6 rounded-xl border border-gray-700 mt-6">
            <h3 className="text-xl font-semibold mb-4 text-sky-400">📈 Weekly Productivity</h3>
            {data.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="date" stroke="#ccc" />
                        <YAxis yAxisId="left" stroke="#38bdf8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#facc15" />
                        <Tooltip />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="tasks"
                            yAxisId="left"
                            stroke="#38bdf8"
                            strokeWidth={2}
                            name="Tasks Completed"
                        />
                        <Line
                            type="monotone"
                            dataKey="time"
                            yAxisId="right"
                            stroke="#facc15"
                            strokeWidth={2}
                            name="Avg. Completion Time (min)"
                        />
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <p className="text-gray-400">No analytics data available yet.</p>
            )}
        </div>
    );
};

export default AnalyticsChart;
