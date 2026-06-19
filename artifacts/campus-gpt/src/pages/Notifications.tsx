import { Bell, Circle } from 'lucide-react';
import { useListNotifications, useMarkNotificationRead } from '@workspace/api-client-react';

export default function Notifications() {
  const { data: notifications, isLoading } = useListNotifications();
  const markRead = useMarkNotificationRead();

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      <div className="h-14 border-b border-border flex items-center px-6 shrink-0 bg-background/80 backdrop-blur-sm z-10 sticky top-0 justify-between">
        <h1 className="font-semibold text-text-primary flex items-center gap-2">
          <Bell className="w-5 h-5 text-brand-500" />
          Notifications
        </h1>
      </div>

      <div className="p-6 overflow-y-auto max-w-3xl mx-auto w-full">
        {isLoading ? (
          <div className="text-text-tertiary">Loading notifications...</div>
        ) : notifications?.length ? (
          <div className="flex flex-col gap-2">
            {notifications.map(notif => (
              <div 
                key={notif.id} 
                className={`p-4 border rounded-xl flex items-start gap-4 transition-colors cursor-pointer
                  ${notif.read ? 'border-border bg-background hover:bg-sidebar' : 'border-brand-500/30 bg-brand-50/50 hover:bg-brand-50'}`}
                onClick={() => {
                  if (!notif.read) {
                    markRead.mutate({ notificationId: notif.id });
                  }
                }}
              >
                <div className="mt-1">
                  {notif.read ? (
                    <Circle className="w-2.5 h-2.5 text-text-tertiary fill-text-tertiary" />
                  ) : (
                    <Circle className="w-2.5 h-2.5 text-brand-500 fill-brand-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <h3 className={`text-sm font-medium ${notif.read ? 'text-text-secondary' : 'text-text-primary'}`}>
                      {notif.title}
                    </h3>
                    <span className="text-xs text-text-tertiary whitespace-nowrap">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={`text-sm ${notif.read ? 'text-text-tertiary' : 'text-text-secondary'}`}>
                    {notif.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-sidebar rounded-full flex items-center justify-center mb-4 text-text-tertiary">
              <Bell className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-1">All caught up</h3>
            <p className="text-sm text-text-secondary max-w-sm">You have no new notifications.</p>
          </div>
        )}
      </div>
    </div>
  );
}
