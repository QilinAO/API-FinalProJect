const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lgnhyqwtilthhqvlgvnd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnbmh5cXd0aWx0aGhxdmxndm5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDMxNDQ4OCwiZXhwIjoyMDY1ODkwNDg4fQ.IccXmRcb_OaUA1tXvjmjF-V3pNdpbY7OzHmoPgbs_hE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('👤 Managers and their contests');
  const { data: managers, error: mErr } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email')
    .eq('role', 'manager');
  if (mErr) { console.error('Error fetching managers:', mErr); process.exit(1); }

  const { data: contests, error: cErr } = await supabase
    .from('contests')
    .select('id, name, created_by, status, category, created_at')
    .order('created_at', { ascending: false });
  if (cErr) { console.error('Error fetching contests:', cErr); process.exit(1); }

  const byId = new Map(managers.map(m => [m.id, { m, contests: [] }]));
  for (const ct of contests) {
    if (ct.created_by && byId.has(ct.created_by)) {
      byId.get(ct.created_by).contests.push(ct);
    }
  }

  const rows = Array.from(byId.values())
    .map(({ m, contests }) => ({
      name: `${m.first_name || ''} ${m.last_name || ''}`.trim() || m.email,
      email: m.email,
      count: contests.length,
      contests: contests.map(c => `${c.name} [${c.category}/${c.status}]`)
    }))
    .sort((a,b) => b.count - a.count);

  for (const r of rows) {
    console.log(`- ${r.name} <${r.email}> : ${r.count}`);
    r.contests.forEach(n => console.log(`   • ${n}`));
  }
}

main().catch(err => { console.error(err); process.exit(1); });

