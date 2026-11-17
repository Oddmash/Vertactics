import type { ComponentPropsWithRef } from 'react';

export const Button = ({ className, type = 'button', ...props }: ComponentPropsWithRef<'button'>) =>
  <button {...props} type={type} className={className ? `ui-button ${className}` : 'ui-button'} />;

export const Select = ({ className, onKeyDown, ...props }: ComponentPropsWithRef<'select'>) =>
  <select {...props} className={className ? `ui-select ${className}` : 'ui-select'} onKeyDown={(event) => {
    onKeyDown?.(event);
    if (event.key === 'Escape' && CSS.supports('selector(select:open)') && event.currentTarget.matches(':open')) {
      event.stopPropagation();
    }
  }} />;

export const Input = ({ className, ...props }: ComponentPropsWithRef<'input'>) =>
  <input {...props} className={className ? `ui-input ${className}` : 'ui-input'} />;

export const Disclosure = ({ className, ...props }: ComponentPropsWithRef<'details'>) =>
  <details {...props} className={className ? `ui-disclosure ${className}` : 'ui-disclosure'} />;
