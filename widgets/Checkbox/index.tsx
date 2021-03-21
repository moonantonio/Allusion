import './checkbox.scss';
import React from 'react';

interface IToggle {
  label: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Toggle = (props: IToggle) => {
  const { label, defaultChecked, checked, onChange } = props;
  return (
    <label>
      <input
        data-toggle
        type="checkbox"
        defaultChecked={defaultChecked}
        checked={checked}
        onChange={onChange}
      />
      {label}
    </label>
  );
};

export { Toggle };
