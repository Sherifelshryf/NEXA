import { useState, useRef, useEffect, useCallback } from "react";
import { animate, stagger } from "animejs";
import { createClient } from "@supabase/supabase-js";

/* ══════════════════════════════════════════
   SUPABASE CLIENT
══════════════════════════════════════════ */
const SUPA_URL = "https://niheflatontvfdmwcfis.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paGVmbGF0b250dmZkbXdjZmlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNzI4OTcsImV4cCI6MjA5MTk0ODg5N30.puXa4D7EuVqx1LPcnv9W3H9R4MDktWzQCE5sd2bz6K4";
const supabase = createClient(SUPA_URL, SUPA_KEY);


/* ══════════════════════════════════════════
   HOOKS / UTILS
══════════════════════════════════════════ */
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < breakpoint);
  useEffect(() => {
    let timer;
    const handler = () => { clearTimeout(timer); timer = setTimeout(() => setIsMobile(window.innerWidth < breakpoint), 100); };
    window.addEventListener("resize", handler);
    return () => { window.removeEventListener("resize", handler); clearTimeout(timer); };
  }, [breakpoint]);
  return isMobile;
}

function useAuth() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    setProfile(data);
    return data;
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      else { setProfile(null); }
    });
    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  return { session, profile, loading, fetchProfile };
}

function initials(name) {
  if (!name) return "??";
  const parts = name.trim().split(" ");
  return (parts[0]?.[0] || "") + (parts[1]?.[0] || parts[0]?.[1] || "");
}

function toast(msg, type = "ok") {
  const el = document.createElement("div");
  el.textContent = msg;
  el.style.cssText = `position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(20px);
    background:${type === "ok" ? "#16a34a" : "#dc2626"};color:#fff;
    padding:12px 24px;border-radius:50px;font-size:13px;font-weight:700;
    z-index:9999;transition:all .3s;box-shadow:0 4px 20px rgba(0,0,0,.4);
    font-family:'Montserrat',sans-serif;`;
  document.body.appendChild(el);
  requestAnimationFrame(() => { el.style.transform = "translateX(-50%) translateY(0)"; el.style.opacity = 1; });
  setTimeout(() => { el.style.opacity = 0; el.style.transform = "translateX(-50%) translateY(20px)"; setTimeout(() => el.remove(), 400); }, 3000);
}

/* ══════════════════════════════════════════
   COLOR SYSTEM (unchanged from original)
══════════════════════════════════════════ */
const C = {
  bg: "#020c18", bgCard: "#061524", bgElevated: "#091b2e", bgSurface: "#0d2540",
  navy: "#002b51", navyMid: "#23558a",
  orange: "#f2932b", orangeLight: "#fbb55a",
  sky: "#92b9d6", skyLight: "#b8d4e8",
  off: "#091b2e", border: "rgba(146,185,214,0.10)", borderMid: "rgba(146,185,214,0.20)",
  text: "#ddeaf4", textMid: "#7899aa", textMuted: "#3a5870",
};

/* ══════════════════════════════════════════
   VISUAL FX (unchanged from original)
══════════════════════════════════════════ */
function MatrixRain({ opacity = 0.18 }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    const fontSize = 13; let drops = [];
    function resize() {
      canvas.width = window.innerWidth; canvas.height = window.innerHeight;
      const cols = Math.floor(canvas.width / fontSize);
      drops = Array.from({ length: cols }, () => Math.random() * -50);
    }
    resize(); window.addEventListener("resize", resize);
    const chars = "アイウエカキクタナハマ01010011<>{}()=+-*/0x9FA3B2C1def function class import return yield async await AI ML NLP CNN RNN 0x1A 0xFF π∑∫∂∇Ω∈";
    function draw() {
      ctx.fillStyle = "rgba(2,12,24,0.055)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < drops.length; i++) {
        const idx = Math.floor(Math.random() * chars.length); const char = chars[idx];
        const x = i * fontSize; const y = drops[i] * fontSize;
        const isLead = Math.random() > 0.94; const isKeyword = idx > 40 && idx < 80;
        if (isLead) { ctx.fillStyle = "#92b9d6"; ctx.shadowColor = "#92b9d6"; ctx.shadowBlur = 8; }
        else if (isKeyword) { ctx.fillStyle = "rgba(242,147,43,0.6)"; ctx.shadowBlur = 0; }
        else { ctx.fillStyle = "rgba(35,85,138,0.7)"; ctx.shadowBlur = 0; }
        ctx.font = `${fontSize}px 'Courier New', monospace`; ctx.fillText(char, x, y); ctx.shadowBlur = 0;
        if (y > canvas.height && Math.random() > 0.972) drops[i] = 0;
        drops[i] += 0.5;
      }
      animId = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", opacity, pointerEvents: "none", zIndex: 0 }} />;
}

function AnimatedLetters({ text, style = {}, letterStyle = {}, animDelay = 0, animFrom = "bottom" }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const letters = ref.current.querySelectorAll(".letter");
    animate(letters, { opacity: [0, 1], translateY: animFrom === "bottom" ? [50, 0] : animFrom === "top" ? [-50, 0] : [0, 0], translateX: animFrom === "left" ? [-30, 0] : animFrom === "right" ? [30, 0] : [0, 0], scale: [0.8, 1], duration: 700, delay: stagger(55, { start: animDelay }), ease: "outExpo" });
  }, [animDelay, animFrom]);
  return (
    <span ref={ref} style={style}>
      {text.split("").map((ch, i) => <span key={i} className="letter" style={{ display: "inline-block", opacity: 0, ...letterStyle }}>{ch === " " ? "\u00A0" : ch}</span>)}
    </span>
  );
}

function Typewriter({ lines, style = {}, speed = 50, startDelay = 800 }) {
  const [displayed, setDisplayed] = useState(""); const [lineIdx, setLineIdx] = useState(0); const [charIdx, setCharIdx] = useState(0); const [started, setStarted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setStarted(true), startDelay); return () => clearTimeout(t); }, [startDelay]);
  useEffect(() => {
    if (!started) return; if (lineIdx >= lines.length) return;
    const line = lines[lineIdx];
    if (charIdx < line.length) { const t = setTimeout(() => { setDisplayed(prev => prev + line[charIdx]); setCharIdx(c => c + 1); }, speed); return () => clearTimeout(t); }
    else if (lineIdx < lines.length - 1) { const t = setTimeout(() => { setDisplayed(prev => prev + "\n"); setLineIdx(l => l + 1); setCharIdx(0); }, 400); return () => clearTimeout(t); }
  }, [started, lineIdx, charIdx, lines, speed]);
  return <span style={{ ...style, whiteSpace: "pre" }}>{displayed}<span style={{ animation: "blink 1s step-end infinite", color: C.orange }}>|</span></span>;
}

function FloatingTechBg() {
  const isMobile = useIsMobile();
  const icons = [{ icon: "🤖", x: "8%", y: "18%", size: 32, anim: "floatY", dur: "5.2s", delay: "0s" }, { icon: "🧠", x: "88%", y: "22%", size: 28, anim: "floatX", dur: "6.1s", delay: "1s" }, { icon: "⚡", x: "5%", y: "68%", size: 22, anim: "floatY", dur: "4.8s", delay: "0.5s" }, { icon: "🔬", x: "91%", y: "60%", size: 26, anim: "floatX", dur: "5.5s", delay: "2s" }, { icon: "🛸", x: "50%", y: "8%", size: 24, anim: "floatY", dur: "7s", delay: "1.5s" }, { icon: "💡", x: "20%", y: "85%", size: 20, anim: "floatX", dur: "4.5s", delay: "0.3s" }, { icon: "🔧", x: "78%", y: "88%", size: 22, anim: "floatY", dur: "5.8s", delay: "2.5s" }];
  if (isMobile) return null;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}>
      {icons.map((it, i) => <div key={i} style={{ position: "absolute", left: it.x, top: it.y, fontSize: it.size, opacity: 0.18, animation: `${it.anim} ${it.dur} ease-in-out ${it.delay} infinite`, filter: "saturate(0) brightness(2)" }}>{it.icon}</div>)}
      <svg style={{ position: "absolute", bottom: 0, left: 0, opacity: 0.08 }} width="260" height="260" viewBox="0 0 260 260" fill="none"><path d="M10 250 L10 80 L80 10 L250 10" stroke="#92b9d6" strokeWidth="1.5" fill="none" strokeDasharray="400" style={{ animation: "circuitTrace 4s ease-out 0.5s infinite" }} /><circle cx="10" cy="80" r="4" fill="#92b9d6" opacity="0.6" /><circle cx="80" cy="10" r="4" fill="#f2932b" opacity="0.7" /><path d="M40 250 L40 100 L100 40 L250 40" stroke="#23558a" strokeWidth="1" fill="none" strokeDasharray="400" style={{ animation: "circuitTrace 4s ease-out 1.2s infinite" }} /><path d="M10 160 L60 160 L60 130 L120 130" stroke="#f2932b" strokeWidth="1" fill="none" strokeDasharray="200" style={{ animation: "circuitTrace 3s ease-out 2s infinite" }} /><rect x="118" y="126" width="8" height="8" rx="2" fill="#f2932b" opacity="0.5" /><rect x="6" y="76" width="8" height="8" rx="2" fill="#92b9d6" opacity="0.5" /></svg>
      <svg style={{ position: "absolute", top: 0, right: 0, opacity: 0.08 }} width="260" height="260" viewBox="0 0 260 260" fill="none"><path d="M250 10 L250 180 L180 250 L10 250" stroke="#92b9d6" strokeWidth="1.5" fill="none" strokeDasharray="400" style={{ animation: "circuitTrace 4s ease-out 1s infinite" }} /><circle cx="250" cy="180" r="4" fill="#92b9d6" opacity="0.6" /><circle cx="180" cy="250" r="4" fill="#f2932b" opacity="0.7" /></svg>
      <div style={{ position: "absolute", top: 80, right: 60, width: 180, height: 180, background: "radial-gradient(circle, rgba(35,85,138,0.12) 0%, transparent 70%)", animation: "hexPulse 5s ease-in-out infinite", borderRadius: "50%" }} />
      <div style={{ position: "absolute", bottom: 100, left: 60, width: 140, height: 140, background: "radial-gradient(circle, rgba(242,147,43,0.08) 0%, transparent 70%)", animation: "hexPulse 6s ease-in-out 2s infinite", borderRadius: "50%" }} />
    </div>
  );
}

function ScanLine() {
  return <div style={{ position: "absolute", left: 0, right: 0, height: 2, zIndex: 1, pointerEvents: "none", background: "linear-gradient(90deg, transparent 0%, rgba(146,185,214,0.5) 30%, rgba(242,147,43,0.7) 50%, rgba(146,185,214,0.5) 70%, transparent 100%)", animation: "scanLine 8s ease-in-out 2s infinite", top: 0, boxShadow: "0 0 20px rgba(242,147,43,0.4)" }} />;
}

function AnimatedStat({ value, label, index, style = {} }) {
  const ref = useRef(null);
  useEffect(() => { if (!ref.current) return; animate(ref.current, { opacity: [0, 1], translateY: [20, 0], duration: 600, delay: 1200 + index * 120, ease: "outExpo" }); }, [index]);
  return <div ref={ref} style={{ opacity: 0, textAlign: "center", ...style }}>{value}{label}</div>;
}

/* ══════════════════════════════════════════
   SHARED UI COMPONENTS
══════════════════════════════════════════ */
const Avatar = ({ initials: ini, bg, size = 44, radius = "50%", src, style = {} }) => (
  <div style={{ width: size, height: size, borderRadius: radius, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: size * 0.3, color: "#fff", flexShrink: 0, overflow: "hidden", ...style }}>
    {src ? <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : ini}
  </div>
);

const Btn = ({ children, onClick, variant = "primary", block = false, disabled = false, loading: ld = false, style = {} }) => {
  const base = { fontFamily: "'Montserrat',sans-serif", fontWeight: 700, fontSize: 13, cursor: disabled || ld ? "not-allowed" : "pointer", border: "none", borderRadius: 50, padding: "11px 24px", transition: "all .2s", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: disabled || ld ? 0.6 : 1, ...(block ? { width: "100%", borderRadius: 10, padding: "14px 20px" } : {}), ...style };
  const variants = { primary: { background: C.orange, color: "#fff" }, navy: { background: C.navyMid, color: "#fff" }, outline: { background: "transparent", border: "1.5px solid rgba(255,255,255,.25)", color: "#fff" }, ghost: { background: "transparent", border: `1.5px solid ${C.border}`, color: C.text }, danger: { background: "#ef4444", color: "#fff" }, light: { background: "rgba(255,255,255,.08)", border: "1.5px solid rgba(255,255,255,.12)", color: "#fff" } };
  return <button style={{ ...base, ...variants[variant] }} onClick={disabled || ld ? undefined : onClick} disabled={disabled || ld}>{ld ? "Loading…" : children}</button>;
};

const Tag = ({ children, color = "navy" }) => {
  const map = { navy: { bg: "rgba(26,84,144,.3)", color: "#6ab0e0" }, orange: { bg: "rgba(242,147,43,.18)", color: "#fbb55a" }, sky: { bg: "rgba(58,127,168,.22)", color: "#7ec8e3" }, green: { bg: "rgba(34,197,94,.14)", color: "#4ade80" } };
  const s = map[color] || map.navy;
  return <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>{children}</span>;
};

const FInput = ({ label, optional, type = "text", placeholder, value, onChange, autoComplete }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: C.textMid, marginBottom: 6, letterSpacing: 1.5, textTransform: "uppercase" }}>{label}{optional && <span style={{ fontWeight: 400, color: C.textMuted }}> (optional)</span>}</label>}
    <input type={type} placeholder={placeholder} value={value} onChange={onChange} autoComplete={autoComplete}
      style={{ width: "100%", padding: "12px 14px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontFamily: "'Montserrat',sans-serif", fontSize: 13, color: C.text, background: C.bgSurface, outline: "none", boxSizing: "border-box" }} />
  </div>
);

const FSelect = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: C.textMid, marginBottom: 6, letterSpacing: 1.5, textTransform: "uppercase" }}>{label}</label>}
    <select value={value} onChange={onChange} style={{ width: "100%", padding: "12px 14px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontFamily: "'Montserrat',sans-serif", fontSize: 13, color: C.text, background: C.bgSurface, cursor: "pointer" }}>
      {options.map(o => <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>{typeof o === "string" ? o : o.label}</option>)}
    </select>
  </div>
);

const FormRow = ({ children }) => { const isMobile = useIsMobile(); return <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>{children}</div>; };
const Divider = ({ label }) => (<div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0", fontSize: 11, color: C.textMuted }}><div style={{ flex: 1, height: 1, background: C.border }} />{label}<div style={{ flex: 1, height: 1, background: C.border }} /></div>);
const Card = ({ children, style = {} }) => <div style={{ background: C.bgCard, borderRadius: 14, boxShadow: "0 4px 32px rgba(0,0,0,.5)", border: `1px solid ${C.border}`, overflow: "hidden", ...style }}>{children}</div>;
const CardHead = ({ title, right }) => (<div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}><div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 800, color: C.text }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: C.orange, flexShrink: 0, display: "inline-block" }} />{title}</div>{right}</div>);
const CardBody = ({ children, style = {} }) => <div style={{ padding: "18px 20px", ...style }}>{children}</div>;

const StatCard = ({ icon, value, label, trend, accent }) => (
  <div style={{ background: C.bgCard, borderRadius: 14, padding: 22, boxShadow: "0 4px 32px rgba(0,0,0,.4)", border: `1px solid ${C.border}`, position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent, borderRadius: "14px 14px 0 0" }} />
    <div style={{ width: 42, height: 42, borderRadius: 11, background: accent + "28", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, marginBottom: 14 }}>{icon}</div>
    <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, marginBottom: 3, color: C.text }}>{value}</div>
    <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>{label}</div>
    {trend && <span style={{ position: "absolute", top: 18, right: 18, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: "rgba(34,197,94,.12)", color: "#4ade80" }}>{trend}</span>}
  </div>
);

/* ══════════════════════════════════════════
   LANDING PAGE (100% unchanged from original)
══════════════════════════════════════════ */
function Landing({ goTo }) {
  const isMobile = useIsMobile();
  const heroRef = useRef(null);
  const taglineRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    if (taglineRef.current) animate(taglineRef.current, { opacity: [0, 1], translateY: [20, 0], duration: 900, delay: 900, ease: "outExpo" });
    if (ctaRef.current) animate(ctaRef.current.querySelectorAll("button"), { opacity: [0, 1], translateY: [20, 0], duration: 700, delay: stagger(120, { start: 1300 }), ease: "outExpo" });
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <MatrixRain opacity={0.22} />
      <div style={{ position: "absolute", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(242,147,43,.09) 0%, transparent 65%)", top: -350, right: -250, pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(35,85,138,.14) 0%, transparent 65%)", bottom: -250, left: -150, pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(146,185,214,.022) 1px, transparent 1px), linear-gradient(90deg, rgba(146,185,214,.022) 1px, transparent 1px)", backgroundSize: "80px 80px", pointerEvents: "none", zIndex: 1 }} />
      <FloatingTechBg />
      <ScanLine />

      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "16px 20px" : "24px 60px", position: "relative", zIndex: 10, borderBottom: `1px solid ${C.border}`, backdropFilter: "blur(8px)", background: "rgba(2,12,24,0.6)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg, ${C.orange}, #e07b1a)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 900, color: "#fff", letterSpacing: 1, fontFamily: "'Conthrax','Montserrat',sans-serif", animation: "glowPulse 3s ease-in-out infinite", boxShadow: `0 0 18px rgba(242,147,43,0.4)` }}>NX</div>
          <div>
            <div className="nexa-logo-text" style={{ fontSize: 21, fontWeight: 700, color: "#fff", letterSpacing: 4 }}>NEXA</div>
            <div style={{ fontSize: 8, color: C.orange, letterSpacing: 3, textTransform: "uppercase", opacity: 0.8, fontFamily: "'Montserrat',sans-serif" }}>AI · Robotics · Coding</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: isMobile ? 8 : 10 }}>
          <Btn variant="outline" style={isMobile ? { padding: "9px 14px", fontSize: 12 } : {}} onClick={() => goTo("login")}>Log In</Btn>
          <Btn variant="primary" style={{ ...(isMobile ? { padding: "9px 14px", fontSize: 12 } : {}), animation: "glowPulse 2.5s ease-in-out infinite" }} onClick={() => goTo("signup")}>Join NEXA</Btn>
        </div>
      </nav>

      <div ref={heroRef} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: isMobile ? "40px 20px 60px" : "60px 40px 80px", position: "relative", zIndex: 5 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 36, animation: "fadeInUp 0.7s ease 0.2s both" }}>
          <div style={{ height: 1, width: 44, background: `linear-gradient(90deg, transparent, ${C.orange})`, opacity: 0.8 }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: C.orange, letterSpacing: 4, textTransform: "uppercase", fontFamily: "'Montserrat',sans-serif" }}>Cairo, Egypt · Est. 2025 · Vol. I</span>
          <div style={{ height: 1, width: 44, background: `linear-gradient(90deg, ${C.orange}, transparent)`, opacity: 0.8 }} />
        </div>
        <h1 style={{ margin: 0, lineHeight: 0.92 }}>
          <AnimatedLetters text="NEXA" style={{ fontSize: "clamp(54px,9vw,104px)", fontFamily: "'Conthrax','Montserrat',sans-serif", fontWeight: 700, color: "#fff", letterSpacing: isMobile ? 6 : 10, display: "block" }} animDelay={200} animFrom="bottom" />
        </h1>
        <h1 style={{ margin: "0 0 10px" }}>
          <AnimatedLetters text="TECH" style={{ fontSize: "clamp(54px,9vw,104px)", fontFamily: "'Conthrax','Montserrat',sans-serif", fontWeight: 700, letterSpacing: isMobile ? 6 : 10, display: "block" }} letterStyle={{ color: C.orange }} animDelay={450} animFrom="bottom" />
        </h1>
        <div style={{ fontSize: "clamp(10px,1.2vw,13px)", color: "rgba(255,255,255,.22)", letterSpacing: 10, textTransform: "uppercase", marginBottom: 28, fontWeight: 300, fontFamily: "'Montserrat',sans-serif", animation: "fadeInUp 0.8s ease 0.8s both" }}>— School —</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, width: "100%", maxWidth: 520, marginBottom: 28, animation: "fadeInUp 0.7s ease 0.85s both" }}>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${C.sky})`, opacity: 0.4 }} />
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.orange, display: "inline-block", flexShrink: 0, animation: "pulseGlow 2s ease-in-out infinite" }} />
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${C.sky}, transparent)`, opacity: 0.4 }} />
        </div>
        <div ref={taglineRef} style={{ opacity: 0, marginBottom: 36, maxWidth: 480 }}>
          <p style={{ fontSize: isMobile ? 15 : 17, color: "rgba(255,255,255,.50)", fontWeight: 300, fontStyle: "italic", lineHeight: 1.8, margin: 0, fontFamily: "'Montserrat',sans-serif" }}>
            We don't teach technology…<br />
            <span style={{ fontFamily: "'Riffic Free','Montserrat',sans-serif", color: C.sky, fontStyle: "normal", fontSize: isMobile ? 13 : 15 }}>We build creators.</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginBottom: 36, animation: "fadeInUp 0.7s ease 1.1s both" }}>
          {[["🤖", "Robotics"], ["🧠", "AI & ML"], ["💻", "Coding"], ["⚡", "Electronics"]].map(([ic, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 16px", borderRadius: 50, border: `1px solid ${C.border}`, background: "rgba(35,85,138,0.15)", backdropFilter: "blur(4px)", fontSize: 12, fontWeight: 600, color: C.sky, fontFamily: "'Montserrat',sans-serif" }}>
              <span>{ic}</span><span>{label}</span>
            </div>
          ))}
        </div>
        <div ref={ctaRef} style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 14, width: isMobile ? "100%" : "auto", maxWidth: isMobile ? 320 : "none" }}>
          <Btn variant="primary" style={{ opacity: 0, padding: "15px 40px", fontSize: 14, borderRadius: 50, background: `linear-gradient(135deg, ${C.orange}, #e07b1a)`, boxShadow: `0 4px 24px rgba(242,147,43,0.4)`, ...(isMobile ? { width: "100%" } : {}) }} onClick={() => goTo("signup")}>Create Account</Btn>
          <Btn variant="outline" style={{ opacity: 0, padding: "15px 40px", fontSize: 14, borderRadius: 50, border: `1.5px solid rgba(146,185,214,0.3)`, backdropFilter: "blur(4px)", ...(isMobile ? { width: "100%" } : {}) }} onClick={() => goTo("login")}>Sign In</Btn>
        </div>
        <div style={{ display: "flex", gap: 0, marginTop: 64, flexWrap: "wrap", justifyContent: "center", borderTop: `1px solid ${C.border}`, paddingTop: 40, width: "100%", maxWidth: 600 }}>
          {[["3", "Year Program"], ["432", "Total Hours"], ["4", "Systems"], ["6–17", "Age Range"]].map(([n, l], i) => (
            <AnimatedStat key={i} index={i}
              style={{ padding: isMobile ? "0 14px" : "0 34px", borderRight: i < 3 ? `1px solid ${C.border}` : "none" }}
              value={<div style={{ fontSize: isMobile ? 28 : 36, fontWeight: 900, color: C.orange, letterSpacing: 2, fontFamily: "'Conthrax','Montserrat',sans-serif" }}>{n}</div>}
              label={<div style={{ fontSize: 9, color: "rgba(255,255,255,.28)", letterSpacing: 3, textTransform: "uppercase", marginTop: 5, fontFamily: "'Montserrat',sans-serif" }}>{l}</div>}
            />
          ))}
        </div>
      </div>
      <div style={{ position: "relative", zIndex: 5, textAlign: "center", padding: "12px 20px", borderTop: `1px solid ${C.border}`, background: "rgba(2,12,24,0.7)", backdropFilter: "blur(8px)" }}>
        <span style={{ fontSize: 10, color: C.textMuted, letterSpacing: 2, textTransform: "uppercase", fontFamily: "'Montserrat',sans-serif" }}>NEXA Tech School · Cairo, Egypt · AI · Robotics · Coding · Est. 2025</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   ROLE PICKER
══════════════════════════════════════════ */
function RolePicker({ mode, onSelect }) {
  const [role, setRole] = useState("parent");
  const roles = [{ id: "parent", icon: "👨‍👩‍👧", title: "Parent", desc: "Manage & track your children" }, { id: "student", icon: "🎓", title: "Student", desc: "Access your learning portal" }, { id: "instructor", icon: "👨‍🏫", title: "Instructor", desc: "Manage your classes" }];
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
      <MatrixRain opacity={0.10} />
      <div style={{ background: C.bgCard, borderRadius: 20, padding: "40px 36px", maxWidth: 460, width: "90%", position: "relative", zIndex: 2, border: `1px solid ${C.border}`, boxShadow: "0 20px 60px rgba(0,0,0,.6)" }}>
        <div style={{ textAlign: "center", marginBottom: 4 }}><div className="nexa-logo-text" style={{ fontSize: 22, fontWeight: 700, color: C.orange, letterSpacing: 4 }}>NEXA</div></div>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 6, textAlign: "center" }}>{mode === "login" ? "How are you signing in?" : "Who are you?"}</div>
        <div style={{ fontSize: 13, color: C.textMuted, textAlign: "center", marginBottom: 28 }}>{mode === "login" ? "Select your account type to continue" : "Choose your role to create an account"}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
          {roles.map(r => (
            <div key={r.id} onClick={() => setRole(r.id)} style={{ border: `2px solid ${role === r.id ? C.orange : C.border}`, background: role === r.id ? "rgba(242,147,43,.08)" : C.bgElevated, borderRadius: 14, padding: "20px 12px", cursor: "pointer", textAlign: "center", transition: "all .2s", boxShadow: role === r.id ? `0 0 16px rgba(242,147,43,0.2)` : "none" }}>
              <div style={{ fontSize: 30, marginBottom: 8 }}>{r.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 3 }}>{r.title}</div>
              <div style={{ fontSize: 10, color: C.textMuted }}>{r.desc}</div>
            </div>
          ))}
        </div>
        <Btn variant="primary" block onClick={() => onSelect(role)}>Continue →</Btn>
        <Btn variant="ghost" block style={{ marginTop: 10, borderRadius: 10 }} onClick={() => onSelect(null)}>← Back to home</Btn>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   LOGIN (real Supabase auth)
══════════════════════════════════════════ */
function LoginPage({ role, goTo, onAuthSuccess }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [ld, setLd] = useState(false);
  const icons = { parent: "👨‍👩‍👧 Parent", student: "🎓 Student", instructor: "👨‍🏫 Instructor" };

  async function doLogin() {
    if (!email || !pass) { setErr("Please enter your email and password."); return; }
    setLd(true); setErr("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) { setErr(error.message); setLd(false); return; }
    // Fetch profile
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
    if (!profile?.role) {
      // No role yet — redirect to complete profile
      goTo("complete-profile");
    } else {
      onAuthSuccess(profile);
    }
    setLd(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <MatrixRain opacity={0.10} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(180deg, rgba(0,43,81,.35) 0%, transparent 100%)", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ background: C.bgCard, borderRadius: 22, padding: "40px 44px", width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,.7)", border: `1px solid ${C.border}`, position: "relative", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, justifyContent: "center", marginBottom: 6 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: `linear-gradient(135deg,${C.orange},#e07b1a)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "'Conthrax','Montserrat',sans-serif", boxShadow: `0 0 14px rgba(242,147,43,0.35)` }}>NX</div>
          <div><div className="nexa-logo-text" style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: 4 }}>NEXA</div><div style={{ fontSize: 8, color: C.textMuted, letterSpacing: 2 }}>AI · ROBOTICS · CODING</div></div>
        </div>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Tag color="navy">{icons[role]}</Tag>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginTop: 10, marginBottom: 4 }}>Welcome Back</div>
          <div style={{ fontSize: 12, color: C.textMuted }}>Sign in to access your NEXA portal</div>
        </div>
        {err && <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#f87171", marginBottom: 14 }}>{err}</div>}
        <FInput label="Email Address" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
        <FInput label="Password" type="password" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} autoComplete="current-password" />
        <Btn variant="navy" block style={{ marginTop: 6 }} onClick={doLogin} loading={ld}>Sign In to Portal</Btn>
        <div style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: C.textMuted }}>
          No account? <span style={{ color: C.orange, fontWeight: 700, cursor: "pointer" }} onClick={() => goTo("signup")}>Create one →</span>
        </div>
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <span style={{ fontSize: 11, color: C.textMuted, cursor: "pointer" }} onClick={() => goTo("landing")}>← Back to home</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   SIGNUP (real Supabase auth)
══════════════════════════════════════════ */
function SignupPage({ role, goTo, onAuthSuccess }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", full_name: "", phone: "", age: "", student_email: "", subject: "" });
  const [avatarUrl, setAvatarUrl] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [ld, setLd] = useState(false);
  const fileRef = useRef(null);

  const f = (k) => form[k] || "";
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: typeof e === "string" ? e : e.target.value }));

  async function handleAvatarUpload(e) {
    const file = e.target.files[0]; if (!file) return;
    const ext = file.name.split(".").pop();
    const path = `avatars/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { toast("Avatar upload failed", "err"); return; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(publicUrl);
    toast("Photo uploaded!");
  }

  async function doSignup() {
    setErr(""); setOk("");
    if (!f("email") || !f("password")) { setErr("Email and password are required."); return; }
    if (f("password").length < 8) { setErr("Password must be at least 8 characters."); return; }
    if (f("password") !== f("confirmPassword")) { setErr("Passwords don't match."); return; }
    if (!f("full_name")) { setErr("Please enter your full name."); return; }
    if (role === "instructor" && !f("subject")) { setErr("Please select your subject."); return; }
    setLd(true);

    // 1. Create auth user
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: f("email"),
      password: f("password"),
      options: { data: { full_name: f("full_name") } }
    });
    if (authErr) { setErr(authErr.message); setLd(false); return; }

    // 2. Wait for session to be fully active so RLS allows the insert
    let session = authData.session;
    if (!session) {
      // Poll up to 5 seconds for the session to be established
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 500));
        const { data: { session: s } } = await supabase.auth.getSession();
        if (s) { session = s; break; }
      }
    }
    if (!session) { setErr("Session could not be established. Please try logging in."); setLd(false); return; }

    // 3. Build profile payload
    const payload = {
      id: authData.user.id,
      email: f("email"),
      full_name: f("full_name"),
      role,
      phone: f("phone") || null,
      avatar_url: avatarUrl || null,
      enrollment_date: new Date().toISOString().split("T")[0],
    };
    if (role === "student") {
      payload.age = f("age") ? parseInt(f("age")) : null;
      payload.current_level = 1;
      payload.total_xp = 0;
      payload.skills = { logic: 0, coding: 0, hardware: 0, ai: 0 };
    }
    if (role === "parent") {
      payload.student_email = f("student_email")?.toLowerCase().trim() || null;
    }
    if (role === "instructor") {
      payload.subject = f("subject");
    }

    // 4. Upsert profile — session is now active so RLS (auth.uid() = id) will pass
    const { error: profErr } = await supabase.from("profiles").upsert(payload);
    if (profErr) { setErr(profErr.message); setLd(false); return; }

    // 5. Link parent → student if email provided
    if (role === "parent" && f("student_email")) {
      const { data: students } = await supabase.from("profiles").select("id").eq("email", f("student_email").toLowerCase().trim());
      if (students?.length > 0) {
        await supabase.from("profiles").update({ parent_email: f("email") }).eq("id", students[0].id);
      }
    }

    setOk(role === "instructor" ? "Application submitted! You'll be reviewed within 24 hours." : "Account created! Welcome to NEXA 🚀");
    setTimeout(() => onAuthSuccess(payload), 1200);
    setLd(false);
  }

  const icons = { parent: "👨‍👩‍👧 Parent", student: "🎓 Student", instructor: "👨‍🏫 Instructor" };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", padding: "40px 20px" }}>
      <MatrixRain opacity={0.10} />
      <div style={{ background: C.bgCard, borderRadius: 22, padding: "36px 40px", width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,.7)", border: `1px solid ${C.border}`, position: "relative", zIndex: 2, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, justifyContent: "center", marginBottom: 6 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: `linear-gradient(135deg,${C.orange},#e07b1a)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>NX</div>
          <div><div className="nexa-logo-text" style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: 4 }}>NEXA</div><div style={{ fontSize: 8, color: C.textMuted, letterSpacing: 2 }}>AI · ROBOTICS · CODING</div></div>
        </div>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <Tag color="navy">{icons[role]}</Tag>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.text, marginTop: 10, marginBottom: 4 }}>Create Your Account</div>
          <div style={{ fontSize: 12, color: C.textMuted }}>Join the NEXA community</div>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22, justifyContent: "center" }}>
          {[1, 2].map(s => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: s <= step ? C.orange : C.bgElevated, border: `2px solid ${s <= step ? C.orange : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: s <= step ? "#fff" : C.textMuted }}>{s}</div>
              {s < 2 && <div style={{ width: 40, height: 2, background: step > s ? C.orange : C.border, borderRadius: 2 }} />}
            </div>
          ))}
        </div>

        {err && <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#f87171", marginBottom: 14 }}>{err}</div>}
        {ok && <div style={{ background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.25)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#4ade80", marginBottom: 14 }}>{ok}</div>}

        {step === 1 && <>
          {/* Account credentials */}
          <FInput label="Full Name" placeholder="Your full name" value={f("full_name")} onChange={set("full_name")} autoComplete="name" />
          <FInput label="Email Address" type="email" placeholder="you@example.com" value={f("email")} onChange={set("email")} autoComplete="email" />
          <FormRow>
            <FInput label="Password" type="password" placeholder="Min 8 chars" value={f("password")} onChange={set("password")} autoComplete="new-password" />
            <FInput label="Confirm Password" type="password" placeholder="Repeat" value={f("confirmPassword")} onChange={set("confirmPassword")} autoComplete="new-password" />
          </FormRow>
          <Btn variant="primary" block onClick={() => { if (!f("full_name") || !f("email") || !f("password")) { setErr("Fill all required fields."); return; } setErr(""); setStep(2); }} style={{ marginTop: 8 }}>Continue →</Btn>
        </>}

        {step === 2 && <>
          {/* Profile details */}
          {/* Avatar */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div onClick={() => fileRef.current?.click()} style={{ width: 80, height: 80, borderRadius: "50%", border: `2px dashed ${C.borderMid}`, cursor: "pointer", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: C.bgElevated }}>
              {avatarUrl ? <img src={avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 28, opacity: 0.5 }}>📷</span>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
            <div style={{ fontSize: 11, color: C.textMuted }}>Profile photo (optional)</div>
          </div>

          <FInput label="Phone Number" optional placeholder="01XXXXXXXXX" value={f("phone")} onChange={set("phone")} />

          {role === "student" && (
            <FSelect label="Age" value={f("age")} onChange={set("age")}
              options={[{ value: "", label: "Select age…" }, ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 6), label: `${i + 6} years old` }))]} />
          )}

          {role === "parent" && <>
            <Divider label="Link Your Child" />
            <div style={{ background: C.bgElevated, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.orangeLight, marginBottom: 3 }}>🔗 Connect your child's account</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 10 }}>Enter your child's registered email to link their dashboard</div>
              <FInput placeholder="child@email.com" type="email" value={f("student_email")} onChange={set("student_email")} />
              <div style={{ fontSize: 10, color: C.textMuted }}>Your account will automatically link to their progress.</div>
            </div>
          </>}

          {role === "instructor" && (
            <FSelect label="Subject / Specialization" value={f("subject")} onChange={set("subject")}
              options={[{ value: "", label: "Select subject…" }, "Robotics", "Artificial Intelligence", "Programming", "Marketing Technology"]} />
          )}

          {role === "instructor" && (
            <div style={{ background: "rgba(242,147,43,.07)", border: "1px solid rgba(242,147,43,.18)", borderRadius: 9, padding: "11px 14px", fontSize: 11, color: "#fbb55a", marginBottom: 14 }}>
              ⏳ Instructor accounts are reviewed by NEXA admin before activation (usually within 24 hours).
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="ghost" style={{ padding: "13px 20px", borderRadius: 10 }} onClick={() => { setErr(""); setStep(1); }}>← Back</Btn>
            <Btn variant="primary" block style={{ borderRadius: 10 }} onClick={doSignup} loading={ld}>
              {role === "instructor" ? "Submit Application" : "Create Account 🚀"}
            </Btn>
          </div>
        </>}

        <div style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: C.textMuted }}>
          Already have an account? <span style={{ color: C.orange, fontWeight: 700, cursor: "pointer" }} onClick={() => goTo("login")}>Sign in →</span>
        </div>
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <span style={{ fontSize: 11, color: C.textMuted, cursor: "pointer" }} onClick={() => goTo("landing")}>← Back to home</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   HOME PAGES (role landing after login)
══════════════════════════════════════════ */
function HomeCard({ profile, onGoToDash, onLogout }) {
  const role = profile.role;
  const name = profile.full_name || profile.email?.split("@")[0] || "User";
  const ini = initials(name).toUpperCase();
  const accent = role === "student" ? C.orange : role === "parent" ? C.navyMid : C.sky;
  const roleLabels = { student: "🎓 Student Account", parent: "👨‍👩‍👧 Parent Account", instructor: "👨‍🏫 Instructor" };
  const dashBtns = {
    student: [{ icon: "🚀", title: "My Learning Dashboard", sub: "Subjects, grades, XP & achievements" }, { icon: "📅", title: "My Schedule", sub: `Level ${profile.current_level || 1} · ${profile.total_xp || 0} XP` }, { icon: "🏆", title: "Hall of Fame", sub: "Rankings & achievements" }],
    parent: [{ icon: "📊", title: "Parent Dashboard", sub: "Grades, progress, attendance & more" }, { icon: "💬", title: "Messages", sub: "Instructor communications" }, { icon: "📅", title: "Upcoming Sessions", sub: "Your child's schedule" }],
    instructor: [{ icon: "📋", title: "Instructor Dashboard", sub: "Students, grades, sessions & notes" }, { icon: "📅", title: "Today's Sessions", sub: "Manage your classes" }, { icon: "💬", title: "Messages", sub: "Parent & student communications" }],
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <MatrixRain opacity={0.08} />
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(242,147,43,.08) 0%, transparent 70%)", top: -150, right: -100, pointerEvents: "none", zIndex: 1 }} />
      <div style={{ background: C.bgCard, borderRadius: 24, padding: "44px 48px", maxWidth: 480, width: "90%", position: "relative", zIndex: 2, textAlign: "center", border: `1px solid ${C.border}`, boxShadow: "0 20px 60px rgba(0,0,0,.6)" }}>
        <Avatar ini={ini} bg={accent} size={80} radius={20} src={profile.avatar_url} style={{ margin: "0 auto 16px", border: `3px solid ${accent}40` }} />
        <div style={{ marginBottom: 6 }}><Tag color="navy">{roleLabels[role]}</Tag></div>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 4 }}>{name}</div>
        <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 28, lineHeight: 1.7 }}>
          {profile.email}<br />
          {role === "student" && <span>Year {profile.year || 1} · Level <b style={{ color: C.orangeLight }}>{profile.current_level || 1}</b> · <b style={{ color: C.orange }}>{profile.total_xp || 0}</b> XP</span>}
          {role === "parent" && <span>Linked to: <b style={{ color: C.orangeLight }}>{profile.student_email || "No child linked yet"}</b></span>}
          {role === "instructor" && <span>Subject: <b style={{ color: C.orangeLight }}>{profile.subject || "Not set"}</b></span>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {dashBtns[role].map((b, i) => (
            <button key={i} onClick={onGoToDash} style={{ display: "flex", alignItems: "center", gap: 14, background: C.bgElevated, border: `1px solid ${C.border}`, borderRadius: 14, padding: "17px 20px", cursor: "pointer", width: "100%", fontFamily: "'Montserrat',sans-serif", textAlign: "left", transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = C.bgSurface; e.currentTarget.style.borderColor = C.borderMid; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.bgElevated; e.currentTarget.style.borderColor = C.border; }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(242,147,43,.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{b.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{b.title}</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{b.sub}</div>
              </div>
              <span style={{ fontSize: 18, color: C.textMuted }}>→</span>
            </button>
          ))}
          <button onClick={onLogout} style={{ background: "transparent", border: `1.5px solid ${C.border}`, borderRadius: 10, padding: 11, color: C.textMuted, fontFamily: "'Montserrat',sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Sign Out</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   DASHBOARD SHELL
══════════════════════════════════════════ */
function Shell({ sidebarItems, user: profile, onHome, pageTitle, topRight, children, accent }) {
  const name = profile?.full_name || profile?.email?.split("@")[0] || "User";
  const ini = initials(name).toUpperCase();
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: "'Montserrat',sans-serif" }}>
      <div style={{ width: 252, minHeight: "100vh", background: C.bgCard, display: "flex", flexDirection: "column", padding: "22px 0", position: "fixed", top: 0, left: 0, zIndex: 100, borderRight: `1px solid ${C.border}` }}>
        <div style={{ padding: "0 20px 22px", borderBottom: `1px solid ${C.border}`, marginBottom: 14, display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: `linear-gradient(135deg,${C.orange},#e07b1a)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "#fff" }}>NX</div>
          <div><div className="nexa-logo-text" style={{ fontSize: 16, fontWeight: 700, color: accent || C.orange, letterSpacing: 3 }}>NEXA</div><div style={{ fontSize: 8, color: C.textMuted, letterSpacing: 2 }}>PORTAL</div></div>
        </div>
        {sidebarItems}
        <div style={{ marginTop: "auto", padding: "18px 20px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Avatar ini={ini} bg={accent || C.navyMid} size={34} src={profile?.avatar_url} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
              <div style={{ fontSize: 10, color: C.textMuted }}>{profile?.role}</div>
            </div>
            <button onClick={onHome} title="Home" style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(255,255,255,.05)", border: `1px solid ${C.border}`, cursor: "pointer", color: C.textMuted, fontSize: 14 }}>⌂</button>
          </div>
        </div>
      </div>
      <div style={{ marginLeft: 252, flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <div style={{ background: C.bgCard, padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>{pageTitle}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>{topRight}</div>
        </div>
        <div style={{ padding: "26px 28px", flex: 1, overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, badge, active, onClick, accent }) {
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 20px", cursor: "pointer", borderLeft: `3px solid ${active ? (accent || C.orange) : "transparent"}`, background: active ? `${accent || C.orange}14` : "transparent", color: active ? C.text : C.textMuted, fontSize: 12, fontWeight: 600, transition: "all .15s" }}>
      <span style={{ width: 17, textAlign: "center", fontSize: 15 }}>{icon}</span>
      {label}
      {badge > 0 && <span style={{ marginLeft: "auto", background: accent || C.orange, color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 20 }}>{badge}</span>}
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: 3, textTransform: "uppercase", padding: "14px 20px 7px", fontWeight: 700 }}>{children}</div>;
}

/* ── Messages thread ── */
function MsgThread({ fromId, toId, myProfile }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [toProfile, setToProfile] = useState(null);
  const threadRef = useRef(null);

  useEffect(() => {
    if (!toId) return;
    // Load recipient profile
    supabase.from("profiles").select("full_name,avatar_url,role").eq("id", toId).single()
      .then(({ data }) => setToProfile(data));
    // Load messages
    loadMsgs();
    // Subscribe to realtime
    const ch = supabase.channel("msgs-" + fromId + toId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => loadMsgs())
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [fromId, toId]);

  async function loadMsgs() {
    const { data } = await supabase.from("messages")
      .select("*")
      .or(`and(from_id.eq.${fromId},to_id.eq.${toId}),and(from_id.eq.${toId},to_id.eq.${fromId})`)
      .order("created_at", { ascending: true });
    setMsgs(data || []);
    setTimeout(() => threadRef.current && (threadRef.current.scrollTop = threadRef.current.scrollHeight), 50);
  }

  async function send() {
    if (!input.trim() || !toId) return;
    await supabase.from("messages").insert({ from_id: fromId, to_id: toId, body: input.trim() });
    setInput("");
  }

  const myName = myProfile?.full_name || "Me";
  const myIni = initials(myName).toUpperCase();
  const otherName = toProfile?.full_name || "User";
  const otherIni = initials(otherName).toUpperCase();

  return (
    <div>
      {toProfile && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, padding: "10px 14px", background: C.bgElevated, borderRadius: 10 }}>
        <Avatar ini={otherIni} bg={C.navyMid} size={34} src={toProfile.avatar_url} />
        <div><div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{otherName}</div><div style={{ fontSize: 10, color: C.textMuted }}>{toProfile.role}</div></div>
        <span style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
      </div>}
      <div ref={threadRef} style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: 360, overflowY: "auto", padding: 4, marginBottom: 14 }}>
        {msgs.length === 0 && <div style={{ textAlign: "center", color: C.textMuted, fontSize: 12, padding: "30px 0" }}>No messages yet. Start the conversation!</div>}
        {msgs.map(m => {
          const isMe = m.from_id === fromId;
          return (
            <div key={m.id} style={{ display: "flex", gap: 9, maxWidth: "80%", alignSelf: isMe ? "flex-end" : "flex-start", flexDirection: isMe ? "row-reverse" : "row" }}>
              <Avatar ini={isMe ? myIni : otherIni} bg={isMe ? C.orange : C.navyMid} size={30} src={isMe ? myProfile?.avatar_url : toProfile?.avatar_url} />
              <div>
                <div style={{ padding: "9px 13px", borderRadius: 13, fontSize: 12, lineHeight: 1.5, background: isMe ? C.navyMid : C.bgElevated, color: C.text, border: `1px solid ${C.border}`, borderTopLeftRadius: isMe ? 13 : 3, borderTopRightRadius: isMe ? 3 : 13 }}>{m.body}</div>
                <div style={{ fontSize: 9, color: C.textMuted, marginTop: 3, textAlign: isMe ? "right" : "left" }}>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 10, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Type a message…" style={{ flex: 1, padding: "10px 14px", border: `1.5px solid ${C.border}`, borderRadius: 50, fontFamily: "'Montserrat',sans-serif", fontSize: 12, color: C.text, background: C.bgSurface, outline: "none" }} />
        <button onClick={send} style={{ width: 40, height: 40, borderRadius: "50%", background: C.navyMid, border: "none", cursor: "pointer", color: "#fff", fontSize: 16 }}>➤</button>
      </div>
    </div>
  );
}

/* ── Notifications ── */
function NotificationsPanel({ profile }) {
  const [notifs, setNotifs] = useState([]);
  useEffect(() => {
    supabase.from("notifications").select("*").eq("user_id", profile.id).order("created_at", { ascending: false })
      .then(({ data }) => setNotifs(data || []));
  }, [profile.id]);

  async function markRead(id) {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x));
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, color: C.text }}>Notifications</h1><p style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>{notifs.filter(n => !n.read).length} unread</p></div>
      {notifs.length === 0 ? <div style={{ textAlign: "center", color: C.textMuted, fontSize: 14, padding: "40px 0" }}>No notifications yet.</div> :
        notifs.map(n => (
          <div key={n.id} onClick={() => markRead(n.id)} style={{ display: "flex", gap: 14, padding: 16, background: n.read ? C.bgElevated : C.bgSurface, borderRadius: 10, marginBottom: 10, border: `1px solid ${n.read ? C.border : C.borderMid}`, cursor: "pointer" }}>
            <div style={{ fontSize: 20 }}>{n.type === "grade" ? "📊" : n.type === "message" ? "💬" : "🔔"}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{n.title}</div>
              {n.body && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>{n.body}</div>}
              <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4 }}>{new Date(n.created_at).toLocaleDateString()}</div>
            </div>
            {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.orange, flexShrink: 0, marginTop: 4 }} />}
          </div>
        ))}
    </div>
  );
}

/* ══════════════════════════════════════════
   STUDENT DASHBOARD
══════════════════════════════════════════ */
function StudentDash({ profile, onHome }) {
  const [page, setPage] = useState("overview");
  const [grades, setGrades] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [contactList, setContactList] = useState([]);
  const [msgTo, setMsgTo] = useState(null);

  useEffect(() => {
    supabase.from("grades").select("*").eq("student_id", profile.id).order("graded_at", { ascending: false }).then(({ data }) => setGrades(data || []));
    supabase.from("achievements").select("*").eq("student_id", profile.id).then(({ data }) => setAchievements(data || []));
    supabase.from("sessions").select("*").order("session_date").limit(10).then(({ data }) => setSessions(data || []));
    supabase.from("profiles").select("id,full_name,avatar_url,current_level,total_xp,role").eq("role", "student").order("total_xp", { ascending: false }).limit(10).then(({ data }) => setLeaderboard(data || []));
    // Get instructors to message
    supabase.from("profiles").select("id,full_name,avatar_url,subject,role").eq("role", "instructor").then(({ data }) => setContactList(data || []));
  }, [profile.id]);

  const avgGrade = grades.length ? Math.round(grades.reduce((a, g) => a + (g.score || 0), 0) / grades.length) : 0;
  const name = profile.full_name || profile.email?.split("@")[0];

  const navItems = [
    [{ section: "My Learning" }],
    [{ icon: "🏠", label: "Overview", id: "overview" }],
    [{ icon: "📊", label: "My Grades", id: "grades" }],
    [{ icon: "📅", label: "Schedule", id: "schedule" }],
    [{ icon: "🏆", label: "Hall of Fame", id: "leaderboard" }],
    [{ section: "Communication" }],
    [{ icon: "💬", label: "Messages", id: "messages" }],
    [{ icon: "🔔", label: "Notifications", id: "notifications" }],
  ];

  const titles = { overview: "My Dashboard", grades: "My Grades", schedule: "Schedule", leaderboard: "Hall of Fame", messages: "Messages", notifications: "Notifications" };

  return (
    <Shell accent={C.orange} sidebarItems={
      navItems.map((n, i) => n[0]?.section
        ? <SectionLabel key={i}>{n[0].section}</SectionLabel>
        : <NavItem key={i} icon={n[0].icon} label={n[0].label} active={page === n[0].id} onClick={() => setPage(n[0].id)} accent={C.orange} />)
    } user={profile} onHome={onHome} pageTitle={titles[page] || "Dashboard"}
      topRight={<><span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: "rgba(242,147,43,.15)", color: C.orangeLight }}>🚀 Level {profile.current_level || 1}</span></>}>

      {/* OVERVIEW */}
      {page === "overview" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, color: C.text }}>Hey, {name.split(" ")[0]}! 👋</h1><p style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>Level {profile.current_level || 1} · {profile.total_xp || 0} XP</p></div>
        {/* XP bar */}
        <Card style={{ marginBottom: 22, border: "none", background: `linear-gradient(135deg,${C.navy},${C.navyMid})` }}>
          <CardBody style={{ padding: "22px 26px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
              <div><div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 3 }}>Level {profile.current_level || 1} XP</div><div style={{ fontSize: 32, fontWeight: 800, color: C.orange }}>{profile.total_xp || 0}</div><div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: 2 }}>/ 2000 XP to next level</div></div>
              <div style={{ flex: 1, maxWidth: 360 }}><div style={{ background: "rgba(255,255,255,.1)", borderRadius: 50, height: 8, overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.min(100, ((profile.total_xp || 0) % 2000) / 20)}%`, background: `linear-gradient(90deg,${C.orange},${C.orangeLight})`, borderRadius: 50 }} /></div></div>
            </div>
          </CardBody>
        </Card>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 18, marginBottom: 22 }}>
          <StatCard icon="📊" value={avgGrade ? `${avgGrade}%` : "—"} label="Average Grade" accent={C.orange} />
          <StatCard icon="🏆" value={achievements.length} label="Achievements" accent={C.navyMid} />
          <StatCard icon="📅" value={sessions.length} label="Sessions" accent={C.sky} />
          <StatCard icon="⚡" value={`Lvl ${profile.current_level || 1}`} label="Current Level" accent="#6366f1" />
        </div>
        {grades.length > 0 && <Card>
          <CardHead title="Recent Grades" />
          <CardBody style={{ padding: "10px 14px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Assessment", "Subject", "Score", "Date"].map(h => <th key={h} style={{ textAlign: "left", fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1, textTransform: "uppercase", padding: "10px 12px", background: C.bgElevated }}>{h}</th>)}</tr></thead>
              <tbody>{grades.slice(0, 5).map(g => <tr key={g.id}><td style={{ padding: "12px", fontSize: 12, color: C.text, borderBottom: `1px solid ${C.border}` }}>{g.assessment_name}</td><td style={{ padding: "12px", fontSize: 12, color: C.textMid, borderBottom: `1px solid ${C.border}` }}>{g.subject}</td><td style={{ padding: "12px", fontSize: 14, fontWeight: 800, color: g.score >= 80 ? "#4ade80" : g.score >= 60 ? C.orangeLight : "#f87171", borderBottom: `1px solid ${C.border}` }}>{g.score}%</td><td style={{ padding: "12px", fontSize: 11, color: C.textMuted, borderBottom: `1px solid ${C.border}` }}>{new Date(g.graded_at).toLocaleDateString()}</td></tr>)}</tbody>
            </table>
          </CardBody>
        </Card>}
      </div>}

      {/* GRADES */}
      {page === "grades" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, color: C.text }}>My Grades</h1></div>
        {grades.length === 0 ? <div style={{ textAlign: "center", color: C.textMuted, fontSize: 14, padding: "60px 0" }}>No grades recorded yet.</div> :
          <Card><CardBody style={{ padding: "10px 14px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Assessment", "Subject", "Score", "Notes", "Date"].map(h => <th key={h} style={{ textAlign: "left", fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1, textTransform: "uppercase", padding: "10px 12px", background: C.bgElevated }}>{h}</th>)}</tr></thead>
              <tbody>{grades.map(g => <tr key={g.id}><td style={{ padding: "12px", fontSize: 12, color: C.text, borderBottom: `1px solid ${C.border}` }}>{g.assessment_name}</td><td style={{ padding: "12px", fontSize: 12, color: C.textMid, borderBottom: `1px solid ${C.border}` }}>{g.subject}</td><td style={{ padding: "12px", fontSize: 14, fontWeight: 800, color: g.score >= 80 ? "#4ade80" : g.score >= 60 ? C.orangeLight : "#f87171", borderBottom: `1px solid ${C.border}` }}>{g.score}%</td><td style={{ padding: "12px", fontSize: 11, color: C.textMuted, borderBottom: `1px solid ${C.border}`, maxWidth: 200 }}>{g.notes || "—"}</td><td style={{ padding: "12px", fontSize: 11, color: C.textMuted, borderBottom: `1px solid ${C.border}` }}>{new Date(g.graded_at).toLocaleDateString()}</td></tr>)}</tbody>
            </table>
          </CardBody></Card>}
      </div>}

      {/* SCHEDULE */}
      {page === "schedule" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, color: C.text }}>Schedule</h1></div>
        {sessions.length === 0 ? <div style={{ textAlign: "center", color: C.textMuted, fontSize: 14, padding: "60px 0" }}>No sessions scheduled yet.</div> :
          <Card><CardHead title="Upcoming Sessions" /><CardBody>
            {sessions.map(s => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: C.bgElevated, borderRadius: 9, borderLeft: `3px solid ${C.orange}`, marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.textMid, minWidth: 70 }}>{s.start_time}</div>
                <div><div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{s.subject} {s.level ? `· Level ${s.level}` : ""}</div><div style={{ fontSize: 10, color: C.textMuted }}>{s.session_date} {s.cohort ? `· ${s.cohort}` : ""} {s.room ? `· ${s.room}` : ""}</div></div>
              </div>
            ))}
          </CardBody></Card>}
      </div>}

      {/* LEADERBOARD */}
      {page === "leaderboard" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, color: C.text }}>Hall of Fame</h1><p style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>Top NEXA creators ranked by XP</p></div>
        <Card><CardBody>
          {leaderboard.map((s, i) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: i < leaderboard.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ width: 28, fontWeight: 800, fontSize: 14, color: i < 3 ? C.orange : C.textMuted, textAlign: "center" }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</div>
              <Avatar ini={initials(s.full_name || s.id).toUpperCase()} bg={s.id === profile.id ? C.orange : C.navyMid} size={38} src={s.avatar_url} radius={10} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{s.full_name || "Anonymous"} {s.id === profile.id ? <span style={{ color: C.orangeLight, fontSize: 10 }}>(you)</span> : ""}</div>
                <div style={{ fontSize: 10, color: C.textMuted }}>Level {s.current_level || 1}</div>
              </div>
              <div style={{ textAlign: "right" }}><div style={{ fontSize: 17, fontWeight: 800, color: C.orangeLight }}>{s.total_xp || 0}</div><div style={{ fontSize: 9, color: C.textMuted }}>XP</div></div>
            </div>
          ))}
          {leaderboard.length === 0 && <div style={{ textAlign: "center", color: C.textMuted, fontSize: 14, padding: "40px 0" }}>No students enrolled yet.</div>}
        </CardBody></Card>
      </div>}

      {/* MESSAGES */}
      {page === "messages" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, color: C.text }}>Messages</h1></div>
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 18 }}>
          <Card>
            <CardHead title="Contacts" />
            <CardBody style={{ padding: "10px 0" }}>
              {contactList.map(c => (
                <div key={c.id} onClick={() => setMsgTo(c.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: msgTo === c.id ? C.bgSurface : "transparent", transition: "all .15s" }}>
                  <Avatar ini={initials(c.full_name || "").toUpperCase()} bg={C.navyMid} size={34} src={c.avatar_url} />
                  <div><div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{c.full_name}</div><div style={{ fontSize: 10, color: C.textMuted }}>{c.subject || c.role}</div></div>
                </div>
              ))}
              {contactList.length === 0 && <div style={{ textAlign: "center", color: C.textMuted, fontSize: 12, padding: "20px 14px" }}>No instructors yet.</div>}
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              {msgTo ? <MsgThread fromId={profile.id} toId={msgTo} myProfile={profile} /> : <div style={{ textAlign: "center", color: C.textMuted, fontSize: 13, padding: "60px 0" }}>Select a contact to start messaging</div>}
            </CardBody>
          </Card>
        </div>
      </div>}

      {page === "notifications" && <NotificationsPanel profile={profile} />}
    </Shell>
  );
}

/* ══════════════════════════════════════════
   PARENT DASHBOARD
══════════════════════════════════════════ */
function ParentDash({ profile, onHome }) {
  const [page, setPage] = useState("overview");
  const [child, setChild] = useState(null);
  const [childGrades, setChildGrades] = useState([]);
  const [childAch, setChildAch] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [msgTo, setMsgTo] = useState(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    loadData();
  }, [profile]);

  async function loadData() {
    // Find linked child
    if (profile.student_email) {
      const { data: kids } = await supabase.from("profiles").select("*").eq("email", profile.student_email);
      if (kids?.length > 0) {
        const kid = kids[0];
        setChild(kid);
        supabase.from("grades").select("*").eq("student_id", kid.id).order("graded_at", { ascending: false }).then(({ data }) => setChildGrades(data || []));
        supabase.from("achievements").select("*").eq("student_id", kid.id).then(({ data }) => setChildAch(data || []));
      }
    }
    supabase.from("sessions").select("*").order("session_date").limit(8).then(({ data }) => setSessions(data || []));
    supabase.from("profiles").select("id,full_name,avatar_url,subject").eq("role", "instructor").then(({ data }) => setInstructors(data || []));
    supabase.from("messages").select("id").eq("to_id", profile.id).eq("read", false).then(({ data }) => setUnread(data?.length || 0));
  }

  const name = profile.full_name || profile.email?.split("@")[0];
  const childName = child?.full_name || child?.email?.split("@")[0] || "No child linked";
  const avgGrade = childGrades.length ? Math.round(childGrades.reduce((a, g) => a + (g.score || 0), 0) / childGrades.length) : 0;

  const navItems = [
    [{ section: "My Child" }],
    [{ icon: "🏠", label: "Overview", id: "overview" }],
    [{ icon: "👤", label: "Child Profile", id: "child" }],
    [{ icon: "📊", label: "Grades", id: "grades" }],
    [{ icon: "📅", label: "Schedule", id: "schedule" }],
    [{ icon: "🏆", label: "Achievements", id: "achievements" }],
    [{ section: "Communication" }],
    [{ icon: "💬", label: "Messages", id: "messages", badge: unread }],
    [{ icon: "🔔", label: "Notifications", id: "notifications" }],
  ];

  const titles = { overview: "Parent Overview", child: "Child Profile", grades: "Grades & Progress", schedule: "Schedule", achievements: "Achievements", messages: "Messages", notifications: "Notifications" };

  return (
    <Shell accent={C.navyMid} sidebarItems={
      navItems.map((n, i) => n[0]?.section
        ? <SectionLabel key={i}>{n[0].section}</SectionLabel>
        : <NavItem key={i} icon={n[0].icon} label={n[0].label} badge={n[0].badge} active={page === n[0].id} onClick={() => setPage(n[0].id)} accent={C.navyMid} />)
    } user={profile} onHome={onHome} pageTitle={titles[page] || "Dashboard"} topRight={<></>}>

      {page === "overview" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, color: C.text }}>Good day, {name.split(" ")[0]} 👋</h1><p style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>{child ? `Tracking ${childName}'s progress` : "No child linked yet"}</p></div>
        {!child && <div style={{ background: "rgba(242,147,43,.08)", border: "1px solid rgba(242,147,43,.2)", borderRadius: 12, padding: "20px 24px", marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.orangeLight, marginBottom: 6 }}>🔗 No child linked</div>
          <div style={{ fontSize: 13, color: C.textMuted }}>Your account isn't linked to a student yet. Make sure you used your child's registered email during signup, or update it in settings.</div>
        </div>}
        {child && <><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 18, marginBottom: 22 }}>
          <StatCard icon="📊" value={avgGrade ? `${avgGrade}%` : "—"} label="Avg Grade" accent={C.navyMid} />
          <StatCard icon="🏆" value={childAch.length} label="Achievements" accent={C.orange} />
          <StatCard icon="⚡" value={`Lvl ${child.current_level || 1}`} label="Current Level" accent={C.sky} />
          <StatCard icon="💰" value={child.total_xp || 0} label="Total XP" accent="#6366f1" />
        </div>
        {childGrades.length > 0 && <Card>
          <CardHead title={`${childName}'s Recent Grades`} />
          <CardBody style={{ padding: "10px 14px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Assessment", "Subject", "Score", "Date"].map(h => <th key={h} style={{ textAlign: "left", fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1, textTransform: "uppercase", padding: "10px 12px", background: C.bgElevated }}>{h}</th>)}</tr></thead>
              <tbody>{childGrades.slice(0, 5).map(g => <tr key={g.id}><td style={{ padding: "12px", fontSize: 12, color: C.text, borderBottom: `1px solid ${C.border}` }}>{g.assessment_name}</td><td style={{ padding: "12px", fontSize: 12, color: C.textMid, borderBottom: `1px solid ${C.border}` }}>{g.subject}</td><td style={{ padding: "12px", fontSize: 14, fontWeight: 800, color: g.score >= 80 ? "#4ade80" : g.score >= 60 ? C.orangeLight : "#f87171", borderBottom: `1px solid ${C.border}` }}>{g.score}%</td><td style={{ padding: "12px", fontSize: 11, color: C.textMuted, borderBottom: `1px solid ${C.border}` }}>{new Date(g.graded_at).toLocaleDateString()}</td></tr>)}</tbody>
            </table>
          </CardBody>
        </Card>}</>}
      </div>}

      {page === "child" && child && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, color: C.text }}>{childName}</h1></div>
        <div style={{ background: `linear-gradient(135deg,${C.navy},${C.navyMid})`, borderRadius: 14, padding: 28, display: "flex", alignItems: "center", gap: 22, marginBottom: 22 }}>
          <Avatar ini={initials(childName).toUpperCase()} bg="rgba(255,255,255,.15)" size={74} radius={18} src={child.avatar_url} style={{ border: "2.5px solid rgba(255,255,255,.18)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 3 }}>{childName}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", display: "flex", gap: 14 }}>
              {child.age && <span>🎂 Age {child.age}</span>}
              <span>📍 Year {child.year || 1} · Level {child.current_level || 1}</span>
              <span>✨ {child.total_xp || 0} XP</span>
            </div>
          </div>
        </div>
      </div>}

      {page === "grades" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, color: C.text }}>Grades & Progress</h1></div>
        {childGrades.length === 0 ? <div style={{ textAlign: "center", color: C.textMuted, fontSize: 14, padding: "60px 0" }}>No grades recorded yet.</div> :
          <Card><CardBody style={{ padding: "10px 14px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Assessment", "Subject", "Score", "Notes", "Date"].map(h => <th key={h} style={{ textAlign: "left", fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1, textTransform: "uppercase", padding: "10px 12px", background: C.bgElevated }}>{h}</th>)}</tr></thead>
              <tbody>{childGrades.map(g => <tr key={g.id}><td style={{ padding: "12px", fontSize: 12, color: C.text, borderBottom: `1px solid ${C.border}` }}>{g.assessment_name}</td><td style={{ padding: "12px", fontSize: 12, color: C.textMid, borderBottom: `1px solid ${C.border}` }}>{g.subject}</td><td style={{ padding: "12px", fontSize: 14, fontWeight: 800, color: g.score >= 80 ? "#4ade80" : g.score >= 60 ? C.orangeLight : "#f87171", borderBottom: `1px solid ${C.border}` }}>{g.score}%</td><td style={{ padding: "12px", fontSize: 11, color: C.textMuted, borderBottom: `1px solid ${C.border}` }}>{g.notes || "—"}</td><td style={{ padding: "12px", fontSize: 11, color: C.textMuted, borderBottom: `1px solid ${C.border}` }}>{new Date(g.graded_at).toLocaleDateString()}</td></tr>)}</tbody>
            </table>
          </CardBody></Card>}
      </div>}

      {page === "schedule" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, color: C.text }}>Schedule</h1></div>
        {sessions.length === 0 ? <div style={{ textAlign: "center", color: C.textMuted, fontSize: 14, padding: "60px 0" }}>No sessions yet.</div> :
          <Card><CardHead title="Upcoming Sessions" /><CardBody>
            {sessions.map(s => (<div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: C.bgElevated, borderRadius: 9, borderLeft: `3px solid ${C.navyMid}`, marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.textMid, minWidth: 70 }}>{s.start_time}</div>
              <div><div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{s.subject} {s.level ? `· Level ${s.level}` : ""}</div><div style={{ fontSize: 10, color: C.textMuted }}>{s.session_date}</div></div>
            </div>))}
          </CardBody></Card>}
      </div>}

      {page === "achievements" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, color: C.text }}>Achievements</h1></div>
        {childAch.length === 0 ? <div style={{ textAlign: "center", color: C.textMuted, fontSize: 14, padding: "60px 0" }}>No achievements yet.</div> :
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 14 }}>
            {childAch.map(a => (<div key={a.id} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{a.badge}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{a.label}</div>
              <div style={{ fontSize: 9, color: C.textMuted, marginTop: 4 }}>{new Date(a.earned_at).toLocaleDateString()}</div>
            </div>))}
          </div>}
      </div>}

      {page === "messages" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, color: C.text }}>Messages</h1></div>
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 18 }}>
          <Card>
            <CardHead title="Instructors" />
            <CardBody style={{ padding: "10px 0" }}>
              {instructors.map(c => (<div key={c.id} onClick={() => setMsgTo(c.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: msgTo === c.id ? C.bgSurface : "transparent" }}>
                <Avatar ini={initials(c.full_name || "").toUpperCase()} bg={C.navyMid} size={34} src={c.avatar_url} />
                <div><div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{c.full_name}</div><div style={{ fontSize: 10, color: C.textMuted }}>{c.subject}</div></div>
              </div>))}
              {instructors.length === 0 && <div style={{ textAlign: "center", color: C.textMuted, fontSize: 12, padding: "20px 14px" }}>No instructors yet.</div>}
            </CardBody>
          </Card>
          <Card><CardBody>{msgTo ? <MsgThread fromId={profile.id} toId={msgTo} myProfile={profile} /> : <div style={{ textAlign: "center", color: C.textMuted, fontSize: 13, padding: "60px 0" }}>Select an instructor to message</div>}</CardBody></Card>
        </div>
      </div>}

      {page === "notifications" && <NotificationsPanel profile={profile} />}
    </Shell>
  );
}

/* ══════════════════════════════════════════
   INSTRUCTOR DASHBOARD
══════════════════════════════════════════ */
function InstructorDash({ profile, onHome }) {
  const [page, setPage] = useState("overview");
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [grades, setGrades] = useState([]);
  const [msgTo, setMsgTo] = useState(null);
  const [contacts, setContacts] = useState([]);
  // Grade entry form
  const [gForm, setGForm] = useState({ studentId: "", subject: profile.subject || "Robotics", name: "", score: "", notes: "" });
  const [gSaved, setGSaved] = useState(false);
  const [gErr, setGErr] = useState("");
  // Session form
  const [sForm, setSForm] = useState({ subject: profile.subject || "Robotics", level: "5", cohort: "", room: "", date: "", time: "" });
  const [sSaved, setSSaved] = useState(false);

  useEffect(() => {
    supabase.from("profiles").select("*").eq("role", "student").order("full_name").then(({ data }) => setStudents(data || []));
    supabase.from("sessions").select("*").eq("instructor_id", profile.id).order("session_date").then(({ data }) => setSessions(data || []));
    supabase.from("grades").select("*,profiles!grades_student_id_fkey(full_name)").eq("instructor_id", profile.id).order("graded_at", { ascending: false }).limit(20).then(({ data }) => setGrades(data || []));
    // Contacts = parents + students
    supabase.from("profiles").select("id,full_name,avatar_url,role,subject").in("role", ["parent", "student"]).then(({ data }) => setContacts(data || []));
  }, [profile.id]);

  async function saveGrade() {
    setGErr("");
    if (!gForm.studentId || !gForm.subject || !gForm.name || !gForm.score) { setGErr("Please fill all required fields."); return; }
    const score = parseFloat(gForm.score);
    if (isNaN(score) || score < 0 || score > 100) { setGErr("Score must be 0–100."); return; }
    const { error } = await supabase.from("grades").insert({ student_id: gForm.studentId, instructor_id: profile.id, subject: gForm.subject, assessment_name: gForm.name, score, notes: gForm.notes || null });
    if (error) { setGErr(error.message); return; }
    // Notify student
    await supabase.from("notifications").insert({ user_id: gForm.studentId, title: `New grade: ${gForm.name}`, body: `You scored ${score}% in ${gForm.subject}`, type: "grade" });
    // Award XP
    const student = students.find(s => s.id === gForm.studentId);
    if (student) {
      const xpGain = Math.round(score / 10);
      await supabase.from("profiles").update({ total_xp: (student.total_xp || 0) + xpGain }).eq("id", gForm.studentId);
    }
    setGSaved(true); setGForm(f => ({ ...f, name: "", score: "", notes: "" }));
    supabase.from("grades").select("*,profiles!grades_student_id_fkey(full_name)").eq("instructor_id", profile.id).order("graded_at", { ascending: false }).limit(20).then(({ data }) => setGrades(data || []));
    setTimeout(() => setGSaved(false), 3000);
  }

  async function saveSession() {
    if (!sForm.subject || !sForm.date || !sForm.time) return;
    const { error } = await supabase.from("sessions").insert({ instructor_id: profile.id, subject: sForm.subject, level: parseInt(sForm.level) || null, cohort: sForm.cohort || null, room: sForm.room || null, session_date: sForm.date, start_time: sForm.time });
    if (!error) { setSSaved(true); setSForm(f => ({ ...f, date: "", time: "", cohort: "", room: "" })); supabase.from("sessions").select("*").eq("instructor_id", profile.id).order("session_date").then(({ data }) => setSessions(data || [])); setTimeout(() => setSSaved(false), 3000); }
  }

  const name = profile.full_name || profile.email?.split("@")[0];
  const todaySessions = sessions.filter(s => s.session_date === new Date().toISOString().split("T")[0]);

  const navItems = [
    [{ section: "Teaching" }],
    [{ icon: "🏠", label: "Overview", id: "overview" }],
    [{ icon: "👥", label: "My Students", id: "students" }],
    [{ icon: "📅", label: "Sessions", id: "sessions" }],
    [{ icon: "📊", label: "Grade Entry", id: "grades" }],
    [{ section: "Communication" }],
    [{ icon: "💬", label: "Messages", id: "messages" }],
    [{ icon: "🔔", label: "Notifications", id: "notifications" }],
  ];
  const titles = { overview: "Instructor Overview", students: "My Students", sessions: "Sessions", grades: "Grade Entry", messages: "Messages", notifications: "Notifications" };

  return (
    <Shell accent={C.sky} sidebarItems={
      navItems.map((n, i) => n[0]?.section
        ? <SectionLabel key={i}>{n[0].section}</SectionLabel>
        : <NavItem key={i} icon={n[0].icon} label={n[0].label} active={page === n[0].id} onClick={() => setPage(n[0].id)} accent={C.sky} />)
    } user={profile} onHome={onHome} pageTitle={titles[page] || "Dashboard"} topRight={<><span style={{ fontSize: 12, color: C.textMuted }}>{profile.subject}</span></>}>

      {page === "overview" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, color: C.text }}>Welcome, {name.split(" ")[0]} 👋</h1><p style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>{profile.subject} Instructor · {students.length} students</p></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 18, marginBottom: 22 }}>
          <StatCard icon="👥" value={students.length} label="Total Students" accent={C.navy} />
          <StatCard icon="📅" value={todaySessions.length} label="Sessions Today" accent={C.orange} />
          <StatCard icon="📊" value={grades.length} label="Grades Given" accent="#22c55e" />
          <StatCard icon="📋" value={sessions.length} label="Total Sessions" accent={C.sky} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <Card>
            <CardHead title="Today's Sessions" />
            <CardBody>
              {todaySessions.length === 0 ? <div style={{ textAlign: "center", color: C.textMuted, fontSize: 13, padding: "20px 0" }}>No sessions today.</div> :
                todaySessions.map(s => (<div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "rgba(242,147,43,.07)", borderRadius: 9, borderLeft: `3px solid ${C.orange}`, marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: C.textMid, minWidth: 65 }}>{s.start_time}</div>
                  <div><div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{s.subject} · Level {s.level}</div><div style={{ fontSize: 10, color: C.textMuted }}>{s.cohort} {s.room ? `· ${s.room}` : ""}</div></div>
                </div>))}
            </CardBody>
          </Card>
          <Card>
            <CardHead title="Recent Grades" />
            <CardBody style={{ padding: "10px 0" }}>
              {grades.slice(0, 5).map(g => (<div key={g.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 18px", borderBottom: `1px solid ${C.border}` }}>
                <div><div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{g.profiles?.full_name || "Student"}</div><div style={{ fontSize: 10, color: C.textMuted }}>{g.assessment_name} · {g.subject}</div></div>
                <div style={{ fontSize: 16, fontWeight: 800, color: g.score >= 80 ? "#4ade80" : g.score >= 60 ? C.orangeLight : "#f87171" }}>{g.score}%</div>
              </div>))}
              {grades.length === 0 && <div style={{ textAlign: "center", color: C.textMuted, fontSize: 13, padding: "20px 0" }}>No grades yet.</div>}
            </CardBody>
          </Card>
        </div>
      </div>}

      {page === "students" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, color: C.text }}>My Students</h1><p style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>{students.length} enrolled students</p></div>
        {students.length === 0 ? <div style={{ textAlign: "center", color: C.textMuted, fontSize: 14, padding: "60px 0" }}>No students enrolled yet.</div> :
          students.map(s => (<div key={s.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, background: C.bgCard, borderRadius: 11, border: `1px solid ${C.border}`, marginBottom: 10 }}>
            <Avatar ini={initials(s.full_name || s.email || "").toUpperCase()} bg={C.navyMid} size={44} radius={11} src={s.avatar_url} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{s.full_name || s.email?.split("@")[0]}</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>
                {s.age ? `Age ${s.age}` : ""} {s.age ? " · " : ""}Year {s.year || 1} · Level {s.current_level || 1} · {s.total_xp || 0} XP
              </div>
            </div>
            <div style={{ textAlign: "right" }}><div style={{ fontSize: 12, color: C.textMuted }}>{s.email}</div></div>
          </div>))}
      </div>}

      {page === "sessions" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, color: C.text }}>Sessions</h1></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 22 }}>
          <Card>
            <CardHead title="Add Session" />
            <CardBody>
              <FormRow>
                <FInput label="Subject" value={sForm.subject} onChange={e => setSForm(f => ({ ...f, subject: e.target.value }))} />
                <FInput label="Level" value={sForm.level} onChange={e => setSForm(f => ({ ...f, level: e.target.value }))} />
              </FormRow>
              <FormRow>
                <FInput label="Date" type="date" value={sForm.date} onChange={e => setSForm(f => ({ ...f, date: e.target.value }))} />
                <FInput label="Time" type="time" value={sForm.time} onChange={e => setSForm(f => ({ ...f, time: e.target.value }))} />
              </FormRow>
              <FormRow>
                <FInput label="Cohort" optional value={sForm.cohort} onChange={e => setSForm(f => ({ ...f, cohort: e.target.value }))} />
                <FInput label="Room" optional value={sForm.room} onChange={e => setSForm(f => ({ ...f, room: e.target.value }))} />
              </FormRow>
              <Btn variant="primary" onClick={saveSession} style={{ borderRadius: 9 }}>Add Session</Btn>
              {sSaved && <div style={{ marginTop: 10, background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.25)", borderRadius: 8, padding: "9px 14px", fontSize: 12, color: "#4ade80" }}>✓ Session added!</div>}
            </CardBody>
          </Card>
          <Card>
            <CardHead title="Upcoming Sessions" />
            <CardBody style={{ padding: "10px 14px", maxHeight: 340, overflowY: "auto" }}>
              {sessions.length === 0 ? <div style={{ textAlign: "center", color: C.textMuted, fontSize: 13, padding: "20px 0" }}>No sessions yet.</div> :
                sessions.map(s => (<div key={s.id} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: C.orange, minWidth: 70 }}>{s.session_date}</div>
                  <div><div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{s.subject} · Lvl {s.level}</div><div style={{ fontSize: 10, color: C.textMuted }}>{s.start_time} {s.cohort ? `· ${s.cohort}` : ""}</div></div>
                </div>))}
            </CardBody>
          </Card>
        </div>
      </div>}

      {page === "grades" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, color: C.text }}>Grade Entry</h1></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <Card>
            <CardHead title="Enter Grade" />
            <CardBody>
              <FSelect label="Student" value={gForm.studentId} onChange={e => setGForm(f => ({ ...f, studentId: e.target.value }))}
                options={[{ value: "", label: "Select student…" }, ...students.map(s => ({ value: s.id, label: s.full_name || s.email?.split("@")[0] }))]} />
              <FormRow>
                <FInput label="Subject" value={gForm.subject} onChange={e => setGForm(f => ({ ...f, subject: e.target.value }))} />
                <FInput label="Score (%)" type="number" placeholder="0–100" value={gForm.score} onChange={e => setGForm(f => ({ ...f, score: e.target.value }))} />
              </FormRow>
              <FInput label="Assessment Name" placeholder="e.g. Smart Car Final" value={gForm.name} onChange={e => setGForm(f => ({ ...f, name: e.target.value }))} />
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: C.textMid, marginBottom: 6, letterSpacing: 1.5, textTransform: "uppercase" }}>Notes <span style={{ fontWeight: 400, color: C.textMuted }}>(optional)</span></label>
                <textarea placeholder="Feedback for student & parent…" rows={3} value={gForm.notes} onChange={e => setGForm(f => ({ ...f, notes: e.target.value }))} style={{ width: "100%", padding: "12px 14px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontFamily: "'Montserrat',sans-serif", fontSize: 13, resize: "vertical", background: C.bgSurface, color: C.text }} />
              </div>
              {gErr && <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 8, padding: "9px 14px", fontSize: 12, color: "#f87171", marginBottom: 10 }}>{gErr}</div>}
              <Btn variant="primary" onClick={saveGrade} style={{ borderRadius: 9 }}>Save Grade</Btn>
              {gSaved && <div style={{ marginTop: 10, background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.25)", borderRadius: 8, padding: "9px 14px", fontSize: 12, color: "#4ade80" }}>✓ Grade saved! Student notified & XP awarded.</div>}
            </CardBody>
          </Card>
          <Card>
            <CardHead title="Recent Grades" />
            <CardBody style={{ padding: "10px 0", maxHeight: 420, overflowY: "auto" }}>
              {grades.map(g => (<div key={g.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px", borderBottom: `1px solid ${C.border}` }}>
                <div><div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{g.profiles?.full_name || "Student"}</div><div style={{ fontSize: 10, color: C.textMuted }}>{g.assessment_name} · {g.subject}</div></div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: g.score >= 80 ? "#4ade80" : g.score >= 60 ? C.orangeLight : "#f87171" }}>{g.score}%</div>
                  <div style={{ fontSize: 10, color: C.textMuted }}>{new Date(g.graded_at).toLocaleDateString()}</div>
                </div>
              </div>))}
              {grades.length === 0 && <div style={{ textAlign: "center", color: C.textMuted, fontSize: 13, padding: "20px 0" }}>No grades yet.</div>}
            </CardBody>
          </Card>
        </div>
      </div>}

      {page === "messages" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, color: C.text }}>Messages</h1></div>
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 18 }}>
          <Card>
            <CardHead title="Contacts" />
            <CardBody style={{ padding: "10px 0" }}>
              {contacts.map(c => (<div key={c.id} onClick={() => setMsgTo(c.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: msgTo === c.id ? C.bgSurface : "transparent" }}>
                <Avatar ini={initials(c.full_name || "").toUpperCase()} bg={c.role === "parent" ? C.navyMid : C.orange} size={34} src={c.avatar_url} />
                <div><div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{c.full_name}</div><div style={{ fontSize: 10, color: C.textMuted }}>{c.role}</div></div>
              </div>))}
              {contacts.length === 0 && <div style={{ textAlign: "center", color: C.textMuted, fontSize: 12, padding: "20px 14px" }}>No contacts yet.</div>}
            </CardBody>
          </Card>
          <Card><CardBody>{msgTo ? <MsgThread fromId={profile.id} toId={msgTo} myProfile={profile} /> : <div style={{ textAlign: "center", color: C.textMuted, fontSize: 13, padding: "60px 0" }}>Select a contact to start a conversation</div>}</CardBody></Card>
        </div>
      </div>}

      {page === "notifications" && <NotificationsPanel profile={profile} />}
    </Shell>
  );
}

/* ══════════════════════════════════════════
   ROOT APP
══════════════════════════════════════════ */
export default function App() {
  const { session, profile, loading } = useAuth();
  const [screen, setScreen] = useState("landing");
  const [rolePickMode, setRolePickMode] = useState("login");
  const [selectedRole, setSelectedRole] = useState(null);
  const [activeProfile, setActiveProfile] = useState(null);

  // On auth state change, route appropriately
  useEffect(() => {
    if (loading) return;
    if (session && profile?.role) {
      setActiveProfile(profile);
      // Only auto-route if we're on an auth screen
      if (["landing", "login", "signup", "role-pick"].includes(screen)) {
        setScreen(profile.role + "-home");
      }
    }
  }, [session, profile, loading]);

  function goTo(dest) {
    if (dest === "login") { setRolePickMode("login"); setScreen("role-pick"); }
    else if (dest === "signup") { setRolePickMode("signup"); setScreen("role-pick"); }
    else setScreen(dest);
  }

  function onRolePicked(role) {
    if (!role) { setScreen("landing"); return; }
    setSelectedRole(role);
    setScreen(rolePickMode === "login" ? "login" : "signup");
  }

  function onAuthSuccess(prof) {
    setActiveProfile(prof);
    setScreen((prof.role || selectedRole) + "-home");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setActiveProfile(null);
    setScreen("landing");
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div style={{ width: 40, height: 40, border: `3px solid rgba(242,147,43,.2)`, borderTopColor: C.orange, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <div style={{ fontSize: 12, color: C.textMuted, letterSpacing: 3, textTransform: "uppercase" }}>Loading NEXA…</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const currentProfile = activeProfile || profile;

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", background: C.bg, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap');
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 14px rgba(242,147,43,0.3)} 50%{box-shadow:0 0 28px rgba(242,147,43,0.6)} }
        @keyframes pulseGlow { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.4)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes floatX { 0%,100%{transform:translateX(0)} 50%{transform:translateX(-10px)} }
        @keyframes hexPulse { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.12)} }
        @keyframes circuitTrace { 0%{stroke-dashoffset:400} 100%{stroke-dashoffset:0} }
        @keyframes scanLine { 0%{top:-2px;opacity:0} 5%{opacity:1} 95%{opacity:.6} 100%{top:100%;opacity:0} }
        .nexa-logo-text { font-family: 'Conthrax','Montserrat',sans-serif !important; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(146,185,214,.15); border-radius: 10px; }
      `}</style>

      {screen === "landing" && <Landing goTo={goTo} />}
      {screen === "role-pick" && <RolePicker mode={rolePickMode} onSelect={onRolePicked} />}
      {screen === "login" && <LoginPage role={selectedRole || "parent"} goTo={goTo} onAuthSuccess={onAuthSuccess} />}
      {screen === "signup" && <SignupPage role={selectedRole || "parent"} goTo={goTo} onAuthSuccess={onAuthSuccess} />}

      {/* HOME PAGES */}
      {screen === "student-home" && currentProfile && <HomeCard profile={currentProfile} onGoToDash={() => setScreen("student-dash")} onLogout={handleLogout} />}
      {screen === "parent-home" && currentProfile && <HomeCard profile={currentProfile} onGoToDash={() => setScreen("parent-dash")} onLogout={handleLogout} />}
      {screen === "instructor-home" && currentProfile && <HomeCard profile={currentProfile} onGoToDash={() => setScreen("instructor-dash")} onLogout={handleLogout} />}

      {/* DASHBOARDS */}
      {screen === "student-dash" && currentProfile && <StudentDash profile={currentProfile} onHome={() => setScreen("student-home")} />}
      {screen === "parent-dash" && currentProfile && <ParentDash profile={currentProfile} onHome={() => setScreen("parent-home")} />}
      {screen === "instructor-dash" && currentProfile && <InstructorDash profile={currentProfile} onHome={() => setScreen("instructor-home")} />}
    </div>
  );
}
