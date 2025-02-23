import { showUI } from '@create-figma-plugin/utilities';

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

  figma.ui.onmessage = (message) => {
    console.log('📩 받은 메시지:', message); // 디버깅용 로그 추가

    if (message.type === 'RESIZE_WINDOW') {
      console.log(
        `🔧 창 크기 조절 요청: width=${message.width}, height=${message.height}`,
      );
      figma.ui.resize(message.width, message.height);
    }
  };
}
