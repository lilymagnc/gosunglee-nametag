import React, { useState, useMemo } from 'react';
import { EventRecord, AttendanceRecord, ExpenseItem, ExpenseCategory } from '../types';
import {
  X,
  Printer,
  FileText,
  Copy,
  Check,
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  MapPin,
  Share2,
  Sparkles,
  Award,
} from 'lucide-react';

interface EventSummaryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventRecord;
  attendanceRecords: AttendanceRecord[];
  expenses: ExpenseItem[];
}

export const EventSummaryReportModal: React.FC<EventSummaryReportModalProps> = ({
  isOpen,
  onClose,
  event,
  attendanceRecords,
  expenses,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const presidentName = event.presidentName || '이 기 석';

  // 1. 해당 행사 출석 데이터 집계
  const currentEventAttendance = useMemo(() => {
    return attendanceRecords.filter(
      (r) => r.eventName === event.name || r.year === event.year
    );
  }, [attendanceRecords, event]);

  const totalAttendees = currentEventAttendance.length;

  // 일반 회비 (< 100,000)
  const regularAttendance = currentEventAttendance.filter((r) => (r.feeAmount || 0) < 100000);
  const regularTotal = regularAttendance.reduce((sum, r) => sum + (r.feeAmount || 0), 0);

  // 특별 찬조금 (>= 100,000)
  const sponsorAttendance = currentEventAttendance.filter((r) => (r.feeAmount || 0) >= 100000);
  const sponsorTotal = sponsorAttendance.reduce((sum, r) => sum + (r.feeAmount || 0), 0);

  // 수입 총계
  const totalIncome = regularTotal + sponsorTotal;

  // 2. 지출 데이터 집계
  const eventExpenses = useMemo(() => {
    return expenses.filter((e) => e.eventId === event.id);
  }, [expenses, event.id]);

  // 교통비 지급 행사일 때 자동 연동되는 교통비 합계
  const autoTravelFeeCount = useMemo(() => {
    if (!event.isTravelFeeEvent) return 0;
    return currentEventAttendance.filter((r) => r.travelFeePaid !== false).length;
  }, [event.isTravelFeeEvent, currentEventAttendance]);

  const autoTravelFeeAmount = autoTravelFeeCount * (event.travelFeeAmount || 50000);

  const totalExpense = eventExpenses.reduce((sum, e) => sum + (e.amount || 0), 0) + autoTravelFeeAmount;
  const balance = totalIncome - totalExpense;

  // 비목별 지출 집계
  const categories: ExpenseCategory[] = [
    '식대·다과',
    '제물·시제',
    '인쇄·홍보',
    '기념품·답례',
    '대관·장소',
    '교통·운임',
    '진행·잡비',
  ];

  const categoryTotals = categories
    .map((cat) => {
      const items = eventExpenses.filter((e) => e.category === cat);
      let amount = items.reduce((sum, e) => sum + (e.amount || 0), 0);
      let count = items.length;
      if (cat === '교통·운임' && autoTravelFeeAmount > 0) {
        amount += autoTravelFeeAmount;
        count += 1;
      }
      return {
        category: cat,
        items,
        amount,
        count,
        ratio: totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : '0',
      };
    })
    .filter((c) => c.count > 0 || c.amount > 0);

  // 3. 파별(문파별) 참석 통계
  const branchStats = useMemo(() => {
    const counts: Record<string, number> = {};
    currentEventAttendance.forEach((r) => {
      const b = r.branch || '기타';
      counts[b] = (counts[b] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([branch, count]) => ({
        branch,
        count,
        ratio: totalAttendees > 0 ? ((count / totalAttendees) * 100).toFixed(1) : '0',
      }))
      .sort((a, b) => b.count - a.count);
  }, [currentEventAttendance, totalAttendees]);

  // 4. 세수(항렬)별 참석 통계
  const genStats = useMemo(() => {
    const counts: Record<number, number> = {};
    currentEventAttendance.forEach((r) => {
      if (r.generation) {
        counts[r.generation] = (counts[r.generation] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([gen, count]) => ({
        generation: Number(gen),
        count,
      }))
      .sort((a, b) => a.generation - b.generation);
  }, [currentEventAttendance]);

  // 5. 특별 찬조금 협찬자 명단 (금액순 정렬)
  const sponsors = useMemo(() => {
    return [...sponsorAttendance].sort((a, b) => (b.feeAmount || 0) - (a.feeAmount || 0));
  }, [sponsorAttendance]);

  if (!isOpen) return null;

  // 카카오톡 단체방 공지문 자동 생성
  const generateKakaoText = () => {
    const topBranches = branchStats
      .slice(0, 5)
      .map((b) => `  - ${b.branch}: ${b.count}명 (${b.ratio}%)`)
      .join('\n');

    const sponsorListText = sponsors.length > 0
      ? sponsors
          .map(
            (s) =>
              `  - ${s.name}${s.branch ? `(${s.branch} ${s.generation || ''}세)` : ''}: ${(s.feeAmount || 0).toLocaleString()}원`
          )
          .join('\n')
      : '  - 등록된 특별 찬조 내역 없음';

    return `[고성이씨 서울종친회 행사 결과 보고]
━━━━━━━━━━━━━━━━━━━━
■ 행사명: ${event.name}
■ 일시: ${event.date || '당일'}
■ 장소: ${event.location || '서울 종친회관 대강당'}
━━━━━━━━━━━━━━━━━━━━

1. 종친 참석 현황
- 총 참석: ${totalAttendees}명
- 주요 문파별 참석:
${topBranches}${branchStats.length > 5 ? `\n  외 ${branchStats.length - 5}개 파` : ''}

2. 행사 수지 결산 총괄
- 총 수입: ${totalIncome.toLocaleString()}원
  (${event.isTravelFeeEvent ? '회비 면제' : `일반회비: ${regularTotal.toLocaleString()}원`} / 특별찬조: ${sponsorTotal.toLocaleString()}원)
- 총 지출: ${totalExpense.toLocaleString()}원${autoTravelFeeAmount > 0 ? ` (교통비 ${autoTravelFeeCount}명 ${autoTravelFeeAmount.toLocaleString()}원 포함)` : ` (총 ${eventExpenses.length}건)`}
- 차인 잔액: ${balance >= 0 ? '+' : ''}${balance.toLocaleString()}원 (차기 이월)

3. 특별 찬조금 협찬 종친 명단 (존칭 생략)
${sponsorListText}

일가 종친 여러분의 숭조애종 정신과 아낌없는 성원에 깊이 감사드립니다.

고성이씨 서울종친회
회장 ${presidentName} 배상`;
  };

  const handleCopyKakao = async () => {
    try {
      const text = generateKakaoText();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy', e);
      alert('클립보드 복사에 실패했습니다.');
    }
  };

  // A4 정규 인쇄 실행
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

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${event.name}_행사_종합_결과보고서</title>
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
              margin-bottom: 14px;
            }
            .sub-title {
              font-size: 14px;
              letter-spacing: 4px;
              font-weight: bold;
              color: #333333;
            }
            .main-title {
              font-size: 21px;
              font-weight: 900;
              letter-spacing: -0.5px;
              margin: 6px 0;
              white-space: nowrap;
            }
            .event-meta {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              margin-top: 8px;
              font-family: sans-serif;
            }
            .kpi-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px;
              margin: 12px 0 16px 0;
            }
            .kpi-card {
              border: 1.5px solid #222222;
              background: #fcfcfc;
              padding: 8px 10px;
              text-align: center;
              font-family: sans-serif;
            }
            .kpi-label {
              font-size: 11px;
              color: #555555;
              font-weight: bold;
              display: block;
            }
            .kpi-val {
              font-size: 15px;
              font-weight: 900;
              margin-top: 3px;
              display: block;
            }
            .section-title {
              font-size: 13.5px;
              font-weight: bold;
              border-left: 4px solid #111111;
              padding-left: 6px;
              margin: 14px 0 6px 0;
              font-family: sans-serif;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11.5px;
              margin-bottom: 10px;
              font-family: sans-serif;
            }
            th, td {
              border: 1px solid #444444;
              padding: 4.5px 7px;
            }
            th {
              background: #f0f0f0;
              font-weight: bold;
              text-align: center;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .sponsor-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 6px;
              font-family: sans-serif;
              font-size: 11px;
              margin-top: 6px;
            }
            .sponsor-item {
              border: 1px solid #bbbbbb;
              padding: 4px 6px;
              display: flex;
              justify-content: space-between;
              background: #fafafa;
            }
            .sign-box {
              margin-top: 24px;
              border-top: 2px solid #222222;
              padding-top: 14px;
              text-align: center;
            }
            .sign-date {
              font-size: 12.5px;
              color: #444444;
              margin-bottom: 12px;
            }
            .sign-chief {
              font-size: 17px;
              font-weight: 900;
              letter-spacing: 2px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 16px;
            }
            .seal-box {
              display: inline-block;
              width: 44px;
              height: 44px;
              border: 1.5px dashed #b91c1c;
              border-radius: 50%;
              text-align: center;
              line-height: 44px;
              font-size: 11px;
              color: #b91c1c;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="title-box">
              <div class="sub-title">固 城 李 氏 서 울 宗 親 會</div>
              <div class="main-title">${event.name} 행사 결과 및 결산 종합보고서</div>
              <div class="event-meta">
                <span>일시: ${event.date || '당일'}</span>
                <span>장소: ${event.location || '종친회관'}</span>
                <span>보고일: ${new Date().toLocaleDateString('ko-KR')}</span>
              </div>
            </div>

            <!-- 핵심 KPI 4단 지표 -->
            <div class="kpi-grid">
              <div class="kpi-card">
                <span class="kpi-label">총 참석 종친</span>
                <span class="kpi-val" style="color: #4338ca;">${totalAttendees} 명</span>
              </div>
              <div class="kpi-card">
                <span class="kpi-label">총 수입 (A)</span>
                <span class="kpi-val" style="color: #0369a1;">${totalIncome.toLocaleString()} 원</span>
              </div>
              <div class="kpi-card">
                <span class="kpi-label">총 지출 (B)</span>
                <span class="kpi-val" style="color: #b91c1c;">${totalExpense.toLocaleString()} 원</span>
              </div>
              <div class="kpi-card">
                <span class="kpi-label">차인 잔액 (A - B)</span>
                <span class="kpi-val" style="color: ${balance >= 0 ? '#15803d' : '#b91c1c'};">
                  ${balance >= 0 ? '+' : ''}${balance.toLocaleString()} 원
                </span>
              </div>
            </div>

            <!-- 1. 종친 참석 통계 -->
            <div class="section-title">Ⅰ. 종친 참석 통계 (총 ${totalAttendees}명)</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 25%;">주요 문파</th>
                  <th style="width: 25%;">참석 인원 (비율)</th>
                  <th style="width: 25%;">세수(항렬) 분포</th>
                  <th style="width: 25%;">비고</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="vertical-align: top;">
                    ${branchStats.slice(0, 5).map((b) => `<div>• ${b.branch}: <strong>${b.count}명</strong></div>`).join('')}
                    ${branchStats.length > 5 ? `<div style="color:#777;">외 ${branchStats.length - 5}개 파</div>` : ''}
                  </td>
                  <td style="vertical-align: top;">
                    ${branchStats.slice(0, 5).map((b) => `<div>${b.ratio}%</div>`).join('')}
                  </td>
                  <td style="vertical-align: top;">
                    ${genStats.slice(0, 6).map((g) => `<div>• ${g.generation}세: ${g.count}명</div>`).join('')}
                    ${genStats.length > 6 ? `<div style="color:#777;">외 ${genStats.length - 6}개 항렬</div>` : ''}
                  </td>
                  <td style="vertical-align: top; color: #555;">
                    접수처 명찰 라벨 및 회비 영수 완료
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- 2. 수지 결산 총괄표 -->
            <div class="section-title">Ⅱ. 행사 수지 결산 총괄표</div>
            <table>
              <thead>
                <tr>
                  <th colspan="2">수입 결산 (총 ${totalIncome.toLocaleString()}원)</th>
                  <th colspan="2">지출 결산 (총 ${totalExpense.toLocaleString()}원)</th>
                </tr>
                <tr>
                  <th>항목</th>
                  <th>금액 (원)</th>
                  <th>비목</th>
                  <th>금액 (원)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="font-bold">일반 종친회비</td>
                  <td class="text-right">${regularTotal.toLocaleString()}</td>
                  <td class="font-bold">식대·다과비</td>
                  <td class="text-right">
                    ${(categoryTotals.find((c) => c.category === '식대·다과')?.amount || 0).toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td class="font-bold">특별 찬조·협찬금</td>
                  <td class="text-right">${sponsorTotal.toLocaleString()}</td>
                  <td class="font-bold">제물·시제비</td>
                  <td class="text-right">
                    ${(categoryTotals.find((c) => c.category === '제물·시제')?.amount || 0).toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td class="font-bold" style="background:#f8fafc;">수입 합계 (A)</td>
                  <td class="text-right font-bold" style="background:#f8fafc; color:#0369a1;">
                    ${totalIncome.toLocaleString()}
                  </td>
                  <td class="font-bold">인쇄·기념품·기타</td>
                  <td class="text-right">
                    ${categoryTotals
                      .filter((c) => !['식대·다과', '제물·시제'].includes(c.category))
                      .reduce((s, c) => s + c.amount, 0)
                      .toLocaleString()}
                  </td>
                </tr>
                <tr style="background: #fef2f2;">
                  <td colspan="2" class="text-center font-bold">차인 잔액 (이월금: A - B)</td>
                  <td colspan="2" class="text-right font-bold" style="color: ${balance >= 0 ? '#15803d' : '#b91c1c'}; font-size: 13px;">
                    ${balance >= 0 ? '+' : ''}${balance.toLocaleString()} 원
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- 3. 특별 찬조금 협찬자 명단 -->
            <div class="section-title">Ⅲ. 특별 찬조·협찬 종친 명단 (총 ${sponsorAttendance.length}명)</div>
            ${sponsors.length > 0 ? `
              <div class="sponsor-grid">
                ${sponsors.map((s, idx) => `
                  <div class="sponsor-item">
                    <span>${idx + 1}. <strong>${s.name}</strong> <span style="color:#666; font-size:10px;">(${s.branch || ''} ${s.generation ? `${s.generation}세` : ''})</span></span>
                    <strong>${(s.feeAmount || 0).toLocaleString()}원</strong>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div style="font-size:11px; color:#666; padding:6px; border:1px solid #ccc; text-align:center;">
                등록된 10만원 이상 특별 찬조금 내역이 없습니다.
              </div>
            `}

            <!-- 하단 확인 날인 -->
            <div class="sign-box">
              <div class="sign-date">
                ${new Date().getFullYear()}년 ${new Date().getMonth() + 1}월 ${new Date().getDate()}일
              </div>
              <div class="sign-chief">
                <span>固 城 李 氏 서 울 宗 親 會 회 장 &nbsp; ${presidentName}</span>
                <span class="seal-box">直印</span>
              </div>
            </div>
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
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* 헤더 */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                행사 종합 결과보고서 (결과보고)
                <span className="text-xs bg-indigo-500 text-white font-black px-2 py-0.5 rounded-full">
                  종친회보·이사회 보고용
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                행사: <strong className="text-white">{event.name}</strong> | 참석 인원 분석, 수지 결산 총괄 및 특별 찬조자 일체
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

        {/* 상단 퀵 액션 바 */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Award className="w-4 h-4 text-indigo-600" />
            <span>회장: <strong className="text-slate-900 font-bold">{presidentName}</strong></span>
            <span className="text-slate-300">|</span>
            <span>총 참석: <strong className="text-indigo-700 font-bold">{totalAttendees}명</strong></span>
            <span className="text-slate-300">|</span>
            <span>차인 잔액: <strong className={balance >= 0 ? 'text-emerald-700 font-bold' : 'text-red-700 font-bold'}>{balance >= 0 ? '+' : ''}{balance.toLocaleString()}원</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyKakao}
              className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="카카오톡 단체 종친방에 공지할 수 있는 단정한 요약글을 복사합니다"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-800 stroke-[3]" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? '카톡 공지문 복사완료!' : '📱 카톡 공지문 복사'}</span>
            </button>
          </div>
        </div>

        {/* 미리보기 본문 (스크롤) */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex justify-center">
          <div className="w-full max-w-[210mm] bg-white p-6 sm:p-10 shadow-lg border border-slate-200 text-slate-900 font-serif space-y-6">
            {/* 타이틀 */}
            <div className="text-center border-b-2 border-slate-900 pb-4">
              <div className="text-sm font-bold tracking-widest text-slate-600">固 城 李 氏 서 울 宗 親 會</div>
              <h1
                className="text-lg sm:text-xl md:text-2xl font-black my-2 text-slate-900 whitespace-nowrap overflow-hidden text-ellipsis"
                style={{ letterSpacing: '-0.5px' }}
              >
                {event.name} 행사 결과 및 결산 종합보고서
              </h1>
              <div className="flex justify-between text-xs font-sans text-slate-500 mt-2">
                <span>일시: {event.date || '당일'}</span>
                <span>장소: {event.location || '종친회관'}</span>
                <span>보고일: {new Date().toLocaleDateString('ko-KR')}</span>
              </div>
            </div>

            {/* 핵심 KPI 4단 지표 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 border-2 border-slate-900 font-sans text-center rounded-lg">
              <div>
                <span className="text-xs text-slate-500 font-bold">총 참석 종친</span>
                <div className="text-lg font-black text-indigo-700 mt-0.5">{totalAttendees} 명</div>
                <span className="text-[10px] text-slate-400">{branchStats.length}개 문파 참석</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-bold">총 수입 (A)</span>
                <div className="text-lg font-black text-sky-700 mt-0.5">{totalIncome.toLocaleString()} 원</div>
                <span className="text-[10px] text-slate-400">특별찬조 {sponsorAttendance.length}명 포함</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-bold">총 지출 (B)</span>
                <div className="text-lg font-black text-red-700 mt-0.5">{totalExpense.toLocaleString()} 원</div>
                <span className="text-[10px] text-slate-400">총 {eventExpenses.length}건 집행</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-bold">차인 잔액 (A - B)</span>
                <div className={`text-lg font-black mt-0.5 ${balance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  ${balance >= 0 ? '+' : ''}{balance.toLocaleString()} 원
                </div>
                <span className="text-[10px] text-slate-400">차기 이월 또는 통장 잔액</span>
              </div>
            </div>

            {/* 1. 종친 참석 통계 */}
            <div>
              <h3 className="text-sm font-bold border-l-4 border-slate-900 pl-2 mb-2 font-sans">
                Ⅰ. 종친 참석 통계 (총 {totalAttendees}명 접수)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs">
                {/* 문파별 통계 표 */}
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <div className="bg-slate-100 px-3 py-1.5 font-bold border-b border-slate-300">
                    문파별 참석 분포 (상위 문파)
                  </div>
                  <table className="w-full text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="p-1.5 text-left border-b border-slate-200">문파명</th>
                        <th className="p-1.5 text-center border-b border-slate-200">인원</th>
                        <th className="p-1.5 text-right border-b border-slate-200">점유율</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branchStats.slice(0, 6).map((b) => (
                        <tr key={b.branch} className="border-b border-slate-100">
                          <td className="p-1.5 font-bold">{b.branch}</td>
                          <td className="p-1.5 text-center">{b.count}명</td>
                          <td className="p-1.5 text-right text-slate-500">{b.ratio}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 세수(항렬)별 통계 표 */}
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <div className="bg-slate-100 px-3 py-1.5 font-bold border-b border-slate-300">
                    세수(항렬)별 참석 분포
                  </div>
                  <div className="p-3 grid grid-cols-3 gap-2">
                    {genStats.map((g) => (
                      <div key={g.generation} className="p-2 bg-slate-50 rounded border border-slate-200 text-center">
                        <span className="text-[11px] text-slate-500 block">{g.generation}세</span>
                        <strong className="text-sm text-slate-800">{g.count}명</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. 수지 결산 총괄표 */}
            <div>
              <h3 className="text-sm font-bold border-l-4 border-slate-900 pl-2 mb-2 font-sans">
                Ⅱ. 행사 수지 결산 총괄표
              </h3>
              <table className="w-full text-xs border-collapse border border-slate-400 font-sans">
                <thead className="bg-slate-100 font-bold">
                  <tr>
                    <th colSpan={2} className="border border-slate-300 p-2 text-center text-sky-800">
                      수입 결산 (총 {totalIncome.toLocaleString()}원)
                    </th>
                    <th colSpan={2} className="border border-slate-300 p-2 text-center text-red-800">
                      지출 결산 (총 {totalExpense.toLocaleString()}원)
                    </th>
                  </tr>
                  <tr className="bg-slate-50 text-[11px]">
                    <th className="border border-slate-300 p-1.5">구분</th>
                    <th className="border border-slate-300 p-1.5 text-right">금액 (원)</th>
                    <th className="border border-slate-300 p-1.5">비목</th>
                    <th className="border border-slate-300 p-1.5 text-right">금액 (원)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2 font-bold">일반 회비 ({regularAttendance.length}명)</td>
                    <td className="border border-slate-300 p-2 text-right">{regularTotal.toLocaleString()}</td>
                    <td className="border border-slate-300 p-2 font-bold">식대·다과비</td>
                    <td className="border border-slate-300 p-2 text-right">
                      {(categoryTotals.find((c) => c.category === '식대·다과')?.amount || 0).toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-bold">특별 찬조금 ({sponsorAttendance.length}명)</td>
                    <td className="border border-slate-300 p-2 text-right">{sponsorTotal.toLocaleString()}</td>
                    <td className="border border-slate-300 p-2 font-bold">제물·시제비</td>
                    <td className="border border-slate-300 p-2 text-right">
                      {(categoryTotals.find((c) => c.category === '제물·시제')?.amount || 0).toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-bold bg-sky-50/50">수입 합계 (A)</td>
                    <td className="border border-slate-300 p-2 text-right font-black text-sky-800 bg-sky-50/50">
                      {totalIncome.toLocaleString()}
                    </td>
                    <td className="border border-slate-300 p-2 font-bold">인쇄·기념품·기타</td>
                    <td className="border border-slate-300 p-2 text-right">
                      {categoryTotals
                        .filter((c) => !['식대·다과', '제물·시제'].includes(c.category))
                        .reduce((s, c) => s + c.amount, 0)
                        .toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={2} className="border border-slate-300 p-2 text-center">차인 잔액 (이월금: A - B)</td>
                    <td colSpan={2} className={`border border-slate-300 p-2 text-right text-sm font-black ${balance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {balance >= 0 ? '+' : ''}{balance.toLocaleString()} 원
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 3. 특별 찬조금 협찬자 명단 */}
            <div>
              <h3 className="text-sm font-bold border-l-4 border-slate-900 pl-2 mb-2 font-sans flex items-center justify-between">
                <span>Ⅲ. 특별 찬조·협찬 종친 명단 (총 {sponsorAttendance.length}명)</span>
                <span className="text-[11px] font-normal text-slate-500">10만원 이상 고액 찬조 일체</span>
              </h3>
              {sponsors.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-sans text-xs">
                  {sponsors.map((s, idx) => (
                    <div
                      key={s.id || idx}
                      className="p-2 border border-slate-200 rounded bg-slate-50 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{s.name}</span>
                        <span className="text-[10px] text-slate-500 ml-1">
                          ({s.branch || ''} {s.generation ? `${s.generation}세` : ''})
                        </span>
                      </div>
                      <span className="font-black text-slate-900">
                        {(s.feeAmount || 0).toLocaleString()}원
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center text-xs text-slate-400 border border-slate-200 rounded">
                  등록된 10만원 이상 특별 찬조금 내역이 없습니다.
                </div>
              )}
            </div>

            {/* 하단 확인 날인 */}
            <div className="pt-6 border-t-2 border-slate-900 text-center space-y-4">
              <div className="font-sans text-xs text-slate-500">
                {new Date().getFullYear()}년 {new Date().getMonth() + 1}월 {new Date().getDate()}일
              </div>
              <div className="text-lg font-black tracking-wider flex items-center justify-center gap-4 text-slate-900">
                <span>固 城 李 氏 서 울 宗 親 會 회 장 &nbsp; {presidentName}</span>
                <span className="w-10 h-10 rounded-full border-2 border-dashed border-red-600 flex items-center justify-center text-xs text-red-600 font-bold">
                  直印
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 버튼 바 */}
        <div className="px-6 py-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            총 참석 {totalAttendees}명 | 총 수입 {totalIncome.toLocaleString()}원 | 총 지출 {totalExpense.toLocaleString()}원
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCopyKakao}
              className="px-4 py-2 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Share2 className="w-4 h-4" />}
              <span>{copied ? '카톡 복사완료' : '카톡 공지문 복사'}</span>
            </button>
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
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black text-sm rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-white stroke-[2.5]" />
              <span>A4 공식 행사보고서 인쇄하기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
