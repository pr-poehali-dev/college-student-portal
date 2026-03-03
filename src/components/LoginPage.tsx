import { useState } from 'react';
import { api } from '@/lib/api';
import { User } from '@/lib/types';
import Icon from '@/components/ui/icon';

interface Props {
  role: 'student' | 'admin' | 'register';
  onLogin: (user: User) => void;
  onBack: () => void;
}

const LoginPage = ({ role, onLogin, onBack }: Props) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const isRegister = role === 'register';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) { setError('Заполните все поля'); return; }
    setLoading(true);
    setError('');
    try {
      let user: User;
      if (isRegister) {
        user = await api.auth.registerAdmin(username.trim(), password.trim(), displayName.trim() || username.trim());
      } else {
        user = await api.auth.login(username.trim(), password.trim(), role);
      }
      onLogin(user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  const titles = {
    student: { icon: 'User', label: 'Вход для студента', color: 'hsl(258,90%,66%)' },
    admin: { icon: 'Shield', label: 'Вход для администратора', color: 'hsl(185,85%,55%)' },
    register: { icon: 'UserPlus', label: 'Регистрация администратора', color: 'hsl(142,70%,45%)' },
  };

  const t = titles[role];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-8"
          style={{ background: `radial-gradient(circle, ${t.color} 0%, transparent 70%)`, opacity: 0.08 }} />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 text-sm">
          <Icon name="ArrowLeft" size={16} />
          Назад
        </button>

        <div className="glass-strong rounded-3xl p-8 gradient-border">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: `linear-gradient(135deg, ${t.color}33, ${t.color}11)`, border: `1px solid ${t.color}44` }}>
              <Icon name={t.icon as "User"} size={26} style={{ color: t.color }} />
            </div>
            <h2 className="text-xl font-bold text-foreground text-center">{t.label}</h2>
            {isRegister && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Этот аккаунт станет главным администратором системы
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isRegister && (
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Имя для отображения</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Иванов Иван"
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors text-sm"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Логин</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Введите логин"
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors text-sm"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Пароль</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors text-sm"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1">
                  <Icon name={showPass ? 'EyeOff' : 'Eye'} size={16} />
                </button>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm text-red-400 bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                <Icon name="AlertCircle" size={14} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}bb)` }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isRegister ? 'Создаём...' : 'Входим...'}
                </span>
              ) : (
                isRegister ? 'Создать аккаунт' : 'Войти'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
