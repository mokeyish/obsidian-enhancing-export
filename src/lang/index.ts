import zhCN from './zh-CN';
import enUS from './en-US';
import deDE from './de-DE';
import ruRU from './ru-RU';
import { moment } from 'obsidian';

export type Lang = typeof enUS;

export default {
  'de-DE': deDE,
  'en-US': enUS,
  'zh-CN': zhCN,
  'ru-RU': ruRU,
  get current() {
    const langIds = Object.keys(this);
    const locale = moment.locale().toLowerCase();
    let langId = langIds.find(id => id.toLowerCase() === locale.toLowerCase());
    if (langId) {
      return this[langId];
    }

    const localePrefix = locale.split('-')[0];
    langId = langIds.find(id => id.toLowerCase().startsWith(localePrefix));
    if (langId) {
      return this[langId];
    }
    return this['en-US'];
  },
};
