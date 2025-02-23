import { loadFontsAsync, once, showUI } from '@create-figma-plugin/utilities';

import { InsertCodeHandler } from './types';
const VIEWPORT_WIDTH = 400;
export default function () {
  const maxHeight = Math.floor(figma.viewport.bounds.height); // 정수 변환
  showUI({ width: VIEWPORT_WIDTH, height: maxHeight });

  figma.on('selectionchange', () => {
    const selectedNode = figma.currentPage.selection[0]; // 현재 선택된 요소
    if (selectedNode) {
      const layerName = selectedNode.name; // 선택한 요소의 이름
      figma.ui.postMessage({ type: 'SELECT_LAYER', layerName });
    }
  });
}
