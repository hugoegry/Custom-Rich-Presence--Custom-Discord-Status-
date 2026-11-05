import styles from './ConfirmModal.module.scss';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Supprimer',
  cancelLabel = 'Annuler',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div className={styles.backdrop} role="presentation" onClick={onCancel}>
      <div className={styles.card} role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(e) => e.stopPropagation()} >
        <h3 id="confirm-title" className={styles.title}>{title}</h3>
        <p className={styles.text}>{message}</p>
        <div className={styles.actions}>
          <button type="button" className={`${styles.btn} ${styles.ghost}`} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className={`${styles.btn} ${styles.danger}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}