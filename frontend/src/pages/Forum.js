import React, { useState, useRef, useEffect } from "react";

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const AssignmentsIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
    <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/>
  </svg>
);
const NotesIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M11 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6"/>
    <path d="M17.5 2.5a2.121 2.121 0 0 1 3 3L12 14l-4 1 1-4 7.5-7.5z"/>
  </svg>
);
const DoubtsIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
    <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" strokeWidth="2.5"/>
  </svg>
);
const ProjectsIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/>
    <polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
  </svg>
);
const ExamsIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const UpvoteIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15"/>
  </svg>
);
const ReplyCountIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const PlusIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const SearchIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const BackIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const AttachIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
  </svg>
);
const FileIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
  </svg>
);
const XIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

// ── Config ────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "Assignments", Icon: AssignmentsIcon, desc: "Homework & classwork" },
  { id: "Notes",       Icon: NotesIcon,       desc: "Study notes & summaries" },
  { id: "Doubts",      Icon: DoubtsIcon,      desc: "Questions & answers" },
  { id: "Projects",    Icon: ProjectsIcon,    desc: "Group projects" },
  { id: "Exams",       Icon: ExamsIcon,       desc: "Exam prep & tips" },
];

const INITIAL_THREADS = {
  Assignments: [
    { id: 1, title: "Need DBMS Unit 3 notes — normalization is killing me", author: "Tanvi", avatar: "T", body: "Does anyone have clean notes for Unit 3? Particularly the normalization part is confusing me. Boyce-Codd and 3NF examples would really help.", replies: [{ id: 1, author: "Ravi", avatar: "R", body: "I have some, will share in a bit!", time: "2h ago", upvotes: 3, files: [] }, { id: 2, author: "Priya", avatar: "P", body: "Check the college drive folder, I uploaded mine last week.", time: "1h ago", upvotes: 7, files: [] }], time: "3h ago", upvotes: 12, tag: "Help", files: [] },
    { id: 2, title: "How to prepare for internals in under 4 days?", author: "Edward", avatar: "E", body: "Internals are in 4 days and I have barely started. Any fast-track strategies from people who've been here before?", replies: [{ id: 1, author: "Sara", avatar: "S", body: "PYQs are your best friend right now. Do the last 3 years minimum.", time: "45m ago", upvotes: 11, files: [] }], time: "5h ago", upvotes: 8, tag: "Strategy", files: [] },
    { id: 5, title: "CN assignment — subnetting questions", author: "Kiran", avatar: "K", body: "Struggling with the subnetting portion of the CN assignment. Anyone want to study together?", replies: [], time: "1h ago", upvotes: 4, tag: "CN", files: [] },
  ],
  Notes: [
    { id: 3, title: "OS Chapter 5 — Memory Management Summary", author: "Mihir", avatar: "M", body: "Sharing my condensed notes on paging and segmentation. Covers virtual memory, page replacement algorithms, and fragmentation. Hope it helps!", replies: [], time: "1d ago", upvotes: 24, tag: "Resource", files: [] },
    { id: 6, title: "Data Structures — Trees & Graphs cheatsheet", author: "Neha", avatar: "N", body: "Made a one-page cheatsheet for DS. Covers BFS, DFS, AVL rotations, and Dijkstra's. Sharing here.", replies: [{ id: 1, author: "Raj", avatar: "R", body: "This is super helpful, thank you!", time: "3h ago", upvotes: 9, files: [] }], time: "2d ago", upvotes: 31, tag: "Cheatsheet", files: [] },
  ],
  Doubts: [
    { id: 4, title: "Confused about double pointers in C", author: "Aarav", avatar: "A", body: "Can someone explain double pointers with a real example? The textbook explanation makes no sense to me.", replies: [{ id: 1, author: "Dev", avatar: "D", body: "Think of it as a pointer to a pointer. Like an address of an address book — you're storing where the address book is, not the address itself.", time: "30m ago", upvotes: 5, files: [] }], time: "2h ago", upvotes: 6, tag: "C", files: [] },
  ],
  Projects: [],
  Exams: [],
};

const ACCEPT = "image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip";
const AVATAR_COLORS = ["#5865F2","#3d8b6e","#9b6e2e","#7b4dca","#b03030","#1a7fa0","#b05020"];

const Avatar = ({ char, size = 38 }) => {
  const bg = AVATAR_COLORS[char.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
      {char}
    </div>
  );
};

const Tag = ({ label }) => (
  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: "#101828", color: "#818cf8", border: "1px solid #1e2a45", whiteSpace: "nowrap" }}>
    {label}
  </span>
);

const UpvoteBtn = ({ count, voted, onVote, small }) => (
  <button onClick={e => { e.stopPropagation(); onVote(); }}
    style={{ display: "flex", alignItems: "center", gap: 5, background: voted ? "#1a1f3a" : "transparent", border: `1px solid ${voted ? "#3d4a8a" : "#1e1e1e"}`, borderRadius: 6, padding: small ? "4px 10px" : "5px 12px", color: voted ? "#818cf8" : "#444", cursor: "pointer", fontSize: small ? 12 : 13, fontWeight: 600, fontFamily: "inherit" }}>
    <UpvoteIcon size={small ? 11 : 12} /> {count}
  </button>
);

const FileChip = ({ file, onRemove }) => {
  const isImage = file.type?.startsWith("image/");
  const isVideo = file.type?.startsWith("video/");
  const name = file.name || file.fileName || "file";
  const url = file.url || null;
  if (isImage && url) return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <img src={url} alt={name} style={{ maxWidth: 140, maxHeight: 100, borderRadius: 8, display: "block", border: "1px solid #1e1e1e", cursor: "pointer" }} onClick={() => window.open(url, "_blank")} />
      {onRemove && <button onClick={onRemove} style={{ position: "absolute", top: 4, right: 4, background: "#111", border: "1px solid #333", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#aaa", padding: 0 }}><XIcon size={10} /></button>}
    </div>
  );
  if (isVideo && url) return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <video src={url} controls style={{ maxWidth: 200, maxHeight: 120, borderRadius: 8, display: "block", border: "1px solid #1e1e1e" }} />
      {onRemove && <button onClick={onRemove} style={{ position: "absolute", top: 4, right: 4, background: "#111", border: "1px solid #333", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#aaa", padding: 0 }}><XIcon size={10} /></button>}
    </div>
  );
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#0e0e0e", border: "1px solid #1e1e1e", borderRadius: 8, padding: "6px 10px", fontSize: 12, color: "#888", maxWidth: 200 }}>
      <FileIcon />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
        {url ? <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "#818cf8", textDecoration: "none" }}>{name}</a> : name}
      </span>
      {onRemove && <button onClick={onRemove} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}><XIcon size={11} /></button>}
    </div>
  );
};

const AttachedFiles = ({ files }) => {
  if (!files || files.length === 0) return null;
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>{files.map((f, i) => <FileChip key={i} file={f} />)}</div>;
};

const AttachButton = ({ onFiles }) => {
  const ref = useRef();
  const handleChange = (e) => {
    const picked = Array.from(e.target.files);
    if (!picked.length) return;
    onFiles(picked.map(f => ({ file: f, name: f.name, fileName: f.name, type: f.type, url: URL.createObjectURL(f) })));
    e.target.value = "";
  };
  return (
    <>
      <input ref={ref} type="file" multiple accept={ACCEPT} style={{ display: "none" }} onChange={handleChange} />
      <button type="button" onClick={() => ref.current?.click()}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "1px solid #1e1e1e", borderRadius: 7, padding: "7px 12px", color: "#555", cursor: "pointer", fontSize: 12, fontWeight: 500, fontFamily: "inherit" }}>
        <AttachIcon size={14} /> Attach
      </button>
    </>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Forum() {
  const [activeCategory, setActiveCategory] = useState("Assignments");
  const [threads, setThreads]               = useState(INITIAL_THREADS);
  const [view, setView]                     = useState("list");
  const [selectedThread, setSelectedThread] = useState(null);
  const [newTitle, setNewTitle]             = useState("");
  const [newBody, setNewBody]               = useState("");
  const [newPostFiles, setNewPostFiles]     = useState([]);
  const [newReply, setNewReply]             = useState("");
  const [newReplyFiles, setNewReplyFiles]   = useState([]);
  const [votedThreads, setVotedThreads]     = useState({});
  const [votedReplies, setVotedReplies]     = useState({});
  const [search, setSearch]                 = useState("");
  const [isMobile, setIsMobile]             = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const currentThreads = (threads[activeCategory] || []).filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.body?.toLowerCase().includes(search.toLowerCase()) ||
    t.author.toLowerCase().includes(search.toLowerCase())
  );

  const openThread = (thread) => { setSelectedThread(thread); setView("thread"); };
  const goBack = () => { setView("list"); };

  const handlePost = () => {
    if (!newTitle.trim()) return;
    const thread = { id: Date.now(), title: newTitle, body: newBody, author: "You", avatar: "Y", replies: [], time: "just now", upvotes: 0, tag: activeCategory, files: newPostFiles };
    setThreads(p => ({ ...p, [activeCategory]: [thread, ...p[activeCategory]] }));
    setNewTitle(""); setNewBody(""); setNewPostFiles([]);
    setSelectedThread(thread); setView("thread");
  };

  const handleReply = () => {
    if (!newReply.trim() && newReplyFiles.length === 0) return;
    const reply = { id: Date.now(), author: "You", avatar: "Y", body: newReply, time: "just now", upvotes: 0, files: newReplyFiles };
    const updated = { ...selectedThread, replies: [...selectedThread.replies, reply] };
    setThreads(p => ({ ...p, [activeCategory]: p[activeCategory].map(t => t.id === selectedThread.id ? updated : t) }));
    setSelectedThread(updated); setNewReply(""); setNewReplyFiles([]);
  };

  const voteThread = (id) => {
    if (votedThreads[id]) return;
    setVotedThreads(p => ({ ...p, [id]: true }));
    setThreads(p => ({ ...p, [activeCategory]: p[activeCategory].map(t => t.id === id ? { ...t, upvotes: t.upvotes + 1 } : t) }));
    if (selectedThread?.id === id) setSelectedThread(p => ({ ...p, upvotes: p.upvotes + 1 }));
  };

  const voteReply = (threadId, replyId) => {
    const key = `${threadId}-${replyId}`;
    if (votedReplies[key]) return;
    setVotedReplies(p => ({ ...p, [key]: true }));
    const updated = { ...selectedThread, replies: selectedThread.replies.map(r => r.id === replyId ? { ...r, upvotes: r.upvotes + 1 } : r) };
    setThreads(p => ({ ...p, [activeCategory]: p[activeCategory].map(t => t.id === threadId ? updated : t) }));
    setSelectedThread(updated);
  };

  const switchCategory = (id) => {
    setActiveCategory(id); setSelectedThread(null); setSearch(""); setView("list");
  };

  const pad = isMobile ? "16px" : "28px";
  const activeCat = CATEGORIES.find(c => c.id === activeCategory);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: #1e1e1e; border-radius: 4px; }
        .thread-row:hover { background: #111 !important; border-color: #222 !important; }
        .compose-btn:hover { background: #4048b0 !important; }
        .reply-btn:hover { background: #4048b0 !important; }
        input:focus, textarea:focus { border-color: #2a2a2a !important; outline: none; }
        .cat-pill:hover { color: #ccc !important; border-color: #333 !important; }
        .forum-fab { box-shadow: 0 4px 20px rgba(88,101,242,0.4); }
        .forum-fab:active { transform: scale(0.95); }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#090909", fontFamily: "'DM Sans', sans-serif", color: "#c8c8c8", overflow: "hidden" }}>

        {/* ── DESKTOP: Top tab bar ── */}
        {!isMobile && (
          <div style={{ borderBottom: "1px solid #141414", padding: "0 28px", display: "flex", alignItems: "center", minHeight: 56, flexShrink: 0, gap: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, overflowX: "auto" }}>
              {CATEGORIES.map(({ id, Icon }) => {
                const active = activeCategory === id;
                const count = (threads[id] || []).length;
                return (
                  <button key={id} className="cat-pill"
                    onClick={() => switchCategory(id)}
                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 14px", borderRadius: 7, cursor: "pointer", background: active ? "#151515" : "transparent", border: `1px solid ${active ? "#222" : "transparent"}`, color: active ? "#fff" : "#444", fontSize: 13, fontWeight: active ? 600 : 400, transition: "all 0.15s", whiteSpace: "nowrap", fontFamily: "inherit", flexShrink: 0 }}>
                    <Icon size={14} />{id}
                    {count > 0 && <span style={{ fontSize: 10, fontWeight: 700, background: active ? "#222" : "#141414", color: "#444", padding: "1px 5px", borderRadius: 5 }}>{count}</span>}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, marginLeft: 16 }}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#333", display: "flex" }}><SearchIcon /></span>
                <input value={search} onChange={e => { setSearch(e.target.value); setView("list"); }}
                  placeholder="Search threads..."
                  style={{ background: "#0e0e0e", border: "1px solid #181818", borderRadius: 7, padding: "7px 12px 7px 30px", color: "#c8c8c8", fontSize: 13, width: 200, fontFamily: "inherit", outline: "none" }} />
              </div>
              <button className="compose-btn" onClick={() => { setView("compose"); setSelectedThread(null); }}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "#5865F2", border: "none", color: "#fff", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
                <PlusIcon /> New Post
              </button>
            </div>
          </div>
        )}

        {/* ── MOBILE: Top header bar ── */}
        {isMobile && (
          <div style={{ borderBottom: "1px solid #141414", padding: "0 16px", display: "flex", alignItems: "center", minHeight: 52, flexShrink: 0, gap: 10 }}>
            {(view === "thread" || view === "compose") ? (
              <>
                <button onClick={goBack} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", padding: "4px 8px 4px 0", display: "flex" }}>
                  <BackIcon size={20} />
                </button>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#e8e8e8", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {view === "compose" ? "New Post" : selectedThread?.title?.length > 28 ? selectedThread?.title?.substring(0, 28) + "…" : selectedThread?.title}
                </span>
              </>
            ) : (
              <>
                <span style={{ fontSize: 17, fontWeight: 700, color: "#e8e8e8", flex: 1 }}>Forum</span>
                <button onClick={() => { setView("compose"); setSelectedThread(null); }}
                  style={{ display: "flex", alignItems: "center", gap: 5, background: "#5865F2", border: "none", color: "#fff", borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                  <PlusIcon size={12} /> New Post
                </button>
              </>
            )}
          </div>
        )}

        {/* ── MOBILE: Horizontal scrollable category pills (only on list view) ── */}
        {isMobile && view === "list" && (
          <div style={{ borderBottom: "1px solid #141414", padding: "10px 16px", display: "flex", gap: 8, overflowX: "auto", flexShrink: 0, WebkitOverflowScrolling: "touch" }}>
            {CATEGORIES.map(({ id, Icon }) => {
              const active = activeCategory === id;
              const count = (threads[id] || []).length;
              return (
                <button key={id}
                  onClick={() => switchCategory(id)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 20, cursor: "pointer", background: active ? "#5865F2" : "#111", border: `1px solid ${active ? "#5865F2" : "#222"}`, color: active ? "#fff" : "#555", fontSize: 13, fontWeight: active ? 700 : 500, whiteSpace: "nowrap", fontFamily: "inherit", flexShrink: 0, transition: "all 0.15s" }}>
                  <Icon size={13} />
                  {id}
                  {count > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, background: active ? "rgba(255,255,255,0.2)" : "#1a1a1a", color: active ? "#fff" : "#444", padding: "1px 6px", borderRadius: 10, marginLeft: 2 }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ── MOBILE: Search bar (only on list view) ── */}
        {isMobile && view === "list" && (
          <div style={{ padding: "10px 16px", borderBottom: "1px solid #0e0e0e", flexShrink: 0 }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#333", display: "flex" }}><SearchIcon size={15} /></span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search threads..."
                style={{ width: "100%", background: "#0e0e0e", border: "1px solid #181818", borderRadius: 10, padding: "9px 14px 9px 34px", color: "#c8c8c8", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
        )}

        {/* ── Body ── */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>

          {/* LIST VIEW */}
          {view === "list" && (
            <div style={{ flex: 1, overflowY: "auto", padding: `16px ${pad}` }}>
              {!isMobile && (
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: "#e8e8e8", margin: 0, marginBottom: 4 }}>{activeCategory}</h2>
                  <p style={{ fontSize: 13, color: "#333", margin: 0 }}>{activeCat?.desc}</p>
                </div>
              )}

              {isMobile && (
                <div style={{ marginBottom: 14 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: "#e8e8e8", margin: 0, marginBottom: 2 }}>{activeCategory}</h2>
                  <p style={{ fontSize: 12, color: "#333", margin: 0 }}>{activeCat?.desc}</p>
                </div>
              )}

              {currentThreads.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", gap: 14 }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1e1e1e" strokeWidth="1.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#222" }}>No threads yet</div>
                  <div style={{ fontSize: 13, color: "#1a1a1a" }}>Be the first to start a discussion</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 8 : 10 }}>
                  {currentThreads.map(thread => (
                    <div key={thread.id} className="thread-row"
                      onClick={() => openThread(thread)}
                      style={{ background: "#0d0d0d", border: "1px solid #161616", borderRadius: isMobile ? 10 : 12, padding: isMobile ? "14px 16px" : "18px 20px", cursor: "pointer", transition: "all 0.15s", display: "flex", gap: isMobile ? 12 : 16, alignItems: "flex-start" }}>
                      <Avatar char={thread.avatar} size={isMobile ? 36 : 42} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 5 }}>
                          <div style={{ fontSize: isMobile ? 14 : 15, fontWeight: 600, color: "#e0e0e0", lineHeight: 1.4 }}>{thread.title}</div>
                          {thread.tag && <Tag label={thread.tag} />}
                        </div>
                        {thread.body && (
                          <div style={{ fontSize: isMobile ? 12 : 13, color: "#555", lineHeight: 1.6, marginBottom: 8, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: isMobile ? 1 : 2, WebkitBoxOrient: "vertical" }}>
                            {thread.body}
                          </div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 12, color: "#333", fontWeight: 500 }}>{thread.author}</span>
                          <span style={{ fontSize: 12, color: "#252525" }}>·</span>
                          <span style={{ fontSize: 12, color: "#333" }}>{thread.time}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#333" }}>
                            <ReplyCountIcon size={12} /> {thread.replies.length}
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#333" }}>
                            <UpvoteIcon size={11} /> {thread.upvotes}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* THREAD DETAIL VIEW */}
          {view === "thread" && selectedThread && (
            <div style={{ flex: 1, overflowY: "auto", padding: `16px ${pad}` }}>
              <div style={{ maxWidth: 760, margin: "0 auto" }}>
                {!isMobile && (
                  <button onClick={goBack}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "1px solid #181818", color: "#555", borderRadius: 7, padding: "6px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer", marginBottom: 24, fontFamily: "inherit" }}>
                    <BackIcon /> Back to {activeCategory}
                  </button>
                )}

                <div style={{ marginBottom: 20 }}>
                  {selectedThread.tag && <div style={{ marginBottom: 10 }}><Tag label={selectedThread.tag} /></div>}
                  <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: "#eee", lineHeight: 1.4, margin: "0 0 14px" }}>{selectedThread.title}</h1>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <Avatar char={selectedThread.avatar} size={34} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#d8d8d8" }}>{selectedThread.author}</div>
                      <div style={{ fontSize: 12, color: "#333" }}>{selectedThread.time}</div>
                    </div>
                  </div>
                  {selectedThread.body && (
                    <div style={{ fontSize: 14, color: "#999", lineHeight: 1.75, background: "#0d0d0d", border: "1px solid #161616", borderRadius: 10, padding: isMobile ? "14px 16px" : "16px 20px", marginBottom: 12 }}>
                      {selectedThread.body}
                    </div>
                  )}
                  <AttachedFiles files={selectedThread.files} />
                  <div style={{ marginTop: 14 }}>
                    <UpvoteBtn count={selectedThread.upvotes} voted={votedThreads[selectedThread.id]} onVote={() => voteThread(selectedThread.id)} small={isMobile} />
                  </div>
                </div>

                {/* Replies */}
                <div style={{ borderTop: "1px solid #141414", paddingTop: 20, marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#2a2a2a", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 18 }}>
                    {selectedThread.replies.length} {selectedThread.replies.length === 1 ? "Reply" : "Replies"}
                  </div>
                  {selectedThread.replies.map(reply => (
                    <div key={reply.id} style={{ display: "flex", gap: isMobile ? 10 : 14, marginBottom: 20 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <Avatar char={reply.avatar} size={isMobile ? 28 : 32} />
                        <div style={{ flex: 1, width: 1, background: "#161616", margin: "8px 0 0" }} />
                      </div>
                      <div style={{ flex: 1, paddingBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#d8d8d8" }}>{reply.author}</span>
                          <span style={{ fontSize: 11, color: "#2a2a2a" }}>{reply.time}</span>
                        </div>
                        {reply.body && <div style={{ fontSize: isMobile ? 13 : 14, color: "#888", lineHeight: 1.7, marginBottom: 8 }}>{reply.body}</div>}
                        <AttachedFiles files={reply.files} />
                        <div style={{ marginTop: reply.files?.length ? 10 : 0 }}>
                          <UpvoteBtn count={reply.upvotes} voted={votedReplies[`${selectedThread.id}-${reply.id}`]} onVote={() => voteReply(selectedThread.id, reply.id)} small={isMobile} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply box */}
                <div style={{ background: "#0d0d0d", border: "1px solid #161616", borderRadius: 12, padding: isMobile ? "14px 16px" : "18px 20px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#2a2a2a", letterSpacing: 1.3, textTransform: "uppercase", marginBottom: 12 }}>Write a Reply</div>
                  <textarea value={newReply} onChange={e => setNewReply(e.target.value)} placeholder="Share your thoughts..."
                    rows={isMobile ? 3 : 4}
                    style={{ width: "100%", background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 8, padding: "12px 14px", color: "#d0d0d0", fontSize: 14, fontFamily: "inherit", resize: "none", lineHeight: 1.65, marginBottom: 10, display: "block", outline: "none", boxSizing: "border-box" }} />
                  {newReplyFiles.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                      {newReplyFiles.map((f, i) => <FileChip key={i} file={f} onRemove={() => setNewReplyFiles(p => p.filter((_, idx) => idx !== i))} />)}
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <AttachButton onFiles={files => setNewReplyFiles(p => [...p, ...files])} />
                    <button className="reply-btn" onClick={handleReply}
                      disabled={!newReply.trim() && newReplyFiles.length === 0}
                      style={{ background: (newReply.trim() || newReplyFiles.length > 0) ? "#5865F2" : "#141414", border: "none", color: (newReply.trim() || newReplyFiles.length > 0) ? "#fff" : "#2a2a2a", borderRadius: 8, padding: "9px 22px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                      Post Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* COMPOSE VIEW */}
          {view === "compose" && (
            <div style={{ flex: 1, overflowY: "auto", padding: `16px ${pad}` }}>
              <div style={{ maxWidth: 720, margin: "0 auto" }}>
                {!isMobile && (
                  <button onClick={goBack}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "1px solid #181818", color: "#555", borderRadius: 7, padding: "6px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer", marginBottom: 28, fontFamily: "inherit" }}>
                    <BackIcon /> Cancel
                  </button>
                )}

                <div style={{ marginBottom: isMobile ? 20 : 28 }}>
                  <h2 style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, color: "#e8e8e8", margin: "0 0 4px" }}>Create a Post</h2>
                  <p style={{ fontSize: 13, color: "#333", margin: 0 }}>Posting in <span style={{ color: "#818cf8" }}>{activeCategory}</span></p>
                </div>

                {/* Category selector in compose view on mobile */}
                {isMobile && (
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#333", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Category</label>
                    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
                      {CATEGORIES.map(({ id }) => (
                        <button key={id} onClick={() => setActiveCategory(id)}
                          style={{ padding: "6px 14px", borderRadius: 20, cursor: "pointer", background: activeCategory === id ? "#5865F2" : "#111", border: `1px solid ${activeCategory === id ? "#5865F2" : "#222"}`, color: activeCategory === id ? "#fff" : "#555", fontSize: 13, fontWeight: activeCategory === id ? 700 : 500, whiteSpace: "nowrap", fontFamily: "inherit", flexShrink: 0 }}>
                          {id}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <label style={{ fontSize: 11, fontWeight: 700, color: "#333", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Title *</label>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Give your post a clear, descriptive title..."
                  style={{ width: "100%", background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 9, padding: "13px 16px", color: "#e0e0e0", fontSize: isMobile ? 14 : 15, fontWeight: 500, fontFamily: "inherit", marginBottom: 20, display: "block", outline: "none", boxSizing: "border-box" }} />

                <label style={{ fontSize: 11, fontWeight: 700, color: "#333", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Body</label>
                <textarea value={newBody} onChange={e => setNewBody(e.target.value)} placeholder="Share context, details, or ask your question in full..."
                  rows={isMobile ? 5 : 7}
                  style={{ width: "100%", background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 9, padding: "13px 16px", color: "#d0d0d0", fontSize: 14, fontFamily: "inherit", resize: "vertical", lineHeight: 1.7, marginBottom: 16, display: "block", outline: "none", boxSizing: "border-box" }} />

                {newPostFiles.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                    {newPostFiles.map((f, i) => <FileChip key={i} file={f} onRemove={() => setNewPostFiles(p => p.filter((_, idx) => idx !== i))} />)}
                  </div>
                )}

                <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
                  <AttachButton onFiles={files => setNewPostFiles(p => [...p, ...files])} />
                  {!isMobile && <span style={{ fontSize: 12, color: "#2a2a2a" }}>Images, videos, PDFs, docs, zip</span>}
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button className="compose-btn" onClick={handlePost} disabled={!newTitle.trim()}
                    style={{ background: newTitle.trim() ? "#5865F2" : "#141414", border: "none", color: newTitle.trim() ? "#fff" : "#2a2a2a", borderRadius: 9, padding: "11px 28px", fontSize: 14, fontWeight: 600, cursor: newTitle.trim() ? "pointer" : "default", fontFamily: "inherit" }}>
                    Post
                  </button>
                  <button onClick={() => { goBack(); setNewPostFiles([]); }}
                    style={{ background: "transparent", border: "1px solid #1a1a1a", color: "#444", borderRadius: 9, padding: "11px 20px", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                    Discard
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}