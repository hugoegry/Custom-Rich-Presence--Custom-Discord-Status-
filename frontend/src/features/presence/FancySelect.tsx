import { useEffect, useId, useRef, useState } from 'react';
import styles from './FancySelect.module.scss';

export interface FancySelectOption {
  value: string;
  label: string;
}

interface FancySelectProps {
  value: string;
  options: FancySelectOption[];
  onChange: (value: string) => void;
  ariaLabel?: string;
}

export function FancySelect({ value, options, onChange, ariaLabel }: FancySelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={styles.wrap} ref={rootRef}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.open : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{selected?.label ?? value}</span>
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} />
      </button>
      {open ? (
        <ul className={styles.menu} id={listId} role="listbox">
          {options.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              data-active={opt.value === value ? 'true' : 'false'}
              className={styles.option}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}