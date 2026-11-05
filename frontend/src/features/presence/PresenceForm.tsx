import type { ReactNode } from 'react';
import type { ActivityType, PresenceForm as PresenceFormData } from '../../types/presence';
import { FancySelect } from './FancySelect';
import { SaveAction } from './HeaderActions';
import styles from './PresenceForm.module.scss';

interface PresenceFormProps {
  form: PresenceFormData;
  activityTypes: ActivityType[];
  presetName: string;
  mode: 'create' | 'edit';
  showSave: boolean;
  busy: boolean;
  toast: { message: string; error: boolean } | null;
  onChange: (patch: Partial<PresenceFormData>) => void;
  onPresetNameChange: (name: string) => void;
  onSave: () => void;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function IdleEditor() {
  return (
    <section className={styles.panel}>
      <div className={styles.idle}>
        <h2>Aucun preset ouvert</h2>
        <p>Selectionne un preset a gauche pour le modifier, ou clique + Nouveau pour en creer un.</p>
      </div>
    </section>
  );
}

export function PresenceFormPanel({
  form,
  activityTypes,
  presetName,
  mode,
  showSave,
  busy,
  toast,
  onChange,
  onPresetNameChange,
  onSave,
}: PresenceFormProps) {
  const activityOptions = activityTypes.map((t) => ({ value: t, label: t }));

  return (
    <section className={styles.panel}>
      <header className={styles.panelHeader}>
        <div className={styles.headerLeft}>
          <h2 className={styles.panelTitle}>{mode === 'edit' ? 'Update preset' : 'Create preset'}</h2>
        </div>
        {showSave ? <SaveAction busy={busy} onSave={onSave} /> : null}
      </header>

      <div className={styles.panelBody}>
        <div className={styles.block}>
          <Field label="Nom du preset">
            <input value={presetName} onChange={(e) => onPresetNameChange(e.target.value)} placeholder="ex: Coding, Gaming..." autoComplete="off" />
          </Field>
        </div>

        <div className={styles.block}>
          <h2 className={styles.title}>Activite</h2>
          <div className={styles.field}>
            <span>Type</span>
            <FancySelect
              ariaLabel="Type d activite"
              value={form.activity_type}
              options={activityOptions}
              onChange={(v) => onChange({ activity_type: v as ActivityType })}
            />
          </div>
          <Field label="Nom affiche (Playing ...)">
            <input
              value={form.activity_name}
              maxLength={128}
              onChange={(e) => onChange({ activity_name: e.target.value })}
              placeholder="ex: VS Code, Mon Jeu..."
            />
          </Field>
          <Field label="Details">
            <input
              value={form.details}
              maxLength={128}
              onChange={(e) => onChange({ details: e.target.value })}
              placeholder="Ce que tu fais"
            />
          </Field>
          <Field label="State">
            <input
              value={form.state}
              maxLength={128}
              onChange={(e) => onChange({ state: e.target.value })}
              placeholder="Detail secondaire"
            />
          </Field>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={form.timer}
              onChange={(e) => onChange({ timer: e.target.checked })}
            />
            <span>Afficher le timer (depuis ...)</span>
          </label>
        </div>

        <div className={styles.block}>
          <h2 className={styles.title}>Images</h2>
          <div className={styles.grid2}>
            <Field label="Large image URL (max 300 car)">
              <input value={form.large_image} maxLength={300} onChange={(e) => onChange({ large_image: e.target.value })} placeholder="cle portal ou URL courte https://..." />
            </Field>
            <Field label="Texte au survol (grande image)">
              <input value={form.large_text} maxLength={128} onChange={(e) => onChange({ large_text: e.target.value })} placeholder="Affiche au hover Discord" />
            </Field>
            <Field label="Small image URL (max 300 car)">
              <input value={form.small_image} maxLength={300} onChange={(e) => onChange({ small_image: e.target.value })} placeholder="cle portal ou URL courte https://..." />
            </Field>
            <Field label="Texte au survol (petite image)">
              <input value={form.small_text} maxLength={128} onChange={(e) => onChange({ small_text: e.target.value })} placeholder="Affiche au hover Discord" />
            </Field>
          </div>
        </div>

        <div className={styles.block}>
          <h2 className={styles.title}>Boutons</h2>
          <div className={styles.grid2}>
            <Field label="Bouton 1 label">
              <input value={form.button1_label} maxLength={32} onChange={(e) => onChange({ button1_label: e.target.value })} />
            </Field>
            <Field label="Bouton 1 URL">
              <input value={form.button1_url} type="url" onChange={(e) => onChange({ button1_url: e.target.value })} placeholder="https://" />
            </Field>
            <Field label="Bouton 2 label">
              <input value={form.button2_label} maxLength={32} onChange={(e) => onChange({ button2_label: e.target.value })} />
            </Field>
            <Field label="Bouton 2 URL">
              <input value={form.button2_url} type="url" onChange={(e) => onChange({ button2_url: e.target.value })} placeholder="https://" />
            </Field>
          </div>
        </div>
      </div>

      {toast ? (<p className={`${styles.toast} ${toast.error ? styles.toastError : ''}`}>{toast.message}</p>) : null}
    </section>
  );
}