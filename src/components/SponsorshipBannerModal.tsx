import React, { useState, useEffect } from 'react';
import { X, Printer, Sparkles, Languages, ZoomIn, ZoomOut, Check, Maximize2 } from 'lucide-react';

interface SponsorshipBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialName?: string;
  initialBranch?: string;
  initialGeneration?: number | string;
  initialAmount?: number; // e.g. 100000, 1000000
}

/**
 * 80mm 영수증 감열지 연속 롤 전용 세로형 협찬금/지원금 리본 출력 모달
 * 
 * [개선된 핵심 스펙]
 * 1. 로고: 너비 68mm로 웅장하게 확대 (용지 폭 80mm의 85% 이상 점유)
 * 2. 금액(세로쓰기): 글자당 너비 72mm, font-size 50mm (여백 제외 전폭 꽉 채움)
 * 3. 문파 / 세수: 2줄 대형 괘선 블록 (1행 문파 font-size 13mm, 2행 세수 font-size 15mm)
 * 4. 성명(세로쓰기): 글자당 너비 72mm, font-size 56mm (여백 제외 전폭 꽉 채움)
 * 5. 600~650mm 롤 용지에 빈 공간 없이 시원하고 묵직하게 가득 채움!
 */
export const SponsorshipBannerModal: React.FC<SponsorshipBannerModalProps> = ({
  isOpen,
  onClose,
  initialName = '',
  initialBranch = '',
  initialGeneration = '',
  initialAmount = 100000,
}) => {
  // 금액 기본값 자동 생성 (100만원 이상은 1 百 萬 圓, 10만원대는 1 0 만 원)
  const getSmartInitialAmount = (amt: number): string => {
    if (amt >= 10000000) {
      const cheon = Math.floor(amt / 10000000);
      return `${cheon} 千 萬 圓`;
    }
    if (amt >= 1000000) {
      const baek = Math.floor(amt / 1000000);
      return `${baek} 百 萬 圓`;
    }
    if (amt >= 10000) {
      const man = Math.floor(amt / 10000);
      if (man >= 10) {
        const tens = Math.floor(man / 10);
        return `${tens} 0 만 원`;
      }
      return `${man} 만 원`;
    }
    return '1 0 만 원';
  };

  const [name, setName] = useState(initialName || '');
  const [branch, setBranch] = useState(initialBranch || '호군공파');
  const [generation, setGeneration] = useState(
    initialGeneration ? `${String(initialGeneration).replace(/[^0-9]/g, '')}세` : '30세'
  );
  const [amountText, setAmountText] = useState(getSmartInitialAmount(initialAmount));
  const [bannerLengthMm, setBannerLengthMm] = useState<number>(650); // 600, 650, 700mm
  const [fontFamily, setFontFamily] = useState<'gungsuh' | 'myeongjo'>('gungsuh');
  const [zoomScale, setZoomScale] = useState<number>(0.55); // 전체가 한눈에 들어오는 기본 배율

  useEffect(() => {
    if (isOpen) {
      if (initialName) setName(initialName);
      if (initialBranch) setBranch(initialBranch);
      if (initialGeneration) {
        setGeneration(`${String(initialGeneration).replace(/[^0-9]/g, '')}세`);
      }
      if (initialAmount) {
        setAmountText(getSmartInitialAmount(initialAmount));
      }
    }
  }, [isOpen, initialName, initialBranch, initialGeneration, initialAmount]);

  if (!isOpen) return null;

  // 프리셋 목록
  const presets = [
    { label: '10만원', text: '1 0 만 원', highlight: false },
    { label: '20만원', text: '2 0 만 원', highlight: false },
    { label: '30만원', text: '3 0 만 원', highlight: false },
    { label: '50만원', text: '5 0 만 원', highlight: false },
    { label: '100만원 ⭐', text: '1 百 萬 圓', highlight: true },
    { label: '200만원 ⭐', text: '2 百 萬 圓', highlight: true },
    { label: '300만원 ⭐', text: '3 百 萬 圓', highlight: true },
    { label: '500만원 ⭐', text: '5 百 萬 圓', highlight: true },
    { label: '1,000만원 ⭐', text: '1 千 萬 圓', highlight: true },
  ];

  // 한자(萬/圓) <-> 한글(만/원) 즉시 전환 토글
  const toggleHanjaHangeul = () => {
    let current = amountText;
    if (current.includes('萬') || current.includes('圓') || current.includes('百') || current.includes('千')) {
      current = current
        .replace(/百/g, '백')
        .replace(/千/g, '천')
        .replace(/萬/g, '만')
        .replace(/圓/g, '원');
    } else {
      current = current
        .replace(/백/g, '百')
        .replace(/천/g, '千')
        .replace(/만/g, '萬')
        .replace(/원/g, '圓');
    }
    setAmountText(current);
  };

  // 세로 문자 배열 추출
  const amountChars = Array.from(amountText.replace(/\s+/g, ''));
  const nameChars = Array.from(name.replace(/\s+/g, ''));

  // 문파 및 세수 텍스트 정제
  const cleanBranch = branch.trim();
  const cleanGen = generation.trim();

  // 실제 인쇄 실행 (히든 iframe으로 메인 화면 간섭 없이 80mm x 650mm 독립 출력)
  const handlePrint = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const fontCss =
      fontFamily === 'gungsuh'
        ? "'ChosunGs', 'Gungsuh', '궁서', 'Batang', serif"
        : "'Nanum Myeongjo', 'Batang', serif";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>협찬금_${name}_${amountText.replace(/\s+/g, '')}</title>
          <style>
            @font-face {
              font-family: 'ChosunGs';
              src: url('/fonts/ChosunGs.woff') format('woff'),
                   url('https://fastly.jsdelivr.net/gh/projectnoonnu/noonfonts_20-04@1.0/ChosunGs.woff') format('woff');
              font-weight: normal;
              font-style: normal;
            }
            @page {
              size: 80mm ${bannerLengthMm}mm;
              margin: 0mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              width: 80mm;
              min-height: ${bannerLengthMm}mm;
              height: ${bannerLengthMm}mm;
              margin: 0 auto;
              background: #ffffff;
              font-family: ${fontCss};
              color: #000000;
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 6mm 4mm 10mm 4mm;
              border-left: 2.5px solid #000000;
              border-right: 2.5px solid #000000;
              box-sizing: border-box;
            }
            
            /* 상단 밀착 그룹: 로고 + 금액 + 문파/세수 */
            .top-group {
              width: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
            }

            /* 1. 상단 대형 로고 */
            .logo-box {
              width: 100%;
              text-align: center;
              margin-bottom: 1.5mm;
            }
            .logo-img {
              width: 66mm;
              max-width: 66mm;
              height: auto;
              display: block;
              margin: 0 auto;
            }

            /* 2. 금액 세로쓰기 (로고와 가깝게 밀착) */
            .amount-section {
              width: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 1.5mm;
              margin-top: 1mm;
              margin-bottom: 2mm;
            }
            .amount-char {
              width: 72mm;
              font-size: 48mm;
              font-weight: 900;
              line-height: 0.95;
              text-align: center;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            /* 3. 문파 & 세수 2줄 대형 괘선 블록 (금액과 가깝게 밀착) */
            .branch-gen-box {
              width: 72mm;
              text-align: center;
              border-top: 3px solid #000000;
              border-bottom: 3px solid #000000;
              padding: 3.5mm 0 4mm 0;
              margin-top: 2mm;
            }
            .branch-text {
              font-size: 13mm;
              font-weight: 900;
              line-height: 1.15;
              letter-spacing: 3mm;
              text-align: center;
            }
            .gen-text {
              font-size: 15mm;
              font-weight: 900;
              line-height: 1.15;
              letter-spacing: 2mm;
              text-align: center;
              margin-top: 2mm;
            }

            /* 4. 성명: 남은 하단 공간 전체를 넉넉하게 띄어쓰기하여 꽉 채움 */
            .name-section {
              flex: 1;
              width: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: space-evenly;
              padding-top: 5mm;
              padding-bottom: 5mm;
            }
            .name-char {
              width: 72mm;
              font-size: 58mm;
              font-weight: 900;
              line-height: 1;
              text-align: center;
              display: flex;
              align-items: center;
              justify-content: center;
            }
          </style>
        </head>
        <body>
          <div class="top-group">
            <!-- 1. 로고 -->
            <div class="logo-box">
              <img src="/logo-black.png" class="logo-img" alt="종문로고" />
            </div>
            
            <!-- 2. 금액 -->
            <div class="amount-section">
              ${amountChars.map((c) => `<div class="amount-char">${c}</div>`).join('')}
            </div>

            <!-- 3. 문파 세수 2줄 -->
            <div class="branch-gen-box">
              <div class="branch-text">${cleanBranch}</div>
              <div class="gen-text">${cleanGen}</div>
            </div>
          </div>

          <!-- 4. 성명 (남은 공간 균등 띄어쓰기) -->
          <div class="name-section">
            ${nameChars.map((c) => `<div class="name-char">${c}</div>`).join('')}
          </div>
        </body>
      </html>
    `;

    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden border border-slate-200">
        {/* 모달 상단 헤더 */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                80mm 협찬금·지원금 리본 출력
                <span className="text-xs bg-amber-400 text-slate-950 font-extrabold px-2 py-0.5 rounded-full">
                  전폭 꽉 채움 대형 세로쓰기
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                너비 80mm × 길이 {bannerLengthMm}mm 연속 롤 | 2번 영수증 프린터 전용
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 2컬럼 레이아웃: 좌측 설정 패널, 우측 실시간 프리뷰 */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden bg-slate-50">
          {/* 좌측: 입력 컨트롤러 (md: 5열) */}
          <div className="md:col-span-5 p-5 space-y-4 overflow-y-auto border-r border-slate-200 bg-white">
            {/* 1. 성명 입력 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                종친 성명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 이성원"
                className="w-full px-3.5 py-2.5 text-base font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            {/* 2. 공파 및 세수 (2줄 출력) */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  1행: 공파명
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="예: 둔재공파"
                  className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  2행: 세수
                </label>
                <input
                  type="text"
                  value={generation}
                  onChange={(e) => setGeneration(e.target.value)}
                  placeholder="예: 33세"
                  className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {/* 3. 협찬금액 입력 및 프리셋 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  협찬/지원 금액 <span className="text-amber-600 font-extrabold">(초대형 세로쓰기)</span>
                </label>
                {/* 십만원도 한자로 해달라고 할 때 대비 원클릭 토글! */}
                <button
                  type="button"
                  onClick={toggleHanjaHangeul}
                  className="text-[11px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                  title="한글(만/원)과 한자(萬/圓)를 즉시 전환합니다"
                >
                  <Languages className="w-3 h-3 text-amber-600" />
                  한자(萬/圓) ↔ 한글 전환
                </button>
              </div>

              <input
                type="text"
                value={amountText}
                onChange={(e) => setAmountText(e.target.value)}
                placeholder="예: 1 0 만 원 또는 1 百 萬 圓"
                className="w-full px-3.5 py-2 text-lg font-black text-amber-900 border border-amber-300 bg-amber-50/50 rounded-xl mb-2.5 tracking-wider"
              />

              <div className="space-y-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">
                    십만원 단위 (1 0 만 원)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {presets.filter(p => !p.highlight).map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setAmountText(p.text)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          amountText.replace(/\s+/g, '') === p.text.replace(/\s+/g, '')
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-amber-700 block mb-1">
                    백만원 단위 (고액 특별 협찬 한자 A안: 百 萬 圓)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {presets.filter(p => p.highlight).map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setAmountText(p.text)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          amountText.replace(/\s+/g, '') === p.text.replace(/\s+/g, '')
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-amber-50/80 text-amber-900 border-amber-300 hover:bg-amber-100'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. 리본 출력 길이 및 서체 설정 */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  롤 출력 길이 (영수증 자동 컷)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[600, 650, 700].map((len) => (
                    <button
                      key={len}
                      type="button"
                      onClick={() => setBannerLengthMm(len)}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        bannerLengthMm === len
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {len}mm ({len / 10}cm)
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">글씨체</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFontFamily('gungsuh')}
                    className={`py-1.5 text-xs font-bold rounded-lg border font-chosun cursor-pointer ${
                      fontFamily === 'gungsuh'
                        ? 'bg-sky-700 text-white border-sky-700'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    조선궁서체 (추천)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontFamily('myeongjo')}
                    className={`py-1.5 text-xs font-bold rounded-lg border font-myeongjo cursor-pointer ${
                      fontFamily === 'myeongjo'
                        ? 'bg-sky-700 text-white border-sky-700'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    명조체
                  </button>
                </div>
              </div>
            </div>

            {/* 하단 인쇄 실행 버튼 */}
            <div className="pt-3">
              <button
                type="button"
                onClick={handlePrint}
                disabled={!name.trim()}
                className="w-full py-3.5 bg-linear-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-black text-base rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Printer className="w-5 h-5" />
                <span>80mm 협찬금 리본 인쇄하기</span>
              </button>
              <p className="text-[11px] text-center text-slate-400 mt-1.5">
                💡 2번 영수증 프린터(80mm 롤)를 선택해 인쇄하시면 자동 컷팅됩니다.
              </p>
            </div>
          </div>

          {/* 우측: 실시간 80mm 리본 미리보기 (md: 7열) */}
          <div className="md:col-span-7 p-4 sm:p-6 flex flex-col items-center justify-center bg-slate-200/80 overflow-hidden relative">
            {/* 배율 조절 컨트롤 바 */}
            <div className="absolute top-3 right-4 z-10 flex items-center gap-1 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full shadow-md border border-slate-300 text-xs font-bold text-slate-700">
              <button
                onClick={() => setZoomScale(0.35)}
                className={`px-2 py-0.5 rounded text-[11px] transition-all cursor-pointer ${
                  zoomScale === 0.35 ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-600'
                }`}
                title="한눈에 전체 보기"
              >
                한눈에
              </button>
              <button
                onClick={() => setZoomScale(0.55)}
                className={`px-2 py-0.5 rounded text-[11px] transition-all cursor-pointer ${
                  zoomScale === 0.55 ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-600'
                }`}
                title="기본 배율"
              >
                기본
              </button>
              <div className="h-3 w-px bg-slate-300 mx-0.5" />
              <button
                onClick={() => setZoomScale((prev) => Math.max(0.25, prev - 0.05))}
                className="p-1 hover:bg-slate-100 rounded cursor-pointer"
                title="축소"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="w-10 text-center font-mono">{Math.round(zoomScale * 100)}%</span>
              <button
                onClick={() => setZoomScale((prev) => Math.min(1.0, prev + 0.05))}
                className="p-1 hover:bg-slate-100 rounded cursor-pointer"
                title="확대"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5 self-start pl-2">
              <span>📜 실물 리본 전폭 꽉 채움 미리보기 (80mm × {bannerLengthMm}mm)</span>
            </div>

            {/* 스크롤 가능한 프리뷰 영역 */}
            <div className="w-full h-[640px] overflow-y-auto flex items-start justify-center p-2 rounded-xl bg-slate-300/50 border border-slate-300/80 shadow-inner">
              <div
                style={{
                  transform: `scale(${zoomScale})`,
                  transformOrigin: 'top center',
                  width: '80mm',
                  minHeight: `${bannerLengthMm}mm`,
                  height: `${bannerLengthMm}mm`,
                  boxSizing: 'border-box',
                  padding: '6mm 4mm 10mm 4mm',
                }}
                className={`bg-white text-black shadow-2xl flex flex-col items-center border-x-[3px] border-black transition-transform shrink-0 ${
                  fontFamily === 'gungsuh' ? 'font-chosun' : 'font-myeongjo'
                }`}
              >
                {/* 상단 밀착 그룹: 로고 + 금액 + 문파/세수 */}
                <div className="w-full flex flex-col items-center">
                  {/* 1. 상단 대형 종문 로고 */}
                  <div className="w-full text-center mb-1">
                    <img
                      src="/logo-black.png"
                      alt="종문로고"
                      style={{ width: '66mm', maxWidth: '66mm' }}
                      className="h-auto mx-auto object-contain block"
                    />
                  </div>

                  {/* 2. 초대형 금액 세로쓰기 (로고와 가깝게 밀착) */}
                  <div className="w-full flex flex-col items-center justify-center my-1 gap-[1.5mm]">
                    {amountChars.map((ch, idx) => (
                      <div
                        key={`preview-amt-${idx}`}
                        style={{
                          width: '72mm',
                          fontSize: '48mm',
                          lineHeight: 0.95,
                          height: '46mm',
                        }}
                        className="font-black text-center flex items-center justify-center tracking-tighter"
                      >
                        {ch}
                      </div>
                    ))}
                  </div>

                  {/* 3. 문파 & 세수 2줄 대형 괘선 블록 (금액과 가깝게 밀착) */}
                  <div
                    style={{
                      width: '72mm',
                      borderTop: '3px solid black',
                      borderBottom: '3px solid black',
                      padding: '3.5mm 0 4mm 0',
                      marginTop: '2mm',
                    }}
                    className="text-center"
                  >
                    <div
                      style={{
                        fontSize: '13mm',
                        lineHeight: 1.15,
                        letterSpacing: '3mm',
                      }}
                      className="font-black text-center tracking-widest"
                    >
                      {cleanBranch}
                    </div>
                    <div
                      style={{
                        fontSize: '15mm',
                        lineHeight: 1.15,
                        letterSpacing: '2mm',
                        marginTop: '2mm',
                      }}
                      className="font-black text-center"
                    >
                      {cleanGen}
                    </div>
                  </div>
                </div>

                {/* 4. 성명: 남은 하단 공간 전체를 넉넉하게 띄어쓰기하여 꽉 채움 */}
                <div className="w-full flex-1 flex flex-col items-center justify-evenly py-4">
                  {nameChars.map((ch, idx) => (
                    <div
                      key={`preview-name-${idx}`}
                      style={{
                        width: '72mm',
                        fontSize: '58mm',
                        lineHeight: 1,
                      }}
                      className="font-black text-center flex items-center justify-center tracking-tighter"
                    >
                      {ch}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
