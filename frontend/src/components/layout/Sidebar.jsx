import React from 'react';
import { useNotifications } from '../../hooks/useNotifications';

const Sidebar = ({ activeTab, onTabChange }) => {
    const { notifications } = useNotifications();

    const navItems = [
        { id: 'projects', label: 'Projects', icon: '📁' },
        { id: 'classes', label: 'Classes', icon: '📊' },
        { id: 'checkpoints', label: 'Checkpoints', icon: '🎯' },
        { id: 'kaggle', label: 'Kaggle Data', icon: '📦' },
        { id: 'metrics', label: 'Data Metrics', icon: '📈' },
        { id: 'settings', label: 'Settings', icon: '⚙️' },
        { id: 'notifications', label: 'Notifications', icon: '🔔', badge: notifications.length }
    ];

    return (
        <div className="w-64 bg-gray-900 text-white flex flex-col h-screen">
            {/* Logo/Header */}
            <div className="p-4 border-b border-gray-700">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <span className="text-2xl">📊</span>
                    <span>Label Studio</span>
                </h1>
                <p className="text-xs text-gray-400 mt-1">Analytics Dashboard</p>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 overflow-y-auto py-4">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${activeTab === item.id
                                ? 'bg-blue-600 text-white font-semibold'
                                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                            }${navItems.indexOf(item) === navItems.length - 2 ? ' mt-auto' : ''}`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-xl">{item.icon}</span>
                            <span>{item.label}</span>
                        </div>
                        {item.badge > 0 && (
                            <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-bold">
                                {item.badge}
                            </span>
                        )}
                    </button>
                ))}
            </nav>

            {/* Training Notifications Summary */}
            {notifications.length > 0 && (
                <div className="p-4 border-t border-gray-700">
                    <div className="text-xs font-semibold text-gray-400 mb-2">
                        TRAINING NOTIFICATIONS
                    </div>
                    <div className="bg-yellow-600 rounded-lg p-3 cursor-pointer hover:bg-yellow-500 transition-colors"
                        onClick={() => onTabChange('notifications')}>
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-sm">Ready for Training</span>
                            <span className="text-xs bg-white bg-opacity-30 px-2 py-0.5 rounded">
                                {notifications.length}
                            </span>
                        </div>
                        <div className="text-xs opacity-90">
                            {notifications[0]?.title || 'View all notifications'}
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="p-4 border-t border-gray-700 text-xs text-gray-500">
                <div>v1.0.0</div>
            </div>
        </div>
    );
};

export default Sidebar;
