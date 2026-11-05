import { useEffect, useRef } from 'react';
import styles from './SettingsPanel.module.scss';

interface SettingsPanelProps {
  open: boolean;
  clientId: string;
  launchAtStartup: boolean;
  autoApplyOnLaunch: boolean;
  onToggleOpen: () => void;
  onClientIdChange: (value: string) => void;
  onClientIdBlur: (value: string) => void;
  onToggleStartup: (value: boolean) => void;
  onToggleAutoApply: (value: boolean) => void;
}

function IconGear() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function SettingsPanel({
  open,
  clientId,
  launchAtStartup,
  autoApplyOnLaunch,
  onToggleOpen,
  onClientIdChange,
  onClientIdBlur,
  onToggleStartup,
  onToggleAutoApply,
}: SettingsPanelProps) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) onToggleOpen();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onToggleOpen();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onToggleOpen]);

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button type="button" className={`${styles.gearBtn} ${open ? styles.gearActive : ''}`} aria-label="Parametres" aria-expanded={open} onClick={onToggleOpen} title="Parametres" >
        <IconGear />
      </button>
      {open ? (
        <div className={styles.panel} role="dialog" aria-label="Parametres">
          <h2 className={styles.title}>Parametres</h2>
          <label className={styles.field}>
            <span>Client ID</span>
            <input value={clientId} onChange={(e) => onClientIdChange(e.target.value)} onBlur={(e) => onClientIdBlur(e.target.value)} placeholder="Application ID Discord" autoComplete="off" />
          </label>
          <label className={styles.check}>
            <input type="checkbox" checked={launchAtStartup} onChange={(e) => onToggleStartup(e.target.checked)} />
            <span>Lancer au demarrage de Windows</span>
          </label>
          <label className={styles.check}>
            <input type="checkbox" checked={autoApplyOnLaunch} onChange={(e) => onToggleAutoApply(e.target.checked)} />
            <span>Reappliquer le dernier status au lancement</span>
          </label>
        </div>
      ) : null}
    </div>
  );
}