import { useState, useRef, useEffect, useCallback, createContext, useContext } from "react";
import { animate, stagger } from "animejs";
import { createClient } from "@supabase/supabase-js";

/* ══════════════════════════════════════════
   SUPABASE CLIENT
══════════════════════════════════════════ */
const SUPA_URL = "https://niheflatontvfdmwcfis.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paGVmbGF0b250dmZkbXdjZmlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNzI4OTcsImV4cCI6MjA5MTk0ODg5N30.puXa4D7EuVqx1LPcnv9W3H9R4MDktWzQCE5sd2bz6K4";
const supabase = createClient(SUPA_URL, SUPA_KEY);

/* ══════════════════════════════════════════
   THEME CONTEXT
══════════════════════════════════════════ */
const ThemeContext = createContext({ isDark: true, toggle: () => {} });
function useTheme() { return useContext(ThemeContext); }

/* ══════════════════════════════════════════
   COLOR SYSTEM — dark & light
══════════════════════════════════════════ */
const DARK = {
  bg: "#020c18", bgCard: "#061524", bgElevated: "#091b2e", bgSurface: "#0d2540",
  navy: "#002b51", navyMid: "#23558a",
  orange: "#f2932b", orangeLight: "#fbb55a",
  sky: "#92b9d6", skyLight: "#b8d4e8",
  off: "#091b2e", border: "rgba(146,185,214,0.10)", borderMid: "rgba(146,185,214,0.20)",
  text: "#ddeaf4", textMid: "#7899aa", textMuted: "#3a5870",
};

const LIGHT = {
  bg: "#f0f4f8", bgCard: "#ffffff", bgElevated: "#e8eef5", bgSurface: "#dce6f0",
  navy: "#1a4a7a", navyMid: "#2563a8",
  orange: "#c96a0a", orangeLight: "#e07b1a",
  sky: "#1a4a7a", skyLight: "#0d3060",
  off: "#e8eef5", border: "rgba(26,74,138,0.18)", borderMid: "rgba(26,74,138,0.30)",
  text: "#071220", textMid: "#1e3a52", textMuted: "#3a5870",
};

/* We use a module-level mutable ref so all components can read C without prop drilling */
let C = { ...DARK };

/* ══════════════════════════════════════════
   THEME TOGGLE SWITCH COMPONENT
══════════════════════════════════════════ */
function ThemeSwitch() {
  const { isDark, toggle } = useTheme();
  return (
    /* Single track — no outer wrapper button */
    <div
      onClick={toggle}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      style={{
        width: 58, height: 30, borderRadius: 15, position: "relative",
        background: isDark
          ? "linear-gradient(135deg,#0d2540,#23558a)"
          : "linear-gradient(135deg,#87ceeb,#ffd700)",
        border: `2px solid ${isDark ? "rgba(146,185,214,0.35)" : "rgba(255,180,0,0.6)"}`,
        cursor: "pointer", flexShrink: 0,
        transition: "background .3s, border-color .3s",
        boxShadow: isDark ? "0 0 10px rgba(35,85,138,0.4)" : "0 0 10px rgba(255,200,0,0.35)",
      }}
    >
      {/* Knob */}
      <div style={{
        position: "absolute", top: 3,
        left: isDark ? 3 : 27,
        width: 20, height: 20, borderRadius: "50%",
        background: isDark ? "#b8d4e8" : "#fff",
        transition: "left .25s cubic-bezier(.4,0,.2,1), background .3s",
        boxShadow: isDark ? "0 0 8px rgba(146,185,214,0.7)" : "0 2px 8px rgba(0,0,0,0.18)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, lineHeight: 1,
        userSelect: "none",
      }}>
        {isDark ? "🌙" : "☀️"}
      </div>
    </div>
  );
}

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

function usePresence(userId) {
  useEffect(() => {
    if (!userId) return;
    async function heartbeat() {
      await supabase.from("presence").upsert({ user_id: userId, online: true, last_seen: new Date().toISOString() });
    }
    heartbeat();
    const interval = setInterval(heartbeat, 30000);
    async function goOffline() {
      await supabase.from("presence").upsert({ user_id: userId, online: false, last_seen: new Date().toISOString() });
    }
    window.addEventListener("beforeunload", goOffline);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") goOffline();
      else heartbeat();
    });
    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", goOffline);
      goOffline();
    };
  }, [userId]);
}

function formatLastSeen(ts) {
  if (!ts) return "Never";
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(ts).toLocaleDateString();
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
   VISUAL FX
══════════════════════════════════════════ */
function MatrixRain({ opacity = 0.18 }) {
  const { isDark } = useTheme();
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    const fontSize = 13; let drops = [];
    function resize() {
      canvas.width = window.innerWidth; canvas.height = window.innerHeight;
      const cols = Math.floor(canvas.width / fontSize);
      // skip every 5th column so ~20% fewer active streams in both modes
      drops = Array.from({ length: cols }, (_, i) =>
        i % 5 === 0 ? null : Math.random() * -50
      );
    }
    resize(); window.addEventListener("resize", resize);
    const chars = "アイウエカキクタナハマ01010011<>{}()=+-*/0x9FA3B2C1def function class import return yield async await AI ML NLP CNN RNN 0x1A 0xFF π∑∫∂∇Ω∈";

    function draw() {
      ctx.fillStyle = isDark ? "rgba(2,12,24,0.055)" : "rgba(240,244,248,0.10)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < drops.length; i++) {
        if (drops[i] === null) continue; // skipped column in light mode

        const idx = Math.floor(Math.random() * chars.length);
        const char = chars[idx];
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        const isLead    = Math.random() > 0.94;
        const isKeyword = idx > 40 && idx < 80;

        if (isDark) {
          if (isLead)         { ctx.fillStyle = "#ffffff"; ctx.shadowColor = "#92b9d6"; ctx.shadowBlur = 10; }
          else if (isKeyword) { ctx.fillStyle = "#f2932b"; ctx.shadowBlur = 0; }
          else                { ctx.fillStyle = "#2a6aaa"; ctx.shadowBlur = 0; }
        } else {
          if (isLead)         { ctx.fillStyle = "#002b51"; ctx.shadowColor = "#002b51"; ctx.shadowBlur = 8; }
          else if (isKeyword) { ctx.fillStyle = "#c96a0a"; ctx.shadowBlur = 0; }
          else                { ctx.fillStyle = "#1a4a7a"; ctx.shadowBlur = 0; }
        }

        ctx.font = `${fontSize}px 'Courier New', monospace`;
        ctx.fillText(char, x, y);
        ctx.shadowBlur = 0;
        if (y > canvas.height && Math.random() > 0.972) drops[i] = 0;
        drops[i] += 0.5;
      }
      animId = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed", top: 0, left: 0,
        width: "100%", height: "100%",
        opacity: isDark ? opacity * 0.8 : 0.44,
        pointerEvents: "none", zIndex: 0,
      }}
    />
  );
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
  const { isDark } = useTheme();
  const icons = [{ icon: "🤖", x: "8%", y: "18%", size: 32, anim: "floatY", dur: "5.2s", delay: "0s" }, { icon: "🧠", x: "88%", y: "22%", size: 28, anim: "floatX", dur: "6.1s", delay: "1s" }, { icon: "⚡", x: "5%", y: "68%", size: 22, anim: "floatY", dur: "4.8s", delay: "0.5s" }, { icon: "🔬", x: "91%", y: "60%", size: 26, anim: "floatX", dur: "5.5s", delay: "2s" }, { icon: "🛸", x: "50%", y: "8%", size: 24, anim: "floatY", dur: "7s", delay: "1.5s" }, { icon: "💡", x: "20%", y: "85%", size: 20, anim: "floatX", dur: "4.5s", delay: "0.3s" }, { icon: "🔧", x: "78%", y: "88%", size: 22, anim: "floatY", dur: "5.8s", delay: "2.5s" }];
  if (isMobile) return null;

  // Light mode circuit colors — navy & orange on light bg
  const circuitStroke1 = isDark ? "#92b9d6" : "#2563a8";
  const circuitStroke2 = isDark ? "#23558a" : "#1a4a7a";
  const circuitOrange  = isDark ? "#f2932b" : "#c96a0a";
  const svgOpacity     = isDark ? 0.08 : 0.18;
  const pulseOpacity1  = isDark ? "0.12" : "0.10";
  const pulseOpacity2  = isDark ? "0.08" : "0.07";

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}>
      {icons.map((it, i) => <div key={i} style={{ position: "absolute", left: it.x, top: it.y, fontSize: it.size, opacity: isDark ? 0.18 : 0.22, animation: `${it.anim} ${it.dur} ease-in-out ${it.delay} infinite`, filter: isDark ? "saturate(0) brightness(2)" : "saturate(0.7) brightness(0.85)" }}>{it.icon}</div>)}
      <svg style={{ position: "absolute", bottom: 0, left: 0, opacity: svgOpacity }} width="260" height="260" viewBox="0 0 260 260" fill="none">
        <path d="M10 250 L10 80 L80 10 L250 10" stroke={circuitStroke1} strokeWidth="1.5" fill="none" strokeDasharray="400" style={{ animation: "circuitTrace 4s ease-out 0.5s infinite" }} />
        <circle cx="10" cy="80" r="4" fill={circuitStroke1} opacity="0.7" />
        <circle cx="80" cy="10" r="4" fill={circuitOrange} opacity="0.8" />
        <path d="M40 250 L40 100 L100 40 L250 40" stroke={circuitStroke2} strokeWidth="1" fill="none" strokeDasharray="400" style={{ animation: "circuitTrace 4s ease-out 1.2s infinite" }} />
        <path d="M10 160 L60 160 L60 130 L120 130" stroke={circuitOrange} strokeWidth="1" fill="none" strokeDasharray="200" style={{ animation: "circuitTrace 3s ease-out 2s infinite" }} />
        <rect x="118" y="126" width="8" height="8" rx="2" fill={circuitOrange} opacity="0.6" />
        <rect x="6" y="76" width="8" height="8" rx="2" fill={circuitStroke1} opacity="0.6" />
      </svg>
      <svg style={{ position: "absolute", top: 0, right: 0, opacity: svgOpacity }} width="260" height="260" viewBox="0 0 260 260" fill="none">
        <path d="M250 10 L250 180 L180 250 L10 250" stroke={circuitStroke1} strokeWidth="1.5" fill="none" strokeDasharray="400" style={{ animation: "circuitTrace 4s ease-out 1s infinite" }} />
        <circle cx="250" cy="180" r="4" fill={circuitStroke1} opacity="0.7" />
        <circle cx="180" cy="250" r="4" fill={circuitOrange} opacity="0.8" />
      </svg>
      <div style={{ position: "absolute", top: 80, right: 60, width: 180, height: 180, background: `radial-gradient(circle, rgba(35,85,138,${pulseOpacity1}) 0%, transparent 70%)`, animation: "hexPulse 5s ease-in-out infinite", borderRadius: "50%" }} />
      <div style={{ position: "absolute", bottom: 100, left: 60, width: 140, height: 140, background: `radial-gradient(circle, rgba(242,147,43,${pulseOpacity2}) 0%, transparent 70%)`, animation: "hexPulse 6s ease-in-out 2s infinite", borderRadius: "50%" }} />
    </div>
  );
}

function ScanLine() {
  const { isDark } = useTheme();
  const gradient = isDark
    ? "linear-gradient(90deg, transparent 0%, rgba(146,185,214,0.5) 30%, rgba(242,147,43,0.7) 50%, rgba(146,185,214,0.5) 70%, transparent 100%)"
    : "linear-gradient(90deg, transparent 0%, rgba(37,99,168,0.35) 30%, rgba(201,106,10,0.55) 50%, rgba(37,99,168,0.35) 70%, transparent 100%)";
  const shadow = isDark
    ? "0 0 20px rgba(242,147,43,0.4)"
    : "0 0 14px rgba(201,106,10,0.3)";
  return <div style={{ position: "absolute", left: 0, right: 0, height: 2, zIndex: 1, pointerEvents: "none", background: gradient, animation: "scanLine 8s ease-in-out 2s infinite", top: 0, boxShadow: shadow }} />;
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
  const variants = { primary: { background: C.orange, color: "#fff" }, navy: { background: C.navyMid, color: "#fff" }, outline: { background: "transparent", border: "1.5px solid rgba(255,255,255,.25)", color: C.text }, ghost: { background: "transparent", border: `1.5px solid ${C.border}`, color: C.text }, danger: { background: "#ef4444", color: "#fff" }, light: { background: "rgba(255,255,255,.08)", border: "1.5px solid rgba(255,255,255,.12)", color: C.text } };
  return <button style={{ ...base, ...variants[variant] }} onClick={disabled || ld ? undefined : onClick} disabled={disabled || ld}>{ld ? "Loading…" : children}</button>;
};

const Tag = ({ children, color = "navy" }) => {
  const { isDark } = useTheme();
  const map = {
    navy:  { bg: isDark ? "rgba(26,84,144,.3)"   : "rgba(26,84,144,.15)",   color: isDark ? "#6ab0e0" : "#0d3a6e" },
    orange:{ bg: isDark ? "rgba(242,147,43,.18)"  : "rgba(201,106,10,.15)",  color: isDark ? "#fbb55a" : "#8b4200" },
    sky:   { bg: isDark ? "rgba(58,127,168,.22)"  : "rgba(26,74,138,.15)",   color: isDark ? "#7ec8e3" : "#0d3a6e" },
    green: { bg: isDark ? "rgba(34,197,94,.14)"   : "rgba(21,128,61,.12)",   color: isDark ? "#4ade80" : "#14532d" },
  };
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

const FormRow = ({ children }) => { const isMobile = useIsMobile(600); return <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>{children}</div>; };
const Divider = ({ label }) => (<div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0", fontSize: 11, color: C.textMid, fontWeight: 600 }}><div style={{ flex: 1, height: 1, background: C.border }} />{label}<div style={{ flex: 1, height: 1, background: C.border }} /></div>);
const Card = ({ children, style = {} }) => <div style={{ background: C.bgCard, borderRadius: 14, boxShadow: "0 4px 32px rgba(0,0,0,.12)", border: `1px solid ${C.border}`, overflow: "hidden", ...style }}>{children}</div>;
const CardHead = ({ title, right }) => (<div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}><div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 800, color: C.text }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: C.orange, flexShrink: 0, display: "inline-block" }} />{title}</div>{right}</div>);
const CardBody = ({ children, style = {} }) => <div style={{ padding: "18px 20px", ...style }}>{children}</div>;

const StatCard = ({ icon, value, label, trend, accent }) => (
  <div style={{ background: C.bgCard, borderRadius: 14, padding: 22, boxShadow: "0 4px 32px rgba(0,0,0,.1)", border: `1px solid ${C.border}`, position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent, borderRadius: "14px 14px 0 0" }} />
    <div style={{ width: 42, height: 42, borderRadius: 11, background: accent + "28", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, marginBottom: 14 }}>{icon}</div>
    <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, marginBottom: 3, color: C.text }}>{value}</div>
    <div style={{ fontSize: 11, color: C.textMid, fontWeight: 700 }}>{label}</div>
    {trend && <span style={{ position: "absolute", top: 18, right: 18, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: "rgba(34,197,94,.12)", color: "#4ade80" }}>{trend}</span>}
  </div>
);

/* ══════════════════════════════════════════
   NEXA LOGO COMPONENT
══════════════════════════════════════════ */
function NexaLogo({ size = 48, showText = true, isMobile = false }) {
  const { isDark } = useTheme();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <img
        src="/NEXA_LOGO.png"
        alt="NEXA Logo"
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          display: "block",
          flexShrink: 0,
          filter: isDark
            ? "drop-shadow(0 0 8px rgba(242,147,43,0.30))"
            : "drop-shadow(0 1px 4px rgba(0,0,0,0.15))",
        }}
        onError={(e) => {
          e.target.style.display = "none";
          const fb = document.createElement("div");
          fb.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;background:linear-gradient(135deg,#f2932b,#e07b1a);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:${Math.round(size*0.32)}px;font-family:'Montserrat',sans-serif`;
          fb.textContent = "NX";
          e.target.parentNode.insertBefore(fb, e.target);
        }}
      />
      {showText && (
        <div>
          <div className="nexa-logo-text" style={{
            fontSize: isMobile ? 19 : 22,
            fontWeight: 700,
            color: isDark ? "#ffffff" : C.text,
            letterSpacing: 5,
            lineHeight: 1.1,
          }}>NEXA</div>
          <div style={{
            fontSize: 8, color: C.orange, letterSpacing: 3,
            textTransform: "uppercase", fontFamily: "'Montserrat',sans-serif",
            fontWeight: 600, marginTop: 2,
          }}>AI · Robotics · Coding</div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   LANDING PAGE
══════════════════════════════════════════ */
function Landing({ goTo }) {
  const isMobile = useIsMobile();
  const { isDark } = useTheme();
  const heroRef = useRef(null);
  const taglineRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    if (taglineRef.current) animate(taglineRef.current, { opacity: [0, 1], translateY: [20, 0], duration: 900, delay: 900, ease: "outExpo" });
    if (ctaRef.current) animate(ctaRef.current.querySelectorAll("button"), { opacity: [0, 1], translateY: [20, 0], duration: 700, delay: stagger(120, { start: 1300 }), ease: "outExpo" });
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", transition: "background .3s" }}>
      <MatrixRain opacity={0.22} />
      {isDark && <>
        <div style={{ position: "absolute", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(242,147,43,.09) 0%, transparent 65%)", top: -350, right: -250, pointerEvents: "none", zIndex: 1 }} />
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(35,85,138,.14) 0%, transparent 65%)", bottom: -250, left: -150, pointerEvents: "none", zIndex: 1 }} />
      </>}
      {!isDark && <>
        <div style={{ position: "absolute", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(242,147,43,.07) 0%, transparent 65%)", top: -350, right: -250, pointerEvents: "none", zIndex: 1 }} />
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(26,74,138,.08) 0%, transparent 65%)", bottom: -250, left: -150, pointerEvents: "none", zIndex: 1 }} />
      </>}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(146,185,214,${isDark ? ".022" : ".04"}) 1px, transparent 1px), linear-gradient(90deg, rgba(146,185,214,${isDark ? ".022" : ".04"}) 1px, transparent 1px)`, backgroundSize: "80px 80px", pointerEvents: "none", zIndex: 1 }} />
      <FloatingTechBg />
      <ScanLine />

      {/* ── NAV ── */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "16px 20px" : "20px 60px", position: "relative", zIndex: 10, borderBottom: `1px solid ${C.border}`, backdropFilter: "blur(8px)", background: isDark ? "rgba(2,12,24,0.6)" : "rgba(240,244,248,0.85)", transition: "background .3s" }}>
        <NexaLogo size={isMobile ? 40 : 48} isMobile={isMobile} />
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 7 : 10 }}>
          <ThemeSwitch />
          {!isMobile && <Btn variant="ghost" style={{ border: `1.5px solid ${C.border}`, color: C.textMid, fontSize: 12, padding: "9px 16px" }} onClick={() => goTo("subscribe")}>Pricing</Btn>}
          <Btn variant="outline" style={{ ...(isMobile ? { padding: "9px 12px", fontSize: 11 } : {}), border: `1.5px solid ${isDark ? "rgba(255,255,255,.25)" : "rgba(26,74,138,.5)"}`, color: isDark ? C.text : "#0d3060", fontWeight: 700 }} onClick={() => goTo("login")}>Log In</Btn>
          <Btn variant="primary" style={{ ...(isMobile ? { padding: "9px 12px", fontSize: 11 } : {}), animation: "glowPulse 2.5s ease-in-out infinite" }} onClick={() => goTo("signup")}>Join NEXA</Btn>
        </div>
      </nav>

      <div ref={heroRef} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: isMobile ? "40px 20px 60px" : "60px 40px 80px", position: "relative", zIndex: 5 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 36, animation: "fadeInUp 0.7s ease 0.2s both" }}>
          <div style={{ height: 1, width: 44, background: `linear-gradient(90deg, transparent, ${C.orange})`, opacity: 0.8 }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: C.orange, letterSpacing: 4, textTransform: "uppercase", fontFamily: "'Montserrat',sans-serif" }}>Cairo, Egypt · Est. 2025 · Vol. I</span>
          <div style={{ height: 1, width: 44, background: `linear-gradient(90deg, ${C.orange}, transparent)`, opacity: 0.8 }} />
        </div>
        <h1 style={{ margin: 0, lineHeight: 0.92 }}>
          <AnimatedLetters text="NEXA" style={{ fontSize: "clamp(54px,9vw,104px)", fontFamily: "'Conthrax','Montserrat',sans-serif", fontWeight: 700, color: C.text, letterSpacing: isMobile ? 6 : 10, display: "block" }} animDelay={200} animFrom="bottom" />
        </h1>
        <h1 style={{ margin: "0 0 10px" }}>
          <AnimatedLetters text="TECH" style={{ fontSize: "clamp(54px,9vw,104px)", fontFamily: "'Conthrax','Montserrat',sans-serif", fontWeight: 700, letterSpacing: isMobile ? 6 : 10, display: "block" }} letterStyle={{ color: C.orange }} animDelay={450} animFrom="bottom" />
        </h1>
        <div style={{ fontSize: "clamp(10px,1.2vw,13px)", color: isDark ? "rgba(255,255,255,.22)" : "#5a7a95", letterSpacing: 10, textTransform: "uppercase", marginBottom: 28, fontWeight: 600, fontFamily: "'Montserrat',sans-serif", animation: "fadeInUp 0.8s ease 0.8s both" }}>— School —</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, width: "100%", maxWidth: 520, marginBottom: 28, animation: "fadeInUp 0.7s ease 0.85s both" }}>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${C.sky})`, opacity: 0.4 }} />
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.orange, display: "inline-block", flexShrink: 0, animation: "pulseGlow 2s ease-in-out infinite" }} />
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${C.sky}, transparent)`, opacity: 0.4 }} />
        </div>
        <div ref={taglineRef} style={{ opacity: 0, marginBottom: 36, maxWidth: 480 }}>
          <p style={{ fontSize: isMobile ? 15 : 17, color: isDark ? "rgba(255,255,255,.50)" : "#2a4a62", fontWeight: 400, fontStyle: "italic", lineHeight: 1.8, margin: 0, fontFamily: "'Montserrat',sans-serif" }}>
            We don't teach technology…<br />
            <span style={{ fontFamily: "'Riffic Free','Montserrat',sans-serif", color: isDark ? C.sky : "#1a4a7a", fontStyle: "normal", fontSize: isMobile ? 13 : 15, fontWeight: 700 }}>We build creators.</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginBottom: 36, animation: "fadeInUp 0.7s ease 1.1s both" }}>
          {[["🤖", "Robotics"], ["🧠", "AI & ML"], ["💻", "Coding"], ["⚡", "Electronics"]].map(([ic, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 16px", borderRadius: 50, border: `1.5px solid ${isDark ? C.border : "rgba(26,74,138,0.35)"}`, background: isDark ? "rgba(35,85,138,0.15)" : "rgba(26,74,138,0.08)", backdropFilter: "blur(4px)", fontSize: 12, fontWeight: 700, color: isDark ? C.sky : "#0d3060", fontFamily: "'Montserrat',sans-serif" }}>
              <span>{ic}</span><span>{label}</span>
            </div>
          ))}
        </div>
        <div ref={ctaRef} style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 14, width: isMobile ? "100%" : "auto", maxWidth: isMobile ? 320 : "none" }}>
          <Btn variant="primary" style={{ opacity: 0, padding: "15px 40px", fontSize: 14, borderRadius: 50, background: `linear-gradient(135deg, ${C.orange}, #e07b1a)`, boxShadow: `0 4px 24px rgba(242,147,43,0.4)`, ...(isMobile ? { width: "100%" } : {}) }} onClick={() => goTo("signup")}>Create Account</Btn>
          <Btn variant="outline" style={{ opacity: 0, padding: "15px 40px", fontSize: 14, borderRadius: 50, border: `2px solid ${isDark ? "rgba(146,185,214,0.3)" : "rgba(26,74,138,0.5)"}`, backdropFilter: "blur(4px)", color: isDark ? C.text : "#0d3060", fontWeight: 700, ...(isMobile ? { width: "100%" } : {}) }} onClick={() => goTo("login")}>Sign In</Btn>
        </div>
        {/* What is NEXA big button */}
        <div style={{ marginTop: 22, width: isMobile ? "100%" : "auto", maxWidth: isMobile ? 320 : "none" }}>
          <button onClick={() => goTo("about")} className="neon-btn" style={{ animation: "fadeInUp 0.7s ease 1.7s both", width: isMobile ? "100%" : "auto", padding: "16px 52px", fontSize: 15, fontWeight: 800, fontFamily: "'Montserrat',sans-serif", borderRadius: 50, border: `2px solid ${isDark ? "rgba(146,185,214,0.5)" : "rgba(26,74,138,0.6)"}`, background: isDark ? "rgba(35,85,138,0.18)" : "rgba(26,74,138,0.09)", color: isDark ? C.sky : "#0d3060", backdropFilter: "blur(6px)", cursor: "pointer", position: "relative", overflow: "hidden", letterSpacing: 1, transition: "all .25s", boxShadow: isDark ? "0 0 20px rgba(35,85,138,0.25), inset 0 0 20px rgba(35,85,138,0.05)" : "0 0 20px rgba(26,74,138,0.15)" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.orange; e.currentTarget.style.color = C.orange; e.currentTarget.style.boxShadow = "0 0 28px rgba(242,147,43,0.35)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? "rgba(146,185,214,0.5)" : "rgba(26,74,138,0.6)"; e.currentTarget.style.color = isDark ? C.sky : "#0d3060"; e.currentTarget.style.boxShadow = isDark ? "0 0 20px rgba(35,85,138,0.25)" : "0 0 20px rgba(26,74,138,0.15)"; }}>
            <span style={{ position: "relative", zIndex: 1 }}>✦ What is NEXA? ✦</span>
          </button>
        </div>
        <div style={{ display: "flex", gap: 0, marginTop: 64, flexWrap: "wrap", justifyContent: "center", borderTop: `1px solid ${C.border}`, paddingTop: 40, width: "100%", maxWidth: 600 }}>
          {[["3", "Year Program"], ["432", "Total Hours"], ["4", "Systems"], ["6–17", "Age Range"]].map(([n, l], i) => (
            <AnimatedStat key={i} index={i}
              style={{ padding: isMobile ? "0 14px" : "0 34px", borderRight: i < 3 ? `1px solid ${C.border}` : "none" }}
              value={<div style={{ fontSize: isMobile ? 28 : 36, fontWeight: 900, color: C.orange, letterSpacing: 2, fontFamily: "'Conthrax','Montserrat',sans-serif" }}>{n}</div>}
              label={<div style={{ fontSize: 9, color: isDark ? "rgba(255,255,255,.28)" : "#3a5870", letterSpacing: 3, textTransform: "uppercase", marginTop: 5, fontFamily: "'Montserrat',sans-serif", fontWeight: 700 }}>{l}</div>}
            />
          ))}
        </div>
      </div>
      <div style={{ position: "relative", zIndex: 5, padding: isMobile ? "42px 20px" : "60px 40px", borderTop: `1px solid ${C.border}`, background: isDark ? "rgba(35,85,138,.05)" : "rgba(26,74,138,.04)", textAlign: "center", backdropFilter: "blur(4px)" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.orange, letterSpacing: 3, textTransform: "uppercase", marginBottom: 14 }}>Annual Pricing</div>
          <h2 style={{ fontSize: isMobile ? "clamp(22px,6vw,32px)" : "clamp(28px,3vw,42px)", fontWeight: 900, color: C.text, marginBottom: 14, fontFamily: "'Conthrax','Montserrat',sans-serif" }}>Invest in <span style={{ color: C.orange }}>Your Child's Future</span></h2>
          <p style={{ fontSize: isMobile ? 13 : 15, color: C.textMid, marginBottom: 28, lineHeight: 1.8 }}>Flexible plans for all age groups · 3 Levels · All Subjects · Full Experience</p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3,1fr)" : "repeat(3,1fr)", gap: 12, maxWidth: 580, margin: "0 auto 30px" }}>
            {[{age:"Ages 6–9",from:"from 4,200 EGP/mo"},{age:"Ages 10–13",from:"from 5,000 EGP/mo"},{age:"Ages 14–17",from:"from 5,600 EGP/mo"}].map((p,i) => (
              <div key={i} style={{ background: isDark ? "rgba(35,85,138,.15)" : "rgba(26,74,138,.07)", borderRadius: 14, border: `1px solid ${C.border}`, padding: isMobile ? "14px 10px" : "18px 16px", textAlign: "center" }}>
                <div style={{ fontSize: isMobile ? 11 : 13, fontWeight: 800, color: C.orange, marginBottom: 5 }}>{p.age}</div>
                <div style={{ fontSize: isMobile ? 9 : 11, color: C.textMuted }}>{p.from}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Btn variant="primary" style={{ padding: "14px 40px", fontSize: 13, borderRadius: 50, animation: "glowPulse 2.5s ease-in-out infinite" }} onClick={() => goTo("subscribe")}>View Pricing & Enroll →</Btn>
            <Btn variant="outline" style={{ padding: "14px 28px", fontSize: 13, borderRadius: 50, border: `2px solid ${isDark ? "rgba(146,185,214,0.3)" : "rgba(26,74,138,0.5)"}`, color: isDark ? C.text : "#0d3060" }} onClick={() => goTo("about")}>What is NEXA?</Btn>
          </div>
        </div>
      </div>
      <div style={{ position: "relative", zIndex: 5, textAlign: "center", padding: "12px 20px", borderTop: `1px solid ${C.border}`, background: isDark ? "rgba(2,12,24,0.7)" : "rgba(240,244,248,0.85)", backdropFilter: "blur(8px)", transition: "background .3s" }}>
        <span style={{ fontSize: 10, color: isDark ? C.textMuted : "#3a5870", letterSpacing: 2, textTransform: "uppercase", fontFamily: "'Montserrat',sans-serif", fontWeight: 600 }}>NEXA Tech School · Cairo, Egypt · AI · Robotics · Coding · Est. 2025</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   WHAT IS NEXA PAGE
══════════════════════════════════════════ */
const NEXA_SECTIONS = [
  { num:"01", icon:"💡", title:"The Big Idea", type:"quote", content:"The future will not belong to those who use technology…", highlight:"but to those who build it." },
  { num:"02", icon:"📈", title:"The Opportunity", type:"bullets", bullets:["85% of future jobs will require tech skills","Kids today are consumers, not creators","Parents are actively searching for future-proof education","Massive gap in structured tech education in MENA"] },
  { num:"03", icon:"🔍", title:"The Problem (Deep Level)", type:"split", label:"Current Reality:", bullets:["Fragmented courses","No long-term roadmap","No real outcomes","No integration between skills"], footer:"Kids learn tools… not thinking" },
  { num:"04", icon:"🔄", title:"The Shift", type:"compare", left:{ label:"Old Model", items:["Courses → Information → Forget"] }, right:{ label:"NEXA Model", items:["System → Practice → Creation → Mastery"] } },
  { num:"05", icon:"🏫", title:"The Solution", type:"highlight", content:"A 3-Year Structured Technology School", bullets:["Built like an international school","Designed for real-world skills","Focused on creation, not consumption"] },
  { num:"06", icon:"🏗️", title:"Product Architecture", type:"systems", intro:"NEXA = 4 Systems in 1 — All connected through projects", systems:[{icon:"💻",name:"Programming System"},{icon:"🤖",name:"AI System"},{icon:"⚙️",name:"Robotics System"},{icon:"📱",name:"Marketing System"}] },
  { num:"07", icon:"⚡", title:"The Learning Engine", type:"flow", intro:"Project-Based Integrated Learning", flow:["Learn","Apply","Integrate","Present"] },
  { num:"08", icon:"📐", title:"Program Structure", type:"stats", stats:[{value:"3 Years",label:"Duration"},{value:"9 Levels",label:"Total Levels"},{value:"2 Months",label:"Per Level"},{value:"16 Hours",label:"Per Subject / Level"}] },
  { num:"09", icon:"🎯", title:"Age Strategy", type:"ages", ages:[{range:"6–9",desc:"Exploration & Thinking",color:"#f2932b"},{range:"10–13",desc:"Building & Logic",color:"#23558a"},{range:"14–17",desc:"Creation & Real Skills",color:"#92b9d6"}] },
  { num:"10", icon:"⏱️", title:"Hours & Commitment", type:"hours", perLevel:"16 hours per subject · 3 subjects = 48 hours / level", perYear:"48 × 3 Levels = 144 hours / year", total:"144 × 3 Years = 432 hours total" },
  { num:"11", icon:"🚀", title:"Student Journey", type:"journey", years:[{year:"Year 1",theme:"Exploration"},{year:"Year 2",theme:"Building"},{year:"Year 3",theme:"Creation"}] },
  { num:"12", icon:"🏆", title:"Outcomes", type:"outcomes", intro:"Students will:", outcomes:[{num:"01",text:"Think logically"},{num:"02",text:"Build real projects"},{num:"03",text:"Understand AI"},{num:"04",text:"Be ready for work"}] },
];

function NexaSectionCard({ sec, isMobile, isDark, idx }) {
  const accentColor = idx % 3 === 0 ? C.orange : idx % 3 === 1 ? C.navyMid : C.sky;
  return (
    <div className="nexa-section-card" data-idx={idx} style={{ background: C.bgCard, borderRadius: 18, border: `1px solid ${C.border}`, padding: isMobile ? "22px 18px" : "32px 36px", marginBottom: 22, opacity: 0, transform: "translateY(30px)", transition: "opacity 0.6s ease, transform 0.6s ease", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${accentColor},transparent)`, borderRadius: "18px 18px 0 0" }} />
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: `${accentColor}1a`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{sec.icon}</div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: accentColor, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>Section {sec.num}</div>
          <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: C.text }}>{sec.title}</div>
        </div>
      </div>
      {sec.type === "quote" && <div style={{ padding: "16px 20px", borderLeft: `3px solid ${C.orange}`, background: isDark ? "rgba(242,147,43,.06)" : "rgba(242,147,43,.08)", borderRadius: "0 12px 12px 0" }}><p style={{ fontSize: isMobile ? 15 : 18, color: C.textMid, fontStyle: "italic", margin: "0 0 8px", lineHeight: 1.7 }}>{sec.content}</p><p style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, color: C.text, margin: 0 }}>{sec.highlight}</p></div>}
      {sec.type === "bullets" && <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>{sec.bullets.map((b, i) => (<li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 0", borderBottom: i < sec.bullets.length - 1 ? `1px solid ${C.border}` : "none" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: accentColor, flexShrink: 0, marginTop: 5 }} /><span style={{ fontSize: isMobile ? 13 : 14, color: C.text, lineHeight: 1.6 }}>{b}</span></li>))}</ul>}
      {sec.type === "split" && <div>{sec.label && <div style={{ fontSize: 11, fontWeight: 700, color: accentColor, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>{sec.label}</div>}<ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px" }}>{sec.bullets.map((b, i) => (<li key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: i < sec.bullets.length - 1 ? `1px solid ${C.border}` : "none" }}><span style={{ color: "#ef4444", fontSize: 14, fontWeight: 700 }}>✕</span><span style={{ fontSize: isMobile ? 13 : 14, color: C.text }}>{b}</span></li>))}</ul>{sec.footer && <div style={{ padding: "12px 16px", background: isDark ? "rgba(239,68,68,.08)" : "rgba(239,68,68,.06)", borderRadius: 10, border: "1px solid rgba(239,68,68,.2)", fontSize: 13, fontWeight: 700, color: isDark ? "#f87171" : "#dc2626", fontStyle: "italic" }}>{sec.footer}</div>}</div>}
      {sec.type === "compare" && <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}><div style={{ padding: "16px 18px", borderRadius: 12, background: isDark ? "rgba(239,68,68,.06)" : "rgba(239,68,68,.05)", border: "1px solid rgba(239,68,68,.2)" }}><div style={{ fontSize: 11, fontWeight: 700, color: "#f87171", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>{sec.left.label}</div>{sec.left.items.map((item, i) => <div key={i} style={{ fontSize: isMobile ? 12 : 13, color: C.text, lineHeight: 1.7, fontStyle: "italic" }}>{item}</div>)}</div><div style={{ padding: "16px 18px", borderRadius: 12, background: `${C.orange}0d`, border: `1px solid ${C.orange}33` }}><div style={{ fontSize: 11, fontWeight: 700, color: C.orange, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>{sec.right.label}</div>{sec.right.items.map((item, i) => <div key={i} style={{ fontSize: isMobile ? 12 : 13, color: C.text, lineHeight: 1.7, fontWeight: 700 }}>{item}</div>)}</div></div>}
      {sec.type === "highlight" && <div><div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: C.orange, marginBottom: 18, padding: "14px 20px", background: `${C.orange}10`, borderRadius: 10, textAlign: "center" }}>{sec.content}</div><ul style={{ listStyle: "none", padding: 0, margin: 0 }}>{sec.bullets.map((b, i) => (<li key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: i < sec.bullets.length - 1 ? `1px solid ${C.border}` : "none" }}><span style={{ color: "#4ade80", fontSize: 14 }}>✓</span><span style={{ fontSize: isMobile ? 13 : 14, color: C.text }}>{b}</span></li>))}</ul></div>}
      {sec.type === "systems" && <div><p style={{ fontSize: isMobile ? 13 : 14, color: C.textMid, marginBottom: 20, fontWeight: 600 }}>{sec.intro}</p><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12 }}>{sec.systems.map((sys, i) => (<div key={i} style={{ padding: "18px 14px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.bgElevated, textAlign: "center" }}><div style={{ fontSize: 28, marginBottom: 8 }}>{sys.icon}</div><div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{sys.name}</div></div>))}</div></div>}
      {sec.type === "flow" && <div><p style={{ fontSize: isMobile ? 13 : 14, color: C.textMid, marginBottom: 20, fontWeight: 600 }}>{sec.intro}</p><div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>{sec.flow.map((step, i) => (<div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ padding: "10px 18px", borderRadius: 50, background: [C.orange, C.navyMid, C.sky, "#6366f1"][i], color: "#fff", fontSize: 12, fontWeight: 700, boxShadow: `0 2px 12px rgba(0,0,0,.2)` }}>{step}</div>{i < sec.flow.length - 1 && <span style={{ color: C.textMuted, fontSize: 16, fontWeight: 700 }}>→</span>}</div>))}</div></div>}
      {sec.type === "stats" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 14 }}>{sec.stats.map((stat, i) => (<div key={i} style={{ padding: "18px 14px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.bgElevated, textAlign: "center" }}><div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: accentColor, marginBottom: 4 }}>{stat.value}</div><div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{stat.label}</div></div>))}</div>}
      {sec.type === "ages" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14 }}>{sec.ages.map((age, i) => (<div key={i} style={{ padding: "20px 16px", borderRadius: 14, border: `2px solid ${age.color}40`, background: `${age.color}0d`, textAlign: "center" }}><div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, color: age.color, marginBottom: 6 }}>{age.range}</div><div style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{age.desc}</div></div>))}</div>}
      {sec.type === "hours" && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{[{text:sec.perLevel,c:C.orange},{text:sec.perYear,c:C.navyMid},{text:sec.total,c:C.sky}].map((item, i) => (<div key={i} style={{ padding: "12px 16px", borderRadius: 10, background: C.bgElevated, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: item.c, flexShrink: 0 }} /><span style={{ fontSize: isMobile ? 12 : 14, color: C.text, fontWeight: i === 2 ? 700 : 400 }}>{item.text}</span></div>))}</div>}
      {sec.type === "journey" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14 }}>{sec.years.map((y, i) => (<div key={i} style={{ padding: "20px 16px", borderRadius: 14, background: `linear-gradient(135deg,${[C.navy,C.navyMid,C.orange][i]}22,${[C.navyMid,C.navy,C.orangeLight][i]}11)`, border: `1px solid ${[C.navy,C.navyMid,C.orange][i]}33`, textAlign: "center" }}><div style={{ fontSize: 11, fontWeight: 700, color: [C.sky,C.orangeLight,C.orange][i], textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>{y.year}</div><div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: C.text }}>{y.theme}</div></div>))}</div>}
      {sec.type === "outcomes" && <div><p style={{ fontSize: isMobile ? 13 : 14, color: C.textMid, marginBottom: 18, fontWeight: 600 }}>{sec.intro}</p><div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 12 }}>{sec.outcomes.map((o, i) => (<div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 12, background: C.bgElevated, border: `1px solid ${C.border}` }}><div style={{ width: 36, height: 36, borderRadius: 10, background: accentColor + "1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: accentColor, flexShrink: 0 }}>{o.num}</div><div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 600, color: C.text }}>{o.text}</div></div>))}</div></div>}
    </div>
  );
}

function WhatIsNexaPage({ goTo }) {
  const isMobile = useIsMobile();
  const { isDark } = useTheme();
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll(".nexa-section-card");
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.style.opacity = "1"; e.target.style.transform = "translateY(0)"; obs.unobserve(e.target); }
      });
    }, { threshold: 0.08 });
    cards.forEach(c => obs.observe(c));
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Montserrat',sans-serif", transition: "background .3s" }}>
      <MatrixRain opacity={0.10} />
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "14px 18px" : "18px 60px", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(12px)", background: isDark ? "rgba(2,12,24,0.88)" : "rgba(240,244,248,0.93)", borderBottom: `1px solid ${C.border}`, transition: "background .3s" }}>
        <NexaLogo size={isMobile ? 36 : 42} isMobile={isMobile} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ThemeSwitch />
          <Btn variant="outline" style={{ padding: isMobile ? "8px 12px" : "10px 20px", fontSize: isMobile ? 11 : 12, border: `1.5px solid ${isDark ? "rgba(255,255,255,.25)" : "rgba(26,74,138,.5)"}`, color: isDark ? C.text : "#0d3060" }} onClick={() => goTo("landing")}>← Back</Btn>
          <Btn variant="primary" style={{ padding: isMobile ? "8px 12px" : "10px 20px", fontSize: isMobile ? 11 : 12, animation: "glowPulse 2.5s ease-in-out infinite" }} onClick={() => goTo("subscribe")}>Enroll Now →</Btn>
        </div>
      </nav>

      <div style={{ textAlign: "center", padding: isMobile ? "50px 20px 30px" : "80px 40px 50px", position: "relative", zIndex: 2 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 20, padding: "6px 20px", borderRadius: 50, border: `1px solid ${C.border}`, background: isDark ? "rgba(35,85,138,.18)" : "rgba(26,74,138,.08)" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.orange, letterSpacing: 3, textTransform: "uppercase" }}>NEXA Tech School · Cairo, Egypt</span>
        </div>
        <h1 style={{ fontSize: isMobile ? "clamp(32px,8vw,50px)" : "clamp(44px,5vw,72px)", fontWeight: 900, color: C.text, lineHeight: 1.1, margin: "0 0 20px", fontFamily: "'Conthrax','Montserrat',sans-serif" }}>
          What is <span style={{ color: C.orange }}>NEXA</span>?
        </h1>
        <p style={{ fontSize: isMobile ? 14 : 17, color: C.textMid, maxWidth: 580, margin: "0 auto 28px", lineHeight: 1.9 }}>
          The future will not belong to those who use technology…<br />
          <strong style={{ color: isDark ? C.sky : "#1a4a7a" }}>but to those who build it.</strong>
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {["3-Year Program","432 Total Hours","4 Systems","Ages 6–17","Cairo, Egypt"].map(t => (
            <span key={t} style={{ padding: "6px 16px", borderRadius: 50, border: `1px solid ${C.border}`, fontSize: 11, fontWeight: 700, color: C.textMid, background: isDark ? "rgba(35,85,138,.1)" : "rgba(26,74,138,.06)" }}>{t}</span>
          ))}
        </div>
      </div>

      <div ref={containerRef} style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? "0 14px 80px" : "0 40px 100px", position: "relative", zIndex: 2 }}>
        {NEXA_SECTIONS.map((sec, idx) => <NexaSectionCard key={sec.num} sec={sec} isMobile={isMobile} isDark={isDark} idx={idx} />)}
      </div>

      <div style={{ textAlign: "center", padding: isMobile ? "50px 20px 70px" : "70px 40px 90px", background: isDark ? "rgba(242,147,43,.04)" : "rgba(242,147,43,.05)", borderTop: `1px solid ${C.border}`, position: "relative", zIndex: 2 }}>
        <div style={{ fontSize: isMobile ? 24 : 36, fontWeight: 900, color: C.text, marginBottom: 16 }}>Ready to <span style={{ color: C.orange }}>Build</span>?</div>
        <p style={{ color: C.textMid, fontSize: isMobile ? 13 : 15, maxWidth: 440, margin: "0 auto 30px", lineHeight: 1.8 }}>Join NEXA Tech School and start your child's journey from consumer to creator.</p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <Btn variant="primary" style={{ padding: "15px 44px", fontSize: 14, borderRadius: 50, boxShadow: "0 4px 24px rgba(242,147,43,0.35)", animation: "glowPulse 2.5s ease-in-out infinite" }} onClick={() => goTo("subscribe")}>Enroll Now →</Btn>
          <Btn variant="outline" style={{ padding: "15px 32px", fontSize: 14, borderRadius: 50, border: `2px solid ${isDark ? "rgba(146,185,214,0.35)" : "rgba(26,74,138,0.4)"}`, color: isDark ? C.text : "#0d3060" }} onClick={() => goTo("landing")}>Back to Home</Btn>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   SUBSCRIPTION / PRICING PAGE
══════════════════════════════════════════ */
const PRICING_PLANS = {
  "6-9":  { ageRange: "Ages 6 – 9",   tiers: [{ name:"3-Year Full Program", price:"75,000 EGP", period:"3 Years",   tag:"Best Value" },{ name:"1-Year Program", price:"25,000 EGP", period:"1 Year",    tag:"Popular" },{ name:"Monthly Plan", price:"4,200 EGP/mo", period:"Over 6 months", tag:"" }] },
  "10-13":{ ageRange: "Ages 10 – 13", tiers: [{ name:"3-Year Full Program", price:"90,000 EGP", period:"3 Years",   tag:"Best Value" },{ name:"1-Year Program", price:"30,000 EGP", period:"1 Year",    tag:"Popular" },{ name:"Monthly Plan", price:"5,000 EGP/mo", period:"Over 6 months", tag:"" }] },
  "14-17":{ ageRange: "Ages 14 – 17", tiers: [{ name:"3-Year Full Program", price:"105,000 EGP",period:"3 Years",   tag:"Best Value" },{ name:"1-Year Program", price:"35,000 EGP", period:"1 Year",    tag:"Popular" },{ name:"Monthly Plan", price:"5,600 EGP/mo", period:"Over 6 months", tag:"" }] },
};

function SubscriptionPage({ goTo }) {
  const isMobile = useIsMobile();
  const { isDark } = useTheme();
  const [selectedAge, setSelectedAge] = useState("6-9");
  const [form, setForm] = useState({ studentName:"", parentName:"", studentPhone:"", parentPhone:"", school:"", age:"", plan:"" });
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: typeof e === "string" ? e : e.target.value }));

  function selectPlan(ageKey, tierIdx) {
    const plan = PRICING_PLANS[ageKey];
    const tier = plan.tiers[tierIdx];
    setSelectedAge(ageKey);
    setForm(p => ({ ...p, plan: `${plan.ageRange} — ${tier.name} (${tier.price})` }));
    setShowForm(true);
    setTimeout(() => document.getElementById("enrollment-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  async function handleSubmit() {
    setErr("");
    if (!form.studentName || !form.parentName || !form.parentPhone || !form.school || !form.age || !form.plan) { setErr("Please fill all required fields."); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("subscription_requests").insert({ student_name: form.studentName, parent_name: form.parentName, student_phone: form.studentPhone || null, parent_phone: form.parentPhone, school: form.school, age: parseInt(form.age) || null, plan: form.plan, status: "pending", created_at: new Date().toISOString() });
      if (error && !error.message?.includes("does not exist")) {
        console.error("Enrollment insert error:", error);
      }
    } catch (e) { console.error("Enrollment submit error:", e); }
    setSubmitted(true);
    setSubmitting(false);
    toast("Enrollment request submitted! We'll contact you soon 🚀");
  }

  const includes = ["3 Levels included","All 3 subjects","Projects + full experience","Flexible payment plans available"];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Montserrat',sans-serif", transition: "background .3s" }}>
      <MatrixRain opacity={0.07} />
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "14px 18px" : "18px 60px", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(12px)", background: isDark ? "rgba(2,12,24,0.88)" : "rgba(240,244,248,0.93)", borderBottom: `1px solid ${C.border}`, transition: "background .3s" }}>
        <NexaLogo size={isMobile ? 36 : 42} isMobile={isMobile} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ThemeSwitch />
          <Btn variant="outline" style={{ padding: isMobile ? "8px 12px" : "10px 20px", fontSize: isMobile ? 11 : 12, border: `1.5px solid ${isDark ? "rgba(255,255,255,.25)" : "rgba(26,74,138,.5)"}`, color: isDark ? C.text : "#0d3060" }} onClick={() => goTo("landing")}>← Home</Btn>
          <Btn variant="ghost" style={{ padding: isMobile ? "8px 12px" : "10px 20px", fontSize: isMobile ? 11 : 12, border: `1.5px solid ${C.border}`, color: C.textMid }} onClick={() => goTo("about")}>What is NEXA?</Btn>
        </div>
      </nav>

      <div style={{ textAlign: "center", padding: isMobile ? "50px 20px 30px" : "70px 40px 40px", position: "relative", zIndex: 2 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 18, padding: "6px 20px", borderRadius: 50, border: `1px solid ${C.border}`, background: isDark ? "rgba(35,85,138,.18)" : "rgba(26,74,138,.08)" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.orange, letterSpacing: 3, textTransform: "uppercase" }}>Annual Pricing</span>
        </div>
        <h1 style={{ fontSize: isMobile ? "clamp(26px,7vw,42px)" : "clamp(36px,4vw,56px)", fontWeight: 900, color: C.text, margin: "0 0 14px", fontFamily: "'Conthrax','Montserrat',sans-serif" }}>
          Pricing & <span style={{ color: C.orange }}>Enrollment</span>
        </h1>
        <p style={{ fontSize: isMobile ? 13 : 15, color: C.textMid, maxWidth: 520, margin: "0 auto 16px", lineHeight: 1.9 }}>
          Includes: 3 Levels · All 3 Subjects · Projects + Full Experience
          <br /><span style={{ color: C.orange, fontWeight: 700 }}>Flexible payment plans available</span>
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 10 }}>
          {includes.map(t => <span key={t} style={{ padding: "5px 14px", borderRadius: 50, border: `1px solid ${C.border}`, fontSize: 11, fontWeight: 600, color: C.textMid, background: isDark ? "rgba(35,85,138,.1)" : "rgba(26,74,138,.06)" }}>✓ {t}</span>)}
        </div>
      </div>

      <div style={{ maxWidth: 1060, margin: "0 auto", padding: isMobile ? "0 14px 60px" : "0 40px 80px", position: "relative", zIndex: 2 }}>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 32, flexWrap: "wrap" }}>
          {Object.entries(PRICING_PLANS).map(([key, plan]) => (
            <button key={key} onClick={() => setSelectedAge(key)} className="neon-btn" style={{ padding: "10px 26px", borderRadius: 50, border: `2px solid ${selectedAge === key ? C.orange : C.border}`, background: selectedAge === key ? C.orange : "transparent", color: selectedAge === key ? "#fff" : C.textMid, fontFamily: "'Montserrat',sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all .2s" }}>{plan.ageRange}</button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 18, marginBottom: 32 }}>
          {PRICING_PLANS[selectedAge].tiers.map((tier, i) => (
            <div key={i} onClick={() => selectPlan(selectedAge, i)} style={{ background: i === 0 ? `linear-gradient(135deg,${C.navyMid},${C.navy})` : C.bgCard, borderRadius: 20, border: `2px solid ${i === 0 ? C.orange : C.border}`, padding: isMobile ? "26px 20px" : "32px 26px", position: "relative", overflow: "hidden", cursor: "pointer", transition: "transform .25s, box-shadow .25s", boxShadow: i === 0 ? `0 8px 32px rgba(242,147,43,.18)` : "0 2px 14px rgba(0,0,0,.08)" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.boxShadow = i === 0 ? "0 16px 44px rgba(242,147,43,.3)" : "0 8px 28px rgba(0,0,0,.15)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = i === 0 ? "0 8px 32px rgba(242,147,43,.18)" : "0 2px 14px rgba(0,0,0,.08)"; }}>
              {i === 0 && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${C.orange},${C.orangeLight})` }} />}
              {tier.tag && <div style={{ position: "absolute", top: 16, right: 16, padding: "3px 10px", borderRadius: 20, background: "rgba(242,147,43,.22)", fontSize: 9, fontWeight: 700, color: C.orange, textTransform: "uppercase", letterSpacing: 1 }}>{tier.tag}</div>}
              <div style={{ fontSize: isMobile ? 28 : 36, fontWeight: 900, color: i === 0 ? "#fff" : C.text, marginBottom: 4, fontFamily: "'Conthrax','Montserrat',sans-serif", lineHeight: 1 }}>{tier.price}</div>
              <div style={{ fontSize: 12, color: i === 0 ? "rgba(255,255,255,.6)" : C.textMuted, marginBottom: 18, fontWeight: 600 }}>{tier.period}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: i === 0 ? "#fff" : C.text, marginBottom: 14 }}>{tier.name}</div>
              <div style={{ fontSize: 11, color: i === 0 ? "rgba(255,255,255,.5)" : C.textMuted, marginBottom: 22, lineHeight: 1.7 }}>• 3 Levels included<br />• All 3 subjects<br />• Project-based learning</div>
              <div style={{ padding: "11px 0", borderRadius: 10, background: i === 0 ? "rgba(255,255,255,.12)" : `${C.orange}14`, border: `1.5px solid ${i === 0 ? "rgba(255,255,255,.2)" : C.border}`, textAlign: "center", fontSize: 12, fontWeight: 700, color: i === 0 ? "#fff" : C.orange }}>Select Plan →</div>
            </div>
          ))}
        </div>

        {showForm && !submitted && (
          <div id="enrollment-form" style={{ background: C.bgCard, borderRadius: 20, border: `1px solid ${C.border}`, padding: isMobile ? "24px 18px" : "40px 40px", boxShadow: "0 4px 32px rgba(0,0,0,.1)", animation: "fadeInUp .4s ease" }}>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 6 }}>📋 Enrollment Form</div>
              <div style={{ fontSize: 12, color: C.textMuted }}>Selected plan: <span style={{ color: C.orange, fontWeight: 700 }}>{form.plan}</span></div>
            </div>
            {err && <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#f87171", marginBottom: 14 }}>{err}</div>}
            <FormRow><FInput label="Student Name *" placeholder="Full name of the student" value={form.studentName} onChange={set("studentName")} /><FInput label="Parent / Guardian Name *" placeholder="Full name" value={form.parentName} onChange={set("parentName")} /></FormRow>
            <FormRow><FInput label="Parent Phone *" placeholder="01XXXXXXXXX" value={form.parentPhone} onChange={set("parentPhone")} /><FInput label="Student Phone" optional placeholder="01XXXXXXXXX" value={form.studentPhone} onChange={set("studentPhone")} /></FormRow>
            <FormRow><FInput label="School Name *" placeholder="Current school" value={form.school} onChange={set("school")} /><FInput label="Student Age *" type="number" placeholder="6–17" value={form.age} onChange={set("age")} /></FormRow>
            <FInput label="Selected Plan" value={form.plan} onChange={() => {}} />
            <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
              <Btn variant="primary" block style={{ borderRadius: 10, animation: "glowPulse 2.5s ease-in-out infinite" }} onClick={handleSubmit} loading={submitting}>Submit Enrollment Request 🚀</Btn>
              <Btn variant="navy" style={{ borderRadius: 10, padding: "14px 22px", flexShrink: 0 }} onClick={() => goTo("pay")}>Pay with Card 💳</Btn>
            </div>
            <div style={{ fontSize: 10, color: C.textMuted, marginTop: 12, textAlign: "center" }}>🔒 Your information is kept private and secure</div>
          </div>
        )}

        {submitted && (
          <div style={{ background: isDark ? "rgba(34,197,94,.07)" : "rgba(34,197,94,.06)", border: "1px solid rgba(34,197,94,.25)", borderRadius: 20, padding: isMobile ? "30px 20px" : "50px 40px", textAlign: "center", animation: "fadeInUp .4s ease" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, color: C.text, marginBottom: 10 }}>Enrollment Request Submitted!</div>
            <div style={{ fontSize: isMobile ? 13 : 14, color: C.textMuted, maxWidth: 420, margin: "0 auto 28px", lineHeight: 1.8 }}>Our team will reach out within 24 hours to confirm your enrollment and discuss payment options.</div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Btn variant="primary" style={{ padding: "13px 32px" }} onClick={() => goTo("landing")}>Back to Home</Btn>
              <Btn variant="outline" style={{ padding: "13px 24px", border: `1.5px solid ${C.border}`, color: C.textMid }} onClick={() => { setSubmitted(false); setShowForm(false); }}>Make Another Request</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   PAY WITH CARD PAGE
══════════════════════════════════════════ */
function PayWithCardPage({ goTo }) {
  const isMobile = useIsMobile();
  const { isDark } = useTheme();
  const [form, setForm] = useState({ name:"", card:"", expiry:"", cvv:"", email:"" });
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: typeof e === "string" ? e : e.target.value }));
  const formatCard = (v) => v.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19);
  const formatExpiry = (v) => { const d = v.replace(/\D/g, ""); return d.length >= 2 ? d.slice(0, 2) + "/" + d.slice(2, 4) : d; };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Montserrat',sans-serif", display: "flex", flexDirection: "column", transition: "background .3s" }}>
      <MatrixRain opacity={0.07} />
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "14px 18px" : "18px 60px", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(12px)", background: isDark ? "rgba(2,12,24,0.88)" : "rgba(240,244,248,0.93)", borderBottom: `1px solid ${C.border}`, transition: "background .3s" }}>
        <NexaLogo size={isMobile ? 36 : 42} isMobile={isMobile} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ThemeSwitch />
          <Btn variant="outline" style={{ padding: isMobile ? "8px 12px" : "10px 20px", fontSize: isMobile ? 11 : 12, border: `1.5px solid ${isDark ? "rgba(255,255,255,.25)" : "rgba(26,74,138,.5)"}`, color: isDark ? C.text : "#0d3060" }} onClick={() => goTo("subscribe")}>← Back</Btn>
        </div>
      </nav>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? "28px 16px 60px" : "50px 40px", position: "relative", zIndex: 2 }}>
        <div style={{ width: "100%", maxWidth: 500 }}>
          <div style={{ width: "100%", maxWidth: 400, height: isMobile ? 180 : 210, background: `linear-gradient(135deg,${C.navy},${C.navyMid})`, borderRadius: 20, padding: isMobile ? "22px 22px" : "28px 32px", margin: "0 auto 28px", position: "relative", overflow: "hidden", boxShadow: "0 10px 40px rgba(0,43,81,.35)" }}>
            <div style={{ position: "absolute", right: -30, top: -30, width: 160, height: 160, borderRadius: "50%", background: "rgba(242,147,43,.12)" }} />
            <div style={{ position: "absolute", right: 20, bottom: -50, width: 120, height: 120, borderRadius: "50%", background: "rgba(146,185,214,.07)" }} />
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.45)", letterSpacing: 2, textTransform: "uppercase", marginBottom: isMobile ? 18 : 26 }}>NEXA Payment</div>
            <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, color: "#fff", letterSpacing: 4, marginBottom: isMobile ? 20 : 30, fontFamily: "monospace" }}>{form.card || "•••• •••• •••• ••••"}</div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div><div style={{ fontSize: 9, color: "rgba(255,255,255,.4)", letterSpacing: 2, marginBottom: 3 }}>CARD HOLDER</div><div style={{ fontSize: 12, color: "#fff", fontWeight: 700 }}>{form.name || "YOUR NAME"}</div></div>
              <div><div style={{ fontSize: 9, color: "rgba(255,255,255,.4)", letterSpacing: 2, marginBottom: 3 }}>EXPIRES</div><div style={{ fontSize: 12, color: "#fff", fontWeight: 700 }}>{form.expiry || "MM/YY"}</div></div>
            </div>
          </div>
          <div style={{ background: "rgba(242,147,43,.08)", border: "1px solid rgba(242,147,43,.22)", borderRadius: 14, padding: "14px 18px", marginBottom: 24, display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>💳</span>
            <div><div style={{ fontSize: 13, fontWeight: 700, color: C.orangeLight, marginBottom: 4 }}>Paymob Integration Coming Soon</div><div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.7 }}>Secure card payment is being set up via Paymob. Submit your enrollment request and our team will contact you with payment options.</div></div>
          </div>
          <div style={{ background: C.bgCard, borderRadius: 20, border: `1px solid ${C.border}`, padding: isMobile ? "22px 18px" : "32px 30px", boxShadow: "0 4px 32px rgba(0,0,0,.1)" }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 22 }}>Card Details</div>
            <FInput label="Cardholder Name" placeholder="As printed on card" value={form.name} onChange={set("name")} />
            <FInput label="Email Address" type="email" placeholder="your@email.com" value={form.email} onChange={set("email")} />
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: C.textMid, marginBottom: 6, letterSpacing: 1.5, textTransform: "uppercase" }}>Card Number</label>
              <input value={form.card} onChange={e => setForm(p => ({ ...p, card: formatCard(e.target.value) }))} placeholder="0000 0000 0000 0000" maxLength={19} style={{ width: "100%", padding: "12px 14px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontFamily: "monospace", fontSize: 15, color: C.text, background: C.bgSurface, outline: "none", boxSizing: "border-box", letterSpacing: 2 }} />
            </div>
            <FormRow>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: C.textMid, marginBottom: 6, letterSpacing: 1.5, textTransform: "uppercase" }}>Expiry Date</label>
                <input value={form.expiry} onChange={e => setForm(p => ({ ...p, expiry: formatExpiry(e.target.value) }))} placeholder="MM/YY" maxLength={5} style={{ width: "100%", padding: "12px 14px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontFamily: "'Montserrat',sans-serif", fontSize: 14, color: C.text, background: C.bgSurface, outline: "none", boxSizing: "border-box" }} />
              </div>
              <FInput label="CVV" type="password" placeholder="•••" value={form.cvv} onChange={set("cvv")} />
            </FormRow>
            <Btn variant="primary" block style={{ marginTop: 6, borderRadius: 10, opacity: 0.75 }} onClick={() => toast("Payment gateway coming soon! We'll contact you via your enrollment request 📞")}>
              💳 Pay Now (Coming Soon)
            </Btn>
            <div style={{ textAlign: "center", marginTop: 14, fontSize: 10, color: C.textMuted, letterSpacing: 0.5 }}>🔒 Secure payment powered by Paymob · SSL Encrypted</div>
          </div>
          <div style={{ textAlign: "center", marginTop: 18 }}>
            <span style={{ fontSize: 11, color: C.textMuted, cursor: "pointer" }} onClick={() => goTo("subscribe")}>← Go back to enrollment form</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   ROLE PICKER
══════════════════════════════════════════ */
function RolePicker({ mode, onSelect }) {
  const [role, setRole] = useState("parent");
  const { isDark } = useTheme();
  const roles = [{ id: "parent", icon: "👨‍👩‍👧", title: "Parent", desc: "Manage & track your children" }, { id: "student", icon: "🎓", title: "Student", desc: "Access your learning portal" }, { id: "instructor", icon: "👨‍🏫", title: "Instructor", desc: "Manage your classes" }];
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", transition: "background .3s" }}>
      <MatrixRain opacity={0.10} />
      <div style={{ background: C.bgCard, borderRadius: 20, padding: "clamp(22px,5vw,40px) clamp(16px,5vw,36px)", maxWidth: 460, width: "94%", position: "relative", zIndex: 2, border: `1px solid ${C.border}`, boxShadow: isDark ? "0 20px 60px rgba(0,0,0,.6)" : "0 20px 60px rgba(0,0,0,.15)" }}>
        <div style={{ textAlign: "center", marginBottom: 4 }}><NexaLogo size={44} showText={false} /></div>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 6, textAlign: "center" }}>{mode === "login" ? "How are you signing in?" : "Who are you?"}</div>
        <div style={{ fontSize: 13, color: C.textMuted, textAlign: "center", marginBottom: 28 }}>{mode === "login" ? "Select your account type to continue" : "Choose your role to create an account"}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(80px,1fr))", gap: 10, marginBottom: 20 }}>
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
   LOGIN
══════════════════════════════════════════ */
function LoginPage({ role, goTo, onAuthSuccess }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [ld, setLd] = useState(false);
  const { isDark } = useTheme();
  const icons = { parent: "👨‍👩‍👧 Parent", student: "🎓 Student", instructor: "👨‍🏫 Instructor" };

  async function doLogin() {
    if (!email || !pass) { setErr("Please enter your email and password."); return; }
    setLd(true); setErr("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) { setErr(error.message); setLd(false); return; }
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
    if (!profile?.role) { goTo("complete-profile"); }
    else { onAuthSuccess(profile); }
    setLd(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", transition: "background .3s" }}>
      <MatrixRain opacity={0.10} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "45%", background: isDark ? "linear-gradient(180deg, rgba(0,43,81,.35) 0%, transparent 100%)" : "linear-gradient(180deg, rgba(240,244,248,.9) 0%, transparent 100%)", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ background: C.bgCard, borderRadius: 22, padding: "clamp(20px,5vw,40px) clamp(18px,6vw,44px)", width: "100%", maxWidth: 420, boxShadow: isDark ? "0 20px 60px rgba(0,0,0,.7)" : "0 20px 60px rgba(0,0,0,.15)", border: `1px solid ${C.border}`, position: "relative", zIndex: 2, transition: "background .3s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, justifyContent: "center", marginBottom: 10 }}>
          <NexaLogo size={44} />
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
   SIGNUP
══════════════════════════════════════════ */
function SignupPage({ role, goTo, onAuthSuccess }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", full_name: "", phone: "", age: "", student_email: "", subject: "" });
  const [avatarUrl, setAvatarUrl] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [ld, setLd] = useState(false);
  const fileRef = useRef(null);
  const { isDark } = useTheme();

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
    const { error: signUpErr } = await supabase.auth.signUp({ email: f("email"), password: f("password"), options: { data: { full_name: f("full_name") } } });
    if (signUpErr && !signUpErr.message.includes("already registered")) { setErr(signUpErr.message); setLd(false); return; }
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email: f("email"), password: f("password") });
    if (signInErr) { setErr(signInErr.message); setLd(false); return; }
    const uid = signInData.user.id;
    const payload = { id: uid, email: f("email"), full_name: f("full_name"), role, phone: f("phone") || null, avatar_url: avatarUrl || null, enrollment_date: new Date().toISOString().split("T")[0] };
    if (role === "student") { payload.age = f("age") ? parseInt(f("age")) : null; payload.current_level = 1; payload.total_xp = 0; payload.skills = { logic: 0, coding: 0, hardware: 0, ai: 0 }; }
    if (role === "parent") { payload.student_email = f("student_email")?.toLowerCase().trim() || null; }
    if (role === "instructor") { payload.subject = f("subject"); }
    const { error: profErr } = await supabase.from("profiles").upsert(payload);
    if (profErr) { setErr(profErr.message); setLd(false); return; }
    if (role === "parent" && f("student_email")) {
      const { data: students } = await supabase.from("profiles").select("id").eq("email", f("student_email").toLowerCase().trim());
      if (students?.length > 0) { await supabase.from("profiles").update({ parent_email: f("email") }).eq("id", students[0].id); }
    }
    setOk(role === "instructor" ? "Application submitted! You'll be reviewed within 24 hours." : "Account created! Welcome to NEXA 🚀");
    setTimeout(() => onAuthSuccess(payload), 1000);
    setLd(false);
  }

  const icons = { parent: "👨‍👩‍👧 Parent", student: "🎓 Student", instructor: "👨‍🏫 Instructor" };
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", padding: "40px 20px", transition: "background .3s" }}>
      <MatrixRain opacity={0.10} />
      <div style={{ background: C.bgCard, borderRadius: 22, padding: "clamp(18px,4vw,36px) clamp(16px,5vw,40px)", width: "100%", maxWidth: 480, boxShadow: isDark ? "0 20px 60px rgba(0,0,0,.7)" : "0 20px 60px rgba(0,0,0,.15)", border: `1px solid ${C.border}`, position: "relative", zIndex: 2, maxHeight: "92vh", overflowY: "auto", transition: "background .3s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, justifyContent: "center", marginBottom: 6 }}>
          <NexaLogo size={44} />
        </div>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <Tag color="navy">{icons[role]}</Tag>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.text, marginTop: 10, marginBottom: 4 }}>Create Your Account</div>
          <div style={{ fontSize: 12, color: C.textMuted }}>Join the NEXA community</div>
        </div>
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
          <FInput label="Full Name" placeholder="Your full name" value={f("full_name")} onChange={set("full_name")} autoComplete="name" />
          <FInput label="Email Address" type="email" placeholder="you@example.com" value={f("email")} onChange={set("email")} autoComplete="email" />
          <FormRow>
            <FInput label="Password" type="password" placeholder="Min 8 chars" value={f("password")} onChange={set("password")} autoComplete="new-password" />
            <FInput label="Confirm Password" type="password" placeholder="Repeat" value={f("confirmPassword")} onChange={set("confirmPassword")} autoComplete="new-password" />
          </FormRow>
          <Btn variant="primary" block onClick={() => { if (!f("full_name") || !f("email") || !f("password")) { setErr("Fill all required fields."); return; } setErr(""); setStep(2); }} style={{ marginTop: 8 }}>Continue →</Btn>
        </>}
        {step === 2 && <>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div onClick={() => fileRef.current?.click()} style={{ width: 80, height: 80, borderRadius: "50%", border: `2px dashed ${C.borderMid}`, cursor: "pointer", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: C.bgElevated }}>
              {avatarUrl ? <img src={avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 28, opacity: 0.5 }}>📷</span>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
            <div style={{ fontSize: 11, color: C.textMuted }}>Profile photo (optional)</div>
          </div>
          <FInput label="Phone Number" optional placeholder="01XXXXXXXXX" value={f("phone")} onChange={set("phone")} />
          {role === "student" && <FSelect label="Age" value={f("age")} onChange={set("age")} options={[{ value: "", label: "Select age…" }, ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 6), label: `${i + 6} years old` }))]} />}
          {role === "parent" && <>
            <Divider label="Link Your Child" />
            <div style={{ background: C.bgElevated, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.orangeLight, marginBottom: 3 }}>🔗 Connect your child's account</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 10 }}>Enter your child's registered email to link their dashboard</div>
              <FInput placeholder="child@email.com" type="email" value={f("student_email")} onChange={set("student_email")} />
              <div style={{ fontSize: 10, color: C.textMuted }}>Your account will automatically link to their progress.</div>
            </div>
          </>}
          {role === "instructor" && <FSelect label="Subject / Specialization" value={f("subject")} onChange={set("subject")} options={[{ value: "", label: "Select subject…" }, "Robotics", "Artificial Intelligence", "Programming", "Marketing Technology"]} />}
          {role === "instructor" && <div style={{ background: "rgba(242,147,43,.07)", border: "1px solid rgba(242,147,43,.18)", borderRadius: 9, padding: "11px 14px", fontSize: 11, color: "#fbb55a", marginBottom: 14 }}>⏳ Instructor accounts are reviewed by NEXA admin before activation (usually within 24 hours).</div>}
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="ghost" style={{ padding: "13px 20px", borderRadius: 10 }} onClick={() => { setErr(""); setStep(1); }}>← Back</Btn>
            <Btn variant="primary" block style={{ borderRadius: 10 }} onClick={doSignup} loading={ld}>{role === "instructor" ? "Submit Application" : "Create Account 🚀"}</Btn>
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
   HOME PAGES
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
  const { isDark } = useTheme();

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", transition: "background .3s" }}>
      <MatrixRain opacity={0.08} />
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, rgba(242,147,43,${isDark ? ".08" : ".05"}) 0%, transparent 70%)`, top: -150, right: -100, pointerEvents: "none", zIndex: 1 }} />
      <div style={{ background: C.bgCard, borderRadius: 24, padding: "clamp(24px,5vw,44px) clamp(20px,6vw,48px)", maxWidth: 480, width: "94%", position: "relative", zIndex: 2, textAlign: "center", border: `1px solid ${C.border}`, boxShadow: isDark ? "0 20px 60px rgba(0,0,0,.6)" : "0 20px 60px rgba(0,0,0,.15)", transition: "background .3s" }}>
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
function Shell({ sidebarItems, user: profile, onHome, pageTitle, topRight, children, accent, navItemsFlat }) {
  const isMobile = useIsMobile(768);
  const isTablet = useIsMobile(1024);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDark } = useTheme();
  const name = profile?.full_name || profile?.email?.split("@")[0] || "User";
  const ini = initials(name).toUpperCase();
  const collapsed = isTablet && !isMobile;
  const sidebarW = collapsed ? 64 : 252;

  useEffect(() => {
    if (!isMobile) { setSidebarOpen(false); return; }
    const handler = (e) => { if (sidebarOpen && !e.target.closest(".shell-sidebar")) setSidebarOpen(false); };
    document.addEventListener("touchstart", handler);
    return () => document.removeEventListener("touchstart", handler);
  }, [isMobile, sidebarOpen]);

  const SidebarInner = () => (
    <>
      <div style={{ padding: collapsed ? "0 0 18px" : "0 16px 18px", borderBottom: `1px solid ${C.border}`, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 10 }}>
        {collapsed
          ? <img src="/NEXA_LOGO.png" alt="NEXA" style={{ width: 36, height: 36, objectFit: "contain", display: "block", filter: isDark ? "drop-shadow(0 0 5px rgba(242,147,43,0.3))" : "none" }} onError={e => { e.target.style.display="none"; const fb=document.createElement("div"); fb.style.cssText=`width:34px;height:34px;border-radius:8px;background:linear-gradient(135deg,${C.orange},#e07b1a);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:11px;font-family:'Montserrat',sans-serif`; fb.textContent="NX"; e.target.parentNode.insertBefore(fb,e.target); }} />
          : <NexaLogo size={34} />
        }
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>{sidebarItems}</div>
      <div style={{ padding: collapsed ? "14px 0" : "14px 16px", borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 8 }}>
          <Avatar ini={ini} bg={accent || C.navyMid} size={30} src={profile?.avatar_url} style={{ flexShrink: 0 }} />
          {!collapsed && <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
              <div style={{ fontSize: 9, color: C.textMuted, textTransform: "capitalize" }}>{profile?.role}</div>
            </div>
            <button onClick={onHome} title="Home" style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(255,255,255,.05)", border: `1px solid ${C.border}`, cursor: "pointer", color: C.textMuted, fontSize: 13, flexShrink: 0 }}>⌂</button>
          </>}
        </div>
      </div>
    </>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: "'Montserrat',sans-serif", transition: "background .3s" }}>
      {!isMobile && (
        <div className="shell-sidebar" style={{ width: sidebarW, minHeight: "100vh", background: C.bgCard, display: "flex", flexDirection: "column", padding: collapsed ? "20px 0" : "20px 0", position: "fixed", top: 0, left: 0, zIndex: 100, borderRight: `1px solid ${C.border}`, transition: "width .2s, background .3s", overflow: "hidden" }}>
          <SidebarInner />
        </div>
      )}
      {isMobile && sidebarOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.65)" }} onClick={() => setSidebarOpen(false)} />
          <div className="shell-sidebar" style={{ position: "absolute", top: 0, left: 0, width: 260, height: "100%", background: C.bgCard, display: "flex", flexDirection: "column", padding: "20px 0", borderRight: `1px solid ${C.border}`, animation: "slideInLeft .22s ease", zIndex: 1 }}>
            <button onClick={() => setSidebarOpen(false)} style={{ position: "absolute", top: 12, right: 12, width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,.08)", border: "none", cursor: "pointer", color: C.textMuted, fontSize: 16 }}>✕</button>
            <SidebarInner />
          </div>
        </div>
      )}
      <div style={{ marginLeft: isMobile ? 0 : sidebarW, flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", minWidth: 0, transition: "margin-left .2s" }}>
        <div style={{ background: C.bgCard, padding: isMobile ? "11px 14px" : "12px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 50, gap: 10, transition: "background .3s" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)} style={{ width: 36, height: 36, borderRadius: 9, background: C.bgElevated, border: `1px solid ${C.border}`, cursor: "pointer", color: C.text, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>☰</button>
            )}
            <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 800, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pageTitle}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12, flexShrink: 0 }}>
            <ThemeSwitch />
            {topRight}
            {isMobile && <button onClick={onHome} style={{ width: 32, height: 32, borderRadius: 8, background: C.bgElevated, border: `1px solid ${C.border}`, cursor: "pointer", color: C.textMuted, fontSize: 15 }}>⌂</button>}
          </div>
        </div>
        <div style={{ padding: isMobile ? "14px 12px 80px" : collapsed ? "20px 18px" : "22px 26px", flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          {children}
        </div>
        {isMobile && navItemsFlat && (
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 60, background: C.bgCard, borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 100, transition: "background .3s" }}>
            {navItemsFlat.slice(0, 5).map((n, i) => (
              <button key={i} onClick={n.onClick} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, background: "transparent", border: "none", cursor: "pointer", padding: "6px 2px", position: "relative", WebkitTapHighlightColor: "transparent" }}>
                {n.active && <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 28, height: 2, background: accent || C.orange, borderRadius: "0 0 2px 2px" }} />}
                <span style={{ fontSize: 19 }}>{n.icon}</span>
                <span style={{ fontSize: 8, fontWeight: 700, color: n.active ? (accent || C.orange) : C.textMuted, letterSpacing: 0.3 }}>{n.label}</span>
                {n.badge > 0 && <div style={{ position: "absolute", top: 5, left: "calc(50% + 6px)", minWidth: 14, height: 14, borderRadius: 7, background: C.orange, color: "#fff", fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>{n.badge}</div>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NavItem({ icon, label, badge, active, onClick, accent }) {
  const collapsed = useIsMobile(1024) && !useIsMobile(768);
  return (
    <div onClick={onClick} title={collapsed ? label : ""} style={{ display: "flex", alignItems: "center", gap: collapsed ? 0 : 11, padding: collapsed ? "11px 0" : "10px 18px", justifyContent: collapsed ? "center" : "flex-start", cursor: "pointer", borderLeft: collapsed ? "none" : `3px solid ${active ? (accent || C.orange) : "transparent"}`, background: active ? `${accent || C.orange}14` : "transparent", color: active ? C.text : C.textMuted, fontSize: 12, fontWeight: 600, transition: "all .15s", WebkitTapHighlightColor: "transparent" }}>
      <span style={{ fontSize: collapsed ? 19 : 15, textAlign: "center", width: collapsed ? "100%" : 17 }}>{icon}</span>
      {!collapsed && <span style={{ flex: 1 }}>{label}</span>}
      {!collapsed && badge > 0 && <span style={{ background: accent || C.orange, color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 20 }}>{badge}</span>}
    </div>
  );
}

function SectionLabel({ children }) {
  const collapsed = useIsMobile(1024) && !useIsMobile(768);
  if (collapsed) return <div style={{ height: 1, background: C.border, margin: "8px 10px" }} />;
  return <div style={{ fontSize: 9, color: C.textMid, letterSpacing: 3, textTransform: "uppercase", padding: "12px 18px 6px", fontWeight: 800 }}>{children}</div>;
}

function MsgResponsiveLayout({ msgTo, children }) {
  const isMobile = useIsMobile(768);
  if (isMobile) { return msgTo ? <div>{children[1]}</div> : <div>{children[0]}</div>; }
  return <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16 }}>{children}</div>;
}

function MsgThread({ fromId, toId, myProfile }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [toProfile, setToProfile] = useState(null);
  const [presence, setPresence] = useState(null);
  const threadRef = useRef(null);

  useEffect(() => {
    if (!toId) return;
    supabase.from("profiles").select("full_name,avatar_url,role").eq("id", toId).single().then(({ data }) => setToProfile(data));
    supabase.from("presence").select("online,last_seen").eq("user_id", toId).single().then(({ data }) => setPresence(data));
    loadMsgs();
    const msgCh = supabase.channel("msgs-" + fromId + "-" + toId).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => loadMsgs()).subscribe();
    const presCh = supabase.channel("pres-" + toId).on("postgres_changes", { event: "*", schema: "public", table: "presence", filter: `user_id=eq.${toId}` }, ({ new: row }) => setPresence(row)).subscribe();
    return () => { supabase.removeChannel(msgCh); supabase.removeChannel(presCh); };
  }, [fromId, toId]);

  async function loadMsgs() {
    const { data } = await supabase.from("messages").select("*").or(`and(from_id.eq.${fromId},to_id.eq.${toId}),and(from_id.eq.${toId},to_id.eq.${fromId})`).order("created_at", { ascending: true });
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
  const isOnline = presence?.online === true;
  const lastSeen = presence?.last_seen;

  return (
    <div>
      {toProfile && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, padding: "12px 16px", background: C.bgElevated, borderRadius: 12, border: `1px solid ${C.border}` }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <Avatar ini={otherIni} bg={C.navyMid} size={40} src={toProfile.avatar_url} />
            <span style={{ position: "absolute", bottom: 0, right: 0, width: 11, height: 11, borderRadius: "50%", background: isOnline ? "#4ade80" : C.textMuted, border: `2px solid ${C.bgElevated}`, boxShadow: isOnline ? "0 0 6px rgba(74,222,128,.6)" : "none" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{otherName}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
              <span style={{ fontSize: 10, color: isOnline ? "#4ade80" : C.textMuted, fontWeight: 600 }}>{isOnline ? "● Online" : lastSeen ? `Last seen ${formatLastSeen(lastSeen)}` : "Offline"}</span>
            </div>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: "rgba(146,185,214,.15)", color: C.sky, flexShrink: 0, textTransform: "capitalize" }}>{toProfile.role}</span>
        </div>
      )}
      <div ref={threadRef} style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: 400, overflowY: "auto", padding: "4px 2px", marginBottom: 14 }}>
        {msgs.length === 0 && <div style={{ textAlign: "center", color: C.textMuted, fontSize: 12, padding: "40px 0" }}><div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>No messages yet. Say hello!</div>}
        {msgs.map((m, idx) => {
          const isMe = m.from_id === fromId;
          const showTime = idx === 0 || (new Date(m.created_at) - new Date(msgs[idx-1]?.created_at)) > 5 * 60 * 1000;
          return (
            <div key={m.id}>
              {showTime && <div style={{ textAlign: "center", fontSize: 9, color: C.textMuted, margin: "4px 0 10px", letterSpacing: 0.5 }}>{new Date(m.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>}
              <div style={{ display: "flex", gap: 8, maxWidth: "82%", alignSelf: isMe ? "flex-end" : "flex-start", flexDirection: isMe ? "row-reverse" : "row", marginLeft: isMe ? "auto" : 0 }}>
                <Avatar ini={isMe ? myIni : otherIni} bg={isMe ? C.orange : C.navyMid} size={28} src={isMe ? myProfile?.avatar_url : toProfile?.avatar_url} style={{ flexShrink: 0, alignSelf: "flex-end" }} />
                <div style={{ maxWidth: "100%" }}>
                  <div style={{ padding: "9px 13px", borderRadius: 14, fontSize: 13, lineHeight: 1.55, background: isMe ? C.navyMid : C.bgSurface, color: C.text, border: `1px solid ${isMe ? "rgba(35,85,138,.6)" : C.border}`, borderBottomLeftRadius: !isMe ? 3 : 14, borderBottomRightRadius: isMe ? 3 : 14, wordBreak: "break-word" }}>{m.body}</div>
                  <div style={{ fontSize: 9, color: C.textMuted, marginTop: 3, textAlign: isMe ? "right" : "left" }}>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{isMe && <span style={{ marginLeft: 4, color: isOnline ? "#4ade80" : C.textMuted }}>✓</span>}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 10, paddingTop: 14, borderTop: `1px solid ${C.border}`, alignItems: "center" }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder={isOnline ? `Message ${otherName}…` : `Message ${otherName} (offline)…`} style={{ flex: 1, padding: "11px 16px", border: `1.5px solid ${C.border}`, borderRadius: 50, fontFamily: "'Montserrat',sans-serif", fontSize: 12, color: C.text, background: C.bgSurface, outline: "none" }} />
        <button onClick={send} style={{ width: 42, height: 42, borderRadius: "50%", background: input.trim() ? C.navyMid : C.bgElevated, border: "none", cursor: "pointer", color: input.trim() ? "#fff" : C.textMuted, fontSize: 17, transition: "all .2s", flexShrink: 0 }}>➤</button>
      </div>
    </div>
  );
}

function NotificationsPanel({ profile }) {
  const [notifs, setNotifs] = useState([]);
  useEffect(() => {
    supabase.from("notifications").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }).then(({ data }) => setNotifs(data || []));
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
  const [presenceMap, setPresenceMap] = useState({});
  usePresence(profile.id);

  useEffect(() => {
    supabase.from("grades").select("*").eq("student_id", profile.id).order("graded_at", { ascending: false }).then(({ data }) => setGrades(data || []));
    supabase.from("achievements").select("*").eq("student_id", profile.id).then(({ data }) => setAchievements(data || []));
    supabase.from("sessions").select("*").order("session_date").limit(10).then(({ data }) => setSessions(data || []));
    supabase.from("profiles").select("id,full_name,avatar_url,current_level,total_xp,role").eq("role", "student").order("total_xp", { ascending: false }).limit(10).then(({ data }) => setLeaderboard(data || []));
    supabase.from("profiles").select("id,full_name,avatar_url,subject,role").eq("role", "instructor").then(({ data }) => setContactList(data || []));
    supabase.from("presence").select("user_id,online,last_seen").then(({ data }) => { const map = {}; (data || []).forEach(p => { map[p.user_id] = p; }); setPresenceMap(map); });
    const ch = supabase.channel("presence-all-std").on("postgres_changes", { event: "*", schema: "public", table: "presence" }, ({ new: row }) => setPresenceMap(m => ({ ...m, [row.user_id]: row }))).subscribe();
    return () => supabase.removeChannel(ch);
  }, [profile.id]);

  const avgGrade = grades.length ? Math.round(grades.reduce((a, g) => a + (g.score || 0), 0) / grades.length) : 0;
  const name = profile.full_name || profile.email?.split("@")[0];
  const navItems = [[{ section: "My Learning" }],[{ icon: "🏠", label: "Overview", id: "overview" }],[{ icon: "📊", label: "My Grades", id: "grades" }],[{ icon: "📅", label: "Schedule", id: "schedule" }],[{ icon: "🏆", label: "Hall of Fame", id: "leaderboard" }],[{ section: "Communication" }],[{ icon: "💬", label: "Messages", id: "messages" }],[{ icon: "🔔", label: "Notifications", id: "notifications" }]];
  const titles = { overview: "My Dashboard", grades: "My Grades", schedule: "Schedule", leaderboard: "Hall of Fame", messages: "Messages", notifications: "Notifications" };
  const flatNav = navItems.filter(n => !n[0]?.section).map(n => ({ ...n[0], active: page === n[0].id, onClick: () => setPage(n[0].id) }));

  return (
    <Shell accent={C.orange} navItemsFlat={flatNav} sidebarItems={navItems.map((n, i) => n[0]?.section ? <SectionLabel key={i}>{n[0].section}</SectionLabel> : <NavItem key={i} icon={n[0].icon} label={n[0].label} active={page === n[0].id} onClick={() => setPage(n[0].id)} accent={C.orange} />)} user={profile} onHome={onHome} pageTitle={titles[page] || "Dashboard"} topRight={<span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: "rgba(242,147,43,.15)", color: C.orangeLight }}>🚀 Level {profile.current_level || 1}</span>}>
      {page === "overview" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, color: C.text }}>Hey, {name.split(" ")[0]}! 👋</h1><p style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>Level {profile.current_level || 1} · {profile.total_xp || 0} XP</p></div>
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
        {grades.length > 0 && <Card><CardHead title="Recent Grades" /><CardBody style={{ padding: "10px 14px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Assessment", "Subject", "Score", "Date"].map(h => <th key={h} style={{ textAlign: "left", fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1, textTransform: "uppercase", padding: "10px 12px", background: C.bgElevated }}>{h}</th>)}</tr></thead>
            <tbody>{grades.slice(0, 5).map(g => <tr key={g.id}><td style={{ padding: "12px", fontSize: 12, color: C.text, borderBottom: `1px solid ${C.border}` }}>{g.assessment_name}</td><td style={{ padding: "12px", fontSize: 12, color: C.textMid, borderBottom: `1px solid ${C.border}` }}>{g.subject}</td><td style={{ padding: "12px", fontSize: 14, fontWeight: 800, color: g.score >= 80 ? "#4ade80" : g.score >= 60 ? C.orangeLight : "#f87171", borderBottom: `1px solid ${C.border}` }}>{g.score}%</td><td style={{ padding: "12px", fontSize: 11, color: C.textMuted, borderBottom: `1px solid ${C.border}` }}>{new Date(g.graded_at).toLocaleDateString()}</td></tr>)}</tbody>
          </table>
        </CardBody></Card>}
      </div>}
      {page === "grades" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, color: C.text }}>My Grades</h1></div>
        {grades.length === 0 ? <div style={{ textAlign: "center", color: C.textMuted, fontSize: 14, padding: "60px 0" }}>No grades recorded yet.</div> :
          <Card><CardBody style={{ padding: "10px 14px" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr>{["Assessment", "Subject", "Score", "Notes", "Date"].map(h => <th key={h} style={{ textAlign: "left", fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1, textTransform: "uppercase", padding: "10px 12px", background: C.bgElevated }}>{h}</th>)}</tr></thead><tbody>{grades.map(g => <tr key={g.id}><td style={{ padding: "12px", fontSize: 12, color: C.text, borderBottom: `1px solid ${C.border}` }}>{g.assessment_name}</td><td style={{ padding: "12px", fontSize: 12, color: C.textMid, borderBottom: `1px solid ${C.border}` }}>{g.subject}</td><td style={{ padding: "12px", fontSize: 14, fontWeight: 800, color: g.score >= 80 ? "#4ade80" : g.score >= 60 ? C.orangeLight : "#f87171", borderBottom: `1px solid ${C.border}` }}>{g.score}%</td><td style={{ padding: "12px", fontSize: 11, color: C.textMuted, borderBottom: `1px solid ${C.border}`, maxWidth: 200 }}>{g.notes || "—"}</td><td style={{ padding: "12px", fontSize: 11, color: C.textMuted, borderBottom: `1px solid ${C.border}` }}>{new Date(g.graded_at).toLocaleDateString()}</td></tr>)}</tbody></table></CardBody></Card>}
      </div>}
      {page === "schedule" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, color: C.text }}>Schedule</h1></div>
        {sessions.length === 0 ? <div style={{ textAlign: "center", color: C.textMuted, fontSize: 14, padding: "60px 0" }}>No sessions scheduled yet.</div> :
          <Card><CardHead title="Upcoming Sessions" /><CardBody>{sessions.map(s => (<div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: C.bgElevated, borderRadius: 9, borderLeft: `3px solid ${C.orange}`, marginBottom: 8 }}><div style={{ fontSize: 11, fontWeight: 800, color: C.textMid, minWidth: 70 }}>{s.start_time}</div><div><div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{s.subject} {s.level ? `· Level ${s.level}` : ""}</div><div style={{ fontSize: 10, color: C.textMuted }}>{s.session_date} {s.cohort ? `· ${s.cohort}` : ""} {s.room ? `· ${s.room}` : ""}</div></div></div>))}</CardBody></Card>}
      </div>}
      {page === "leaderboard" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, color: C.text }}>Hall of Fame</h1><p style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>Top NEXA creators ranked by XP</p></div>
        <Card><CardBody>{leaderboard.map((s, i) => (<div key={s.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: i < leaderboard.length - 1 ? `1px solid ${C.border}` : "none" }}><div style={{ width: 28, fontWeight: 800, fontSize: 14, color: i < 3 ? C.orange : C.textMuted, textAlign: "center" }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</div><Avatar ini={initials(s.full_name || s.id).toUpperCase()} bg={s.id === profile.id ? C.orange : C.navyMid} size={38} src={s.avatar_url} radius={10} /><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{s.full_name || "Anonymous"} {s.id === profile.id ? <span style={{ color: C.orangeLight, fontSize: 10 }}>(you)</span> : ""}</div><div style={{ fontSize: 10, color: C.textMuted }}>Level {s.current_level || 1}</div></div><div style={{ textAlign: "right" }}><div style={{ fontSize: 17, fontWeight: 800, color: C.orangeLight }}>{s.total_xp || 0}</div><div style={{ fontSize: 9, color: C.textMuted }}>XP</div></div></div>))}{leaderboard.length === 0 && <div style={{ textAlign: "center", color: C.textMuted, fontSize: 14, padding: "40px 0" }}>No students enrolled yet.</div>}</CardBody></Card>
      </div>}
      {page === "messages" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, color: C.text }}>Messages</h1></div>
        <MsgResponsiveLayout msgTo={msgTo}>
          <Card><CardHead title="Contacts" /><CardBody style={{ padding: "10px 0" }}>{contactList.map(c => (<div key={c.id} onClick={() => setMsgTo(c.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer", background: msgTo === c.id ? C.bgSurface : "transparent", transition: "all .15s", minHeight: 56, borderBottom: `1px solid ${C.border}` }}><div style={{ position: "relative", flexShrink: 0 }}><Avatar ini={initials(c.full_name || "").toUpperCase()} bg={C.navyMid} size={36} src={c.avatar_url} /><span style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: presenceMap[c.id]?.online ? "#4ade80" : C.textMuted, border: `2px solid ${C.bgCard}`, boxShadow: presenceMap[c.id]?.online ? "0 0 5px rgba(74,222,128,.5)" : "none" }} /></div><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.full_name}</div><div style={{ fontSize: 10, color: presenceMap[c.id]?.online ? "#4ade80" : C.textMuted, marginTop: 2 }}>{presenceMap[c.id]?.online ? "● Online" : presenceMap[c.id]?.last_seen ? `${formatLastSeen(presenceMap[c.id].last_seen)}` : c.subject || c.role}</div></div></div>))}{contactList.length === 0 && <div style={{ textAlign: "center", color: C.textMuted, fontSize: 12, padding: "20px 14px" }}>No instructors yet.</div>}</CardBody></Card>
          <Card><CardBody>{msgTo ? <MsgThread fromId={profile.id} toId={msgTo} myProfile={profile} /> : <div style={{ textAlign: "center", color: C.textMuted, fontSize: 13, padding: "60px 0" }}>Select a contact to start messaging</div>}</CardBody></Card>
        </MsgResponsiveLayout>
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
  const [presenceMap, setPresenceMap] = useState({});
  usePresence(profile.id);

  useEffect(() => { loadData(); }, [profile]);

  async function loadData() {
    supabase.from("presence").select("user_id,online,last_seen").then(({ data }) => { const map = {}; (data || []).forEach(p => { map[p.user_id] = p; }); setPresenceMap(map); });
    const ch = supabase.channel("presence-all-par").on("postgres_changes", { event: "*", schema: "public", table: "presence" }, ({ new: row }) => setPresenceMap(m => ({ ...m, [row.user_id]: row }))).subscribe();
    if (profile.student_email) {
      const { data: kids } = await supabase.from("profiles").select("*").eq("email", profile.student_email);
      if (kids?.length > 0) {
        const kid = kids[0]; setChild(kid);
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
  const navItems = [[{ section: "My Child" }],[{ icon: "🏠", label: "Overview", id: "overview" }],[{ icon: "👤", label: "Child Profile", id: "child" }],[{ icon: "📊", label: "Grades", id: "grades" }],[{ icon: "📅", label: "Schedule", id: "schedule" }],[{ icon: "🏆", label: "Achievements", id: "achievements" }],[{ section: "Communication" }],[{ icon: "💬", label: "Messages", id: "messages", badge: unread }],[{ icon: "🔔", label: "Notifications", id: "notifications" }]];
  const titles = { overview: "Parent Overview", child: "Child Profile", grades: "Grades & Progress", schedule: "Schedule", achievements: "Achievements", messages: "Messages", notifications: "Notifications" };
  const flatNav = navItems.filter(n => !n[0]?.section).map(n => ({ ...n[0], active: page === n[0].id, onClick: () => setPage(n[0].id) }));

  return (
    <Shell accent={C.navyMid} navItemsFlat={flatNav} sidebarItems={navItems.map((n, i) => n[0]?.section ? <SectionLabel key={i}>{n[0].section}</SectionLabel> : <NavItem key={i} icon={n[0].icon} label={n[0].label} badge={n[0].badge} active={page === n[0].id} onClick={() => setPage(n[0].id)} accent={C.navyMid} />)} user={profile} onHome={onHome} pageTitle={titles[page] || "Dashboard"} topRight={<></>}>
      {page === "overview" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, color: C.text }}>Good day, {name.split(" ")[0]} 👋</h1><p style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>{child ? `Tracking ${childName}'s progress` : "No child linked yet"}</p></div>
        {!child && <div style={{ background: "rgba(242,147,43,.08)", border: "1px solid rgba(242,147,43,.2)", borderRadius: 12, padding: "20px 24px", marginBottom: 24 }}><div style={{ fontSize: 14, fontWeight: 700, color: C.orangeLight, marginBottom: 6 }}>🔗 No child linked</div><div style={{ fontSize: 13, color: C.textMuted }}>Your account isn't linked to a student yet.</div></div>}
        {child && <><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 18, marginBottom: 22 }}>
          <StatCard icon="📊" value={avgGrade ? `${avgGrade}%` : "—"} label="Avg Grade" accent={C.navyMid} />
          <StatCard icon="🏆" value={childAch.length} label="Achievements" accent={C.orange} />
          <StatCard icon="⚡" value={`Lvl ${child.current_level || 1}`} label="Current Level" accent={C.sky} />
          <StatCard icon="💰" value={child.total_xp || 0} label="Total XP" accent="#6366f1" />
        </div>
        {childGrades.length > 0 && <Card><CardHead title={`${childName}'s Recent Grades`} /><CardBody style={{ padding: "10px 14px" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr>{["Assessment", "Subject", "Score", "Date"].map(h => <th key={h} style={{ textAlign: "left", fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1, textTransform: "uppercase", padding: "10px 12px", background: C.bgElevated }}>{h}</th>)}</tr></thead><tbody>{childGrades.slice(0, 5).map(g => <tr key={g.id}><td style={{ padding: "12px", fontSize: 12, color: C.text, borderBottom: `1px solid ${C.border}` }}>{g.assessment_name}</td><td style={{ padding: "12px", fontSize: 12, color: C.textMid, borderBottom: `1px solid ${C.border}` }}>{g.subject}</td><td style={{ padding: "12px", fontSize: 14, fontWeight: 800, color: g.score >= 80 ? "#4ade80" : g.score >= 60 ? C.orangeLight : "#f87171", borderBottom: `1px solid ${C.border}` }}>{g.score}%</td><td style={{ padding: "12px", fontSize: 11, color: C.textMuted, borderBottom: `1px solid ${C.border}` }}>{new Date(g.graded_at).toLocaleDateString()}</td></tr>)}</tbody></table></CardBody></Card>}</>}
      </div>}
      {page === "child" && child && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, color: C.text }}>{childName}</h1></div>
        <div style={{ background: `linear-gradient(135deg,${C.navy},${C.navyMid})`, borderRadius: 14, padding: 28, display: "flex", alignItems: "center", gap: 22, marginBottom: 22 }}>
          <Avatar ini={initials(childName).toUpperCase()} bg="rgba(255,255,255,.15)" size={74} radius={18} src={child.avatar_url} style={{ border: "2.5px solid rgba(255,255,255,.18)" }} />
          <div style={{ flex: 1 }}><div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 3 }}>{childName}</div><div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", display: "flex", gap: 14 }}>{child.age && <span>🎂 Age {child.age}</span>}<span>📍 Year {child.year || 1} · Level {child.current_level || 1}</span><span>✨ {child.total_xp || 0} XP</span></div></div>
        </div>
      </div>}
      {page === "grades" && <div><div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, color: C.text }}>Grades & Progress</h1></div>{childGrades.length === 0 ? <div style={{ textAlign: "center", color: C.textMuted, fontSize: 14, padding: "60px 0" }}>No grades recorded yet.</div> : <Card><CardBody style={{ padding: "10px 14px" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr>{["Assessment", "Subject", "Score", "Notes", "Date"].map(h => <th key={h} style={{ textAlign: "left", fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1, textTransform: "uppercase", padding: "10px 12px", background: C.bgElevated }}>{h}</th>)}</tr></thead><tbody>{childGrades.map(g => <tr key={g.id}><td style={{ padding: "12px", fontSize: 12, color: C.text, borderBottom: `1px solid ${C.border}` }}>{g.assessment_name}</td><td style={{ padding: "12px", fontSize: 12, color: C.textMid, borderBottom: `1px solid ${C.border}` }}>{g.subject}</td><td style={{ padding: "12px", fontSize: 14, fontWeight: 800, color: g.score >= 80 ? "#4ade80" : g.score >= 60 ? C.orangeLight : "#f87171", borderBottom: `1px solid ${C.border}` }}>{g.score}%</td><td style={{ padding: "12px", fontSize: 11, color: C.textMuted, borderBottom: `1px solid ${C.border}` }}>{g.notes || "—"}</td><td style={{ padding: "12px", fontSize: 11, color: C.textMuted, borderBottom: `1px solid ${C.border}` }}>{new Date(g.graded_at).toLocaleDateString()}</td></tr>)}</tbody></table></CardBody></Card>}</div>}
      {page === "schedule" && <div><div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, color: C.text }}>Schedule</h1></div>{sessions.length === 0 ? <div style={{ textAlign: "center", color: C.textMuted, fontSize: 14, padding: "60px 0" }}>No sessions yet.</div> : <Card><CardHead title="Upcoming Sessions" /><CardBody>{sessions.map(s => (<div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: C.bgElevated, borderRadius: 9, borderLeft: `3px solid ${C.navyMid}`, marginBottom: 8 }}><div style={{ fontSize: 11, fontWeight: 800, color: C.textMid, minWidth: 70 }}>{s.start_time}</div><div><div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{s.subject} {s.level ? `· Level ${s.level}` : ""}</div><div style={{ fontSize: 10, color: C.textMuted }}>{s.session_date}</div></div></div>))}</CardBody></Card>}</div>}
      {page === "achievements" && <div><div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, color: C.text }}>Achievements</h1></div>{childAch.length === 0 ? <div style={{ textAlign: "center", color: C.textMuted, fontSize: 14, padding: "60px 0" }}>No achievements yet.</div> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 14 }}>{childAch.map(a => (<div key={a.id} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 12px", textAlign: "center" }}><div style={{ fontSize: 28, marginBottom: 8 }}>{a.badge}</div><div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{a.label}</div><div style={{ fontSize: 9, color: C.textMuted, marginTop: 4 }}>{new Date(a.earned_at).toLocaleDateString()}</div></div>))}</div>}</div>}
      {page === "messages" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, color: C.text }}>Messages</h1></div>
        <MsgResponsiveLayout msgTo={msgTo}>
          <Card><CardHead title="Instructors" /><CardBody style={{ padding: "10px 0" }}>{instructors.map(c => (<div key={c.id} onClick={() => setMsgTo(c.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer", background: msgTo === c.id ? C.bgSurface : "transparent", borderBottom: `1px solid ${C.border}` }}><div style={{ position: "relative", flexShrink: 0 }}><Avatar ini={initials(c.full_name || "").toUpperCase()} bg={C.navyMid} size={36} src={c.avatar_url} /><span style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: presenceMap[c.id]?.online ? "#4ade80" : C.textMuted, border: `2px solid ${C.bgCard}` }} /></div><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.full_name}</div><div style={{ fontSize: 10, color: presenceMap[c.id]?.online ? "#4ade80" : C.textMuted, marginTop: 2 }}>{presenceMap[c.id]?.online ? "● Online" : presenceMap[c.id]?.last_seen ? formatLastSeen(presenceMap[c.id].last_seen) : c.subject}</div></div></div>))}{instructors.length === 0 && <div style={{ textAlign: "center", color: C.textMuted, fontSize: 12, padding: "20px 14px" }}>No instructors yet.</div>}</CardBody></Card>
          <Card><CardBody>{msgTo ? <MsgThread fromId={profile.id} toId={msgTo} myProfile={profile} /> : <div style={{ textAlign: "center", color: C.textMuted, fontSize: 13, padding: "60px 0" }}>Select an instructor to message</div>}</CardBody></Card>
        </MsgResponsiveLayout>
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
  const [gForm, setGForm] = useState({ studentId: "", subject: profile.subject || "Robotics", name: "", score: "", notes: "" });
  const [gSaved, setGSaved] = useState(false);
  const [gErr, setGErr] = useState("");
  const [sForm, setSForm] = useState({ subject: profile.subject || "Robotics", level: "5", cohort: "", room: "", date: "", time: "" });
  const [sSaved, setSSaved] = useState(false);
  const [presenceMap, setPresenceMap] = useState({});
  const [levelingUp, setLevelingUp] = useState(null);
  const [notes, setNotes] = useState({});
  const [noteInput, setNoteInput] = useState({ studentId: "", text: "" });
  const [noteSaving, setNoteSaving] = useState(false);
  const [allNotes, setAllNotes] = useState([]);
  usePresence(profile.id);

  useEffect(() => {
    supabase.from("profiles").select("*").eq("role", "student").order("full_name").then(({ data }) => setStudents(data || []));
    supabase.from("sessions").select("*").eq("instructor_id", profile.id).order("session_date").then(({ data }) => setSessions(data || []));
    supabase.from("grades").select("*,profiles!grades_student_id_fkey(full_name)").eq("instructor_id", profile.id).order("graded_at", { ascending: false }).limit(20).then(({ data }) => setGrades(data || []));
    supabase.from("profiles").select("id,full_name,avatar_url,role,subject").in("role", ["parent", "student"]).then(({ data }) => setContacts(data || []));
    supabase.from("presence").select("user_id,online,last_seen").then(({ data }) => { const map = {}; (data || []).forEach(p => { map[p.user_id] = p; }); setPresenceMap(map); });
    loadNotes();
    const ch = supabase.channel("presence-all-inst").on("postgres_changes", { event: "*", schema: "public", table: "presence" }, ({ new: row }) => setPresenceMap(m => ({ ...m, [row.user_id]: row }))).subscribe();
    return () => supabase.removeChannel(ch);
  }, [profile.id]);

  async function loadNotes() {
    const { data } = await supabase.from("student_notes").select("*,profiles!student_notes_student_id_fkey(full_name)").eq("instructor_id", profile.id).order("created_at", { ascending: false });
    if (data) {
      setAllNotes(data);
      const map = {};
      data.forEach(n => { if (!map[n.student_id]) map[n.student_id] = []; map[n.student_id].unshift(n); });
      setNotes(map);
    }
  }

  async function saveNote() {
    if (!noteInput.studentId || !noteInput.text.trim()) return;
    setNoteSaving(true);
    const { error } = await supabase.from("student_notes").insert({ instructor_id: profile.id, student_id: noteInput.studentId, note: noteInput.text.trim(), created_at: new Date().toISOString() });
    if (!error) {
      setNoteInput(p => ({ ...p, text: "" }));
      await loadNotes();
      toast("Note saved!");
    } else {
      toast("Could not save note. Please try again or contact support.", "err");
    }
    setNoteSaving(false);
  }

  async function levelUpStudent(studentId) {
    if (levelingUp) return;
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    setLevelingUp(studentId);
    const newLevel = (student.current_level || 1) + 1;
    const { error } = await supabase.from("profiles").update({ current_level: newLevel }).eq("id", studentId);
    if (!error) {
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, current_level: newLevel } : s));
      await supabase.from("notifications").insert({ user_id: studentId, title: "🎉 Level Up!", body: `Congratulations! You've been promoted to Level ${newLevel}! Keep up the great work!`, type: "level" });
      toast(`🎉 ${student.full_name || "Student"} is now Level ${newLevel}!`);
    } else {
      toast("Failed to level up student.", "err");
    }
    setLevelingUp(null);
  }

  async function saveGrade() {
    setGErr("");
    if (!gForm.studentId || !gForm.subject || !gForm.name || !gForm.score) { setGErr("Please fill all required fields."); return; }
    const score = parseFloat(gForm.score);
    if (isNaN(score) || score < 0 || score > 100) { setGErr("Score must be 0–100."); return; }
    const { error } = await supabase.from("grades").insert({ student_id: gForm.studentId, instructor_id: profile.id, subject: gForm.subject, assessment_name: gForm.name, score, notes: gForm.notes || null });
    if (error) { setGErr(error.message); return; }
    await supabase.from("notifications").insert({ user_id: gForm.studentId, title: `New grade: ${gForm.name}`, body: `You scored ${score}% in ${gForm.subject}`, type: "grade" });
    const student = students.find(s => s.id === gForm.studentId);
    if (student) { const xpGain = Math.round(score / 10); await supabase.from("profiles").update({ total_xp: (student.total_xp || 0) + xpGain }).eq("id", gForm.studentId); }
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
  const navItems = [[{ section: "Teaching" }],[{ icon: "🏠", label: "Overview", id: "overview" }],[{ icon: "👥", label: "My Students", id: "students" }],[{ icon: "📅", label: "Sessions", id: "sessions" }],[{ icon: "📊", label: "Grade Entry", id: "grades" }],[{ icon: "📝", label: "Student Notes", id: "notes" }],[{ section: "Communication" }],[{ icon: "💬", label: "Messages", id: "messages" }],[{ icon: "🔔", label: "Notifications", id: "notifications" }]];
  const titles = { overview: "Instructor Overview", students: "My Students", sessions: "Sessions", grades: "Grade Entry", notes: "Student Notes", messages: "Messages", notifications: "Notifications" };
  const flatNav = navItems.filter(n => !n[0]?.section).map(n => ({ ...n[0], active: page === n[0].id, onClick: () => setPage(n[0].id) }));

  return (
    <Shell accent={C.sky} navItemsFlat={flatNav} sidebarItems={navItems.map((n, i) => n[0]?.section ? <SectionLabel key={i}>{n[0].section}</SectionLabel> : <NavItem key={i} icon={n[0].icon} label={n[0].label} active={page === n[0].id} onClick={() => setPage(n[0].id)} accent={C.sky} />)} user={profile} onHome={onHome} pageTitle={titles[page] || "Dashboard"} topRight={<span style={{ fontSize: 12, color: C.textMuted }}>{profile.subject}</span>}>
      {page === "overview" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, color: C.text }}>Welcome, {name.split(" ")[0]} 👋</h1><p style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>{profile.subject} Instructor · {students.length} students</p></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 18, marginBottom: 22 }}>
          <StatCard icon="👥" value={students.length} label="Total Students" accent={C.navy} />
          <StatCard icon="📅" value={todaySessions.length} label="Sessions Today" accent={C.orange} />
          <StatCard icon="📊" value={grades.length} label="Grades Given" accent="#22c55e" />
          <StatCard icon="📋" value={sessions.length} label="Total Sessions" accent={C.sky} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
          <Card><CardHead title="Today's Sessions" /><CardBody>{todaySessions.length === 0 ? <div style={{ textAlign: "center", color: C.textMuted, fontSize: 13, padding: "20px 0" }}>No sessions today.</div> : todaySessions.map(s => (<div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "rgba(242,147,43,.07)", borderRadius: 9, borderLeft: `3px solid ${C.orange}`, marginBottom: 8 }}><div style={{ fontSize: 11, fontWeight: 800, color: C.textMid, minWidth: 65 }}>{s.start_time}</div><div><div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{s.subject} · Level {s.level}</div><div style={{ fontSize: 10, color: C.textMuted }}>{s.cohort} {s.room ? `· ${s.room}` : ""}</div></div></div>))}</CardBody></Card>
          <Card><CardHead title="Recent Grades" /><CardBody style={{ padding: "10px 0" }}>{grades.slice(0, 5).map(g => (<div key={g.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 18px", borderBottom: `1px solid ${C.border}` }}><div><div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{g.profiles?.full_name || "Student"}</div><div style={{ fontSize: 10, color: C.textMuted }}>{g.assessment_name} · {g.subject}</div></div><div style={{ fontSize: 16, fontWeight: 800, color: g.score >= 80 ? "#4ade80" : g.score >= 60 ? C.orangeLight : "#f87171" }}>{g.score}%</div></div>))}{grades.length === 0 && <div style={{ textAlign: "center", color: C.textMuted, fontSize: 13, padding: "20px 0" }}>No grades yet.</div>}</CardBody></Card>
        </div>
      </div>}
      {page === "students" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, color: C.text }}>My Students</h1><p style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>{students.length} enrolled students</p></div>
        {students.length === 0 ? <div style={{ textAlign: "center", color: C.textMuted, fontSize: 14, padding: "60px 0" }}>No students enrolled yet.</div> : students.map(s => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, background: C.bgCard, borderRadius: 13, border: `1px solid ${C.border}`, marginBottom: 10, flexWrap: "wrap" }}>
            <Avatar ini={initials(s.full_name || s.email || "").toUpperCase()} bg={C.navyMid} size={46} radius={12} src={s.avatar_url} />
            <div style={{ flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{s.full_name || s.email?.split("@")[0]}</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{s.age ? `Age ${s.age} · ` : ""}Year {s.year || 1} · <span style={{ color: C.orange, fontWeight: 700 }}>Level {s.current_level || 1}</span> · {s.total_xp || 0} XP</div>
              <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{s.email}</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button onClick={() => { setNoteInput({ studentId: s.id, text: "" }); setPage("notes"); }} style={{ padding: "8px 14px", borderRadius: 8, background: C.bgElevated, border: `1px solid ${C.border}`, cursor: "pointer", fontFamily: "'Montserrat',sans-serif", fontSize: 11, fontWeight: 700, color: C.textMid }}>📝 Notes{notes[s.id]?.length ? ` (${notes[s.id].length})` : ""}</button>
              <button onClick={() => levelUpStudent(s.id)} disabled={levelingUp === s.id} style={{ padding: "8px 16px", borderRadius: 8, background: levelingUp === s.id ? C.bgElevated : `linear-gradient(135deg,${C.orange},#e07b1a)`, border: "none", cursor: levelingUp === s.id ? "wait" : "pointer", fontFamily: "'Montserrat',sans-serif", fontSize: 11, fontWeight: 700, color: levelingUp === s.id ? C.textMuted : "#fff", boxShadow: levelingUp === s.id ? "none" : "0 2px 10px rgba(242,147,43,0.3)", transition: "all .2s" }}>
                {levelingUp === s.id ? "⏳ Leveling…" : "⬆️ Level Up"}
              </button>
            </div>
          </div>
        ))}
      </div>}
      {page === "sessions" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, color: C.text }}>Sessions</h1></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16, marginBottom: 22 }}>
          <Card><CardHead title="Add Session" /><CardBody>
            <FormRow><FInput label="Subject" value={sForm.subject} onChange={e => setSForm(f => ({ ...f, subject: e.target.value }))} /><FInput label="Level" value={sForm.level} onChange={e => setSForm(f => ({ ...f, level: e.target.value }))} /></FormRow>
            <FormRow><FInput label="Date" type="date" value={sForm.date} onChange={e => setSForm(f => ({ ...f, date: e.target.value }))} /><FInput label="Time" type="time" value={sForm.time} onChange={e => setSForm(f => ({ ...f, time: e.target.value }))} /></FormRow>
            <FormRow><FInput label="Cohort" optional value={sForm.cohort} onChange={e => setSForm(f => ({ ...f, cohort: e.target.value }))} /><FInput label="Room" optional value={sForm.room} onChange={e => setSForm(f => ({ ...f, room: e.target.value }))} /></FormRow>
            <Btn variant="primary" onClick={saveSession} style={{ borderRadius: 9 }}>Add Session</Btn>
            {sSaved && <div style={{ marginTop: 10, background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.25)", borderRadius: 8, padding: "9px 14px", fontSize: 12, color: "#4ade80" }}>✓ Session added!</div>}
          </CardBody></Card>
          <Card><CardHead title="Upcoming Sessions" /><CardBody style={{ padding: "10px 14px", maxHeight: 340, overflowY: "auto" }}>{sessions.length === 0 ? <div style={{ textAlign: "center", color: C.textMuted, fontSize: 13, padding: "20px 0" }}>No sessions yet.</div> : sessions.map(s => (<div key={s.id} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}><div style={{ fontSize: 11, fontWeight: 800, color: C.orange, minWidth: 70 }}>{s.session_date}</div><div><div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{s.subject} · Lvl {s.level}</div><div style={{ fontSize: 10, color: C.textMuted }}>{s.start_time} {s.cohort ? `· ${s.cohort}` : ""}</div></div></div>))}</CardBody></Card>
        </div>
      </div>}
      {page === "grades" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, color: C.text }}>Grade Entry</h1></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
          <Card><CardHead title="Enter Grade" /><CardBody>
            <FSelect label="Student" value={gForm.studentId} onChange={e => setGForm(f => ({ ...f, studentId: e.target.value }))} options={[{ value: "", label: "Select student…" }, ...students.map(s => ({ value: s.id, label: s.full_name || s.email?.split("@")[0] }))]} />
            <FormRow><FInput label="Subject" value={gForm.subject} onChange={e => setGForm(f => ({ ...f, subject: e.target.value }))} /><FInput label="Score (%)" type="number" placeholder="0–100" value={gForm.score} onChange={e => setGForm(f => ({ ...f, score: e.target.value }))} /></FormRow>
            <FInput label="Assessment Name" placeholder="e.g. Smart Car Final" value={gForm.name} onChange={e => setGForm(f => ({ ...f, name: e.target.value }))} />
            <div style={{ marginBottom: 14 }}><label style={{ display: "block", fontSize: 10, fontWeight: 700, color: C.textMid, marginBottom: 6, letterSpacing: 1.5, textTransform: "uppercase" }}>Notes <span style={{ fontWeight: 400, color: C.textMuted }}>(optional)</span></label><textarea placeholder="Feedback for student & parent…" rows={3} value={gForm.notes} onChange={e => setGForm(f => ({ ...f, notes: e.target.value }))} style={{ width: "100%", padding: "12px 14px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontFamily: "'Montserrat',sans-serif", fontSize: 13, resize: "vertical", background: C.bgSurface, color: C.text }} /></div>
            {gErr && <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 8, padding: "9px 14px", fontSize: 12, color: "#f87171", marginBottom: 10 }}>{gErr}</div>}
            <Btn variant="primary" onClick={saveGrade} style={{ borderRadius: 9 }}>Save Grade</Btn>
            {gSaved && <div style={{ marginTop: 10, background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.25)", borderRadius: 8, padding: "9px 14px", fontSize: 12, color: "#4ade80" }}>✓ Grade saved! Student notified & XP awarded.</div>}
          </CardBody></Card>
          <Card><CardHead title="Recent Grades" /><CardBody style={{ padding: "10px 0", maxHeight: 420, overflowY: "auto" }}>{grades.map(g => (<div key={g.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px", borderBottom: `1px solid ${C.border}` }}><div><div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{g.profiles?.full_name || "Student"}</div><div style={{ fontSize: 10, color: C.textMuted }}>{g.assessment_name} · {g.subject}</div></div><div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ fontSize: 15, fontWeight: 800, color: g.score >= 80 ? "#4ade80" : g.score >= 60 ? C.orangeLight : "#f87171" }}>{g.score}%</div><div style={{ fontSize: 10, color: C.textMuted }}>{new Date(g.graded_at).toLocaleDateString()}</div></div></div>))}{grades.length === 0 && <div style={{ textAlign: "center", color: C.textMuted, fontSize: 13, padding: "20px 0" }}>No grades yet.</div>}</CardBody></Card>
        </div>
      </div>}
      {page === "notes" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, color: C.text }}>Student Notes</h1><p style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>Add and view private notes & comments about each student</p></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16, marginBottom: 22 }}>
          <Card><CardHead title="Add Note" /><CardBody>
            <FSelect label="Student" value={noteInput.studentId} onChange={e => setNoteInput(p => ({ ...p, studentId: e.target.value }))} options={[{ value: "", label: "Select student…" }, ...students.map(s => ({ value: s.id, label: s.full_name || s.email?.split("@")[0] }))]} />
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: C.textMid, marginBottom: 6, letterSpacing: 1.5, textTransform: "uppercase" }}>Note / Comment</label>
              <textarea placeholder="Write a note about this student's progress, behavior, strengths or areas to improve…" rows={4} value={noteInput.text} onChange={e => setNoteInput(p => ({ ...p, text: e.target.value }))} style={{ width: "100%", padding: "12px 14px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontFamily: "'Montserrat',sans-serif", fontSize: 13, resize: "vertical", background: C.bgSurface, color: C.text, boxSizing: "border-box" }} />
            </div>
            <Btn variant="primary" onClick={saveNote} loading={noteSaving} style={{ borderRadius: 9 }}>Save Note</Btn>
          </CardBody></Card>
          <Card><CardHead title="Recent Notes" /><CardBody style={{ padding: "10px 14px", maxHeight: 380, overflowY: "auto" }}>
            {allNotes.length === 0 ? <div style={{ textAlign: "center", color: C.textMuted, fontSize: 13, padding: "30px 0" }}>No notes yet. Add your first note!</div> :
              allNotes.map(n => (
                <div key={n.id} style={{ padding: "12px 14px", background: C.bgElevated, borderRadius: 10, marginBottom: 10, border: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{n.profiles?.full_name || "Student"}</div>
                    <div style={{ fontSize: 10, color: C.textMuted }}>{new Date(n.created_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{ fontSize: 12, color: C.textMid, lineHeight: 1.6 }}>{n.note}</div>
                </div>
              ))
            }
          </CardBody></Card>
        </div>
        {students.length > 0 && (
          <Card><CardHead title="Notes by Student" /><CardBody style={{ padding: "10px 14px" }}>
            {students.map(s => (
              <div key={s.id} style={{ marginBottom: 14, padding: "14px", background: C.bgElevated, borderRadius: 12, border: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: notes[s.id]?.length ? 12 : 0 }}>
                  <Avatar ini={initials(s.full_name || "").toUpperCase()} bg={C.navyMid} size={32} src={s.avatar_url} radius={8} />
                  <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{s.full_name}</div><div style={{ fontSize: 10, color: C.textMuted }}>Level {s.current_level || 1} · {s.total_xp || 0} XP</div></div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: notes[s.id]?.length ? "rgba(242,147,43,.15)" : C.bgSurface, color: notes[s.id]?.length ? C.orange : C.textMuted }}>{notes[s.id]?.length || 0} notes</span>
                    <button onClick={() => setNoteInput({ studentId: s.id, text: "" })} style={{ padding: "5px 10px", borderRadius: 7, background: "transparent", border: `1px solid ${C.border}`, cursor: "pointer", fontFamily: "'Montserrat',sans-serif", fontSize: 10, fontWeight: 700, color: C.sky }}>+ Add</button>
                  </div>
                </div>
                {notes[s.id]?.slice(0, 2).map(n => (
                  <div key={n.id} style={{ padding: "8px 12px", background: C.bgCard, borderRadius: 8, marginBottom: 5, borderLeft: `3px solid ${C.navyMid}` }}>
                    <div style={{ fontSize: 11, color: C.textMid, lineHeight: 1.6 }}>{n.note}</div>
                    <div style={{ fontSize: 9, color: C.textMuted, marginTop: 3 }}>{new Date(n.created_at).toLocaleDateString()}</div>
                  </div>
                ))}
                {notes[s.id]?.length > 2 && <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4, paddingLeft: 2 }}>+ {notes[s.id].length - 2} more notes</div>}
              </div>
            ))}
          </CardBody></Card>
        )}
      </div>}
      {page === "messages" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, color: C.text }}>Messages</h1></div>
        <MsgResponsiveLayout msgTo={msgTo}>
          <Card><CardHead title="Contacts" /><CardBody style={{ padding: "10px 0" }}>{contacts.map(c => (<div key={c.id} onClick={() => setMsgTo(c.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer", background: msgTo === c.id ? C.bgSurface : "transparent", borderBottom: `1px solid ${C.border}` }}><div style={{ position: "relative", flexShrink: 0 }}><Avatar ini={initials(c.full_name || "").toUpperCase()} bg={c.role === "parent" ? C.navyMid : C.orange} size={36} src={c.avatar_url} /><span style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: presenceMap[c.id]?.online ? "#4ade80" : C.textMuted, border: `2px solid ${C.bgCard}` }} /></div><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.full_name}</div><div style={{ fontSize: 10, color: presenceMap[c.id]?.online ? "#4ade80" : C.textMuted, marginTop: 2 }}>{presenceMap[c.id]?.online ? "● Online" : presenceMap[c.id]?.last_seen ? formatLastSeen(presenceMap[c.id].last_seen) : c.role}</div></div></div>))}{contacts.length === 0 && <div style={{ textAlign: "center", color: C.textMuted, fontSize: 12, padding: "20px 14px" }}>No contacts yet.</div>}</CardBody></Card>
          <Card><CardBody>{msgTo ? <MsgThread fromId={profile.id} toId={msgTo} myProfile={profile} /> : <div style={{ textAlign: "center", color: C.textMuted, fontSize: 13, padding: "60px 0" }}>Select a contact to start a conversation</div>}</CardBody></Card>
        </MsgResponsiveLayout>
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

  /* ── THEME STATE ── */
  const [isDark, setIsDark] = useState(true);
  function toggleTheme() {
    setIsDark(d => {
      const next = !d;
      // Mutate C so all components read the new palette instantly
      Object.assign(C, next ? DARK : LIGHT);
      return next;
    });
  }
  // Keep C in sync on first render
  useEffect(() => { Object.assign(C, isDark ? DARK : LIGHT); }, [isDark]);

  useEffect(() => {
    if (loading) return;
    if (session && profile?.role) {
      setActiveProfile(profile);
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
    <ThemeContext.Provider value={{ isDark, toggle: toggleTheme }}>
      <div style={{ fontFamily: "'Montserrat', sans-serif", background: C.bg, minHeight: "100vh", transition: "background .3s" }}>
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
          @keyframes slideInLeft { from{transform:translateX(-100%)} to{transform:translateX(0)} }
          @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
          @keyframes borderGlow { 0%,100%{border-color:rgba(242,147,43,0.5)} 50%{border-color:rgba(146,185,214,0.5)} }
          @keyframes countUp { from{opacity:0;transform:scale(0.8)} to{opacity:1;transform:scale(1)} }
          .nexa-logo-text { font-family: 'Conthrax','Montserrat',sans-serif !important; }
          .neon-btn { position:relative; overflow:hidden; }
          .neon-btn::before { content:''; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent); transform:translateX(-100%); transition:0.6s; }
          .neon-btn:hover::before { transform:translateX(100%); }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(146,185,214,.18); border-radius: 10px; }
          input, select, textarea, button { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
          input:focus, select:focus, textarea:focus { outline: none; border-color: rgba(242,147,43,0.55) !important; box-shadow: 0 0 0 3px rgba(242,147,43,0.12) !important; }
          @media (max-width: 767px) { table { font-size: 11px; } table td, table th { padding: 8px 8px !important; } }
          @media (max-width: 480px) { table td:nth-child(4), table th:nth-child(4) { display: none; } }
          @media (max-width: 600px) { .price-card { min-width: 0 !important; } }
        `}</style>

        {screen === "landing" && <Landing goTo={goTo} />}
        {screen === "about" && <WhatIsNexaPage goTo={goTo} />}
        {screen === "subscribe" && <SubscriptionPage goTo={goTo} />}
        {screen === "pay" && <PayWithCardPage goTo={goTo} />}
        {screen === "role-pick" && <RolePicker mode={rolePickMode} onSelect={onRolePicked} />}
        {screen === "login" && <LoginPage role={selectedRole || "parent"} goTo={goTo} onAuthSuccess={onAuthSuccess} />}
        {screen === "signup" && <SignupPage role={selectedRole || "parent"} goTo={goTo} onAuthSuccess={onAuthSuccess} />}
        {screen === "complete-profile" && <SignupPage role={selectedRole || "student"} goTo={goTo} onAuthSuccess={onAuthSuccess} />}
        {screen === "student-home" && currentProfile && <HomeCard profile={currentProfile} onGoToDash={() => setScreen("student-dash")} onLogout={handleLogout} />}
        {screen === "parent-home" && currentProfile && <HomeCard profile={currentProfile} onGoToDash={() => setScreen("parent-dash")} onLogout={handleLogout} />}
        {screen === "instructor-home" && currentProfile && <HomeCard profile={currentProfile} onGoToDash={() => setScreen("instructor-dash")} onLogout={handleLogout} />}
        {screen === "student-dash" && currentProfile && <StudentDash profile={currentProfile} onHome={() => setScreen("student-home")} />}
        {screen === "parent-dash" && currentProfile && <ParentDash profile={currentProfile} onHome={() => setScreen("parent-home")} />}
        {screen === "instructor-dash" && currentProfile && <InstructorDash profile={currentProfile} onHome={() => setScreen("instructor-home")} />}
      </div>
    </ThemeContext.Provider>
  );
}