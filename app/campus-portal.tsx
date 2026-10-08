"use client";

import { Award, ArrowUpRight, Bookmark, Settings, RefreshCw, MapPin, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, ExternalLink, GraduationCap, IdCard, KeyRound, LayoutDashboard, LogOut, Mail, Microscope, Moon, Search, ShieldCheck, Sparkles, Sun, Trophy, UsersRound, UserRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { normalizeCity, matchesLocation } from "@/lib/event-location";
import { eventDate, type HackathonFeed } from "@/lib/hackathons";
import facultyDirectory from "@/lib/faculty-data.json";
import { researchSearchText, verifiedResearchCount } from "@/lib/faculty-research";
import { FacultyResearchInfo } from "./faculty-research-info";
import UserPage from "@/components/user-page";
import AdminDashboard from "@/components/admin-dashboard";
import StudentDirectory from "@/components/student-directory";
import { demoDirectory, type Role, type DemoSession } from "@/lib/demo-accounts";
import { workspaceRequest } from "@/lib/workspace-client";
import { useBookmarks } from "@/hooks/use-bookmarks";
import HackathonCard from "@/components/hackathon-card";
import { DeadlineReminders } from "@/components/hackathon-saving";

import { sortHackathons } from "@/lib/workspace-model";

type Section = "user" | "dashboard" | "hackathons" | "saved" | "faculty" | "students" | "clubs" | "settings" | "admin";



const clubData = [
  { initials: "SY", name: "Synergy", domains: ["Management", "PR", "Media", "Design", "Development"], president: "Vishnupriya", vicePresident: "Bhavani", secretary: "Sai Kalyan", extraRole: "Joint Secretary", extraName: "Monish", tone: "indigo" },
  { initials: "TV", name: "TechVayuna", domains: ["AI", "Media & PR", "Data Analytics", "Creative", "Web Development"], president: "Prabodh Raj U R", vicePresident: "G. K. Akashgautham", secretary: "Not provided", extraRole: "Tech / Non-Tech Leads", extraName: "Jayathri M / Bhargav M", tone: "cyan" },
  { initials: "CK", name: "CodeKrafters", domains: ["Web3", "PR & Management", "Web Development", "Content", "Creative", "Cyber Security", "Competitive Programming"], president: "Sanjay Ganesh K", vicePresident: "Satya Lohith", secretary: "Not provided", extraRole: "Focus", extraName: "Technology & competitive programming", tone: "amber" },
  { initials: "DI", name: "DISAT", domains: ["Drone Technology", "Pen Testing", "Video Editing", "Design"], president: "Shreya & Aparna", vicePresident: "Pithnash", secretary: "Not provided", extraRole: "Full name", extraName: "Digital Information Security Association of India", tone: "rose" },
  { initials: "TP", name: "TechPro", domains: ["Design", "Technology", "Media / PR / Marketing", "Content", "Event Management"], president: "Sanjai Darshan", vicePresident: "Kabilan", secretary: "Varsha", extraRole: "Focus", extraName: "Technology, media and events", tone: "indigo" },
  { initials: "AS", name: "Ashkam", domains: ["Event Management", "Marketing", "Media", "Technical"], president: "Vishel", vicePresident: "Imran", secretary: "Kirithika", extraRole: "Focus", extraName: "Events, media and technical activities", tone: "cyan" },
  { initials: "AN", name: "Andropedia", domains: ["Design", "Technology", "PR", "R&D", "Marketing"], president: "Sai Vishnu", vicePresident: "Santhosh", secretary: "Not provided", extraRole: "Focus", extraName: "Design, research and technology", tone: "amber" },
  { initials: "IN", name: "Intellect", domains: ["Technical", "Creative & Content", "Social Media", "Event Management", "Competitive Programming"], president: "Karthik", vicePresident: "Mayank Gupta", secretary: "Kritika", extraRole: "Focus", extraName: "Technical and creative collaboration", tone: "rose" },
  { initials: "SK", name: "SKETCH", domains: ["Technical", "Media & Marketing", "Design", "Operations", "R&P", "Content"], president: "To be confirmed", vicePresident: "R. A. Varmila", secretary: "Not provided", extraRole: "Focus", extraName: "Technical, design and content", tone: "indigo" },
];

const facultyData = facultyDirectory.faculty;

const navItems: { id: Section; label: string; icon: typeof LayoutDashboard; roles?: Role[] }[] = [
  { id: "user", label: "User", icon: UserRound },
  { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "hackathons", label: "Hackathons & events", icon: Trophy },
  { id: "saved", label: "Saved hackathons", icon: Bookmark, roles: ["Student", "Admin"] },
  { id: "faculty", label: "Faculty research", icon: Microscope },
  { id: "students", label: "Student portfolios", icon: GraduationCap, roles: ["Faculty", "Admin"] },
  { id: "clubs", label: "Clubs & events", icon: UsersRound },
  { id: "admin", label: "Admin dashboard", icon: ShieldCheck, roles: ["Admin"] },
];

function Metric({ icon: Icon, label, value, note }: { icon: typeof Award; label: string; value: string; note: string }) {
  return <article className="metric-card"><div className="metric-icon"><Icon size={19} /></div><div><p>{label}</p><strong>{value}</strong><span>{note}</span></div></article>;
}

export default function CampusPortal({ viewer }: { viewer: { name: string; email: string; authenticated: boolean } }) {
  const [session, setSession] = useState<DemoSession | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    void workspaceRequest<{account: DemoSession}>("/api/session", { signal:controller.signal }).then(data => setSession(data.account)).catch(() => {}).finally(() => { if (!controller.signal.aborted) setSessionReady(true); });
    return () => controller.abort();
  }, []);
  const signOut = async () => {
    try { await workspaceRequest("/api/session", { method:"DELETE" }); setSession(null); setSessionError(""); }
    catch (error) { setSessionError(error instanceof Error ? error.message : "Could not sign out. Please retry."); }
  };
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const saved = window.localStorage.getItem("campus-theme");
    const preferred = saved === "dark" || saved === "light" ? saved : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const frame = requestAnimationFrame(() => setTheme(preferred));
    return () => cancelAnimationFrame(frame);
  }, []);
  const toggleTheme = () => setTheme((current) => {
    const next = current === "light" ? "dark" : "light";
    window.localStorage.setItem("campus-theme", next);
    return next;
  });
  return <div className={`theme-root ${theme === "dark" ? "theme-dark" : "theme-light"}`}>
    {sessionError && <p className="provider-notice" role="alert">{sessionError}</p>}
    {!sessionReady ? <main className="login-shell"><p role="status">Opening your workspace…</p></main> : !session ? <LoginScreen onAuthenticated={setSession} theme={theme} toggleTheme={toggleTheme} /> : <Portal viewer={{ name: session.name, email: session.email, authenticated: viewer.authenticated }} assignedRole={session.role} onSignOut={() => void signOut()} theme={theme} toggleTheme={toggleTheme} />}
  </div>;
}

function ThemeToggle({ theme, toggleTheme }: { theme: "light" | "dark"; toggleTheme: () => void }) {
  return <button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`} title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>
    {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}<span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
  </button>;
}

function LoginScreen({ onAuthenticated, theme, toggleTheme }: { onAuthenticated: (session: DemoSession) => void; theme: "light" | "dark"; toggleTheme: () => void }) {
  const [portal, setPortal] = useState<Role | null>(null);
  const [step, setStep] = useState<"credentials" | "verify">("credentials");
  const [universityId, setUniversityId] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const profiles = [
    { role: "Student" as Role, icon: GraduationCap, title: "Student portal", copy: "Portfolio, achievements, clubs and opportunities.", id: "STU-2026-001" },
    { role: "Faculty" as Role, icon: Microscope, title: "Faculty portal", copy: "Research portfolio and student verification.", id: "FAC-2026-001" },
    { role: "Admin" as Role, icon: ShieldCheck, title: "Admin portal", copy: "Restricted approvals, access and audit controls.", id: "ADM-2026-001" },
  ];
  const selectPortal = (role: Role, id: string) => { const account = demoDirectory[id]; setPortal(role); setUniversityId(id); setEmail(account.email); setStep("credentials"); setOtp(""); setError(""); };
  const continueLogin = () => { const account = demoDirectory[universityId.trim().toUpperCase()]; if (!account || account.email.toLowerCase() !== email.trim().toLowerCase()) { setError("We could not verify those university details."); return; } if (account.role !== portal) { setError(`This account is assigned to the ${account.role} portal.`); return; } setError(""); setStep("verify"); };
  const verify = async () => {
    if (busy) return;
    setBusy(true); setError("");
    try { const data = await workspaceRequest<{account:DemoSession}>("/api/session", {method:"POST",body:JSON.stringify({universityId,email,role:portal,code:otp})}); onAuthenticated(data.account); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Could not sign in."); }
    finally { setBusy(false); }
  };
  return <main className="login-shell"><div className="login-orb orb-one"/><div className="login-orb orb-two"/><section className="login-panel"><div className="login-brand"><span><GraduationCap size={24}/></span><div><strong>CampusConnect</strong><small>Secure university portal</small></div><ThemeToggle theme={theme} toggleTheme={toggleTheme}/></div>{!portal ? <><div className="login-heading"><span className="security-pill"><ShieldCheck size={14}/> Protected university access</span><h1>Choose your portal</h1><p>Your role is verified against the university directory after sign-in.</p></div><div className="portal-options">{profiles.map(({ role, icon: Icon, title, copy, id }) => <button key={role} className="portal-option" onClick={() => selectPortal(role,id)}><span className={`portal-icon ${role.toLowerCase()}`}><Icon size={23}/></span><span><strong>{title}</strong><small>{copy}</small></span><ChevronRight size={19}/></button>)}</div><p className="login-help">First-time user? Your account must already exist in the official university roster.</p></> : <div className="login-form-wrap"><button className="back-login" onClick={() => setPortal(null)}><ChevronLeft size={16}/> All portals</button><span className={`portal-icon ${portal.toLowerCase()}`}>{portal === "Student" ? <GraduationCap size={23}/> : portal === "Faculty" ? <Microscope size={23}/> : <ShieldCheck size={23}/>}</span><h1>{portal} sign in</h1><p>{step === "credentials" ? "Use your verified university account." : `We sent a demo verification code to ${email}.`}</p>{step === "credentials" ? <div className="login-fields"><label><span>University ID</span><div><IdCard size={17}/><input value={universityId} onChange={e=>setUniversityId(e.target.value)} autoComplete="username"/></div></label><label><span>University email</span><div><Mail size={17}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></div></label><button className="primary-button full login-submit" onClick={continueLogin}>Continue securely <ChevronRight size={16}/></button></div> : <div className="login-fields"><label><span>Six-digit verification code</span><div><KeyRound size={17}/><input inputMode="numeric" maxLength={6} value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,""))} placeholder="246810" autoComplete="one-time-code"/></div></label><button className="primary-button full login-submit" disabled={busy} onClick={() => void verify()}>{busy ? "Signing in…" : "Verify and open workspace"}</button><button className="secondary-button full" onClick={()=>{setStep("credentials");setError("")}}>Change account</button></div>}{error && <p className="login-error" role="alert">{error}</p>}<div className="demo-notice"><strong>Local demo access</strong><span>Verification code: <code>246810</code>. Replace this adapter with university SSO before any real deployment.</span></div></div>}<footer className="login-footer"><span>Privacy</span><span>Security</span><span>IT support</span></footer></section></main>;
}

function useHackathonFeed() {
  const [feed, setFeed] = useState<HackathonFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const response = await fetch("/api/hackathons", { cache: "no-store", signal });
      if (!response.ok) throw new Error("The event providers are unavailable. Please try again shortly.");
      const next: HackathonFeed = await response.json();
      if (!response.ok) {
        setFeed(previous => previous?.events.length ? previous : next);
        throw new Error("The event providers are unavailable. Please try again shortly.");
      }
      setFeed(next); setError("");
    } catch (failure) {
      if (!signal?.aborted) setError(failure instanceof Error ? failure.message : "Could not refresh events.");
    } finally { if (!signal?.aborted) setLoading(false); }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const frame = requestAnimationFrame(() => void refresh(controller.signal));
    const interval = window.setInterval(() => { if (!document.hidden) void refresh(controller.signal); }, 300000);
    const onVisible = () => { if (!document.hidden) void refresh(controller.signal); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { controller.abort(); cancelAnimationFrame(frame); window.clearInterval(interval); document.removeEventListener("visibilitychange", onVisible); };
  }, [refresh]);
  return { feed, loading, error, refresh };
}

function Portal({ viewer, assignedRole, onSignOut, theme, toggleTheme }: { viewer: { name: string; email: string; authenticated: boolean }; assignedRole: Role; onSignOut: () => void; theme: "light" | "dark"; toggleTheme: () => void }) {
  const [section, setSection] = useState<Section>(assignedRole === "Admin" ? "admin" : "dashboard");
  const role = assignedRole;
  const [displayName,setDisplayName]=useState(viewer.name);
  useEffect(()=>{const controller=new AbortController();void workspaceRequest<{account:DemoSession}>("/api/user",{signal:controller.signal}).then(data=>setDisplayName(data.account.name)).catch(()=>{});return()=>controller.abort();},[]);
  const currentViewer={...viewer,name:displayName};

  const [query, setQuery] = useState("");
  const [clubFilter, setClubFilter] = useState("All");
  const live = useHackathonFeed();
  const bookmarks = useBookmarks();
  const [now,setNow]=useState(()=>Date.now());
  useEffect(()=>{const interval=window.setInterval(()=>setNow(Date.now()),60000);return()=>window.clearInterval(interval);},[]);
  const currentSaved=bookmarks.saved.map(item=>({...item,event:live.feed?.events.find(event=>event.id===item.event.id)??item.event}));
  const contentRef=useRef<HTMLDivElement>(null);
  const filteredClubs = useMemo(() => {
    const categories: Record<string, RegExp> = { Technical: /technical|technology|development|web3|ai|data|programming|security|testing/i, Creative: /creative|design|content|editing/i, Media: /media|pr|marketing/i, Management: /management|operations/i, Security: /security|testing/i };
    return clubData.filter(club => (clubFilter === "All" || club.domains.some(domain => categories[clubFilter]?.test(domain))) && [club.name, ...club.domains].join(" ").toLowerCase().includes(query.trim().toLowerCase()));
  }, [clubFilter, query]);
  const go = (id: Section) => { setSection(role === "Admin" && id !== "settings" && id !== "user" ? "admin" : id); setQuery(""); contentRef.current?.scrollTo({top:0}); };
  const initials = displayName.split(" ").map(part => part[0]).slice(0, 2).join("");
  const navigation = navItems.filter(item => role === "Admin" ? item.id === "admin" : !item.roles || item.roles.includes(role));
  return <div className="spatial-scene">
    <div className="ambient-shape ambient-one" aria-hidden="true" /><div className="ambient-shape ambient-two" aria-hidden="true" />
    {role !== "Admin" && <nav className="spatial-rail" aria-label="Quick navigation">

      {navigation.map(({id,label,icon:Icon}) => <button key={id} className={`rail-button ${section === id ? "active" : ""}`} onClick={()=>go(id)} aria-label={label} aria-current={section === id ? "page" : undefined} title={label}><Icon size={19}/></button>)}
      <span className="rail-divider"/><button className="rail-button" onClick={()=>go("settings")} aria-label="User settings" title="User settings"><Settings size={19}/></button>
    </nav>}
    <div className="portal-shell">
      <main className="main-area">
        <header className="topbar"><div className="window-controls" aria-hidden="true"><i /><i /><i /></div><span className="portal-wordmark"><GraduationCap size={21}/><strong>CampusConnect</strong></span><span className="breadcrumb">Workspace <ChevronRight size={12} /> {section === "settings" ? "User settings" : section === "user" ? "User profile" : navigation.find(item => item.id === section)?.label}</span><div className="top-actions"><ThemeToggle theme={theme} toggleTheme={toggleTheme} /></div></header>
        <div className="page-content" ref={contentRef}>
          {role === "Student" && <DeadlineReminders saved={currentSaved} now={now} onOpen={()=>go("saved")}/>}
          {section !== "settings" && section !== "user" && <label className="global-search"><Search size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder={section === "admin" ? "Search accounts or audit activity" : section === "students" || (section === "dashboard" && (role === "Faculty" || role === "Admin")) ? "Search students by name, ID, skills or projects" : section === "hackathons" ? "Search hackathons, cities and organisers" : section === "dashboard" ? "Search faculty, departments, clubs and hackathons" : "Search people, clubs and opportunities"} aria-label="Search portal" /><kbd>⌕</kbd></label>}
          {section === "dashboard" && !query.trim() && <Dashboard role={role} name={displayName} go={go} live={live} query={query} />}
          {section === "dashboard" && Boolean(query.trim()) && role === "Student" && <StudentSearch query={query} live={live} onClear={()=>setQuery("")} />}
          {(section === "hackathons" || section === "saved") && <Hackathons key={section} live={live} query={query} bookmarks={bookmarks} now={now} savedOnly={section === "saved"} allowSaving={role !== "Faculty"} />}
          {section === "dashboard" && Boolean(query.trim()) && (role === "Faculty" || role === "Admin") && <StudentDirectory query={query} onClearSearch={()=>setQuery("")} />}
          {section === "clubs" && <Clubs clubs={filteredClubs} filter={clubFilter} setFilter={setClubFilter} onEvents={()=>go("hackathons")} />}
          {section === "faculty" && <Faculty query={query} />}
          {section === "students" && (role === "Faculty" || role === "Admin") && <StudentDirectory query={query} onClearSearch={()=>setQuery("")} />}
          {section === "user" && <UserPage viewer={currentViewer} role={role} onNameChange={setDisplayName} />}
          {section === "settings" && role === "Admin" && <button className="secondary-button" onClick={()=>go("admin")}><ChevronLeft size={16}/> Back to admin dashboard</button>}
          {section === "settings" && <UserSettings viewer={currentViewer} role={role} theme={theme} toggleTheme={toggleTheme} onSignOut={onSignOut} />}
          {section === "admin" && role === "Admin" && <AdminDashboard query={query} />}
        </div>
      </main>
    </div>
  </div>;
}

function PageHeading({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy: string; action?: React.ReactNode }) { return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{copy}</p></div>{action}</div>; }

function StudentSearch({query,live,onClear}:{query:string;live:ReturnType<typeof useHackathonFeed>;onClear:()=>void}) {
  const [category,setCategory]=useState("All");
  const terms=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches=(values:string[])=>terms.every(term=>values.join(" ").toLowerCase().includes(term));
  const faculty=facultyData.filter(person=>matches([person.name,person.department,person.designation,person.qualification,person.email,researchSearchText(person.email)]));
  const clubs=clubData.filter(club=>matches([club.name,...club.domains,club.president,club.vicePresident,club.secretary]));
  const events=(live.feed?.events??[]).filter(event=>matches([event.title,event.host,event.location??"",...event.tags]));
  const count=(category==="All"||category==="Faculty"?faculty.length:0)+(category==="All"||category==="Clubs"?clubs.length:0)+(category==="All"||category==="Hackathons"?events.length:0);
  return <><PageHeading eyebrow="Campus search" title="Search results" copy={`Find faculty, campus clubs and live opportunities matching “${query.trim()}”.`} action={<button className="secondary-button" onClick={onClear}>Clear search</button>}/><div className="filter-row" aria-label="Search categories">{["All","Faculty","Clubs","Hackathons"].map(value=><button key={value} className={category===value?"filter-chip active":"filter-chip"} aria-pressed={category===value} onClick={()=>setCategory(value)}>{value}</button>)}</div><p role="status">{count} matching results</p>
    {(category==="All"||category==="Faculty")&&faculty.length>0&&<section className="student-search-section"><h2>Faculty · {faculty.length}</h2><div className="student-grid">{faculty.map(person=><article className="panel student-card" key={person.email}><span className="student-badge">Faculty · SRM directory</span><h3>{person.name}</h3><p>{person.designation}</p><dl className="faculty-details"><div><dt>Department</dt><dd>{person.department}</dd></div><div><dt>Qualification</dt><dd>{person.qualification}</dd></div></dl><a className="faculty-email" href={`mailto:${person.email}`}><Mail size={14}/>{person.email}</a>{person.profileUrl?<a className="secondary-button full" href={person.profileUrl} target="_blank" rel="noreferrer">View faculty profile <ExternalLink size={15}/></a>:<p>Profile link not provided.</p>}</article>)}</div></section>}
    {(category==="All"||category==="Clubs")&&clubs.length>0&&<section className="student-search-section"><h2>Clubs · {clubs.length}</h2><div className="student-grid">{clubs.map(club=><article className="panel student-card" key={club.name}><span className="student-badge">Campus club</span><h3>{club.name}</h3><div className="skill-list">{club.domains.map(domain=><span key={domain}>{domain}</span>)}</div><p>President: {club.president}</p><p>Vice president: {club.vicePresident}</p><p>Secretary: {club.secretary}</p></article>)}</div></section>}
    {(category==="All"||category==="Hackathons")&&<section className="student-search-section">{events.length>0&&<><h2>Hackathons · {events.length}</h2><div className="compact-list">{events.map(event=><a className="compact-event" key={event.id} href={event.href} target="_blank" rel="noreferrer"><span className="event-tile"><Trophy size={22}/></span><span><strong>{event.title}</strong><small>{event.source} · {event.mode} · {event.location||"See event page"} · Apply by {eventDate(event.deadline)}</small></span><ArrowUpRight size={17}/></a>)}</div></>}{live.loading&&!live.feed&&<p role="status">Searching live hackathons…</p>}{live.error&&<p className="provider-notice" role="alert">{live.error}<button className="text-button" onClick={()=>void live.refresh()}>Retry hackathon search</button></p>}</section>}
    {!count&&<div className="empty-clubs"><Search size={24}/><strong>No matches in this view</strong><span>Try a faculty name, department, club or skill. You can also change the search category.</span></div>}
  </>;
}

function Dashboard({ role, name, go, live, query }: { role: Role; name: string; go: (s: Section) => void; live: ReturnType<typeof useHackathonFeed>; query: string }) {
  const events = (live.feed?.events ?? []).filter(event => [event.title, event.host, ...event.tags].join(" ").toLowerCase().includes(query.toLowerCase())).slice(0, 3);
  return <div className="spatial-dashboard">
    <div className="section-kicker"><span className="live-dot" /> Your campus, in focus <span>Make room for what’s next.</span></div>
    <section className="welcome-panel"><div><span className="welcome-badge"><Sparkles size={14} /> A world of possibilities</span><h1>Hello, {name.split(" ")[0]}.<br /><span>Find your next spark.</span></h1><p>Ideas worth building. People worth meeting.<br />Your next chapter starts right here.</p><div className="welcome-actions"><button className="primary-button" onClick={() => go("hackathons")}>Explore opportunities <ArrowUpRight size={16} /></button><button className="text-button" onClick={() => go(role === "Student" ? "clubs" : "students")}>{role === "Student" ? "Find your community" : "Browse student portfolios"} <ChevronRight size={16} /></button></div></div><div className="hero-orbits" aria-hidden="true"><div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" /><div className="orbit-ring ring-three" /><span className="orbit-core"><GraduationCap size={43} strokeWidth={1.2} /></span><span className="orbit-node node-one"><Trophy size={21} /></span><span className="orbit-node node-two"><Microscope size={20} /></span><span className="orbit-node node-three"><UsersRound size={21} /></span></div></section>
    <section className="metric-grid"><Metric icon={Trophy} label="Open opportunities" value={live.feed ? String(live.feed.events.length).padStart(2, "0") : "—"} note="From live event listings" /><Metric icon={Microscope} label="Faculty network" value={String(facultyData.length)} note="From the SRM directory" /><Metric icon={UsersRound} label="Campus communities" value="09" note="Find where you belong" /></section>
    <section className="panel opportunity-panel"><div className="panel-title"><div><p className="eyebrow">Go build something</p><h2>On your radar</h2></div><button className="text-button" onClick={() => go("hackathons")}>All opportunities <ArrowUpRight size={16} /></button></div><div className="compact-list">{events.map(event => <a key={event.id} href={event.href} target="_blank" rel="noreferrer" className="compact-event"><span className={"event-tile " + event.source.toLowerCase()}><Trophy size={24} /></span><span><strong>{event.title}</strong><small>{event.source} · {event.mode} · {event.deadline ? "Apply by " + eventDate(event.deadline) : "Starts " + eventDate(event.startsAt)}</small></span><ArrowUpRight size={18} /></a>)}{live.loading && !live.feed && <p className="feed-message">Finding current hackathons…</p>}{live.error && <p className="feed-message" role="alert">{live.error}</p>}{live.feed && !events.length && <p className="feed-message">No open opportunities match your search.</p>}</div></section>
    <div className="explore-grid"><button className="explore-card research" onClick={() => go("faculty")}><span><Microscope size={26} /></span><div><small>Knowledge, shared</small><h2>Meet your mentors.</h2><p>Explore the faculty research network.</p></div><ArrowUpRight size={21} /></button><button className="explore-card community" onClick={() => go("clubs")}><span><UsersRound size={26} /></span><div><small>Better, together</small><h2>Find your people.</h2><p>Nine communities. Endless possibilities.</p></div><ArrowUpRight size={21} /></button></div>
    {role === "Admin" && <button className="text-button" onClick={() => go("admin")}>Open administration console <ChevronRight size={16} /></button>}
  </div>;
}

function Hackathons({ live, query, bookmarks, savedOnly, now, allowSaving }: { live: ReturnType<typeof useHackathonFeed>; query: string; bookmarks:ReturnType<typeof useBookmarks>; savedOnly:boolean; now:number; allowSaving:boolean }) {
  const [filter, setFilter] = useState("All events");
  const [location, setLocation] = useState("all");
  const [sort,setSort]=useState("deadline");
  const available = savedOnly ? bookmarks.saved.map(item=>live.feed?.events.find(event=>event.id===item.event.id)??item.event) : live.feed?.events??[];
  const cities = [...new Set(available.filter(event => event.mode !== "Online").map(event => normalizeCity(event.location)).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const events = sortHackathons(available.filter(event => (filter === "All events" || event.source === filter || event.mode === filter) &&
    matchesLocation(event, location) &&
    [event.title, event.host, event.location ?? "", ...event.tags].join(" ").toLowerCase().includes(query.trim().toLowerCase())),sort);
  return <><PageHeading eyebrow="Build your next chapter" title={savedOnly?"Saved hackathons":"Hackathons & events"} copy={savedOnly?"Your shortlist, saved to your account. Set reminders and keep track of registration deadlines.":"Fresh opportunities for curious minds. Find a challenge and make something that matters."} action={<button className="secondary-button" disabled={live.loading} onClick={() => {void live.refresh();void bookmarks.refresh();}}><RefreshCw size={16} className={live.loading ? "spinning" : ""} /> {live.loading ? "Refreshing" : "Refresh"}</button>} />
    {allowSaving && bookmarks.error&&<p className="provider-notice" role="alert">{bookmarks.error}<button className="text-button" onClick={()=>void bookmarks.refresh()}>Retry saved events</button></p>}
    <div className="feed-status"><span><i className="live-dot" /> Auto-refreshes every 5 minutes</span><span>{live.feed ? "Updated " + new Date(live.feed.fetchedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) + " IST" : "Connecting to providers"}</span></div>
    {live.feed?.providers.filter(provider => provider.status === "unavailable").map(provider => <p className="provider-notice" key={provider.name}>{provider.name} is temporarily unavailable. <a href={provider.name === "LinkedIn" ? "https://www.linkedin.com/events/" : provider.name === "Unstop" ? "https://unstop.com/hackathons" : "https://devfolio.co/hackathons"} target="_blank" rel="noreferrer">Browse {provider.name} <ExternalLink size={12} /></a></p>)}
    {live.feed?.providers.filter(provider=>provider.message).map(provider=><p className="provider-notice" key={provider.name+"-status"}>{provider.message}</p>)}
    {live.error && <p className="provider-notice" role="alert">{live.error}{live.feed && " Showing the last successful results."}</p>}
    <div className="filter-row">{["All events", "Online", "Offline", "Hybrid", "Unstop", "Devfolio", "LinkedIn"].map(item => <button key={item} aria-pressed={filter === item} className={filter === item ? "filter-chip active" : "filter-chip"} onClick={() => setFilter(item)}>{item}</button>)}</div>
    <div className="location-filter"><label><MapPin size={16} /><span>Location</span><select aria-label="Location" value={location} onChange={event => setLocation(event.target.value)}><option value="all">All locations</option><option value="online">Online / hybrid · remote participation</option><option value="unknown">Venue not listed</option>{cities.map(city => <option key={city} value={city}>{city}</option>)}{!["all", "online", "unknown", ...cities].includes(location) && <option value={location}>{location}</option>}</select></label><span role="status">{events.length} matching events</span>{(location !== "all" || filter !== "All events") && <button className="text-button" onClick={() => { setLocation("all"); setFilter("All events"); }}>Reset filters</button>}</div>
    <div className="sort-control"><label>Sort by<select aria-label="Sort hackathons" value={sort} onChange={e=>setSort(e.target.value)}><option value="deadline">Registration deadline · soonest first</option><option value="start">Start date · soonest first</option><option value="title">Name · A–Z</option></select></label><span>Unknown dates appear last.</span></div>
    <div className="card-grid">{events.map((event,index)=><HackathonCard key={event.id} event={event} index={index} now={now} bookmarks={bookmarks} allowSaving={allowSaving}/>)}</div>
    {live.loading && !live.feed && <div className="loading-grid">{[0, 1, 2].map(item => <div className="event-skeleton" key={item} />)}</div>}
    {(savedOnly?bookmarks.ready:Boolean(live.feed)) && !events.length && !live.error && <div className="empty-clubs"><Trophy size={26} /><strong>{savedOnly?"No saved hackathons in this view":"No open hackathons match this view"}</strong><span>{savedOnly?"Save an event from Hackathons or reset your filters.":"Try All events, clear the search, or refresh. Online-only events are excluded from city filters."}</span></div>}
  </>;
}

function UserSettings({ viewer, role, theme, toggleTheme, onSignOut }: { viewer: { name: string; email: string; authenticated: boolean }; role: Role; theme: "light" | "dark"; toggleTheme: () => void; onSignOut: () => void }) {
  const [tab, setTab] = useState("Appearance");
  return <><PageHeading eyebrow="Make yourself at home" title="User settings" copy="Your appearance and account preferences." /><div className="settings-tabs" role="tablist" aria-label="User settings">{["Appearance", "Account"].map(item => <button key={item} role="tab" aria-selected={tab === item} aria-controls="settings-content" className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}</div><div id="settings-content" role="tabpanel" aria-label={tab}>{tab === "Appearance" && <section className="panel settings-panel"><h2>A space that feels like you.</h2><p>Choose a light or dark appearance. Your choice is saved on this device.</p><div className="appearance-options">{(["light", "dark"] as const).map(mode => <button key={mode} className={theme === mode ? "appearance-choice selected" : "appearance-choice"} aria-pressed={theme === mode} onClick={() => { if (theme !== mode) toggleTheme(); }}><span className={"appearance-preview " + mode}><i /><i /><i /></span><strong>{mode === "light" ? <Sun size={16} /> : <Moon size={16} />}{mode === "light" ? "Light" : "Dark"}{theme === mode && <CheckCircle2 size={16} />}</strong></button>)}</div><div className="settings-row"><span><strong>Typography</strong><small>SF Pro Display</small></span><span>Apple SF Pro</span></div></section>}{tab === "Account" && <section className="panel settings-panel"><h2>Your account</h2><div className="settings-row"><span>Name</span><strong>{viewer.name}</strong></div><div className="settings-row"><span>Email</span><strong>{viewer.email}</strong></div><div className="settings-row"><span>Portal</span><strong>{role}</strong></div><button className="secondary-button" onClick={onSignOut}><LogOut size={16} /> Sign out</button></section>}</div></>;
}

function Clubs({ clubs, filter, setFilter, onEvents }: { clubs: typeof clubData; filter: string; setFilter: (s: string) => void; onEvents:()=>void }) {
  const filters = ["All", "Technical", "Creative", "Media", "Management", "Security"];
  return <><PageHeading eyebrow="Campus life" title="Clubs & events" copy={`${clubData.length} student-led communities across technology, media, design, management and research.`} action={<button className="secondary-button" onClick={onEvents}>Browse live events <ArrowUpRight size={16}/></button>} /><div className="filter-row">{filters.map(f => <button key={f} className={filter === f ? "filter-chip active" : "filter-chip"} onClick={() => setFilter(f)}>{f}</button>)}</div><div className="club-grid">{clubs.map((club) => <article className="club-card" key={club.name}><div className={`club-monogram ${club.tone}`}>{club.initials}</div><div className="club-title"><div><span>Student club</span><h2>{club.name}</h2></div></div><div className="club-domains" aria-label={`${club.name} domains`}>{club.domains.map((domain) => <span key={domain}>{domain}</span>)}</div><dl><div><dt>President</dt><dd>{club.president}</dd></div><div><dt>Vice President</dt><dd>{club.vicePresident}</dd></div><div><dt>Secretary</dt><dd>{club.secretary}</dd></div><div><dt>{club.extraRole}</dt><dd>{club.extraName}</dd></div></dl><footer><span><UsersRound size={16} /> Leadership details</span><span>{club.domains.length} domains</span></footer></article>)}</div>{clubs.length === 0 && <div className="empty-clubs"><Search size={22}/><strong>No clubs match this filter</strong><span>Try another domain or clear the search.</span></div>}</>;
}

function Faculty({ query = "" }: { query?: string }) {
  const [department, setDepartment] = useState("All");
  const departments = ["All", ...new Set(facultyData.map(person => person.department))];
  const search = query.trim().toLowerCase();
  const people = facultyData.filter(person =>
    (department === "All" || person.department === department) &&
    [person.name, person.designation, person.department, person.qualification, person.email, researchSearchText(person.email)].join(" ").toLowerCase().includes(search)
  );
  return <>
    <PageHeading eyebrow="Knowledge network" title="Faculty research"
      copy={`${facultyData.length} faculty from SRM Ramapuram’s official directory. Explore research interests, citation metrics and publications on Google Scholar.`}
      action={<a className="secondary-button" href={facultyDirectory.sourceUrl} target="_blank" rel="noreferrer">Official directory <ExternalLink size={16} /></a>} />
    <p className="faculty-source-note">{verifiedResearchCount} of {facultyData.length} Scholar profiles verified · Research snapshot: 8 October 2026 · Remaining profiles pending verification or access. Search by name, department, email or research interest.</p>
    <div className="filter-row" aria-label="Filter faculty by department">{departments.map(item =>
      <button key={item} className={department === item ? "filter-chip active" : "filter-chip"} aria-pressed={department === item} onClick={() => setDepartment(item)}>{item}</button>
    )}</div>
    <p className="faculty-result-count" role="status">Showing {people.length} of {facultyData.length} faculty</p>
    <div className="faculty-grid">{people.map(person => {
      const initials = person.name.replace(/^(Dr|Prof|Mrs|Ms|Mr)\.?\s*/i, "").split(/[.\s]+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase();
      return <article className="faculty-card" key={person.email}>
        <div className={`faculty-cover cover-${person.sourceNumber % 3}`} />
        <div className="faculty-content">
          <span className="faculty-avatar" aria-hidden="true">{initials}</span>
          <span className="verified"><BookOpen size={14} /> SRM directory</span>
          <h2>{person.name}</h2><p>{person.designation}</p>
          <dl className="faculty-details"><div><dt>Department</dt><dd>{person.department}</dd></div><div><dt>Qualification</dt><dd>{person.qualification}</dd></div></dl>
          <a className="faculty-email" href={`mailto:${person.email}`}><Mail size={14} /><span>{person.email}</span></a>
          <FacultyResearchInfo email={person.email} />
          {person.profileUrl ? <a className="secondary-button full" href={person.profileUrl} target="_blank" rel="noreferrer">View faculty profile <ExternalLink size={15} /></a> : <span className="faculty-profile-unavailable">Profile not linked in the directory</span>}
        </div>
      </article>;
    })}</div>
    {people.length === 0 && <div className="empty-clubs"><Search size={22} /><strong>No faculty match your search</strong><span>Try another name or department, or clear the search.</span></div>}
  </>;
}
