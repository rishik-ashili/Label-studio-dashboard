import React from 'react';

const Header = ({ onMenuClick }) => {
    return (
        <header className="bg-white shadow-sm border-b border-gray-200 px-3 sm:px-4 md:px-6 py-3 md:py-4">
            <div className="flex items-center justify-between">
                {/* Mobile menu button */}
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 mr-3"
                    aria-label="Toggle menu"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                <div className="flex-1">
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">Label Studio Analytics</h1>
                    <p className="text-xs sm:text-sm text-slate-600 hidden sm:block">Monitor all your Label Studio projects in one place</p>
                </div>

                {/* Optional: Add action buttons or search here */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Placeholder for future actions */}
                </div>
            </div>
        </header>
    );
};

export default Header;
