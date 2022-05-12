import { strTpl } from '../utils';

export default {
  preparing: strTpl`generating "${0}" ......`,
  exportToOo: 'Export to ......',
  settingTabTitle: 'Export Setting',
  pandocPath: 'Pandoc path',
  pandocPathPlaceholder: '(Auto Detect)',
  selectExportFolder: 'Please select an export folder.',
  exportSuccessNotice: strTpl`Export file ${0} success！`,
  exportCommandOutputMessage: strTpl`Command: ${0}`,
  exportErrorOutputMessage: strTpl`Command: ${0}，Error：${1}`,
  overwriteConfirmationDialog: {
    replace: 'Replace',
    title: strTpl`"${0}" already exists. Do you want to replace it?`,
    message: strTpl`A file or folder with the same name already exists in the folder "${0}". Replacing it will overwrite its current contents.`,
  },
  messageBox: {
    yes: 'Yes',
    no: 'No',
    ok: 'Ok',
    cancel: 'Cancel',
  },

  general: 'General',
  name: 'Name',
  new: 'New',

  add: 'Add',
  remove: 'Remove',
  rename: 'Rename',
  chooseSetting: 'Choose setting',

  save: 'Save',

  exportDialog: {
    title: strTpl`Export to ${0}`,
    export: 'Export',
  },

  exportTo: 'Export to',

  template: 'Template',

  fileName: 'File Name',
  type: 'Type',

  overwriteConfirmation: 'Overwrite confirmation',

  defaultFolderForExportedFile: 'Default Folder for Exported File',
  auto: 'Auto',
  sameFolderWithCurrentFile: 'Same folder with current file',
  customLocation: 'Custom location',
  reset: 'Reset',
  command: 'Command',

  arguments: 'Arguments',
  extraArguments: 'Extra arguments',
  settingTab: {
    targetFileExtensions: 'Target file extensions',
    targetFileExtensionsTip: '(Separated by whitespace)',
  },
  afterExport: 'After Export',

  runCommand: 'Run command',
  showCommandOutput: 'Show command output',
  openExportedFileLocation: 'Open exported file location',
  openExportedFile: 'Open exported file',
};
