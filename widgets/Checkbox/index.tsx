import './checkbox.scss';
import React from 'react';

interface ICheckbox {
  label: React.ReactText;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClick?: (Event: React.MouseEvent<HTMLInputElement>) => void;
}

const Toggle = (props: ICheckbox) => {
  const { label, defaultChecked, checked, onChange, onClick } = props;
  return (
    <label>
      <input
        data-toggle
        type="checkbox"
        defaultChecked={defaultChecked}
        checked={checked}
        onChange={onChange}
        onClick={onClick}
      />
      {label}
    </label>
  );
};

const Checkbox = (props: ICheckbox) => {
  const { label, defaultChecked, checked, onChange } = props;
  return (
    <label>
      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        checked={checked}
        onChange={onChange}
      />
      {label}
    </label>
  );
};

export { Toggle, Checkbox };
