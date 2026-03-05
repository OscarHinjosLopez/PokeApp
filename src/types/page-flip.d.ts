declare module 'page-flip' {
  export interface FlipSetting {
    width: number;
    height: number;
    size?: 'fixed' | 'stretch';
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    maxShadowOpacity?: number;
    showCover?: boolean;
    drawShadow?: boolean;
    flippingTime?: number;
    usePortrait?: boolean;
    startPage?: number;
    autoSize?: boolean;
    clickEventForward?: boolean;
    swipeDistance?: number;
  }

  export class PageFlip {
    constructor(element: HTMLElement, settings: FlipSetting);
    loadFromHTML(items: HTMLElement[]): void;
    destroy(): void;
  }
}
