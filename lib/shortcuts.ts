/**
 * Odoo-Style Global Keyboard Shortcuts Hook & Registry
 */
export interface ShortcutBinding {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

export const defaultShortcuts: ShortcutBinding[] = [
  { key: 'k', ctrlKey: true, action: () => {}, description: 'Командалық іздеу (Command Palette)' },
  { key: 'n', altKey: true, action: () => {}, description: 'Жаңа жазба қосу (New Record)' },
  { key: 's', altKey: true, action: () => {}, description: 'Сақтау (Save Form)' },
];
