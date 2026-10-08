import * as XLSX from 'xlsx';
import { AttendanceRecord, Member } from '../types';

/**
 * 당일 행사 참석자 및 회비 수납 대장을 엑셀(.xlsx) 파일로 내보내기
 */
export function exportAttendanceToExcel(
  records: AttendanceRecord[],
  eventName: string = '고성이씨_서울종친회_시제'
) {
  const wb = XLSX.utils.book_new();

  // 1. 당일 참석 및 수납 대장 시트
  const totalAmount = records.reduce((sum, r) => sum + (r.feeAmount || 0), 0);
  const cashAmount = records.filter(r => r.paymentMethod === '현금').reduce((sum, r) => sum + (r.feeAmount || 0), 0);
  const transferAmount = records.filter(r => r.paymentMethod === '계좌이체').reduce((sum, r) => sum + (r.feeAmount || 0), 0);

  const mainData = records.map((r, idx) => ({
    '순번': idx + 1,
    '접수시간': r.timestamp,
    '성명': r.name,
    '파명': r.branch,
    '세수': r.generation ? `${r.generation}세` : '',
    '직책': r.role || '',
    '직업': r.job || '',
    '납부 회비(원)': r.feeAmount || 0,
    '납부 방식': r.paymentMethod,
    '연락처': r.mobile || '',
    '거주지/주소': r.address || '',
    '신규 등록': r.isNewMember ? '신규' : '기존',
    '비고(찬조 등)': r.notes || '',
  }));

  // 합계 요약 행 추가
  const summaryRow = {
    '순번': '합계',
    '접수시간': `총 ${records.length}명 참석`,
    '성명': '',
    '파명': '',
    '세수': '',
    '직책': `현금: ${cashAmount.toLocaleString()}원 | 계좌: ${transferAmount.toLocaleString()}원`,
    '직업': '',
    '납부 회비(원)': totalAmount,
    '납부 방식': '',
    '연락처': '',
    '거주지/주소': '',
    '신규 등록': '',
    '비고(찬조 등)': `총액: ${totalAmount.toLocaleString()}원`,
  };

  const wsMain = XLSX.utils.json_to_sheet([...mainData, summaryRow as any]);

  // 열 너비 자동 조정
  wsMain['!cols'] = [
    { wch: 6 },  // 순번
    { wch: 18 }, // 접수시간
    { wch: 10 }, // 성명
    { wch: 12 }, // 파명
    { wch: 8 },  // 세수
    { wch: 15 }, // 직책
    { wch: 20 }, // 직업
    { wch: 14 }, // 납부 회비
    { wch: 10 }, // 납부 방식
    { wch: 16 }, // 연락처
    { wch: 35 }, // 주소
    { wch: 10 }, // 신규
    { wch: 25 }, // 비고
  ];

  XLSX.utils.book_append_sheet(wb, wsMain, '참석자및회비수납대장');

  // 2. 당일 신규 등록 종친만 따로 모은 시트
  const newMembers = records.filter(r => r.isNewMember);
  if (newMembers.length > 0) {
    const newMemberData = newMembers.map((r, idx) => ({
      '순번': idx + 1,
      '성명': r.name,
      '파명': r.branch,
      '세수': r.generation,
      '직책': r.role || '',
      '직업': r.job || '',
      '연락처': r.mobile || '',
      '주소': r.address || '',
      '납부 회비': r.feeAmount,
      '비고': r.notes || '',
      '등록일시': r.timestamp,
    }));
    const wsNew = XLSX.utils.json_to_sheet(newMemberData);
    XLSX.utils.book_append_sheet(wb, wsNew, '현장_신규등록종친');
  }

  // 오늘 날짜 포맷팅 (YYYYMMDD)
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  const filename = `${eventName}_수납명부_${dateStr}.xlsx`;

  XLSX.writeFile(wb, filename);
}

/**
 * 사용자 업로드 엑셀 파일에서 회원 주소록 파싱
 */
export async function parseExcelToMembers(file: File): Promise<Member[]> {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array' });
  const members: Member[] = [];
  let idCounter = Date.now();

  // 모든 시트 순회
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const jsonRows: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });

    for (let r = 0; r < jsonRows.length; r++) {
      const row = jsonRows[r];
      if (!row || row.length === 0) continue;

      const name = String(row[0] || '').trim();
      if (!name || name === '성명' || name.includes('공파')) continue;

      const genRaw = String(row[1] || '').trim();
      const genNum = parseInt(genRaw.replace(/[^0-9]/g, ''), 10) || '';

      const birthOrigin = String(row[2] || '').trim();
      const zipCode = String(row[3] || '').trim();
      const address = String(row[4] || '').trim();
      const job = String(row[5] || '').trim();
      const phone = String(row[6] || '').trim();
      const mobile = String(row[7] || '').trim();

      members.push({
        id: idCounter++,
        name,
        branch: sheetName.includes('공파') ? sheetName : '미지정',
        generation: genNum,
        birthOrigin,
        zipCode,
        address,
        job,
        phone,
        mobile,
      });
    }
  }

  return members;
}
