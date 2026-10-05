"use client";

import { Award, ArrowUpRight, Bookmark, Compass, Settings, RefreshCw, MapPin, Wifi, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, ExternalLink, GraduationCap, IdCard, KeyRound, LayoutDashboard, LockKeyhole, LogOut, Mail, Menu, Microscope, Moon, Search, ShieldCheck, Sparkles, Sun, Trophy, UsersRound, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { eventDate, type HackathonFeed } from "@/lib/hackathons";
import facultyDirectory from "@/lib/faculty-data.json";
import Portfolio from "@/components/portfolio";
import { demoDirectory, type Role, type DemoSession } from "@/lib/demo-accounts";
import { workspaceRequest } from "@/lib/workspace-client";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { BookmarkActions, DeadlineReminders } from "@/components/hackathon-saving";
import TeamFinder from "@/components/team-finder";
import { sortHackathons } from "@/lib/workspace-model";

type Section = "dashboard" | "hackathons" | "saved" | "teams" | "faculty" | "clubs" | "settings" | "admin";



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
  { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "hackathons", label: "Hackathons", icon: Trophy },
  { id: "saved", label: "Saved hackathons", icon: Bookmark },
  { id: "teams", label: "Team finder", icon: UsersRound },
  { id: "faculty", label: "Faculty research", icon: Microscope },
  { id: "clubs", label: "Clubs & events", icon: UsersRound },
  { id: "admin", label: "Admin console", icon: ShieldCheck, roles: ["Admin"] },
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
    {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
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
  const [section, setSection] = useState<Section>("dashboard");
  const role = assignedRole;
  const [mobileOpen, setMobileOpen] = useState(false);
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
  const go = (id: Section) => { setSection(id); setQuery(""); setMobileOpen(false); contentRef.current?.scrollTo({top:0}); };
  const initials = viewer.name.split(" ").map(part => part[0]).slice(0, 2).join("");
  const navigation = navItems.filter(item => !item.roles || item.roles.includes(role));
  return <div className="spatial-scene">
    <div className="ambient-shape ambient-one" aria-hidden="true" /><div className="ambient-shape ambient-two" aria-hidden="true" />
    <div className="portal-shell">
      <aside className={"sidebar " + (mobileOpen ? "open" : "")} aria-label="Primary navigation">
        <div className="brand"><div className="brand-mark"><GraduationCap size={23} /></div><div><strong>CampusConnect</strong><span>Your campus, connected.</span></div><button className="icon-button mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18} /></button></div>
        <div className="workspace-label"><span className="workspace-dot" /> SRM Ramapuram <small>{role} workspace</small></div>
        <nav><p className="nav-label">Discover</p>{navigation.map(({ id, label, icon: Icon }) => <button key={id} className={section === id ? "nav-item active" : "nav-item"} onClick={() => go(id)}><Icon size={18} /><span>{label}</span>{section === id && <ChevronRight size={14} />}</button>)}</nav>
        <div className="sidebar-note"><Compass size={20} /><strong>A little curiosity.<br />A lot of possibility.</strong><span>Find your next thing.</span><button className="text-button" onClick={() => go("hackathons")}>Explore opportunities <ArrowUpRight size={15} /></button></div>
        <button className={section === "settings" ? "profile-mini selected" : "profile-mini"} onClick={() => go("settings")} aria-label="Open user settings"><span className="avatar">{initials}</span><span><strong>{viewer.name}</strong><small>User settings</small></span><Settings size={17} /></button>
      </aside>
      {mobileOpen && <button className="backdrop" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <main className="main-area">
        <header className="topbar"><div className="window-controls" aria-hidden="true"><i /><i /><i /></div><button className="icon-button menu-button" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={20} /></button><span className="breadcrumb">Workspace <ChevronRight size={12} /> {section === "settings" ? "User settings" : navigation.find(item => item.id === section)?.label}</span><div className="top-actions"><ThemeToggle theme={theme} toggleTheme={toggleTheme} /><button className="avatar small avatar-button" onClick={() => go("settings")} aria-label="Open user settings">{initials}</button></div></header>
        <div className="page-content" ref={contentRef}>
          <DeadlineReminders saved={currentSaved} now={now} onOpen={()=>go("saved")}/>
          {section !== "settings" && <label className="global-search"><Search size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder={section === "hackathons" ? "Search hackathons, cities and organisers" : "Search people, clubs and opportunities"} aria-label="Search portal" /><kbd>⌕</kbd></label>}
          {section === "dashboard" && <Dashboard role={role} name={viewer.name} go={go} live={live} query={query} />}
          {(section === "hackathons" || section === "saved") && <Hackathons key={section} live={live} query={query} bookmarks={bookmarks} now={now} savedOnly={section === "saved"} />}
          {section === "teams" && <TeamFinder query={query} onEditProfile={()=>go("settings")}/>}
          {section === "clubs" && <Clubs clubs={filteredClubs} filter={clubFilter} setFilter={setClubFilter} />}
          {section === "faculty" && <Faculty query={query} />}
          {section === "settings" && <UserSettings viewer={viewer} role={role} theme={theme} toggleTheme={toggleTheme} onSignOut={onSignOut} />}
          {section === "admin" && <Admin />}
        </div>
      </main>
    </div>
  </div>;
}

function PageHeading({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy: string; action?: React.ReactNode }) { return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{copy}</p></div>{action}</div>; }

function Dashboard({ role, name, go, live, query }: { role: Role; name: string; go: (s: Section) => void; live: ReturnType<typeof useHackathonFeed>; query: string }) {
  const events = (live.feed?.events ?? []).filter(event => [event.title, event.host, ...event.tags].join(" ").toLowerCase().includes(query.toLowerCase())).slice(0, 3);
  return <>
    <div className="section-kicker"><span className="live-dot" /> Your campus, in focus <span>Make room for what’s next.</span></div>
    <section className="welcome-panel"><div><span className="welcome-badge"><Sparkles size={14} /> A world of possibilities</span><h1>Hello, {name.split(" ")[0]}.<br /><span>Find your next spark.</span></h1><p>Ideas worth building. People worth meeting.<br />Your next chapter starts right here.</p><div className="welcome-actions"><button className="primary-button" onClick={() => go("hackathons")}>Explore opportunities <ArrowUpRight size={16} /></button><button className="text-button" onClick={() => go("clubs")}>Find your community <ChevronRight size={16} /></button></div></div><div className="hero-orbits" aria-hidden="true"><div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" /><div className="orbit-ring ring-three" /><span className="orbit-core"><GraduationCap size={43} strokeWidth={1.2} /></span><span className="orbit-node node-one"><Trophy size={21} /></span><span className="orbit-node node-two"><Microscope size={20} /></span><span className="orbit-node node-three"><UsersRound size={21} /></span></div></section>
    <section className="metric-grid"><Metric icon={Trophy} label="Open opportunities" value={live.feed ? String(live.feed.events.length).padStart(2, "0") : "—"} note="From live event listings" /><Metric icon={Microscope} label="Faculty network" value={String(facultyData.length)} note="From the SRM directory" /><Metric icon={UsersRound} label="Campus communities" value="09" note="Find where you belong" /></section>
    <section className="panel opportunity-panel"><div className="panel-title"><div><p className="eyebrow">Go build something</p><h2>On your radar</h2></div><button className="text-button" onClick={() => go("hackathons")}>All opportunities <ArrowUpRight size={16} /></button></div><div className="compact-list">{events.map(event => <a key={event.id} href={event.href} target="_blank" rel="noreferrer" className="compact-event"><span className={"event-tile " + event.source.toLowerCase()}><Trophy size={24} /></span><span><strong>{event.title}</strong><small>{event.source} · {event.mode} · {event.deadline ? "Apply by " + eventDate(event.deadline) : "Starts " + eventDate(event.startsAt)}</small></span><ArrowUpRight size={18} /></a>)}{live.loading && !live.feed && <p className="feed-message">Finding current hackathons…</p>}{live.error && <p className="feed-message" role="alert">{live.error}</p>}{live.feed && !events.length && <p className="feed-message">No open opportunities match your search.</p>}</div></section>
    <div className="explore-grid"><button className="explore-card research" onClick={() => go("faculty")}><span><Microscope size={26} /></span><div><small>Knowledge, shared</small><h2>Meet your mentors.</h2><p>Explore the faculty research network.</p></div><ArrowUpRight size={21} /></button><button className="explore-card community" onClick={() => go("clubs")}><span><UsersRound size={26} /></span><div><small>Better, together</small><h2>Find your people.</h2><p>Nine communities. Endless possibilities.</p></div><ArrowUpRight size={21} /></button></div>
    {role === "Admin" && <button className="text-button" onClick={() => go("admin")}>Open administration console <ChevronRight size={16} /></button>}
  </>;
}

function Hackathons({ live, query, bookmarks, savedOnly, now }: { live: ReturnType<typeof useHackathonFeed>; query: string; bookmarks:ReturnType<typeof useBookmarks>; savedOnly:boolean; now:number }) {
  const [filter, setFilter] = useState("All events");
  const [location, setLocation] = useState("all");
  const [sort,setSort]=useState("deadline");
  const available = savedOnly ? bookmarks.saved.map(item=>live.feed?.events.find(event=>event.id===item.event.id)??item.event) : live.feed?.events??[];
  const cities = [...new Set(available.filter(event => event.mode !== "Online" && event.location?.trim()).map(event => event.location!.trim()))].sort((a, b) => a.localeCompare(b));
  const events = sortHackathons(available.filter(event => (filter === "All events" || event.source === filter || event.mode === filter) &&
    (location === "all" || (location === "online" ? event.mode === "Online" : location === "unknown" ? event.mode !== "Online" && !event.location : event.mode !== "Online" && event.location?.trim() === location)) &&
    [event.title, event.host, event.location ?? "", ...event.tags].join(" ").toLowerCase().includes(query.trim().toLowerCase())),sort);
  return <><PageHeading eyebrow="Build your next chapter" title={savedOnly?"Saved hackathons":"Hackathons"} copy={savedOnly?"Your shortlist, saved to your account. Set reminders and keep track of registration deadlines.":"Fresh opportunities for curious minds. Find a challenge and make something that matters."} action={<button className="secondary-button" disabled={live.loading} onClick={() => {void live.refresh();void bookmarks.refresh();}}><RefreshCw size={16} className={live.loading ? "spinning" : ""} /> {live.loading ? "Refreshing" : "Refresh"}</button>} />
    {bookmarks.error&&<p className="provider-notice" role="alert">{bookmarks.error}<button className="text-button" onClick={()=>void bookmarks.refresh()}>Retry saved events</button></p>}
    <div className="feed-status"><span><i className="live-dot" /> Auto-refreshes every 5 minutes</span><span>{live.feed ? "Updated " + new Date(live.feed.fetchedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) + " IST" : "Connecting to providers"}</span></div>
    {live.feed?.providers.filter(provider => provider.status === "unavailable").map(provider => <p className="provider-notice" key={provider.name}>{provider.name} is temporarily unavailable. <a href={provider.name === "Unstop" ? "https://unstop.com/hackathons" : "https://devfolio.co/hackathons"} target="_blank" rel="noreferrer">Browse {provider.name} <ExternalLink size={12} /></a></p>)}
    {live.error && <p className="provider-notice" role="alert">{live.error}{live.feed && " Showing the last successful results."}</p>}
    <div className="filter-row">{["All events", "Online", "Offline", "Hybrid", "Unstop", "Devfolio"].map(item => <button key={item} aria-pressed={filter === item} className={filter === item ? "filter-chip active" : "filter-chip"} onClick={() => setFilter(item)}>{item}</button>)}</div>
    <div className="location-filter"><label><MapPin size={16} /><span>Location</span><select aria-label="Location" value={location} onChange={event => setLocation(event.target.value)}><option value="all">All locations</option><option value="online">Online · join anywhere</option><option value="unknown">Venue not listed</option>{cities.map(city => <option key={city} value={city}>{city}</option>)}{!["all", "online", "unknown", ...cities].includes(location) && <option value={location}>{location}</option>}</select></label><span role="status">{events.length} matching hackathons</span>{(location !== "all" || filter !== "All events") && <button className="text-button" onClick={() => { setLocation("all"); setFilter("All events"); }}>Reset filters</button>}</div>
    <div className="sort-control"><label>Sort by<select aria-label="Sort hackathons" value={sort} onChange={e=>setSort(e.target.value)}><option value="deadline">Registration deadline · soonest first</option><option value="start">Start date · soonest first</option><option value="title">Name · A–Z</option></select></label><span>Unknown dates appear last.</span></div>
    <div className="card-grid">{events.map((event, index) => <article className="event-card" key={event.id}><div className={"event-art art-" + (index % 4)}><span>{event.source}</span><Trophy size={47} strokeWidth={1} /><small>{event.tags[0] ?? "Build. Learn. Connect."}</small></div><div className="event-body"><div className="event-top"><span className="source-badge">{event.source}</span><span className="event-mode">{event.mode === "Online" ? <Wifi size={12} /> : <MapPin size={12} />}{event.mode}</span></div><h2>{event.title}</h2><p>{event.host}</p><p className="event-location"><MapPin size={13} />{event.mode === "Online" ? "Online · join anywhere" : event.location || "Venue not listed · check event page"}</p><div className="tag-row">{event.tags.slice(0, 3).map(tag => <span key={tag}>{tag}</span>)}</div><dl><div><dt>Starts</dt><dd>{eventDate(event.startsAt)}</dd></div><div><dt>Apply by</dt><dd>{eventDate(event.deadline)}</dd></div></dl><a className="secondary-button full" href={event.href} target="_blank" rel="noreferrer">View on {event.source} <ArrowUpRight size={16} /></a><BookmarkActions event={event} bookmarks={bookmarks} now={now}/></div></article>)}</div>
    {live.loading && !live.feed && <div className="loading-grid">{[0, 1, 2].map(item => <div className="event-skeleton" key={item} />)}</div>}
    {(savedOnly?bookmarks.ready:Boolean(live.feed)) && !events.length && !live.error && <div className="empty-clubs"><Trophy size={26} /><strong>{savedOnly?"No saved hackathons in this view":"No open hackathons match this view"}</strong><span>{savedOnly?"Save an event from Hackathons or reset your filters.":"Try another filter or refresh the feed."}</span></div>}
  </>;
}

function UserSettings({ viewer, role, theme, toggleTheme, onSignOut }: { viewer: { name: string; email: string; authenticated: boolean }; role: Role; theme: "light" | "dark"; toggleTheme: () => void; onSignOut: () => void }) {
  const [tab, setTab] = useState("My portfolio");
  return <><PageHeading eyebrow="Make yourself at home" title="User settings" copy="Your profile, your preferences, your space." /><div className="settings-tabs" role="tablist" aria-label="User settings">{["My portfolio", "Appearance", "Account"].map(item => <button key={item} role="tab" aria-selected={tab === item} aria-controls="settings-content" className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}</div><div id="settings-content" role="tabpanel" aria-label={tab}>{tab === "My portfolio" && <Portfolio viewer={viewer} role={role} />}{tab === "Appearance" && <section className="panel settings-panel"><h2>A space that feels like you.</h2><p>Choose a light or dark appearance. Your choice is saved on this device.</p><div className="appearance-options">{(["light", "dark"] as const).map(mode => <button key={mode} className={theme === mode ? "appearance-choice selected" : "appearance-choice"} aria-pressed={theme === mode} onClick={() => { if (theme !== mode) toggleTheme(); }}><span className={"appearance-preview " + mode}><i /><i /><i /></span><strong>{mode === "light" ? <Sun size={16} /> : <Moon size={16} />}{mode === "light" ? "Light" : "Dark"}{theme === mode && <CheckCircle2 size={16} />}</strong></button>)}</div><div className="settings-row"><span><strong>Typography</strong><small>SF Pro Display</small></span><span>Apple SF Pro</span></div></section>}{tab === "Account" && <section className="panel settings-panel"><h2>Your account</h2><div className="settings-row"><span>Name</span><strong>{viewer.name}</strong></div><div className="settings-row"><span>Email</span><strong>{viewer.email}</strong></div><div className="settings-row"><span>Portal</span><strong>{role}</strong></div><button className="secondary-button" onClick={onSignOut}><LogOut size={16} /> Sign out</button></section>}</div></>;
}

function Clubs({ clubs, filter, setFilter }: { clubs: typeof clubData; filter: string; setFilter: (s: string) => void }) {
  const filters = ["All", "Technical", "Creative", "Media", "Management", "Security"];
  return <><PageHeading eyebrow="Campus life" title="Clubs & events" copy={`${clubData.length} student-led communities across technology, media, design, management and research.`} /><div className="filter-row">{filters.map(f => <button key={f} className={filter === f ? "filter-chip active" : "filter-chip"} onClick={() => setFilter(f)}>{f}</button>)}</div><div className="club-grid">{clubs.map((club) => <article className="club-card" key={club.name}><div className={`club-monogram ${club.tone}`}>{club.initials}</div><div className="club-title"><div><span>Student club</span><h2>{club.name}</h2></div></div><div className="club-domains" aria-label={`${club.name} domains`}>{club.domains.map((domain) => <span key={domain}>{domain}</span>)}</div><dl><div><dt>President</dt><dd>{club.president}</dd></div><div><dt>Vice President</dt><dd>{club.vicePresident}</dd></div><div><dt>Secretary</dt><dd>{club.secretary}</dd></div><div><dt>{club.extraRole}</dt><dd>{club.extraName}</dd></div></dl><footer><span><UsersRound size={16} /> Leadership details</span><span>{club.domains.length} domains</span></footer></article>)}</div>{clubs.length === 0 && <div className="empty-clubs"><Search size={22}/><strong>No clubs match this filter</strong><span>Try another domain or clear the search.</span></div>}</>;
}

function Faculty({ query = "" }: { query?: string }) {
  const [department, setDepartment] = useState("All");
  const departments = ["All", ...new Set(facultyData.map(person => person.department))];
  const search = query.trim().toLowerCase();
  const people = facultyData.filter(person =>
    (department === "All" || person.department === department) &&
    [person.name, person.designation, person.department, person.qualification, person.email].join(" ").toLowerCase().includes(search)
  );
  return <>
    <PageHeading eyebrow="Knowledge network" title="Faculty research"
      copy={`${facultyData.length} faculty from SRM Ramapuram’s official directory. Explore their qualifications and linked faculty profiles.`}
      action={<a className="secondary-button" href={facultyDirectory.sourceUrl} target="_blank" rel="noreferrer">Official directory <ExternalLink size={16} /></a>} />
    <p className="faculty-source-note">Imported on 28 September 2026 · Use the search above to find faculty by name, department or email.</p>
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
          {person.profileUrl ? <a className="secondary-button full" href={person.profileUrl} target="_blank" rel="noreferrer">View faculty profile <ExternalLink size={15} /></a> : <span className="faculty-profile-unavailable">Profile not linked in the directory</span>}
        </div>
      </article>;
    })}</div>
    {people.length === 0 && <div className="empty-clubs"><Search size={22} /><strong>No faculty match your search</strong><span>Try another name or department, or clear the search.</span></div>}
  </>;
}


function Admin() {
  const initialRows = [["AI Research Symposium","Dr. Meera Raman","Event"],["National Coding Challenge","Pranav Iyer","Achievement"],["Robotics Workshop","Code Excellence","Event"]];
  const [approved, setApproved] = useState<string[]>([]);
  const readiness = [["University SSO","Awaiting identity-provider details"],["Official roster import","Schema ready; university export required"],["Data retention policy","Requires university approval"],["External event APIs","Provider credentials required"]];
  return <><PageHeading eyebrow="Restricted area" title="Administration console" copy="Review access, content approvals and system security." /><div className="security-banner"><ShieldCheck size={21} /><div><strong>Security status: local demonstration</strong><p>Role mismatch protection active · Production SSO and MFA still require university configuration</p></div><button>View audit log</button></div><section className="metric-grid admin-metrics"><Metric icon={UsersRound} label="Demo accounts" value="03" note="One account per role" /><Metric icon={CheckCircle2} label="Pending approvals" value={String(initialRows.length-approved.length).padStart(2,"0")} note="Demo approval queue" /><Metric icon={LockKeyhole} label="Access reviews" value="01" note="Required before release" /><Metric icon={ShieldCheck} label="Security alerts" value="00" note="Current local session" /></section><section className="panel admin-table"><div className="panel-title"><div><p className="eyebrow">Approval queue</p><h2>Items needing review</h2></div></div><div className="table-row table-head"><span>Item</span><span>Submitted by</span><span>Type</span><span>Status</span><span /></div>{initialRows.map((row) => <div className="table-row" key={row[0]}><strong>{row[0]}</strong><span>{row[1]}</span><span>{row[2]}</span>{approved.includes(row[0]) ? <span className="verified"><CheckCircle2 size={14}/>Approved</span> : <span className="pending">Needs review</span>}<button disabled={approved.includes(row[0])} onClick={()=>setApproved(items=>[...items,row[0]])}>{approved.includes(row[0]) ? "Complete" : "Approve"}</button></div>)}</section><section className="panel readiness-panel"><div className="panel-title"><div><p className="eyebrow">Launch controls</p><h2>Production dependencies</h2></div></div>{readiness.map(([item,note])=><div className="readiness-row" key={item}><span className="readiness-status"/><div><strong>{item}</strong><p>{note}</p></div><span>Blocked</span></div>)}</section></>;
}








