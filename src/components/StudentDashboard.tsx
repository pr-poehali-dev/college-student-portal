import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { User, ScheduleItem, Absence, Notification } from '@/lib/types';
import Icon from '@/components/ui/icon';
import ScheduleTab from '@/components/tabs/ScheduleTab';
import AbsencesTab from '@/components/tabs/AbsencesTab';
import RatingTab from '@/components/tabs/RatingTab';
import ProfileTab from '@/components/tabs/ProfileTab';
import NotificationsPanel from '@/components/NotificationsPanel';

interface Props {
  user: User;
  onLogout: () => void;
  onUserUpdate: (user: User) => void;
}

type Tab = 'schedule' | 'absences' | 'rating' | 'profile';

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'schedule', icon: 'CalendarDays', label: 'Расписание' },
  { id: 'absences', icon: 'AlertTriangle', label: 'Пропуски' },
  { id: 'rating', icon: 'Trophy', label: 'Рейтинг' },
  { id: 'profile', icon: 'UserCircle', label: 'Профиль' },
];

const StudentDashboard = ({ user, onLogout, onUserUpdate }: Props) => {
  const [tab, setTab] = useState<Tab>('schedule');
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [allAbsences, setAllAbsences] = useState<Absence[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sch, abs, allAbs, users, notifs] = await Promise.all([
        api.schedule.getAll(),
        api.absences.getAll(user.id),
        api.absences.getAll(),
        api.users.getAll('student'),
        api.notifications.get(user.id),
      ]);
      setSchedule(sch);
      setAbsences(abs);
      setAllAbsences(allAbs);
      setAllUsers(users);
      setNotifications(notifs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkRead = async () => {
    await api.notifications.markRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto relative">
      {/* Header */}
      <div className="glass-strong border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/30" />
          ) : (
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, hsl(258,90%,66%), hsl(230,80%,60%))' }}>
              {user.display_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="text-sm font-semibold text-foreground leading-tight">{user.display_name}</div>
            <div className="text-xs text-muted-foreground">Группа 211-Г</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowNotif(!showNotif); if (!showNotif && unreadCount > 0) handleMarkRead(); }}
            className="relative w-9 h-9 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="Bell" size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          <button onClick={onLogout} className="w-9 h-9 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-red-400 transition-colors">
            <Icon name="LogOut" size={18} />
          </button>
        </div>
      </div>

      {/* Notification panel */}
      {showNotif && (
        <NotificationsPanel notifications={notifications} onClose={() => setShowNotif(false)} />
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin pb-24 px-4 pt-4">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {tab === 'schedule' && <ScheduleTab schedule={schedule} absences={absences} isAdmin={false} />}
            {tab === 'absences' && <AbsencesTab absences={absences} isAdmin={false} />}
            {tab === 'rating' && <RatingTab allAbsences={allAbsences} allUsers={allUsers} currentUserId={user.id} />}
            {tab === 'profile' && <ProfileTab user={user} onUserUpdate={onUserUpdate} isAdmin={false} />}
          </>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg glass-strong border-t border-border px-2 py-2 z-20">
        <div className="flex justify-around">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 flex-1 ${
                tab === t.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
                tab === t.id ? 'bg-primary/20 neon-glow' : ''
              }`}>
                <Icon name={t.icon as "Home"} size={18} />
              </div>
              <span className="text-[10px] font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
