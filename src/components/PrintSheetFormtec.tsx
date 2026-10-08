import React from 'react';
import { AttendanceRecord, LabelSettings } from '../types';
import { LabelCard } from './LabelCard';

interface PrintSheetFormtecProps {
  items: AttendanceRecord[];
  settings: LabelSettings;
}

/**
 * 폼텍 3114 (8칸, 2열 x 4행, 99.1 x 67.7 mm) 전용 인쇄 시트
 * 8칸씩 묶어서 A4 페이지 단위로 분할 렌더링
 * 사용자가 선택한 라벨 번호(1~8번)에 정확히 맞추어 빈 칸을 두고 출력 지원
 */
export const PrintSheetFormtec: React.FC<PrintSheetFormtecProps> = ({ items, settings }) => {
  // 단일 인쇄 시 item.printSlot이 우선, 없으면 settings.formtecStartSlot 사용
  const effectiveStartSlot =
    items.length === 1 && items[0]?.printSlot
      ? items[0].printSlot
      : settings.formtecStartSlot || 1;

  const startSlot = Math.max(1, Math.min(8, effectiveStartSlot));
  const blankCount = startSlot - 1;

  // 인쇄할 전체 슬롯 목록 구성 (선택한 시작 칸 앞에 빈 슬롯 삽입)
  const fullSlots: (AttendanceRecord | null)[] = [
    ...Array(blankCount).fill(null),
    ...items,
  ];

  // 8칸씩 페이지 단위로 나누기
  const pages: (AttendanceRecord | null)[][] = [];
  for (let i = 0; i < fullSlots.length; i += 8) {
    const pageItems = fullSlots.slice(i, i + 8);
    // 페이지의 남은 빈 칸 채우기
    while (pageItems.length < 8) {
      pageItems.push(null);
    }
    pages.push(pageItems);
  }

  return (
    <div className="print-sheets-container">
      {pages.map((page, pageIdx) => (
        <div
          key={`formtec-page-${pageIdx}`}
          className="formtec-page relative box-border bg-white"
          style={{
            width: '210mm',
            height: '297mm',
            paddingTop: `${13 + (settings.offsetYmm || 0)}mm`,
            paddingLeft: `${5.9 + (settings.offsetXmm || 0)}mm`,
            paddingRight: '5.9mm',
            paddingBottom: '13mm',
            pageBreakAfter: pageIdx < pages.length - 1 ? 'always' : 'auto',
            boxSizing: 'border-box',
          }}
        >
          {/* 2열 x 4행 그리드 (총 8칸: 1~8번) */}
          <div
            className="grid grid-cols-2"
            style={{
              width: '198.2mm',
              height: '270.8mm',
              columnGap: '0mm',
              rowGap: '0mm',
              boxSizing: 'border-box',
            }}
          >
            {page.map((item, slotIdx) => (
              <div
                key={`slot-${pageIdx}-${slotIdx}`}
                className="box-border flex items-center justify-center overflow-hidden"
                style={{
                  width: '99.1mm',
                  height: '67.7mm',
                  maxWidth: '99.1mm',
                  maxHeight: '67.7mm',
                  boxSizing: 'border-box',
                }}
              >
                {item ? (
                  <LabelCard
                    name={item.name}
                    branch={item.branch}
                    generation={item.generation}
                    role={item.role}
                    settings={settings}
                    isPrint={true}
                  />
                ) : (
                  // 빈 슬롯 (이미 사용했거나 비어있는 라벨 칸)
                  <div className="w-full h-full border border-dashed border-slate-200 opacity-20 print:opacity-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
