const { createClient } = require('/Users/abnerthen/Documents/inventory-ledger/node_modules/@supabase/supabase-js');
const url = 'https://imossbvwfuypcartlqbq.supabase.co';
const key = 'sb_publishable_XBvjS-PBTmC67RiXFVcu-g_CgH_DuXQ';
const supabase = createClient(url, key);

async function run() {
  // Try inserting with a dummy approved field to see if it succeeds/fails
  const { data, error } = await supabase.from('members').insert({
    full_name: 'Test Member',
    email: 'test@example.com',
    role: 'scout',
    active: false,
    approved: false
  }).select();

  if (error) {
    console.error('Insert error code/message:', error.code, error.message);
  } else {
    console.log('Insert success! Record:', data);
    // Cleanup if successful
    if (data && data[0]) {
      await supabase.from('members').delete().eq('id', data[0].id);
      console.log('Cleanup done.');
    }
  }
}
run();
