import { useState } from 'react';
import { Absence } from '@/lib/types';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface Props {
  absences: Absence[];
  isAdmin: boolean;
  onUpdate?: () => void;
}

const AbsencesTab = ({ absences, isAdmin, onUpdate }: Props) => {
  const [editModal, setEditModal] = useState<Absence | null>(null);
  const [reason, setReason] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [saving, setSaving] = useState(false);

  const totalCount = absences.length;
  const bySubject = absences.reduce<Record<string, number>>((acc, a) => {
    acc[a.subject] = (acc[a.subject] || 0) + 1;
    return acc;
  }, {});

  const sortedSubjects = Object.entries(bySubject).sort((a, b) => b[1] - a[1]);
  const maxCount = sortedSubjects[0]?.[1] || 1;

  const handleEdit = (a: Absence) => {
    setEditModal(a);
    setReason(a.reason || '');
    setIsValid(a.is_valid);
  };

  const handleSave = async () => {
    if (!editModal) return;
    setSaving(true);
    try {
      await api.absences.update({ id: editModal.id, reason, is_valid: isValid });
      setEditModal(null);
      onUpdate?.();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold text-foreground">Пропуски</h2>

      {/* Stats card */}
      <div className="glass rounded-2xl p-4 gradient-border">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">Всего пропусков</span>
          <span className="text-2xl font-black text-foreground">{totalCount}</span>
        </div>
        {totalCount === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            <Icon name="CheckCircle" size={24} className="mx-auto mb-1 text-green-400" />
            Пропусков нет
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sortedSubjects.map(([subject, count]) => (
              <div key={subject}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-foreground font-medium">{subject}</span>
                  <span className="text-xs text-muted-foreground">{count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(count / maxCount) * 100}%`,
                      background: 'linear-gradient(90deg, hsl(258,90%,60%), hsl(185,85%,55%))'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Absence list */}
      {absences.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-muted-foreground">История пропусков</h3>
          {absences.map(a => (
            <div key={a.id} className="glass rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {isAdmin && (
                      <span className="text-xs font-semibold text-primary truncate">{a.student_name}</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-lg ${a.is_valid ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                      {a.is_valid ? 'Уважительная' : 'Неуважительная'}
                    </span>
                  </div>
                  <div className="font-semibold text-foreground text-sm">{a.subject}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {new Date(a.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  {a.reason && (
                    <div className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                      <Icon name="MessageSquare" size={11} className="mt-0.5 flex-shrink-0" />
                      {a.reason}
                    </div>
                  )}
                </div>
                {isAdmin && (
                  <button onClick={() => handleEdit(a)}
                    className="flex-shrink-0 w-8 h-8 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                    <Icon name="Pencil" size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editModal && isAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center p-4" onClick={() => setEditModal(null)}>
          <div className="glass-strong rounded-3xl p-6 w-full max-w-sm gradient-border" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">Редактировать пропуск</h3>
              <button onClick={() => setEditModal(null)} className="text-muted-foreground hover:text-foreground">
                <Icon name="X" size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                <span className="text-foreground font-medium">{editModal.student_name}</span> — {editModal.subject}
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Причина</label>
                <input type="text" value={reason} onChange={e => setReason(e.target.value)}
                  placeholder="Укажите причину"
                  className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary placeholder:text-muted-foreground/50" />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsValid(!isValid)}
                  className={`w-10 h-6 rounded-full transition-all duration-200 flex-shrink-0 ${isValid ? 'bg-green-500' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-all duration-200 mx-1 ${isValid ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
                <span className="text-sm text-foreground">Уважительная причина</span>
              </div>
              <button onClick={handleSave} disabled={saving}
                className="w-full py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, hsl(258,90%,60%), hsl(230,80%,55%))' }}>
                {saving ? 'Сохраняем...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbsencesTab;
