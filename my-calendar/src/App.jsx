import { useState, useEffect, useRef } from "react";

// ─── COLOR SYSTEM ───────────────────────────────────────────────────────────
// 60% Warm white / off-white backgrounds
// 30% Warm sand / cream tones for surfaces  
// 10% Terracotta / amber / coral accents
const C = {
  bg:           "#FFFCF8",
  surface:      "#FFF7F0",
  card:         "#FFFFFF",
  border:       "#EDE0D4",
  borderLight:  "#F5EDE4",
  primary:      "#C4612F",
  primaryLight: "#E07B4A",
  primaryPale:  "#FAEEE6",
  amber:        "#D4892A",
  amberPale:    "#FDF3E3",
  coral:        "#E05C6E",
  coralPale:    "#FDEAED",
  sage:         "#6B8F71",
  sagePale:     "#EDF3EE",
  gold:         "#C49A2A",
  goldPale:     "#FBF5E0",
  text:         "#2C1810",
  textSub:      "#8A6355",
  textMuted:    "#B89888",
  textLight:    "#D4B8AC",
  shadow:       "rgba(100,50,20,0.08)",
  shadowMd:     "rgba(100,50,20,0.14)",
};

const INTEGRATIONS = [
  { id:"claude",    name:"Claude AI",  icon:"✦", color:C.primaryLight, desc:"AI 일정 도우미" },
  { id:"gmail",     name:"Gmail",      icon:"✉", color:C.coral,        desc:"이메일 일정 동기화" },
  { id:"gmap",      name:"Google Map", icon:"◎", color:C.sage,         desc:"위치 자동 연결" },
  { id:"instagram", name:"Instagram",  icon:"◈", color:C.amber,        desc:"소셜 이벤트 공유" },
];

const EVENT_COLORS = [C.primary, C.coral, C.amber, C.sage, C.gold, "#A0522D"];

const SAMPLE_EVENTS = [
  { id:1,  title:"팀 스탠드업 미팅",   date:"2026-03-05", time:"09:00", endTime:"09:30", color:C.primary, location:"강남구 테헤란로 152",  hasMap:true,  shared:true,  tags:["work"],            integration:"gmail"     },
  { id:2,  title:"런치 미팅",           date:"2026-03-05", time:"12:00", endTime:"13:30", color:C.sage,    location:"중구 을지로",          hasMap:true,  shared:false, tags:["personal"],        integration:"gmap"      },
  { id:3,  title:"Claude 프로젝트 리뷰",date:"2026-03-06", time:"14:00", endTime:"15:30", color:C.amber,   location:"",                    hasMap:false, shared:true,  tags:["work","ai"],       integration:"claude"    },
  { id:4,  title:"인스타 촬영 세션",    date:"2026-03-07", time:"16:00", endTime:"18:00", color:C.coral,   location:"성수동 카페거리",      hasMap:true,  shared:true,  tags:["creative"],        integration:"instagram" },
  { id:5,  title:"주간 리뷰 & 플래닝", date:"2026-03-09", time:"10:00", endTime:"11:00", color:C.primary, location:"",                    hasMap:false, shared:false, tags:["work"],            integration:null        },
  { id:6,  title:"요가 클래스",         date:"2026-03-10", time:"07:00", endTime:"08:00", color:C.sage,    location:"마포구 합정동",        hasMap:true,  shared:false, tags:["health"],          integration:"gmap"      },
  { id:7,  title:"디자인 워크숍",       date:"2026-03-11", time:"13:00", endTime:"17:00", color:C.amber,   location:"홍대 클래스룸",        hasMap:true,  shared:true,  tags:["work","creative"], integration:"gmap"      },
  { id:8,  title:"저녁 약속",           date:"2026-03-12", time:"19:00", endTime:"21:00", color:C.coral,   location:"이태원 경리단길",      hasMap:true,  shared:true,  tags:["personal"],        integration:"instagram" },
  { id:9,  title:"구글 미팅 싱크",      date:"2026-03-13", time:"11:00", endTime:"12:00", color:C.coral,   location:"",                    hasMap:false, shared:true,  tags:["work"],            integration:"gmail"     },
  { id:10, title:"신제품 발표 준비",    date:"2026-03-14", time:"09:00", endTime:"18:00", color:C.amber,   location:"삼성동 코엑스",        hasMap:true,  shared:true,  tags:["work"],            integration:"claude"    },
  { id:11, title:"주말 하이킹",         date:"2026-03-15", time:"06:00", endTime:"14:00", color:C.sage,    location:"북한산",              hasMap:true,  shared:true,  tags:["health","personal"],integration:"gmap"     },
  { id:12, title:"생일 파티 🎂",        date:"2026-03-18", time:"18:00", endTime:"22:00", color:C.primary, location:"강남구 논현동",        hasMap:true,  shared:true,  tags:["personal"],        integration:"instagram" },
  { id:13, title:"분기 보고서 제출",    date:"2026-03-20", time:"10:00", endTime:"11:00", color:C.amber,   location:"",                    hasMap:false, shared:false, tags:["work"],            integration:"gmail"     },
  { id:14, title:"클라이언트 미팅",     date:"2026-03-23", time:"14:00", endTime:"15:30", color:C.primary, location:"여의도",              hasMap:true,  shared:true,  tags:["work"],            integration:"claude"    },
];

const HOURS = Array.from({ length:24 }, (_,i) => i);
const DAYS_KO = ["일","월","화","수","목","금","토"];
const MONTHS_KO = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

function getWeekDates(date) {
  const d = new Date(date), day = d.getDay();
  return Array.from({length:7}, (_,i) => { const nd = new Date(d); nd.setDate(d.getDate()-day+i); return nd; });
}
function getMonthDates(year, month) {
  const first = new Date(year,month,1).getDay();
  const dim = new Date(year,month+1,0).getDate();
  const prev = new Date(year,month,0).getDate();
  const total = Math.ceil((first+dim)/7)*7;
  return Array.from({length:total}, (_,i) => {
    if (i<first) return {date:new Date(year,month-1,prev-first+i+1), current:false};
    if (i>=first+dim) return {date:new Date(year,month+1,i-first-dim+1), current:false};
    return {date:new Date(year,month,i-first+1), current:true};
  });
}
function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

// ─── WIDGETS ────────────────────────────────────────────────────────────────

function ClockWidget() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(()=>setNow(new Date()),1000); return ()=>clearInterval(t); },[]);
  const h=now.getHours(), m=now.getMinutes(), s=now.getSeconds();
  const hDeg=(h%12)*30+m*0.5, mDeg=m*6+s*0.1, sDeg=s*6;
  const arm = (deg,len) => [36+len*Math.cos((deg-90)*Math.PI/180), 36+len*Math.sin((deg-90)*Math.PI/180)];
  const [hx,hy]=arm(hDeg,17), [mx,my]=arm(mDeg,24), [sx,sy]=arm(sDeg,27);
  return (
    <div style={{background:C.card,borderRadius:18,padding:18,border:`1px solid ${C.border}`,boxShadow:`0 2px 14px ${C.shadow}`}}>
      <div style={{fontSize:10,fontWeight:700,color:C.textMuted,letterSpacing:1,marginBottom:12}}>현재 시각</div>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r="34" fill={C.primaryPale} stroke={C.border} strokeWidth="1.5"/>
          {[...Array(12)].map((_,i)=>{
            const a=(i*30-90)*Math.PI/180, r1=i%3===0?28:30;
            return <line key={i} x1={36+r1*Math.cos(a)} y1={36+r1*Math.sin(a)} x2={36+33*Math.cos(a)} y2={36+33*Math.sin(a)} stroke={i%3===0?C.primary:C.borderLight} strokeWidth={i%3===0?2:1}/>;
          })}
          <line x1="36" y1="36" x2={hx} y2={hy} stroke={C.text} strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="36" y1="36" x2={mx} y2={my} stroke={C.primary} strokeWidth="2" strokeLinecap="round"/>
          <line x1="36" y1="36" x2={sx} y2={sy} stroke={C.coral} strokeWidth="1" strokeLinecap="round"/>
          <circle cx="36" cy="36" r="2.5" fill={C.primary}/>
        </svg>
        <div>
          <div style={{fontSize:28,fontWeight:800,color:C.text,letterSpacing:-1,lineHeight:1}}>{String(h).padStart(2,"0")}:{String(m).padStart(2,"0")}</div>
          <div style={{fontSize:12,color:C.textSub,marginTop:2}}>{String(s).padStart(2,"0")}초</div>
          <div style={{fontSize:11,color:C.textMuted,marginTop:4}}>{DAYS_KO[now.getDay()]}요일</div>
        </div>
      </div>
    </div>
  );
}

function WeatherWidget() {
  const forecast = [{d:"목",icon:"☀️",h:"17°",l:"7°"},{d:"금",icon:"⛅",h:"14°",l:"5°"},{d:"토",icon:"🌧",h:"10°",l:"4°"},{d:"일",icon:"⛅",h:"12°",l:"6°"}];
  return (
    <div style={{background:`linear-gradient(135deg,#FFF3E8,#FAEBD7)`,borderRadius:18,padding:18,border:`1px solid ${C.border}`,boxShadow:`0 2px 14px ${C.shadow}`}}>
      <div style={{fontSize:10,fontWeight:700,color:C.textMuted,letterSpacing:1,marginBottom:12}}>날씨 · 서울</div>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:36,lineHeight:1}}>☀️</div>
          <div style={{fontSize:30,fontWeight:800,color:C.text,marginTop:4}}>14°</div>
          <div style={{fontSize:12,color:C.textSub}}>맑음 · 강수 0%</div>
          <div style={{fontSize:11,color:C.textMuted,marginTop:2}}>최고 17° / 최저 7°</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          {forecast.map(d=>(
            <div key={d.d} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <div style={{fontSize:10,color:C.textMuted}}>{d.d}</div>
              <div style={{fontSize:16}}>{d.icon}</div>
              <div style={{fontSize:10,color:C.text,fontWeight:600}}>{d.h}</div>
              <div style={{fontSize:10,color:C.textMuted}}>{d.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UpcomingWidget({ events }) {
  const today = formatDate(new Date(2026,2,5));
  const upcoming = events.filter(e=>e.date>=today).sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time)).slice(0,4);
  return (
    <div style={{background:C.card,borderRadius:18,padding:18,border:`1px solid ${C.border}`,boxShadow:`0 2px 14px ${C.shadow}`}}>
      <div style={{fontSize:10,fontWeight:700,color:C.textMuted,letterSpacing:1,marginBottom:12}}>다가오는 일정</div>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {upcoming.map(ev=>{
          const d=new Date(ev.date), isToday=ev.date===today;
          return (
            <div key={ev.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:12,background:C.surface,border:`1px solid ${C.borderLight}`}}>
              <div style={{width:34,height:34,borderRadius:10,background:`${ev.color}18`,border:`1px solid ${ev.color}35`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <div style={{fontSize:14,fontWeight:800,color:ev.color,lineHeight:1}}>{d.getDate()}</div>
                <div style={{fontSize:9,color:ev.color,fontWeight:600}}>{MONTHS_KO[d.getMonth()]}</div>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.title}</div>
                <div style={{fontSize:10,color:C.textSub,marginTop:1}}>{ev.time}{ev.location?` · ${ev.location}`:""}</div>
              </div>
              {isToday&&<span style={{fontSize:9,background:C.primaryPale,color:C.primary,padding:"2px 6px",borderRadius:8,fontWeight:700,flexShrink:0}}>오늘</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TodoWidget() {
  const [todos, setTodos] = useState([
    {id:1,text:"발표 자료 완성",done:false,p:"high"},
    {id:2,text:"이메일 답장",done:true,p:"mid"},
    {id:3,text:"주간 보고서 작성",done:false,p:"high"},
    {id:4,text:"점심 예약",done:false,p:"low"},
  ]);
  const [input, setInput] = useState("");
  const pColor = {high:C.coral, mid:C.amber, low:C.sage};
  const add = () => { if(!input.trim()) return; setTodos(p=>[...p,{id:Date.now(),text:input,done:false,p:"mid"}]); setInput(""); };
  return (
    <div style={{background:C.card,borderRadius:18,padding:18,border:`1px solid ${C.border}`,boxShadow:`0 2px 14px ${C.shadow}`}}>
      <div style={{fontSize:10,fontWeight:700,color:C.textMuted,letterSpacing:1,marginBottom:12}}>할 일 목록</div>
      <div style={{display:"flex",gap:6,marginBottom:10}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="새 할 일..." style={{flex:1,padding:"7px 10px",borderRadius:10,border:`1px solid ${C.border}`,fontSize:12,color:C.text,background:C.surface,outline:"none",fontFamily:"inherit"}}/>
        <button onClick={add} style={{padding:"7px 12px",background:C.primary,border:"none",borderRadius:10,color:"#fff",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>+</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:5,maxHeight:150,overflowY:"auto"}}>
        {todos.map(t=>(
          <div key={t.id} onClick={()=>setTodos(p=>p.map(x=>x.id===t.id?{...x,done:!x.done}:x))} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:9,cursor:"pointer",background:t.done?C.surface:"transparent"}}>
            <div style={{width:16,height:16,borderRadius:5,border:`2px solid ${t.done?C.sage:C.border}`,background:t.done?C.sage:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {t.done&&<span style={{color:"#fff",fontSize:10,lineHeight:1}}>✓</span>}
            </div>
            <div style={{flex:1,fontSize:12,color:t.done?C.textMuted:C.text,textDecoration:t.done?"line-through":"none"}}>{t.text}</div>
            <div style={{width:6,height:6,borderRadius:"50%",background:pColor[t.p],flexShrink:0}}/>
          </div>
        ))}
      </div>
      <div style={{marginTop:8,fontSize:11,color:C.textMuted}}>{todos.filter(t=>t.done).length}/{todos.length} 완료</div>
    </div>
  );
}

function StatsWidget({ events }) {
  const month = events.filter(e=>e.date.startsWith("2026-03"));
  const byTag = {};
  month.forEach(e=>(e.tags||[]).forEach(t=>{byTag[t]=(byTag[t]||0)+1;}));
  const top = Object.entries(byTag).sort((a,b)=>b[1]-a[1]).slice(0,4);
  return (
    <div style={{background:C.card,borderRadius:18,padding:18,border:`1px solid ${C.border}`,boxShadow:`0 2px 14px ${C.shadow}`}}>
      <div style={{fontSize:10,fontWeight:700,color:C.textMuted,letterSpacing:1,marginBottom:12}}>3월 통계</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,marginBottom:12}}>
        {[[month.length,"총 일정",C.primary],[month.filter(e=>e.shared).length,"공유",C.coral],[month.filter(e=>e.hasMap).length,"위치 포함",C.sage]].map(([v,l,col])=>(
          <div key={l} style={{background:`${col}12`,borderRadius:11,padding:"10px 6px",textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:800,color:col,lineHeight:1}}>{v}</div>
            <div style={{fontSize:10,color:C.textSub,marginTop:3}}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
        {top.map(([tag,cnt])=>(
          <span key={tag} style={{fontSize:11,color:C.primary,background:C.primaryPale,padding:"3px 8px",borderRadius:10,fontWeight:600}}>#{tag} {cnt}</span>
        ))}
      </div>
    </div>
  );
}

function QuoteWidget() {
  const q = {text:"시간은 가장 공평하게 주어진 자원이다.", author:"피터 드러커"};
  return (
    <div style={{background:`linear-gradient(135deg,${C.primaryPale},${C.amberPale})`,borderRadius:18,padding:18,border:`1px solid ${C.border}`,boxShadow:`0 2px 14px ${C.shadow}`}}>
      <div style={{fontSize:10,fontWeight:700,color:C.textMuted,letterSpacing:1,marginBottom:10}}>오늘의 명언</div>
      <div style={{fontSize:14,color:C.text,lineHeight:1.7,fontStyle:"italic"}}>"{q.text}"</div>
      <div style={{fontSize:11,color:C.textSub,marginTop:8,textAlign:"right"}}>— {q.author}</div>
    </div>
  );
}

const ALL_WIDGETS = ["clock","weather","upcoming","todo","stats","quote"];
const WIDGET_LABELS = {clock:"⏰ 시계",weather:"🌤 날씨",upcoming:"📅 다가오는 일정",todo:"✅ 할 일",stats:"📊 통계",quote:"💬 명언"};

function WidgetPanel({ events, visible, setVisible }) {
  return (
    <div style={{width:258,background:C.surface,borderLeft:`1px solid ${C.border}`,overflowY:"auto",flexShrink:0}}>
      <div style={{padding:"16px 14px 10px"}}>
        <div style={{fontSize:11,fontWeight:800,color:C.textSub,letterSpacing:1,marginBottom:10}}>위젯</div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {ALL_WIDGETS.map(w=>(
            <button key={w} onClick={()=>setVisible(p=>p.includes(w)?p.filter(x=>x!==w):[...p,w])}
              style={{fontSize:10,padding:"4px 8px",borderRadius:8,border:`1px solid ${visible.includes(w)?C.primary:C.border}`,background:visible.includes(w)?C.primaryPale:"transparent",color:visible.includes(w)?C.primary:C.textMuted,cursor:"pointer",fontFamily:"inherit",fontWeight:visible.includes(w)?700:400,transition:"all 0.15s"}}>
              {WIDGET_LABELS[w].split(" ")[0]} {WIDGET_LABELS[w].split(" ").slice(1).join(" ")}
            </button>
          ))}
        </div>
      </div>
      <div style={{padding:"4px 12px 20px",display:"flex",flexDirection:"column",gap:11}}>
        {visible.includes("clock")    && <ClockWidget/>}
        {visible.includes("weather")  && <WeatherWidget/>}
        {visible.includes("upcoming") && <UpcomingWidget events={events}/>}
        {visible.includes("todo")     && <TodoWidget/>}
        {visible.includes("stats")    && <StatsWidget events={events}/>}
        {visible.includes("quote")    && <QuoteWidget/>}
      </div>
    </div>
  );
}

// ─── EVENT PIECES ────────────────────────────────────────────────────────────

function EventDot({ event, onClick }) {
  return (
    <div onClick={e=>{e.stopPropagation();onClick(event);}}
      style={{background:`${event.color}14`,borderLeft:`3px solid ${event.color}`,borderRadius:5,padding:"2px 5px",fontSize:10,color:event.color,cursor:"pointer",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",maxWidth:"100%",lineHeight:1.5,display:"flex",alignItems:"center",gap:3,fontWeight:600}}>
      {event.hasMap&&<span style={{fontSize:8}}>◎</span>}
      {event.shared&&<span style={{fontSize:8}}>⊕</span>}
      {event.title}
    </div>
  );
}

function EventModal({ event, onClose }) {
  const intg = INTEGRATIONS.find(i=>i.id===event.integration);
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(44,24,16,0.3)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(6px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:24,padding:28,width:380,maxWidth:"90vw",boxShadow:`0 20px 60px ${C.shadowMd}`}}>
        <div style={{display:"flex",gap:12,marginBottom:20,alignItems:"flex-start"}}>
          <div style={{width:5,borderRadius:3,background:event.color,alignSelf:"stretch",flexShrink:0}}/>
          <div style={{flex:1}}>
            <div style={{fontSize:19,fontWeight:800,color:C.text}}>{event.title}</div>
            <div style={{fontSize:12,color:C.textSub,marginTop:4}}>{event.date} · {event.time} – {event.endTime}</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.textMuted,fontSize:20,cursor:"pointer",padding:4,lineHeight:1}}>✕</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:9}}>
          {event.hasMap&&event.location&&(
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:C.sagePale,borderRadius:13,border:`1px solid ${C.sage}30`}}>
              <span style={{fontSize:18,color:C.sage}}>◎</span>
              <div style={{flex:1}}>
                <div style={{fontSize:10,color:C.sage,fontWeight:700,letterSpacing:0.5}}>위치</div>
                <div style={{fontSize:13,color:C.text}}>{event.location}</div>
              </div>
              <button style={{fontSize:11,color:C.sage,background:`${C.sage}18`,border:`1px solid ${C.sage}40`,borderRadius:8,padding:"4px 10px",cursor:"pointer",fontFamily:"inherit"}}>지도 열기</button>
            </div>
          )}
          {event.shared&&(
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:C.primaryPale,borderRadius:13,border:`1px solid ${C.primary}30`}}>
              <span style={{fontSize:18,color:C.primary}}>⊕</span>
              <div style={{flex:1}}>
                <div style={{fontSize:10,color:C.primary,fontWeight:700,letterSpacing:0.5}}>공유된 일정</div>
                <div style={{fontSize:12,color:C.textSub}}>다른 사람들과 공유됨</div>
              </div>
              <button style={{fontSize:11,color:C.primary,background:C.primaryPale,border:`1px solid ${C.primary}40`,borderRadius:8,padding:"4px 10px",cursor:"pointer",fontFamily:"inherit"}}>공유 관리</button>
            </div>
          )}
          {intg&&(
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:`${intg.color}10`,borderRadius:13,border:`1px solid ${intg.color}30`}}>
              <span style={{fontSize:18,color:intg.color}}>{intg.icon}</span>
              <div>
                <div style={{fontSize:10,color:intg.color,fontWeight:700,letterSpacing:0.5}}>{intg.name} 연동</div>
                <div style={{fontSize:12,color:C.textSub}}>{intg.desc}</div>
              </div>
            </div>
          )}
          {event.tags?.length>0&&(
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {event.tags.map(tag=><span key={tag} style={{fontSize:11,color:C.textSub,background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,padding:"3px 10px"}}>#{tag}</span>)}
            </div>
          )}
        </div>
        <div style={{display:"flex",gap:8,marginTop:20}}>
          <button style={{flex:1,padding:"11px",background:C.primary,border:"none",borderRadius:12,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>수정</button>
          <button style={{padding:"11px 16px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,color:C.textSub,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>삭제</button>
        </div>
      </div>
    </div>
  );
}

function AddEventModal({ date, onClose, onAdd }) {
  const [form, setForm] = useState({title:"",time:"09:00",endTime:"10:00",location:"",hasMap:false,shared:false,integration:null,tags:"",color:C.primary});
  const go = () => { if(!form.title.trim()) return; onAdd({...form,id:Date.now(),date:formatDate(date),tags:form.tags?form.tags.split(",").map(t=>t.trim()):[]}); onClose(); };
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(44,24,16,0.3)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(6px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:24,padding:28,width:400,maxWidth:"90vw",boxShadow:`0 20px 60px ${C.shadowMd}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div style={{fontSize:16,fontWeight:800,color:C.text}}>새 일정 추가</div>
          <div style={{fontSize:11,color:C.textSub,background:C.primaryPale,padding:"3px 10px",borderRadius:8,fontWeight:600}}>{formatDate(date)}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:9}}>
          <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="일정 제목" style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 14px",color:C.text,fontSize:14,outline:"none",fontFamily:"inherit",fontWeight:600}}/>
          <div style={{display:"flex",gap:8}}>
            <input type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})} style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 14px",color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
            <input type="time" value={form.endTime} onChange={e=>setForm({...form,endTime:e.target.value})} style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 14px",color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
          </div>
          <input value={form.location} onChange={e=>setForm({...form,location:e.target.value,hasMap:e.target.value.length>0})} placeholder="◎ 위치 추가 (Google Map 연동)" style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 14px",color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
          <div style={{display:"flex",gap:7,alignItems:"center"}}>
            <span style={{fontSize:11,color:C.textMuted,flexShrink:0}}>색상</span>
            {EVENT_COLORS.map(clr=><button key={clr} onClick={()=>setForm({...form,color:clr})} style={{width:22,height:22,borderRadius:"50%",background:clr,border:form.color===clr?`3px solid ${C.text}`:"3px solid transparent",cursor:"pointer"}}/>)}
          </div>
          <div style={{display:"flex",gap:7}}>
            <button onClick={()=>setForm({...form,shared:!form.shared})} style={{flex:1,padding:"8px",background:form.shared?C.primaryPale:C.surface,border:`1px solid ${form.shared?C.primary:C.border}`,borderRadius:10,color:form.shared?C.primary:C.textSub,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>⊕ {form.shared?"공유됨":"공유하기"}</button>
            <button onClick={()=>setForm({...form,hasMap:!form.hasMap})} style={{flex:1,padding:"8px",background:form.hasMap?C.sagePale:C.surface,border:`1px solid ${form.hasMap?C.sage:C.border}`,borderRadius:10,color:form.hasMap?C.sage:C.textSub,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>◎ {form.hasMap?"지도 연결됨":"지도 추가"}</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {INTEGRATIONS.map(intg=>(
              <button key={intg.id} onClick={()=>setForm({...form,integration:form.integration===intg.id?null:intg.id})}
                style={{padding:"8px 10px",background:form.integration===intg.id?`${intg.color}14`:C.surface,border:`1px solid ${form.integration===intg.id?intg.color:C.border}`,borderRadius:10,color:form.integration===intg.id?intg.color:C.textSub,cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",gap:5,fontFamily:"inherit"}}>
                <span>{intg.icon}</span>{intg.name}
              </button>
            ))}
          </div>
          <input value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} placeholder="태그 (쉼표 구분: work, personal)" style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 14px",color:C.text,fontSize:12,outline:"none",fontFamily:"inherit"}}/>
        </div>
        <div style={{display:"flex",gap:8,marginTop:18}}>
          <button onClick={go} style={{flex:1,padding:"12px",background:C.primary,border:"none",borderRadius:12,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:14,fontFamily:"inherit"}}>일정 추가</button>
          <button onClick={onClose} style={{padding:"12px 16px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,color:C.textSub,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>취소</button>
        </div>
      </div>
    </div>
  );
}

// ─── CALENDAR VIEWS ──────────────────────────────────────────────────────────

function MonthView({ currentDate, events, onDateClick, onEventClick }) {
  const dates = getMonthDates(currentDate.getFullYear(), currentDate.getMonth());
  const today = formatDate(new Date(2026,2,5));
  return (
    <div style={{flex:1,overflow:"auto",padding:14}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,marginBottom:6}}>
        {DAYS_KO.map((d,i)=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:i===0?"#C4614F":i===6?"#4F7EC4":C.textMuted,padding:"5px 0",letterSpacing:1}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
        {dates.map(({date,current},idx)=>{
          const ds=formatDate(date), evs=events.filter(e=>e.date===ds);
          const isToday=ds===today, isSun=date.getDay()===0, isSat=date.getDay()===6;
          return (
            <div key={idx} onClick={()=>onDateClick(date)}
              style={{minHeight:86,padding:6,borderRadius:12,background:isToday?C.primaryPale:current?C.card:"transparent",border:`1px solid ${isToday?C.primary:current?C.borderLight:"transparent"}`,cursor:"pointer",boxShadow:current?`0 1px 5px ${C.shadow}`:"none",transition:"box-shadow 0.15s"}}>
              <div style={{fontSize:12,fontWeight:isToday?800:500,marginBottom:4,width:22,height:22,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:isToday?C.primary:"transparent",color:isToday?"#fff":!current?C.textLight:isSun?"#C4614F":isSat?"#4F7EC4":C.text}}>
                {date.getDate()}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:2}}>
                {evs.slice(0,3).map(ev=><EventDot key={ev.id} event={ev} onClick={onEventClick}/>)}
                {evs.length>3&&<div style={{fontSize:10,color:C.textMuted,paddingLeft:3}}>+{evs.length-3}개 더</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ currentDate, events, onDateClick, onEventClick }) {
  const week = getWeekDates(currentDate), today=formatDate(new Date(2026,2,5));
  const ref = useRef(null);
  useEffect(()=>{ if(ref.current) ref.current.scrollTop=7*60; },[]);
  return (
    <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
      <div style={{display:"grid",gridTemplateColumns:"52px repeat(7,1fr)",borderBottom:`1px solid ${C.border}`,flexShrink:0,background:C.card}}>
        <div/>
        {week.map((d,i)=>{
          const isToday=formatDate(d)===today;
          return (
            <div key={i} onClick={()=>onDateClick(d)} style={{textAlign:"center",padding:"10px 4px",cursor:"pointer",borderLeft:`1px solid ${C.borderLight}`}}>
              <div style={{fontSize:10,color:i===0?"#C4614F":i===6?"#4F7EC4":C.textSub,fontWeight:700}}>{DAYS_KO[i]}</div>
              <div style={{width:30,height:30,borderRadius:"50%",background:isToday?C.primary:"transparent",display:"flex",alignItems:"center",justifyContent:"center",margin:"2px auto 0",fontSize:14,fontWeight:700,color:isToday?"#fff":C.text}}>{d.getDate()}</div>
            </div>
          );
        })}
      </div>
      <div ref={ref} style={{flex:1,overflow:"auto"}}>
        <div style={{display:"grid",gridTemplateColumns:"52px repeat(7,1fr)"}}>
          <div>{HOURS.map(h=><div key={h} style={{height:60,display:"flex",alignItems:"flex-start",justifyContent:"flex-end",paddingRight:8,paddingTop:4}}><span style={{fontSize:10,color:C.textMuted}}>{h===0?"":`${h}:00`}</span></div>)}</div>
          {week.map((d,di)=>{
            const ds=formatDate(d), evs=events.filter(e=>e.date===ds);
            return (
              <div key={di} style={{borderLeft:`1px solid ${C.borderLight}`,position:"relative"}}>
                {HOURS.map(h=><div key={h} onClick={()=>onDateClick(d)} style={{height:60,borderTop:`1px solid ${C.borderLight}`,cursor:"pointer"}}/>)}
                {evs.map(ev=>{
                  const [sh,sm]=ev.time.split(":").map(Number), [eh,em]=ev.endTime.split(":").map(Number);
                  const top=sh*60+sm, h2=Math.max(26,(eh*60+em)-(sh*60+sm));
                  return (
                    <div key={ev.id} onClick={e=>{e.stopPropagation();onEventClick(ev);}}
                      style={{position:"absolute",top,left:3,right:3,height:h2,background:`${ev.color}16`,borderLeft:`3px solid ${ev.color}`,borderRadius:7,padding:"3px 6px",cursor:"pointer",overflow:"hidden",zIndex:1}}>
                      <div style={{fontSize:10,fontWeight:700,color:ev.color,lineHeight:1.3}}>{ev.title}</div>
                      {h2>40&&<div style={{fontSize:9,color:C.textSub}}>{ev.time}</div>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DayView({ currentDate, events, onEventClick }) {
  const ds=formatDate(currentDate), evs=events.filter(e=>e.date===ds);
  const ref=useRef(null);
  useEffect(()=>{ if(ref.current) ref.current.scrollTop=7*80; },[]);
  return (
    <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"12px 24px",borderBottom:`1px solid ${C.border}`,flexShrink:0,background:C.card}}>
        <div style={{fontSize:24,fontWeight:900,color:C.text,letterSpacing:-0.5}}>
          {currentDate.getMonth()+1}월 {currentDate.getDate()}일
          <span style={{fontSize:14,color:C.textSub,marginLeft:10,fontWeight:400}}>{DAYS_KO[currentDate.getDay()]}요일</span>
        </div>
        <div style={{fontSize:12,color:C.textSub,marginTop:3}}>{evs.length}개 일정</div>
      </div>
      <div ref={ref} style={{flex:1,overflow:"auto",display:"flex"}}>
        <div style={{width:64,flexShrink:0}}>
          {HOURS.map(h=><div key={h} style={{height:80,display:"flex",alignItems:"flex-start",justifyContent:"flex-end",paddingRight:12,paddingTop:6}}><span style={{fontSize:11,color:C.textMuted}}>{h===0?"":`${h}:00`}</span></div>)}
        </div>
        <div style={{flex:1,position:"relative",borderLeft:`1px solid ${C.border}`}}>
          {HOURS.map(h=><div key={h} style={{height:80,borderTop:`1px solid ${C.borderLight}`}}/>)}
          {evs.map(ev=>{
            const [sh,sm]=ev.time.split(":").map(Number), [eh,em]=ev.endTime.split(":").map(Number);
            const top=(sh*60+sm)*80/60, h2=Math.max(40,((eh*60+em)-(sh*60+sm))*80/60);
            const intg=INTEGRATIONS.find(i=>i.id===ev.integration);
            return (
              <div key={ev.id} onClick={()=>onEventClick(ev)}
                style={{position:"absolute",top,left:8,right:16,height:h2,background:C.card,borderLeft:`4px solid ${ev.color}`,borderRadius:13,padding:"10px 14px",cursor:"pointer",boxShadow:`0 2px 12px ${C.shadow}`,border:`1px solid ${ev.color}22`,zIndex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{fontWeight:700,fontSize:14,color:C.text}}>{ev.title}</div>
                  <div style={{display:"flex",gap:4}}>
                    {ev.hasMap&&<span style={{fontSize:12,color:C.sage}}>◎</span>}
                    {ev.shared&&<span style={{fontSize:12,color:C.primary}}>⊕</span>}
                  </div>
                </div>
                {h2>55&&<div style={{fontSize:12,color:C.textSub,marginTop:3}}>{ev.time} – {ev.endTime}</div>}
                {h2>75&&ev.location&&<div style={{fontSize:11,color:C.sage,marginTop:3}}>◎ {ev.location}</div>}
                {h2>95&&intg&&<div style={{marginTop:5,fontSize:10,color:intg.color,fontWeight:600}}>{intg.icon} {intg.name}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────

function Sidebar({ view, setView, events, connected, onToggle }) {
  const today=formatDate(new Date(2026,2,5)), todayEvs=events.filter(e=>e.date===today);
  return (
    <div style={{width:208,background:C.card,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
      <div style={{padding:"20px 16px 14px",display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:34,height:34,borderRadius:11,background:`linear-gradient(135deg,${C.primary},${C.amber})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,boxShadow:`0 4px 12px ${C.primary}35`}}>◈</div>
        <div>
          <div style={{fontSize:15,fontWeight:900,color:C.text,letterSpacing:-0.5}}>Aether</div>
          <div style={{fontSize:10,color:C.textMuted}}>Smart Calendar</div>
        </div>
      </div>
      <div style={{padding:"0 12px 10px"}}>
        <div style={{fontSize:10,color:C.textMuted,letterSpacing:1,fontWeight:700,padding:"4px 6px 6px"}}>보기 방식</div>
        {[["month","▦","월간 보기"],["week","▤","주간 보기"],["day","▥","일간 보기"]].map(([v,icon,label])=>(
          <button key={v} onClick={()=>setView(v)}
            style={{display:"flex",alignItems:"center",width:"100%",padding:"8px 10px",borderRadius:10,border:"none",background:view===v?C.primaryPale:"transparent",color:view===v?C.primary:C.textSub,cursor:"pointer",fontSize:13,fontWeight:view===v?700:400,textAlign:"left",gap:8,fontFamily:"inherit",marginBottom:2}}>
            <span style={{fontSize:14}}>{icon}</span>{label}
          </button>
        ))}
      </div>
      <div style={{padding:"0 12px",flex:1,overflow:"auto"}}>
        <div style={{fontSize:10,color:C.textMuted,letterSpacing:1,fontWeight:700,padding:"4px 6px 6px"}}>오늘 일정 ({todayEvs.length})</div>
        {todayEvs.length===0&&<div style={{fontSize:12,color:C.textMuted,padding:"6px"}}>오늘 일정이 없어요 ☀️</div>}
        {todayEvs.map(ev=>(
          <div key={ev.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:8,marginBottom:3,background:C.surface}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:ev.color,flexShrink:0}}/>
            <div style={{flex:1,fontSize:11,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.title}</div>
            <div style={{fontSize:10,color:C.textMuted,flexShrink:0}}>{ev.time}</div>
          </div>
        ))}
      </div>
      <div style={{padding:"10px 12px 16px",borderTop:`1px solid ${C.border}`}}>
        <div style={{fontSize:10,color:C.textMuted,letterSpacing:1,fontWeight:700,marginBottom:7}}>연동 서비스</div>
        {INTEGRATIONS.map(intg=>(
          <div key={intg.id} onClick={()=>onToggle(intg.id)}
            style={{display:"flex",alignItems:"center",gap:8,padding:"7px 9px",borderRadius:10,background:connected[intg.id]?`${intg.color}10`:C.surface,border:`1px solid ${connected[intg.id]?intg.color+"28":C.borderLight}`,cursor:"pointer",marginBottom:5,transition:"all 0.18s"}}>
            <span style={{fontSize:14,color:intg.color}}>{intg.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:11,fontWeight:600,color:connected[intg.id]?C.text:C.textSub}}>{intg.name}</div>
            </div>
            <div style={{width:28,height:16,borderRadius:8,background:connected[intg.id]?intg.color:C.border,position:"relative",transition:"background 0.2s",flexShrink:0}}>
              <div style={{width:12,height:12,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:connected[intg.id]?14:2,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.18)"}}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState("month");
  const [date, setDate] = useState(new Date(2026,2,5));
  const [events, setEvents] = useState(SAMPLE_EVENTS);
  const [selEvent, setSelEvent] = useState(null);
  const [addDate, setAddDate] = useState(null);
  const [connected, setConnected] = useState({claude:true,gmail:true,gmap:false,instagram:false});
  const [sidebar, setSidebar] = useState(true);
  const [widgets, setWidgets] = useState(true);
  const [visW, setVisW] = useState(["clock","upcoming","weather"]);

  const nav = dir => {
    const d=new Date(date);
    if(view==="month") d.setMonth(d.getMonth()+dir);
    else if(view==="week") d.setDate(d.getDate()+dir*7);
    else d.setDate(d.getDate()+dir);
    setDate(d);
  };

  const title = () => {
    if(view==="month") return `${date.getFullYear()}년 ${MONTHS_KO[date.getMonth()]}`;
    if(view==="week"){const w=getWeekDates(date);return `${w[0].getMonth()+1}월 ${w[0].getDate()}일 – ${w[6].getMonth()+1}월 ${w[6].getDate()}일`;}
    return `${date.getMonth()+1}월 ${date.getDate()}일`;
  };

  return (
    <div style={{display:"flex",height:"100vh",background:C.bg,fontFamily:"'Apple SD Gothic Neo','Malgun Gothic',sans-serif",color:C.text,overflow:"hidden"}}>
      {sidebar&&<Sidebar view={view} setView={setView} events={events} connected={connected} onToggle={id=>setConnected(p=>({...p,[id]:!p[id]}))}/>}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",padding:"10px 18px",borderBottom:`1px solid ${C.border}`,gap:10,flexShrink:0,background:C.card}}>
          <button onClick={()=>setSidebar(p=>!p)} style={{background:"none",border:`1px solid ${C.border}`,color:C.textSub,cursor:"pointer",fontSize:16,padding:"5px 9px",borderRadius:8}}>☰</button>
          <div style={{display:"flex",gap:4}}>
            <button onClick={()=>nav(-1)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,cursor:"pointer",padding:"5px 12px",fontSize:15}}>‹</button>
            <button onClick={()=>setDate(new Date(2026,2,5))} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.textSub,cursor:"pointer",padding:"5px 12px",fontSize:12,fontFamily:"inherit"}}>오늘</button>
            <button onClick={()=>nav(1)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,cursor:"pointer",padding:"5px 12px",fontSize:15}}>›</button>
          </div>
          <div style={{fontSize:18,fontWeight:900,color:C.text,flex:1,letterSpacing:-0.5}}>{title()}</div>
          <div style={{display:"flex",gap:3,background:C.surface,borderRadius:10,padding:3,border:`1px solid ${C.border}`}}>
            {[["month","월"],["week","주"],["day","일"]].map(([v,l])=>(
              <button key={v} onClick={()=>setView(v)}
                style={{padding:"5px 14px",borderRadius:8,border:"none",background:view===v?C.primary:"transparent",color:view===v?"#fff":C.textSub,cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit",transition:"all 0.15s"}}>
                {l}
              </button>
            ))}
          </div>
          <button onClick={()=>setAddDate(date)}
            style={{background:C.primary,border:"none",borderRadius:10,color:"#fff",cursor:"pointer",padding:"8px 18px",fontSize:13,fontWeight:700,boxShadow:`0 3px 12px ${C.primary}35`,fontFamily:"inherit"}}>
            ＋ 새 일정
          </button>
          <button onClick={()=>setWidgets(p=>!p)}
            style={{background:widgets?C.primaryPale:C.surface,border:`1px solid ${widgets?C.primary:C.border}`,borderRadius:9,color:widgets?C.primary:C.textSub,cursor:"pointer",padding:"7px 12px",fontSize:12,fontFamily:"inherit",fontWeight:600}}>
            ◧ 위젯
          </button>
          <div style={{display:"flex",gap:4}}>
            {INTEGRATIONS.filter(i=>connected[i.id]).map(intg=>(
              <div key={intg.id} title={intg.name} style={{width:30,height:30,borderRadius:8,background:`${intg.color}14`,border:`1px solid ${intg.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:intg.color,cursor:"pointer"}}>{intg.icon}</div>
            ))}
          </div>
        </div>
        {/* Body */}
        <div style={{flex:1,overflow:"hidden",display:"flex"}}>
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            {view==="month"&&<MonthView currentDate={date} events={events} onDateClick={setAddDate} onEventClick={setSelEvent}/>}
            {view==="week"&&<WeekView currentDate={date} events={events} onDateClick={setAddDate} onEventClick={setSelEvent}/>}
            {view==="day"&&<DayView currentDate={date} events={events} onEventClick={setSelEvent}/>}
          </div>
          {widgets&&<WidgetPanel events={events} visible={visW} setVisible={setVisW}/>}
        </div>
      </div>
      {selEvent&&<EventModal event={selEvent} onClose={()=>setSelEvent(null)}/>}
      {addDate&&<AddEventModal date={addDate} onClose={()=>setAddDate(null)} onAdd={ev=>setEvents(p=>[...p,ev])}/>}
    </div>
  );
}
