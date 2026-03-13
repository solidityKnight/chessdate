import React from 'react';

type RomanticButtonVariant = 'primary' | 'secondary' | 'domain' | 'danger';

type RomanticButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: RomanticButtonVariant;
  fullWidth?: boolean;
};

const variantToClassName: Record<RomanticButtonVariant, string> = {
  primary: 'primary-btn',
  secondary: 'secondary-btn',
  domain: 'domain-btn',
  danger: 'danger-btn',
};

const RomanticButton: React.FC<RomanticButtonProps> = ({ 
  variant = 'primary', 
  fullWidth = false,
  className, 
  ...props 
}) => {
  const base = variantToClassName[variant];
  const widthClass = fullWidth ? 'w-full' : '';
  const combined = [base, widthClass, className].filter(Boolean).join(' ');
  return <button {...props} className={combined} />;
};

export default RomanticButton;

