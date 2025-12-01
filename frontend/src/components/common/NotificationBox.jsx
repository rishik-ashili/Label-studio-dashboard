import React from 'react';

const NotificationBox = ({ notification, onDismiss, index }) => {
    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleDateString();
    };

    return (
        <div className="notification-box relative">
            <button
                onClick={() => onDismiss(index)}
                className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 font-bold"
            >
                ✕
            </button>

            <div className="pr-6">
                {notification.type === 'project' && (
                    <>
                        <strong>{notification.project_title}</strong><br />
                        Class: <strong>{notification.class_name.charAt(0).toUpperCase() + notification.class_name.slice(1)}</strong><br />
                        Increase: <span className="delta-positive">+{notification.increase_pct.toFixed(1)}%</span><br />
                        Images: {notification.checkpoint_count} → {notification.current_count}<br />
                        <small>From checkpoint: {formatDate(notification.checkpoint_date)}</small>
                    </>
                )}

                {notification.type === 'category' && (
                    <>
                        <strong>{notification.category} - {notification.xray_type}</strong><br />
                        Class: <strong>{notification.class_name.charAt(0).toUpperCase() + notification.class_name.slice(1)}</strong><br />
                        Increase: <span className="delta-positive">+{notification.increase_pct.toFixed(1)}%</span><br />
                        Images: {notification.checkpoint_count} → {notification.current_count}<br />
                        <small>From checkpoint: {formatDate(notification.checkpoint_date)}</small>
                    </>
                )}
            </div>
        </div>
    );
};

export default NotificationBox;
