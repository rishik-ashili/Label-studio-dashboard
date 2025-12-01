import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = ({ activeTab, onTabChange, children }) => {
    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            <Sidebar activeTab={activeTab} onTabChange={onTabChange} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />

                <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
