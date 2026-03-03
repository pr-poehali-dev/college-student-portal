import { useState, useRef } from 'react';
import { User } from '@/lib/types';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface Props {
  user: User;
  onUserUpdate: (user: User) => void;
  isAdmin: boolean;
}

const ProfileTab = ({ user, onUserUpdate, isAdmin }: Props) => {
  const [displayName, setDisplayName] = useState(user.display_name);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setError(''); setSuccess('');
    if (password && password !== confirmPassword) { setError('Пароли не совпадают'); return; }
    if (password && password.length < 4) { setError('Пароль минимум 4 символа'); return; }
    setSaving(true);
    try {
      const updates: Record<string, unknown> = { id: user.id };
      if (isAdmin && displayName !== user.display_name) updates.display_name = displayName;
      if (password) updates.password = password;
      const updated = await api.users.update(updates);
      onUserUpdate(updated);
      setPassword(''); setConfirmPassword('');
      setSuccess('Данные сохранены!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError('Фото не более 2 МБ'); return; }
    setUploading(true);
    setError('');
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const res = await api.users.uploadAvatar(user.id, base64, file.type);
        const updated = await api.users.update({ id: user.id, avatar_url: res.url });
        onUserUpdate(updated);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold text-foreground">Профиль</h2>

      {/* Avatar */}
      <div className="glass rounded-2xl p-6 flex flex-col items-center gap-4 gradient-border">
        <div className="relative">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover ring-4 ring-primary/30" />
          ) : (
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black text-white ring-4 ring-primary/30"
              style={{ background: 'linear-gradient(135deg, hsl(258,90%,60%), hsl(230,80%,55%))' }}>
              {user.display_name.charAt(0).toUpperCase()}
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-white transition-all disabled:opacity-50"
            style={{ background: 'hsl(258,90%,60%)' }}
          >
            {uploading
              ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
              : <Icon name="Camera" size={12} />
            }
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

        <div className="text-center">
          <div className="font-bold text-foreground text-lg">{user.display_name}</div>
          <div className="text-sm text-muted-foreground">@{user.username}</div>
          <div className="flex items-center justify-center gap-1 mt-1">
            <Icon name={isAdmin ? 'Shield' : 'GraduationCap'} size={12} className="text-primary" />
            <span className="text-xs text-primary">{isAdmin ? 'Администратор' : 'Студент'}</span>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="glass rounded-2xl p-5 flex flex-col gap-4">
        {isAdmin && (
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Отображаемое имя</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
            />
          </div>
        )}

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Логин</label>
          <div className="px-4 py-3 rounded-xl bg-white/3 border border-border/50 text-muted-foreground text-sm flex items-center gap-2">
            <Icon name="Lock" size={14} />
            {user.username} <span className="text-xs">(нельзя изменить)</span>
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Новый пароль</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Оставьте пустым, чтобы не менять"
            className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary placeholder:text-muted-foreground/40"
          />
        </div>

        {password && (
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Подтвердите пароль</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Повторите новый пароль"
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary placeholder:text-muted-foreground/40"
            />
          </div>
        )}

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

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, hsl(258,90%,60%), hsl(230,80%,55%))' }}
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Сохраняем...
            </span>
          ) : 'Сохранить изменения'}
        </button>
      </div>
    </div>
  );
};

export default ProfileTab;
