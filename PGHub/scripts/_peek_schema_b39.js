const fs=require('fs');
const env=fs.readFileSync(__dirname+'/../.env','utf8');
const get=k=>{const m=env.match(new RegExp('^'+k+'=(.*)$','m'));return m?m[1].trim():'';};
const {createClient}=require('@supabase/supabase-js');
const s=createClient(get('VITE_SUPABASE_URL'),get('SUPABASE_SERVICE_ROLE_KEY'));
(async()=>{
  const {data,error}=await s.from('PGcode_problems').select('*').limit(1);
  if(error){console.error('ERR',error);return;}
  console.log('COLUMNS:',Object.keys(data[0]));
  console.log('SAMPLE ROW:',JSON.stringify(data[0],null,2));
  const {data:t,error:te}=await s.from('PGcode_topics').select('*');
  if(te){console.error('TERR',te);}else{console.log('TOPICS_COUNT',t.length);console.log('TOPICS:',JSON.stringify(t,null,2).slice(0,4000));}
  const nums=[2764,2773,2774,2775,2776,2777,2782,2783,2792,2793,2794,2795,2796,2797,2802];
  const {data:ex}=await s.from('PGcode_problems').select('leetcode_number,slug,title').in('leetcode_number',nums);
  console.log('EXISTING_AT_NUMS:',JSON.stringify(ex));
})();
