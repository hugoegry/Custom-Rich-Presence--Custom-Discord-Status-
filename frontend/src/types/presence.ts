export type ActivityType = 'PLAYING' | 'LISTENING' | 'WATCHING' | 'COMPETING';

export interface PresenceForm {
  client_id: string;
  activity_type: ActivityType;
  activity_name: string;
  details: string;
  state: string;
  large_image: string;
  large_text: string;
  small_image: string;
  small_text: string;
  timer: boolean;
  button1_label: string;
  button1_url: string;
  button2_label: string;
  button2_url: string;
}

export interface PresencePreset {
  name: string;
  activity_type: ActivityType;
  activity_name: string;
  details: string;
  state: string;
  large_image: string;
  large_text: string;
  small_image: string;
  small_text: string;
  timer: boolean;
  button1_label: string;
  button1_url: string;
  button2_label: string;
  button2_url: string;
}

export interface BootstrapResponse {
  client_id: string;
  presets: PresencePreset[];
  activity_types: ActivityType[];
  connected: boolean;
  launch_at_startup: boolean;
  auto_apply_on_launch: boolean;
}

export interface ApiOk {
  ok?: boolean;
  connected?: boolean;
  error?: string;
  presets?: PresencePreset[];
  launch_at_startup?: boolean;
  auto_apply_on_launch?: boolean;
}

export const TYPE_LABELS: Record<ActivityType, string> = {
  PLAYING: 'JOUE A',
  LISTENING: 'ECOUTE',
  WATCHING: 'REGARDE',
  COMPETING: 'PARTICIPE A',
};

export const EMPTY_FORM: PresenceForm = {
  client_id: '',
  activity_type: 'PLAYING',
  activity_name: '',
  details: '',
  state: '',
  large_image: '',
  large_text: '',
  small_image: '',
  small_text: '',
  timer: true,
  button1_label: '',
  button1_url: '',
  button2_label: '',
  button2_url: '',
};