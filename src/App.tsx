import AuthGate from "./AuthGate";
import MediaTestRoom from "./MediaTestRoom";
import { useMemo, useState } from "react";
import {
  Bell, ChevronRight, Flame, Headphones, Home, Menu, MessageCircle,
  Mic2, Music2, Play, Plus, Radio, Search, Send, Swords, Trophy,
  Upload, UserRound, Users, X
} from "lucide-react";

type Screen = "home" | "live" | "battles" | "upload" | "profile";

const artists = [
  { name: "EJAY PAPI", role: "Host · DJ", color: "ejay" },
  { name: "Young Flame", role: "Artist", color: "flame" },
  { name: "J-Roc", role: "Artist", color: "jroc" },
  { name: "Ras Vibes", role: "Producer", color: "vibes" }
];

const tracks = [
  { title: "Ice Cold", artist: "BeatMakerC", plays: "23.1K", tag: "Trending" },
  { title: "No Love", artist: "Young Flame", plays: "18.7K", tag: "Battle pick" },
  { title: "On Go", artist: "EJAY PAPI", plays: "12.9K", tag: "New" }
];

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  return <div className={`avatar ${size}`} aria-label={name}>{name.split(" ").map(x => x[0]).join("").slice(0, 2)}</div>;
}

function Brand() {
  return <div className="brand"><span>THE</span><strong>MERGE</strong><em>BY EJAY PAPI</em></div>;
}

function Header({ onMenu }: { onMenu: () => void }) {
  return <header>
    <button className="icon ghost" onClick={onMenu} aria-label="Menu"><Menu /></button>
    <Brand />
    <button className="icon ghost" aria-label="Notifications"><Bell /><i /></button>
  </header>;
}

function HomeFeed({ go }: { go: (screen: Screen) => void }) {
  return <main className="screen">
    <section className="hero">
      <div className="live-orb"><Radio /></div>
      <p className="eyebrow">LIVE NOW · 1.2K LISTENING</p>
      <h1>EJAY PAPI & THE CREATORS</h1>
      <p>Real talk, new sounds and the people moving music forward.</p>
      <button className="primary" onClick={() => go("live")}><Mic2 /> JOIN LIVE PANEL</button>
    </section>

    <section>
      <div className="section-head"><div><span className="eyebrow">THE MAIN EVENT</span><h2>Featured Battle</h2></div><button onClick={() => go("battles")}>View all <ChevronRight /></button></div>
      <button className="battle-card" onClick={() => go("battles")}>
        <div className="battle-top"><span><Swords /> ARTIST BATTLE</span><b>ROUND 1</b></div>
        <div className="versus">
          <div><Avatar name="Young Flame" size="lg" /><strong>YOUNG FLAME</strong><small>“No Love”</small></div>
          <em>VS</em>
          <div><Avatar name="J-Roc" size="lg" /><strong>J-ROC</strong><small>“Pain Real”</small></div>
        </div>
        <div className="vote-preview"><span style={{width:"52%"}}>52%</span><span>48%</span></div>
        <p><Flame /> Voting ends in 01:32:45</p>
      </button>
    </section>

    <section>
      <div className="section-head"><div><span className="eyebrow">WHAT'S MOVING</span><h2>Trending Now</h2></div><button>See all <ChevronRight /></button></div>
      <div className="track-list">{tracks.map((track, i) =>
        <article className="track" key={track.title}>
          <button className="play"><Play fill="currentColor" /></button>
          <div><strong>{track.title}</strong><span>{track.artist}</span></div>
          <div className="track-meta"><small>{track.tag}</small><span>{track.plays} plays</span></div>
          <button className="more">•••</button>
        </article>
      )}</div>
    </section>
  </main>;
}

function LegacyLivePanel() {
  const [messages, setMessages] = useState(["YoungNate: This convo fire!", "MusiicLover: Real talk 🔥"]);
  const [message, setMessage] = useState("");
  const send = () => { if (message.trim()) { setMessages([...messages, `You: ${message.trim()}`]); setMessage(""); } };
  return <main className="screen">
    <div className="page-title"><span className="pulse" /> LIVE PANEL <b>1.2K</b></div>
    <section className="live-room">
      <div className="host"><Avatar name="EJAY PAPI" size="lg" /><div><span>HOST</span><h2>EJAY PAPI</h2><p>Atlanta, GA</p></div><div className="audio-bars"><i/><i/><i/><i/></div></div>
      <div className="speaker-grid">{artists.slice(1).map(a => <div className="speaker" key={a.name}><Avatar name={a.name} /><strong>{a.name}</strong><small>{a.role}</small><span><Mic2 /></span></div>)}</div>
      <div className="topic"><Flame /><div><small>TONIGHT'S TOPIC</small><strong>MusicLover: “Real talk?”</strong></div></div>
      <div className="chat">{messages.map((m,i)=><p key={i}>{m}</p>)}</div>
      <div className="composer"><input value={message} onChange={e=>setMessage(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Type a message..." /><button onClick={send}><Send /></button></div>
      <button className="primary wide"><Mic2 /> REQUEST TO SPEAK</button>
    </section>
  </main>;
}

function LivePanel() { return <MediaTestRoom />; }

function BattleScreen() {
  const [votes, setVotes] = useState<[number, number]>([1240, 1130]);
  const total = votes[0] + votes[1];
  const percentages = useMemo(() => [Math.round(votes[0]/total*100), Math.round(votes[1]/total*100)], [votes,total]);
  return <main className="screen">
    <div className="page-title"><Swords /> MUSIC BATTLE <b>ROUND 1</b></div>
    <section className="battle-stage">
      <p className="eyebrow">ARTIST BATTLE · VOTING OPEN</p>
      <div className="versus large">
        <div><Avatar name="Young Flame" size="lg" /><strong>YOUNG FLAME</strong><small>“No Love”</small><button className="play"><Play fill="currentColor"/></button></div>
        <em>VS</em>
        <div><Avatar name="J-Roc" size="lg" /><strong>J-ROC</strong><small>“Pain Real”</small><button className="play"><Play fill="currentColor"/></button></div>
      </div>
      <div className="timer"><small>TIME LEFT</small><strong>01:32:45</strong></div>
      <div className="vote-bars"><button onClick={()=>setVotes([votes[0]+1,votes[1]])} style={{width:`${percentages[0]}%`}}><b>{percentages[0]}%</b><small>{votes[0].toLocaleString()} votes</small></button><button onClick={()=>setVotes([votes[0],votes[1]+1])}><b>{percentages[1]}%</b><small>{votes[1].toLocaleString()} votes</small></button></div>
      <p className="tap-note">Tap a side to cast your vote</p>
    </section>
    <div className="tabs"><button className="active">DETAILS</button><button>COMMENTS</button><button>STATS</button></div>
    <article className="info-card"><Trophy /><div><strong>Winner advances to The Merge Finals</strong><p>Community voting determines who moves on. One vote per member.</p></div></article>
  </main>;
}

function UploadScreen() {
  const [type,setType]=useState("battle");
  const [submitted,setSubmitted]=useState(false);
  if(submitted) return <main className="screen success"><div><Trophy/><h1>TRACK SUBMITTED</h1><p>Your entry is now pending review by The Merge team.</p><button className="primary" onClick={()=>setSubmitted(false)}>SUBMIT ANOTHER</button></div></main>;
  return <main className="screen">
    <div className="page-title"><Upload /> SUBMIT YOUR MUSIC</div>
    <p className="intro">Choose how you want your sound heard.</p>
    <div className="submission-types">
      {[["battle","⚡","MUSIC BATTLE","Submit a song/beat to compete"],["review","🎧","MUSIC REVIEW","Get feedback and a score from DJs"],["video","🎬","FEATURE / VIDEO","Submit a visual for exposure"]].map(x=>
        <button key={x[0]} className={type===x[0]?"active":""} onClick={()=>setType(x[0])}><b>{x[1]}</b><span><strong>{x[2]}</strong><small>{x[3]}</small></span></button>
      )}
    </div>
    <form className="submit-form" onSubmit={e=>{e.preventDefault();setSubmitted(true)}}>
      <label>TRACK TITLE<input required placeholder="Enter track title" /></label>
      <label>ARTIST / PRODUCER NAME<input required placeholder="Your display name" /></label>
      <label>GENRE<select required defaultValue=""><option value="" disabled>Select genre</option><option>Hip-Hop</option><option>R&B</option><option>Afrobeats</option><option>Pop</option><option>Other</option></select></label>
      <label className="drop"><Upload /><strong>UPLOAD AUDIO</strong><span>MP3, WAV or M4A · Max 25MB</span><input required type="file" accept="audio/*"/></label>
      <button className="primary wide">SUBMIT TRACK</button>
    </form>
  </main>;
}

function Profile() {
  return <main className="screen">
    <section className="profile-head"><div className="cover"/><Avatar name="EJAY PAPI" size="lg"/><h1>EJAY PAPI <span>✓</span></h1><p>@ejaypapi · Atlanta, GA</p><div className="stats"><div><strong>248</strong><span>Following</span></div><div><strong>12.5K</strong><span>Followers</span></div><div><strong>3.2M</strong><span>Plays</span></div></div><div className="profile-actions"><button className="primary">FOLLOW</button><button className="secondary"><MessageCircle/> MESSAGE</button></div></section>
    <div className="tabs"><button className="active">MUSIC</button><button>VIDEOS</button><button>BATTLES</button><button>ABOUT</button></div>
    <div className="track-list">{tracks.filter(x=>x.artist==="EJAY PAPI").concat(tracks.slice(0,2)).map((t,i)=><article className="track" key={i}><button className="play"><Play fill="currentColor"/></button><div><strong>{t.title}</strong><span>EJAY PAPI</span></div><div className="track-meta"><span>{t.plays}</span></div></article>)}</div>
  </main>;
}

const nav: {id:Screen;label:string;icon:any}[]=[
  {id:"home",label:"Home",icon:Home},{id:"live",label:"Live",icon:Radio},
  {id:"battles",label:"Battles",icon:Swords},{id:"upload",label:"Upload",icon:Plus},
  {id:"profile",label:"Profile",icon:UserRound}
];

export default function App() {
  const [screen,setScreen]=useState<Screen>("home");
  const [menu,setMenu]=useState(false);
  return <AuthGate><div className="app-shell">
    <div className="phone">
      <Header onMenu={()=>setMenu(true)} />
      {screen==="home"&&<HomeFeed go={setScreen}/>}
      {screen==="live"&&<LivePanel/>}
      {screen==="battles"&&<BattleScreen/>}
      {screen==="upload"&&<UploadScreen/>}
      {screen==="profile"&&<Profile/>}
      <nav>{nav.map(item=>{const Icon=item.icon;return <button key={item.id} className={screen===item.id?"active":""} onClick={()=>setScreen(item.id)}><Icon/><span>{item.label}</span></button>})}</nav>
      {menu&&<div className="drawer-wrap" onClick={()=>setMenu(false)}><aside onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setMenu(false)}><X/></button><Brand/><button><Search/> Discover</button><button><Users/> Network Hub</button><button><Trophy/> Leaderboard</button><button><Headphones/> Music Reviews</button><button><Music2/> My Library</button><small>THE MERGE · BUILT FOR THE CULTURE</small></aside></div>}
    </div>
  </div></AuthGate>;
}
