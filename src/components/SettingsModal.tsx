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
  Sparkles,
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
  const currentYear = new Date().getFullYear();
  const [eventYear, setEventYear] = useState<number>(settings.eventYear || currentYear);
  const [eventName, setEventName] = useState(
    settings.eventName || `${settings.eventYear || currentYear}년 정기총회 및 시제`
  );
  const [footerType, setFooterType] = useState<'preset' | 'eventName' | 'none'>(
    settings.footerType || (settings.showFooter === false ? 'none' : 'preset')
  );
  const [footerText, setFooterText] = useState(settings.footerText || '固 城 李 氏 서 울 宗 親 會');
  const [paperSize, setPaperSize] = useState(settings.paperSize || 'formtec_3114');
  const [thermalMode, setThermalMode] = useState(settings.thermalMode || 'color');
  const [fontFamily, setFontFamily] = useState(settings.fontFamily || 'gungsuh');
  const [headerBgColor, setHeaderBgColor] = useState(settings.headerBgColor || '#8cc0ec');
  const [showWatermark, setShowWatermark] = useState(settings.showWatermark !== false);
  const [isTravelFeeEvent, setIsTravelFeeEvent] = useState<boolean>(settings.isTravelFeeEvent || false);
  const [travelFeeAmount, setTravelFeeAmount] = useState<number>(settings.travelFeeAmount || 50000);

  useEffect(() => {
    const yr = settings.eventYear || currentYear;
    setEventYear(yr);
    setEventName(settings.eventName || `${yr}년 정기총회 및 시제`);
    setFooterType(settings.footerType || (settings.showFooter === false ? 'none' : 'preset'));
    setFooterText(settings.footerText || '固 城 李 氏 서 울 宗 親 會');
    setPaperSize(settings.paperSize || 'formtec_3114');
    setThermalMode(settings.thermalMode || 'color');
    setFontFamily(settings.fontFamily || 'gungsuh');
    setHeaderBgColor(settings.headerBgColor || '#8cc0ec');
    setShowWatermark(settings.showWatermark !== false);
    setIsTravelFeeEvent(settings.isTravelFeeEvent || false);
    setTravelFeeAmount(settings.travelFeeAmount || 50000);
  }, [settings, isOpen]);

  const handleSave = () => {
    const finalYear = Number(eventYear) || currentYear;
    const updated: LabelSettings = {
      ...settings,
      eventName: eventName.trim() || `${finalYear}년 정기총회 및 시제`,
      eventYear: finalYear,
      footerText: footerText.trim() || '固 城 李 氏 서 울 宗 親 會',
      showFooter: footerType !== 'none',
      footerType,
      paperSize,
      thermalMode,
      fontFamily,
      headerBgColor,
      showWatermark,
      isTravelFeeEvent,
      travelFeeAmount: Number(travelFeeAmount) || 50000,
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
    { title: '용헌공파종중 정기총회 및 시제', desc: '11월 용헌공파 총회/시제 (교통비 지원)' },
    { title: '정기총회 및 시제', desc: '서울종친회 대표 메인 행사' },
    { title: '가을 정기시제', desc: '역대 이력 실제 행사 (추향제)' },
    { title: '정기총회', desc: '역대 이력 실제 행사' },
    { title: '봄 정기시제', desc: '춘향제' },
    { title: '추향 정기시제', desc: '추계 정기시제' },
    { title: '대종회 정기총회', desc: '고성이씨 대종회' },
    { title: '신년하례회', desc: '연초 하례회' },
  ];

  // 하단 문구 프리셋 (모든 종파 및 대표 종친회/종중/행사명 종합)
  const footerPresetGroups = [
    {
      group: '⭐ 행사명 및 대표 종중/종친회',
      items: [
        { label: `[현재 공식 행사명] ${eventName}`, text: eventName },
        { label: '용헌종중 (한자) - 固 城 李 氏 容 軒 宗 中', text: '固 城 李 氏 容 軒 宗 中' },
        { label: '용헌종중 (국한문) - 고 성 이 씨 용 헌 宗 中', text: '고 성 이 씨 용 헌 宗 中' },
        { label: '용헌공파 (한자) - 固 城 李 氏 容 軒 公 派', text: '固 城 李 氏 容 軒 公 派' },
        { label: '용헌공파 (한글) - 고 성 이 씨 용 헌 공 파', text: '고 성 이 씨 용 헌 공 파' },
        { label: '서울종친회 (한자 정통) - 固 城 李 氏 서 울 宗 親 會', text: '固 城 李 氏 서 울 宗 親 會' },
        { label: '서울종친회 (한글 표준) - 고 성 이 씨 서 울 종 친 회', text: '고 성 이 씨 서 울 종 친 회' },
        { label: '대종회 (한자) - 固 城 李 氏 大 宗 會', text: '固 城 李 氏 大 宗 會' },
        { label: '대종회 (한글) - 고 성 이 씨 대 종 회', text: '고 성 이 씨 대 종 회' },
        { label: '광모재 시제 (한자) - 廣 牟 齋 時 祭', text: '廣 牟 齋 時 祭' },
        { label: '광모재 시제 (한글) - 광 모 재 시 제', text: '광 모 재 시 제' },
      ],
    },
    {
      group: '📜 고성이씨 주요 공파 (한자 정통)',
      items: [
        { label: '참판공파 - 固 城 李 氏 參 判 公 派', text: '固 城 李 氏 參 判 公 派' },
        { label: '둔재공파 - 固 城 李 氏 遁 齋 公 派', text: '固 城 李 氏 遁 齋 公 派' },
        { label: '사암공파 - 固 城 李 氏 思 菴 公 派', text: '固 城 李 氏 思 菴 公 派' },
        { label: '호군공파 - 固 城 李 氏 湖 軍 公 派', text: '固 城 李 氏 湖 軍 公 派' },
        { label: '도촌공파 - 固 城 李 氏 桃 村 公 派', text: '固 城 李 氏 桃 村 公 派' },
        { label: '은암공파 - 固 城 李 氏 隱 庵 公 派', text: '固 城 李 氏 隱 庵 公 派' },
        { label: '좌윤공파 - 固 城 李 氏 左 尹 公 派', text: '固 城 李 氏 左 尹 公 派' },
        { label: '병사공파 - 固 城 李 氏 兵 使 公 派', text: '固 城 李 氏 兵 使 公 派' },
        { label: '안정공파 - 固 城 李 氏 安 靖 公 派', text: '固 城 李 氏 安 靖 公 派' },
        { label: '동주공파 - 固 城 李 氏 東 洲 公 派', text: '固 城 李 氏 東 洲 公 派' },
        { label: '판서공파 - 固 城 李 氏 判 書 公 派', text: '固 城 李 氏 判 書 公 派' },
        { label: '문용공파 - 固 城 李 氏 文 容 公 派', text: '固 城 李 氏 文 容 公 派' },
        { label: '장령공파 - 固 城 李 氏 掌 令 公 派', text: '固 城 李 氏 掌 令 公 派' },
        { label: '사직공파 - 固 城 李 氏 司 直 公 派', text: '固 城 李 氏 司 直 公 派' },
        { label: '감찰공파 - 固 城 李 氏 監 察 公 派', text: '固 城 李 氏 監 察 公 派' },
        { label: '현령공파 - 固 城 李 氏 縣 令 公 派', text: '固 城 李 氏 縣 令 公 派' },
        { label: '군수공파 - 固 城 李 氏 郡 守 公 派', text: '固 城 李 氏 郡 守 公 派' },
        { label: '목사공파 - 固 城 李 氏 牧 使 公 派', text: '固 城 李 氏 牧 使 公 派' },
        { label: '첨정공파 - 固 城 李 氏 僉 正 公 派', text: '固 城 李 氏 僉 正 公 派' },
        { label: '참봉공파 - 固 城 李 氏 參 奉 公 派', text: '固 城 李 氏 參 奉 公 派' },
      ],
    },
    {
      group: '🇰🇷 고성이씨 주요 공파 (한글)',
      items: [
        { label: '참판공파 - 고 성 이 씨 참 판 공 파', text: '고 성 이 씨 참 판 공 파' },
        { label: '둔재공파 - 고 성 이 씨 둔 재 공 파', text: '고 성 이 씨 둔 재 공 파' },
        { label: '사암공파 - 고 성 이 씨 사 암 공 파', text: '고 성 이 씨 사 암 공 파' },
        { label: '호군공파 - 고 성 이 씨 호 군 공 파', text: '고 성 이 씨 호 군 공 파' },
        { label: '도촌공파 - 고 성 이 씨 도 촌 공 파', text: '고 성 이 씨 도 촌 공 파' },
        { label: '은암공파 - 고 성 이 씨 은 암 공 파', text: '고 성 이 씨 은 암 공 파' },
        { label: '좌윤공파 - 고 성 이 씨 좌 윤 공 파', text: '고 성 이 씨 좌 윤 공 파' },
        { label: '병사공파 - 고 성 이 씨 병 사 공 파', text: '고 성 이 씨 병 사 공 파' },
        { label: '안정공파 - 고 성 이 씨 안 정 공 파', text: '고 성 이 씨 안 정 공 파' },
        { label: '동주공파 - 고 성 이 씨 동 주 공 파', text: '고 성 이 씨 동 주 공 파' },
        { label: '판서공파 - 고 성 이 씨 판 서 공 파', text: '고 성 이 씨 판 서 공 파' },
        { label: '문용공파 - 고 성 이 씨 문 용 공 파', text: '고 성 이 씨 문 용 공 파' },
      ],
    },
  ];

  const colorPresets = [
    { label: '실물 연하늘색', color: '#8cc0ec' },
    { label: '스카이블루', color: '#38bdf8' },
    { label: '로열블루', color: '#2563eb' },
    { label: '에메랄드그린', color: '#059669' },
    { label: '클래식그레이', color: '#e2e8f0' },
  ];

  if (!isOpen) return null;

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

          {/* 1-2. 🚗 참석 종친 교통비(거마비) 지급 행사 모드 */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              isTravelFeeEvent
                ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-200'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🚗</span>
                <div>
                  <div className="text-xs font-black text-slate-900 flex items-center gap-2">
                    <span>참석 종친 교통비(거마비) 지급 행사 모드</span>
                    {isTravelFeeEvent ? (
                      <span className="text-[10px] bg-amber-600 text-white font-extrabold px-2 py-0.5 rounded-full shadow-xs">
                        활성화됨 (회비 0원)
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-1.5 py-0.5 rounded">
                        일반 행사
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    11월 용헌문중 시제처럼 오신 분들께 여비를 드리는 행사일 때 켜주세요. 접수 시 <strong>회비가 0원으로 자동 처리</strong>되고 1인당 교통비 지급 및 <strong>A4 수령 서명대장</strong>이 연동됩니다.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                <input
                  type="checkbox"
                  checked={isTravelFeeEvent}
                  onChange={(e) => setIsTravelFeeEvent(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {isTravelFeeEvent && (
              <div className="mt-3 pt-3 border-t border-amber-200/80 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-950">1인당 교통비 지급 기준액:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="10000"
                      value={travelFeeAmount}
                      onChange={(e) => setTravelFeeAmount(Number(e.target.value) || 0)}
                      className="w-28 px-2.5 py-1 text-xs font-black text-right border border-amber-400 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                    <span className="text-xs font-bold text-amber-900">원</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {[30000, 50000, 100000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTravelFeeAmount(amt)}
                      className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer border ${
                        travelFeeAmount === amt
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                      }`}
                    >
                      {amt / 10000}만원
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. 명찰 하단 문구 인쇄 방식 선택 */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>2. 명찰 하단 박스에 무엇을 인쇄할까요?</span>
            </div>

            {/* 3대 선택 옵션 (라디오 카드) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* 옵션 1: 공식 행사명 인쇄 */}
              <button
                type="button"
                onClick={() => setFooterType('eventName')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  footerType === 'eventName'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-extrabold text-xs">① 공식 행사명 인쇄</span>
                  <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] ${
                    footerType === 'eventName' ? 'border-white bg-white text-emerald-700 font-black' : 'border-slate-400'
                  }`}>
                    {footerType === 'eventName' && '✓'}
                  </span>
                </div>
                <p className={`text-[10px] leading-tight ${footerType === 'eventName' ? 'text-emerald-100' : 'text-slate-500'}`}>
                  1번의 행사명({eventName})을 명찰 하단에 자동 출력
                </p>
              </button>

              {/* 옵션 2: 종친회 / 종중 / 공파명 인쇄 */}
              <button
                type="button"
                onClick={() => setFooterType('preset')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  footerType === 'preset'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-extrabold text-xs">② 종친회·종중·공파명</span>
                  <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] ${
                    footerType === 'preset' ? 'border-white bg-white text-emerald-700 font-black' : 'border-slate-400'
                  }`}>
                    {footerType === 'preset' && '✓'}
                  </span>
                </div>
                <p className={`text-[10px] leading-tight ${footerType === 'preset' ? 'text-emerald-100' : 'text-slate-500'}`}>
                  서울종친회, 용헌종중, 대종회 등 선택 출력
                </p>
              </button>

              {/* 옵션 3: 하단 문구 없음 (공백) */}
              <button
                type="button"
                onClick={() => setFooterType('none')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  footerType === 'none'
                    ? 'bg-slate-800 text-white border-slate-800 shadow-md ring-2 ring-slate-400'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-extrabold text-xs">③ 하단 문구 없음 (공백)</span>
                  <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] ${
                    footerType === 'none' ? 'border-white bg-white text-slate-900 font-black' : 'border-slate-400'
                  }`}>
                    {footerType === 'none' && '✓'}
                  </span>
                </div>
                <p className={`text-[10px] leading-tight ${footerType === 'none' ? 'text-slate-300' : 'text-slate-500'}`}>
                  하단 박스를 숨기고 깔끔하게 인쇄
                </p>
              </button>
            </div>

            {/* 세부 옵션: 옵션 1 (공식 행사명) 선택 시 */}
            {footerType === 'eventName' && (
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-300 space-y-1 animate-in fade-in">
                <label className="block text-emerald-950 font-bold text-[11px]">명찰 하단에 인쇄될 공식 행사명:</label>
                <div className="font-black text-emerald-900 text-sm tracking-wider px-3 py-1.5 bg-white rounded border border-emerald-200">
                  {eventName}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  💡 행사명을 변경하시려면 상단 <strong>1. 공식 행사명 및 기준 연도 설정</strong>에서 수정하시면 여기에 자동 반영됩니다.
                </p>
              </div>
            )}

            {/* 세부 옵션: 옵션 2 (종친회/종중/공파) 선택 시 */}
            {footerType === 'preset' && (
              <div className="p-3 bg-white rounded-lg border border-emerald-300 space-y-2.5 animate-in fade-in">
                <div>
                  <label className="block text-slate-600 font-bold text-[11px] mb-1">
                    종파 / 종중 / 총회 드롭다운 선택
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) setFooterText(e.target.value);
                    }}
                    value={footerPresetGroups.some(g => g.items.some(i => i.text === footerText)) ? footerText : ''}
                    className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="">-- 종파 / 종중 / 총회 선택 --</option>
                    {footerPresetGroups.map((g) => (
                      <optgroup key={g.group} label={g.group}>
                        {g.items.map((item) => (
                          <option key={item.label} value={item.text}>
                            {item.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold text-[11px] mb-1">하단 인쇄 텍스트 (직접 수정 가능)</label>
                  <input
                    type="text"
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    placeholder="예: 固 城 李 氏 서 울 宗 親 會"
                    className="w-full px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white tracking-widest"
                  />
                </div>
              </div>
            )}

            {/* 세부 옵션: 옵션 3 (없음) 선택 시 */}
            {footerType === 'none' && (
              <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 text-[11px] text-slate-600">
                명찰 하단 박스가 출력되지 않으며, 성명 영역이 넓고 시원하게 인쇄됩니다.
              </div>
            )}
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

          {/* 5. 고성이씨 공식 문양 워터마크 배경 */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>5. 고성이씨 공식 문양 워터마크 (성명 뒷배경)</span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-bold">
                <input
                  type="checkbox"
                  checked={showWatermark}
                  onChange={(e) => setShowWatermark(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                />
                문양 워터마크 인쇄 켜기
              </label>
            </div>
            <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200">
              <div className="w-12 h-12 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0 overflow-hidden p-1">
                <img
                  src="/logo.png"
                  alt="고성이씨 문양 미리보기"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-slate-600 space-y-0.5">
                <p className="font-semibold text-slate-800">
                  고성이씨 공식 문양(오얏꽃/태극)을 명찰 성명 뒷배경에 은은하게(투명도 10%) 인쇄합니다.
                </p>
                <p className="text-[11px] text-slate-500">
                  💡 <strong>컬러 폼텍 용지</strong> 출력 시 고급스럽고 품격 있게 표현되며, <strong>감열 모드</strong>에서는 지저분한 점묘(디더링) 노이즈를 방지하기 위해 자동으로 숨김 처리됩니다.
                </p>
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
