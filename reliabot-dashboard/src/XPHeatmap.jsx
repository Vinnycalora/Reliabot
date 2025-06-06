import React, { useEffect, useState } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import './calendar-custom.css'; // optional custom style

const XPHeatmap = ({ userId }) => {
    const [heatmapData, setHeatmapData] = useState([]);

    useEffect(() => {
        if (!userId) return;

        fetch(`${import.meta.env.VITE_API_BASE_URL}/xp_heatmap/${userId}`, {
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => {
                const mapped = Object.entries(data || {}).map(([date, count]) => ({
                    date,
                    count: count || 0,
                }));
                setHeatmapData(mapped);
            })
            .catch(err => {
                console.error('Failed to load XP heatmap data:', err);
            });
    }, [userId]);

    return (
        <div className="bg-[#1a1a1d] p-6 rounded-xl border border-gray-700 mt-6">
            <h3 className="text-xl font-semibold mb-4 text-orange-400">🔥 XP Heatmap</h3>
            {heatmapData.length > 0 ? (
                <CalendarHeatmap
                    startDate={new Date(new Date().setDate(new Date().getDate() - 180))}
                    endDate={new Date()}
                    values={heatmapData}
                    classForValue={value => {
                        if (!value || value.count === 0) return 'color-empty';
                        if (value.count < 2) return 'color-scale-1';
                        if (value.count < 4) return 'color-scale-2';
                        if (value.count < 6) return 'color-scale-3';
                        return 'color-scale-4';
                    }}
                    tooltipDataAttrs={value =>
                        value.date
                            ? { 'data-tip': `${value.date}: ${value.count} XP` }
                            : { 'data-tip': 'No data' }
                    }
                    showWeekdayLabels
                />
            ) : (
                <p className="text-gray-400">No XP heatmap data available.</p>
            )}
        </div>
    );
};

export default XPHeatmap;

