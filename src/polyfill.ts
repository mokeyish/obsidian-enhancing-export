
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare interface Element {
  setVisible(visible: boolean): this;
  setTooltip(tooltip: string): this;
}

Element.prototype.setVisible = function(visible: boolean) {
  if (visible) {
    this.removeAttribute('hidden');
  } else {
    this.setAttribute('hidden', '');
  }
  return this;
};


Element.prototype.setTooltip = function(tooltip?: string) {
  if (tooltip && tooltip.trim() != '') {
    this.setAttribute('title', tooltip);
  } else {
    this.removeAttribute('title');
  }
  return this;
};