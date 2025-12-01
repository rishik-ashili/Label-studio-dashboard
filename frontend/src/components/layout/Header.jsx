import React from 'react';

const Header = () => {
    return (
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Label Studio Analytics</h1>
                    <p className="text-sm text-slate-600">Monitor all your Label Studio projects in one place</p>
                </div>

                {/* Optional: Add action buttons or search here */}
                <div className="flex items-center gap-3">
                    {/* Placeholder for future actions */}
                </div>
            </div>
        </header>
    );
};

export default Header;
