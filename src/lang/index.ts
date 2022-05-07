import zhCN from './zh-CN';
import enUS from './en-US';
import { moment } from 'obsidian';

export type Lang = typeof enUS;

export default {
  'zh-CN': zhCN,
  'en-US': enUS,
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
