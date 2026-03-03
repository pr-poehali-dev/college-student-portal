import { Absence, User } from '@/lib/types';
import Icon from '@/components/ui/icon';

interface Props {
  allAbsences: Absence[];
  allUsers: User[];
  currentUserId: number;
}

const RatingTab = ({ allAbsences, allUsers, currentUserId }: Props) => {
  const counts = allUsers.reduce<Record<number, number>>((acc, u) => {
    acc[u.id] = allAbsences.filter(a => a.student_id === u.id).length;
    return acc;
  }, {});

  const sorted = [...allUsers].sort((a, b) => (counts[a.id] || 0) - (counts[b.id] || 0));

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Рейтинг группы</h2>
        <span className="text-xs text-muted-foreground">{allUsers.length} студентов</span>
      </div>

      <div className="glass rounded-2xl p-4 text-center gradient-border">
        <div className="text-4xl mb-1">🏆</div>
        <p className="text-xs text-muted-foreground">Меньше пропусков — выше в рейтинге</p>
      </div>

      <div className="flex flex-col gap-2">
        {sorted.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-muted-foreground text-sm">
            <Icon name="Users" size={24} className="mx-auto mb-2 opacity-40" />
            Нет студентов
          </div>
        ) : (
          sorted.map((user, idx) => {
            const count = counts[user.id] || 0;
            const isMe = user.id === currentUserId;
            const isMedal = idx < 3 && count === 0;
            return (
              <div
                key={user.id}
                className={`rounded-2xl p-4 transition-all duration-200 ${
                  isMe
                    ? 'border border-primary/50 bg-primary/5'
                    : 'glass'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 flex items-center justify-center flex-shrink-0">
                    {isMedal ? (
                      <span className="text-xl">{medals[idx]}</span>
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">#{idx + 1}</span>
                    )}
                  </div>
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: isMe ? 'linear-gradient(135deg, hsl(258,90%,60%), hsl(230,80%,55%))' : 'rgba(255,255,255,0.07)' }}>
                      <span className={isMe ? 'text-white' : 'text-muted-foreground'}>
                        {user.display_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground text-sm flex items-center gap-2">
                      {user.display_name}
                      {isMe && <span className="text-[10px] text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded-md">Вы</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">@{user.username}</div>
                  </div>
                  <div className={`flex-shrink-0 text-right ${count === 0 ? 'text-green-400' : count <= 3 ? 'text-yellow-400' : 'text-red-400'}`}>
                    <div className="text-lg font-black">{count}</div>
                    <div className="text-[10px] text-muted-foreground">пропусков</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RatingTab;
