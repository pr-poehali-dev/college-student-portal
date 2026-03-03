import Icon from '@/components/ui/icon';

interface Props {
  initialized: boolean;
  onStudentClick: () => void;
  onAdminClick: () => void;
  onRegisterClick: () => void;
}

const LandingPage = ({ initialized, onStudentClick, onAdminClick, onRegisterClick }: Props) => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, hsl(258,90%,66%) 0%, transparent 70%)' }} />
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, hsl(185,85%,55%) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, hsl(258,90%,66%) 0%, transparent 70%)' }} />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-8">
        {/* Logo badge */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl neon-glow flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, hsl(258,90%,66%), hsl(230,80%,60%))' }}>
            <Icon name="GraduationCap" size={24} className="text-white" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium tracking-widest uppercase">Колледж</div>
            <div className="text-sm font-bold text-foreground">Группа 211-Г</div>
          </div>
        </div>

        {/* Main title */}
        <div className="text-center">
          <h1 className="text-4xl font-black text-foreground leading-tight mb-3">
            Добро<br />
            <span className="neon-text" style={{ color: 'hsl(258,90%,72%)' }}>пожаловать</span>
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
            Цифровой дневник группы — расписание, пропуски и рейтинг в одном месте
          </p>
        </div>

        {/* Action buttons */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={onStudentClick}
            className="w-full py-4 px-6 rounded-2xl font-semibold text-white text-base transition-all duration-200 active:scale-95 hover:opacity-90 neon-glow"
            style={{ background: 'linear-gradient(135deg, hsl(258,90%,60%), hsl(230,80%,55%))' }}
          >
            <span className="flex items-center justify-center gap-3">
              <Icon name="User" size={20} />
              Студенту
            </span>
          </button>

          <button
            onClick={onAdminClick}
            className="w-full py-4 px-6 rounded-2xl font-semibold text-foreground text-base transition-all duration-200 active:scale-95 hover:bg-[hsl(220,14%,20%)] glass gradient-border"
          >
            <span className="flex items-center justify-center gap-3">
              <Icon name="Shield" size={20} className="text-primary" />
              Администратору
            </span>
          </button>

          {!initialized && (
            <button
              onClick={onRegisterClick}
              className="w-full py-3 px-6 rounded-2xl font-medium text-sm transition-all duration-200 active:scale-95"
              style={{ color: 'hsl(185,85%,55%)', border: '1px dashed hsl(185,85%,30%)' }}
            >
              <span className="flex items-center justify-center gap-2">
                <Icon name="Plus" size={16} />
                Создать первый аккаунт администратора
              </span>
            </button>
          )}
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground/50 text-center">
          Все данные защищены и хранятся в базе
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
