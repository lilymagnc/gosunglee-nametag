import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve('.env');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
const getEnvVal = (key: string) => {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1].trim() : '';
};

const SUPABASE_URL = getEnvVal('VITE_SUPABASE_URL') || 'https://tabpszknhdylpxnugxkk.supabase.co';
const SUPABASE_SERVICE_ROLE = getEnvVal('service_role') || process.env.SUPABASE_SERVICE_ROLE || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

async function runSeed() {
  const membersPath = path.resolve('src/data/membersData.json');
  const rawData = fs.readFileSync(membersPath, 'utf-8');
  const members = JSON.parse(rawData);

  console.log(`Starting seed: ${members.length} members...`);

  // 1. Settings 초기화
  const defaultSettings = {
    eventName: '2026년 정기총회 및 시제',
    eventYear: 2026,
    defaultFee: 50000,
    paperSize: 'formtec_3114',
    titleText: '고성이씨서울종친회',
    footerText: '인터넷 고성이씨 서울종친회',
    fontSizeName: 28,
    fontSizeBranch: 18,
    fontSizeRole: 18,
    showRoleBadge: true,
    printOrientation: 'horizontal',
    customTitleText: '',
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    gapX: 0,
    gapY: 0,
    thermalMode: 'white',
    thermalBadgeStyle: 'soft_gray'
  };

  const { error: settingsError } = await supabase
    .from('gosunglee_settings')
    .upsert({
      id: 'current',
      settings: defaultSettings,
      updated_at: new Date().toISOString()
    });

  if (settingsError) {
    console.error('Settings seed error:', settingsError);
  } else {
    console.log('Settings successfully seeded!');
  }

  // 2. Members 100개씩 배치 업서트
  const batchSize = 100;
  for (let i = 0; i < members.length; i += batchSize) {
    const batch = members.slice(i, i + batchSize).map((m: any) => ({
      id: Number(m.id),
      branch: m.branch || '',
      generation: (m.generation !== undefined && m.generation !== null && m.generation !== '') ? Number(m.generation) : null,
      name: m.name,
      address: m.address || '',
      phone: m.phone || '',
      mobile: m.mobile || '',
      notes: m.notes || '',
      role: m.role || '',
      job: m.job || ''
    }));

    const { error } = await supabase.from('gosunglee_members').upsert(batch);
    if (error) {
      console.error(`Error seeding batch ${i} ~ ${i + batch.length}:`, error);
    } else {
      console.log(`Uploaded ${Math.min(i + batchSize, members.length)} / ${members.length} members`);
    }
  }

  // 3. Count 확인
  const { count, error: countError } = await supabase
    .from('gosunglee_members')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Count error:', countError);
  } else {
    console.log(`🎉 Total members in Supabase: ${count}`);
  }
}

runSeed().catch(console.error);
