import React from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationBox from '../common/NotificationBox';

const NotificationsPanel = () => {
    const { notifications, dismissNotification } = useNotifications();

    return (
        <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">🔔 Training Notifications</h3>

            {notifications.length === 0 ? (
                <div className="text-gray-600 text-sm">
                    <p>No training recommendations</p>
                    <p className="text-xs mt-1">Mark checkpoints to track progress</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.map((notif, idx) => (
                        <NotificationBox
                            key={idx}
                            notification={notif}
                            index={idx}
                            onDismiss={dismissNotification}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotificationsPanel;
