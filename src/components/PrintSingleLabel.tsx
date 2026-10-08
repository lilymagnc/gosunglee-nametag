import React from 'react';
import { AttendanceRecord, LabelSettings } from '../types';
import { LabelCard } from './LabelCard';

interface PrintSingleLabelProps {
  items: AttendanceRecord[];
  settings: LabelSettings;
}

/**
 * 90x60mm 및 80x60mm 낱장/롤 라벨 프린터용 인쇄 컴포넌트
 * 각 라벨마다 1페이지(page-break-after: always)로 분할
 */
export const PrintSingleLabel: React.FC<PrintSingleLabelProps> = ({ items, settings }) => {
  const is90x60 = settings.paperSize === 'label_90x60';
  const widthMm = is90x60 ? '90mm' : '80mm';
  const heightMm = '60mm';

  return (
    <div className="single-labels-print-container">
      {items.map((item, idx) => (
        <div
          key={`single-print-${item.id || idx}`}
          className="single-label-page flex items-center justify-center bg-white"
          style={{
            width: widthMm,
            height: heightMm,
            pageBreakAfter: idx < items.length - 1 ? 'always' : 'auto',
            paddingLeft: `${settings.offsetXmm || 0}mm`,
            paddingTop: `${settings.offsetYmm || 0}mm`,
            boxSizing: 'border-box',
          }}
        >
          <LabelCard
            name={item.name}
            branch={item.branch}
            generation={item.generation}
            role={item.role}
            settings={settings}
            isPrint={true}
          />
        </div>
      ))}
    </div>
  );
};
