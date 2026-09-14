import { useEffect, useState } from "react";
import { Gift, X } from "lucide-react";
import { supabase } from "./supabase";
type Item={id:string;name:string;icon:string;coin_cost:number};
export default function GiftPanel({roomId,recipientId,onClose}:{roomId:string;recipientId:string;onClose:()=>void}){
 const [items,setItems]=useState<Item[]>([]),[notice,setNotice]=useState("");
 useEffect(()=>{supabase.from("gift_catalog").select("id,name,icon,coin_cost").eq("active",true).order("coin_cost").then(({data})=>setItems((data as Item[])??[]))},[]);
 async function send(gift:Item){const {data:{user}}=await supabase.auth.getUser();if(!user)return;const {error}=await supabase.from("live_gifts").insert({room_id:roomId,sender_id:user.id,recipient_id:recipientId,gift_id:gift.id});setNotice(error?.message??`${gift.icon} ${gift.name} sent!`)}
 return <div className="gift-overlay" onClick={onClose}><section className="gift-sheet" onClick={e=>e.stopPropagation()}><button className="close" onClick={onClose}><X/></button><h2><Gift/> SEND A GIFT</h2><p>Support the live host and light up the room.</p><div className="gift-grid">{items.map(g=><button key={g.id} onClick={()=>send(g)}><b>{g.icon}</b><strong>{g.name}</strong><span>{g.coin_cost} coins</span></button>)}</div>{notice&&<div className="auth-message">{notice}</div>}<small>Test gifting is enabled. Paid coin purchases require checkout before monetized launch.</small></section></div>
}
