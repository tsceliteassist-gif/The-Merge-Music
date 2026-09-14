import { FormEvent, ReactNode, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { LockKeyhole, Mail, UserRound } from "lucide-react";
import { supabase } from "./supabase";

export default function AuthGate({children}:{children:ReactNode}) {
  const [session,setSession]=useState<Session|null>(null);
  const [loading,setLoading]=useState(true);
  const [signup,setSignup]=useState(false);
  const [message,setMessage]=useState("");
  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>{setSession(data.session);setLoading(false)});
    const {data}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));
    return ()=>data.subscription.unsubscribe();
  },[]);
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault(); setMessage("");
    const f=new FormData(e.currentTarget),email=String(f.get("email")),password=String(f.get("password"));
    if(signup){
      const display_name=String(f.get("displayName")),username=String(f.get("username"));
      const {error}=await supabase.auth.signUp({email,password,options:{data:{display_name,username}}});
      setMessage(error?.message ?? "Account created. Check your email if confirmation is enabled, then sign in.");
    } else {
      const {error}=await supabase.auth.signInWithPassword({email,password});
      if(error)setMessage(error.message);
    }
  }
  if(loading)return <div className="auth-shell"><div className="auth-card">Opening The Merge…</div></div>;
  if(session)return <>{children}</>;
  return <div className="auth-shell"><section className="auth-card">
    <div className="brand auth-brand"><span>THE</span><strong>MERGE</strong><em>BY EJAY PAPI</em></div>
    <div className="auth-lock"><LockKeyhole/></div>
    <h1>{signup?"CREATE YOUR PROFILE":"MEMBERS ONLY"}</h1>
    <p>{signup?"Join the music network and enter live panels, battles and creator spaces.":"Sign in to access The Merge."}</p>
    <form onSubmit={submit}>
      {signup&&<><label><UserRound/> Display name<input name="displayName" required minLength={2}/></label><label><UserRound/> Username<input name="username" required minLength={3} pattern="[A-Za-z0-9_]+"/></label></>}
      <label><Mail/> Email<input name="email" type="email" required autoComplete="email"/></label>
      <label><LockKeyhole/> Password<input name="password" type="password" required minLength={8} autoComplete={signup?"new-password":"current-password"}/></label>
      {message&&<div className="auth-message">{message}</div>}
      <button className="primary wide">{signup?"CREATE ACCOUNT":"SIGN IN"}</button>
    </form>
    <button className="auth-switch" onClick={()=>{setSignup(!signup);setMessage("")}}>{signup?"Already a member? Sign in":"New here? Create your profile"}</button>
  </section></div>
}
