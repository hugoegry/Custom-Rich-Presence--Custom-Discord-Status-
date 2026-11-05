import type { PresencePreset } from '../../types/presence';
import { SidebarActions } from './HeaderActions';
import styles from './PresetSidebar.module.scss';

interface PresetSidebarProps {
  presets: PresencePreset[];
  selectedName: string;
  connected: boolean;
  busy: boolean;
  onSelect: (name: string) => void;
  onDeleteRequest: (name: string) => void;
  onNew: () => void;
  onConnect: () => void;
  onUpdate: () => void;
  onDisconnect: () => void;
}

export function PresetSidebar({
  presets,
  selectedName,
  connected,
  busy,
  onSelect,
  onDeleteRequest,
  onNew,
  onConnect,
  onUpdate,
  onDisconnect,
}: PresetSidebarProps) {
  return (
    <aside className={styles.panel}>
      <header className={styles.header}>
        <h2 className={styles.title}>Presets</h2>
        <SidebarActions connected={connected} busy={busy} onNew={onNew} onConnect={onConnect} onUpdate={onUpdate} onDisconnect={onDisconnect} />
      </header>
      {presets.length === 0 ? (
        <p className={styles.empty}>Aucun preset. Clique + pour en creer un.</p>
      ) : (
        <ul className={styles.list}>
          {presets.map((p) => {
            const active = p.name === selectedName;
            return (
              <li key={p.name} className={`${styles.item} ${active ? styles.itemActive : ''}`}>
                <button type="button" className={styles.itemBtn} onClick={() => onSelect(p.name)}>
                  <span>{p.name}</span>
                  <small>{p.activity_name || p.details || p.activity_type}</small>
                </button>
                <button type="button" className={styles.deleteBtn} title="Supprimer" aria-label={`Supprimer ${p.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteRequest(p.name);
                  }}
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}