import React, { useEffect, useState } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { subDays, format } from 'date-fns';

const HeatmapChart = ({ userId }) => {
    const [values, setValues] = useState([]);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_BASE_URL}/analytics/${userId}`)
            .then(res => res.json())
            .then(data => {
                const mapped = Object.entries(data.daily_counts || {}).map(([date, count]) => ({
                    date,
                    count,
                }));
                setValues(mapped);
            })
            .catch(console.error);
    }, [userId]);

    return (
        <div className="bg-[#1a1a1d] p-6 rounded-xl border border-gray-700 mt-6">
            <h3 className="text-xl font-semibold mb-4 text-sky-400">🔥 Streak Heatmap</h3>
            <CalendarHeatmap
                startDate={subDays(new Date(), 90)}
                endDate={new Date()}
                values={values}
                classForValue={value => {
                    if (!value || value.count === 0) return 'color-empty';
                    if (value.count === 1) return 'color-scale-1';
                    if (value.count === 2) return 'color-scale-2';
                    if (value.count >= 3) return 'color-scale-3';
                    return 'color-empty';
                }}
                tooltipDataAttrs={value => ({
                    'data-tip': `${value.date}: ${value.count || 0} task(s)`,
                })}
                showWeekdayLabels={true}
            />
        </div>
    );
};

export default HeatmapChart;
