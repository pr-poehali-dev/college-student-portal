import { useState } from 'react';
import { ScheduleItem, Absence, User } from '@/lib/types';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';

const DAYS = ['', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const DAYS_FULL = ['', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

interface Props {
  schedule: ScheduleItem[];
  absences: Absence[];
  isAdmin: boolean;
  allUsers?: User[];
  adminId?: number;
  onAbsenceAdded?: () => void;
}

interface AbsenceModal {
  scheduleItem: ScheduleItem;
  absence?: Absence;
}

const ScheduleTab = ({ schedule, absences, isAdmin, allUsers = [], adminId, onAbsenceAdded }: Props) => {
  const today = new Date().getDay() || 7;
  const [selectedDay, setSelectedDay] = useState(today <= 6 ? today : 1);
  const [modal, setModal] = useState<AbsenceModal | null>(null);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [absenceDate, setAbsenceDate] = useState(new Date().toISOString().split('T')[0]);
  const [absenceReason, setAbsenceReason] = useState('');
  const [saving, setSaving] = useState(false);

  const daySchedule = schedule.filter(s => s.day_of_week === selectedDay).sort((a, b) => a.lesson_number - b.lesson_number);

  const getAbsenceForLesson = (scheduleId: number) => {
    return absences.filter(a => a.schedule_id === scheduleId);
  };

  const handleLessonClick = (item: ScheduleItem) => {
    if (!isAdmin) {
      const abs = getAbsenceForLesson(item.id);
      if (abs.length > 0) setModal({ scheduleItem: item, absence: abs[0] });
      return;
    }
    setModal({ scheduleItem: item });
    setSelectedStudent('');
    setAbsenceReason('');
  };

  const handleSaveAbsence = async () => {
    if (!selectedStudent || !modal) return;
    setSaving(true);
    try {
      await api.absences.create({
        student_id: parseInt(selectedStudent),
        schedule_id: modal.scheduleItem.id,
        date: absenceDate,
        reason: absenceReason || null,
        is_valid: false,
        created_by: adminId,
      });
      setModal(null);
      onAbsenceAdded?.();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Расписание</h2>
        <span className="text-xs text-muted-foreground">{DAYS_FULL[selectedDay]}</span>
      </div>

      {/* Day selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {[1, 2, 3, 4, 5, 6].map(d => {
          const hasLessons = schedule.some(s => s.day_of_week === d);
          return (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`flex-shrink-0 w-10 h-10 rounded-xl text-sm font-semibold transition-all duration-200 ${
                selectedDay === d
                  ? 'text-white neon-glow'
                  : 'glass text-muted-foreground hover:text-foreground'
              } ${!hasLessons ? 'opacity-40' : ''}`}
              style={selectedDay === d ? { background: 'linear-gradient(135deg, hsl(258,90%,60%), hsl(230,80%,55%))' } : {}}
            >
              {DAYS[d]}
            </button>
          );
        })}
      </div>

      {/* Lessons */}
      <div className="flex flex-col gap-2">
        {daySchedule.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-muted-foreground text-sm">
            <Icon name="Coffee" size={24} className="mx-auto mb-2 opacity-40" />
            Нет занятий
          </div>
        ) : (
          daySchedule.map(item => {
            const itemAbsences = getAbsenceForLesson(item.id);
            const hasAbsence = itemAbsences.length > 0;
            return (
              <button
                key={item.id}
                onClick={() => handleLessonClick(item)}
                className={`w-full text-left rounded-2xl p-4 transition-all duration-200 active:scale-[0.98] ${
                  hasAbsence ? 'border border-red-500/30 bg-red-500/5' : 'glass hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    hasAbsence ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-primary'
                  }`}>
                    {item.lesson_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground text-sm">{item.subject}</div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {item.time_start && (
                        <span className="text-xs text-muted-foreground">{item.time_start}–{item.time_end}</span>
                      )}
                      {item.room && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Icon name="MapPin" size={10} />
                          {item.room}
                        </span>
                      )}
                    </div>
                    {item.teacher && <div className="text-xs text-muted-foreground mt-0.5">{item.teacher}</div>}
                  </div>
                  {hasAbsence && (
                    <div className="flex-shrink-0">
                      <div className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded-lg">
                        <Icon name="X" size={10} />
                        {isAdmin ? `${itemAbsences.length} пр.` : 'Пропуск'}
                      </div>
                    </div>
                  )}
                  {isAdmin && (
                    <Icon name="Plus" size={14} className="text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center p-4" onClick={() => setModal(null)}>
          <div className="glass-strong rounded-3xl p-6 w-full max-w-sm gradient-border" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">{modal.scheduleItem.subject}</h3>
              <button onClick={() => setModal(null)} className="text-muted-foreground hover:text-foreground">
                <Icon name="X" size={18} />
              </button>
            </div>

            {!isAdmin && modal.absence && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon name="Calendar" size={14} />
                  {new Date(modal.absence.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                </div>
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-300 font-medium">Зафиксирован пропуск</p>
                  {modal.absence.reason ? (
                    <p className="text-xs text-muted-foreground mt-1">Причина: {modal.absence.reason}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">Причина не указана</p>
                  )}
                  {modal.absence.is_valid && (
                    <p className="text-xs text-green-400 mt-1">✓ Уважительная причина</p>
                  )}
                </div>
              </div>
            )}

            {!isAdmin && !modal.absence && (
              <p className="text-sm text-muted-foreground">По данному предмету пропусков нет</p>
            )}

            {isAdmin && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Студент</label>
                  <select
                    value={selectedStudent}
                    onChange={e => setSelectedStudent(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="">Выберите студента</option>
                    {allUsers.map(u => <option key={u.id} value={u.id}>{u.display_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Дата</label>
                  <input type="date" value={absenceDate} onChange={e => setAbsenceDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Причина (необязательно)</label>
                  <input type="text" value={absenceReason} onChange={e => setAbsenceReason(e.target.value)}
                    placeholder="Болезнь, справка и т.д."
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary placeholder:text-muted-foreground/50" />
                </div>
                <button
                  onClick={handleSaveAbsence}
                  disabled={!selectedStudent || saving}
                  className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, hsl(258,90%,60%), hsl(230,80%,55%))' }}
                >
                  {saving ? 'Сохраняем...' : 'Зафиксировать пропуск'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleTab;
