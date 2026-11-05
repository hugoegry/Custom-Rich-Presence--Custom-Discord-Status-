import { useEffect, useMemo, useState } from 'react';
import { deletePreset, disconnectRpc, fetchBootstrap, savePreset, saveSettings, updatePresence } from '../../api/client';
import { APP_DISPLAY_NAME } from '../../branding';
import type { ActivityType, PresenceForm, PresencePreset } from '../../types/presence';
import { EMPTY_FORM } from '../../types/presence';
import shell from './AppShell.module.scss';
import { ConfirmModal } from './ConfirmModal';
import { IdleEditor, PresenceFormPanel } from './PresenceForm';
import { PresetSidebar } from './PresetSidebar';
import { PreviewColumn, presenceFingerprint } from './ProfilePreview';
import { SettingsPanel } from './SettingsPanel';

type EditorMode = 'idle' | 'create' | 'edit';

function presetToForm(preset: PresencePreset, clientId: string): PresenceForm {
  return {
    client_id: clientId,
    activity_type: preset.activity_type,
    activity_name: preset.activity_name || '',
    details: preset.details || '',
    state: preset.state || '',
    large_image: preset.large_image || '',
    large_text: preset.large_text || '',
    small_image: preset.small_image || '',
    small_text: preset.small_text || '',
    timer: !!preset.timer,
    button1_label: preset.button1_label || '',
    button1_url: preset.button1_url || '',
    button2_label: preset.button2_label || '',
    button2_url: preset.button2_url || '',
  };
}

function formToPreset(name: string, form: PresenceForm): PresencePreset {
  return {
    name,
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
  };
}

function snapshotOf(presetName: string, form: PresenceForm): string {
  return JSON.stringify({
    presetName,
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
    client_id: form.client_id,
  });
}

export function PresencePage() {
  const [form, setForm] = useState<PresenceForm>(EMPTY_FORM);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>(['PLAYING']);
  const [presets, setPresets] = useState<PresencePreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [presetName, setPresetName] = useState('');
  const [mode, setMode] = useState<EditorMode>('idle');
  const [baseline, setBaseline] = useState('');
  const [connected, setConnected] = useState(false);
  const [statusText, setStatusText] = useState('Offline');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; error: boolean } | null>(null);
  const [launchAtStartup, setLaunchAtStartup] = useState(false);
  const [autoApplyOnLaunch, setAutoApplyOnLaunch] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [liveForm, setLiveForm] = useState<PresenceForm | null>(null);
  const [livePresetName, setLivePresetName] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const dirty = useMemo(() => {
    if (mode === 'idle') return false;
    return snapshotOf(presetName, form) !== baseline;
  }, [mode, presetName, form, baseline]);

  const showSave = mode === 'create' || (mode === 'edit' && dirty);
  const showDraftPreview = useMemo(() => {
    if (mode === 'idle') return false;
    if (!connected || !liveForm) return true;
    const contentDiff = presenceFingerprint(form) !== presenceFingerprint(liveForm);
    const presetDiff = mode === 'edit' && selectedPreset !== livePresetName;
    return contentDiff || presetDiff || mode === 'create';
  }, [mode, connected, liveForm, form, selectedPreset, livePresetName]);

  useEffect(() => {
    let alive = true;
    fetchBootstrap().then((data) => {
      if (!alive) return;
      setActivityTypes(data.activity_types.length ? data.activity_types : ['PLAYING']);
      setPresets(data.presets);
      setConnected(data.connected);
      setStatusText(data.connected ? 'Online' : 'Offline');
      setLaunchAtStartup(!!data.launch_at_startup);
      setAutoApplyOnLaunch(!!data.auto_apply_on_launch);
      setForm({ ...EMPTY_FORM, client_id: data.client_id });
      setMode('idle');
      setSelectedPreset('');
      setPresetName('');
    }).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : 'Erreur bootstrap';
      setToast({ message, error: true });
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(id);
  }, [toast]);

  const patchForm = (patch: Partial<PresenceForm>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur';
      setToast({ message, error: true });
    } finally {
      setBusy(false);
    }
  };

  const onSelectPreset = (name: string) => {
    const preset = presets.find((p) => p.name === name);
    if (!preset) return;
    const nextForm = presetToForm(preset, form.client_id);
    setSelectedPreset(name);
    setPresetName(name);
    setForm(nextForm);
    setMode('edit');
    setBaseline(snapshotOf(name, nextForm));
    setToast({ message: `Preset "${name}" charge`, error: false });
  };

  const onNew = () => {
    const nextForm = { ...EMPTY_FORM, client_id: form.client_id };
    setSelectedPreset('');
    setPresetName('');
    setForm(nextForm);
    setMode('create');
    setBaseline(snapshotOf('', nextForm));
    setToast({ message: 'Nouveau preset', error: false });
  };

  const onSave = () => run(async () => {
    const name = presetName.trim();
    if (!name) {
      setToast({ message: 'Donne un nom au preset', error: true });
      return;
    }
    const payload = formToPreset(name, form);
    const data = await savePreset({
      ...payload,
      old_name: mode === 'edit' && selectedPreset !== name ? selectedPreset : undefined,
    });
    const next = data.presets ?? [];
    setPresets(next);
    setSelectedPreset(name);
    setPresetName(name);
    setMode('edit');
    setBaseline(snapshotOf(name, form));
    setToast({ message: mode === 'edit' ? `Preset "${name}" maj` : `Preset "${name}" cree`, error: false });
  });

  const confirmDelete = () => run(async () => {
    const name = pendingDelete;
    setPendingDelete(null);
    if (!name) return;
    const data = await deletePreset(name);
    const next = data.presets ?? [];
    setPresets(next);
    if (selectedPreset === name) {
      setMode('idle');
      setSelectedPreset('');
      setPresetName('');
      setForm((prev) => ({ ...EMPTY_FORM, client_id: prev.client_id }));
      setBaseline('');
    }
    setToast({ message: `Preset "${name}" supprime`, error: false });
  });

  const markLiveFromForm = () => {
    setLiveForm({ ...form });
    setLivePresetName(mode === 'edit' ? selectedPreset : presetName.trim());
  };

  const onConnect = () => run(async () => {
    const data = await updatePresence(form);
    setConnected(!!data.connected);
    markLiveFromForm();
    setStatusText('Presence active');
    setToast({ message: 'Connecte + status envoye', error: false });
  });

  const onUpdate = () => run(async () => {
    const data = await updatePresence(form);
    setConnected(!!data.connected);
    markLiveFromForm();
    setStatusText('Presence active');
    setToast({ message: 'Status mis a jour', error: false });
  });

  const onDisconnect = () => run(async () => {
    await disconnectRpc();
    setConnected(false);
    setLiveForm(null);
    setLivePresetName('');
    setStatusText('Offline');
    setToast({ message: 'Status retire + deconnecte', error: false });
  });

  const onToggleStartup = (value: boolean) => run(async () => {
    const data = await saveSettings({ launch_at_startup: value });
    setLaunchAtStartup(!!data.launch_at_startup);
    setToast({
      message: value ? 'Demarrage Windows active' : 'Demarrage Windows desactive',
      error: false,
    });
  });

  const onToggleAutoApply = (value: boolean) => run(async () => {
    const data = await saveSettings({ auto_apply_on_launch: value });
    setAutoApplyOnLaunch(!!data.auto_apply_on_launch);
    setToast({
      message: value ? 'Auto-apply active' : 'Auto-apply desactive',
      error: false,
    });
  });

  const onClientIdChange = (value: string) => {
    setForm((prev) => ({ ...prev, client_id: value }));
  };

  const onClientIdBlur = (value: string) => run(async () => {
    const clientId = value.trim();
    setForm((prev) => ({ ...prev, client_id: clientId }));
    await saveSettings({ client_id: clientId });
  });

  return (
    <>
      <div className={shell.bgGlow} aria-hidden />
      <div className={shell.app}>
        <header className={shell.topbar}>
          <div className={shell.brand}>
            <img className={shell.brandMark} src="/app-logo.png" alt="" width={42} height={42} />
            <div>
              <h1>{APP_DISPLAY_NAME}</h1>
              <p>Rich Presence personnalisee</p>
            </div>
          </div>
          <div className={shell.topRight}>
            <div className={`${shell.statusPill} ${connected ? shell.online : ''}`}>
              <span className={shell.dot} />
              <span>{statusText}</span>
            </div>
            <SettingsPanel
              open={settingsOpen}
              clientId={form.client_id}
              launchAtStartup={launchAtStartup}
              autoApplyOnLaunch={autoApplyOnLaunch}
              onToggleOpen={() => setSettingsOpen((v) => !v)}
              onClientIdChange={onClientIdChange}
              onClientIdBlur={onClientIdBlur}
              onToggleStartup={onToggleStartup}
              onToggleAutoApply={onToggleAutoApply}
            />
          </div>
        </header>

        <main className={shell.layout}>
          <PresetSidebar
            presets={presets}
            selectedName={mode === 'edit' ? selectedPreset : ''}
            connected={connected}
            busy={busy}
            onSelect={onSelectPreset}
            onDeleteRequest={setPendingDelete}
            onNew={onNew}
            onConnect={onConnect}
            onUpdate={onUpdate}
            onDisconnect={onDisconnect}
          />

          {mode === 'idle' ? (
            <IdleEditor />
          ) : (
            <PresenceFormPanel
              form={form}
              activityTypes={activityTypes}
              presetName={presetName}
              mode={mode}
              showSave={showSave}
              busy={busy}
              toast={null}
              onChange={patchForm}
              onPresetNameChange={setPresetName}
              onSave={onSave}
            />
          )}

          <PreviewColumn connected={connected} liveForm={liveForm} draftForm={form} showDraft={showDraftPreview} />
        </main>

        {toast ? (<p className={`${shell.toast} ${toast.error ? shell.toastError : ''}`}>{toast.message}</p>) : null}
      </div>

      {pendingDelete ? (
        <ConfirmModal
          title="Supprimer le preset ?"
          message={`Es-tu sur de vouloir supprimer "${pendingDelete}" ? Cette action est definitive.`}
          confirmLabel="Supprimer"
          cancelLabel="Annuler"
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      ) : null}
    </>
  );
}