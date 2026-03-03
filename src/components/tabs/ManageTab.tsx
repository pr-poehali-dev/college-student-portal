import { useState } from 'react';
import { User } from '@/lib/types';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface Props {
  allUsers: User[];
  onUpdate: () => void;
  currentAdmin: User;
}

type ManageView = 'list' | 'create' | 'edit';

const ManageTab = ({ allUsers, onUpdate, currentAdmin }: Props) => {
  const [view, setView] = useState<ManageView>('list');
  const [editUser, setEditUser] = useState<User | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'student' | 'admin'>('student');
  const [editPassword, setEditPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const students = allUsers.filter(u => u.role === 'student');
  const admins = allUsers.filter(u => u.role === 'admin');

  const handleCreate = async () => {
    setError('');
    if (!newUsername.trim() || !newPassword.trim()) { setError('Заполните логин и пароль'); return; }
    setSaving(true);
    try {
      await api.users.create({
        username: newUsername.trim(),
        password: newPassword.trim(),
        role: newRole,
        display_name: newDisplayName.trim() || newUsername.trim(),
      });
      setNewUsername(''); setNewDisplayName(''); setNewPassword(''); setNewRole('student');
      setSuccess('Аккаунт создан!');
      setTimeout(() => setSuccess(''), 3000);
      onUpdate();
      setView('list');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка создания');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    setSaving(true);
    setError('');
    try {
      const data: Record<string, unknown> = { id: editUser.id };
      if (editPassword.trim()) data.password = editPassword.trim();
      await api.users.update(data);
      setEditPassword('');
      setSuccess('Пароль обновлён!');
      setTimeout(() => setSuccess(''), 3000);
      onUpdate();
      setView('list');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const UserRow = ({ u }: { u: User }) => (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-3">
        {u.avatar_url ? (
          <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{
              background: u.role === 'admin'
                ? 'linear-gradient(135deg, hsl(185,85%,35%), hsl(185,85%,25%))'
                : 'linear-gradient(135deg, hsl(258,90%,40%), hsl(230,80%,35%))'
            }}>
            <span className="text-white">{u.display_name.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-foreground text-sm">{u.display_name}</div>
          <div className="text-xs text-muted-foreground">@{u.username}</div>
        </div>
        {u.id !== currentAdmin.id && (
          <button
            onClick={() => { setEditUser(u); setEditPassword(''); setError(''); setView('edit'); }}
            className="flex-shrink-0 w-8 h-8 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
          >
            <Icon name="Pencil" size={13} />
          </button>
        )}
      </div>
    </div>
  );

  if (view === 'create') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => { setView('list'); setError(''); }} className="w-8 h-8 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-foreground">
            <Icon name="ArrowLeft" size={16} />
          </button>
          <h2 className="text-lg font-bold text-foreground">Создать аккаунт</h2>
        </div>

        <div className="glass rounded-2xl p-5 flex flex-col gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Роль</label>
            <div className="flex gap-2">
              {(['student', 'admin'] as const).map(r => (
                <button key={r} onClick={() => setNewRole(r)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${newRole === r ? 'text-white' : 'glass text-muted-foreground'}`}
                  style={newRole === r ? { background: 'linear-gradient(135deg, hsl(258,90%,60%), hsl(230,80%,55%))' } : {}}>
                  {r === 'student' ? 'Студент' : 'Администратор'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Имя</label>
            <input type="text" value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)}
              placeholder="Иванов Иван"
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary placeholder:text-muted-foreground/50" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Логин</label>
            <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)}
              placeholder="ivanov_ivan"
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary placeholder:text-muted-foreground/50" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Пароль</label>
            <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              placeholder="Задайте пароль"
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary placeholder:text-muted-foreground/50" />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm text-red-400 bg-red-500/10 border border-red-500/20 flex items-center gap-2">
              <Icon name="AlertCircle" size={14} />
              {error}
            </div>
          )}
          {success && (
            <div className="px-4 py-3 rounded-xl text-sm text-green-400 bg-green-500/10 border border-green-500/20 flex items-center gap-2">
              <Icon name="CheckCircle" size={14} />
              {success}
            </div>
          )}

          <button onClick={handleCreate} disabled={saving}
            className="w-full py-3.5 rounded-xl font-semibold text-white text-sm disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, hsl(258,90%,60%), hsl(230,80%,55%))' }}>
            {saving ? 'Создаём...' : 'Создать аккаунт'}
          </button>
        </div>
      </div>
    );
  }

  if (view === 'edit' && editUser) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => { setView('list'); setError(''); }} className="w-8 h-8 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-foreground">
            <Icon name="ArrowLeft" size={16} />
          </button>
          <h2 className="text-lg font-bold text-foreground">Редактировать</h2>
        </div>

        <div className="glass rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-white"
              style={{ background: 'linear-gradient(135deg, hsl(258,90%,60%), hsl(230,80%,55%))' }}>
              {editUser.display_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-foreground">{editUser.display_name}</div>
              <div className="text-xs text-muted-foreground">@{editUser.username}</div>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Новый пароль</label>
            <input type="text" value={editPassword} onChange={e => setEditPassword(e.target.value)}
              placeholder="Введите новый пароль"
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary placeholder:text-muted-foreground/50" />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm text-red-400 bg-red-500/10 border border-red-500/20 flex items-center gap-2">
              <Icon name="AlertCircle" size={14} />
              {error}
            </div>
          )}
          {success && (
            <div className="px-4 py-3 rounded-xl text-sm text-green-400 bg-green-500/10 border border-green-500/20 flex items-center gap-2">
              <Icon name="CheckCircle" size={14} />
              {success}
            </div>
          )}

          <button onClick={handleEditSave} disabled={saving || !editPassword.trim()}
            className="w-full py-3.5 rounded-xl font-semibold text-white text-sm disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, hsl(258,90%,60%), hsl(230,80%,55%))' }}>
            {saving ? 'Сохраняем...' : 'Сохранить'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Управление</h2>
        <button
          onClick={() => { setView('create'); setError(''); setSuccess(''); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, hsl(258,90%,60%), hsl(230,80%,55%))' }}
        >
          <Icon name="Plus" size={14} />
          Добавить
        </button>
      </div>

      {/* Students */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Icon name="GraduationCap" size={14} className="text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Студенты ({students.length})</span>
        </div>
        <div className="flex flex-col gap-2">
          {students.length === 0 ? (
            <div className="glass rounded-2xl p-6 text-center text-muted-foreground text-sm">Нет студентов</div>
          ) : (
            students.map(u => <UserRow key={u.id} u={u} />)
          )}
        </div>
      </div>

      {/* Admins */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Icon name="Shield" size={14} className="text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Администраторы ({admins.length})</span>
        </div>
        <div className="flex flex-col gap-2">
          {admins.map(u => <UserRow key={u.id} u={u} />)}
        </div>
      </div>
    </div>
  );
};

export default ManageTab;
