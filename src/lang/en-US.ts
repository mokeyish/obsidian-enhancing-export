import { strTpl } from '../utils';

export default {
  preparing: strTpl`generating "${0}" ......`,
  exportToOo: 'Export to ......',
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

  save: 'Save',

  exportDialog: {
    exportTo: 'Export to',
    fileName: 'File Name',
    title: strTpl`Export to ${0}`,
    export: 'Export',
    overwriteConfirmation: 'Overwrite confirmation',
  },

  template: 'Template',

  type: 'Type',

  defaultFolderForExportedFile: 'Default Folder for Exported File',
  sameFolderWithCurrentFile: 'Same folder with current file',
  customLocation: 'Custom location',
  command: 'Command',

  arguments: 'Arguments',
  extraArguments: 'Extra arguments',
  settingTab: {
    title: 'Export Settings',
    version: strTpl`Version: ${0}`,
    pandocNotFound: 'Pandoc not found, please fill in the Pandoc file path, or add it to the system environment variables.',
    pandocPath: 'Pandoc path',
    pandocPathPlaceholder: '(Auto Detect)',
    editCommandTemplate: 'Edit Command Template',
    chooseCommandTemplate: 'Choose template',
    reset: 'Reset',
    auto: 'Auto',
    add: 'Add',
    remove: 'Remove',
    rename: 'Rename',
    targetFileExtensions: 'Target file extensions',
    targetFileExtensionsTip: '(Separated by whitespace)',
  },
  afterExport: 'After Export',

  runCommand: 'Run command',
  showCommandOutput: 'Show command output',
  openExportedFileLocation: 'Open exported file location',
  openExportedFile: 'Open exported file',
  exportWithPrevious: 'Export with Previous',
  pleaseOpenFile: 'Please open a file first.',
};
