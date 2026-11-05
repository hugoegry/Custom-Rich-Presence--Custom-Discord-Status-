import type { PresenceForm } from '../../types/presence';
import { TYPE_LABELS } from '../../types/presence';
import styles from './ProfilePreview.module.scss';

interface ProfileCardProps {
  form: PresenceForm;
}

function ProfileCard({ form }: ProfileCardProps) {
  const buttons = [
    { label: form.button1_label, url: form.button1_url },
    { label: form.button2_label, url: form.button2_url },
  ].filter((b) => b.label && b.url);

  const artKey = form.large_image || '?';

  return (
    <div className={styles.card}>
      <div className={styles.banner} />
      <div className={styles.avatarWrap}>
        <div className={styles.avatar} />
        <span className={styles.onlineBadge} />
      </div>
      <div className={styles.body}>
        <div className={styles.username}>Toi</div>
        <div className={styles.handle}>@toi</div>
        <div className={styles.activity}>
          <div className={styles.label}>{TYPE_LABELS[form.activity_type]}</div>
          <div className={styles.row}>
            <div className={styles.art}>
              <div className={styles.artLarge} title={form.large_text || artKey}>
                {artKey.slice(0, 10)}
              </div>
              {form.small_image ? (
                <div className={styles.artSmall} title={form.small_text || form.small_image} />
              ) : null}
            </div>
            <div className={styles.text}>
              <div className={styles.gameName}>{form.activity_name.trim() || 'Ton Application'}</div>
              <div className={styles.line}>{form.details || '—'}</div>
              <div className={`${styles.line} ${styles.muted}`}>{form.state || '—'}</div>
              {form.timer ? <div className={`${styles.line} ${styles.muted}`}>depuis 00:12</div> : null}
            </div>
          </div>
          {buttons.length > 0 ? (
            <div className={styles.buttons}>
              {buttons.map((b) => (
                <div key={b.label} className={styles.fakeBtn}>{b.label}</div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface PreviewBlockProps {
  title: string;
  form: PresenceForm;
  open: boolean;
  tone?: 'live' | 'draft';
}

function PreviewBlock({ title, form, open, tone = 'draft' }: PreviewBlockProps) {
  return (
    <div className={`${styles.anim} ${open ? styles.animOpen : ''} ${tone === 'live' ? styles.toneLive : styles.toneDraft}`}>
      <div className={styles.animInner}>
        <h2 className={styles.title}>{title}</h2>
        <ProfileCard form={form} />
      </div>
    </div>
  );
}

export function presenceFingerprint(form: PresenceForm): string {
  return JSON.stringify({
    activity_type: form.activity_type,
    activity_name: form.activity_name,
    details: form.details,
    state: form.state,
    large_image: form.large_image,
    large_text: form.large_text,
    small_image: form.small_image,
    small_text: form.small_text,
    timer: form.timer,
    button1_label: form.button1_label,
    button1_url: form.button1_url,
    button2_label: form.button2_label,
    button2_url: form.button2_url,
  });
}

interface PreviewColumnProps {
  connected: boolean;
  liveForm: PresenceForm | null;
  draftForm: PresenceForm;
  showDraft: boolean;
}

export function PreviewColumn({
  connected,
  liveForm,
  draftForm,
  showDraft,
}: PreviewColumnProps) {
  const showLive = connected && liveForm !== null;
  const empty = !showLive && !showDraft;

  return (
    <aside className={styles.panel}>
      <div className={styles.stack}>
        <PreviewBlock title="Profil actuel" form={liveForm ?? draftForm} open={showLive} tone="live" />
        <PreviewBlock title="Apercu modification" form={draftForm} open={showDraft} tone="draft" />
      </div>
      {empty ? (<p className={styles.emptyHint}>Connectez-vous ou ouvrez un preset pour voir les aperçus.</p>) : null}
    </aside>
  );
}