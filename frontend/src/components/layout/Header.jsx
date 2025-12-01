import React from 'react';

const Header = () => {
    return (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
                <span className="text-3xl mr-3">📊</span>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Label Studio Analytics Dashboard</h1>
                    <p className="text-sm text-gray-600">Monitor all your Label Studio projects in one place</p>
                </div>
            </div>
        </div>
    );
};

export default Header;
