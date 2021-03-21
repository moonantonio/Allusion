import './button.scss';
import React from 'react';

interface IButton {
  text: React.ReactText;
  icon?: JSX.Element;
  onClick: (event: React.MouseEvent) => void;
  className?: string;
  disabled?: boolean;
}

const Button = ({ text, icon, onClick, className, disabled }: IButton) => {
  return (
    <button className={`btn ${className}`} onClick={onClick} disabled={disabled}>
      {icon && (
        <span className="btn-content-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="btn-content-text">{text}</span>
    </button>
  );
};

interface IButtonGroup {
  id?: string;
  children: (React.ReactElement | undefined)[] | React.ReactElement;
}

const ButtonGroup = ({ id, children }: IButtonGroup) => {
  return (
    <div id={id} className="btn-group">
      {children}
    </div>
  );
};

interface IIconButton {
  text: string;
  icon: JSX.Element;
  onClick: (event: React.MouseEvent) => void;
  disabled?: boolean;
}

const IconButton = ({ text, icon, onClick, disabled }: IIconButton) => {
  return (
    <button className="btn-icon" onClick={onClick} disabled={disabled}>
      <span className="btn-content-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="btn-content-text hidden">{text}</span>
    </button>
  );
};

export { Button, ButtonGroup, IconButton };
