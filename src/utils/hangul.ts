// 한국어 초성 분해 및 초성 검색 유틸리티

const CHOSUNG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

/**
 * 한글 문자열에서 초성만 추출
 * 예: "이동광" -> "ㅇㄷㄱ"
 */
export function getChosung(str: string): string {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    // 한글 유니코드 범위: 0xAC00 ~ 0xD7A3
    if (code >= 0xac00 && code <= 0xd7a3) {
      const chosungIndex = Math.floor((code - 0xac00) / (21 * 28));
      result += CHOSUNG[chosungIndex];
    } else {
      result += str.charAt(i);
    }
  }
  return result;
}

/**
 * 대상 문자열이 검색 쿼리와 매칭되는지 확인 (초성 및 일반 부분 검색 지원)
 * 예: query가 'ㅇㄷㄱ'인 경우 '이동광' true
 * 예: query가 '동광'인 경우 '이동광' true
 */
export function matchKorean(target: string, query: string): boolean {
  if (!query) return true;
  if (!target) return false;

  const cleanTarget = target.toLowerCase().replace(/\s+/g, '');
  const cleanQuery = query.toLowerCase().replace(/\s+/g, '');

  // 1. 일반 부분 일치 검사
  if (cleanTarget.includes(cleanQuery)) {
    return true;
  }

  // 2. 검색어가 초성으로만 이루어져 있는지 확인
  const isQueryChosung = cleanQuery.split('').every(ch => CHOSUNG.includes(ch));
  if (isQueryChosung) {
    const targetChosung = getChosung(cleanTarget);
    return targetChosung.includes(cleanQuery);
  }

  return false;
}
