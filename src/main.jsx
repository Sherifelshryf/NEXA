import { useState, useRef } from "react";

const C = {
  navy: "#002b51", navyMid: "#23558a",
  orange: "#f2932b", orangeLight: "#fbb55a",
  sky: "#92b9d6", skyLight: "#d4e8f4",
  off: "#f6f8fc", border: "rgba(0,43,81,0.11)",
  text: "#0a1628", textMid: "#3a5068", textMuted: "#7a95ad",
};

const DEMO_STUDENTS = [
  { id: "STU-001", name: "Omar Ahmed", grade: "Year 2 · Level 5", initials: "OM", color: C.navy },
  { id: "STU-002", name: "Sara Ahmed", grade: "Year 1 · Level 2", initials: "SA", color: C.orange },
  { id: "STU-003", name: "Layla Hassan", grade: "Year 2 · Level 5", initials: "LH", color: "#f43f5e" },
];

/* ── tiny helpers ── */
const Avatar = ({ initials, bg, size = 44, radius = "50%", style = {} }) => (
  <div style={{ width: size, height: size, borderRadius: radius, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: size * 0.3, color: "#fff", flexShrink: 0, ...style }}>
    {initials}
  </div>
);

const Btn = ({ children, onClick, variant = "primary", block = false, style = {} }) => {
  const base = { fontFamily: "'Montserrat',sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer", border: "none", borderRadius: 50, padding: "11px 24px", transition: "all .2s", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, ...(block ? { width: "100%", borderRadius: 10, padding: "14px 20px" } : {}), ...style };
  const variants = {
    primary: { background: C.orange, color: "#fff" },
    navy: { background: C.navy, color: "#fff" },
    outline: { background: "transparent", border: "1.5px solid rgba(255,255,255,.4)", color: "#fff" },
    ghost: { background: "transparent", border: `1.5px solid ${C.border}`, color: C.navy },
    danger: { background: "#ef4444", color: "#fff" },
    light: { background: "rgba(255,255,255,.1)", border: "1.5px solid rgba(255,255,255,.2)", color: "#fff" },
  };
  return <button style={{ ...base, ...variants[variant] }} onClick={onClick}>{children}</button>;
};

const Tag = ({ children, color = "navy" }) => {
  const map = { navy: { bg: "rgba(0,43,81,.08)", color: C.navyMid }, orange: { bg: "rgba(242,147,43,.12)", color: "#c47a1e" }, sky: { bg: "rgba(146,185,214,.22)", color: "#2a6a9a" }, green: { bg: "rgba(34,197,94,.1)", color: "#16a34a" } };
  const s = map[color] || map.navy;
  return <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>{children}</span>;
};

const Input = ({ label, optional, type = "text", placeholder, value, onChange }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.textMid, marginBottom: 6 }}>{label}{optional && <span style={{ fontWeight: 400, color: C.textMuted }}> (optional)</span>}</label>}
    <input type={type} placeholder={placeholder} value={value} onChange={onChange}
      style={{ width: "100%", padding: "12px 14px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontFamily: "'Montserrat',sans-serif", fontSize: 13, color: C.text, outline: "none" }} />
  </div>
);

const Select = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.textMid, marginBottom: 6 }}>{label}</label>}
    <select value={value} onChange={onChange}
      style={{ width: "100%", padding: "12px 14px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontFamily: "'Montserrat',sans-serif", fontSize: 13, color: C.text, background: "#fff", cursor: "pointer" }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const FormRow = ({ children }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>
);

const Divider = ({ label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0", fontSize: 11, color: C.textMuted }}>
    <div style={{ flex: 1, height: 1, background: C.border }} />
    {label}
    <div style={{ flex: 1, height: 1, background: C.border }} />
  </div>
);

const Card = ({ children, style = {} }) => (
  <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 4px 24px rgba(0,43,81,.10)", border: `1px solid ${C.border}`, overflow: "hidden", ...style }}>{children}</div>
);
const CardHead = ({ title, right }) => (
  <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 800, color: C.text }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.orange, flexShrink: 0, display: "inline-block" }} />
      {title}
    </div>
    {right}
  </div>
);
const CardBody = ({ children, style = {} }) => <div style={{ padding: "18px 20px", ...style }}>{children}</div>;

const StatCard = ({ icon, value, label, trend, accent }) => (
  <div style={{ background: "#fff", borderRadius: 14, padding: 22, boxShadow: "0 4px 24px rgba(0,43,81,.10)", border: `1px solid ${C.border}`, position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent, borderRadius: "14px 14px 0 0" }} />
    <div style={{ width: 42, height: 42, borderRadius: 11, background: accent + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, marginBottom: 14 }}>{icon}</div>
    <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, marginBottom: 3 }}>{value}</div>
    <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>{label}</div>
    {trend && <span style={{ position: "absolute", top: 18, right: 18, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: "rgba(34,197,94,.1)", color: "#16a34a" }}>{trend}</span>}
  </div>
);

/* ══════════════════════════════════════════
   SCREENS
══════════════════════════════════════════ */

function Landing({ goTo }) {
  return (
    <div style={{ minHeight: "100vh", background: C.navy, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(242,147,43,.15) 0%, transparent 70%)", top: -200, right: -200, pointerEvents: "none" }} />
      {/* NAV */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "26px 60px", position: "relative", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: C.orange, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: "#fff", letterSpacing: 1 }}>NX</div>
          <div>
            <div style={{ fontSize: 21, fontWeight: 900, color: "#fff", letterSpacing: 3 }}>NEXA</div>
            <div style={{ fontSize: 8, color: C.orangeLight, letterSpacing: 3, textTransform: "uppercase" }}>AI · Robotics · Coding</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="outline" onClick={() => goTo("login")}>Log In</Btn>
          <Btn variant="primary" onClick={() => goTo("signup")}>Join NEXA</Btn>
        </div>
      </nav>
      {/* HERO */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "40px 40px 80px", position: "relative", zIndex: 2 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(242,147,43,.12)", border: "1px solid rgba(242,147,43,.25)", borderRadius: 50, padding: "6px 16px", fontSize: 10, fontWeight: 700, color: C.orangeLight, letterSpacing: 2, textTransform: "uppercase", marginBottom: 26 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.orange, display: "inline-block" }} />
          Cairo, Egypt — Est. 2025
        </div>
        <h1 style={{ fontSize: "clamp(44px,8vw,80px)", fontWeight: 900, color: "#fff", letterSpacing: 5, lineHeight: 1, marginBottom: 6 }}>NEXA<br /><span style={{ color: C.orange }}>TECH</span></h1>
        <div style={{ fontSize: 17, color: "rgba(255,255,255,.4)", letterSpacing: 5, textTransform: "uppercase", marginBottom: 22, fontWeight: 300 }}>School</div>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,.7)", fontWeight: 300, fontStyle: "italic", maxWidth: 480, lineHeight: 1.6, marginBottom: 44 }}>We don't teach technology…<br />We build creators.</p>
        <div style={{ display: "flex", gap: 14 }}>
          <Btn variant="primary" style={{ padding: "14px 34px", fontSize: 14, borderRadius: 50 }} onClick={() => goTo("signup")}>Create Account</Btn>
          <Btn variant="outline" style={{ padding: "14px 34px", fontSize: 14, borderRadius: 50 }} onClick={() => goTo("login")}>Sign In</Btn>
        </div>
        <div style={{ display: "flex", gap: 44, marginTop: 60, flexWrap: "wrap", justifyContent: "center" }}>
          {[["3", "Year Program"], ["432", "Total Hours"], ["4", "Systems"], ["6–17", "Age Range"]].map(([n, l], i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: C.orange, letterSpacing: 2 }}>{n}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)", letterSpacing: 2, textTransform: "uppercase", marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── ROLE PICKER ── */
function RolePicker({ mode, onSelect }) {
  const [role, setRole] = useState("parent");
  const roles = [
    { id: "parent", icon: "👨‍👩‍👧", title: "Parent", desc: "Manage & track your children" },
    { id: "student", icon: "🎓", title: "Student", desc: "Access your learning portal" },
    { id: "instructor", icon: "👨‍🏫", title: "Instructor", desc: "Manage your classes" },
  ];
  return (
    <div style={{ minHeight: "100vh", background: C.navy, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(242,147,43,.12) 0%, transparent 70%)", top: -150, right: -100, pointerEvents: "none" }} />
      <div style={{ background: "#fff", borderRadius: 20, padding: "40px 36px", maxWidth: 460, width: "90%", position: "relative", zIndex: 2 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 6, textAlign: "center" }}>
          {mode === "login" ? "How are you signing in?" : "Who are you?"}
        </div>
        <div style={{ fontSize: 13, color: C.textMuted, textAlign: "center", marginBottom: 28 }}>
          {mode === "login" ? "Select your account type to continue" : "Choose your role to create an account"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
          {roles.map(r => (
            <div key={r.id} onClick={() => setRole(r.id)}
              style={{ border: `2px solid ${role === r.id ? C.orange : C.border}`, background: role === r.id ? "rgba(242,147,43,.05)" : "#fff", borderRadius: 14, padding: "20px 12px", cursor: "pointer", textAlign: "center", transition: "all .2s" }}>
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

/* ── LOGIN ── */
function LoginPage({ role, goTo, onLogin }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const icons = { parent: "👨‍👩‍👧 Parent", student: "🎓 Student", instructor: "👨‍🏫 Instructor" };

  function doLogin() {
    if (!email || !pass) { setErr("Please enter your email and password."); return; }
    onLogin(role);
  }
  function quickFill(r) {
    setEmail(r + "@nexa.com"); setPass("demo1234"); setErr("");
  }

  return (
    <div style={{ minHeight: "100vh", background: C.off, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "38%", background: C.navy, clipPath: "ellipse(80% 100% at 50% 0%)" }} />
      <div style={{ background: "#fff", borderRadius: 22, padding: "40px 44px", width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,43,81,.16)", position: "relative", zIndex: 2 }}>
        {/* logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 11, justifyContent: "center", marginBottom: 6 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: C.navy, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#fff" }}>NX</div>
          <div><div style={{ fontSize: 22, fontWeight: 900, color: C.navy, letterSpacing: 3 }}>NEXA</div><div style={{ fontSize: 8, color: C.textMuted, letterSpacing: 2 }}>AI · ROBOTICS · CODING</div></div>
        </div>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Tag color="navy">{icons[role]}</Tag>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginTop: 10, marginBottom: 4 }}>Welcome Back</div>
          <div style={{ fontSize: 12, color: C.textMuted }}>Sign in to access your NEXA portal</div>
        </div>
        {err && <div style={{ background: "rgba(239,68,68,.07)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#dc2626", marginBottom: 14 }}>{err}</div>}
        <Input label="Email Address" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
        <Input label="Password" type="password" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} />
        <Btn variant="navy" block style={{ marginTop: 6 }} onClick={doLogin}>Sign In to Portal</Btn>
        <div style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: C.textMuted }}>
          Demo: {" "}
          <span style={{ color: C.navy, fontWeight: 700, cursor: "pointer" }} onClick={() => quickFill("parent")}>Parent</span> · {" "}
          <span style={{ color: C.navy, fontWeight: 700, cursor: "pointer" }} onClick={() => quickFill("student")}>Student</span> · {" "}
          <span style={{ color: C.navy, fontWeight: 700, cursor: "pointer" }} onClick={() => quickFill("instructor")}>Instructor</span>
        </div>
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

/* ── SIGNUP ── */
function SignupPage({ role, goTo, onSignup }) {
  const [form, setForm] = useState({});
  const [linked, setLinked] = useState([]);
  const [search, setSearch] = useState("");
  const [searchRes, setSearchRes] = useState([]);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const f = (k) => form[k] || "";
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  function doSearch() {
    const q = search.toLowerCase();
    if (!q) return;
    setSearchRes(DEMO_STUDENTS.filter(s => s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)));
  }
  function addChild(s) {
    if (linked.find(c => c.id === s.id)) return;
    setLinked(p => [...p, s]);
    setSearch(""); setSearchRes([]);
  }
  function removeChild(id) { setLinked(p => p.filter(c => c.id !== id)); }

  function submit() {
    setErr(""); setOk("");
    if (role === "parent") {
      if (!f("fname") || !f("lname") || !f("email") || !f("pass")) { setErr("Please fill in all required fields."); return; }
      if (f("pass").length < 8) { setErr("Password must be at least 8 characters."); return; }
    } else if (role === "student") {
      if (!f("fname") || !f("lname") || !f("email") || !f("pass") || !f("age")) { setErr("Please fill in all required fields."); return; }
      if (f("pass").length < 8) { setErr("Password must be at least 8 characters."); return; }
    } else {
      if (!f("fname") || !f("lname") || !f("email") || !f("pass") || !f("subject")) { setErr("Please fill in all required fields."); return; }
    }
    if (role === "instructor") {
      setOk("Application submitted! You'll be notified within 24 hours.");
      setTimeout(() => onSignup(role, form), 1800);
    } else {
      setOk("Account created! Redirecting…");
      setTimeout(() => onSignup(role, form), 1000);
    }
  }

  const icons = { parent: "👨‍👩‍👧 Parent", student: "🎓 Student", instructor: "👨‍🏫 Instructor" };

  return (
    <div style={{ minHeight: "100vh", background: C.off, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", padding: "40px 20px" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "38%", background: C.navy, clipPath: "ellipse(80% 100% at 50% 0%)" }} />
      <div style={{ background: "#fff", borderRadius: 22, padding: "36px 40px", width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,43,81,.16)", position: "relative", zIndex: 2, maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, justifyContent: "center", marginBottom: 6 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: C.navy, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#fff" }}>NX</div>
          <div><div style={{ fontSize: 22, fontWeight: 900, color: C.navy, letterSpacing: 3 }}>NEXA</div><div style={{ fontSize: 8, color: C.textMuted, letterSpacing: 2 }}>AI · ROBOTICS · CODING</div></div>
        </div>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <Tag color="navy">{icons[role]}</Tag>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.text, marginTop: 10, marginBottom: 4 }}>Create Your Account</div>
          <div style={{ fontSize: 12, color: C.textMuted }}>Join the NEXA community</div>
        </div>
        {err && <div style={{ background: "rgba(239,68,68,.07)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#dc2626", marginBottom: 14 }}>{err}</div>}
        {ok && <div style={{ background: "rgba(34,197,94,.07)", border: "1px solid rgba(34,197,94,.2)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#16a34a", marginBottom: 14 }}>{ok}</div>}

        {/* PARENT */}
        {role === "parent" && <>
          <FormRow><Input label="First Name" placeholder="Ahmed" value={f("fname")} onChange={set("fname")} /><Input label="Last Name" placeholder="Hassan" value={f("lname")} onChange={set("lname")} /></FormRow>
          <Input label="Email Address" type="email" placeholder="ahmed@email.com" value={f("email")} onChange={set("email")} />
          <FormRow><Input label="Phone" optional placeholder="+20 1xx xxx xxxx" value={f("phone")} onChange={set("phone")} /><Input label="Password" type="password" placeholder="Min 8 chars" value={f("pass")} onChange={set("pass")} /></FormRow>
          <Divider label="Link Your Children" />
          <div style={{ background: C.off, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 3 }}>🔗 Connect your child's account</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 10 }}>Search by student ID (e.g. STU-001) or name</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()} placeholder="Student ID or name…" style={{ flex: 1, padding: "10px 12px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontFamily: "'Montserrat',sans-serif", fontSize: 12, outline: "none" }} />
              <Btn variant="navy" style={{ padding: "10px 16px", borderRadius: 8, fontSize: 12 }} onClick={doSearch}>Find</Btn>
            </div>
            {searchRes.length > 0 && <div style={{ marginTop: 10 }}>
              {searchRes.map(s => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 9, padding: 10, marginBottom: 6 }}>
                  <Avatar initials={s.initials} bg={s.color} size={34} radius={8} />
                  <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700 }}>{s.name}</div><div style={{ fontSize: 10, color: C.textMuted }}>{s.id} · {s.grade}</div></div>
                  <Btn variant="navy" style={{ padding: "7px 14px", fontSize: 11, borderRadius: 7 }} onClick={() => addChild(s)}>Link +</Btn>
                </div>
              ))}
            </div>}
            {linked.length > 0 && <div style={{ marginTop: 8 }}>
              {linked.map(s => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 9, padding: "8px 10px", marginBottom: 6 }}>
                  <Avatar initials={s.initials} bg={s.color} size={30} radius={8} />
                  <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 700 }}>{s.name}</div><div style={{ fontSize: 10, color: C.textMuted }}>{s.grade}</div></div>
                  <button onClick={() => removeChild(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, fontSize: 16, padding: "0 4px" }}>✕</button>
                </div>
              ))}
            </div>}
          </div>
        </>}

        {/* STUDENT */}
        {role === "student" && <>
          <FormRow><Input label="First Name" placeholder="Omar" value={f("fname")} onChange={set("fname")} /><Input label="Last Name" placeholder="Ahmed" value={f("lname")} onChange={set("lname")} /></FormRow>
          <FormRow><Input label="Age" type="number" placeholder="e.g. 14" value={f("age")} onChange={set("age")} /><Input label="Phone" optional placeholder="+20 1xx…" value={f("phone")} onChange={set("phone")} /></FormRow>
          <Input label="Email Address" type="email" placeholder="student@email.com" value={f("email")} onChange={set("email")} />
          <Input label="Password" type="password" placeholder="Min 8 chars" value={f("pass")} onChange={set("pass")} />
          <Divider label="Parent / Guardian Info" />
          <FormRow><Input label="Parent Name" placeholder="Ahmed Hassan" value={f("parentName")} onChange={set("parentName")} /><Input label="Parent Phone" placeholder="+20 1xx…" value={f("parentPhone")} onChange={set("parentPhone")} /></FormRow>
          <Input label="Parent Email" type="email" placeholder="parent@email.com" value={f("parentEmail")} onChange={set("parentEmail")} />
        </>}

        {/* INSTRUCTOR */}
        {role === "instructor" && <>
          <FormRow><Input label="First Name" placeholder="Tarek" value={f("fname")} onChange={set("fname")} /><Input label="Last Name" placeholder="Mohamed" value={f("lname")} onChange={set("lname")} /></FormRow>
          <FormRow><Input label="Email Address" type="email" placeholder="instructor@nexa.com" value={f("email")} onChange={set("email")} /><Input label="Phone" optional placeholder="+20 1xx…" value={f("phone")} onChange={set("phone")} /></FormRow>
          <Select label="Subject / Specialization" value={f("subject") || ""} onChange={set("subject")}
            options={["", "Robotics", "Artificial Intelligence", "Programming", "Marketing Technology"]} />
          <Input label="Password" type="password" placeholder="Min 8 chars" value={f("pass")} onChange={set("pass")} />
          <div style={{ background: "rgba(242,147,43,.07)", border: "1px solid rgba(242,147,43,.2)", borderRadius: 9, padding: "11px 14px", fontSize: 11, color: "#9a6010", marginBottom: 14 }}>
            ⏳ Instructor accounts are reviewed by NEXA admin before activation (usually within 24 hours).
          </div>
        </>}

        <Btn variant="primary" block onClick={submit}>
          {role === "instructor" ? "Submit Application" : "Create Account →"}
        </Btn>
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

/* ── HOME PAGES ── */
function HomeCard({ avatar, bg, roleTag, name, meta, actions, onLogout }) {
  return (
    <div style={{ minHeight: "100vh", background: C.navy, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(242,147,43,.12) 0%, transparent 70%)", top: -150, right: -100, pointerEvents: "none" }} />
      <div style={{ background: "#fff", borderRadius: 24, padding: "44px 48px", maxWidth: 480, width: "90%", position: "relative", zIndex: 2, textAlign: "center" }}>
        <Avatar initials={avatar} bg={bg} size={80} radius={20} style={{ margin: "0 auto 16px", border: `3px solid rgba(255,255,255,.2)` }} />
        <div style={{ marginBottom: 6 }}><Tag color="navy">{roleTag}</Tag></div>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 4 }}>{name}</div>
        <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 28, lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: meta }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {actions}
          <button onClick={onLogout} style={{ background: "transparent", border: `1.5px solid ${C.border}`, borderRadius: 10, padding: 11, color: C.textMuted, fontFamily: "'Montserrat',sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Sign Out</button>
        </div>
      </div>
    </div>
  );
}

const DashBtn = ({ icon, title, sub, onClick }) => (
  <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 14, background: C.navy, color: "#fff", border: "none", borderRadius: 14, padding: "17px 20px", cursor: "pointer", width: "100%", fontFamily: "'Montserrat',sans-serif", textAlign: "left", transition: "all .2s" }}
    onMouseEnter={e => e.currentTarget.style.background = C.navyMid}
    onMouseLeave={e => e.currentTarget.style.background = C.navy}>
    <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(255,255,255,.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{icon}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 14, fontWeight: 700, display: "block" }}>{title}</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)", marginTop: 2 }}>{sub}</div>
    </div>
    <span style={{ fontSize: 18, color: "rgba(255,255,255,.3)" }}>→</span>
  </button>
);

/* ── SIDEBAR + SHELL ── */
function Shell({ color = C.navy, sidebarItems, user, onHome, pageTitle, topRight, children }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* sidebar */}
      <div style={{ width: 252, minHeight: "100vh", background: color, display: "flex", flexDirection: "column", padding: "22px 0", position: "fixed", top: 0, left: 0, zIndex: 100 }}>
        <div style={{ padding: "0 20px 22px", borderBottom: "1px solid rgba(255,255,255,.07)", marginBottom: 14, display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: C.orange, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "#fff" }}>NX</div>
          <div><div style={{ fontSize: 16, fontWeight: 900, color: "#fff", letterSpacing: 2 }}>NEXA</div><div style={{ fontSize: 8, color: "rgba(255,255,255,.3)", letterSpacing: 2 }}>{user.subtitle}</div></div>
        </div>
        {sidebarItems}
        <div style={{ marginTop: "auto", padding: "18px 20px", borderTop: "1px solid rgba(255,255,255,.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Avatar initials={user.initials} bg={user.avatarBg} size={34} />
            <div><div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{user.name}</div><div style={{ fontSize: 10, color: "rgba(255,255,255,.35)" }}>{user.role}</div></div>
            <button onClick={onHome} style={{ marginLeft: "auto", width: 28, height: 28, borderRadius: 7, background: "rgba(255,255,255,.07)", border: "none", cursor: "pointer", color: "rgba(255,255,255,.4)", fontSize: 14 }} title="Home">⌂</button>
          </div>
        </div>
      </div>
      {/* main */}
      <div style={{ marginLeft: 252, flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <div style={{ background: "#fff", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 50, boxShadow: "0 2px 12px rgba(0,43,81,.05)" }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>{pageTitle}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>{topRight}</div>
        </div>
        <div style={{ padding: "26px 28px", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, badge, active, onClick }) {
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 20px", cursor: "pointer", borderLeft: `3px solid ${active ? C.orange : "transparent"}`, background: active ? "rgba(242,147,43,.1)" : "transparent", color: active ? "#fff" : "rgba(255,255,255,.5)", fontSize: 12, fontWeight: 600, transition: "all .15s" }}>
      <span style={{ width: 17, textAlign: "center", fontSize: 15 }}>{icon}</span>
      {label}
      {badge && <span style={{ marginLeft: "auto", background: C.orange, color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 20 }}>{badge}</span>}
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 9, color: "rgba(255,255,255,.25)", letterSpacing: 3, textTransform: "uppercase", padding: "14px 20px 7px", fontWeight: 700 }}>{children}</div>;
}

/* ── MESSAGING ── */
function MsgThread({ messages, setMessages, myInitials, myColor }) {
  const [input, setInput] = useState("");
  const ref = useRef(null);
  function send() {
    if (!input.trim()) return;
    setMessages(p => [...p, { from: "me", text: input, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    setInput("");
    setTimeout(() => ref.current && (ref.current.scrollTop = ref.current.scrollHeight), 50);
  }
  return (
    <div>
      <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: 360, overflowY: "auto", padding: 4, marginBottom: 14 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", gap: 9, maxWidth: "80%", alignSelf: m.from === "me" ? "flex-end" : "flex-start", flexDirection: m.from === "me" ? "row-reverse" : "row" }}>
            <Avatar initials={m.from === "me" ? myInitials : m.initials} bg={m.from === "me" ? myColor : C.navy} size={30} />
            <div>
              <div style={{ padding: "9px 13px", borderRadius: 13, fontSize: 12, lineHeight: 1.5, background: m.from === "me" ? C.navy : "#fff", color: m.from === "me" ? "#fff" : C.text, border: m.from === "me" ? "none" : `1px solid ${C.border}`, borderTopLeftRadius: m.from === "me" ? 13 : 3, borderTopRightRadius: m.from === "me" ? 3 : 13 }}>{m.text}</div>
              <div style={{ fontSize: 9, color: C.textMuted, marginTop: 3, textAlign: m.from === "me" ? "right" : "left" }}>{m.time}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Type a message…" style={{ flex: 1, padding: "10px 14px", border: `1.5px solid ${C.border}`, borderRadius: 50, fontFamily: "'Montserrat',sans-serif", fontSize: 12, outline: "none" }} />
        <button onClick={send} style={{ width: 40, height: 40, borderRadius: "50%", background: C.navy, border: "none", cursor: "pointer", color: "#fff", fontSize: 16 }}>➤</button>
      </div>
    </div>
  );
}

/* ── PARENT DASHBOARD ── */
function ParentDash({ onHome, user }) {
  const [page, setPage] = useState("overview");
  const [msgs, setMsgs] = useState([
    { from: "them", initials: "TM", text: "Omar did an excellent job on his Smart Car project! 95%. Great sensor calibration work 🤖", time: "2:30 PM" },
    { from: "me", text: "Thank you Eng. Tarek! Is there anything to work on before next session?", time: "3:45 PM" },
    { from: "them", initials: "TM", text: "Practice Python loops — we'll use them in autonomous navigation. Otherwise he's great! 🚀", time: "4:00 PM" },
  ]);

  const titles = { overview: "Dashboard Overview", children: "My Children", grades: "Grades & Progress", schedule: "Schedule", attendance: "Attendance", messages: "Messages", payments: "Payments", "omar-profile": "Omar Ahmed — Profile", "sara-profile": "Sara Ahmed — Profile" };

  const nav = [
    { section: "Overview" },
    { icon: "🏠", label: "Dashboard", id: "overview" },
    { icon: "👶", label: "My Children", id: "children", badge: "2" },
    { section: "Academics" },
    { icon: "📊", label: "Grades & Progress", id: "grades" },
    { icon: "📅", label: "Schedule", id: "schedule" },
    { icon: "✅", label: "Attendance", id: "attendance" },
    { section: "Communication" },
    { icon: "💬", label: "Messages", id: "messages", badge: "3" },
    { icon: "💳", label: "Payments", id: "payments" },
  ];

  const sidebarItems = nav.map((n, i) =>
    n.section ? <SectionLabel key={i}>{n.section}</SectionLabel> :
      <NavItem key={i} icon={n.icon} label={n.label} badge={n.badge} active={page === n.id} onClick={() => setPage(n.id)} />
  );

  return (
    <Shell color={C.navy} sidebarItems={sidebarItems}
      user={{ initials: user.initials || "AH", avatarBg: C.navy, name: user.name || "Ahmed Hassan", role: "Parent Account", subtitle: "PARENT PORTAL" }}
      onHome={onHome} pageTitle={titles[page] || "Dashboard"}
      topRight={<><div style={{ width: 36, height: 36, borderRadius: 9, background: C.off, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, position: "relative", cursor: "pointer" }}>🔔<span style={{ position: "absolute", top: 7, right: 7, width: 7, height: 7, background: C.orange, borderRadius: "50%", border: "2px solid #fff" }} /></div><span style={{ fontSize: 12, color: C.textMuted }}>Thu, Apr 16 2026</span></>}
    >
      {/* OVERVIEW */}
      {page === "overview" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800 }}>Good morning, {(user.name || "Ahmed").split(" ")[0]} 👋</h1><p style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>Here's how your children are doing this week</p></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 18, marginBottom: 24 }}>
          <StatCard icon="🎓" value="2" label="Enrolled Children" accent={C.orange} trend="Active" />
          <StatCard icon="📈" value="87%" label="Average Score" accent={C.navy} trend="↑4%" />
          <StatCard icon="📅" value="96%" label="Attendance Rate" accent={C.sky} trend="↑1%" />
          <StatCard icon="🏆" value="12" label="Badges Earned" accent="#22c55e" trend="+3" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 20 }}>
          <Card>
            <CardHead title="My Children" right={<Btn variant="ghost" style={{ padding: "5px 12px", fontSize: 11 }} onClick={() => setPage("children")}>View All</Btn>} />
            <CardBody>
              {[{ n: "Omar Ahmed", m: "Age 14 · Year 2 · Level 5", s: "89%", av: "OM", bg: C.navy, p: "omar-profile" }, { n: "Sara Ahmed", m: "Age 11 · Year 1 · Level 2", s: "84%", av: "SA", bg: C.orange, p: "sara-profile" }].map(c => (
                <div key={c.n} onClick={() => setPage(c.p)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 6px", borderBottom: `1px solid ${C.border}`, cursor: "pointer", borderRadius: 8, margin: "0 -6px" }}>
                  <Avatar initials={c.av} bg={c.bg} size={42} radius={11} />
                  <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700 }}>{c.n}</div><div style={{ fontSize: 11, color: C.textMuted }}>{c.m}</div></div>
                  <div style={{ textAlign: "right" }}><div style={{ fontSize: 19, fontWeight: 800, color: C.navy }}>{c.s}</div><div style={{ width: 70, height: 5, background: C.off, borderRadius: 50, marginTop: 4 }}><div style={{ height: "100%", width: c.s, background: c.bg, borderRadius: 50 }} /></div></div>
                </div>
              ))}
            </CardBody>
          </Card>
          <Card>
            <CardHead title="Recent Activity" />
            <CardBody>
              {[["✅", "rgba(34,197,94,.09)", "Omar submitted Robotics project — 92%", "2 hours ago"], ["📩", "rgba(242,147,43,.1)", "New message from Eng. Tarek", "Yesterday · Robotics"], ["🏆", "rgba(0,43,81,.07)", "Sara earned \"Code Master\" badge", "2 days ago"], ["📅", "rgba(146,185,214,.18)", "Next session: Tomorrow 4 PM", "Omar · Robotics"]].map(([ic, bg, t, sub], i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "11px 0", borderBottom: i < 3 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{ic}</div>
                  <div><div style={{ fontSize: 12, fontWeight: 700 }}>{t}</div><div style={{ fontSize: 10, color: C.textMuted }}>{sub}</div></div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>}

      {/* CHILDREN */}
      {page === "children" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800 }}>My Children</h1></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          {[{ n: "Omar Ahmed", m: "14 yrs · Male", av: "OM", bg: C.navy, hdr: `linear-gradient(135deg,${C.navy},${C.navyMid})`, yr: "Year 2 · Level 5", stats: ["89%", "96%", "8"], p: "omar-profile" },
          { n: "Sara Ahmed", m: "11 yrs · Female", av: "SA", bg: C.orange, hdr: `linear-gradient(135deg,#c47a1e,${C.orange})`, yr: "Year 1 · Level 2", stats: ["84%", "98%", "4"], p: "sara-profile" }].map(c => (
            <Card key={c.n} style={{ cursor: "pointer" }}>
              <div onClick={() => setPage(c.p)} style={{ background: c.hdr, padding: 22, display: "flex", alignItems: "center", gap: 14 }}>
                <Avatar initials={c.av} bg="rgba(255,255,255,.15)" size={58} radius={14} style={{ border: "2.5px solid rgba(255,255,255,.2)" }} />
                <div><div style={{ fontSize: 19, fontWeight: 800, color: "#fff" }}>{c.n}</div><div style={{ fontSize: 11, color: "rgba(255,255,255,.5)" }}>{c.m}</div><Tag color="navy" style={{ marginTop: 6 }}>{c.yr}</Tag></div>
              </div>
              <CardBody>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 12 }}>
                  {["Avg Grade", "Attendance", "Badges"].map((l, i) => (
                    <div key={l} style={{ textAlign: "center", padding: 10, background: C.off, borderRadius: 9 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: i === 2 ? C.orange : C.navy }}>{c.stats[i]}</div>
                      <div style={{ fontSize: 9, color: C.textMuted }}>{l}</div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>}

      {/* GRADES */}
      {page === "grades" && <GradesPage />}

      {/* SCHEDULE */}
      {page === "schedule" && <SchedulePage />}

      {/* ATTENDANCE */}
      {page === "attendance" && <AttendancePage />}

      {/* MESSAGES */}
      {page === "messages" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800 }}>Messages</h1></div>
        <Card><CardHead title="Eng. Tarek Mohamed · Robotics" right={<Tag color="green">Online</Tag>} />
          <CardBody><MsgThread messages={msgs} setMessages={setMsgs} myInitials="AH" myColor={C.orange} /></CardBody>
        </Card>
      </div>}

      {/* PAYMENTS */}
      {page === "payments" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800 }}>Payments</h1></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18, marginBottom: 24 }}>
          <StatCard icon="💰" value="25K" label="EGP · Omar Annual" accent={C.orange} trend="Paid" />
          <StatCard icon="💰" value="30K" label="EGP · Sara Annual" accent={C.navy} trend="Paid" />
          <StatCard icon="📆" value="Jul 26" label="Next Payment Due" accent="#22c55e" />
        </div>
        <Card><CardHead title="Payment History" />
          <CardBody style={{ padding: "10px 14px" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr>{["Date", "Description", "Amount", "Status"].map(h => <th key={h} style={{ textAlign: "left", fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1, textTransform: "uppercase", padding: "11px 14px", background: C.off }}>{h}</th>)}</tr></thead><tbody>{[["Jan 1, 2026", "Omar — Year 2 Annual", "25,000 EGP"], ["Jan 1, 2026", "Sara — Year 1 Annual", "30,000 EGP"]].map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={{ padding: "13px 14px", fontSize: 12, borderBottom: `1px solid ${C.border}` }}>{c}</td>)}<td style={{ padding: "13px 14px", borderBottom: `1px solid ${C.border}` }}><span style={{ background: "rgba(34,197,94,.1)", color: "#16a34a", fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20 }}>Paid</span></td></tr>)}</tbody></table></CardBody>
        </Card>
      </div>}

      {/* STUDENT PROFILES */}
      {page === "omar-profile" && <StudentProfile name="Omar Ahmed" initials="OM" avatarBg={C.navy} age={14} year="Year 2" level="Level 5" avg="89%" attend="96%" badges={8} xp={65} onBack={() => setPage("children")} />}
      {page === "sara-profile" && <StudentProfile name="Sara Ahmed" initials="SA" avatarBg={C.orange} age={11} year="Year 1" level="Level 2" avg="84%" attend="98%" badges={4} xp={40} onBack={() => setPage("children")} hdrColor={`linear-gradient(135deg,#c47a1e,${C.orange})`} />}
    </Shell>
  );
}

function GradesPage() {
  const [tab, setTab] = useState("omar");
  return <div>
    <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800 }}>Grades & Progress</h1></div>
    <div style={{ display: "flex", gap: 3, background: C.off, padding: 4, borderRadius: 11, marginBottom: 20, width: "fit-content" }}>
      {["omar", "sara"].map(t => <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 20px", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", background: tab === t ? "#fff" : "transparent", color: tab === t ? C.navy : C.textMuted, fontFamily: "'Montserrat',sans-serif", boxShadow: tab === t ? "0 2px 8px rgba(0,43,81,.09)" : "none" }}>{t === "omar" ? "Omar" : "Sara"}</button>)}
    </div>
    {tab === "omar" && <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18, marginBottom: 20 }}>
        {[["🤖", "Robotics", "Level 5", "92%", "A", C.navy], ["🧠", "AI", "Level 5", "88%", "B+", C.navyMid], ["💻", "Programming", "Level 5", "87%", "B+", C.orange]].map(([ic, n, lv, g, gr, col]) => (
          <div key={n} style={{ background: "#fff", borderRadius: 14, padding: 22, boxShadow: "0 4px 24px rgba(0,43,81,.10)", border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 14 }}><div style={{ width: 42, height: 42, borderRadius: 11, background: col + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{ic}</div><div><div style={{ fontSize: 13, fontWeight: 800 }}>{n}</div><div style={{ fontSize: 10, color: C.textMuted }}>{lv}</div></div></div>
            <div style={{ fontSize: 38, fontWeight: 800, color: col, lineHeight: 1, marginBottom: 3 }}>{g}</div>
            <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 10 }}>{gr}</div>
            <div style={{ background: C.off, borderRadius: 50, height: 7, overflow: "hidden" }}><div style={{ height: "100%", width: g, background: col, borderRadius: 50 }} /></div>
          </div>
        ))}
      </div>
    </div>}
    {tab === "sara" && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
      {[["💻", "Programming", "Level 2", "86%", "B+", C.orange], ["🧠", "AI Intro", "Level 2", "82%", "B", C.navyMid]].map(([ic, n, lv, g, gr, col]) => (
        <div key={n} style={{ background: "#fff", borderRadius: 14, padding: 22, boxShadow: "0 4px 24px rgba(0,43,81,.10)", border: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 14 }}><div style={{ width: 42, height: 42, borderRadius: 11, background: col + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{ic}</div><div><div style={{ fontSize: 13, fontWeight: 800 }}>{n}</div><div style={{ fontSize: 10, color: C.textMuted }}>{lv}</div></div></div>
          <div style={{ fontSize: 38, fontWeight: 800, color: col, lineHeight: 1, marginBottom: 3 }}>{g}</div>
          <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 10 }}>{gr}</div>
          <div style={{ background: C.off, borderRadius: 50, height: 7, overflow: "hidden" }}><div style={{ height: "100%", width: g, background: col, borderRadius: 50 }} /></div>
        </div>
      ))}
    </div>}
  </div>;
}

function SchedulePage() {
  return <div>
    <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800 }}>Schedule</h1></div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
      {[["Omar", [["Thu Apr 17", "4:00 PM", "Robotics", "Eng. Tarek", true], ["Sat Apr 19", "11:00 AM", "AI & ML", "Dr. Youssef", false], ["Tue Apr 22", "5:00 PM", "Programming", "Ms. Nour", false]]],
        ["Sara", [["Fri Apr 18", "3:00 PM", "Coding (Scratch)", "Ms. Dina", true], ["Sun Apr 20", "2:00 PM", "AI Intro", "Ms. Dina", false]]]].map(([name, sessions]) => (
          <Card key={name}><CardHead title={`${name} — This Week`} />
            <CardBody>{sessions.map(([day, time, subj, teacher, hi]) => (
              <div key={day} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.navy, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>{day}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", background: hi ? "rgba(242,147,43,.07)" : C.off, borderRadius: 9, borderLeft: `3px solid ${hi ? C.orange : "transparent"}` }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: C.textMid, minWidth: 70 }}>{time}</div>
                  <div><div style={{ fontSize: 12, fontWeight: 700 }}>{subj}</div><div style={{ fontSize: 10, color: C.textMuted }}>{teacher}</div></div>
                </div>
              </div>
            ))}</CardBody>
          </Card>
        ))}
    </div>
  </div>;
}

function AttendancePage() {
  return <div>
    <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800 }}>Attendance</h1></div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 24 }}>
      <StatCard icon="📅" value="28" label="Total Sessions" accent={C.orange} />
      <StatCard icon="✅" value="27" label="Present" accent="#22c55e" />
      <StatCard icon="⏰" value="1" label="Late" accent={C.sky} />
      <StatCard icon="📊" value="96%" label="Rate" accent={C.navy} />
    </div>
  </div>;
}

function StudentProfile({ name, initials, avatarBg, age, year, level, avg, attend, badges, xp, onBack, hdrColor }) {
  const [tab, setTab] = useState("overview");
  const hdr = hdrColor || `linear-gradient(135deg,${C.navy},${C.navyMid})`;
  return <div>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
      <Btn variant="ghost" style={{ padding: "7px 14px", fontSize: 11, borderRadius: 9 }} onClick={onBack}>← Back</Btn>
      <span style={{ fontSize: 12, color: C.textMuted }}>Children / {name}</span>
    </div>
    <div style={{ background: hdr, borderRadius: 14, padding: 28, display: "flex", alignItems: "center", gap: 22, marginBottom: 22 }}>
      <Avatar initials={initials} bg="rgba(255,255,255,.15)" size={74} radius={18} style={{ border: "2.5px solid rgba(255,255,255,.18)" }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 3 }}>{name}</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", display: "flex", gap: 14 }}><span>🎂 Age {age}</span><span>📍 {year} · {level}</span></div>
        <div style={{ background: "rgba(255,255,255,.1)", borderRadius: 50, height: 6, maxWidth: 260, marginTop: 10, overflow: "hidden" }}><div style={{ height: "100%", width: `${xp}%`, background: `linear-gradient(90deg,${C.orange},${C.orangeLight})`, borderRadius: 50 }} /></div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)", marginTop: 4 }}>{level} · {xp}% to next level</div>
      </div>
      <div style={{ display: "flex", gap: 14 }}>
        {[[avg, "Avg"], [attend, "Attend."], [String(badges), "Badges"]].map(([v, l]) => (
          <div key={l} style={{ textAlign: "center", background: "rgba(255,255,255,.09)", borderRadius: 11, padding: "12px 18px" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.orange }}>{v}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,.4)", marginTop: 2, textTransform: "uppercase", letterSpacing: 1 }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
    <div style={{ display: "flex", gap: 3, background: C.off, padding: 4, borderRadius: 11, marginBottom: 20, width: "fit-content" }}>
      {["overview", "grades", "achievements"].map(t => <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 18px", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", background: tab === t ? "#fff" : "transparent", color: tab === t ? C.navy : C.textMuted, fontFamily: "'Montserrat',sans-serif" }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>)}
    </div>
    {tab === "overview" && <GradesPage />}
    {tab === "grades" && <Card><CardHead title="Assessment History" /><CardBody style={{ padding: "10px 14px" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr>{["Assessment", "Subject", "Date", "Score"].map(h => <th key={h} style={{ textAlign: "left", fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1, textTransform: "uppercase", padding: "11px 14px", background: C.off }}>{h}</th>)}</tr></thead><tbody>{[["Smart Car Final", "Robotics", "Apr 10", "95%"], ["ML Basics Quiz", "AI", "Apr 7", "86%"], ["Web App Project", "Coding", "Apr 3", "90%"]].map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={{ padding: "13px 14px", fontSize: 12, borderBottom: `1px solid ${C.border}` }}>{c}</td>)}</tr>)}</tbody></table></CardBody></Card>}
    {tab === "achievements" && <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 11 }}>{["🤖 Robot Builder", "🧠 AI Explorer", "💻 Code Master", "🏆 Top Student", "🔥 7-Day Streak", "⚡ Fast Learner", "🚀 Level 6", "🌟 All-Star"].map((a, i) => <div key={a} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 11, padding: "14px 10px", textAlign: "center", opacity: i > 5 ? 0.35 : 1, filter: i > 5 ? "grayscale(1)" : "none" }}><div style={{ fontSize: 26, marginBottom: 7 }}>{a.split(" ")[0]}</div><div style={{ fontSize: 10, fontWeight: 700 }}>{a.split(" ").slice(1).join(" ")}</div></div>)}</div>}
  </div>;
}

/* ── STUDENT DASHBOARD ── */
function StudentDash({ onHome, user }) {
  const [page, setPage] = useState("overview");
  const [msgs, setMsgs] = useState([
    { from: "them", initials: "TM", text: "Omar, great work on the Smart Car! Ready for autonomous navigation? 🚗", time: "2:30 PM" },
    { from: "me", text: "Yes! Already reading about PID controllers. Can't wait 🔥", time: "5:00 PM" },
  ]);
  const nav = [{ section: "My Learning" }, { icon: "🏠", label: "Dashboard", id: "overview" }, { icon: "📚", label: "My Subjects", id: "subjects" }, { icon: "📅", label: "Schedule", id: "schedule" }, { icon: "🏆", label: "Achievements", id: "achievements" }, { section: "Communication" }, { icon: "💬", label: "Messages", id: "messages" }];
  return (
    <Shell color={C.navy} sidebarItems={nav.map((n, i) => n.section ? <SectionLabel key={i}>{n.section}</SectionLabel> : <NavItem key={i} icon={n.icon} label={n.label} active={page === n.id} onClick={() => setPage(n.id)} />)}
      user={{ initials: user.initials || "OM", avatarBg: C.orange, name: user.name || "Omar Ahmed", role: "Year 2 · Level 5", subtitle: "STUDENT PORTAL" }}
      onHome={onHome} pageTitle="My Dashboard"
      topRight={<><div style={{ width: 36, height: 36, borderRadius: 9, background: C.off, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, position: "relative" }}>🔔<span style={{ position: "absolute", top: 7, right: 7, width: 7, height: 7, background: C.orange, borderRadius: "50%", border: "2px solid #fff" }} /></div><span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: "rgba(242,147,43,.12)", color: "#c47a1e" }}>🚀 Level 5</span></>}
    >
      {page === "overview" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800 }}>Hey {(user.name || "Omar").split(" ")[0]}! 👋</h1><p style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>65% through Level 5 — keep going!</p></div>
        <Card style={{ marginBottom: 24, background: `linear-gradient(135deg,${C.navy},${C.navyMid})`, border: "none" }}>
          <CardBody style={{ padding: "24px 28px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
              <div><div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 3 }}>Level 5 XP Progress</div><div style={{ fontSize: 34, fontWeight: 800, color: C.orange }}>65%</div><div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", marginTop: 2 }}>1,300 / 2,000 XP</div></div>
              <div style={{ flex: 1, maxWidth: 380 }}><div style={{ background: "rgba(255,255,255,.1)", borderRadius: 50, height: 10, overflow: "hidden" }}><div style={{ height: "100%", width: "65%", background: `linear-gradient(90deg,${C.orange},${C.orangeLight})`, borderRadius: 50 }} /></div></div>
              <div style={{ textAlign: "center", background: "rgba(255,255,255,.08)", borderRadius: 11, padding: "14px 20px" }}><div style={{ fontSize: 26, fontWeight: 800, color: "#fff" }}>700</div><div style={{ fontSize: 9, color: "rgba(255,255,255,.35)", marginTop: 2, textTransform: "uppercase", letterSpacing: 1 }}>XP to Level 6</div></div>
            </div>
          </CardBody>
        </Card>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 18 }}>
          <StatCard icon="📊" value="89%" label="Overall Avg" accent={C.orange} />
          <StatCard icon="✅" value="96%" label="Attendance" accent={C.navy} />
          <StatCard icon="🏆" value="8" label="Badges" accent={C.sky} />
          <StatCard icon="🔥" value="7" label="Day Streak" accent="#22c55e" />
        </div>
      </div>}
      {page === "subjects" && <GradesPage />}
      {page === "schedule" && <SchedulePage />}
      {page === "achievements" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800 }}>Achievements</h1><p style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>8 of 12 badges earned</p></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 11 }}>
          {["🤖 Robot Builder", "🧠 AI Explorer", "💻 Code Master", "🏆 Top Student", "🔥 7-Day Streak", "⚡ Fast Learner", "🎯 First Project", "🌐 Web Creator", "🚀 Level 6", "🌟 All-Star", "👑 Champion", "💎 Diamond"].map((a, i) => (
            <div key={a} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 11, padding: "14px 10px", textAlign: "center", opacity: i > 7 ? 0.35 : 1, filter: i > 7 ? "grayscale(1)" : "none" }}>
              <div style={{ fontSize: 26, marginBottom: 7 }}>{a.split(" ")[0]}</div>
              <div style={{ fontSize: 10, fontWeight: 700 }}>{a.split(" ").slice(1).join(" ")}</div>
            </div>
          ))}
        </div>
      </div>}
      {page === "messages" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800 }}>Messages</h1></div>
        <Card><CardHead title="Eng. Tarek · Robotics" right={<Tag color="green">Online</Tag>} />
          <CardBody><MsgThread messages={msgs} setMessages={setMsgs} myInitials={user.initials || "OM"} myColor={C.orange} /></CardBody>
        </Card>
      </div>}
    </Shell>
  );
}

/* ── INSTRUCTOR DASHBOARD ── */
function InstructorDash({ onHome, user }) {
  const [page, setPage] = useState("overview");
  const [msgs, setMsgs] = useState([
    { from: "them", initials: "AH", text: "Thank you! Is there anything Omar should work on before next session?", time: "3:45 PM" },
    { from: "me", text: "Practice Python loops — we'll use them in autonomous navigation. He's doing great! 🚀", time: "4:00 PM" },
  ]);
  const [gradeSaved, setGradeSaved] = useState(false);
  const nav = [{ section: "Teaching" }, { icon: "🏠", label: "Overview", id: "overview" }, { icon: "👥", label: "My Students", id: "students" }, { icon: "📅", label: "Sessions", id: "sessions" }, { icon: "📊", label: "Grade Entry", id: "grades" }, { section: "Communication" }, { icon: "💬", label: "Messages", id: "messages", badge: "2" }];
  const titles = { overview: "Instructor Overview", students: "My Students", sessions: "Sessions", grades: "Grade Entry", messages: "Messages" };
  return (
    <Shell color={C.navyMid} sidebarItems={nav.map((n, i) => n.section ? <SectionLabel key={i}>{n.section}</SectionLabel> : <NavItem key={i} icon={n.icon} label={n.label} badge={n.badge} active={page === n.id} onClick={() => setPage(n.id)} />)}
      user={{ initials: user.initials || "TM", avatarBg: C.navyMid, name: user.name || "Eng. Tarek Mohamed", role: "Robotics Instructor", subtitle: "INSTRUCTOR PORTAL" }}
      onHome={onHome} pageTitle={titles[page] || "Dashboard"}
      topRight={<><div style={{ width: 36, height: 36, borderRadius: 9, background: C.off, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, position: "relative" }}>🔔<span style={{ position: "absolute", top: 7, right: 7, width: 7, height: 7, background: C.orange, borderRadius: "50%", border: "2px solid #fff" }} /></div><span style={{ fontSize: 12, color: C.textMuted }}>Thu, Apr 16 2026</span></>}
    >
      {page === "overview" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800 }}>Welcome, {(user.name || "Eng. Tarek").split(" ")[0]} 👋</h1><p style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>Robotics · Level 4 &amp; 5 · 18 students</p></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 18, marginBottom: 24 }}>
          <StatCard icon="👥" value="18" label="Total Students" accent={C.navy} />
          <StatCard icon="📅" value="2" label="Sessions Today" accent={C.orange} />
          <StatCard icon="📊" value="87%" label="Class Avg" accent="#22c55e" trend="↑3%" />
          <StatCard icon="✅" value="94%" label="Attendance" accent={C.sky} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <Card><CardHead title="Today's Sessions" />
            <CardBody>{[["4:00 PM", "Robotics Level 5 — Cohort B", "Omar Ahmed, Layla Hassan, +4 more", true], ["6:00 PM", "Robotics Level 4 — Cohort A", "6 students", false]].map(([t, s, sub, hi]) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", background: hi ? "rgba(242,147,43,.07)" : C.off, borderRadius: 9, borderLeft: `3px solid ${hi ? C.orange : "transparent"}`, marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.textMid, minWidth: 65 }}>{t}</div>
                <div><div style={{ fontSize: 12, fontWeight: 700 }}>{s}</div><div style={{ fontSize: 10, color: C.textMuted }}>{sub}</div></div>
              </div>
            ))}</CardBody>
          </Card>
          <Card><CardHead title="Recent Activity" />
            <CardBody>{[["📝", "rgba(34,197,94,.09)", "Graded Omar's Smart Car — 95%", "2 hours ago"], ["💬", "rgba(242,147,43,.1)", "Message from Ahmed Hassan", "Yesterday"], ["📅", "rgba(0,43,81,.07)", "Session notes uploaded — Level 5", "Yesterday"]].map(([ic, bg, t, sub], i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "11px 0", borderBottom: i < 2 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{ic}</div>
                <div><div style={{ fontSize: 12, fontWeight: 700 }}>{t}</div><div style={{ fontSize: 10, color: C.textMuted }}>{sub}</div></div>
              </div>
            ))}</CardBody>
          </Card>
        </div>
      </div>}
      {page === "students" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800 }}>My Students</h1><p style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>Robotics · Level 4 &amp; 5</p></div>
        {[["Level 5 (9 students)", [["OM", C.navy, "Omar Ahmed", "Age 14 · 96% attendance", "92%"], ["LH", "#f43f5e", "Layla Hassan", "Age 15 · 100% attendance", "96%"], ["KM", C.sky, "Kareem Mostafa", "Age 14 · 88% attendance", "78%"], ["NS", "#6366f1", "Nour Salah", "Age 13 · 92% attendance", "85%"], ["YA", "#14b8a6", "Yassin Ali", "Age 15 · 96% attendance", "90%"]]],
          ["Level 4 (9 students)", [["FA", "#f43f5e", "Farida Atef", "Age 12 · 94% attendance", "88%"], ["AM", "#8b5cf6", "Adam Mahmoud", "Age 13 · 90% attendance", "82%"], ["HO", "#0ea5e9", "Hana Omar", "Age 12 · 100% attendance", "94%"]]]].map(([grp, students]) => (
            <div key={grp} style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.navy, marginBottom: 12 }}>{grp}</div>
              {students.map(([av, bg, n, m, g]) => (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 10, border: `1px solid ${C.border}`, marginBottom: 10, background: "#fff" }}>
                  <Avatar initials={av} bg={bg} size={40} radius={10} />
                  <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700 }}>{n}</div><div style={{ fontSize: 11, color: C.textMuted }}>{m}</div></div>
                  <div style={{ textAlign: "right" }}><div style={{ fontSize: 17, fontWeight: 800, color: C.navy }}>{g}</div><div style={{ fontSize: 9, color: C.textMuted }}>Robotics</div></div>
                </div>
              ))}
            </div>
          ))}
      </div>}
      {page === "sessions" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800 }}>Sessions</h1></div>
        <Card><CardHead title="This Week" />
          <CardBody>{[["Thursday Apr 17", "4:00 PM", "Robotics Level 5 — Autonomous Navigation", "Cohort B · Room A2 · 6 students", true], ["Thursday Apr 17", "6:00 PM", "Robotics Level 4 — Sensor Basics", "Cohort A · Room A2 · 6 students", true], ["Saturday Apr 19", "10:00 AM", "Robotics Level 5 — Lab", "Cohort B · Lab · 6 students", false], ["Tuesday Apr 22", "4:00 PM", "Robotics Level 4 — Motors & Gears", "Cohort A · Room A2", false]].map(([day, time, subj, sub, hi]) => (
            <div key={`${day}-${time}`} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.navy, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>{day}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", background: hi ? "rgba(242,147,43,.07)" : C.off, borderRadius: 9, borderLeft: `3px solid ${hi ? C.orange : "transparent"}` }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.textMid, minWidth: 75 }}>{time}</div>
                <div><div style={{ fontSize: 12, fontWeight: 700 }}>{subj}</div><div style={{ fontSize: 10, color: C.textMuted }}>{sub}</div></div>
                {hi && <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: "rgba(242,147,43,.12)", color: "#c47a1e" }}>Today</span>}
              </div>
            </div>
          ))}</CardBody>
        </Card>
      </div>}
      {page === "grades" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800 }}>Grade Entry</h1></div>
        <Card style={{ marginBottom: 18 }}><CardHead title="Enter Grade" />
          <CardBody>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <Select label="Student" value="Omar Ahmed" onChange={() => {}} options={["Omar Ahmed", "Layla Hassan", "Kareem Mostafa", "Nour Salah"]} />
              <Select label="Subject" value="Robotics" onChange={() => {}} options={["Robotics", "AI", "Programming"]} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <Input label="Assessment Name" placeholder="e.g. Smart Car Final" />
              <Input label="Score (%)" type="number" placeholder="0–100" />
            </div>
            <div style={{ marginBottom: 14 }}><label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.textMid, marginBottom: 6 }}>Notes <span style={{ fontWeight: 400, color: C.textMuted }}>(optional)</span></label><textarea placeholder="Feedback for parent and student…" rows={3} style={{ width: "100%", padding: "12px 14px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontFamily: "'Montserrat',sans-serif", fontSize: 13, resize: "vertical" }} /></div>
            <Btn variant="primary" style={{ padding: "12px 28px", borderRadius: 9 }} onClick={() => { setGradeSaved(true); setTimeout(() => setGradeSaved(false), 3000); }}>Save Grade</Btn>
            {gradeSaved && <div style={{ marginTop: 12, background: "rgba(34,197,94,.07)", border: "1px solid rgba(34,197,94,.2)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#16a34a" }}>✓ Grade saved successfully!</div>}
          </CardBody>
        </Card>
      </div>}
      {page === "messages" && <div>
        <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800 }}>Messages</h1></div>
        <Card><CardHead title="Ahmed Hassan — Omar's Parent" right={<Tag color="green">Online</Tag>} />
          <CardBody><MsgThread messages={msgs} setMessages={setMsgs} myInitials={user.initials || "TM"} myColor={C.navyMid} /></CardBody>
        </Card>
      </div>}
    </Shell>
  );
}

/* ══════════════════════════════════════════
   ROOT APP
══════════════════════════════════════════ */
export default function App() {
  const [screen, setScreen] = useState("landing");
  const [rolePickMode, setRolePickMode] = useState("login");
  const [selectedRole, setSelectedRole] = useState(null);
  const [currentUser, setCurrentUser] = useState({});

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

  function onLogin(role) {
    if (role === "parent") setScreen("parent-home");
    else if (role === "student") setScreen("student-home");
    else setScreen("instructor-home");
  }

  function onSignup(role, formData) {
    const first = formData.fname || "";
    const last = formData.lname || "";
    const name = first && last ? `${first} ${last}` : (role === "instructor" ? "Eng. Tarek Mohamed" : role === "student" ? "Omar Ahmed" : "Ahmed Hassan");
    const initials = first && last ? (first[0] + last[0]).toUpperCase() : role === "instructor" ? "TM" : role === "student" ? "OM" : "AH";
    setCurrentUser({ name, initials });
    if (role === "parent") setScreen("parent-home");
    else if (role === "student") setScreen("student-home");
    else setScreen("instructor-home");
  }

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {screen === "landing" && <Landing goTo={goTo} />}
      {screen === "role-pick" && <RolePicker mode={rolePickMode} onSelect={onRolePicked} />}
      {screen === "login" && <LoginPage role={selectedRole || "parent"} goTo={goTo} onLogin={onLogin} />}
      {screen === "signup" && <SignupPage role={selectedRole || "parent"} goTo={goTo} onSignup={onSignup} />}

      {/* HOME PAGES */}
      {screen === "parent-home" && (
        <HomeCard avatar={currentUser.initials || "AH"} bg={C.navy} roleTag="👨‍👩‍👧 Parent Account" name={currentUser.name || "Ahmed Hassan"} meta={`${currentUser.name ? currentUser.name.toLowerCase().replace(" ", "") + "@email.com" : "ahmed@email.com"}<br/><b style="color:${C.navy};">2 children</b> enrolled at NEXA`}
          actions={<><DashBtn icon="📊" title="Parent Dashboard" sub="Grades, progress, attendance & more" onClick={() => setScreen("dashboard")} /><DashBtn icon="💬" title="Messages" sub="3 unread from instructors" onClick={() => setScreen("dashboard")} /><DashBtn icon="📅" title="Upcoming Sessions" sub="Next: Robotics · Thu 4 PM" onClick={() => setScreen("dashboard")} /></>}
          onLogout={() => setScreen("landing")} />
      )}
      {screen === "student-home" && (
        <HomeCard avatar={currentUser.initials || "OM"} bg={C.orange} roleTag="🎓 Student Account" name={currentUser.name || "Omar Ahmed"} meta={`Year 2 · Level 5<br/><b style="color:${C.navy};">89%</b> overall average · <b style="color:${C.orange};">8</b> badges earned`}
          actions={<><DashBtn icon="🚀" title="My Learning Dashboard" sub="Subjects, grades, XP & achievements" onClick={() => setScreen("student-dash")} /><DashBtn icon="📅" title="My Schedule" sub="Next: Robotics · Tomorrow 4 PM" onClick={() => setScreen("student-dash")} /><DashBtn icon="🏆" title="Achievements" sub="8 badges · 700 XP to Level 6" onClick={() => setScreen("student-dash")} /></>}
          onLogout={() => setScreen("landing")} />
      )}
      {screen === "instructor-home" && (
        <HomeCard avatar={currentUser.initials || "TM"} bg={C.navyMid} roleTag="👨‍🏫 Instructor" name={currentUser.name || "Eng. Tarek Mohamed"} meta={`Robotics · Level 4 &amp; 5<br/><b style="color:${C.navy};">18 students</b> across 3 cohorts`}
          actions={<><DashBtn icon="📋" title="Instructor Dashboard" sub="Students, grades, sessions & notes" onClick={() => setScreen("instructor-dash")} /><DashBtn icon="📅" title="Today's Sessions" sub="2 sessions scheduled today" onClick={() => setScreen("instructor-dash")} /><DashBtn icon="💬" title="Messages" sub="2 unread from parents" onClick={() => setScreen("instructor-dash")} /></>}
          onLogout={() => setScreen("landing")} />
      )}

      {/* DASHBOARDS */}
      {screen === "dashboard" && <ParentDash onHome={() => setScreen("parent-home")} user={currentUser} />}
      {screen === "student-dash" && <StudentDash onHome={() => setScreen("student-home")} user={currentUser} />}
      {screen === "instructor-dash" && <InstructorDash onHome={() => setScreen("instructor-home")} user={currentUser} />}
    </div>
  );
}
