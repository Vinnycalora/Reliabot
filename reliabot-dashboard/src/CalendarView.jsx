import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

function CalendarView({ user }) {
    const [tasks, setTasks] = useState([]);
    const [date, setDate] = useState(new Date());

    useEffect(() => {
        if (!user) return;
        const fetchTasks = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/tasks/${user.id}`, {
                    credentials: 'include',
                });
                if (!res.ok) throw new Error(`Failed to fetch tasks: ${res.status}`);
                const data = await res.json();
                setTasks(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Error fetching tasks:', err);
                setTasks([]);
            }
        };
        fetchTasks();
    }, [user]);

    const getTileClassName = ({ date: tileDate }) => {
        const hasTask = tasks.some(task => {
            const taskDate = new Date(task.created_at);
            return taskDate.toDateString() === tileDate.toDateString();
        });
        return hasTask ? 'calendar-task-day' : null;
    };

    return (
        <div className="p-4 text-white">
            <h2 className="text-xl font-bold mb-4">Task Calendar</h2>
            <Calendar
                onChange={setDate}
                value={date}
                tileClassName={getTileClassName}
                className="rounded-lg shadow-md"
            />
        </div>
    );
}

export default CalendarView;
