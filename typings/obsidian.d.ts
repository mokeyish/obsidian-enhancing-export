
import  'obsidian';
import type { EventRef } from 'obsidian';


declare module 'obsidian' {

  export interface DataAdapter {
    getBasePath(): string;
    getFullPath(path: string): string;
    startWatchPath(path: string): void;
    stopWatchPath(path: string): void;
  }

  export interface PluginSettingTab {
    name: string;
  }

  export interface App {
    readonly loadProgress: { show(): void; hide(): void; setMessage(msg: string): void; };
    plugins: {
      enablePlugin(id: string): Promise<void>;
      disablePlugin(id: string): Promise<void>;
    }
  }
  
  export interface Vault {
    config: {
      attachmentFolderPath: string,
      useMarkdownLinks: boolean,
    }
    on(name: 'raw', callback: (file: string) => void, ctx?: any): EventRef;
  }
}