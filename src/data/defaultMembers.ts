import rawMembers from './membersData.json';
import { Member } from '../types';

export const BRANCHES = [
  '사암공파',
  '호군공파',
  '참판공파',
  '둔재공파',
  '도촌공파',
  '은암공파',
  '좌윤공파',
  '병사공파',
  '안정공파',
  '동추공파'
] as const;

export const BRANCH_HANJA_MAP: Record<string, string> = {
  '사암공파': '思菴公派',
  '호군공파': '護軍公派',
  '참판공파': '㕘判公派',
  '둔재공파': '鈍齋公派',
  '도촌공파': '桃村公派',
  '은암공파': '隱庵公派',
  '좌윤공파': '左尹公派',
  '병사공파': '兵使公派',
  '안정공파': '安靖公派',
  '동추공파': '同樞公派'
};

export const ROLE_PRESETS = [
  '',
  '이사',
  '회장',
  '부회장',
  '감사',
  '고문',
  '사무총장',
  '사무국장',
  '총무',
  '파회장',
  '수석부회장',
  '여성부회장',
  '청년회장',
  '재무이사',
  '자문위원',
  '대종회회장',
  '서울종친회장',
  '종원'
];

export const DEFAULT_MEMBERS: Member[] = rawMembers as Member[];
