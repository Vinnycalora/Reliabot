﻿import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import GlitchLoader from './GlitchLoader';
import CalendarView from './CalendarView';
import AnalyticsChart from './AnalyticsChart';
import XPHeatmap from './XPHeatmap';
import XPBar from './XPBar';


function App() {
    const [currentTab, setCurrentTab] = useState('Status');
    const [statusData, setStatusData] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [streak, setStreak] = useState(null);
    const [summary, setSummary] = useState(null);
    const [user, setUser] = useState(undefined);
    const [showCompleted, setShowCompleted] = useState(false);
    const [filter, setFilter] = useState({
        label: '',
        priority: '',
        status: 'all', // all, active, completed
        search: '',
    });





    const BASE_URL = import.meta.env.VITE_API_BASE_URL;


    useEffect(() => {
        fetch(`${BASE_URL}/me`, { credentials: 'include' })
            .then(res => res.ok ? res.json() : null)
            .then(data => setUser(data))
            .catch(() => setUser(null));
    }, []);

    useEffect(() => {
        if (!user || !user.id) return;

        const fetchData = async () => {
            try {
                if (currentTab === 'Status') {
                    const [statusRes, streakRes] = await Promise.all([
                        fetch(`${BASE_URL}/status`).then((res) => res.json()),
                        fetch(`${BASE_URL}/streak/${user.id}`, { credentials: 'include' }).then((res) => res.json())
                    ]);
                    setStatusData(statusRes);
                    setStreak(streakRes.streak);
                }

                if (currentTab === 'Tasks') {
                    const taskRes = await fetch(`${BASE_URL}/tasks/${user.id}`, { credentials: 'include' }).then((res) => res.json());
                    setTasks(taskRes);
                }

                if (currentTab === 'Logs') {
                    const summaryRes = await fetch(`${BASE_URL}/summary/${user.id}`, { credentials: 'include' }).then((res) => res.json());
                    setStreak(summaryRes.streak);
                    setSummary({
                        completedThisWeek: summaryRes.completed_this_week,
                        totalCompleted: summaryRes.total_completed,
                    });
                }
            } catch (err) {
                console.error('Error loading dashboard data:', err);
            }
        };

        fetchData();
    }, [user, currentTab, BASE_URL]);

    if (user === undefined) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black text-white">
                <GlitchLoader />
            </div>
        );
    }

    if (user === null) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black text-white">
                <a
                    href={`https://discord.com/api/oauth2/authorize?client_id=${import.meta.env.VITE_DISCORD_CLIENT_ID}&redirect_uri=https://reliabot-production.up.railway.app/oauth/discord&response_type=code&scope=identify`}
                >
                    <button className="px-6 py-3 bg-sky-600 rounded-lg text-white font-bold hover:bg-sky-700">
                        🔐 Log In with Discord
                    </button>
                </a>
            </div>
        );
    }

    return (
        <div className="dark flex flex-col h-screen bg-black text-white">
            <Navbar />
            <div className="flex flex-1">
                <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
                <main className="flex-1 px-4 py-6 bg-[#0e0e10] text-white sm:px-6">
                    <AnimatePresence mode="wait">
                        {currentTab === 'Status' && (
                            <motion.div key="status" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-4">
                                <h2 className="text-3xl font-semibold text-sky-400 mb-4">🚀 Bot Status</h2>
                                {statusData ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-[#1a1a1d] p-4 rounded-xl shadow-lg border border-gray-700">🟢 {statusData.status}</div>
                                        <div className="bg-[#1a1a1d] p-4 rounded-xl shadow-lg border border-gray-700">⏱️ {Math.floor(statusData.uptime)} sec</div>
                                        <div className="bg-[#1a1a1d] p-4 rounded-xl shadow-lg border border-gray-700">{statusData.timestamp}</div>
                                        <div className="bg-[#1a1a1d] p-4 rounded-xl shadow-lg border border-gray-700">🔥 {streak} day(s)</div>
                                    </div>
                                ) : (
                                    <GlitchLoader />
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                        {currentTab === 'Calendar' && (
                            <motion.div key="calendar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                                <CalendarView userId={user.id} />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                        {currentTab === 'Tasks' && (
                            <motion.div key="tasks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                                <div>
                                    <h2 className="text-3xl font-semibold text-sky-400 mb-6">📝 Your Tasks</h2>
                                    <div className="flex items-center gap-3 mb-4">
                                        <label className="text-sm text-gray-300 flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={showCompleted}
                                                onChange={(e) => setShowCompleted(e.target.checked)}
                                                className="accent-sky-600"
                                            />
                                            Show completed tasks
                                        </label>
                                    </div>
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            const taskInput = e.target.elements.task;
                                            const descriptionInput = e.target.elements.description;
                                            const dueInput = e.target.elements.due_at;

                                            const newTask = taskInput.value.trim();
                                            const description = descriptionInput.value.trim();
                                            const due_at = dueInput.value || null;
                                            const dueDate = e.target.elements.due_at?.value.trim();
                                            const recurrenceInput = e.target.elements.recurrence;
                                            const recurrence = recurrenceInput?.value || null;
                                            const labelsInput = e.target.elements.labels;
                                            const labels = labelsInput.value.trim();
                                            const priorityInput = e.target.elements.priority;
                                            const priority = priorityInput?.value || null;




                                            if (!newTask) return;

                                            console.log("Submitting:", {
                                                name: newTask,
                                                due_at: due_at,
                                                description: description || null,
                                            });

                                            fetch(`${BASE_URL}/task`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                credentials: 'include',
                                                body: JSON.stringify({
                                                    name: newTask,
                                                    due_at: due_at,
                                                    description: description || null,
                                                    labels: labels || null,
                                                    priority,
                                                    recurrence
                                                }),

                                            })
                                                .then((res) => {
                                                    if (!res.ok) throw new Error('Failed to add task');
                                                    return res.json();
                                                })
                                                .then(() => {
                                                    setTasks((prev) => [
                                                        {
                                                            id: Date.now(),
                                                            user_id: user.id,
                                                            task: newTask,
                                                            description,
                                                            due_at,
                                                            completed: 0,
                                                            created_at: new Date().toISOString(),
                                                            completed_at: null,
                                                        },
                                                        ...prev,
                                                    ]);
                                                    taskInput.value = '';
                                                    descriptionInput.value = '';
                                                    dueInput.value = '';
                                                })
                                                .catch((err) => {
                                                    console.error('Failed to create task:', err);
                                                    alert('Could not add task. Check backend logs.');
                                                });
                                        }}
                                        className="mb-6 flex flex-col md:flex-row gap-3"
                                    >
                                        <input name="task" className="flex-1 p-3 rounded-lg bg-[#1a1a1d] text-white border border-gray-600" placeholder="Type a new task..." />
                                        <input name="description" className="flex-1 p-3 rounded-lg bg-[#1a1a1d] text-white border border-gray-600" placeholder="Optional description..." />
                                        <input name="due_at" type="datetime-local" className="p-3 rounded-lg bg-[#1a1a1d] text-white border border-gray-600" />
                                        <select name="recurrence" className="p-3 rounded-lg bg-[#1a1a1d] text-white border border-gray-600">
                                            <option value="">No repeat</option>
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                        </select>
                                        <input
                                            name="labels"
                                            className="flex-1 p-3 rounded-lg bg-[#1a1a1d] text-white border border-gray-600"
                                            placeholder="Add labels (e.g., work,focus)"
                                        />
                                        <select name="priority" className="p-3 rounded-lg bg-[#1a1a1d] text-white border border-gray-600">
                                            <option value="">Priority</option>
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>

                                        <button type="submit" className="px-6 py-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold">➕ Add Task</button>
                                    </form>
                                    {tasks.length > 0 ? (
                                        <>
                                            <div className="mb-4 flex flex-wrap gap-4 items-center">
                                                <input
                                                    placeholder="Search..."
                                                    value={filter.search}
                                                    onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
                                                    className="p-2 rounded bg-[#1a1a1d] border border-gray-700 text-white"
                                                />
                                                <select
                                                    value={filter.label}
                                                    onChange={(e) => setFilter((f) => ({ ...f, label: e.target.value }))}
                                                    className="p-2 rounded bg-[#1a1a1d] border border-gray-700 text-white"
                                                >
                                                    <option value="">All Labels</option>
                                                    {[...new Set(tasks.flatMap(t => (t.labels || '').split(',').map(l => l.trim())))].map((label, i) =>
                                                        label && <option key={i} value={label}>{label}</option>
                                                    )}
                                                </select>
                                                <select
                                                    value={filter.priority}
                                                    onChange={(e) => setFilter((f) => ({ ...f, priority: e.target.value }))}
                                                    className="p-2 rounded bg-[#1a1a1d] border border-gray-700 text-white"
                                                >
                                                    <option value="">All Priorities</option>
                                                    <option value="high">High</option>
                                                    <option value="medium">Medium</option>
                                                    <option value="low">Low</option>
                                                </select>
                                                <select
                                                    value={filter.status}
                                                    onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}
                                                    className="p-2 rounded bg-[#1a1a1d] border border-gray-700 text-white"
                                                >
                                                    <option value="all">All Tasks</option>
                                                    <option value="active">Active</option>
                                                    <option value="completed">Completed</option>
                                                </select>
                                            </div>

                                            <ul className="space-y-4">
                                                {tasks
                                                    .filter((task) => {
                                                        const matchesLabel = !filter.label || (task.labels || '').split(',').map(l => l.trim()).includes(filter.label);
                                                        const matchesPriority = !filter.priority || task.priority === filter.priority;
                                                        const matchesStatus =
                                                            filter.status === 'all' ||
                                                            (filter.status === 'completed' && task.completed) ||
                                                            (filter.status === 'active' && !task.completed);
                                                        const matchesSearch =
                                                            !filter.search || task.task.toLowerCase().includes(filter.search.toLowerCase());
                                                        const showBasedOnCompleted = showCompleted || !task.completed;
                                                        return matchesLabel && matchesPriority && matchesStatus && matchesSearch && showBasedOnCompleted;
                                                    })
                                                    .map((task) => (
                                                        <li key={task.id || task.task} className="p-4 bg-[#121214] border border-gray-700 rounded-xl">
                                                            <div className="flex justify-between items-start">
                                                                <span className={task.completed ? 'line-through text-gray-500' : 'text-white'}>
                                                                    {task.task}
                                                                </span>
                                                                {!task.completed && (
                                                                    <div className="flex flex-col items-end gap-1">
                                                                        <button
                                                                            onClick={() => {
                                                                                fetch(`${BASE_URL}/done`, {
                                                                                    credentials: 'include',
                                                                                    method: 'POST',
                                                                                    headers: { 'Content-Type': 'application/json' },
                                                                                    body: JSON.stringify({ user_id: user.id, task: task.task }),
                                                                                })
                                                                                    .then((res) => {
                                                                                        if (!res.ok) throw new Error('Failed to mark task as done');
                                                                                        return res.json();
                                                                                    })
                                                                                    .then(() => {
                                                                                        setTasks((prev) =>
                                                                                            prev.map((t) =>
                                                                                                t.task === task.task
                                                                                                    ? { ...t, completed: 1, completed_at: new Date().toISOString() }
                                                                                                    : t
                                                                                            )
                                                                                        );

                                                                                        // 💡 Fetch and update streak right after
                                                                                        fetch(`${BASE_URL}/streak/${user.id}`, { credentials: 'include' })
                                                                                            .then(res => res.json())
                                                                                            .then(data => setStreak(data.streak))
                                                                                            .catch(err => console.error('Failed to refresh streak:', err));
                                                                                    })
                                                                                    .catch((err) => {
                                                                                        console.error('Mark done failed:', err);
                                                                                        alert('Could not mark as done.');
                                                                                    });
                                                                            }}
                                                                            className="text-sm text-sky-400 hover:text-sky-300"
                                                                        >
                                                                            Mark Done
                                                                        </button>

                                                                        <button
                                                                            onClick={() => {
                                                                                fetch(`${BASE_URL}/task/${task.id}`, {
                                                                                    method: 'DELETE',
                                                                                    credentials: 'include',
                                                                                })
                                                                                    .then((res) => {
                                                                                        if (!res.ok) throw new Error('Failed to delete task');
                                                                                        setTasks((prev) => prev.filter((t) => t.id !== task.id));
                                                                                    })
                                                                                    .catch((err) => {
                                                                                        console.error('Delete failed:', err);
                                                                                        alert('Could not delete task.');
                                                                                    });
                                                                            }}
                                                                            className="text-sm text-red-400 hover:text-red-300"
                                                                        >
                                                                            🗑 Delete
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                Created: {new Date(task.created_at).toLocaleString()}
                                                                {task.completed_at && <> | Completed: {new Date(task.completed_at).toLocaleString()}</>}
                                                                {task.due_at && <> | Due: {new Date(task.due_at).toLocaleString()}</>}
                                                            </div>
                                                            {task.description && (
                                                                <div className="text-sm text-gray-300 mt-1">📝 {task.description}</div>
                                                            )}
                                                            {task.recurrence && (
                                                                <div className="text-sm text-indigo-400 mt-1">🔁 Repeats: {task.recurrence}</div>
                                                            )}
                                                            {task.labels && (
                                                                <div className="mt-1 flex flex-wrap gap-2">
                                                                    {task.labels.split(',').map((label, i) => (
                                                                        <span
                                                                            key={i}
                                                                            className="bg-indigo-700 text-white text-xs px-2 py-1 rounded-full"
                                                                        >
                                                                            #{label.trim()}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {task.priority && (
                                                                <div className="text-xs mt-1">
                                                                    <span
                                                                        className={`px-2 py-1 rounded-full font-bold ${task.priority === 'high' ? 'bg-red-600' :
                                                                            task.priority === 'medium' ? 'bg-yellow-500 text-black' :
                                                                                'bg-green-600'
                                                                            }`}
                                                                    >
                                                                        ⭐ {task.priority.toUpperCase()}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </li>
                                                    ))}
                                            </ul>
                                        </>
                                    ) : (
                                        <GlitchLoader />
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                        {currentTab === 'Logs' && (
                            <motion.div key="logs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                                <div className="space-y-6">
                                    <h2 className="text-3xl font-semibold text-sky-400">📊 Activity Log</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-[#0e0e10] p-5 rounded-2xl border border-gray-700 shadow-xl">🔥 {streak} day(s)</div>
                                        <div className="bg-[#0e0e10] p-5 rounded-2xl border border-gray-700 shadow-xl">✅ {summary?.completedThisWeek || 0} this week</div>
                                        <div className="bg-[#0e0e10] p-5 rounded-2xl border border-gray-700 shadow-xl">📈 {summary?.totalCompleted || 0} total</div>
                                    </div>

                                    
                                    <AnalyticsChart userId={user.id} />
                                    <XPBar userId={user.id} />
                                    <XPHeatmap userId={user.id} />

                                    {!summary && <GlitchLoader />}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}

export default App;










