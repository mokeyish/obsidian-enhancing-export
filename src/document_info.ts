import { DocumentInfo } from './settings';

/** Quote a value for the shell, escaping everything that could break out. */
export function shellQuote(value: string): string {
  return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('`', '\\`').replaceAll('$', '\\$')}"`;
}

export const splitValues = (value?: string): string[] =>
  (value ?? '')
    .split(/[,;，；]/)
    .map(v => v.trim())
    .filter(Boolean);

/** Build --metadata arguments from the values filled in the export dialog. */
export function buildMetadataArguments(info?: DocumentInfo): string {
  if (!info) {
    return '';
  }
  const args: string[] = [];
  const push = (key: string, value?: string) => {
    const trimmed = value?.trim();
    if (trimmed) {
      args.push(`--metadata ${key}=${shellQuote(trimmed)}`);
    }
  };
  push('title', info.title);
  push('institute', info.institute);
  push('date', info.date);
  // Repeated --metadata makes a list, which is what templates iterate over.
  splitValues(info.author).forEach(author => push('author', author));
  splitValues(info.keywords).forEach(keyword => push('keywords', keyword));
  return args.join(' ');
}
