import EjayProfile from "./EjayProfile";
import GiftPanel from "./GiftPanel";
import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Gift, LogOut, Mic, MicOff, Radio, Send, Users } from "lucide-react";
import { supabase } from "./supabase";

type Msg={id:number;body:string;user_id:string;created_at:string};
export default function MediaTestRoom(){
 const video=useRef<HTMLVideoElement>(null),stream=useRef<MediaStream|null>(null);
 const [camera,setCamera]=useState(false),[mic,setMic]=useState(false),[room,setRoom]=useState<string|null>(null);
 const [messages,setMessages]=useState<Msg[]>([]),[text,setText]=useState(""),[notice,setNotice]=useState("");
 const [showEjay,setShowEjay]=useState(false),[showGifts,setShowGifts]=useState(false),[hostId,setHostId]=useState<string|null>(null);
 useEffect(()=>()=>stream.current?.getTracks().forEach(t=>t.stop()),[]);
 useEffect(()=>{
   if(!room)return;
   supabase.from("live_messages").select("*").eq("room_id",room).order("created_at").then(({data})=>setMessages((data as Msg[])??[]));
   const channel=supabase.channel("room-"+room).on("postgres_changes",{event:"INSERT",schema:"public",table:"live_messages",filter:"room_id=eq."+room},p=>setMessages(m=>[...m,p.new as Msg])).subscribe();
   return()=>{supabase.removeChannel(channel)};
 },[room]);
 async function enable(kind:"camera"|"mic"){
   try{
    if(!stream.current){stream.current=await navigator.mediaDevices.getUserMedia({video:true,audio:true});if(video.current)video.current.srcObject=stream.current}
    const enabled=kind==="camera"?!camera:!mic;
    stream.current.getTracks().filter(t=>t.kind===(kind==="camera"?"video":"audio")).forEach(t=>t.enabled=enabled);
    kind==="camera"?setCamera(enabled):setMic(enabled); setNotice("");
   }catch{setNotice("Camera or microphone permission was denied. Allow access in your browser settings and try again.")}
 }
 async function startTest(){
   const {data:{user}}=await supabase.auth.getUser(); if(!user)return;
   const {data,error}=await supabase.from("live_rooms").insert({host_id:user.id,title:"EJAY PAPI Test Live",status:"live",started_at:new Date().toISOString()}).select("id").single();
   if(error)setNotice(error.message);else{setRoom(data.id);setHostId(user.id);setNotice("Test live is active. Authenticated members can join this room and use real-time chat.")}
 }
 async function send(){
   if(!room||!text.trim())return;const {data:{user}}=await supabase.auth.getUser();if(!user)return;
   await supabase.from("live_messages").insert({room_id:room,user_id:user.id,body:text.trim()});setText("");
 }
 async function end(){if(room)await supabase.from("live_rooms").update({status:"ended",ended_at:new Date().toISOString()}).eq("id",room);setRoom(null);stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;setCamera(false);setMic(false)}
 if(showEjay)return <EjayProfile onBack={()=>setShowEjay(false)}/>;
 return <main className="screen">
  <div className="page-title"><span className={room?"pulse":""}/>{room?"TEST LIVE":"LIVE STUDIO"}<b>{room?"LIVE":"OFFLINE"}</b></div>
  <button className="ejay-host-card" onClick={()=>setShowEjay(true)}>
   <div className="ejay-photo" role="img" aria-label="EJAY PAPI wearing headphones"><span>EJAY<br/>PAPI</span></div>
   <div><small>OFFICIAL HOST</small><h2>EJAY PAPI</h2><p>Tha Spot — real conversations and real connections.</p></div>
  </button>
  <section className="video-stage">
   <video ref={video} autoPlay playsInline muted className={camera?"":"hidden"}/>
   {!camera&&<div className="camera-off"><CameraOff/><strong>Camera preview is off</strong><span>Start your camera to test the host view.</span></div>}
   {room&&<span className="live-badge"><Radio/> LIVE TEST</span>}
  </section>
  <div className="media-controls">
   <button className={mic?"on":""} onClick={()=>enable("mic")}>{mic?<Mic/>:<MicOff/>}<span>{mic?"Mute":"Mic"}</span></button>
   <button className={camera?"on":""} onClick={()=>enable("camera")}>{camera?<Camera/>:<CameraOff/>}<span>{camera?"Stop video":"Camera"}</span></button>
   {!room?<button className="go-live" onClick={startTest}><Radio/><span>GO TEST LIVE</span></button>:<button className="end-live" onClick={end}><LogOut/><span>END</span></button>}
  </div>
  {notice&&<p className="live-notice">{notice}</p>}
  {room&&hostId&&<button className="gift-button" onClick={()=>setShowGifts(true)}><Gift/> SEND A GIFT</button>}
  {room&&<section className="live-console"><div className="console-head"><Users/><strong>Live room</strong><span>Up to 10 speakers</span></div><div className="chat">{messages.map(m=><p key={m.id}><b>{m.user_id.slice(0,6)}</b> {m.body}</p>)}</div><div className="composer"><input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Say something…"/><button onClick={send}><Send/></button></div></section>}
  {room&&hostId&&showGifts&&<GiftPanel roomId={room} recipientId={hostId} onClose={()=>setShowGifts(false)}/>}
  <p className="live-disclaimer">This test verifies device permissions, authenticated room creation and real-time chat. Multi-person audio/video broadcasting requires a streaming provider such as LiveKit or Agora before public launch.</p>
 </main>
}
