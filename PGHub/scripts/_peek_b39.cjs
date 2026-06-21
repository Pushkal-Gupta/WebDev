const fs=require('fs');
const env=fs.readFileSync(__dirname+'/../.env','utf8');
const get=k=>{const m=env.match(new RegExp('^\\s*'+k+'\\s*=\\s*(.*)$','m'));return m?m[1].trim():'';};
const {createClient}=require('@supabase/supabase-js');
const s=createClient(get('VITE_SUPABASE_URL'),get('SUPABASE_SERVICE_ROLE_KEY'));
(async()=>{
  const {data,error}=await s.from('PGcode_problems').select('*').eq('leetcode_number',2759).limit(1);
  if(error){console.error('ERR',error);return;}
  if(data[0]) console.log('B38_ROW_KEYS:',Object.keys(data[0]).join(','));
  const {data:t,error:te}=await s.from('PGcode_topics').select('*');
  if(te){console.error('TERR',te);}else{console.log('TOPIC_IDS:',t.map(x=>x.id).join(','));}
  const nums=[2764,2773,2774,2775,2776,2777,2782,2783,2792,2793,2794,2795,2796,2797,2802];
  const {data:ex}=await s.from('PGcode_problems').select('leetcode_number,slug,id,title,name').in('leetcode_number',nums);
  console.log('EXISTING_AT_NUMS:',JSON.stringify(ex));
})();
