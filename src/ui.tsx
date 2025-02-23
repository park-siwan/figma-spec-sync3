import '!prismjs/themes/prism.css';
import {
  Button,
  Container,
  render,
  VerticalSpace,
} from '@create-figma-plugin/ui';
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { NotionRenderer } from 'react-notion-x';

import styles from './styles.css';

function extractNotionPageId(url: string): string | null {
  const match = url.match(/([a-f0-9]{32})/);
  return match ? match[1] : null;
}

function Plugin() {
  const [notionPageId, setNotionPageId] = useState<string | null>(null);
  const [notionRecordMap, setNotionRecordMap] = useState<any>(null);
  const [notionAPI, setNotionAPI] = useState<any>(null);

  useEffect(() => {
    // ✅ 동적으로 NotionAPI를 불러오기
    import('notion-client')
      .then(({ NotionAPI }) => {
        setNotionAPI(new NotionAPI());
      })
      .catch((error) => {
        console.error('NotionAPI 로드 실패:', error);
      });
  }, []);

  useEffect(() => {
    window.onmessage = async (event) => {
      const message = event.data.pluginMessage;
      if (message.type === 'SELECT_LAYER') {
        const layerName = message.layerName;
        console.log(`Selected layer: ${layerName}`);

        // Notion 페이지 URL에서 ID 추출
        const pageId = extractNotionPageId(layerName);
        if (pageId) {
          setNotionPageId(pageId);
        } else {
          console.error('유효한 Notion 페이지 ID를 찾을 수 없습니다.');
        }
      }
    };
  }, []);

  useEffect(() => {
    // NotionAPI가 로드되고 페이지 ID가 변경되면 데이터 가져오기
    console.log(' notionAPI:', notionAPI);
    console.log(' notionPageId:', notionPageId);
    if (notionAPI && notionPageId) {
      console.log(`🔍 Fetching Notion page: ${notionPageId}`);

      notionAPI
        .getPage(notionPageId)
        .then((data: any) => {
          console.log('✅ Notion 데이터 불러오기 성공:', data);
          setNotionRecordMap(data);
        })
        .catch((error: Error) => {
          console.error('❌ Notion 데이터 불러오기 실패:', error);
        });
    }
  }, [notionAPI, notionPageId]);

  return (
    <Container space='medium'>
      <VerticalSpace space='small' />
      <h2>Notion 페이지 미리보기</h2>
      <VerticalSpace space='large' />
      {notionRecordMap ? (
        <NotionRenderer
          recordMap={notionRecordMap}
          fullPage={true}
          darkMode={false}
        />
      ) : (
        <p>Figma 요소를 선택하면 해당하는 Notion 페이지가 표시됩니다.</p>
      )}
    </Container>
  );
}

export default render(Plugin);
