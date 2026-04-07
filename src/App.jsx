import { useState, useEffect, useRef } from "react";
import LoginPage from "./LoginPage.jsx";
import UsersAdmin from "./UsersAdmin.jsx";
import { getSession, clearSession, can } from "./auth.js";

const PARTS = {
  "Suspensão e Direção": ["Amortecedor dianteiro","Amortecedor traseiro","Mola dianteira","Mola traseira","Barra estabilizadora","Pivô dianteiro","Pivô traseiro","Bandeja superior","Bandeja inferior","Cubo de roda","Rolamento de roda","Terminal de direção","Caixa de direção","Bomba de direção hidráulica","Bieleta","Bucha de bandeja","Buchas da suspensão"],
  "Sistema de Freios": ["Pastilha dianteira","Pastilha traseira","Disco dianteiro","Disco traseiro","Tambor de freio","Lona de freio","Cilindro de roda","Cilindro mestre","Servo freio","Mangueira de freio","Fluido de freio DOT4","Pinça de freio","Kit reparo de pinça"],
  "Elétrica e Bateria": ["Bateria 60Ah","Bateria 70Ah","Bateria 100Ah","Bateria 150Ah","Alternador","Motor de arranque","Vela de ignição","Cabo de vela","Relé","Fusível","Sensor O2","Sensor temperatura","Farol completo","Lanterna traseira","Módulo de injeção","Regulador de tensão"],
  "Pneus e Rodas": ["Pneu 195/75 R16","Pneu 205/75 R16","Pneu 215/75 R17.5","Pneu 225/75 R17.5","Pneu 235/75 R17.5","Pneu estepe","Roda de aço","Roda de liga leve","Válvula de pneu","Balanceamento","Alinhamento","Porca de roda","Parafuso de roda"],
  "Funilaria e Pintura": ["Para-choque dianteiro","Para-choque traseiro","Capô","Porta dianteira E","Porta dianteira D","Porta traseira E","Porta traseira D","Paralama dianteiro","Paralama traseiro","Lataria geral","Pintura completa","Pintura parcial","Parabrisa","Vidro traseiro","Vidro lateral","Retrovisor"],
  "Filtros e Lubrificação": ["Filtro de óleo","Filtro de ar","Filtro de combustível","Filtro de cabine","Óleo 5W30","Óleo 10W40","Óleo 15W40","Óleo de câmbio","Óleo de diferencial","Fluido de transmissão","Graxa especial","Óleo hidráulico"],
  "Motor e Transmissão": ["Correia dentada kit","Correia do alternador","Correia do ar-cond","Tensor de correia","Bomba d'água","Junta do cabeçote","Válvulas","Disco de embreagem","Platô de embreagem","Rolamento piloto","Rolamento de apoio","Semi-eixo D","Semi-eixo E","Junta homocinética","Virabrequim","Pistão","Anéis do pistão"],
  "Arrefecimento": ["Radiador completo","Reservatório de expansão","Mangueira superior","Mangueira inferior","Mangueira de aquecimento","Termostato","Ventoinha elétrica","Acionador da ventoinha","Bomba d'água","Fluido de arrefecimento","Tampa do radiador","Interruptor temperatura"],
};
const URGENCY = { baixa:{label:"Baixa",color:"#22c55e",bg:"rgba(34,197,94,0.12)",icon:"🟢"}, media:{label:"Média",color:"#eab308",bg:"rgba(234,179,8,0.12)",icon:"🟡"}, alta:{label:"Alta",color:"#f97316",bg:"rgba(249,115,22,0.12)",icon:"🟠"}, critica:{label:"Crítica",color:"#ef4444",bg:"rgba(239,68,68,0.12)",icon:"🔴"} };
const STATUS = { ativo:{label:"Ativo",color:"#22c55e"}, manutencao:{label:"Em Manutenção",color:"#f97316"}, inativo:{label:"Inativo",color:"#6b7280"} };
const VEHICLE_TYPES = ["Leve (Passeio / Pickup)","Utilitário Médio (Iveco Daily / VW Delivery)","Utilitário Grande (Van / Sprinter)","Caminhão Leve (3/4 / Toco)","Caminhão Pesado (Truck / Carreta)","Maquinário Pesado"];

const uid    = () => Math.random().toString(36).substr(2,9)+Date.now().toString(36);
const fDate  = d => d ? new Date(d+"T12:00:00").toLocaleDateString("pt-BR") : "–";
const fCur   = v => `R$ ${Number(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2})}`;
const daysTo = d => d ? Math.ceil((new Date(d+"T23:59:59")-new Date())/86400000) : null;
const toB64  = f => new Promise((res,rej)=>{ const r=new FileReader(); r.onload=e=>res(e.target.result); r.onerror=rej; r.readAsDataURL(f); });
const saveL  = (k,v) => { try{localStorage.setItem(k,JSON.stringify(v));}catch{} };
const loadL  = (k,d) => { try{return JSON.parse(localStorage.getItem(k)||"null")??d;}catch{return d;} };

const UBadge = ({level}) => <span style={{background:URGENCY[level]?.bg,color:URGENCY[level]?.color,borderRadius:999,padding:"2px 10px",fontSize:11,fontWeight:700,border:`1px solid ${URGENCY[level]?.color}50`,whiteSpace:"nowrap"}}>{URGENCY[level]?.icon} {URGENCY[level]?.label}</span>;
const SBadge = ({status}) => <span style={{color:STATUS[status]?.color,background:STATUS[status]?.color+"22",borderRadius:999,padding:"2px 10px",fontSize:11,fontWeight:700,border:`1px solid ${STATUS[status]?.color}50`}}>{STATUS[status]?.label}</span>;
const Empty  = ({icon,title,sub,action,onAction}) => <div style={{textAlign:"center",padding:"48px 24px"}}><div style={{fontSize:48,marginBottom:16}}>{icon}</div><div style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:20,fontWeight:700,color:"#F1F5F9",marginBottom:8}}>{title}</div>{sub&&<div style={{color:"#64748B",marginBottom:20,fontSize:14}}>{sub}</div>}{action&&<button className="btn-primary" onClick={onAction}>{action}</button>}</div>;
const Denied = () => <div className="card" style={{padding:48,textAlign:"center"}}><div style={{fontSize:52,marginBottom:16}}>🔒</div><div style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:24,fontWeight:700,color:"#F1F5F9",marginBottom:10}}>Acesso Restrito</div><div style={{color:"#64748B",fontSize:14}}>Você não tem permissão para esta funcionalidade.</div></div>;

// ── DASHBOARD ──
function Dashboard({vehicles,maintenances,alerts,navigate,session}) {
  const active=vehicles.filter(v=>v.status==="ativo").length;
  const inMaint=vehicles.filter(v=>v.status==="manutencao").length;
  const criticos=alerts.filter(a=>a.urgency==="critica").length;
  const totalCost=maintenances.reduce((s,m)=>s+(Number(m.totalCost)||0),0);
  const recent=[...maintenances].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,6);
  const urgA=alerts.filter(a=>a.urgency==="critica"||a.urgency==="alta").slice(0,5);
  const Stat=({label,value,sub,color,onClick,perm})=>{
    const blocked=perm&&!can(session,perm);
    return <div onClick={!blocked&&onClick?onClick:undefined} className="card" style={{padding:"20px 24px",cursor:onClick&&!blocked?"pointer":"default",borderLeft:`4px solid ${color}`,transition:"transform 0.2s"}} onMouseEnter={e=>onClick&&!blocked&&(e.currentTarget.style.transform="translateY(-3px)")} onMouseLeave={e=>(e.currentTarget.style.transform="")}>
      <div style={{fontSize:11,color:"#64748B",fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>{label}</div>
      <div style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:34,fontWeight:800,color}}>{blocked?"—":value}</div>
      {sub&&<div style={{fontSize:12,color:"#94A3B8",marginTop:4}}>{blocked?"Sem permissão":sub}</div>}
    </div>;
  };
  return <div>
    <div style={{marginBottom:28}}>
      <h1 style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:30,fontWeight:800,color:"#F1F5F9"}}>Painel Geral</h1>
      <p style={{color:"#64748B",fontSize:14}}>{new Date().toLocaleDateString("pt-BR",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
    </div>
    <div className="g3" style={{marginBottom:24}}>
      <Stat label="Veículos na Frota" value={vehicles.length} sub={`${active} ativos · ${inMaint} em manutenção`} color="#F97316" onClick={()=>navigate("vehicles")}/>
      <Stat label="Alertas Críticos" value={criticos} sub="Requerem atenção imediata" color="#ef4444" onClick={()=>navigate("alerts")} perm="canViewAlerts"/>
      <Stat label="Custo Total Acumulado" value={fCur(totalCost)} sub="Soma de todas as manutenções" color="#6366f1" perm="canViewReports"/>
    </div>
    {vehicles.length===0 ? <div className="card"><Empty icon="🚛" title="Comece adicionando sua frota" sub="Cadastre seus veículos para começar." action={can(session,"canAddVehicles")?"+ Adicionar Veículo":null} onAction={()=>navigate("newVehicle",null)}/></div>
    : <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div className="card" style={{padding:20}}>
          <h2 style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:18,fontWeight:700,color:"#F1F5F9",marginBottom:16}}>Últimas Manutenções</h2>
          {recent.length===0 ? <div style={{color:"#64748B",textAlign:"center",padding:"20px 0",fontSize:13}}>Nenhuma manutenção ainda.</div>
          : recent.map(m=>{const v=vehicles.find(x=>x.id===m.vehicleId);return <div key={m.id} onClick={()=>navigate("vehicleDetail",m.vehicleId)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid #1E2D40",cursor:"pointer"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:URGENCY[m.urgency]?.color,flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:"#E2E8F0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v?.plate} — {v?.brand} {v?.model}</div><div style={{fontSize:11,color:"#64748B"}}>{m.description?.slice(0,38)}{m.description?.length>38?"…":""} · {fDate(m.date)}</div></div>
              <UBadge level={m.urgency}/>
            </div>;})}
        </div>
        <div className="card" style={{padding:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <h2 style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:18,fontWeight:700,color:"#F1F5F9"}}>Alertas Urgentes</h2>
            {can(session,"canViewAlerts")&&alerts.length>0&&<button className="btn-ghost" onClick={()=>navigate("alerts")}>Ver todos →</button>}
          </div>
          {!can(session,"canViewAlerts") ? <div style={{color:"#64748B",textAlign:"center",padding:"20px 0",fontSize:13}}>🔒 Sem permissão para ver alertas.</div>
          : urgA.length===0 ? <div style={{color:"#64748B",textAlign:"center",padding:"20px 0",fontSize:13}}>✅ Nenhum alerta urgente.</div>
          : urgA.map((a,i)=><div key={i} onClick={()=>navigate("vehicleDetail",a.vehicleId)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid #1E2D40",cursor:"pointer"}}>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:"#E2E8F0"}}>{a.plate} · {a.type}</div><div style={{fontSize:11,color:"#94A3B8"}}>{a.message}</div></div>
              <UBadge level={a.urgency}/>
            </div>)}
        </div>
      </div>}
  </div>;
}

// ── VEHICLE LIST ──
function VehicleList({vehicles,maintenances,navigate,session}) {
  const [search,setSearch]=useState("");
  const [fs,setFs]=useState("all");
  const filtered=vehicles.filter(v=>{const q=search.toLowerCase();return(!q||[v.plate,v.model,v.brand].some(f=>f?.toLowerCase().includes(q)))&&(fs==="all"||v.status===fs);});
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:12}}>
      <h1 style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:30,fontWeight:800,color:"#F1F5F9"}}>Frota de Veículos</h1>
      {can(session,"canAddVehicles")&&<button className="btn-primary" onClick={()=>navigate("newVehicle",null)}>+ Novo Veículo</button>}
    </div>
    <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
      <input placeholder="🔍  Buscar por placa, modelo ou marca…" value={search} onChange={e=>setSearch(e.target.value)} style={{maxWidth:340,background:"#161B27",border:"1px solid #2D3748",color:"#E2E8F0",padding:"10px 14px",borderRadius:6,fontSize:14,fontFamily:"Barlow,sans-serif"}}/>
      <select value={fs} onChange={e=>setFs(e.target.value)} style={{background:"#161B27",border:"1px solid #2D3748",color:"#E2E8F0",padding:"10px 14px",borderRadius:6,fontSize:14}}>
        <option value="all">Todos os status</option><option value="ativo">Ativos</option><option value="manutencao">Em Manutenção</option><option value="inativo">Inativos</option>
      </select>
    </div>
    {filtered.length===0 ? <div className="card"><Empty icon={vehicles.length===0?"🚛":"🔍"} title={vehicles.length===0?"Nenhum veículo cadastrado":"Nenhum resultado"} sub={vehicles.length===0?"Clique em + Novo Veículo para começar.":"Tente outro filtro."} action={vehicles.length===0&&can(session,"canAddVehicles")?"+ Adicionar Veículo":null} onAction={()=>navigate("newVehicle",null)}/></div>
    : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:16}}>
        {filtered.map(v=>{const vm=maintenances.filter(m=>m.vehicleId===v.id);const last=vm.sort((a,b)=>new Date(b.date)-new Date(a.date))[0];return(
          <div key={v.id} className="card vehicle-card" onClick={()=>navigate("vehicleDetail",v.id)} style={{padding:20,cursor:"pointer",borderTop:`3px solid ${STATUS[v.status]?.color}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div><div style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:24,fontWeight:800,color:"#F1F5F9",letterSpacing:2}}>{v.plate||"SEM PLACA"}</div><div style={{fontSize:13,color:"#94A3B8"}}>{v.brand} {v.model}{v.year?` · ${v.year}`:""}</div></div>
              <SBadge status={v.status}/>
            </div>
            <div style={{fontSize:11,color:"#475569",marginBottom:14,background:"#0D111760",padding:"3px 8px",borderRadius:4,display:"inline-block"}}>{v.type}</div>
            <div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid #1E2D40",paddingTop:12}}>
              <div><div style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:0.8}}>KM Atual</div><div style={{fontSize:14,fontWeight:700,color:"#E2E8F0"}}>{v.mileage?Number(v.mileage).toLocaleString("pt-BR")+" km":"–"}</div></div>
              <div style={{textAlign:"center"}}><div style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:0.8}}>Manut.</div><div style={{fontSize:14,fontWeight:700,color:"#E2E8F0"}}>{vm.length}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:0.8}}>Últ. Serviço</div><div style={{fontSize:13,color:"#E2E8F0"}}>{last?fDate(last.date):"–"}</div></div>
            </div>
          </div>);})}
      </div>}
  </div>;
}

// ── VEHICLE DETAIL ──
function VehicleDetail({vehicle,maintenances,navigate,onDelete,onDeleteMaintenance,session}) {
  const [tab,setTab]=useState("manutencoes");
  if(!vehicle) return <Empty icon="❓" title="Veículo não encontrado" action="← Voltar" onAction={()=>navigate("vehicles")}/>;
  const sorted=[...maintenances].sort((a,b)=>new Date(b.date)-new Date(a.date));
  const totalCost=maintenances.reduce((s,m)=>s+(Number(m.totalCost)||0),0);
  const allP=maintenances.flatMap(m=>(m.photos||[]).map(p=>({...p,mDate:m.date,mDesc:m.description})));
  const allI=maintenances.flatMap(m=>(m.invoices||[]).map(f=>({...f,mDate:m.date,mDesc:m.description})));
  const cd=daysTo(vehicle.documents?.crlv), id=daysTo(vehicle.documents?.insurance);
  const Tab=({id,label,count})=><button onClick={()=>setTab(id)} style={{background:tab===id?"#F97316":"transparent",color:tab===id?"#fff":"#94A3B8",border:"none",padding:"9px 18px",cursor:"pointer",fontFamily:"Barlow Condensed,sans-serif",fontWeight:700,fontSize:14,borderRadius:"6px 6px 0 0",transition:"all 0.15s",whiteSpace:"nowrap"}}>{label}{count!=null?` (${count})`:""}</button>;
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10}}>
      <button className="btn-ghost" onClick={()=>navigate("vehicles")}>← Voltar à Frota</button>
      <div style={{display:"flex",gap:8}}>
        {can(session,"canEditVehicles")&&<button className="btn-secondary" onClick={()=>navigate("newVehicle",vehicle.id)}>✏️ Editar</button>}
        {can(session,"canDeleteVehicles")&&<button className="btn-danger" onClick={()=>onDelete(vehicle.id)}>🗑 Remover</button>}
      </div>
    </div>
    <div className="card" style={{padding:24,marginBottom:24,borderLeft:`4px solid ${STATUS[vehicle.status]?.color||"#F97316"}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:16}}>
        <div>
          <div style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:40,fontWeight:800,color:"#F1F5F9",letterSpacing:3}}>{vehicle.plate||"SEM PLACA"}</div>
          <div style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:20,color:"#94A3B8"}}>{vehicle.brand} {vehicle.model} {vehicle.year}</div>
          <div style={{fontSize:12,color:"#64748B",marginTop:4}}>{vehicle.type}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8}}>
          <SBadge status={vehicle.status}/>
          {vehicle.chassis&&<div style={{fontSize:11,color:"#64748B"}}>Chassi: {vehicle.chassis}</div>}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:16,marginTop:20,borderTop:"1px solid #1E2D40",paddingTop:16}}>
        {[{l:"KM Atual",v:vehicle.mileage?Number(vehicle.mileage).toLocaleString("pt-BR")+" km":"–"},{l:"Manutenções",v:maintenances.length},{l:"Custo Total",v:can(session,"canViewReports")?fCur(totalCost):"—"},{l:"CRLV",v:vehicle.documents?.crlv?fDate(vehicle.documents.crlv):"–",w:cd!==null&&cd<30,w2:cd!==null&&cd<0},{l:"Seguro",v:vehicle.documents?.insurance?fDate(vehicle.documents.insurance):"–",w:id!==null&&id<30,w2:id!==null&&id<0}].map(({l,v,w,w2})=>(
          <div key={l}><div style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:0.8,marginBottom:4}}>{l}</div><div style={{fontSize:16,fontWeight:700,color:w2?"#ef4444":w?"#f97316":"#E2E8F0"}}>{v}{(w||w2)?" ⚠️":""}</div></div>
        ))}
      </div>
      {vehicle.notes&&<div style={{marginTop:16,padding:"10px 14px",background:"#0D1117",borderRadius:6,fontSize:13,color:"#94A3B8"}}>📝 {vehicle.notes}</div>}
    </div>
    <div style={{display:"flex",gap:4,borderBottom:"2px solid #1E2D40",overflowX:"auto"}}>
      <Tab id="manutencoes" label="🔧 Manutenções" count={maintenances.length}/>
      <Tab id="galeria" label="📷 Fotos" count={allP.length}/>
      <Tab id="notas" label="📄 NF / Docs" count={allI.length}/>
    </div>
    <div className="card" style={{borderRadius:"0 8px 8px 8px",padding:20}}>
      {tab==="manutencoes"&&<div>
        {can(session,"canRegisterMaintenance")&&<div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}><button className="btn-primary" onClick={()=>navigate("newMaintenance",vehicle.id,null)}>+ Registrar Manutenção</button></div>}
        {sorted.length===0 ? <Empty icon="🔧" title="Nenhuma manutenção registrada" sub={can(session,"canRegisterMaintenance")?"Clique em Registrar Manutenção para começar.":"Nenhuma manutenção registrada ainda."}/>
        : sorted.map(m=><MaintCard key={m.id} m={m} vehicle={vehicle} navigate={navigate} onDelete={onDeleteMaintenance} session={session}/>)}
      </div>}
      {tab==="galeria"&&(allP.length===0 ? <Empty icon="📷" title="Nenhuma foto registrada" sub="Adicione fotos ao registrar uma manutenção."/>
      : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12}}>
          {allP.map((p,i)=><div key={i} style={{borderRadius:8,overflow:"hidden",background:"#0D1117",border:"1px solid #1E2D40"}}>
            <img src={p.data} alt={p.name} style={{width:"100%",height:130,objectFit:"cover",display:"block",cursor:"pointer"}} onClick={()=>window.open(p.data,"_blank")}/>
            <div style={{padding:"7px 10px"}}><div style={{fontSize:11,color:"#CBD5E1",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div><div style={{fontSize:10,color:"#475569"}}>{fDate(p.mDate)}</div></div>
          </div>)}
        </div>)}
      {tab==="notas"&&(allI.length===0 ? <Empty icon="📄" title="Nenhum documento registrado" sub="Adicione NFs ao registrar uma manutenção."/>
      : allI.map((f,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid #1E2D40"}}>
          <div style={{fontSize:28}}>{f.type?.includes("pdf")?"📄":"🖼️"}</div>
          <div style={{flex:1,minWidth:0}}><div style={{fontSize:14,color:"#E2E8F0",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</div><div style={{fontSize:11,color:"#64748B"}}>{fDate(f.mDate)} · {f.mDesc?.slice(0,40)}</div></div>
          <a href={f.data} download={f.name} style={{color:"#F97316",fontSize:12,textDecoration:"none",whiteSpace:"nowrap"}}>⬇ Baixar</a>
        </div>))}
    </div>
  </div>;
}

function MaintCard({m,vehicle,navigate,onDelete,session}) {
  const [open,setOpen]=useState(false);
  const pc=(m.parts||[]).reduce((s,p)=>s+(Number(p.qty)*Number(p.unitPrice)||0),0);
  const mSt={concluido:{l:"Concluído",c:"#22c55e"},em_andamento:{l:"Em Andamento",c:"#eab308"},pendente:{l:"Pendente",c:"#6b7280"}};
  return <div style={{border:"1px solid #1E2D40",borderRadius:8,marginBottom:10,overflow:"hidden"}}>
    <div onClick={()=>setOpen(!open)} style={{padding:"13px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",background:"#0D111780"}}>
      <div style={{width:10,height:10,borderRadius:"50%",background:URGENCY[m.urgency]?.color,flexShrink:0}}/>
      <div style={{flex:1,minWidth:0}}><div style={{fontSize:14,fontWeight:600,color:"#E2E8F0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.description||"Manutenção"}</div><div style={{fontSize:11,color:"#64748B"}}>{fDate(m.date)}{m.mileage?` · ${Number(m.mileage).toLocaleString("pt-BR")} km`:""} · {fCur(m.totalCost)}</div></div>
      <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
        {m.status&&<span style={{fontSize:10,color:mSt[m.status]?.c,fontWeight:700}}>{mSt[m.status]?.l}</span>}
        <UBadge level={m.urgency}/><span style={{color:"#64748B",fontSize:12}}>{open?"▲":"▼"}</span>
      </div>
    </div>
    {open&&<div style={{padding:16,background:"#161B27",borderTop:"1px solid #1E2D40"}}>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginBottom:14}}>
        {can(session,"canEditMaintenance")&&<button className="btn-secondary" onClick={()=>navigate("newMaintenance",vehicle.id,m.id)} style={{fontSize:12,padding:"6px 14px"}}>✏️ Editar</button>}
        {can(session,"canDeleteMaintenance")&&<button className="btn-danger" onClick={()=>onDelete(m.id,vehicle.id)}>🗑</button>}
      </div>
      {m.parts?.length>0&&<div style={{marginBottom:14}}>
        <div style={{fontSize:10,color:"#64748B",textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>Peças Substituídas</div>
        {m.parts.map((p,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#CBD5E1",padding:"5px 0",borderBottom:"1px solid #1E2D4040"}}><span><span style={{color:"#64748B"}}>{p.category}</span> › {p.part}</span><span>{p.qty}× {fCur(p.unitPrice)} = <strong style={{color:"#F97316"}}>{fCur(Number(p.qty)*Number(p.unitPrice))}</strong></span></div>)}
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:12,padding:12,background:"#0D1117",borderRadius:6}}>
        <div><div style={{fontSize:9,color:"#64748B",textTransform:"uppercase"}}>Peças</div><div style={{fontSize:14,color:"#E2E8F0",fontWeight:600}}>{fCur(pc)}</div></div>
        <div><div style={{fontSize:9,color:"#64748B",textTransform:"uppercase"}}>Mão de Obra</div><div style={{fontSize:14,color:"#E2E8F0",fontWeight:600}}>{fCur(m.laborCost)}</div></div>
        <div><div style={{fontSize:9,color:"#64748B",textTransform:"uppercase"}}>Total</div><div style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:18,fontWeight:800,color:"#F97316"}}>{fCur(m.totalCost)}</div></div>
      </div>
      {m.provider&&<div style={{fontSize:12,color:"#94A3B8",marginBottom:6}}>🏪 <strong>Fornecedor:</strong> {m.provider}</div>}
      {(m.nextMaintenanceMileage||m.nextMaintenanceDate)&&<div style={{fontSize:12,color:"#6366f1",marginBottom:6,display:"flex",gap:16}}>{m.nextMaintenanceMileage&&<span>🔧 Próx. km: {Number(m.nextMaintenanceMileage).toLocaleString("pt-BR")}</span>}{m.nextMaintenanceDate&&<span>📅 {fDate(m.nextMaintenanceDate)}</span>}</div>}
      {m.notes&&<div style={{fontSize:12,color:"#94A3B8",padding:"8px 12px",background:"#0D1117",borderRadius:6,marginBottom:10}}>📝 {m.notes}</div>}
      {m.photos?.length>0&&<div style={{marginTop:10}}><div style={{fontSize:10,color:"#64748B",textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>Fotos ({m.photos.length})</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{m.photos.map((p,i)=><img key={i} src={p.data} alt={p.name} style={{width:80,height:60,objectFit:"cover",borderRadius:4,border:"1px solid #1E2D40",cursor:"pointer"}} onClick={()=>window.open(p.data,"_blank")}/>)}</div></div>}
      {m.invoices?.length>0&&<div style={{marginTop:10}}><div style={{fontSize:10,color:"#64748B",textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>Documentos</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{m.invoices.map((f,i)=><a key={i} href={f.data} download={f.name} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",background:"#0D1117",borderRadius:4,border:"1px solid #1E2D40",fontSize:12,color:"#F97316",textDecoration:"none"}}>{f.type?.includes("pdf")?"📄":"🖼️"} {f.name?.slice(0,20)}</a>)}</div></div>}
    </div>}
  </div>;
}

// ── VEHICLE FORM ──
function VehicleForm({vehicle,session,onSave,onCancel}) {
  if(!can(session,vehicle?"canEditVehicles":"canAddVehicles")) return <Denied/>;
  const [form,setForm]=useState(()=>vehicle?{...vehicle}:{brand:"",model:"",plate:"",year:"",chassis:"",type:VEHICLE_TYPES[1],mileage:"",status:"ativo",notes:"",documents:{crlv:"",insurance:"",licenseExp:""}});
  const set=(f,v)=>setForm(p=>({...p,[f]:v}));
  const setDoc=(f,v)=>setForm(p=>({...p,documents:{...p.documents,[f]:v}}));
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:12}}>
      <h1 style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:30,fontWeight:800,color:"#F1F5F9"}}>{vehicle?"Editar Veículo":"Novo Veículo"}</h1>
      <button className="btn-ghost" onClick={onCancel}>✕ Cancelar</button>
    </div>
    <div className="card" style={{padding:24,marginBottom:20}}>
      <h2 className="sec-title">Identificação</h2>
      <div className="g3"><div className="fg"><label className="fl">Placa *</label><input className="fi" value={form.plate} onChange={e=>set("plate",e.target.value.toUpperCase())} placeholder="ABC-1234" maxLength={8}/></div><div className="fg"><label className="fl">Marca</label><input className="fi" value={form.brand} onChange={e=>set("brand",e.target.value)} placeholder="Ex: Iveco, VW…"/></div><div className="fg"><label className="fl">Modelo</label><input className="fi" value={form.model} onChange={e=>set("model",e.target.value)} placeholder="Ex: Daily 35S14"/></div></div>
      <div className="g3"><div className="fg"><label className="fl">Ano</label><input className="fi" type="number" value={form.year} onChange={e=>set("year",e.target.value)} placeholder="2020"/></div><div className="fg"><label className="fl">KM Atual</label><input className="fi" type="number" value={form.mileage} onChange={e=>set("mileage",e.target.value)}/></div><div className="fg"><label className="fl">Chassi</label><input className="fi" value={form.chassis} onChange={e=>set("chassis",e.target.value)} placeholder="9BD…"/></div></div>
      <div className="g2"><div className="fg"><label className="fl">Tipo</label><select className="fs" value={form.type} onChange={e=>set("type",e.target.value)}>{VEHICLE_TYPES.map(t=><option key={t}>{t}</option>)}</select></div><div className="fg"><label className="fl">Status</label><select className="fs" value={form.status} onChange={e=>set("status",e.target.value)}><option value="ativo">Ativo</option><option value="manutencao">Em Manutenção</option><option value="inativo">Inativo</option></select></div></div>
    </div>
    <div className="card" style={{padding:24,marginBottom:20}}>
      <h2 className="sec-title">Documentação</h2>
      <div className="g3"><div className="fg"><label className="fl">Vencimento CRLV</label><input className="fi" type="date" value={form.documents.crlv} onChange={e=>setDoc("crlv",e.target.value)}/></div><div className="fg"><label className="fl">Vencimento Seguro</label><input className="fi" type="date" value={form.documents.insurance} onChange={e=>setDoc("insurance",e.target.value)}/></div><div className="fg"><label className="fl">Venc. Licença / Tacógrafo</label><input className="fi" type="date" value={form.documents.licenseExp} onChange={e=>setDoc("licenseExp",e.target.value)}/></div></div>
    </div>
    <div className="card" style={{padding:24,marginBottom:24}}><div className="fg"><label className="fl">Observações Gerais</label><textarea className="fi" rows={3} value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Informações adicionais…"/></div></div>
    <div style={{display:"flex",gap:12,justifyContent:"flex-end"}}>
      <button className="btn-secondary" onClick={onCancel}>Cancelar</button>
      <button className="btn-primary" onClick={()=>{if(!form.plate.trim())return alert("Placa é obrigatória.");onSave({...form,plate:form.plate.toUpperCase()});}}>{vehicle?"💾 Salvar":"✅ Cadastrar"}</button>
    </div>
  </div>;
}

// ── MAINTENANCE FORM ──
function MaintenanceForm({maintenance,vehicleId,vehicle,session,onSave,onCancel}) {
  if(!can(session,"canRegisterMaintenance")) return <Denied/>;
  const blank={vehicleId,date:new Date().toISOString().slice(0,10),mileage:vehicle?.mileage||"",urgency:"media",status:"concluido",description:"",provider:"",costMode:"parts_labor",parts:[],laborCost:"",invoiceTotal:"",totalCost:0,notes:"",photos:[],invoices:[],nextMaintenanceMileage:"",nextMaintenanceDate:""};
  const [form,setForm]=useState(maintenance?{...maintenance}:blank);
  const [np,setNp]=useState({category:Object.keys(PARTS)[0],part:Object.values(PARTS)[0][0],qty:1,unitPrice:""});
  const photoRef=useRef(),invRef=useRef();
  const recalc=next=>{const pc=(next.parts||[]).reduce((s,p)=>s+(Number(p.qty)*Number(p.unitPrice)||0),0);if(next.costMode==="parts_labor")next.totalCost=pc+(Number(next.laborCost)||0);else if(next.costMode==="invoice")next.totalCost=Number(next.invoiceTotal)||0;else next.totalCost=pc+(Number(next.laborCost)||0)+(Number(next.invoiceTotal)||0);return next;};
  const set=(f,v)=>setForm(p=>recalc({...p,[f]:v}));
  const pc=(form.parts||[]).reduce((s,p)=>s+(Number(p.qty)*Number(p.unitPrice)||0),0);
  const addPart=()=>{if(!np.part)return;set("parts",[...form.parts,{...np}]);setNp(p=>({...p,qty:1,unitPrice:""}));};
  const rmPart=i=>set("parts",form.parts.filter((_,j)=>j!==i));
  const handleFiles=async(files,field)=>{const res=[];for(const f of Array.from(files)){if(f.size>5*1024*1024){alert(`"${f.name}" excede 5MB.`);continue;}try{res.push({name:f.name,type:f.type,data:await toB64(f)});}catch{}}set(field,[...(form[field]||[]),...res]);};
  const DZ=({field,label,icon,accept})=><div>
    <label className="fl">{label}</label>
    <div onClick={()=>field==="photos"?photoRef.current.click():invRef.current.click()} style={{border:"2px dashed #2D3748",borderRadius:8,padding:22,textAlign:"center",cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#F97316";e.currentTarget.style.background="#F9731608";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#2D3748";e.currentTarget.style.background="";}}>
      <div style={{fontSize:30,marginBottom:8}}>{icon}</div><div style={{fontSize:13,color:"#64748B"}}>Clique para adicionar</div><div style={{fontSize:11,color:"#475569"}}>{accept} · Máx 5MB</div>
    </div>
    <input ref={field==="photos"?photoRef:invRef} type="file" multiple accept={accept} style={{display:"none"}} onChange={e=>handleFiles(e.target.files,field)}/>
    {form[field]?.length>0&&<div style={{marginTop:10,display:"flex",gap:8,flexWrap:"wrap"}}>{form[field].map((f,i)=><div key={i} style={{position:"relative"}}>{field==="photos"?<img src={f.data} alt="" style={{width:80,height:60,objectFit:"cover",borderRadius:4,border:"1px solid #1E2D40"}}/>:<div style={{padding:"5px 10px",background:"#0D1117",border:"1px solid #1E2D40",borderRadius:4,fontSize:11,color:"#CBD5E1",maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.type?.includes("pdf")?"📄":"🖼️"} {f.name}</div>}<button onClick={()=>set(field,form[field].filter((_,j)=>j!==i))} style={{position:"absolute",top:-6,right:-6,background:"#ef4444",border:"none",color:"#fff",borderRadius:"50%",width:18,height:18,cursor:"pointer",fontSize:10}}>✕</button></div>)}</div>}
  </div>;
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,flexWrap:"wrap",gap:12}}>
      <div><h1 style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:30,fontWeight:800,color:"#F1F5F9"}}>{maintenance?"Editar Manutenção":"Registrar Manutenção"}</h1>{vehicle&&<div style={{fontSize:13,color:"#94A3B8"}}>{vehicle.plate} · {vehicle.brand} {vehicle.model}</div>}</div>
      <button className="btn-ghost" onClick={onCancel}>✕ Cancelar</button>
    </div>
    <div className="card" style={{padding:24,marginBottom:16}}>
      <h2 className="sec-title">Informações Gerais</h2>
      <div className="g3"><div className="fg"><label className="fl">Data *</label><input className="fi" type="date" value={form.date} onChange={e=>set("date",e.target.value)}/></div><div className="fg"><label className="fl">KM no Registro</label><input className="fi" type="number" value={form.mileage} onChange={e=>set("mileage",e.target.value)}/></div><div className="fg"><label className="fl">Urgência</label><select className="fs" value={form.urgency} onChange={e=>set("urgency",e.target.value)}>{Object.entries(URGENCY).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}</select></div></div>
      <div className="g2"><div className="fg"><label className="fl">Status do Reparo</label><select className="fs" value={form.status} onChange={e=>set("status",e.target.value)}><option value="concluido">✅ Concluído</option><option value="em_andamento">🔄 Em Andamento</option><option value="pendente">⏳ Pendente</option></select></div><div className="fg"><label className="fl">Fornecedor / Oficina</label><input className="fi" value={form.provider} onChange={e=>set("provider",e.target.value)} placeholder="Nome da oficina"/></div></div>
      <div className="fg"><label className="fl">Descrição *</label><textarea className="fi" rows={2} value={form.description} onChange={e=>set("description",e.target.value)} placeholder="Ex: Troca de amortecedores dianteiros…"/></div>
    </div>
    <div className="card" style={{padding:24,marginBottom:16}}>
      <h2 className="sec-title">🔩 Peças Substituídas</h2>
      <div className="parts-row">
        <div className="fg"><label className="fl">Categoria</label><select className="fs" value={np.category} onChange={e=>setNp(p=>({...p,category:e.target.value,part:PARTS[e.target.value][0]}))}>{Object.keys(PARTS).map(k=><option key={k}>{k}</option>)}</select></div>
        <div className="fg"><label className="fl">Peça</label><select className="fs" value={np.part} onChange={e=>setNp(p=>({...p,part:e.target.value}))}>{PARTS[np.category]?.map(p=><option key={p}>{p}</option>)}</select></div>
        <div className="fg" style={{maxWidth:90}}><label className="fl">Qtd</label><input className="fi" type="number" min={1} value={np.qty} onChange={e=>setNp(p=>({...p,qty:e.target.value}))}/></div>
        <div className="fg" style={{maxWidth:140}}><label className="fl">Preço Unit.</label><input className="fi" type="number" step="0.01" value={np.unitPrice} onChange={e=>setNp(p=>({...p,unitPrice:e.target.value}))} placeholder="0,00"/></div>
        <button className="btn-primary" onClick={addPart} style={{alignSelf:"flex-end",height:40,whiteSpace:"nowrap"}}>+ Peça</button>
      </div>
      {form.parts.length>0 ? <div style={{border:"1px solid #1E2D40",borderRadius:8,overflow:"hidden",marginTop:16}}>
        <div style={{display:"grid",gridTemplateColumns:"2fr 2fr 50px 110px 90px 30px",gap:8,padding:"8px 12px",background:"#0D1117",fontSize:10,color:"#64748B",textTransform:"uppercase"}}><span>Categoria</span><span>Peça</span><span>Qtd</span><span>Unit.</span><span style={{textAlign:"right"}}>Total</span><span></span></div>
        {form.parts.map((p,i)=><div key={i} style={{display:"grid",gridTemplateColumns:"2fr 2fr 50px 110px 90px 30px",gap:8,padding:"10px 12px",borderTop:"1px solid #1E2D40",alignItems:"center",fontSize:12}}><span style={{color:"#94A3B8"}}>{p.category}</span><span style={{color:"#E2E8F0"}}>{p.part}</span><span>{p.qty}</span><span>{fCur(p.unitPrice)}</span><span style={{color:"#F97316",fontWeight:700,textAlign:"right"}}>{fCur(Number(p.qty)*Number(p.unitPrice))}</span><button onClick={()=>rmPart(i)} style={{background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:15}}>✕</button></div>)}
        <div style={{display:"flex",justifyContent:"flex-end",padding:"10px 12px",background:"#0D1117",borderTop:"1px solid #1E2D40"}}><span style={{fontSize:13,fontWeight:700,color:"#F97316"}}>Total Peças: {fCur(pc)}</span></div>
      </div> : <div style={{textAlign:"center",padding:"16px 0",color:"#64748B",fontSize:12,marginTop:12}}>Nenhuma peça adicionada.</div>}
    </div>
    <div className="card" style={{padding:24,marginBottom:16}}>
      <h2 className="sec-title">💰 Custos</h2>
      <div className="fg" style={{marginBottom:16}}><label className="fl">Modo de Custo</label><select className="fs" value={form.costMode} onChange={e=>set("costMode",e.target.value)} style={{maxWidth:340}}><option value="parts_labor">Peças + Mão de Obra</option><option value="invoice">Total da Nota Fiscal</option><option value="combined">Combinado</option></select></div>
      <div className="g3">
        {(form.costMode==="parts_labor"||form.costMode==="combined")&&<><div className="fg"><label className="fl">Custo Peças (auto)</label><input className="fi" value={fCur(pc)} disabled style={{opacity:.5}}/></div><div className="fg"><label className="fl">Mão de Obra (R$)</label><input className="fi" type="number" step="0.01" value={form.laborCost} onChange={e=>set("laborCost",e.target.value)} placeholder="0,00"/></div></>}
        {(form.costMode==="invoice"||form.costMode==="combined")&&<div className="fg"><label className="fl">Total Nota Fiscal (R$)</label><input className="fi" type="number" step="0.01" value={form.invoiceTotal} onChange={e=>set("invoiceTotal",e.target.value)} placeholder="0,00"/></div>}
      </div>
      <div style={{padding:"14px 18px",background:"#0D1117",borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center",border:"1px solid #F9731630"}}>
        <span style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:15,color:"#94A3B8",fontWeight:700}}>TOTAL DA MANUTENÇÃO</span>
        <span style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:28,fontWeight:800,color:"#F97316"}}>{fCur(form.totalCost)}</span>
      </div>
    </div>
    <div className="card" style={{padding:24,marginBottom:16}}>
      <h2 className="sec-title">📅 Próxima Manutenção</h2>
      <div className="g2"><div className="fg"><label className="fl">Próxima revisão (KM)</label><input className="fi" type="number" value={form.nextMaintenanceMileage} onChange={e=>set("nextMaintenanceMileage",e.target.value)}/></div><div className="fg"><label className="fl">Data da próxima revisão</label><input className="fi" type="date" value={form.nextMaintenanceDate} onChange={e=>set("nextMaintenanceDate",e.target.value)}/></div></div>
    </div>
    <div className="card" style={{padding:24,marginBottom:16}}>
      <h2 className="sec-title">📎 Fotos e Documentos</h2>
      <div className="g2"><DZ field="photos" label="Fotos de Ocorrência / Sinistro" icon="📷" accept="image/*"/><DZ field="invoices" label="Notas Fiscais e Documentos" icon="📄" accept=".pdf,image/*"/></div>
    </div>
    <div className="card" style={{padding:24,marginBottom:24}}><div className="fg"><label className="fl">Observações Adicionais</label><textarea className="fi" rows={3} value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Notas adicionais…"/></div></div>
    <div style={{display:"flex",gap:12,justifyContent:"flex-end"}}>
      <button className="btn-secondary" onClick={onCancel}>Cancelar</button>
      <button className="btn-primary" onClick={()=>{if(!form.description.trim())return alert("Descrição é obrigatória.");onSave({...form});}}>{maintenance?"💾 Salvar Alterações":"✅ Registrar Manutenção"}</button>
    </div>
  </div>;
}

// ── ALERTS VIEW ──
function AlertsView({alerts,navigate}) {
  const order=["critica","alta","media","baixa"];
  const grouped=order.reduce((a,k)=>{a[k]=alerts.filter(x=>x.urgency===k);return a;},{});
  return <div>
    <h1 style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:30,fontWeight:800,color:"#F1F5F9",marginBottom:6}}>Central de Alertas</h1>
    <p style={{color:"#64748B",marginBottom:24,fontSize:14}}>{alerts.length} alerta(s) ativo(s)</p>
    {alerts.length===0 ? <div className="card"><Empty icon="✅" title="Tudo em ordem!" sub="Nenhum alerta ativo no momento."/></div>
    : order.map(level=>grouped[level].length>0&&<div key={level} style={{marginBottom:28}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,paddingBottom:8,borderBottom:`2px solid ${URGENCY[level].color}30`}}>
          <div style={{width:14,height:14,borderRadius:"50%",background:URGENCY[level].color,boxShadow:`0 0 8px ${URGENCY[level].color}`}}/>
          <h2 style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:20,fontWeight:700,color:URGENCY[level].color}}>{URGENCY[level].label} — {grouped[level].length}</h2>
        </div>
        {grouped[level].map((a,i)=><div key={i} className="card" onClick={()=>navigate("vehicleDetail",a.vehicleId)} style={{padding:"14px 18px",marginBottom:8,borderLeft:`3px solid ${URGENCY[level].color}`,cursor:"pointer",display:"flex",alignItems:"center",gap:16,transition:"transform .15s"}} onMouseEnter={e=>e.currentTarget.style.transform="translateX(4px)"} onMouseLeave={e=>e.currentTarget.style.transform=""}>
          <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14,color:"#F1F5F9"}}>{a.plate} · {a.type}</div><div style={{fontSize:13,color:"#94A3B8",marginTop:2}}>{a.message}</div></div>
          <span style={{fontSize:12,color:"#64748B"}}>Ver →</span>
        </div>)}
      </div>)}
  </div>;
}

// ── REPORTS VIEW ──
function ReportsView({vehicles,maintenances,session}) {
  if(!can(session,"canViewReports")) return <Denied/>;
  const [period,setPeriod]=useState("all");
  const fm=maintenances.filter(m=>{if(period==="all")return true;const d=new Date(m.date),now=new Date();if(period==="month")return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();return d.getFullYear()===now.getFullYear();});
  const vStats=vehicles.map(v=>{const vm=fm.filter(m=>m.vehicleId===v.id);return{...v,cnt:vm.length,cost:vm.reduce((s,m)=>s+(Number(m.totalCost)||0),0)};}).sort((a,b)=>b.cost-a.cost);
  const total=fm.reduce((s,m)=>s+(Number(m.totalCost)||0),0);
  const maxC=Math.max(...vStats.map(v=>v.cost),1);
  const dlCSV=(rows,fname)=>{const csv=rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(";")).join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"}));a.download=fname;a.click();};
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:12}}>
      <h1 style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:30,fontWeight:800,color:"#F1F5F9"}}>Relatórios</h1>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <select className="fs" value={period} onChange={e=>setPeriod(e.target.value)} style={{width:"auto"}}><option value="all">Todo o período</option><option value="month">Este mês</option><option value="year">Este ano</option></select>
        {can(session,"canExportData")&&<>
          <button className="btn-secondary" onClick={()=>dlCSV([["Placa","Marca","Modelo","KM","Status","Manut.","Custo R$"],...vStats.map(v=>[v.plate,v.brand,v.model,v.mileage,STATUS[v.status]?.label,v.cnt,Number(v.cost).toFixed(2)])],"resumo_frota.csv")}>⬇ Resumo</button>
          <button className="btn-secondary" onClick={()=>dlCSV([["Data","Placa","Descrição","Urgência","Fornecedor","Total R$"],...fm.map(m=>{const v=vehicles.find(x=>x.id===m.vehicleId);return[fDate(m.date),v?.plate,m.description,URGENCY[m.urgency]?.label,m.provider,Number(m.totalCost||0).toFixed(2)];})],`historico.csv`)}>⬇ Histórico</button>
          <button className="btn-secondary" onClick={()=>window.print()}>🖨 PDF</button>
        </>}
      </div>
    </div>
    <div className="g3" style={{marginBottom:24}}>
      {[{l:"Manutenções",v:fm.length,c:"#6366f1"},{l:"Custo Total",v:fCur(total),c:"#F97316"},{l:"Custo Médio",v:fm.length?fCur(total/fm.length):"R$ 0,00",c:"#22c55e"}].map(s=><div key={s.l} className="card" style={{padding:"20px 24px",borderLeft:`4px solid ${s.c}`}}><div style={{fontSize:10,color:"#64748B",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>{s.l}</div><div style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:30,fontWeight:800,color:s.c}}>{s.v}</div></div>)}
    </div>
    <div className="card" style={{padding:24,marginBottom:20}}>
      <h2 style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:20,fontWeight:700,color:"#F1F5F9",marginBottom:20}}>Custo por Veículo</h2>
      {vStats.filter(v=>v.cnt>0).length===0 ? <div style={{textAlign:"center",padding:"24px 0",color:"#64748B"}}>Nenhum dado para o período.</div>
      : vStats.filter(v=>v.cnt>0).map(v=><div key={v.id} style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:14,color:"#E2E8F0",fontWeight:600}}>{v.plate} <span style={{color:"#64748B",fontWeight:400}}>· {v.brand} {v.model}</span></span><span style={{fontSize:14,color:"#F97316",fontWeight:700}}>{fCur(v.cost)} <span style={{color:"#64748B",fontSize:11}}>({v.cnt} reg.)</span></span></div>
          <div style={{background:"#0D1117",height:10,borderRadius:5,overflow:"hidden"}}><div style={{height:"100%",background:"linear-gradient(90deg,#F97316,#ef4444)",borderRadius:5,width:`${(v.cost/maxC)*100}%`,transition:"width .6s"}}/></div>
        </div>)}
    </div>
    <div className="card" style={{padding:24}}>
      <h2 style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:20,fontWeight:700,color:"#F1F5F9",marginBottom:16}}>Histórico Completo</h2>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:600}}>
          <thead><tr style={{background:"#0D1117"}}>{["Data","Placa","Descrição","Urgência","Fornecedor","Total"].map(h=><th key={h} style={{padding:"10px 12px",textAlign:"left",fontSize:10,color:"#64748B",textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
          <tbody>{fm.length===0 ? <tr><td colSpan={6} style={{padding:24,textAlign:"center",color:"#64748B"}}>Nenhum registro.</td></tr>
          : [...fm].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(m=>{const v=vehicles.find(x=>x.id===m.vehicleId);return <tr key={m.id} style={{borderTop:"1px solid #1E2D40"}}>
              <td style={{padding:"10px 12px",color:"#94A3B8",whiteSpace:"nowrap"}}>{fDate(m.date)}</td>
              <td style={{padding:"10px 12px",color:"#F1F5F9",fontWeight:700}}>{v?.plate}</td>
              <td style={{padding:"10px 12px",color:"#CBD5E1",maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.description}</td>
              <td style={{padding:"10px 12px"}}><UBadge level={m.urgency}/></td>
              <td style={{padding:"10px 12px",color:"#94A3B8"}}>{m.provider||"–"}</td>
              <td style={{padding:"10px 12px",color:"#F97316",fontWeight:700,whiteSpace:"nowrap"}}>{fCur(m.totalCost)}</td>
            </tr>;})}</tbody>
        </table>
      </div>
    </div>
  </div>;
}

// ── MAIN APP ──
export default function FleetApp() {
  const [session,setSession]=useState(()=>getSession());
  const [view,setView]=useState("dashboard");
  const [selVId,setSelVId]=useState(null);
  const [selMId,setSelMId]=useState(null);
  const [menuOpen,setMenuOpen]=useState(false);
  const [vehicles,setVehicles]=useState(()=>loadL("fp_vehicles",[]));
  const [maints,setMaints]=useState(()=>loadL("fp_maints",[]));

  useEffect(()=>{ saveL("fp_vehicles",vehicles); },[vehicles]);
  useEffect(()=>{ saveL("fp_maints",maints); },[maints]);

  if(!session) return <LoginPage onLogin={s=>setSession(s)}/>;

  const selV=vehicles.find(v=>v.id===selVId);
  const selM=maints.find(m=>m.id===selMId);

  const nav=(v,vehicleId,maintenanceId)=>{setView(v);if(vehicleId!==undefined)setSelVId(vehicleId);if(maintenanceId!==undefined)setSelMId(maintenanceId);setMenuOpen(false);window.scrollTo({top:0,behavior:"smooth"});};
  const logout=()=>{clearSession();setSession(null);setView("dashboard");};

  const saveVehicle=d=>{if(d.id)setVehicles(p=>p.map(v=>v.id===d.id?d:v));else setVehicles(p=>[...p,{...d,id:uid(),createdAt:new Date().toISOString()}]);nav("vehicles");};
  const saveMaint=d=>{if(d.id)setMaints(p=>p.map(m=>m.id===d.id?d:m));else setMaints(p=>[...p,{...d,id:uid(),createdAt:new Date().toISOString()}]);nav("vehicleDetail",d.vehicleId,null);};
  const delVehicle=id=>{if(!window.confirm("Remover este veículo e todas as suas manutenções?"))return;setVehicles(p=>p.filter(v=>v.id!==id));setMaints(p=>p.filter(m=>m.vehicleId!==id));nav("vehicles");};
  const delMaint=(id,vehicleId)=>{if(!window.confirm("Remover este registro?"))return;setMaints(p=>p.filter(m=>m.id!==id));nav("vehicleDetail",vehicleId,null);};

  const getAlerts=()=>{const out=[];vehicles.forEach(v=>{[["crlv","CRLV"],["insurance","Seguro"],["licenseExp","Licença"]].forEach(([key,label])=>{const d=daysTo(v.documents?.[key]);if(d!==null&&d<=30)out.push({vehicleId:v.id,plate:v.plate,type:label,message:`${label} ${d<0?`vencido há ${Math.abs(d)} dias`:`vence em ${d} dia(s)`}`,urgency:d<0?"critica":d<=7?"alta":"media"});});maints.filter(m=>m.vehicleId===v.id).forEach(m=>{if(m.nextMaintenanceMileage&&v.mileage){const diff=Number(m.nextMaintenanceMileage)-Number(v.mileage);if(diff<=3000)out.push({vehicleId:v.id,plate:v.plate,type:"KM",message:`Manutenção prev. ${diff<=0?`vencida em ${Math.abs(diff).toLocaleString("pt-BR")} km`:`em ${diff.toLocaleString("pt-BR")} km`}`,urgency:diff<=0?"critica":diff<=500?"alta":"media"});}if(m.nextMaintenanceDate){const d=daysTo(m.nextMaintenanceDate);if(d!==null&&d<=14)out.push({vehicleId:v.id,plate:v.plate,type:"Revisão",message:`Revisão ${d<0?`vencida há ${Math.abs(d)} dias`:`em ${d} dia(s)`}`,urgency:d<0?"critica":d<=3?"alta":"media"});}});});return out;};

  const alerts=getAlerts();
  const alertBadge=alerts.filter(a=>a.urgency==="critica"||a.urgency==="alta").length;
  const NAV=[{id:"dashboard",icon:"⬛",label:"Painel",perm:"canViewDashboard"},{id:"vehicles",icon:"🚛",label:"Frota",perm:"canViewVehicles"},{id:"alerts",icon:"🔔",label:"Alertas",perm:"canViewAlerts",badge:alertBadge},{id:"reports",icon:"📊",label:"Relatórios",perm:"canViewReports"},...(session.role==="admin"?[{id:"users",icon:"👥",label:"Usuários"}]:[])];

  const renderView=()=>{
    switch(view){
      case "dashboard":     return <Dashboard vehicles={vehicles} maintenances={maints} alerts={alerts} navigate={nav} session={session}/>;
      case "vehicles":      return can(session,"canViewVehicles")?<VehicleList vehicles={vehicles} maintenances={maints} navigate={nav} session={session}/>:<Denied/>;
      case "vehicleDetail": return <VehicleDetail vehicle={selV} maintenances={maints.filter(m=>m.vehicleId===selVId)} navigate={nav} onDelete={delVehicle} onDeleteMaintenance={delMaint} session={session}/>;
      case "newVehicle":    return <VehicleForm vehicle={selV} session={session} onSave={saveVehicle} onCancel={()=>nav(selV?"vehicleDetail":"vehicles",selV?.id)}/>;
      case "newMaintenance":return <MaintenanceForm maintenance={selM} vehicleId={selVId} vehicle={selV} session={session} onSave={saveMaint} onCancel={()=>nav("vehicleDetail",selVId,null)}/>;
      case "alerts":        return can(session,"canViewAlerts")?<AlertsView alerts={alerts} navigate={nav}/>:<Denied/>;
      case "reports":       return <ReportsView vehicles={vehicles} maintenances={maints} session={session}/>;
      case "users":         return session.role==="admin"?<UsersAdmin session={session}/>:<Denied/>;
      default: return null;
    }
  };

  return <div style={{fontFamily:"'Barlow',sans-serif",background:"#0D1117",minHeight:"100vh",color:"#E2E8F0"}}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@400;500;600&display=swap');
      *{box-sizing:border-box;margin:0;padding:0;}
      ::-webkit-scrollbar{width:5px;height:5px;}::-webkit-scrollbar-track{background:#0D1117;}::-webkit-scrollbar-thumb{background:#374151;border-radius:3px;}
      input,select,textarea{font-family:'Barlow',sans-serif;}
      .btn-primary{background:#F97316;color:#fff;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:15px;letter-spacing:.4px;transition:all .15s;}
      .btn-primary:hover{background:#ea6c10;transform:translateY(-1px);}
      .btn-secondary{background:#1E2533;color:#CBD5E1;border:1px solid #2D3748;padding:10px 20px;border-radius:6px;cursor:pointer;font-family:'Barlow Condensed',sans-serif;font-weight:600;font-size:14px;transition:all .15s;}
      .btn-secondary:hover{background:#252d3d;}
      .btn-ghost{background:none;color:#94A3B8;border:1px solid #2D3748;padding:8px 16px;border-radius:6px;cursor:pointer;font-family:'Barlow Condensed',sans-serif;font-weight:600;font-size:14px;transition:all .15s;}
      .btn-ghost:hover{color:#E2E8F0;}
      .btn-danger{background:#7f1d1d;color:#fca5a5;border:1px solid #991b1b;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:13px;transition:all .15s;}
      .btn-danger:hover{background:#991b1b;}
      .card{background:#161B27;border:1px solid #1E2D40;border-radius:10px;}
      .vehicle-card:hover{border-color:#2d3f57 !important;box-shadow:0 8px 24px rgba(0,0,0,.4);}
      .fg{margin-bottom:14px;} .fl{display:block;font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;}
      .fi{width:100%;background:#0D1117;border:1px solid #2D3748;color:#E2E8F0;padding:10px 14px;border-radius:6px;font-size:14px;transition:border-color .15s;resize:vertical;}
      .fi:focus{outline:none;border-color:#F97316;} .fi:disabled{opacity:.5;cursor:not-allowed;}
      .fs{width:100%;background:#0D1117;border:1px solid #2D3748;color:#E2E8F0;padding:10px 14px;border-radius:6px;font-size:14px;}
      .fs:focus{outline:none;border-color:#F97316;}
      .sec-title{font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:700;color:#F1F5F9;margin-bottom:16px;}
      .g2{display:grid;grid-template-columns:1fr 1fr;gap:16px;} .g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;}
      .parts-row{display:grid;grid-template-columns:2fr 2fr 80px 130px auto;gap:10px;align-items:flex-end;margin-bottom:4px;}
      @media(max-width:768px){.g2,.g3{grid-template-columns:1fr;}.parts-row{grid-template-columns:1fr 1fr;}.hm{display:none!important;}.sm{display:flex!important;}}
      @media(min-width:769px){.sm{display:none!important;}}
      @media print{nav,button{display:none!important;}}
    `}</style>

    <nav style={{background:"#080D14",borderBottom:"1px solid #1E2D40",padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:58,position:"sticky",top:0,zIndex:200}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:36,height:36,background:"linear-gradient(135deg,#F97316,#ea6c10)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,boxShadow:"0 0 16px #F9731650"}}>🚛</div>
        <div><div style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:800,fontSize:19,color:"#F1F5F9",letterSpacing:1.5}}>FROTA PRO</div><div style={{fontSize:9,color:"#475569",letterSpacing:1.2}}>GESTÃO DE MANUTENÇÃO</div></div>
      </div>
      <div className="hm" style={{display:"flex",gap:2}}>
        {NAV.filter(i=>!i.perm||can(session,i.perm)).map(item=><button key={item.id} onClick={()=>nav(item.id)} style={{background:view===item.id?"#F97316":"transparent",color:view===item.id?"#fff":"#94A3B8",border:"none",padding:"7px 18px",borderRadius:6,cursor:"pointer",fontFamily:"Barlow Condensed,sans-serif",fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:7,transition:"all .15s"}}>
          {item.icon} {item.label}{item.badge>0&&<span style={{background:"#ef4444",color:"#fff",borderRadius:999,fontSize:10,padding:"1px 6px",fontWeight:800}}>{item.badge}</span>}
        </button>)}
      </div>
      <div className="hm" style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{textAlign:"right"}}><div style={{fontSize:13,fontWeight:700,color:"#E2E8F0"}}>{session.name}</div><div style={{fontSize:10,color:session.role==="admin"?"#818cf8":"#fdba74"}}>{session.role==="admin"?"👑 Admin":"🔧 Mecânico"}</div></div>
        <button onClick={logout} style={{background:"#1E2533",border:"1px solid #2D3748",color:"#94A3B8",padding:"7px 14px",borderRadius:6,cursor:"pointer",fontSize:13,fontFamily:"Barlow Condensed,sans-serif",fontWeight:600}}>Sair →</button>
      </div>
      <button className="sm btn-ghost" onClick={()=>setMenuOpen(!menuOpen)} style={{fontSize:20}}>{menuOpen?"✕":"☰"}</button>
    </nav>

    {menuOpen&&<div style={{background:"#080D14",borderBottom:"1px solid #1E2D40",padding:12,display:"flex",flexDirection:"column",gap:8,position:"sticky",top:58,zIndex:190}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px 12px",borderBottom:"1px solid #1E2D40",marginBottom:4}}>
        <div style={{width:36,height:36,borderRadius:"50%",background:session.role==="admin"?"linear-gradient(135deg,#6366f1,#4f46e5)":"linear-gradient(135deg,#F97316,#ea580c)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{session.role==="admin"?"👑":"🔧"}</div>
        <div><div style={{fontSize:14,fontWeight:700,color:"#F1F5F9"}}>{session.name}</div><div style={{fontSize:11,color:"#64748B"}}>@{session.username}</div></div>
      </div>
      {NAV.filter(i=>!i.perm||can(session,i.perm)).map(item=><button key={item.id} onClick={()=>nav(item.id)} style={{background:view===item.id?"#F97316":"#161B27",color:view===item.id?"#fff":"#94A3B8",border:"none",padding:"12px 16px",borderRadius:6,cursor:"pointer",fontFamily:"Barlow Condensed,sans-serif",fontWeight:700,fontSize:15,textAlign:"left",display:"flex",alignItems:"center",gap:10}}>
        {item.icon} {item.label}{item.badge>0&&<span style={{background:"#ef4444",color:"#fff",borderRadius:999,fontSize:11,padding:"1px 8px",marginLeft:"auto"}}>{item.badge}</span>}
      </button>)}
      <button onClick={logout} style={{background:"#7f1d1d20",color:"#fca5a5",border:"1px solid #7f1d1d50",padding:"12px 16px",borderRadius:6,cursor:"pointer",fontFamily:"Barlow Condensed,sans-serif",fontWeight:700,fontSize:14,textAlign:"left",marginTop:4}}>⬅ Sair</button>
    </div>}

    <main style={{maxWidth:1100,margin:"0 auto",padding:"28px 16px 60px"}}>{renderView()}</main>
  </div>;
}
