import React, { useState } from 'react';
import { AttendanceRecord, LabelSettings, PaperSize } from '../types';
import { LabelCard } from './LabelCard';
import { PrintSheetFormtec } from './PrintSheetFormtec';
import { PrintSingleLabel } from './PrintSingleLabel';
import { Printer, Sliders, CheckSquare, Square, Trash2, RotateCcw, AlertCircle, Check } from 'lucide-react';

interface PrintCenterProps {
  queue: AttendanceRecord[];
  allRecords: AttendanceRecord[];
  settings: LabelSettings;
  onUpdateSettings: (settings: LabelSettings) => void;
  onRemoveFromQueue: (id: string) => void;
  onClearQueue: () => void;
  onMarkPrinted: (ids: string[]) => void;
}

export const PrintCenter: React.FC<PrintCenterProps> = ({
  queue,
  allRecords,
  settings,
  onUpdateSettings,
  onRemoveFromQueue,
  onClearQueue,
  onMarkPrinted,
}) => {
  const [sourceType, setSourceType] = useState<'queue' | 'allRecords'>(
    queue.length > 0 ? 'queue' : 'allRecords'
  );
  const activeList = sourceType === 'queue' ? queue : allRecords;

  const [selectedIds, setSelectedIds] = useState<string[]>(activeList.map(q => q.id));
  const [showSettings, setShowSettings] = useState(false);

  // 현재 인쇄할 대상 목록
  const printItems = activeList.filter(item => selectedIds.includes(item.id));

  const switchSource = (type: 'queue' | 'allRecords') => {
    setSourceType(type);
    const list = type === 'queue' ? queue : allRecords;
    setSelectedIds(list.map(i => i.id));
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedIds.length === activeList.length && activeList.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(activeList.map(q => q.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handlePrint = () => {
    if (printItems.length === 0) {
      alert('인쇄할 명찰을 최소 1개 이상 선택해 주세요.');
      return;
    }

    // 인쇄 실행
    window.print();

    // 인쇄 완료 처리
    onMarkPrinted(selectedIds);
  };

  return (
    <div className="space-y-6">
      {/* 상단 컨트롤 바 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Printer className="w-6 h-6 text-sky-600" />
              명찰 라벨 인쇄 센터
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              폼텍 8칸(A4 2x4), 90x60mm, 80x60mm 라벨지 규격을 지원하며 시작 칸을 자유롭게 지정할 수 있습니다.
            </p>
          </div>

          {/* 주요 액션 버튼 */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 ${
                showSettings
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Sliders className="w-4 h-4" />
              용지 및 여백 설정
            </button>

            <button
              onClick={handlePrint}
              disabled={printItems.length === 0}
              className="px-6 py-2.5 text-sm font-extrabold text-white bg-sky-600 hover:bg-sky-700 active:scale-95 disabled:bg-slate-300 rounded-xl shadow-md flex items-center gap-2 transition-all"
            >
              <Printer className="w-5 h-5" />
              선택한 {printItems.length}명 라벨 인쇄하기
            </button>
          </div>
        </div>

        {/* 용지 규격 및 감열 모드 선택 */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">용지 규격:</span>
              <div className="inline-flex p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => onUpdateSettings({ ...settings, paperSize: 'formtec_3114', thermalMode: 'color' })}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    settings.paperSize === 'formtec_3114'
                      ? 'bg-white text-sky-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  폼텍 8칸 (3114 규격, A4)
                </button>
                <button
                  onClick={() => onUpdateSettings({ ...settings, paperSize: 'label_90x60', thermalMode: settings.thermalMode === 'color' ? 'outline' : settings.thermalMode })}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    settings.paperSize === 'label_90x60'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  90 × 60 mm 라벨지
                </button>
                <button
                  onClick={() => onUpdateSettings({ ...settings, paperSize: 'label_80x60', thermalMode: settings.thermalMode === 'color' ? 'outline' : settings.thermalMode })}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    settings.paperSize === 'label_80x60'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  80 × 60 mm 라벨지
                </button>
              </div>
            </div>

            {/* 인쇄 스타일(컬러 / 감열 흑백) 선택 */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">인쇄 스타일:</span>
              <div className="inline-flex p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => onUpdateSettings({ ...settings, thermalMode: 'color' })}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    (settings.thermalMode || 'color') === 'color'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🔵 컬러(하늘색)
                </button>
                <button
                  onClick={() => onUpdateSettings({ ...settings, thermalMode: 'outline' })}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    settings.thermalMode === 'outline'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="파란 바탕 없이 검정 실선으로 감열지 100% 최적화 출력"
                >
                  🖨️ 감열 흑백(선명)
                </button>
                <button
                  onClick={() => onUpdateSettings({ ...settings, thermalMode: 'inverted' })}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    settings.thermalMode === 'inverted'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="검정 바 + 흰 글씨 반전 출력"
                >
                  ⬛ 감열 블랙반전
                </button>
                <button
                  onClick={() => onUpdateSettings({ ...settings, thermalMode: 'textOnly' })}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    settings.thermalMode === 'textOnly'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="이미 종친회 로고가 인쇄된 사전인쇄 라벨지용"
                >
                  📄 양식지(글자만)
                </button>
              </div>
            </div>
          </div>

          {/* 폼텍 8칸 시작 위치 지정 컨트롤러 */}
          {settings.paperSize === 'formtec_3114' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">
                시작 위치 (이미 쓴 라벨지 재활용):
              </span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((slot) => (
                  <button
                    key={slot}
                    onClick={() => onUpdateSettings({ ...settings, formtecStartSlot: slot })}
                    className={`px-2 h-7 text-xs font-black rounded-lg border transition-all ${
                      settings.formtecStartSlot === slot
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm ring-2 ring-sky-300'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                    title={`${slot}번 칸부터 인쇄 시작`}
                  >
                    {slot}번
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 상세 여백 및 옵션 설정 패널 */}
        {showSettings && (
          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-150">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                하단 문구 (기본: 固 城 李 氏 서 울 宗 親 會)
              </label>
              <input
                type="text"
                value={settings.footerText}
                onChange={(e) => onUpdateSettings({ ...settings, footerText: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                상하 여백 미세조정: {settings.offsetYmm}mm
              </label>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.5"
                value={settings.offsetYmm}
                onChange={(e) => onUpdateSettings({ ...settings, offsetYmm: parseFloat(e.target.value) })}
                className="w-full accent-sky-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>-10mm (위로)</span>
                <span>0mm</span>
                <span>+10mm (아래로)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                좌우 여백 미세조정: {settings.offsetXmm}mm
              </label>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.5"
                value={settings.offsetXmm}
                onChange={(e) => onUpdateSettings({ ...settings, offsetXmm: parseFloat(e.target.value) })}
                className="w-full accent-sky-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>-10mm (좌측)</span>
                <span>0mm</span>
                <span>+10mm (우측)</span>
              </div>
            </div>
          </div>
        )}

        {/* 인쇄 브라우저 설정 안내 팁 */}
        <div className="mt-3.5 p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>인쇄 시 권장 브라우저 설정:</strong> 인쇄 창(Ctrl+P)에서 <strong>[설정 더보기]</strong>를 누른 후
            <strong> [여백: 없음 (None)]</strong> 및 <strong>[배경 그래픽 포함]</strong>을 반드시 체크해야 하늘색 바와 여백이 사진처럼 완벽하게 출력됩니다.
          </div>
        </div>
      </div>

      {/* 인쇄 대기열 목록 & 선택 영역 */}
      {/* 인쇄 대상 목록 & 선택 영역 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* 데이터 출처 탭 (대기열 vs 당일 접수자 전체) */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => switchSource('queue')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  sourceType === 'queue'
                    ? 'bg-white text-sky-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                인쇄 대기열 ({queue.length}명)
              </button>
              <button
                type="button"
                onClick={() => switchSource('allRecords')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  sourceType === 'allRecords'
                    ? 'bg-white text-sky-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                당일 접수자 전체 ({allRecords.length}명)
              </button>
            </div>

            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 ml-1 px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 transition-all"
            >
              {selectedIds.length === activeList.length && activeList.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-sky-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              전체 선택 ({selectedIds.length} / {activeList.length})
            </button>
          </div>

          {sourceType === 'queue' && queue.length > 0 && (
            <button
              onClick={onClearQueue}
              className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              대기열 비우기
            </button>
          )}
        </div>

        {activeList.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <Printer className="w-12 h-12 mx-auto text-slate-300 stroke-[1.5]" />
            <p className="text-sm font-semibold">
              {sourceType === 'queue'
                ? '인쇄 대기열에 담긴 명찰이 없습니다.'
                : '오늘 접수된 회원이 아직 없습니다.'}
            </p>
            <p className="text-xs text-slate-400">
              [현장 접수] 탭에서 원하는 종친의 체크박스를 눌러 바로 일괄 인쇄하거나 대기열에 담으실 수 있습니다.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {activeList.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={`relative p-3 rounded-xl border-2 transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/40 shadow-sm'
                      : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                  }`}
                >
                  {sourceType === 'queue' && (
                    <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveFromQueue(item.id);
                        }}
                        className="p-1 text-slate-400 hover:text-red-500 rounded-md"
                        title="대기열에서 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border ${
                        isSelected
                          ? 'bg-sky-600 border-sky-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      {item.name} ({item.branch})
                    </span>
                  </div>

                  {/* 작은 라벨 미리보기 */}
                  <div className="w-full bg-slate-100 py-1.5 px-0.5 rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden h-[180px]">
                    <div className="transform scale-[0.72] origin-center shrink-0">
                      <LabelCard
                        name={item.name}
                        branch={item.branch}
                        generation={item.generation}
                        role={item.role}
                        settings={settings}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 숨겨진 전용 인쇄 영역 (화면에는 안 보이고, window.print() 실행 시에만 출력됨) */}
      <div className="hidden print:block print:w-full">
        {settings.paperSize === 'formtec_3114' ? (
          <PrintSheetFormtec items={printItems} settings={settings} />
        ) : (
          <PrintSingleLabel items={printItems} settings={settings} />
        )}
      </div>
    </div>
  );
};
