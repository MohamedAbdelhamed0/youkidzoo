import { createClient } from 'npm:@supabase/supabase-js@2';
Deno.serve(async (request: Request) => {
 const origins = (Deno.env.get('APP_ORIGINS') || Deno.env.get('APP_ORIGIN') || 'http://127.0.0.1:5173').split(',').map(origin => origin.trim()).filter(Boolean);
 const origin = request.headers.get('origin') || '';
 const headers = { 'Access-Control-Allow-Origin': origins.includes(origin) ? origin : origins[0], 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods':'POST, OPTIONS', 'Content-Type':'application/json', 'Vary':'Origin', 'Cache-Control':'no-store' };
 if(request.method==='OPTIONS')return new Response(null,{headers});
 if(request.method!=='POST')return new Response('{}',{status:405,headers});
 try {
  const {username,password}=await request.json();
  if(typeof username!=='string'||! /^[a-z0-9_]{3,30}$/i.test(username)||typeof password!=='string'||password.length>256)throw new Error('Invalid credentials');
  const url=Deno.env.get('SUPABASE_URL')!;
  const admin=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
  const {data:profile}=await admin.from('profiles').select('email').eq('username',username.toLowerCase()).eq('is_active',true).maybeSingle();
  const client=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{auth:{persistSession:false}});
  // Always make an Auth request to retain its password checking / throttling.
  const {data,error}=await client.auth.signInWithPassword({email:profile?.email||'invalid-credentials@example.invalid',password});
  if(error||!profile||!data.session)throw new Error('Invalid credentials');
  return new Response(JSON.stringify({access_token:data.session.access_token,refresh_token:data.session.refresh_token}),{headers});
 }catch{return new Response(JSON.stringify({error:'Invalid username or password.'}),{status:401,headers});}
});
