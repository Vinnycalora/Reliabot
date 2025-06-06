import React, { useEffect, useState } from 'react';

function XPHeatmap({ user }) {
    const [heatmapData, setHeatmapData] = useState([]);

    useEffect(() => {
        if (!user) return;
        const fetchHeatmap = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/analytics/${user.id}`, {
                    credentials: 'include',
                });
                if (!res.ok) {
                    console.warn('Analytics fetch returned non-OK status:', res.status);
                    return;
                }
                const data = await res.json();
                if (!data || typeof data !== 'object') {
                    console.warn('Received invalid heatmap data:', data);
                    return;
                }
                const parsed = Object.entries(data).map(([date, xp]) => ({
                    date,
                    count: xp,
                }));
                setHeatmapData(parsed);
            } catch (err) {
                console.error('Failed to fetch heatmap data:', err);
            }
        };
        fetchHeatmap();
    }, [user]);

    return (
        <div className="p-4">
            <h2 className="text-white text-xl font-bold mb-4">XP Heatmap</h2>
            {heatmapData.length === 0 ? (
                <p className="text-gray-400">No data available yet.</p>
            ) : (
                <pre className="text-white">{JSON.stringify(heatmapData, null, 2)}</pre>
            )}
        </div>
    );
}

export default XPHeatmap;



