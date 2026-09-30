/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { toJpeg, toPng } from 'html-to-image';

export interface ImageExportOptions {
  element: HTMLElement;
  filename: string;
  format?: 'jpeg' | 'png';
  quality?: number; // 0.0 to 1.0 (default 0.95 for JPEG)
  pixelRatio?: number; // default 2 for crisp text and graphics
  backgroundColor?: string;
}

/**
 * Downloads a blob as a file in the browser
 */
export const triggerDownload = (dataUrl: string, filename: string): void => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exports an HTML element as high-resolution JPEG/PNG and triggers download
 */
export const exportElementAsImage = async ({
  element,
  filename,
  format = 'jpeg',
  quality = 0.95,
  pixelRatio = 2.0,
  backgroundColor = '#ffffff',
}: ImageExportOptions): Promise<string> => {
  if (!element) {
    throw new Error('Element to export was not found in the DOM.');
  }

  const exportFn = format === 'png' ? toPng : toJpeg;

  const dataUrl = await exportFn(element, {
    quality: format === 'jpeg' ? quality : undefined,
    pixelRatio,
    backgroundColor,
    cacheBust: true,
    style: {
      transform: 'none',
      margin: '0',
    },
  });

  const fullFilename = filename.endsWith(`.${format}`) ? filename : `${filename}.${format === 'jpeg' ? 'jpg' : 'png'}`;
  triggerDownload(dataUrl, fullFilename);
  return dataUrl;
};
