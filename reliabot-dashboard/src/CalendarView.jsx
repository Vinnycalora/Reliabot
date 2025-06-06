import React, { useState, useEffect } from 'react';
import './calendar-custom.css';

const CalendarView = ({ userId }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        if (!userId) return;
        fetch(`${import.meta.env.VITE_API_BASE_URL}/tasks/${userId}`, {
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => setTasks(data))
            .catch(err => {
                console.error("Error fetching tasks:", err);
                setTasks([]);
            });
    }, [userId]);

    const getDaysInMonth = (date) => {
        const start = new Date(date.getFullYear(), date.getMonth(), 1);
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const days = [];

        const offset = start.getDay();
        for (let i = 0; i < offset; i++) days.push(null);

        for (let d = 1; d <= end.getDate(); d++) {
            days.push(new Date(date.getFullYear(), date.getMonth(), d));
        }

        return days;
    };

    const goToMonth = (offset) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setCurrentDate(newDate);
    };

    const selectedTasks = tasks.filter(
        t => new Date(t.created_at).toDateString() === selectedDate.toDateString()
    );

    const days = getDaysInMonth(currentDate);

    return (
        <div className="calendar-container">
            <div className="calendar-header">
                <button onClick={() => goToMonth(-1)}>&larr;</button>
                <h2>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                <button onClick={() => goToMonth(1)}>&rarr;</button>
            </div>

            <div className="calendar-grid">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="calendar-day-header">{d}</div>
                ))}
                {days.map((day, idx) => {
                    const dayTasks = tasks.filter(
                        t => day && new Date(t.created_at).toDateString() === day.toDateString()
                    );

                    const isToday = day && new Date().toDateString() === day.toDateString();
                    const isSelected = day && selectedDate.toDateString() === day.toDateString();

                    return (
                        <div
                            key={idx}
                            className={`calendar-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${dayTasks.length ? 'has-tasks' : ''}`}
                            onClick={() => day && setSelectedDate(day)}
                        >
                            {day && (
                                <>
                                    <div className="calendar-number">{day.getDate()}</div>
                                    {dayTasks.length > 0 && (
                                        <div className="task-dots">
                                            {dayTasks.slice(0, 3).map((_, i) => (
                                                <span key={i} className="task-dot" />
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="task-list-section">
                <h3>
                    📅 Tasks for {selectedDate.toLocaleDateString('en-GB', {
                        weekday: 'short', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                </h3>
                {selectedTasks.length === 0 ? (
                    <p>No tasks on this day.</p>
                ) : (
                    <ul className="task-list">
                        {selectedTasks.map(task => (
                            <li key={task.id} className={`task-item ${task.completed ? 'done' : ''}`}>
                                <span>{task.task}</span>
                                <span className="timestamp">
                                    {new Date(task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default CalendarView;

