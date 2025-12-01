import React from 'react';

const Header = () => {
    return (
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Label Studio Analytics Dashboard</h1>
                    <p className="text-sm text-gray-600">Monitor all your Label Studio projects in one place</p>
                </div>
            </div>
        </header>
    );
};

export default Header;
