import React from 'react';
import { LabelSettings } from '../types';

interface LabelCardProps {
  name: string;
  branch: string;
  generation: number | string;
  role?: string;
  settings: LabelSettings;
  isPrint?: boolean;
}

export const LabelCard: React.FC<LabelCardProps> = ({
  name,
  branch,
  generation,
  role = '',
  settings,
  isPrint = false,
}) => {
  const formattedName = name.trim();
  const nameLength = formattedName.length;

  // 전통 궁서체/명조체 서체
  const fontStyle =
    settings.fontFamily === 'myeongjo'
      ? '"Nanum Myeongjo", "Gowun Batang", "Batang", serif'
      : '"Gungsuh", "Batang", "Gowun Batang", serif';

  // 직책 줄바꿈 포맷팅 (실물 샘플 사진 100% 동일 & 단어 절단 원천 방지)
  const formatRole = (r: string) => {
    if (!r) return '';
    const trimmed = r.trim();
    if (trimmed.includes('\n')) return trimmed;

    // 공백이 있는 경우 (예: "호군공파 회장" -> "호군공파\n회장")
    if (trimmed.includes(' ')) {
      return trimmed.split(/\s+/).join('\n');
    }

    // 2자 또는 3자: 1줄 그대로 표기 ("회장", "고문", "종원", "감사", "파회장")
    if (trimmed.length <= 3) {
      return trimmed;
    }

    // 4자: 2자씩 2줄 ("재무\n이사", "사무\n총장", "신임\n회장", "청년\n회장")
    if (trimmed.length === 4) {
      return `${trimmed.slice(0, 2)}\n${trimmed.slice(2)}`;
    }

    // 5자: 의미 단위 2/3 또는 3/2 분리
    if (trimmed.length === 5) {
      if (trimmed === '대종회회장') return '대종회\n회장';
      if (trimmed === '여성부회장') return '여성\n부회장';
      if (trimmed === '수석부회장') return '수석\n부회장';
      if (trimmed.endsWith('회장') || trimmed.endsWith('국장') || trimmed.endsWith('위원')) {
        return `${trimmed.slice(0, trimmed.length - 2)}\n${trimmed.slice(trimmed.length - 2)}`;
      }
      return `${trimmed.slice(0, 2)}\n${trimmed.slice(2)}`;
    }

    // 6자: "호군공파회장" 등 3/3으로 쪼개면 "파"가 찢어지므로, 2자씩 3줄(2/2/2)로 단정하게 배치!
    // ("호군\n공파\n회장") -> 가로 폭도 2자만 차지하여 이름이 오른쪽으로 밀리지 않음!
    if (trimmed.length === 6) {
      return `${trimmed.slice(0, 2)}\n${trimmed.slice(2, 4)}\n${trimmed.slice(4)}`;
    }

    // 7자 이상:
    if (trimmed.length > 6) {
      if (trimmed === '전자족보운영위원') return '전자족보\n운영위원';
      if (trimmed.endsWith('운영위원') && trimmed.length === 8) {
        return `${trimmed.slice(0, 4)}\n운영위원`;
      }
      if (trimmed.length === 8) {
        return `${trimmed.slice(0, 4)}\n${trimmed.slice(4)}`;
      }
      return `${trimmed.slice(0, Math.ceil(trimmed.length / 2))}\n${trimmed.slice(Math.ceil(trimmed.length / 2))}`;
    }

    return trimmed;
  };

  const formattedRole = formatRole(role);

  // 용지 규격에 따른 mm 단위 계산
  const isFormtec = settings.paperSize === 'formtec_3114';
  const is90x60 = settings.paperSize === 'label_90x60';
  const is80x60 = settings.paperSize === 'label_80x60';

  const widthMm = isFormtec ? 99.1 : is90x60 ? 90 : 80;
  const heightMm = isFormtec ? 67.7 : 60;

  // 화면 미리보기 모드에서의 실제 비례 px 크기 계산
  // 폼텍 8칸: 330px x 225px (가로 99.1mm x 세로 67.7mm)
  // 90x60 감열: 300px x 200px (가로 90mm x 세로 60mm)
  // 80x60 감열: 266px x 200px (가로 80mm x 세로 60mm - 가로 폭이 확 좁아지는 실물 형태 반영!)
  const previewWidth = isFormtec ? 330 : is90x60 ? 300 : 266;
  const previewHeight = isFormtec ? 225 : 200;

  // 감열 및 컬러 모드 결정
  const mode = settings.thermalMode || 'color';
  const isThermal = mode !== 'color';

  // 디자인 색상 (감열 모드: 회색 일체 배제, 100% 순수 블랙)
  const boxBg = isThermal
    ? mode === 'inverted' ? '#000000' : '#ffffff'
    : settings.headerBgColor || '#8cc0ec';

  const boxTextColor = isThermal
    ? mode === 'inverted' ? '#ffffff' : '#000000'
    : '#000000';

  const boxBorder = isThermal
    ? mode === 'textOnly' ? 'none' : '2px solid #000000'
    : '1.2px solid #3b82c4';

  const showFooter = mode !== 'textOnly' && settings.showFooter;

  // ---------------------------------------------------------------------------
  // [황금 비율 & 타이포그래피 통일 규칙]:
  // 1. 직책: 16.5px (인쇄 15.5pt) 볼드 폰트로 당당하고 굵직하게 표기
  // 2. 이름: 2자·3자·4자 모두 100% 동일한 단일 폰트 크기(화면 50px / 인쇄 42pt) 고정!
  //    (자간 letter-spacing만으로 자연스럽게 정렬하여 모든 명찰의 획 두께와 높이 완전 일치)
  // ---------------------------------------------------------------------------
  // 1) 인쇄 모드 (pt 단위) - 2자, 3자, 4자 모두 42pt 완전 동일!
  const printFontSize =
    is80x60
      ? (nameLength > 4 ? '30pt' : '38pt')
      : (nameLength > 4 ? '32pt' : '42pt');

  const printLetterSpacing =
    nameLength === 2
      ? '0.80em'
      : nameLength === 3
      ? (is80x60 ? '0.22em' : '0.30em')
      : nameLength === 4
      ? '0.04em'
      : '0.01em';

  // 2) 화면 미리보기 모드 (px 단위) - 2자, 3자, 4자 모두 50px 완전 동일!
  const previewFontSize =
    is80x60
      ? (nameLength > 4 ? '36px' : '45px')
      : (nameLength > 4 ? '40px' : '50px');

  const previewLetterSpacing =
    nameLength === 2
      ? '0.82em'
      : nameLength === 3
      ? (is80x60 ? '0.22em' : '0.30em')
      : nameLength === 4
      ? '0.04em'
      : '0.01em';

  // 직책 줄 수 및 최대 글자폭 계산
  const roleLines = formattedRole ? formattedRole.split('\n') : [];
  const roleLineCount = roleLines.length;
  const roleMaxLineLen = roleLines.length > 0 ? Math.max(...roleLines.map((l) => l.length)) : 0;

  // 직책 영역 너비 (가로 글자수에 따른 최적 폭 계산)
  const printRoleWidth =
    roleMaxLineLen >= 4
      ? is80x60 ? '22mm' : '24.5mm'
      : roleMaxLineLen === 3
      ? is80x60 ? '18.5mm' : '20.5mm'
      : is80x60 ? '15.5mm' : '17mm';

  const previewRoleWidth =
    roleMaxLineLen >= 4
      ? is80x60 ? '66px' : '76px'
      : roleMaxLineLen === 3
      ? is80x60 ? '56px' : '64px'
      : is80x60 ? '46px' : '52px';

  // 직책 폰트 크기 및 행간 (글자수와 줄수에 따른 정밀 조절)
  const printRoleFontSize =
    roleMaxLineLen >= 4
      ? roleLineCount >= 3 ? '10.5pt' : '12.5pt'
      : roleLineCount >= 3
      ? '11.5pt'
      : roleLineCount === 2
      ? '15pt'
      : '16pt';

  const printRoleLineHeight =
    roleLineCount >= 3 ? '1.08' : '1.14';

  const previewRoleFontSize =
    roleMaxLineLen >= 4
      ? roleLineCount >= 3 ? '11.5px' : '13.5px'
      : roleLineCount >= 3
      ? '12.5px'
      : roleLineCount === 2
      ? '16px'
      : '17.5px';

  const previewRoleLineHeight =
    roleLineCount >= 3 ? '1.10' : '1.16';

  // =========================================================================
  // 1. 인쇄 모드 (isPrint === true) - 정확한 mm 단위 레이아웃
  // =========================================================================
  if (isPrint) {
    return (
      <div
        className="label-card relative flex flex-col justify-between box-border bg-white text-black select-none overflow-hidden"
        style={{
          width: `${widthMm}mm`,
          height: `${heightMm}mm`,
          maxWidth: `${widthMm}mm`,
          maxHeight: `${heightMm}mm`,
          padding: '2.5mm 3.5mm',
          boxSizing: 'border-box',
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
        }}
      >
        {/* 상단 직사각형 박스 (파명 / 세수) */}
        <div
          className="w-full flex items-center justify-between px-3 box-border"
          style={{
            backgroundColor: boxBg,
            height: is80x60 ? '12.5mm' : '13.5mm',
            minHeight: is80x60 ? '12.5mm' : '13.5mm',
            border: boxBorder,
            boxSizing: 'border-box',
          }}
        >
          <div
            className="font-black tracking-wider text-black"
            style={{
              fontSize: is80x60 ? '15pt' : '17pt',
              lineHeight: 1,
              color: boxTextColor,
              fontFamily: '"Malgun Gothic", "Dotum", sans-serif',
            }}
          >
            {branch || '고성이씨'}
          </div>
          <div
            className="font-black tracking-widest text-black"
            style={{
              fontSize: is80x60 ? '14pt' : '16pt',
              lineHeight: 1,
              color: boxTextColor,
              fontFamily: '"Malgun Gothic", "Dotum", sans-serif',
            }}
          >
            {generation ? `${generation} 세` : ''}
          </div>
        </div>

        {/* 중앙 본문 영역 (직책 18~20% + 이름 80~82% 꽉 채움) */}
        <div
          className="w-full flex-1 flex items-center justify-between px-1 box-border bg-white"
          style={{ minHeight: is80x60 ? '30mm' : '34mm' }}
        >
          {/* 좌측 직책 영역 (18~20% 고정 확보하여 직책 유무 상관없이 모든 명찰의 이름 위치가 100% 일치 통일!) */}
          <div
            className="flex flex-col justify-center items-start text-left shrink-0"
            style={{ width: printRoleWidth, minWidth: printRoleWidth }}
          >
            {formattedRole ? (
              <div
                className="font-black text-black whitespace-pre-line tracking-tight pl-0.5"
                style={{
                  fontSize: printRoleFontSize,
                  lineHeight: printRoleLineHeight,
                  fontFamily: '"Malgun Gothic", sans-serif',
                }}
              >
                {formattedRole}
              </div>
            ) : null}
          </div>

          {/* 중앙 성명 영역 (80% 이상 공간을 온전히 활용하여 큼직하고 웅장하게 출력!) */}
          <div className="flex-1 flex items-center justify-center text-center overflow-hidden">
            <span
              className="font-black text-black whitespace-nowrap inline-block"
              style={{
                fontFamily: fontStyle,
                fontSize: printFontSize,
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: printLetterSpacing,
                marginRight: `-${printLetterSpacing}`, // 우측 자간 오프셋 상쇄로 완벽한 중앙 정렬
                WebkitTextStroke: '1.2px #000000',
                textShadow: '0 0 1px #000000',
              }}
            >
              {formattedName}
            </span>
          </div>

          {/* 우측 균형 여백 (2mm) */}
          <div style={{ width: '2mm', minWidth: '2mm' }} />
        </div>

        {/* 하단 직사각형 박스 (固 城 李 氏 서 울 宗 親 會) */}
        {showFooter && (
          <div
            className="w-full flex items-center justify-center box-border"
            style={{
              backgroundColor: boxBg,
              height: is80x60 ? '11.5mm' : '12.5mm',
              minHeight: is80x60 ? '11.5mm' : '12.5mm',
              border: boxBorder,
              boxSizing: 'border-box',
            }}
          >
            <div
              className="font-bold text-center tracking-[0.24em] whitespace-nowrap"
              style={{
                fontSize: is80x60 ? '11.5pt' : '13pt',
                lineHeight: 1,
                color: boxTextColor,
                fontFamily: '"Batang", "Nanum Myeongjo", serif',
              }}
            >
              {settings.footerText || '固 城 李 氏 서 울 宗 親 會'}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 2. 화면 미리보기 모드 (isPrint === false) - 용지 규격별 실물 비율(가로 x 세로) 100% 반영
  // =========================================================================
  return (
    <div
      className={`label-card-preview relative flex flex-col justify-between box-border bg-white text-black select-none overflow-hidden transition-all duration-200 ${
        isThermal
          ? 'border-2 border-black rounded shadow-md'
          : 'border border-slate-300 rounded shadow-md'
      }`}
      style={{
        width: `${previewWidth}px`,
        height: `${previewHeight}px`,
        maxWidth: '100%',
        padding: is80x60 ? '6px 8px' : '8px 10px',
        boxSizing: 'border-box',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      {/* 1. 상단 직사각형 박스 (파명 / 세수) */}
      <div
        className="w-full flex items-center justify-between px-3 box-border"
        style={{
          backgroundColor: boxBg,
          height: is80x60 ? '36px' : '40px',
          minHeight: is80x60 ? '36px' : '40px',
          border: boxBorder,
          borderRadius: '3px',
          boxSizing: 'border-box',
        }}
      >
        <div
          className="font-black tracking-wider text-black"
          style={{
            fontSize: is80x60 ? '15px' : '17px',
            lineHeight: 1,
            color: boxTextColor,
            fontFamily: '"Malgun Gothic", "Dotum", sans-serif',
          }}
        >
          {branch || '고성이씨'}
        </div>
        <div
          className="font-black tracking-widest text-black"
          style={{
            fontSize: is80x60 ? '14px' : '16px',
            lineHeight: 1,
            color: boxTextColor,
            fontFamily: '"Malgun Gothic", "Dotum", sans-serif',
          }}
        >
          {generation ? `${generation} 세` : ''}
        </div>
      </div>

      {/* 2. 중앙 본문 영역 (직책 18~20% + 이름 80~82% 꽉 채움) */}
      <div className="w-full flex-1 flex items-center justify-between px-1 box-border bg-white relative my-1">
        {/* 좌측 직책 영역 (18~20% 고정 확보하여 직책 유무 상관없이 통일감 유지) */}
        <div
          className="flex flex-col justify-center items-start text-left shrink-0 z-10"
          style={{ width: previewRoleWidth, minWidth: previewRoleWidth }}
        >
          {formattedRole ? (
            <div
              className="font-black text-black whitespace-pre-line tracking-tight pl-0.5"
              style={{
                fontSize: previewRoleFontSize,
                lineHeight: previewRoleLineHeight,
                fontFamily: '"Malgun Gothic", sans-serif',
              }}
            >
              {formattedRole}
            </div>
          ) : null}
        </div>

        {/* 중앙 성명 영역 (80% 이상의 넓은 공간을 온전히 활용하여 큼직하고 웅장하게 배치!) */}
        <div className="flex-1 flex items-center justify-center text-center overflow-hidden">
          <span
            className="font-black text-black whitespace-nowrap inline-block"
            style={{
              fontFamily: fontStyle,
              fontSize: previewFontSize,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: previewLetterSpacing,
              marginRight: `-${previewLetterSpacing}`, // 우측 자간 오프셋 상쇄
              WebkitTextStroke: '1.2px #000000',
              textShadow: '0 0 1px #000000',
            }}
          >
            {formattedName}
          </span>
        </div>

        {/* 우측 균형 여백 (5px) */}
        <div style={{ width: '5px', minWidth: '5px' }} />
      </div>

      {/* 3. 하단 직사각형 박스 (固 城 李 氏 서 울 宗 親 會) */}
      {showFooter && (
        <div
          className="w-full flex items-center justify-center px-2 box-border"
          style={{
            backgroundColor: boxBg,
            height: is80x60 ? '32px' : '36px',
            minHeight: is80x60 ? '32px' : '36px',
            border: boxBorder,
            borderRadius: '3px',
            boxSizing: 'border-box',
          }}
        >
          <div
            className="font-bold text-center tracking-[0.22em] whitespace-nowrap"
            style={{
              fontSize: is80x60 ? '12px' : '13.5px',
              lineHeight: 1,
              color: boxTextColor,
              fontFamily: '"Batang", "Nanum Myeongjo", serif',
            }}
          >
            {settings.footerText || '固 城 李 氏 서 울 宗 親 會'}
          </div>
        </div>
      )}
    </div>
  );
};
