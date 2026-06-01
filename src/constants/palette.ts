export const CARD_COLORS = [
  '#E57373',
  '#F06292',
  '#BA68C8',
  '#7986CB',
  '#4FC3F7',
  '#4DB6AC',
  '#81C784',
  '#FFD54F',
  '#FF8A65',
  '#90A4AE',
  '#D32F2F',
  '#7B1FA2',
  '#00838F',
  '#558B2F',
  '#E65100',
  '#37474F',
] as const;

export const TASK_ICONS = [
  'star',
  'favorite',
  'flash-on',
  'local-fire-department',
  'book',
  'fitness-center',
  'water-drop',
  'bedtime',
  'wb-sunny',
  'person',
  'home',
  'edit',
  'directions-run',
  'restaurant',
  'music-note',
  'laptop',
  'coffee',
  'medication',
  'shopping-cart',
  'self-improvement',
  'spa',
] as const;

export type TaskIcon = (typeof TASK_ICONS)[number];

export function randomColor(): string {
  return CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)];
}

export function contrastText(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}
