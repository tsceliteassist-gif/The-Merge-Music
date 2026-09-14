import { FormEvent, useEffect, useState } from "react";
import { LogOut, Save, UserRound } from "lucide-react";
import { supabase } from "./supabase";

type Profile={display_name:string;username:string|null;bio:string|null;email:string|null};
export default function MemberProfile(){
 const [profile,setProfile]=useState<Profile>({display_name:"",username:"",bio:"",email:""}),[editing,setEditing]=useState(false),[notice,setNotice]=useState("");
 useEffect(()=>{(async()=>{const {data:{user}}=await supabase.auth.getUser();if(!user)return;const {data}=await supabase.from("profiles").select("display_name,username,bio,email").eq("id",user.id).single();if(data)setProfile(data)})()},[]);
 async function save(e:FormEvent){e.preventDefault();const {data:{user}}=await supabase.auth.getUser();if(!user)return;const {error}=await supabase.from("profiles").update({display_name:profile.display_name,username:profile.username||null,bio:profile.bio||null,updated_at:new Date().toISOString()}).eq("id",user.id);setNotice(error?.message??"Profile saved.");if(!error)setEditing(false)}
 return <main className="screen">
  <section className="profile-head member-profile"><div className="cover"/><div className="avatar lg"><UserRound/></div>
   {!editing?<><h1>{profile.display_name||"Merge Member"}</h1><p>@{profile.username||"set_your_username"}</p><p className="member-bio">{profile.bio||"Add a bio and tell The Merge who you are."}</p><div className="profile-actions"><button className="primary" onClick={()=>setEditing(true)}>EDIT PROFILE</button><button className="secondary" onClick={()=>supabase.auth.signOut()}><LogOut/> SIGN OUT</button></div></>:
   <form className="submit-form member-form" onSubmit={save}><label>DISPLAY NAME<input value={profile.display_name} onChange={e=>setProfile({...profile,display_name:e.target.value})} required/></label><label>USERNAME<input value={profile.username??""} onChange={e=>setProfile({...profile,username:e.target.value})} pattern="[A-Za-z0-9_]+"/></label><label>BIO<textarea value={profile.bio??""} onChange={e=>setProfile({...profile,bio:e.target.value})} maxLength={180}/></label><button className="primary"><Save/> SAVE PROFILE</button><button type="button" className="secondary" onClick={()=>setEditing(false)}>CANCEL</button></form>}
   {notice&&<p className="live-notice">{notice}</p>}
  </section>
  <article className="info-card"><UserRound/><div><strong>Your Merge identity</strong><p>Your email remains private. Your display name, username and bio are visible to authenticated members.</p></div></article>
 </main>
}
