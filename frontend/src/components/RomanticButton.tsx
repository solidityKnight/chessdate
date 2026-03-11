import React from 'react';

type RomanticButtonVariant = 'primary' | 'secondary' | 'domain' | 'danger';

type RomanticButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: RomanticButtonVariant;
};

const variantToClassName: Record<RomanticButtonVariant, string> = {
  primary: 'primary-btn',
  secondary: 'secondary-btn',
  domain: 'domain-btn',
  danger: 'danger-btn',
};

const RomanticButton: React.FC<RomanticButtonProps> = ({ variant, className, ...props }) => {
  const base = variantToClassName[variant];
  const combined = className ? `${base} ${className}` : base;
  return <button {...props} className={combined} />;
};

export default RomanticButton;

