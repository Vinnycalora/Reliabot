import React, { useEffect, useState } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { subDays } from 'date-fns';

function XPHeatmap({ userId }) {
    const [heatmapData, setHeatmapData] = useState([]);

    useEffect(() => {
        if (!userId) return;

        fetch(`${import.meta.env.VITE_API_BASE_URL}/analytics/${userId}`)
            .then(res => res.json())
            .then(data => {
                const mapped = Object.entries(data?.daily_counts || {}).map(([date, count]) => ({
                    date,
                    count: count || 0,
                }));
                setHeatmapData(mapped);
            })
            .catch(err => {
                console.error('Failed to load XP heatmap data:', err);
            });
    }, [userId]);

    const hasData = heatmapData.some(item => item.count > 0);

    return (
        <div className="mt-8">
            <h3 className="text-xl font-semibold mb-2 text-orange-400">🔥 XP Heatmap</h3>
            {hasData ? (
                <CalendarHeatmap
                    startDate={subDays(new Date(), 180)}
                    endDate={new Date()}
                    values={heatmapData}
                    classForValue={(value) => {
                        if (!value || !value.count) return 'color-empty';
                        if (value.count >= 4) return 'color-scale-4';
                        if (value.count >= 3) return 'color-scale-3';
                        if (value.count >= 2) return 'color-scale-2';
                        return 'color-scale-1';
                    }}
                    tooltipDataAttrs={value => {
                        if (!value?.date) return null;
                        return { 'data-tip': `${value.date}: ${value.count} XP` };
                    }}
                    showWeekdayLabels={true}
                />
            ) : (
                <p className="text-gray-400 mt-2">No XP data available yet.</p>
            )}
            <style>{`
                .color-empty { fill: #2f2f2f; }
                .color-scale-1 { fill: #003f5c; }
                .color-scale-2 { fill: #2f4b7c; }
                .color-scale-3 { fill: #665191; }
                .color-scale-4 { fill: #a05195; }
            `}</style>
        </div>
    );
}

export default XPHeatmap;
