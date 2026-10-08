import React, { useState, useEffect } from 'react';
import { LabelSettings } from '../types';
import {
  Settings,
  X,
  Save,
  Calendar,
  Layers,
  FileText,
  Palette,
  Check,
  RotateCcw,
} from 'lucide-react';
import { DEFAULT_SETTINGS } from '../utils/storage';

interface SettingsModalProps {
  settings: LabelSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newSettings: LabelSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const currentYear = new Date().getFullYear();
  const [eventYear, setEventYear] = useState<number>(settings.eventYear || currentYear);
  const [eventName, setEventName] = useState(
    settings.eventName || `${settings.eventYear || currentYear}년 정기총회 및 시제`
  );
  const [footerText, setFooterText] = useState(settings.footerText || '固 城 李 氏 서 울 宗 親 會');
  const [showFooter, setShowFooter] = useState(settings.showFooter ?? true);
  const [paperSize, setPaperSize] = useState(settings.paperSize || 'formtec_3114');
  const [thermalMode, setThermalMode] = useState(settings.thermalMode || 'color');
  const [fontFamily, setFontFamily] = useState(settings.fontFamily || 'gungsuh');
  const [headerBgColor, setHeaderBgColor] = useState(settings.headerBgColor || '#8cc0ec');

  useEffect(() => {
    const yr = settings.eventYear || currentYear;
    setEventYear(yr);
    setEventName(settings.eventName || `${yr}년 정기총회 및 시제`);
    setFooterText(settings.footerText || '固 城 李 氏 서 울 宗 親 會');
    setShowFooter(settings.showFooter ?? true);
    setPaperSize(settings.paperSize || 'formtec_3114');
    setThermalMode(settings.thermalMode || 'color');
    setFontFamily(settings.fontFamily || 'gungsuh');
    setHeaderBgColor(settings.headerBgColor || '#8cc0ec');
  }, [settings, isOpen]);

  const handleSave = () => {
    const finalYear = Number(eventYear) || currentYear;
    const updated: LabelSettings = {
      ...settings,
      eventName: eventName.trim() || `${finalYear}년 정기총회 및 시제`,
      eventYear: finalYear,
      footerText: footerText.trim() || '固 城 李 氏 서 울 宗 親 會',
      showFooter,
      paperSize,
      thermalMode,
      fontFamily,
      headerBgColor,
    };
    onSave(updated);
    onClose();
  };

  const handleReset = () => {
    if (confirm('모든 명찰 및 행사 설정을 기본값으로 초기화하시겠습니까?')) {
      onSave(DEFAULT_SETTINGS);
      onClose();
    }
  };

  // 역대 출석 이력 사진 및 종친회 실제 공식 행사명 프리셋 (올해 연도 자동 결합)
  const eventBaseNames = [
    { title: '정기총회 및 시제', desc: '서울종친회 대표 메인 행사' },
    { title: '가을 정기시제', desc: '역대 이력 실제 행사 (추향제)' },
    { title: '정기총회', desc: '역대 이력 실제 행사' },
    { title: '봄 정기시제', desc: '춘향제' },
    { title: '추향 정기시제', desc: '추계 정기시제' },
    { title: '대종회 정기총회', desc: '고성이씨 대종회' },
    { title: '신년하례회', desc: '연초 하례회' },
  ];

  const footerPresets = [
    { label: '한자 정통 (서울종친회)', text: '固 城 李 氏 서 울 宗 親 會' },
    { label: '한글 표준 (서울종친회)', text: '고 성 이 씨 서 울 종 친 회' },
    { label: '대종회 (한자)', text: '固 城 李 氏 大 宗 會' },
    { label: '안정공파 (한자)', text: '固 城 李 氏 安 靖 公 派' },
    { label: '호군공파 (한자)', text: '固 城 李 氏 湖 軍 公 派' },
    { label: '사암공파 (한자)', text: '固 城 李 氏 思 菴 公 派' },
  ];

  const colorPresets = [
    { label: '실물 연하늘색', color: '#8cc0ec' },
    { label: '스카이블루', color: '#38bdf8' },
    { label: '로열블루', color: '#2563eb' },
    { label: '에메랄드그린', color: '#059669' },
    { label: '클래식그레이', color: '#e2e8f0' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* 모달 헤더 */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-sky-400" />
            <h3 className="text-lg font-bold">행사명 및 명찰 종합 환경설정</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 설정 내용 */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* 1. 행사명 및 행사 연도 설정 */}
          <div className="bg-sky-50/60 p-4 rounded-xl border border-sky-200 space-y-3">
            <div className="flex items-center gap-2 text-sky-950 font-bold text-sm">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>1. 공식 행사명 및 기준 연도 설정</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              접수증 헤더, 수납 대장, 엑셀 출력, 역대 출석 이력에 기록될 공식 행사명입니다.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-3">
                <label className="block text-slate-700 font-bold mb-1">행사명 입력</label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="예: 2026년 정기총회 및 시제"
                  className="w-full px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">행사 연도</label>
                <input
                  type="number"
                  value={eventYear}
                  onChange={(e) => setEventYear(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                />
              </div>
            </div>

            {/* 빠른 행사명 추천 버튼 (올해 연도 자동 결합) */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                ⚡ 종친회 대표 행사명 원클릭 선택 ({eventYear}년 기준):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {eventBaseNames.map((b) => {
                  const fullTitle = `${eventYear}년 ${b.title}`;
                  const isSelected = eventName === fullTitle;
                  return (
                    <button
                      key={b.title}
                      type="button"
                      onClick={() => setEventName(fullTitle)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-sky-50 hover:border-sky-300'
                      }`}
                      title={b.desc}
                    >
                      <span>{fullTitle}</span>
                      {isSelected && <span className="text-[10px] bg-sky-700 px-1 rounded">선택됨</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. 명찰 하단 문구 설정 */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>2. 명찰 하단 문구 설정</span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-bold">
                <input
                  type="checkbox"
                  checked={showFooter}
                  onChange={(e) => setShowFooter(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                />
                하단 문구 인쇄 켜기
              </label>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">하단 인쇄 텍스트</label>
              <input
                type="text"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                placeholder="예: 固 城 李 氏 서 울 宗 親 會"
                disabled={!showFooter}
                className="w-full px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white tracking-widest disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>

            {/* 빠른 문구 추천 버튼 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
              {footerPresets.map((f) => (
                <button
                  key={f.text}
                  type="button"
                  onClick={() => setFooterText(f.text)}
                  disabled={!showFooter}
                  className={`p-1.5 rounded-lg border text-left transition-all ${
                    footerText === f.text
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-[10px] opacity-80">{f.label}</div>
                  <div className="text-xs font-bold truncate">{f.text}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. 기본 용지 규격 & 디자인 모드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-sky-600" />
                기본 출력 용지 규격
              </label>
              <div className="space-y-1.5 pt-1">
                {[
                  { id: 'formtec_3114', label: '폼텍 3114 (8칸 A4용지)', desc: '99.1 × 67.7 mm' },
                  { id: 'label_90x60', label: '감열 롤 라벨 (90×60)', desc: '90.0 × 60.0 mm' },
                  { id: 'label_80x60', label: '감열 롤 라벨 (80×60)', desc: '80.0 × 60.0 mm 슬림' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPaperSize(p.id as any)}
                    className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition-all ${
                      paperSize === p.id
                        ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="text-xs">{p.label}</div>
                      <div className="text-[10px] opacity-75">{p.desc}</div>
                    </div>
                    {paperSize === p.id && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-sky-600" />
                기본 출력 디자인 모드
              </label>
              <div className="space-y-1.5 pt-1">
                {[
                  {
                    id: 'color',
                    label: '🔵 컬러 모드 (폼텍 전용)',
                    desc: '연하늘색 바탕 + 검정 글씨',
                  },
                  {
                    id: 'outline',
                    label: '🖨️ 감열 흑백선 모드',
                    desc: '흰 바탕 + 검정 테두리 (절약형)',
                  },
                  {
                    id: 'inverted',
                    label: '⬛ 감열 블랙반전 모드',
                    desc: '검정 바탕 + 흰 글씨 (실물 선명)',
                  },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setThermalMode(m.id as any)}
                    className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition-all ${
                      thermalMode === m.id
                        ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="text-xs">{m.label}</div>
                      <div className="text-[10px] opacity-75">{m.desc}</div>
                    </div>
                    {thermalMode === m.id && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. 상단 컬러 및 서체 */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 mb-2">명찰 서체 (폰트)</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFontFamily('gungsuh')}
                  className={`py-2 rounded-lg border font-serif text-sm transition-all ${
                    fontFamily === 'gungsuh'
                      ? 'bg-sky-600 text-white border-sky-600 font-bold'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  궁서체 (정통 권장)
                </button>
                <button
                  type="button"
                  onClick={() => setFontFamily('myeongjo')}
                  className={`py-2 rounded-lg border font-serif text-sm transition-all ${
                    fontFamily === 'myeongjo'
                      ? 'bg-sky-600 text-white border-sky-600 font-bold'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  명조체 (단정형)
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-2">
                컬러 모드 상단 바탕색 (파명/세수 박스)
              </label>
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5 flex-1">
                  {colorPresets.map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setHeaderBgColor(c.color)}
                      style={{ backgroundColor: c.color }}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        headerBgColor === c.color
                          ? 'border-slate-900 scale-110 shadow-sm'
                          : 'border-white hover:scale-105'
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={headerBgColor}
                  onChange={(e) => setHeaderBgColor(e.target.value)}
                  className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                  title="직접 색상 선택"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 모달 푸터 */}
        <div className="bg-slate-100 px-6 py-4 flex items-center justify-between border-t border-slate-200 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-semibold text-slate-500 hover:text-red-600 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            초기 기본값으로 복원
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 text-xs font-extrabold text-white bg-sky-600 hover:bg-sky-700 active:scale-95 rounded-xl shadow-md flex items-center gap-1.5 transition-all"
            >
              <Save className="w-4 h-4" />
              설정 저장 완료 (전체 시스템 즉시 적용)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
