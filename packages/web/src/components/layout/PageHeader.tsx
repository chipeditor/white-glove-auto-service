import { clsx } from 'clsx';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, breadcrumbs, actions, className }: PageHeaderProps) {
  return (
    <div className={clsx('flex items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-wg-muted mb-1.5 sm:mb-2 overflow-x-auto">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
                {i > 0 && <span>›</span>}
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-wg-text transition-colors">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-wg-text2">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-xl sm:text-2xl font-semibold text-wg-text truncate">{title}</h1>
        {subtitle && <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-wg-text2">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 sm:gap-3 shrink-0">{actions}</div>}
    </div>
  );
}
