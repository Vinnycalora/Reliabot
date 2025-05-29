import { useEffect, useState } from 'react';

function Navbar() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_BASE_URL}/me`, {
            credentials: 'include',
        })
            .then((res) => res.ok ? res.json() : null)
            .then((data) => setUser(data))
            .catch(() => { });
    }, []);

    return (
        <header className="w-full bg-[#0e0e10] text-white px-6 py-4 shadow-md border-b border-gray-800 flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-wide text-sky-400 drop-shadow-md">
                🔥 Reliabot Dashboard
            </h1>
            <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">v1.0</span>
                {user ? (
                    <span className="text-white text-sm">👤 {user.username}</span>
                ) : (
                    <a
                        href={`https://discord.com/oauth2/authorize?client_id=${import.meta.env.VITE_DISCORD_CLIENT_ID}&redirect_uri=${import.meta.env.VITE_DISCORD_REDIRECT_URI}&response_type=code&scope=identify`}
                        className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded transition duration-200 shadow"
                    >
                        Login with Discord
                    </a>
                )}
            </div>
        </header>
    );
}

export default Navbar;



