// src/GlitchLoader.jsx
function GlitchLoader() {
    return (
        <div className="flex items-center justify-center py-10">
            <div className="relative text-sky-400 text-lg font-mono font-semibold animate-pulse select-none">
                <span className="glitch relative block" data-text="Loading...">Loading...</span>
            </div>
        </div>
    );
}

export default GlitchLoader;
