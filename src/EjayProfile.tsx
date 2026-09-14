import { ArrowLeft, BadgeCheck, Headphones, MapPin, MessageCircle, Radio, Users } from "lucide-react";
export default function EjayProfile({onBack}:{onBack:()=>void}){
 return <main className="screen">
  <button className="back-link" onClick={onBack}><ArrowLeft/> Back to live</button>
  <section className="profile-head official-profile"><div className="cover ejay-cover"/><div className="ejay-photo official" role="img" aria-label="EJAY PAPI wearing headphones"><span>EJAY<br/>PAPI</span></div>
   <h1>EJAY PAPI <BadgeCheck/></h1><p><MapPin/> Orlando, FL</p>
   <div className="host-label"><Headphones/> OFFICIAL HOST OF THE MERGE</div>
   <div className="stats"><div><strong>12.5K</strong><span>Followers</span></div><div><strong>3.2M</strong><span>Plays</span></div><div><strong>248</strong><span>Following</span></div></div>
   <div className="profile-actions"><button className="primary">FOLLOW EJAY</button><button className="secondary"><MessageCircle/> MESSAGE</button></div>
  </section>
  <article className="info-card"><Radio/><div><strong>Tha Spot with EJAY PAPI</strong><p>Open mic, music, real conversations and community connection.</p></div></article>
  <article className="info-card"><Users/><div><strong>Weekly live panel</strong><p>Members can watch, chat, send gifts and request to join EJAY on camera or microphone.</p></div></article>
 </main>
}
