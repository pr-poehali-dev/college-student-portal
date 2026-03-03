import { Notification } from '@/lib/types';
import Icon from '@/components/ui/icon';

interface Props {
  notifications: Notification[];
  onClose: () => void;
}

const NotificationsPanel = ({ notifications, onClose }: Props) => {
  return (
    <div className="absolute top-[61px] left-0 right-0 z-30 mx-4 max-w-[calc(100%-2rem)]">
      <div className="glass-strong rounded-2xl border border-border shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="font-semibold text-sm text-foreground">Уведомления</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <Icon name="X" size={16} />
          </button>
        </div>
        <div className="max-h-72 overflow-y-auto scrollbar-thin">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <Icon name="BellOff" size={24} className="mx-auto mb-2 opacity-40" />
              Нет уведомлений
            </div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`px-4 py-3 border-b border-border/50 last:border-0 transition-colors ${!n.is_read ? 'bg-primary/5' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.is_read ? 'bg-primary' : 'bg-muted'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-snug">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(n.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPanel;
