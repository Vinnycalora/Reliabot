import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { motion, AnimatePresence } from 'framer-motion';  // ✅ used for tab transitions and task animations
import Navbar from './Navbar';
import GlitchLoader from './GlitchLoader';

function App() {
    const [currentTab, setCurrentTab] = useState('Status');
    const [statusData, setStatusData] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [streak, setStreak] = useState(null);
    const [summary, setSummary] = useState(null);

    const BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        if (currentTab === 'Status') {
            fetch(`${BASE_URL}/status`)
                .then((res) => res.json())
                .then((data) => setStatusData(data))
                .catch((err) => console.error('Failed to fetch status:', err));

            fetch(`${BASE_URL}/streak/test_user`)
                .then((res) => res.json())
                .then((data) => setStreak(data.streak))
                .catch((err) => console.error('Failed to fetch streak:', err));
        }

        if (currentTab === 'Tasks') {
            fetch(`${BASE_URL}/tasks/test_user`)
                .then((res) => res.json())
                .then((data) => setTasks(data))
                .catch((err) => console.error('Failed to fetch tasks:', err));
        }

        if (currentTab === 'Logs') {
            fetch(`${BASE_URL}/summary/test_user`)
                .then((res) => res.json())
                .then((data) => {
                    setStreak(data.streak);
                    setSummary({
                        completedThisWeek: data.completed_this_week,
                        totalCompleted: data.total_completed,
                    });
                })
                .catch((err) => {
                    console.error('Failed to fetch summary:', err);
                });
        }
    }, [currentTab, BASE_URL]);

    return (
        <div className="dark flex flex-col h-screen bg-black text-white">
            <Navbar />
            <div className="flex flex-1">
                <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
                <main className="flex-1 px-4 py-6 bg-[#0e0e10] text-white sm:px-6">
                    <AnimatePresence mode="wait">
                        {currentTab === 'Status' && (
                            <motion.div
                                key="status"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-4"
                            >
                                <div className="space-y-4">
                                    <h2 className="text-3xl font-semibold text-sky-400 mb-4">🚀 Bot Status</h2>

                                    {statusData ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-[#1a1a1d] p-4 rounded-xl shadow-lg border border-gray-700 transition-transform duration-200 hover:-translate-y-1">
                                                <p className="text-gray-400 mb-1">Status</p>
                                                <p className="text-green-400 text-lg font-bold">🟢 {statusData.status}</p>
                                            </div>
                                            <div className="bg-[#1a1a1d] p-4 rounded-xl shadow-lg border border-gray-700 transition-transform duration-200 hover:-translate-y-1">
                                                <p className="text-gray-400 mb-1">Uptime</p>
                                                <p className="text-sky-300 text-lg font-semibold">⏱️ {Math.floor(statusData.uptime)} sec</p>
                                            </div>
                                            <div className="bg-[#1a1a1d] p-4 rounded-xl shadow-lg border border-gray-700 transition-transform duration-200 hover:-translate-y-1">
                                                <p className="text-gray-400 mb-1">Timestamp</p>
                                                <p className="text-sky-200 text-sm">{statusData.timestamp}</p>
                                            </div>
                                            <div className="bg-[#1a1a1d] p-4 rounded-xl shadow-lg border border-gray-700 transition-transform duration-200 hover:-translate-y-1">
                                                <p className="text-gray-400 mb-1">Current Streak</p>
                                                <p className="text-yellow-400 text-lg font-bold">🔥 {streak !== null ? `${streak} day(s)` : 'Loading...'}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <GlitchLoader />
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                        {currentTab === 'Tasks' && (
                            <motion.div
                                key="tasks"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className=""
                            >
                                <div>
                                    <h2 className="text-3xl font-semibold text-sky-400 mb-6">📝 Your Tasks</h2>

                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            const taskInput = e.target.elements.task;
                                            const newTask = taskInput.value.trim();
                                            if (!newTask) return;

                                            fetch(`${BASE_URL}/task`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    user_id: 'test_user',
                                                    task: newTask,
                                                    remind_time: new Date().toISOString(),
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
                                                            user_id: 'test_user',
                                                            task: newTask,
                                                            completed: 0,
                                                            created_at: new Date().toISOString(),
                                                            completed_at: null,
                                                        },
                                                        ...prev,
                                                    ]);
                                                    taskInput.value = '';
                                                })
                                                .catch((err) => {
                                                    console.error('Failed to create task:', err);
                                                    alert('Could not add task. Check backend logs.');
                                                });
                                        }}
                                        className="mb-6 flex gap-3"
                                    >
                                        <input
                                            type="text"
                                            name="task"
                                            placeholder="Type a new task..."
                                            className="flex-1 p-3 rounded-lg bg-[#1a1a1d] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                                        />
                                        <button
                                            type="submit"
                                            className="px-6 py-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold transition-all transform hover:scale-105 shadow-md hover:shadow-sky-500/50"
                                        >
                                            ➕ Add Task
                                        </button>
                                    </form>

                                    {tasks.length > 0 ? (
                                        <AnimatePresence>
                                            <ul className="space-y-4">
                                                {tasks.map((task) => (
                                                    <motion.li
                                                        key={task.id || task.task}
                                                        initial={{ opacity: 0, y: 8 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -8 }}
                                                        layout
                                                        transition={{ duration: 0.2 }}
                                                        className="p-4 bg-[#121214] border border-gray-700 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 ease-in-out">
                                                        <div className="flex justify-between items-center">
                                                            <span className={`${task.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                                                                {task.task || '(Unnamed task)'}
                                                            </span>
                                                            <div className="flex gap-3 items-center">
                                                                <span className={`text-sm font-medium ${task.completed ? 'text-green-400' : 'text-yellow-400'}`}>
                                                                    {task.completed ? '✅ Done' : '⏳ Pending'}
                                                                </span>
                                                                {!task.completed && (
                                                                    <button
                                                                        onClick={() => {
                                                                            fetch(`${BASE_URL}/done`, {
                                                                                method: 'POST',
                                                                                headers: { 'Content-Type': 'application/json' },
                                                                                body: JSON.stringify({
                                                                                    user_id: task.user_id,
                                                                                    task: task.task,
                                                                                }),
                                                                            })
                                                                                .then((res) => {
                                                                                    if (!res.ok) throw new Error('Failed to mark task as done');
                                                                                    return res.json();
                                                                                })
                                                                                .then(() => {
                                                                                    setTasks((prev) =>
                                                                                        prev.map((t) =>
                                                                                            t.task === task.task
                                                                                                ? {
                                                                                                    ...t,
                                                                                                    completed: 1,
                                                                                                    completed_at: new Date().toISOString(),
                                                                                                }
                                                                                                : t
                                                                                        )
                                                                                    );
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
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            Created: {task.created_at ? new Date(task.created_at).toLocaleString() : 'Unknown'}
                                                            {task.completed_at && (
                                                                <> | Completed: {new Date(task.completed_at).toLocaleString()}</>
                                                            )}
                                                        </div>
                                                    </motion.li>
                                                ))}
                                            </ul>
                                        </AnimatePresence>
                                    ) : (
                                        <GlitchLoader />
                                    )}
                                </div>
                            </motion.div>
                        )
                        }
                    </AnimatePresence >

                    <AnimatePresence mode="wait">
                        {currentTab === 'Logs' && (
                            <motion.div
                                key="logs"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <div className="space-y-6">
                                    <h2 className="text-3xl font-semibold text-sky-400">📊 Activity Log</h2>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-[#0e0e10] p-5 rounded-2xl border border-gray-700 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-200">
                                            <p className="text-gray-400 text-sm mb-1">Current Streak</p>
                                            <p className="text-yellow-400 text-lg font-bold">🔥 <span className="text-orange-400 text-3xl font-bold">{streak}</span> day{streak === 1 ? '' : 's'}</p>
                                        </div>

                                        <div className="bg-[#0e0e10] p-5 rounded-2xl border border-gray-700 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-200">
                                            <p className="text-gray-400 text-sm mb-1">This Week</p>
                                            <p className="text-green-400 text-lg font-bold">✅ <span className="text-green-400 text-3xl font-bold">{summary?.completedThisWeek || 0}</span> task(s)</p>
                                        </div>

                                        <div className="bg-[#0e0e10] p-5 rounded-2xl border border-gray-700 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-200">
                                            <p className="text-gray-400 text-sm mb-1">All-Time Total</p>
                                            <p className="text-sky-300 text-lg font-bold">📈 <span className="text-sky-400 text-3xl font-bold">{summary?.totalCompleted || 0}</span> task(s)</p>
                                        </div>
                                    </div>

                                    {!summary && (
                                        <GlitchLoader />
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence >
                </main >
            </div >
        </div >
    );
}

export default App;









