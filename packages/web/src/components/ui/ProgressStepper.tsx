import { clsx } from 'clsx';
import { Check } from 'lucide-react';

interface Step {
  label: string;
  completed?: boolean;
  active?: boolean;
}

interface ProgressStepperProps {
  steps: Step[];
  className?: string;
}

export function ProgressStepper({ steps, className }: ProgressStepperProps) {
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={clsx(
              'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
              step.completed
                ? 'bg-wg-green text-white'
                : step.active
                  ? 'bg-wg-blue text-white'
                  : 'bg-wg-card border border-wg-border text-wg-muted'
            )}
          >
            {step.completed ? <Check size={14} /> : i + 1}
          </div>
          <span
            className={clsx(
              'text-sm hidden sm:inline',
              step.active ? 'text-wg-text font-medium' : 'text-wg-muted'
            )}
          >
            {step.label}
          </span>
          {i < steps.length - 1 && (
            <div
              className={clsx(
                'w-8 h-px',
                step.completed ? 'bg-wg-green' : 'bg-wg-border'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
