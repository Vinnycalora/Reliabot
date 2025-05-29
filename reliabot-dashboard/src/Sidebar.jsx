function Sidebar({ currentTab, setCurrentTab }) {
    const tabs = [
        { label: 'Status', icon: '📊' },
        { label: 'Tasks', icon: '📝' },
        { label: 'Logs', icon: '📈' },
        { label: 'Calendar', icon: '📅' },
    ];

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-52 flex-col bg-[#0e0e10] border-r border-gray-800 text-white p-4 space-y-4 shadow-inner">
                <h2 className="text-lg font-semibold tracking-wide text-sky-400 mb-6">🔥 Reliabot</h2>
                {tabs.map((tab) => (
                    <button
                        key={tab.label}
                        className={`w-full text-left px-3 py-2 rounded-xl transition-all duration-200 font-medium
                            ${currentTab === tab.label
                                ? 'bg-sky-700 text-white shadow-lg'
                                : 'hover:bg-gray-800 text-gray-300 hover:text-white'
                            }`}
                        onClick={() => setCurrentTab(tab.label)}
                    >
                        {tab.label}
                    </button>
                ))}
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0e0e10] border-t border-gray-700 flex justify-around py-2 z-50">
                {tabs.map((tab) => (
                    <button
                        key={tab.label}
                        onClick={() => setCurrentTab(tab.label)}
                        className={`flex flex-col items-center text-xs ${currentTab === tab.label
                            ? 'text-sky-400 font-semibold'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <span className="text-lg">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </nav>
        </>
    );
}

export default Sidebar;


