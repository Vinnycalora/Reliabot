function Sidebar({ currentTab, setCurrentTab }) {
    const tabs = ['Status', 'Tasks', 'Logs'];

    return (
        <aside className="w-48 h-full bg-gray-800 text-white p-4 space-y-4">
            {tabs.map((tab) => (
                <button
                    key={tab}
                    className={`block w-full text-left px-2 py-1 rounded ${currentTab === tab ? 'bg-blue-600' : 'hover:bg-gray-700'
                        }`}
                    onClick={() => setCurrentTab(tab)}
                >
                    {tab}
                </button>
            ))}
        </aside>
    );
}

export default Sidebar;
