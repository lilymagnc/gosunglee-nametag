import React, { useState } from 'react';
import { EventRecord, AttendanceRecord, ExpenseItem, ExpenseCategory } from '../types';
import { X, Printer, FileText, CheckCircle2, Image as ImageIcon, ChevronRight } from 'lucide-react';

interface AuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventRecord;
  attendanceRecords: AttendanceRecord[];
  expenses: ExpenseItem[];
}

export const AuditReportModal: React.FC<AuditReportModalProps> = ({
  isOpen,
  onClose,
  event,
  attendanceRecords,
  expenses,
}) => {
  const [includeReceipts, setIncludeReceipts] = useState<boolean>(true);
  const [auditorName, setAuditorName] = useState<string>('이 종 춘');
  const [presidentName, setPresidentName] = useState<string>('이 성 원');

  if (!isOpen) return null;

  // 1. 수입 계산
  const currentEventAttendance = attendanceRecords.filter(
    (r) => r.eventName === event.name || r.year === event.year
  );
  
  // 일반 회비 (10만원 미만)
  const regularAttendance = currentEventAttendance.filter((r) => (r.feeAmount || 0) < 100000);
  const regularTotal = regularAttendance.reduce((sum, r) => sum + (r.feeAmount || 0), 0);

  // 특별 찬조금/협찬금 (10만원 이상)
  const sponsorAttendance = currentEventAttendance.filter((r) => (r.feeAmount || 0) >= 100000);
  const sponsorTotal = sponsorAttendance.reduce((sum, r) => sum + (r.feeAmount || 0), 0);

  // 수입 총계
  const totalIncome = regularTotal + sponsorTotal;

  // 2. 지출 계산 (비목별 집계)
  const eventExpenses = expenses.filter((e) => e.eventId === event.id);
  const totalExpense = eventExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // 비목별 소계
  const categories: ExpenseCategory[] = [
    '식대·다과',
    '제물·시제',
    '인쇄·홍보',
    '기념품·답례',
    '대관·장소',
    '교통·운임',
    '진행·잡비',
  ];

  const categoryTotals = categories.map((cat) => {
    const items = eventExpenses.filter((e) => e.category === cat);
    const amount = items.reduce((sum, e) => sum + (e.amount || 0), 0);
    return {
      category: cat,
      items,
      amount,
      count: items.length,
      ratio: totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : '0',
    };
  }).filter((c) => c.count > 0 || c.amount > 0);

  // 3. 차인 잔액
  const balance = totalIncome - totalExpense;

  // 인쇄 실행
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

    const receiptItems = eventExpenses.filter((e) => e.receiptImage);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${event.name}_수지결산_감사보고서</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: 'Batang', 'Nanum Myeongjo', serif;
              color: #111111;
              background: #ffffff;
              line-height: 1.5;
              font-size: 13px;
            }
            .page {
              page-break-after: always;
            }
            .title-box {
              text-align: center;
              border-bottom: 2px solid #000000;
              padding-bottom: 12px;
              margin-bottom: 16px;
            }
            .sub-title {
              font-size: 14px;
              letter-spacing: 4px;
              font-weight: bold;
              color: #333333;
            }
            .main-title {
              font-size: 24px;
              font-weight: 900;
              letter-spacing: 2px;
              margin: 6px 0;
            }
            .event-meta {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              margin-top: 8px;
              font-family: sans-serif;
            }
            .section-title {
              font-size: 14px;
              font-weight: bold;
              border-left: 4px solid #111111;
              padding-left: 6px;
              margin: 14px 0 6px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
              margin-bottom: 10px;
            }
            th, td {
              border: 1px solid #333333;
              padding: 5px 8px;
            }
            th {
              background: #f0f0f0;
              font-weight: bold;
              text-align: center;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .summary-box {
              background: #fdfdfd;
              border: 2px solid #111111;
              padding: 10px 14px;
              margin: 12px 0;
              display: flex;
              justify-content: space-around;
              text-align: center;
            }
            .summary-item {
              display: flex;
              flex-direction: column;
            }
            .summary-label {
              font-size: 12px;
              color: #555555;
            }
            .summary-val {
              font-size: 16px;
              font-weight: 900;
              margin-top: 2px;
            }
            .audit-box {
              margin-top: 24px;
              border: 1px solid #777777;
              padding: 14px;
              background: #fafafa;
            }
            .audit-opinion {
              font-size: 12.5px;
              line-height: 1.8;
              text-align: justify;
              margin-bottom: 16px;
            }
            .sign-row {
              display: flex;
              justify-content: space-around;
              margin-top: 20px;
              font-size: 14px;
              font-weight: bold;
            }
            .sign-item {
              display: flex;
              align-items: center;
              gap: 16px;
            }
            .seal-box {
              display: inline-block;
              width: 38px;
              height: 38px;
              border: 1px dashed #999999;
              border-radius: 50%;
              text-align: center;
              line-height: 38px;
              font-size: 11px;
              color: #888888;
            }
            .receipt-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
              margin-top: 14px;
            }
            .receipt-card {
              border: 1px solid #999999;
              padding: 8px;
              page-break-inside: avoid;
            }
            .receipt-img {
              width: 100%;
              max-height: 240px;
              object-fit: contain;
              border: 1px solid #eeeeee;
              margin-top: 6px;
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="title-box">
              <div class="sub-title">固 城 李 氏 서 울 宗 親 會</div>
              <div class="main-title">${event.name} 수지 결산 및 감사 보고서</div>
              <div class="event-meta">
                <span>일시: ${event.date || '당일'}</span>
                <span>장소: ${event.location || '종친회관'}</span>
                <span>보고일: ${new Date().toLocaleDateString('ko-KR')}</span>
              </div>
            </div>

            <!-- 요약 3단 박스 -->
            <div class="summary-box">
              <div class="summary-item">
                <span class="summary-label">총 수입 (A)</span>
                <span class="summary-val" style="color: #0369a1;">${totalIncome.toLocaleString()} 원</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">총 지출 (B)</span>
                <span class="summary-val" style="color: #b91c1c;">${totalExpense.toLocaleString()} 원</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">차인 잔액 (A - B)</span>
                <span class="summary-val" style="color: ${balance >= 0 ? '#15803d' : '#b91c1c'};">
                  ${balance >= 0 ? '+' : ''}${balance.toLocaleString()} 원
                </span>
              </div>
            </div>

            <!-- 1. 수입 명세 -->
            <div class="section-title">Ⅰ. 수입 결산 총괄표</div>
            <table>
              <thead>
                <tr>
                  <th>구분</th>
                  <th>내역 및 인원</th>
                  <th>금액 (원)</th>
                  <th>비고</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="text-center font-bold">정기 회비</td>
                  <td>일반 참석 종친회비 (${regularAttendance.length}명)</td>
                  <td class="text-right font-bold">${regularTotal.toLocaleString()}</td>
                  <td class="text-center">접수처 영수</td>
                </tr>
                <tr>
                  <td class="text-center font-bold">특별 찬조금</td>
                  <td>10만원 이상 고액 협찬 및 임원 찬조 (${sponsorAttendance.length}명)</td>
                  <td class="text-right font-bold">${sponsorTotal.toLocaleString()}</td>
                  <td class="text-center">세로 리본 게시</td>
                </tr>
                <tr style="background: #f8fafc;">
                  <td colspan="2" class="text-center font-bold">수입 합계 (A)</td>
                  <td class="text-right font-bold" style="color: #0369a1;">${totalIncome.toLocaleString()}</td>
                  <td class="text-center">총 ${currentEventAttendance.length}명 납부</td>
                </tr>
              </tbody>
            </table>

            <!-- 2. 지출 비목별 집계 -->
            <div class="section-title">Ⅱ. 지출 비목별 집계표</div>
            <table>
              <thead>
                <tr>
                  <th>비목</th>
                  <th>건수</th>
                  <th>주요 내역</th>
                  <th>금액 (원)</th>
                  <th>점유율</th>
                </tr>
              </thead>
              <tbody>
                ${categoryTotals.map((c) => `
                  <tr>
                    <td class="text-center font-bold">${c.category}</td>
                    <td class="text-center">${c.count}건</td>
                    <td>${c.items.map((i) => i.title).slice(0, 2).join(', ')}${c.count > 2 ? ' 외' : ''}</td>
                    <td class="text-right font-bold">${c.amount.toLocaleString()}</td>
                    <td class="text-center">${c.ratio}%</td>
                  </tr>
                `).join('')}
                <tr style="background: #f8fafc;">
                  <td colspan="3" class="text-center font-bold">지출 합계 (B)</td>
                  <td class="text-right font-bold" style="color: #b91c1c;">${totalExpense.toLocaleString()}</td>
                  <td class="text-center">100.0%</td>
                </tr>
              </tbody>
            </table>

            <!-- 3. 감사의견 및 서명 -->
            <div class="audit-box">
              <div class="audit-opinion">
                본 감사는 <strong>${event.name}</strong>의 수지 결산 보고서 및 관련 영수증·증빙 서류 일체를 
                면밀히 대조·감사한 바, 모든 수입 및 지출이 종친회 회칙과 재정 규정에 의거하여 적법하고 투명하게 
                집행되었음을 확인하고 이에 보고합니다.
              </div>
              <div style="text-align: center; font-size: 12px; color: #444444; margin-bottom: 12px;">
                ${new Date().getFullYear()}년 ${new Date().getMonth() + 1}월 ${new Date().getDate()}일
              </div>
              <div class="sign-row">
                <div class="sign-item">
                  <span>감사 : ${auditorName}</span>
                  <span class="seal-box">인</span>
                </div>
                <div class="sign-item">
                  <span>회장 : ${presidentName}</span>
                  <span class="seal-box">인</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 4. 지출 상세 명세표 (2페이지) -->
          <div class="page">
            <div class="title-box">
              <div class="sub-title">固 城 李 氏 서 울 宗 親 會</div>
              <div class="main-title">[별첨 1] ${event.name} 지출 세부 명세표</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th style="width: 40px;">No</th>
                  <th style="width: 75px;">일자</th>
                  <th style="width: 80px;">비목</th>
                  <th>지출 내역</th>
                  <th style="width: 85px;">금액 (원)</th>
                  <th style="width: 75px;">결제방식</th>
                  <th style="width: 75px;">집행자</th>
                  <th style="width: 60px;">증빙</th>
                </tr>
              </thead>
              <tbody>
                ${eventExpenses.map((e, idx) => `
                  <tr>
                    <td class="text-center">${idx + 1}</td>
                    <td class="text-center">${e.date}</td>
                    <td class="text-center font-bold">${e.category}</td>
                    <td>${e.title}${e.notes ? ` <span style="color:#777; font-size:11px;">(${e.notes})</span>` : ''}</td>
                    <td class="text-right font-bold">${e.amount.toLocaleString()}</td>
                    <td class="text-center">${e.paymentMethod}</td>
                    <td class="text-center">${e.payer}</td>
                    <td class="text-center">${e.receiptImage ? '영수증첨부' : '간이영수'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          ${includeReceipts && receiptItems.length > 0 ? `
            <!-- 5. 영수증 원본 증빙철 (3페이지 이후) -->
            <div class="page">
              <div class="title-box">
                <div class="sub-title">固 城 李 氏 서 울 宗 親 會</div>
                <div class="main-title">[별첨 2] 지출 영수증 원본 증빙철</div>
                <div class="event-meta">
                  <span>행사: ${event.name}</span>
                  <span>증빙 건수: 총 ${receiptItems.length}건</span>
                </div>
              </div>
              <div class="receipt-grid">
                ${receiptItems.map((r, idx) => `
                  <div class="receipt-card">
                    <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:11px; border-bottom:1px solid #ccc; padding-bottom:3px;">
                      <span>증빙 No.${idx + 1} [${r.category}]</span>
                      <span>${r.amount.toLocaleString()}원</span>
                    </div>
                    <div style="font-size:11px; margin-top:2px; color:#333;">${r.title}</div>
                    <img src="${r.receiptImage}" class="receipt-img" alt="영수증" />
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
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
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* 헤더 */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                A4 공식 수지결산 및 감사보고서 인쇄
                <span className="text-xs bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-full">
                  정통 종친회 서식
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                행사: <strong className="text-white">{event.name}</strong> | 수입·지출 대조 및 감사 서명부 일체 출력
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

        {/* 상단 인쇄 옵션 바 */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeReceipts}
                onChange={(e) => setIncludeReceipts(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>영수증 사진 증빙철 함께 인쇄 (별첨)</span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-bold">감사 성명:</span>
              <input
                type="text"
                value={auditorName}
                onChange={(e) => setAuditorName(e.target.value)}
                className="w-20 px-2 py-1 border border-slate-300 rounded font-bold text-center"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-bold">회장 성명:</span>
              <input
                type="text"
                value={presidentName}
                onChange={(e) => setPresidentName(e.target.value)}
                className="w-20 px-2 py-1 border border-slate-300 rounded font-bold text-center"
              />
            </div>
          </div>
        </div>

        {/* 미리보기 본문 (스크롤) */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex justify-center">
          <div className="w-full max-w-[210mm] bg-white p-8 sm:p-12 shadow-lg border border-slate-200 text-slate-900 font-serif space-y-6">
            {/* 타이틀 */}
            <div className="text-center border-b-2 border-slate-900 pb-4">
              <div className="text-sm font-bold tracking-widest text-slate-600">固 城 李 氏 서 울 宗 親 會</div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-wider my-2 text-slate-900">
                {event.name} 수지 결산 및 감사 보고서
              </h1>
              <div className="flex justify-between text-xs font-sans text-slate-500 mt-2">
                <span>일시: {event.date || '당일'}</span>
                <span>장소: {event.location || '종친회관'}</span>
                <span>보고일: {new Date().toLocaleDateString('ko-KR')}</span>
              </div>
            </div>

            {/* 수지 3대 핵심 지표 */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 border-2 border-slate-900 font-sans text-center rounded-lg">
              <div>
                <span className="text-xs text-slate-500 font-bold">총 수입 (A)</span>
                <div className="text-lg font-black text-sky-700 mt-0.5">{totalIncome.toLocaleString()} 원</div>
                <span className="text-[10px] text-slate-400">총 {currentEventAttendance.length}명 납부</span>
              </div>
              <div className="border-x border-slate-200">
                <span className="text-xs text-slate-500 font-bold">총 지출 (B)</span>
                <div className="text-lg font-black text-red-700 mt-0.5">{totalExpense.toLocaleString()} 원</div>
                <span className="text-[10px] text-slate-400">총 {eventExpenses.length}건 집행</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-bold">차인 잔액 (A - B)</span>
                <div className={`text-lg font-black mt-0.5 ${balance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {balance >= 0 ? '+' : ''}{balance.toLocaleString()} 원
                </div>
                <span className="text-[10px] text-slate-400">차기 이월 또는 통장 잔액</span>
              </div>
            </div>

            {/* 수입 총괄표 */}
            <div>
              <h3 className="text-sm font-bold border-l-4 border-slate-900 pl-2 mb-2">Ⅰ. 수입 결산 총괄표</h3>
              <table className="w-full text-xs border-collapse border border-slate-400 font-sans">
                <thead className="bg-slate-100 font-bold">
                  <tr>
                    <th className="border border-slate-300 p-2 text-center">구분</th>
                    <th className="border border-slate-300 p-2 text-left">세부 내역</th>
                    <th className="border border-slate-300 p-2 text-right">금액 (원)</th>
                    <th className="border border-slate-300 p-2 text-center">비고</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2 text-center font-bold">정기 회비</td>
                    <td className="border border-slate-300 p-2">일반 참석 종친회비 ({regularAttendance.length}명)</td>
                    <td className="border border-slate-300 p-2 text-right font-bold">{regularTotal.toLocaleString()}</td>
                    <td className="border border-slate-300 p-2 text-center text-slate-500">접수처 수납</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 text-center font-bold">특별 찬조금</td>
                    <td className="border border-slate-300 p-2">고액 협찬 및 임원 찬조금 ({sponsorAttendance.length}명)</td>
                    <td className="border border-slate-300 p-2 text-right font-bold">{sponsorTotal.toLocaleString()}</td>
                    <td className="border border-slate-300 p-2 text-center text-slate-500">협찬 리본 게시</td>
                  </tr>
                  <tr className="bg-sky-50/50 font-bold">
                    <td colSpan={2} className="border border-slate-300 p-2 text-center">수입 총계 (A)</td>
                    <td className="border border-slate-300 p-2 text-right text-sky-800">{totalIncome.toLocaleString()}</td>
                    <td className="border border-slate-300 p-2 text-center text-slate-500">100% 영수 완료</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 지출 비목별 집계표 */}
            <div>
              <h3 className="text-sm font-bold border-l-4 border-slate-900 pl-2 mb-2">Ⅱ. 지출 비목별 집계표</h3>
              <table className="w-full text-xs border-collapse border border-slate-400 font-sans">
                <thead className="bg-slate-100 font-bold">
                  <tr>
                    <th className="border border-slate-300 p-2 text-center">비목</th>
                    <th className="border border-slate-300 p-2 text-center">건수</th>
                    <th className="border border-slate-300 p-2 text-left">주요 집행 내역</th>
                    <th className="border border-slate-300 p-2 text-right">금액 (원)</th>
                    <th className="border border-slate-300 p-2 text-center">점유율</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryTotals.map((c) => (
                    <tr key={c.category}>
                      <td className="border border-slate-300 p-2 text-center font-bold">{c.category}</td>
                      <td className="border border-slate-300 p-2 text-center">{c.count}건</td>
                      <td className="border border-slate-300 p-2 text-slate-700">
                        {c.items.map((i) => i.title).slice(0, 2).join(', ')}
                        {c.count > 2 ? ' 외' : ''}
                      </td>
                      <td className="border border-slate-300 p-2 text-right font-bold">{c.amount.toLocaleString()}</td>
                      <td className="border border-slate-300 p-2 text-center text-slate-500">{c.ratio}%</td>
                    </tr>
                  ))}
                  <tr className="bg-red-50/50 font-bold">
                    <td colSpan={3} className="border border-slate-300 p-2 text-center">지출 총계 (B)</td>
                    <td className="border border-slate-300 p-2 text-right text-red-800">{totalExpense.toLocaleString()}</td>
                    <td className="border border-slate-300 p-2 text-center text-slate-500">100.0%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 감사 의견서 및 서명란 */}
            <div className="p-5 bg-slate-50 border border-slate-300 rounded-lg text-xs leading-relaxed space-y-4">
              <div className="font-serif text-slate-800 text-justify">
                본 감사는 <strong>{event.name}</strong>의 수지 결산 보고서 및 관련 영수증·증빙 서류 일체를 
                면밀히 대조·감사한 바, 모든 수입 및 지출이 종친회 회칙과 재정 규정에 의거하여 적법하고 투명하게 
                집행되었음을 확인하고 이에 보고합니다.
              </div>
              <div className="text-center font-sans text-slate-500">
                {new Date().getFullYear()}년 {new Date().getMonth() + 1}월 {new Date().getDate()}일
              </div>
              <div className="flex justify-around items-center pt-2 font-bold font-sans text-sm">
                <div className="flex items-center gap-3">
                  <span>감사 : {auditorName}</span>
                  <span className="w-8 h-8 rounded-full border border-dashed border-slate-400 flex items-center justify-center text-[10px] text-slate-400">
                    인
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span>회장 : {presidentName}</span>
                  <span className="w-8 h-8 rounded-full border border-dashed border-slate-400 flex items-center justify-center text-[10px] text-slate-400">
                    인
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 버튼 바 */}
        <div className="px-6 py-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            총 지출 {eventExpenses.length}건 중 영수증 증빙 {eventExpenses.filter((e) => e.receiptImage).length}건 첨부됨
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-sm rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>A4 공식 감사보고서 인쇄하기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
