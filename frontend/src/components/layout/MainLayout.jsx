import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = ({ children, onRefreshAll, refreshing }) => {
    const labelStudioUrl = import.meta.env.VITE_LABEL_STUDIO_URL || 'http://localhost:8080';

    return (
        <div className="flex h-screen">
            <Sidebar
                labelStudioUrl={labelStudioUrl}
                onRefreshAll={onRefreshAll}
                refreshing={refreshing}
            />

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
