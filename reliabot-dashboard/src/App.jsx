import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

function App() {
    const [currentTab, setCurrentTab] = useState('Status');
    const [statusData, setStatusData] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [streak, setStreak] = useState(null);
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        if (currentTab === 'Status') {
            fetch('https://reliabot-production.up.railway.app/status')
                .then((res) => res.json())
                .then((data) => setStatusData(data))
                .catch((err) => console.error('Failed to fetch status:', err));

            fetch('https://reliabot-production.up.railway.app/streak/test_user')
                .then((res) => res.json())
                .then((data) => setStreak(data.streak))
                .catch((err) => console.error('Failed to fetch streak:', err));
        }

        if (currentTab === 'Tasks') {
            fetch('https://reliabot-production.up.railway.app/tasks/test_user')
                .then((res) => res.json())
                .then((data) => setTasks(data))
                .catch((err) => console.error('Failed to fetch tasks:', err));
        }
        if (currentTab === 'Logs') {
            fetch('https://reliabot-production.up.railway.app/summary/test_user')
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
    }, [currentTab]);

    return (
        <div className="flex flex-col h-screen">
            <Navbar />
            <div className="flex flex-1">
                <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
                <main className="flex-1 p-6 bg-gray-100">
                    {currentTab === 'Status' && (
                        <div>
                            <h2 className="text-2xl font-bold mb-4">Bot Status</h2>
                            {statusData ? (
                                <div className="space-y-2">
                                    <p>🟢 {statusData.status}</p>
                                    <p>⏱️ Uptime: {Math.floor(statusData.uptime)} seconds</p>
                                    <p>📅 Timestamp: {statusData.timestamp}</p>
                                    <p>🔥 Streak: {streak !== null ? `${streak} days` : 'Loading...'}</p>
                                </div>
                            ) : (
                                <p>Loading status...</p>
                            )}
                        </div>
                    )}

                    {currentTab === 'Tasks' && (
                        <div>
                            <h2 className="text-2xl font-bold mb-4">Tasks</h2>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const taskInput = e.target.elements.task;
                                    const newTask = taskInput.value.trim();
                                    if (!newTask) return;

                                    fetch('https://reliabot-production.up.railway.app/task', {
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
                                className="mb-4 flex gap-2"
                            >
                                <input
                                    type="text"
                                    name="task"
                                    placeholder="Enter new task"
                                    className="flex-1 p-2 border border-gray-300 rounded"
                                />
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Add Task
                                </button>
                            </form>

                            {tasks.length > 0 ? (
                                <ul className="space-y-2">
                                    {tasks.map((task) => (
                                        <li key={task.id || task.task} className="p-3 bg-white rounded shadow">
                                            <div className="flex justify-between items-center">
                                                <span className={task.completed ? 'line-through text-gray-500' : ''}>
                                                    {task.task || '(Unnamed task)'}
                                                </span>
                                                <div className="flex gap-2 items-center">
                                                    <span
                                                        className={`text-sm ${task.completed ? 'text-green-600' : 'text-yellow-600'}`}
                                                    >
                                                        {task.completed ? '✅ Done' : '⏳ Pending'}
                                                    </span>
                                                    {!task.completed && (
                                                        <button
                                                            onClick={() => {
                                                                fetch('https://reliabot-production.up.railway.app/done', {
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
                                                            className="text-sm text-blue-600 hover:underline"
                                                        >
                                                            Mark Done
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                Created: {task.created_at
                                                    ? new Date(task.created_at).toLocaleString()
                                                    : 'Unknown'}
                                                {task.completed_at && (
                                                    <> | Completed: {new Date(task.completed_at).toLocaleString()}</>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No tasks yet.</p>
                            )}
                        </div>
                    )}

                    {currentTab === 'Logs' && (
                        <div>
                            <h2 className="text-2xl font-bold mb-4">Activity Log</h2>
                            <div className="space-y-2 text-gray-800">
                                {streak !== null && <p>🔥 Current Streak: {streak} day{streak === 1 ? '' : 's'}</p>}
                                {summary ? (
                                    <>
                                        <p>📅 Tasks completed this week: {summary.completedThisWeek}</p>
                                        <p>📈 Total completed tasks: {summary.totalCompleted}</p>
                                    </>
                                ) : (
                                    <p>📊 Fetching summary...</p>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default App;





