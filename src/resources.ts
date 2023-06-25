const embed = (dir: string, res: Record<string, { default: Uint8Array }>) =>
  [dir, Object.entries(res).map(([k, m]) => [k.substring(dir.length + 1), m.default] as const)] as const;

// The embedded resource
export default [
  // For other file types, the Loader must be configured in the <root>/vite.config.ts.
  embed('lua', import.meta.glob<{ default: Uint8Array }>('lua/*.lua', { eager: true })),
  embed('tex', import.meta.glob<{ default: Uint8Array }>('textemplate/*.tex', { eager: true })),
  embed('sty', import.meta.glob<{ default: Uint8Array }>('textemplate/*.sty', { eager: true })),
];
