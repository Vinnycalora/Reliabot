import React, { useEffect, useState } from 'react';

function XPHeatmap({ user }) {
    const [data, setData] = useState([]);

    useEffect(() => {
        if (!user) return;

        const fetchHeatmap = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/analytics/${user.id}`, {
                    credentials: 'include',
                });
                if (!res.ok) throw new Error('Heatmap fetch failed');
                const result = await res.json();
                const counts = result?.daily_counts || {};
                const parsed = Object.entries(counts).map(([date, count]) => ({ date, count }));
                setData(parsed);
            } catch (err) {
                console.error('Failed to load XP heatmap data:', err);
                setData([]);
            }
        };

        fetchHeatmap();
    }, [user]);

    return (
        <div className="p-4 text-white">
            <h2 className="text-xl font-bold mb-4">🔥 XP Heatmap</h2>
            {data.length === 0 ? (
                <p className="text-gray-400">No data available yet.</p>
            ) : (
                <pre>{JSON.stringify(data, null, 2)}</pre>
            )}
        </div>
    );
}

export default XPHeatmap;




