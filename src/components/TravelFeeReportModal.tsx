import React, { useState, useEffect } from 'react';
import { AttendanceRecord, LabelSettings } from '../types';
import { X, Printer, Download, Car, CheckCircle2, MapPin, Calendar, Users } from 'lucide-react';
import * as XLSX from 'xlsx';

interface TravelFeeReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: LabelSettings;
  attendanceRecords: AttendanceRecord[];
  presidentName?: string;
}

export const TravelFeeReportModal: React.FC<TravelFeeReportModalProps> = ({
  isOpen,
  onClose,
  settings,
  attendanceRecords,
  presidentName: initialPresidentName,
}) => {
  if (!isOpen) return null;

  const eventName = settings.eventName || '2026년 정기총회 및 시제';
  const travelFeePerPerson = settings.travelFeeAmount || 50000;

  // 문중/종친회 구분 (용헌공파종중 vs 서울종친회)
  const isYongheon =
    settings.eventName?.includes('용헌') ||
    settings.footerText?.includes('용헌') ||
    settings.isTravelFeeEvent;

  const defaultOrgTitle = isYongheon
    ? '固 城 李 氏 容 軒 公 派 宗 中'
    : '固 城 李 氏 서 울 宗 親 會';

  // 용헌종중 회장은 "이 삼 렬", 서울종친회 회장은 "이 기 석"
  const defaultPresident = isYongheon ? '이 삼 렬' : '이 기 석';
  const resolvedPresident =
    initialPresidentName && initialPresidentName !== '이 기 석'
      ? initialPresidentName
      : defaultPresident;

  const [president, setPresident] = useState<string>(resolvedPresident);
  const [orgTitle, setOrgTitle] = useState<string>(defaultOrgTitle);

  useEffect(() => {
    setPresident(resolvedPresident);
    setOrgTitle(defaultOrgTitle);
  }, [resolvedPresident, defaultOrgTitle]);

  // 당일 행사 출석 데이터 중 실제로 현금 봉투가 지급(travelFeePaid === true)된 종친만 추출
  const targetRecords = attendanceRecords.filter((r) => {
    const isThisEvent = r.eventName === eventName || r.year === (settings.eventYear || 2026);
    return isThisEvent && r.travelFeePaid === true;
  });

  const totalCount = targetRecords.length;
  const totalAmount = totalCount * travelFeePerPerson;

  // 1. 엑셀 다운로드
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    const data = targetRecords.map((r, idx) => ({
      '순번': idx + 1,
      '접수시간': r.timestamp ? r.timestamp.slice(11, 16) || r.timestamp : '',
      '성명': r.name,
      '문파': r.branch || '미지정',
      '세수': r.generation ? `${r.generation}세` : '',
      '직책': r.role || '',
      '연락처': r.mobile || '',
      '지급금액(원)': travelFeePerPerson,
      '수령확인': '서명 완료',
    }));

    // 합계 요약행
    const summaryRow = {
      '순번': '합계',
      '접수시간': `총 ${totalCount}명`,
      '성명': '',
      '문파': '',
      '세수': '',
      '직책': '',
      '연락처': '총 지급액',
      '지급금액(원)': totalAmount,
      '수령확인': `${totalAmount.toLocaleString()}원`,
    };

    const ws = XLSX.utils.json_to_sheet([...data, summaryRow as any]);

    ws['!cols'] = [
      { wch: 6 },  // 순번
      { wch: 10 }, // 접수시간
      { wch: 10 }, // 성명
      { wch: 14 }, // 문파
      { wch: 8 },  // 세수
      { wch: 12 }, // 직책
      { wch: 16 }, // 연락처
      { wch: 14 }, // 지급금액
      { wch: 12 }, // 수령확인
    ];

    XLSX.utils.book_append_sheet(wb, ws, '교통비_수령대장');

    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const filename = `${eventName.replace(/\s+/g, '_')}_교통비_지급대장_${dateStr}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  // 2. A4 클린 인쇄 (iframe 인쇄)
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

    const today = new Date();
    const dateText = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

    const rowsHtml = targetRecords
      .map(
        (r, idx) => `
        <tr>
          <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
          <td style="text-align: center;">${r.timestamp ? r.timestamp.slice(11, 16) || r.timestamp : ''}</td>
          <td style="text-align: center; font-weight: 900; font-size: 13px;">${r.name}</td>
          <td style="text-align: center;">${r.branch || ''}</td>
          <td style="text-align: center;">${r.generation ? `${r.generation}세` : ''}</td>
          <td style="text-align: center; font-size: 10.5px;">${r.mobile || ''}</td>
          <td style="text-align: right; font-weight: bold; padding-right: 8px;">${travelFeePerPerson.toLocaleString()}원</td>
          <td style="text-align: center; height: 32px;"></td>
        </tr>
      `
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${eventName}_교통비_수령대장</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 14mm 14mm 14mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: "Malgun Gothic", "맑은 고딕", "Apple SD Gothic Neo", sans-serif;
              color: #0f172a;
              background: #fff;
              font-size: 11px;
              line-height: 1.4;
            }
            .header-box {
              text-align: center;
              padding-bottom: 12px;
              border-bottom: 2px solid #0f172a;
              margin-bottom: 12px;
            }
            .sub-title {
              font-size: 12px;
              color: #475569;
              font-weight: bold;
              letter-spacing: 1px;
            }
            .main-title {
              font-size: 23px;
              font-weight: 900;
              letter-spacing: 2px;
              margin: 4px 0 6px 0;
              color: #0f172a;
            }
            .summary-bar {
              display: flex;
              justify-content: space-between;
              align-items: center;
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              padding: 7px 12px;
              border-radius: 6px;
              margin-bottom: 12px;
              font-size: 11px;
              font-weight: bold;
            }
            .summary-stat {
              color: #047857;
              font-size: 12px;
              font-weight: 900;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 16px;
            }
            th, td {
              border: 1px solid #94a3b8;
              padding: 4px 5px;
              font-size: 11px;
            }
            th {
              background-color: #e2e8f0;
              font-weight: 900;
              text-align: center;
              height: 26px;
            }
            tr:nth-child(even) td {
              background-color: #f8fafc;
            }
            .total-row td {
              background-color: #f1f5f9 !important;
              font-weight: 900;
              font-size: 11.5px;
            }
            .footer-box {
              margin-top: 18px;
              text-align: center;
              padding-top: 14px;
              border-top: 1.5px solid #0f172a;
              page-break-inside: avoid;
            }
            .statement {
              font-size: 12px;
              font-weight: bold;
              color: #1e293b;
              margin-bottom: 10px;
            }
            .seal-row {
              display: flex;
              justify-content: center;
              align-items: center;
              gap: 16px;
              font-size: 16px;
              font-weight: 900;
              letter-spacing: 2px;
              margin-top: 8px;
            }
            .seal-mark {
              width: 36px;
              height: 36px;
              border: 2px dashed #dc2626;
              border-radius: 50%;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 11px;
              color: #dc2626;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header-box">
            <div class="sub-title">${eventName}</div>
            <div class="main-title">參 席 宗 親 &nbsp; 旅 費 (交 通 費) &nbsp; 支 給 臺 帳</div>
            <div style="font-size: 10.5px; color: #64748b;">(참석 종친 여비·교통비 영수 및 수령 확인 서명대장)</div>
          </div>

          <div class="summary-bar">
            <div><strong>행사일시:</strong> ${dateText} &nbsp;|&nbsp; <strong>1인당 지급기준:</strong> ${travelFeePerPerson.toLocaleString()}원</div>
            <div>
              <span>총 수령인원: </span><span class="summary-stat">${totalCount}명</span>
              &nbsp;&nbsp;|&nbsp;&nbsp;
              <span>총 집행액: </span><span class="summary-stat">${totalAmount.toLocaleString()}원</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 36px;">순번</th>
                <th style="width: 52px;">시간</th>
                <th style="width: 65px;">성명</th>
                <th style="width: 85px;">문파</th>
                <th style="width: 44px;">세수</th>
                <th style="width: 105px;">연락처</th>
                <th style="width: 85px;">지급액</th>
                <th style="width: 95px;">수령인 서명 (날인)</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <tr class="total-row">
                <td colspan="6" style="text-align: center;">총 &nbsp;&nbsp; 합 &nbsp;&nbsp; 계 &nbsp;&nbsp; (총 ${totalCount}명)</td>
                <td style="text-align: right; padding-right: 8px; color: #047857;">${totalAmount.toLocaleString()}원</td>
                <td style="text-align: center; color: #64748b; font-size: 10px;">전원 영수 완료</td>
              </tr>
            </tbody>
          </table>

          <div class="footer-box">
            <div class="statement">
              위와 같이 ${eventName}에 참석하신 종친들께 소정의 여비(교통비)를 정히 지급하였음을 확인합니다.
            </div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">${dateText}</div>
            <div class="seal-row">
              <span>${orgTitle} 회 장 &nbsp;&nbsp; ${president}</span>
              <span class="seal-mark">直印</span>
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
        document.body.removeChild(iframe);
      }, 1000);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-300 flex flex-col max-h-[92vh]">
        {/* 상단 모달 헤더 바 */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-amber-500/20 text-amber-300 rounded-xl">
              <Car className="w-5 h-5 stroke-[2.5]" />
            </span>
            <div>
              <h3 className="text-base font-black flex items-center gap-2">
                <span>참석 종친 여비(교통비) 지급대장 서명부</span>
                <span className="text-xs bg-amber-500 text-amber-950 font-extrabold px-2 py-0.5 rounded-full">
                  1인당 {travelFeePerPerson.toLocaleString()}원
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {eventName} | 총 {totalCount}명 수령 완료 (총 {totalAmount.toLocaleString()}원)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 상단 간이 요약 바 */}
        <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-4 text-amber-950 font-bold">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-700" />
              <span>지급 인원: <strong>{totalCount}명</strong></span>
            </span>
            <span>|</span>
            <span>1인당 지급액: <strong>{travelFeePerPerson.toLocaleString()}원</strong></span>
            <span>|</span>
            <span className="text-emerald-700 font-extrabold text-sm">
              총 집행액: {totalAmount.toLocaleString()}원
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-300 rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>엑셀(.xlsx) 저장</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-white" />
              <span>A4 서명대장 인쇄</span>
            </button>
          </div>
        </div>

        {/* 주최 종중 및 회장 확인/지정 바 */}
        <div className="px-6 py-2 bg-slate-800 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">주최 문중:</span>
            <input
              type="text"
              value={orgTitle}
              onChange={(e) => setOrgTitle(e.target.value)}
              className="px-2.5 py-1 text-xs font-bold text-white bg-slate-900 border border-slate-600 rounded-lg focus:ring-1 focus:ring-amber-400 w-52 sm:w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">종중 회장:</span>
            <input
              type="text"
              value={president}
              onChange={(e) => setPresident(e.target.value)}
              className="px-2.5 py-1 text-xs font-black text-amber-300 bg-slate-900 border border-slate-600 rounded-lg focus:ring-1 focus:ring-amber-400 w-24 text-center"
            />
            {isYongheon && (
              <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                용헌종중 회장 이삼렬
              </span>
            )}
          </div>
        </div>

        {/* 본문 미리보기 (A4 용지 느낌) */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/80">
          <div className="max-w-[780px] mx-auto bg-white p-8 rounded-xl shadow-md border border-slate-200 text-slate-900 space-y-4 font-sans">
            {/* 문서 제목 */}
            <div className="text-center pb-3 border-b-2 border-slate-900">
              <div className="text-xs text-slate-500 font-bold tracking-widest">{eventName}</div>
              <h2 className="text-xl font-black text-slate-900 tracking-wider mt-1">
                參 席 宗 親 &nbsp; 旅 費 (交 通 費) &nbsp; 支 給 臺 帳
              </h2>
              <div className="text-[11px] text-slate-500 mt-1">
                (참석 종친 여비·교통비 영수 및 수령 확인 서명대장)
              </div>
            </div>

            {/* 안내 박스 */}
            <div className="flex items-center justify-between text-xs bg-slate-50 border border-slate-300 p-2.5 rounded-lg font-bold">
              <div>
                기준: 1인당 {travelFeePerPerson.toLocaleString()}원 &nbsp;|&nbsp; 일자: {new Date().toLocaleDateString('ko-KR')}
              </div>
              <div className="text-emerald-700">
                총 {totalCount}명 &nbsp;|&nbsp; 총 지급액: {totalAmount.toLocaleString()}원
              </div>
            </div>

            {/* 수령자 테이블 */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-black">
                    <th className="border border-slate-400 py-1.5 px-2 text-center w-10">순번</th>
                    <th className="border border-slate-400 py-1.5 px-2 text-center w-14">시간</th>
                    <th className="border border-slate-400 py-1.5 px-2 text-center w-16">성명</th>
                    <th className="border border-slate-400 py-1.5 px-2 text-center">문파</th>
                    <th className="border border-slate-400 py-1.5 px-2 text-center w-12">세수</th>
                    <th className="border border-slate-400 py-1.5 px-2 text-center">연락처</th>
                    <th className="border border-slate-400 py-1.5 px-2 text-right w-24">지급액</th>
                    <th className="border border-slate-400 py-1.5 px-2 text-center w-28">수령 확인</th>
                  </tr>
                </thead>
                <tbody>
                  {targetRecords.length > 0 ? (
                    targetRecords.map((r, idx) => (
                      <tr key={r.id || idx} className="hover:bg-slate-50">
                        <td className="border border-slate-300 py-2 px-2 text-center font-bold text-slate-600">
                          {idx + 1}
                        </td>
                        <td className="border border-slate-300 py-2 px-2 text-center text-slate-500 text-[11px]">
                          {r.timestamp ? r.timestamp.slice(11, 16) || r.timestamp : ''}
                        </td>
                        <td className="border border-slate-300 py-2 px-2 text-center font-black text-slate-900 text-sm">
                          {r.name}
                        </td>
                        <td className="border border-slate-300 py-2 px-2 text-center text-slate-700">
                          {r.branch || ''}
                        </td>
                        <td className="border border-slate-300 py-2 px-2 text-center text-slate-700">
                          {r.generation ? `${r.generation}세` : ''}
                        </td>
                        <td className="border border-slate-300 py-2 px-2 text-center text-slate-600 text-[11px]">
                          {r.mobile || '-'}
                        </td>
                        <td className="border border-slate-300 py-2 px-2 text-right font-bold text-slate-900">
                          {travelFeePerPerson.toLocaleString()}원
                        </td>
                        <td className="border border-slate-300 py-2 px-2 text-center text-slate-400 text-[11px]">
                          <span className="inline-block w-16 border-b border-dashed border-slate-300 text-center">
                            (서명)
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 border border-slate-300">
                        아직 접수된 종친 또는 교통비 지급 기록이 없습니다.
                      </td>
                    </tr>
                  )}
                  {targetRecords.length > 0 && (
                    <tr className="bg-slate-100 font-black text-slate-900">
                      <td colSpan={6} className="border border-slate-400 py-2 px-3 text-center">
                        총 &nbsp;&nbsp; 합 &nbsp;&nbsp; 계 &nbsp;&nbsp; (총 {totalCount}명)
                      </td>
                      <td className="border border-slate-400 py-2 px-2 text-right text-emerald-700 font-extrabold text-sm">
                        {totalAmount.toLocaleString()}원
                      </td>
                      <td className="border border-slate-400 py-2 px-2 text-center text-slate-500 text-[10px]">
                        영수 완료
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 하단 확인 및 날인란 */}
            <div className="pt-6 border-t-2 border-slate-900 text-center space-y-3">
              <div className="text-xs text-slate-700 font-bold">
                위와 같이 {eventName}에 참석하신 종친들께 소정의 여비(교통비)를 정히 지급하였음을 확인합니다.
              </div>
              <div className="text-xs text-slate-500">
                {new Date().getFullYear()}년 {new Date().getMonth() + 1}월 {new Date().getDate()}일
              </div>
              <div className="text-base font-black tracking-wider flex items-center justify-center gap-4 text-slate-900 pt-1">
                <span>{orgTitle} 회 장 &nbsp;&nbsp; {president}</span>
                <span className="w-9 h-9 rounded-full border-2 border-dashed border-red-600 flex items-center justify-center text-xs text-red-600 font-bold">
                  直印
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 바 */}
        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            총 지급 인원: <span className="text-amber-300 font-bold">{totalCount}명</span> | 총 집행 금액:{' '}
            <span className="text-emerald-400 font-bold">{totalAmount.toLocaleString()}원</span>
          </div>
          <div className="flex items-center gap-2">
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
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>A4 공식 수령대장 인쇄하기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
