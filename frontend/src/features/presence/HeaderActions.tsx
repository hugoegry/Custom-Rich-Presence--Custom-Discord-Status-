import type { ReactNode } from 'react';
import styles from './HeaderActions.module.scss';

interface IconBtnProps {
  label: string;
  busy?: boolean;
  variant?: 'ghost' | 'blurple' | 'green' | 'red';
  onClick: () => void;
  children: ReactNode;
}

function IconBtn({ label, busy, variant = 'ghost', onClick, children }: IconBtnProps) {
  return (
    <button type="button" className={`${styles.btn} ${styles[variant]}`} disabled={busy} onClick={onClick} title={label} aria-label={label}>
      <span className={styles.grow}>
        <span className={styles.icon}>{children}</span>
        <span className={styles.label}>{label}</span>
      </span>
    </button>
  );
}

function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconSave() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 4h11l3 3v13H5V4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8 4v5h8V4M8 20v-7h8v7" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function IconPlug() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 7v4M15 7v4M8 11h8v2a4 4 0 0 1-4 4h0a4 4 0 0 1-4-4v-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 17v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M20 12a8 8 0 1 1-2.3-5.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M20 5v5h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconPower() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3v9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7.5 6.5a7.5 7.5 0 1 0 9 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

interface SidebarActionsProps {
  connected: boolean;
  busy: boolean;
  onNew: () => void;
  onConnect: () => void;
  onUpdate: () => void;
  onDisconnect: () => void;
}

export function SidebarActions({
  connected,
  busy,
  onNew,
  onConnect,
  onUpdate,
  onDisconnect,
}: SidebarActionsProps) {
  return (
    <div className={styles.actions}>
      <IconBtn label="Nouveau" busy={busy} onClick={onNew}>
        <IconPlus />
      </IconBtn>
      {!connected ? (
        <IconBtn label="Connect" busy={busy} variant="blurple" onClick={onConnect}>
          <IconPlug />
        </IconBtn>
      ) : (
        <>
          <IconBtn label="Update" busy={busy} variant="green" onClick={onUpdate}>
            <IconRefresh />
          </IconBtn>
          <IconBtn label="Disconnect" busy={busy} variant="red" onClick={onDisconnect}>
            <IconPower />
          </IconBtn>
        </>
      )}
    </div>
  );
}

interface SaveActionProps {
  busy: boolean;
  onSave: () => void;
}

export function SaveAction({ busy, onSave }: SaveActionProps) {
  return (
    <div className={styles.actions}>
      <IconBtn label="Enregistrer" busy={busy} onClick={onSave}>
        <IconSave />
      </IconBtn>
    </div>
  );
}