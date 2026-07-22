import { useState } from 'react';
import { BsSearch, BsX } from 'react-icons/bs';
import './SearchBox.css';

/**
 * SearchBox — Ô tìm kiếm.
 *
 * @param {string} [props.placeholder='Tìm kiếm...']
 * @param {Function} props.onSearch - Callback khi search thay đổi
 * @param {string} [props.value] - Controlled value
 */
export default function SearchBox({ placeholder = 'Tìm kiếm...', onSearch, value: controlledValue }) {
  const [internalValue, setInternalValue] = useState('');
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChange = (e) => {
    const val = e.target.value;
    if (controlledValue === undefined) setInternalValue(val);
    onSearch?.(val);
  };

  const handleClear = () => {
    if (controlledValue === undefined) setInternalValue('');
    onSearch?.('');
  };

  return (
    <div className={`search-box${value ? ' has-value' : ''}`}>
      <BsSearch className="search-box-icon" />
      <input
        type="text"
        className="form-control"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
      />
      {value && (
        <button className="search-box-clear" onClick={handleClear} aria-label="Xoá tìm kiếm">
          <BsX />
        </button>
      )}
    </div>
  );
}
