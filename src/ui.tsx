import '!react-notion-x/src/styles.css';
import '!prismjs/themes/prism.css'; // 코드 블록 스타일
import '!katex/dist/katex.min.css'; // 수식 스타일
import ReactDOM from 'react-dom/client'; // React 18용
import React, { useState, useEffect } from 'react';
import { NotionRenderer } from 'react-notion-x';
import '!./styles.css';
import useWindowResize from './useWindowResize';

const PROXY_URL = 'https://spec-sync-api.vercel.app/api/notion'; // ✅ Vercel 프록시 사용

function extractNotionPageId(url: string): string | null {
  const match = url.match(/([a-f0-9]{32})/);
  return match ? match[1] : null;
}

async function fetchNotionData(notionPageId: string) {
  try {
    console.log(`🔍 Fetching Notion page from Proxy: ${notionPageId}`);

    const response = await fetch(`${PROXY_URL}?pageId=${notionPageId}`);
    if (!response.ok) {
      throw new Error(
        `Notion 프록시 API 요청 실패: ${response.status} ${response.statusText}`,
      );
    }
    const data = await response.json();
    console.log('✅ Notion 데이터 불러오기 성공:', data);
    return data;
  } catch (error) {
    console.error('❌ Notion 데이터 불러오기 실패:', error);
    return null;
  }
}

function Plugin() {
  const [notionPageId, setNotionPageId] = useState<string | null>(null);
  const [notionRecordMap, setNotionRecordMap] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [size, setSize] = useState({ width: 400, height: 1000 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [startWidth, setStartWidth] = useState(400);
  const [startHeight, setStartHeight] = useState(1000);
  const [blockId, setBlockId] = useState('');

  useEffect(() => {
    function handleMouseMove(event: MouseEvent) {
      if (!isResizing || !resizeDirection) return;

      let newWidth = startWidth;
      let newHeight = startHeight;

      if (resizeDirection.includes('right')) {
        newWidth = Math.max(
          400,
          Math.min(startWidth + (event.clientX - startX), 1000),
        );
      }
      if (resizeDirection.includes('left')) {
        const deltaX = startX - event.clientX;
        newWidth = Math.max(400, Math.min(startWidth + deltaX, 1000));
      }
      if (resizeDirection.includes('bottom')) {
        newHeight = Math.max(
          400,
          Math.min(startHeight + (event.clientY - startY), 1000),
        );
      }
      if (resizeDirection.includes('top')) {
        newHeight = Math.max(
          400,
          Math.min(startHeight - (event.clientY - startY), 1000),
        );
      }

      setSize({ width: newWidth, height: newHeight });

      // Figma에게 크기 조절 요청 (아이프레임 위치 변경 없이 크기만 조정)
      parent.postMessage(
        {
          pluginMessage: {
            type: 'RESIZE_WINDOW',
            width: newWidth,
            height: newHeight,
          },
        },
        '*',
      );
    }

    function handleMouseUp() {
      setIsResizing(false);
      setResizeDirection(null);
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeDirection, startX, startY, startWidth, startHeight]);
  useEffect(() => {
    window.onmessage = async (event) => {
      const message = event.data.pluginMessage;
      if (message.type === 'SELECT_LAYER') {
        const layerName = message.layerName;
        console.log(`Selected layer: ${layerName}`);
        // Notion 페이지 URL에서 ID 추출
        const pageId = extractNotionPageId(layerName);
        if (!pageId) {
          console.log('유효한 Notion 페이지 ID를 찾을 수 없습니다.');
          return;
        }

        if (pageId) {
          setNotionPageId(pageId);
        }
        // else {
        //   console.error('유효한 Notion 페이지 ID를 찾을 수 없습니다.');
        // }
      }
    };
  }, []);
  // (1) 시스템 다크 모드 감지
  useEffect(() => {
    if (window.matchMedia) {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');

      // 초기 값 설정
      setIsDarkMode(mql.matches);

      // 변경 이벤트 등록
      const handleChange = (e: MediaQueryListEvent) => {
        setIsDarkMode(e.matches);
      };
      mql.addEventListener('change', handleChange);

      return () => {
        mql.removeEventListener('change', handleChange);
      };
    }
  }, []);
  useEffect(() => {
    if (notionPageId) {
      fetchNotionData(notionPageId)
        .then((res) => {
          console.log(res);
          setNotionRecordMap(res);
        })
        .catch((error) => console.error('🚨 Notion API 최종 실패:', error));
    }
  }, [notionPageId]);

  // useEffect(() => {
  //   if (notionRecordMap) {
  //     // 전체 창 기준으로 스크롤 위치를 맨 위로
  //     window.scrollTo(0, 0);
  //   }
  // }, [notionRecordMap]);

  useEffect(() => {
    window.onmessage = async (event) => {
      const message = event.data.pluginMessage;
      if (message.type === 'SELECT_LAYER') {
        const layerName = message.layerName;
        console.log(`📌 선택된 Layer: ${layerName}`);

        // Notion 페이지 URL에서 페이지 ID 추출
        const pageId = extractNotionPageId(layerName);
        if (!pageId) {
          console.log('❌ 유효한 Notion 페이지 ID를 찾을 수 없습니다.');
          return;
        }

        setNotionPageId(pageId);

        // 🔍 Notion 페이지 URL에서 블록 ID가 포함되어 있는지 확인
        const match = layerName.match(/#([a-f0-9]{32})/);
        const blockId = match ? match[1] : null;

        // 스크롤 이동을 위한 블록 ID 저장
        if (blockId) {
          setBlockId(blockId);
          console.log(`🔍 특정 블록 ID 감지됨: ${blockId}`);
          // setTimeout(() => {
          if (notionRecordMap) {
            const targetBlock = document.getElementById(blockId);
            if (targetBlock) {
              console.log(`✅ 블록 찾음, 스크롤 이동: ${blockId}`);
              targetBlock.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              });
            } else {
              console.warn(`⚠️ 해당 블록을 찾을 수 없음: ${blockId}`);
              console.log('⬆️ 블록이 없으므로 최상단으로 이동');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }
          // }, 0); // NotionRenderer가 완전히 렌더링될 시간을 고려하여 1초 딜레이
        } else {
          console.log('⬆️ 블록 ID가 없으므로 최상단으로 이동');
          // setTimeout(() => {
          if (notionRecordMap) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
          // }, 0);
        }
      }
    };
  }, [notionRecordMap]);

  useEffect(() => {
    console.log(`✅ 블록 찾음, 스크롤 이동: ${blockId}`);
    const targetBlock = document.getElementById(blockId);
    if (!targetBlock) return;
    targetBlock.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [blockId, notionRecordMap]);

  if (!notionRecordMap) {
    return (
      <p
        style={{
          color: isDarkMode ? 'white' : 'black',
          whiteSpace: 'pre-line',
        }}
      >
        {`
         Figma 요소를 선택하면 해당하는 Notion 페이지가 표시됩니다.

         [작업자 전제조건]
         - notion에서 규격서 작성 - 우측 상단 공유 버튼 - 게시 탭 - 게시 버튼 - 링크복사

         - 원하는 피그마 디자인 접속 - 좌측 Layers 에 복사해둔 notion 링크를 할당
   `}
      </p>
    );
  }
  return (
    <div
      id='plugin-container'
      style={{
        // width: size.width,
        // height: size.height,
        // background: 'white',
        position: 'relative',
        // border: '1px solid #ccc',
      }}
    >
      <NotionRenderer
        rootPageId={notionPageId || undefined} // 페이지 ID가 있을 때만 설정
        recordMap={notionRecordMap}
        darkMode={isDarkMode}
        fullPage={true}
      />{' '}
      {/* 크기 조절 핸들 추가 */}
      <div
        className='resize-handle right'
        onMouseDown={(e) => {
          setIsResizing(true);
          setResizeDirection('right');
          setStartX(e.clientX);
          setStartWidth(size.width);
        }}
        style={{ height: notionRecordMap ? '100vh' : '100vh' }}
      />
    </div>
  );
}

const rootNode = document.getElementById('create-figma-plugin');
if (rootNode) {
  const root = ReactDOM.createRoot(rootNode);
  root.render(<Plugin />);
} else {
  console.error('Root node not found!');
}
