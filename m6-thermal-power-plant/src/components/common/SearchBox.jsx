import { useState } from 'react';
import { BsSearch, BsX } from 'react-icons/bs';

/**
 * SearchBox — Ô tìm kiếm với debounce.
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
    <div className="search-box" style={{
      position: 'relative',
      maxWidth: '320px',
    }}>
      <BsSearch style={{
        position: 'absolute',
        left: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: 'var(--text-tertiary)',
        fontSize: 'var(--text-sm)',
        pointerEvents: 'none',
      }} />
      <input
        type="text"
        className="form-control"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        style={{
          paddingLeft: '36px',
          paddingRight: value ? '36px' : '12px',
        }}
      />
      {value && (
        <button
          onClick={handleClear}
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: 'var(--text-tertiary)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            fontSize: '1rem',
          }}
          aria-label="Xoá tìm kiếm"
        >
          <BsX />
        </button>
      )}
    </div>
  );
}
