import React from 'react';
import { useNotifications } from '../../hooks/useNotifications';

const Sidebar = ({ activeTab, onTabChange }) => {
    const { notifications } = useNotifications();

    const navItems = [
        {
            id: 'projects', label: 'Projects', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
            )
        },
        {
            id: 'classes', label: 'Classes', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )
        },
        {
            id: 'checkpoints', label: 'Checkpoints', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            id: 'kaggle', label: 'Kaggle Data', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            )
        },
        {
            id: 'metrics', label: 'Data Metrics', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            )
        },
        {
            id: 'settings', label: 'Settings', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            )
        },
        {
            id: 'notifications', label: 'Notifications', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            ), badge: notifications.length
        }
    ];

    return (
        <div className="w-64 bg-white text-slate-700 flex flex-col h-screen border-r border-gray-200 shadow-sm">
            {/* Logo Section */}
            <div className="p-5 border-b border-gray-200 flex items-center gap-3">
                <img
                    src="/dobbe-logo.png"
                    alt="Dobbe.ai"
                    className="h-8 w-auto"
                />
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 overflow-y-auto py-4 px-3">
                <div className="space-y-1">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`w-full px-4 py-3 flex items-center justify-between text-left rounded-lg transition-all ${activeTab === item.id
                                    ? 'bg-blue-50 text-blue-600 font-medium'
                                    : 'text-slate-600 hover:bg-gray-50 hover:text-slate-900'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className={activeTab === item.id ? 'text-blue-600' : 'text-slate-400'}>
                                    {item.icon}
                                </span>
                                <span className="text-sm">{item.label}</span>
                            </div>
                            {item.badge > 0 && (
                                <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold min-w-[20px] text-center">
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </nav>

            {/* Training Notifications Summary */}
            {notifications.length > 0 && (
                <div className="p-4 border-t border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                        Training Notifications
                    </div>
                    <div
                        className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg p-3 cursor-pointer hover:from-yellow-500 hover:to-orange-500 transition-all shadow-sm"
                        onClick={() => onTabChange('notifications')}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-sm text-white">Ready for Training</span>
                            <span className="text-xs bg-white bg-opacity-30 px-2 py-0.5 rounded text-white font-bold">
                                {notifications.length}
                            </span>
                        </div>
                        <div className="text-xs text-white opacity-90 truncate">
                            {notifications[0]?.project_title || 'View all notifications'}
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
                <div>v1.0.0</div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Online</span>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
