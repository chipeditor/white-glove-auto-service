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
    <div className={clsx('flex items-start justify-between', className)}>
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-2 text-sm text-wg-muted mb-2">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-2">
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
        <h1 className="text-2xl font-semibold text-wg-text">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-wg-text2">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
