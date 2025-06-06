import React, { useEffect, useState } from 'react';

function XPBar({ userId }) {
    const [xpData, setXpData] = useState(null);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_BASE_URL}/xp/${userId}`)
            .then(res => res.json())
            .then(data => setXpData(data))
            .catch(err => console.error('Failed to fetch XP data:', err));
    }, [userId]);

    if (!xpData) return null;

    const { xp, level, progress } = xpData;
    const percentage = Math.min(100, Math.round((progress / 100) * 100));

    return (
        <div className="mt-6">
            <h3 className="text-lg font-semibold mb-1">🎮 Level {level}</h3>
            <div className="w-full bg-gray-700 h-5 rounded-lg overflow-hidden">
                <div
                    className="bg-sky-500 h-5 transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <p className="text-sm text-gray-300 mt-1">{progress} / 100 XP</p>
        </div>
    );
}

export default XPBar;
