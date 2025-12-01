import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = ({ activeTab, onTabChange, children }) => {
    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar activeTab={activeTab} onTabChange={onTabChange} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />

                <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
