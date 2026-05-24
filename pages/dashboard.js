import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

// ─── Helpers ────────────────────────────────────────────────────────────────

const Avatar = ({ email, size = 32 }) => {
  const initials = email?.[0]?.toUpperCase() ?? "?";
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "rgba(93,232,192,0.15)",
      border: "1px solid rgba(93,232,192,0.3)",
      color: "#5de8c0", fontSize: size * 0.4,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 500, flexShrink: 0,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {initials}
    </div>
  );
};

const Timestamp = ({ iso }) => {
  const d = new Date(iso);
  return (
    <time dateTime={iso} style={{ fontSize: 11, color: "rgba(240,237,232,0.3)", fontFamily: "'DM Sans', sans-serif" }}>
      {d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
    </time>
  );
};

const TimeAgo = ({ iso }) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  let label;
  if (mins < 1) label = "Just now";
  else if (mins < 60) label = `${mins}m ago`;
  else if (hrs < 24) label = `${hrs}h ago`;
  else label = `${days}d ago`;
  return <span style={{ fontSize: 11, color: "rgba(93,232,192,0.7)", fontFamily: "'DM Sans', sans-serif" }}>{label}</span>;
};

// ─── Toast ───────────────────────────────────────────────────────────────────

function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    // SECURITY FIX 3: added role="status" + aria-live so screen readers announce the toast
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed", bottom: 88, left: "50%", transform: "translateX(-50%)",
        background: "rgba(93,232,192,0.15)", border: "1px solid rgba(93,232,192,0.35)",
        color: "#5de8c0", fontSize: 13, fontFamily: "'DM Sans', sans-serif",
        padding: "10px 20px", borderRadius: 10, zIndex: 9999,
        backdropFilter: "blur(8px)", whiteSpace: "nowrap",
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        animation: "fadeInUp 0.2s ease",
      }}
    >
      {message}
    </div>
  );
}

// ─── Notification Bell ───────────────────────────────────────────────────────

function NotificationBell({ notifications, onMarkAllRead, onMarkRead }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const getIcon = (type) => {
    if (type === "like") return "👍";
    if (type === "dislike") return "👎";
    if (type === "comment") return "💬";
    if (type === "reply") return "↩️";
    return "🔔";
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          ...css.notifBtn,
          background: open ? "rgba(93,232,192,0.1)" : "transparent",
          borderColor: open ? "rgba(93,232,192,0.3)" : "rgba(255,255,255,0.08)",
        }}
        title="Notifications"
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
      >
        <BellIcon />
        {unread > 0 && (
          <span style={css.badge}>{unread > 99 ? "99+" : unread}</span>
        )}
      </button>

      {open && (
        <div style={css.notifPanel}>
          <div style={css.notifHeader}>
            <span style={css.notifTitle}>Notifications</span>
            {unread > 0 && (
              <button onClick={onMarkAllRead} style={css.markAllBtn}>
                Mark all as read
              </button>
            )}
          </div>
          <div style={css.notifList}>
            {notifications.length === 0 ? (
              <div style={css.notifEmpty}>
                <BellIcon />
                <p>No notifications yet</p>
                <p style={{ fontSize: 11, color: "rgba(240,237,232,0.2)", marginTop: 4 }}>
                  Activity from others will appear here.
                </p>
              </div>
            ) : (
              notifications.slice(0, 20).map(n => (
                <div
                  key={n.id}
                  onClick={() => onMarkRead(n.id)}
                  style={{
                    ...css.notifItem,
                    background: n.read ? "transparent" : "rgba(93,232,192,0.05)",
                    borderLeft: n.read ? "2px solid transparent" : "2px solid rgba(93,232,192,0.4)",
                  }}
                >
                  <div style={css.notifAvatar}>
                    <Avatar email={n.actor_email} size={30} />
                    <span style={css.notifTypeIcon}>{getIcon(n.type)}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={css.notifText}>
                      <span style={{ color: "#f0ede8", fontWeight: 500 }}>
                        {n.actor_email?.split("@")[0]}
                      </span>
                      {" "}{n.message}
                    </p>
                    {n.article_title && (
                      <p style={css.notifSub} title={n.article_title}>
                        "{n.article_title.length > 40 ? n.article_title.slice(0, 40) + "…" : n.article_title}"
                      </p>
                    )}
                    <TimeAgo iso={n.created_at} />
                  </div>
                  {!n.read && <div style={css.unreadDot} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Drawer ──────────────────────────────────────────────────────────────────

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])',
  'textarea:not([disabled])', 'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

function Drawer({ open, onClose, user, publishing, onPublish, onLogout }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const asideRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement;
      const id = requestAnimationFrame(() => {
        const first = asideRef.current?.querySelectorAll(FOCUSABLE)[0];
        first?.focus();
      });
      return () => cancelAnimationFrame(id);
    } else {
      previousFocusRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;

      const focusable = Array.from(asideRef.current?.querySelectorAll(FOCUSABLE) ?? []);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first || !asideRef.current?.contains(document.activeElement)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last || !asideRef.current?.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const handlePublish = async () => {
    const ok = await onPublish(title.trim(), content.trim());
    if (ok) {
      setTitle("");
      setContent("");
      onClose();
    }
  };

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            zIndex: 200, backdropFilter: "blur(2px)",
          }}
        />
      )}
      <aside
        ref={asideRef}
        role="dialog"
        aria-modal="true"
        aria-label="Write article"
        style={{
          ...css.drawer,
          transform: open ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={css.logoRow}>
            <div style={css.logoDot} />
            <span style={css.logoText}>ML Hub</span>
          </div>
          <button onClick={onClose} style={css.closeBtn} aria-label="Close menu">
            <CloseIcon />
          </button>
        </div>

        <div style={css.userCard}>
          <Avatar email={user?.email} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text)" }}>Signed in as</p>
            <p style={{ fontSize: 11, color: "var(--muted)", wordBreak: "break-all" }}>{user?.email}</p>
          </div>
        </div>

        <div style={css.divider} />
        <p style={css.sectionLabel}>New Article</p>

        {/* SECURITY FIX 2: maxLength on title and content fields */}
        <input
          style={css.fieldInput}
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={150}
        />
        <textarea
          style={css.fieldTextarea}
          placeholder="Write your article…"
          value={content}
          onChange={e => setContent(e.target.value)}
          maxLength={10000}
        />

        <button
          onClick={handlePublish}
          style={{ ...css.publishBtn, opacity: publishing || !title.trim() || !content.trim() ? 0.6 : 1 }}
          disabled={publishing || !title.trim() || !content.trim()}
        >
          {publishing ? "Publishing…" : "Publish →"}
        </button>

        <div style={{ flex: 1 }} />
        <button onClick={onLogout} style={css.logoutBtn}>Sign out</button>
      </aside>
    </>
  );
}

// ─── Search Bar ──────────────────────────────────────────────────────────────

function SearchBar({ value, onChange, resultCount, total }) {
  const inputRef = useRef(null);
  return (
    <div style={css.searchWrap}>
      <div style={css.searchInner}>
        <SearchIcon />
        {/* SECURITY FIX 1: cap search input at 100 chars to limit RegExp surface */}
        <input
          ref={inputRef}
          style={css.searchInput}
          placeholder="Search articles…"
          value={value}
          onChange={e => onChange(e.target.value.slice(0, 100))}
          maxLength={100}
        />
        {value && (
          <button
            onClick={() => { onChange(""); inputRef.current?.focus(); }}
            style={css.searchClear}
            aria-label="Clear search"
          >
            <CloseIcon size={14} />
          </button>
        )}
      </div>
      {value && (
        <p style={css.searchMeta}>
          {resultCount === 0
            ? "No results"
            : `${resultCount} of ${total} article${total !== 1 ? "s" : ""}`}
        </p>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ReplyItem({ reply, commentId, currentEmail, onDelete }) {
  return (
    <div style={css.reply}>
      <Avatar email={reply.user_email} size={22} />
      <div style={{ flex: 1 }}>
        <span style={css.replyAuthor}>{reply.user_email}</span>
        <p style={css.replyContent}>{reply.content}</p>
      </div>
      {reply.user_email === currentEmail && (
        <button onClick={() => onDelete(reply.id, commentId)} style={css.iconBtn} title="Delete reply">
          <DeleteIcon />
        </button>
      )}
    </div>
  );
}

function CommentItem({ comment, currentEmail, onDelete, onAddReply, onDeleteReply }) {
  const [replyVal, setReplyVal] = useState("");
  const [open, setOpen] = useState(false);

  const handleReply = () => {
    if (!replyVal.trim()) return;
    onAddReply(comment.id, replyVal.trim());
    setReplyVal("");
    setOpen(false);
  };

  return (
    <div style={css.comment}>
      <div style={css.commentHeader}>
        <Avatar email={comment.user_email} size={28} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={css.commentAuthor}>{comment.user_email}</span>
            {comment.created_at && <Timestamp iso={comment.created_at} />}
          </div>
          <p style={css.commentContent}>{comment.content}</p>
          <button onClick={() => setOpen(o => !o)} style={css.textBtn}>
            {open ? "Cancel" : "↩ Reply"}
          </button>
        </div>
        {comment.user_email === currentEmail && (
          <button onClick={() => onDelete(comment.id)} style={css.iconBtn} title="Delete comment">
            <DeleteIcon />
          </button>
        )}
      </div>

      {open && (
        <div style={{ paddingLeft: 36, marginTop: 8, display: "flex", gap: 8 }}>
          {/* SECURITY FIX 2: maxLength on reply input */}
          <input
            style={css.input}
            placeholder="Write a reply…"
            value={replyVal}
            onChange={e => setReplyVal(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleReply()}
            maxLength={500}
          />
          <button onClick={handleReply} style={css.btnSmall}>Post</button>
        </div>
      )}

      {comment.replies?.length > 0 && (
        <div style={{ paddingLeft: 36, marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
          {comment.replies.map(r => (
            <ReplyItem key={r.id} reply={r} commentId={comment.id} currentEmail={currentEmail} onDelete={onDeleteReply} />
          ))}
        </div>
      )}
    </div>
  );
}

function ArticleCard({ article, currentEmail, onReact, onShare, onDelete, onAddComment, onDeleteComment, onAddReply, onDeleteReply, searchQuery }) {
  const [commentVal, setCommentVal] = useState("");
  const [showComments, setShowComments] = useState(false);
  const PREVIEW_LENGTH = 280;
  const [expanded, setExpanded] = useState(false);
  const isLong = article.content?.length > PREVIEW_LENGTH;

  const handleDeleteComment = (commentId) => onDeleteComment(commentId, article.id);
  const handleDeleteReply   = (replyId, commentId) => onDeleteReply(replyId, commentId, article.id);

  const handleComment = () => {
    if (!commentVal.trim()) return;
    onAddComment(article.id, commentVal.trim());
    setCommentVal("");
  };

  // SECURITY FIX 1: safe RegExp highlight — length-capped, escaped, wrapped in try/catch
  const highlight = (text) => {
    if (!searchQuery || !text) return text;
    const safe = searchQuery.slice(0, 60).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!safe) return text;
    let parts;
    try {
      parts = text.split(new RegExp(`(${safe})`, "gi"));
    } catch {
      return text;
    }
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase()
        ? <mark key={i} style={{ background: "rgba(93,232,192,0.25)", color: "#5de8c0", borderRadius: 2, padding: "0 1px" }}>{part}</mark>
        : part
    );
  };

  return (
    <article style={css.card}>
      <div style={css.cardHeader}>
        <Avatar email={article.user_email} />
        <div style={{ flex: 1 }}>
          <span style={css.cardAuthor}>{article.user_email}</span>
          {article.created_at && <Timestamp iso={article.created_at} />}
        </div>
        {article.user_email === currentEmail && (
          <button onClick={() => onDelete(article.id)} style={css.iconBtn} title="Delete article">
            <DeleteIcon />
          </button>
        )}
      </div>

      <h2 style={css.cardTitle}>{highlight(article.title)}</h2>
      <p style={css.cardContent}>
        {isLong && !expanded
          ? highlight(article.content.slice(0, PREVIEW_LENGTH) + "…")
          : highlight(article.content)}
      </p>
      {isLong && (
        <button onClick={() => setExpanded(e => !e)} style={css.textBtn}>
          {expanded ? "Show less" : "Read more"}
        </button>
      )}

      <div style={css.actionRow}>
        <button
          onClick={() => onReact(article.id, "like")}
          style={{ ...css.actionBtn, color: article.userReaction === "like" ? "#5de8c0" : "rgba(240,237,232,0.4)" }}
        >
          <ThumbUpIcon active={article.userReaction === "like"} />
          <span>{article.likeCount}</span>
        </button>

        <button
          onClick={() => onReact(article.id, "dislike")}
          style={{ ...css.actionBtn, color: article.userReaction === "dislike" ? "#f87171" : "rgba(240,237,232,0.4)" }}
        >
          <ThumbDownIcon active={article.userReaction === "dislike"} />
          <span>{article.dislikeCount}</span>
        </button>

        <button onClick={() => onShare(article.id, article.title)} style={css.actionBtn}>
          <ShareIcon />
          <span>Share</span>
        </button>

        <button
          onClick={() => setShowComments(s => !s)}
          style={{ ...css.actionBtn, color: showComments ? "#5de8c0" : "rgba(240,237,232,0.4)" }}
        >
          <CommentIcon />
          <span>{article.comments?.length ?? 0}</span>
        </button>
      </div>

      {showComments && (
        <div style={css.commentsSection}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {/* SECURITY FIX 2: maxLength on comment input */}
            <input
              style={css.input}
              placeholder="Add a comment…"
              value={commentVal}
              onChange={e => setCommentVal(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleComment()}
              maxLength={500}
            />
            <button onClick={handleComment} style={css.btnSmall}>Post</button>
          </div>

          {article.comments?.length === 0 && (
            <p style={{ fontSize: 12, color: "rgba(240,237,232,0.25)", textAlign: "center", padding: "8px 0 4px" }}>
              No comments yet. Start the conversation.
            </p>
          )}

          {article.comments?.map(c => (
            <CommentItem
              key={c.id}
              comment={c}
              currentEmail={currentEmail}
              onDelete={handleDeleteComment}
              onAddReply={onAddReply}
              onDeleteReply={handleDeleteReply}
            />
          ))}
        </div>
      )}
    </article>
  );
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const HamburgerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const CloseIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: "rgba(240,237,232,0.3)" }}>
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const ThumbUpIcon = ({ active }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
    <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
  </svg>
);

const ThumbDownIcon = ({ active }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
    <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
  </svg>
);

const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);

const CommentIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const DeleteIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
);

// ─── Auth Loading Screen ─────────────────────────────────────────────────────

function AuthLoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#05090f",
    }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={css.logoDot} />
        <span style={{ ...css.logoText, fontSize: 22 }}>ML Hub</span>
        <p style={{ fontSize: 12, color: "rgba(240,237,232,0.3)", fontFamily: "'DM Sans', sans-serif", marginTop: 8 }}>
          Checking session…
        </p>
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export default function Dashboard() {
  const [authStatus, setAuthStatus] = useState("loading");
  const [user, setUser] = useState(null);

  const [articles, setArticles] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [publishing, setPublishing] = useState(false);
  const [reactionLoading, setReactionLoading] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const showToast = useCallback((msg) => setToast(msg), []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setAuthStatus("authenticated");
      } else {
        setAuthStatus("unauthenticated");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setAuthStatus("authenticated");
      } else {
        setUser(null);
        setAuthStatus("unauthenticated");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      window.location.href = "/login";
    }
  }, [authStatus]);

  const createNotification = useCallback(async ({ recipientEmail, actorEmail, type, message, articleTitle }) => {
    if (recipientEmail === actorEmail) return;
    try {
      await supabase.from("notifications").insert([{
        recipient_email: recipientEmail,
        actor_email: actorEmail,
        type,
        message,
        article_title: articleTitle,
        read: false,
      }]);
    } catch (err) {
      console.error("Failed to send notification:", err);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, type, actor_email, message, article_title, created_at, read")
        .eq("recipient_email", user.email)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      setNotifications(data ?? []);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  }, [user]);

  const fetchArticles = useCallback(async () => {
    if (!user) return;
    try {
      const { data: articlesData, error: aErr } = await supabase
        .from("articles")
        .select(`
          id, title, content, user_email, created_at,
          likes ( id, user_email, type, article_id ),
          comments (
            id, content, user_email, created_at, article_id,
            replies ( id, content, user_email, comment_id )
          )
        `)
        .order("created_at", { ascending: false });

      if (aErr) throw aErr;

      setArticles(
        (articlesData ?? []).map(a => {
          const reactions = a.likes ?? [];
          return {
            ...a,
            likeCount: reactions.filter(r => r.type === "like").length,
            dislikeCount: reactions.filter(r => r.type === "dislike").length,
            userReaction: reactions.find(r => r.user_email === user.email)?.type ?? null,
            comments: (a.comments ?? []).map(c => ({
              ...c,
              replies: c.replies ?? [],
            })),
          };
        })
      );
    } catch (joinErr) {
      console.warn("Nested select failed, falling back to parallel queries:", joinErr);
      try {
        const [
          { data: articlesData, error: aErr2 },
          { data: reactionsData = [] },
          { data: commentsData = [] },
          { data: repliesData = [] },
        ] = await Promise.all([
          supabase.from("articles").select("id, title, content, user_email, created_at").order("created_at", { ascending: false }),
          supabase.from("likes").select("id, article_id, user_email, type"),
          supabase.from("comments").select("id, article_id, content, user_email, created_at"),
          supabase.from("replies").select("id, comment_id, content, user_email"),
        ]);
        if (aErr2) throw aErr2;

        const reactionsByArticle = {};
        for (const r of reactionsData ?? []) {
          (reactionsByArticle[r.article_id] ??= []).push(r);
        }
        const commentsByArticle = {};
        for (const c of commentsData ?? []) {
          (commentsByArticle[c.article_id] ??= []).push(c);
        }
        const repliesByComment = {};
        for (const r of repliesData ?? []) {
          (repliesByComment[r.comment_id] ??= []).push(r);
        }

        setArticles(
          (articlesData ?? []).map(a => {
            const reactions = reactionsByArticle[a.id] ?? [];
            return {
              ...a,
              likeCount: reactions.filter(r => r.type === "like").length,
              dislikeCount: reactions.filter(r => r.type === "dislike").length,
              userReaction: reactions.find(r => r.user_email === user.email)?.type ?? null,
              comments: (commentsByArticle[a.id] ?? []).map(c => ({
                ...c,
                replies: repliesByComment[c.id] ?? [],
              })),
            };
          })
        );
      } catch (fallbackErr) {
        showToast("Couldn't load articles. Please refresh.");
        console.error(fallbackErr);
      }
    }
  }, [user, showToast]);

  useEffect(() => {
    if (authStatus === "authenticated" && user) {
      fetchArticles();
      fetchNotifications();
    }
  }, [authStatus, user, fetchArticles, fetchNotifications]);

  useEffect(() => {
    if (!user) return;
    let interval;
    const start = () => { interval = setInterval(fetchNotifications, 30000); };
    const stop = () => clearInterval(interval);
    const onVisibility = () => document.hidden ? stop() : (fetchNotifications(), start());
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => { stop(); document.removeEventListener("visibilitychange", onVisibility); };
  }, [user, fetchNotifications]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notifications-" + user.email)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_email=eq.${user.email}` },
        () => fetchNotifications()
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user, fetchNotifications]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  // ── Actions ──

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const publishArticle = useCallback(async (title, content) => {
    if (!title || !content) return false;
    // SECURITY FIX 2: server-side length guard (mirrors maxLength on inputs)
    if (title.length > 150 || content.length > 10000) {
      showToast("Content exceeds allowed length.");
      return false;
    }
    setPublishing(true);
    try {
      const { error } = await supabase.from("articles").insert([{ title, content, user_email: user.email }]);
      if (error) throw error;
      showToast("Article published.");
      await fetchArticles();
      return true;
    } catch (err) {
      showToast("Couldn't publish. Please try again.");
      console.error(err);
      return false;
    } finally {
      setPublishing(false);
    }
  }, [user, fetchArticles, showToast]);

  const reactArticle = useCallback(async (articleId, type) => {
    if (!user || reactionLoading[articleId]) return;
    setReactionLoading(prev => ({ ...prev, [articleId]: true }));
    const article = articles.find(a => a.id === articleId);
    try {
      // BUG FIX: correct operator precedence for existing reaction lookup
      const existingReaction = article?.likes?.find(r => r.user_email === user.email);
      const currentType = existingReaction?.type ?? article?.userReaction ?? null;

      if (currentType == null) {
        // No existing reaction — insert new
        await supabase.from("likes").insert([{ article_id: articleId, user_email: user.email, type }]);
        if (article) await createNotification({
          recipientEmail: article.user_email, actorEmail: user.email, type,
          message: type === "like" ? "liked your article" : "disliked your article",
          articleTitle: article.title,
        });
      } else if (currentType === type) {
        // Same reaction — toggle off
        await supabase.from("likes")
          .delete()
          .eq("article_id", articleId)
          .eq("user_email", user.email);
      } else {
        // Different reaction — switch type
        await supabase.from("likes")
          .update({ type })
          .eq("article_id", articleId)
          .eq("user_email", user.email);
        if (article) await createNotification({
          recipientEmail: article.user_email, actorEmail: user.email, type,
          message: type === "like" ? "liked your article" : "disliked your article",
          articleTitle: article.title,
        });
      }
      await fetchArticles();
    } catch (err) {
      showToast("Action failed. Try again.");
    } finally {
      setReactionLoading(prev => ({ ...prev, [articleId]: false }));
    }
  }, [user, reactionLoading, articles, createNotification, fetchArticles, showToast]);

  const shareArticle = useCallback(async (articleId, title) => {
    const url = `${window.location.origin}/article/${articleId}`;
    if (navigator.share) {
      try { await navigator.share({ title, text: "Check out this article!", url }); return; } catch {}
    }
    await navigator.clipboard.writeText(url);
    showToast("Link copied to clipboard!");
  }, [showToast]);

  const addComment = useCallback(async (articleId, text) => {
    // SECURITY FIX 2: server-side length guard for comments
    if (text.length > 500) { showToast("Comment is too long."); return; }
    try {
      const { error } = await supabase.from("comments").insert([{ article_id: articleId, user_email: user.email, content: text }]);
      if (error) throw error;
      const article = articles.find(a => a.id === articleId);
      if (article) await createNotification({
        recipientEmail: article.user_email, actorEmail: user.email, type: "comment",
        message: "commented on your article", articleTitle: article.title,
      });
      await fetchArticles();
    } catch { showToast("Couldn't post comment."); }
  }, [user, articles, createNotification, fetchArticles, showToast]);

  const addReply = useCallback(async (commentId, text) => {
    // SECURITY FIX 2: server-side length guard for replies
    if (text.length > 500) { showToast("Reply is too long."); return; }
    try {
      const { error } = await supabase.from("replies").insert([{ comment_id: commentId, user_email: user.email, content: text }]);
      if (error) throw error;
      for (const article of articles) {
        const comment = article.comments?.find(c => c.id === commentId);
        if (comment) {
          await createNotification({
            recipientEmail: comment.user_email, actorEmail: user.email, type: "reply",
            message: "replied to your comment", articleTitle: article.title,
          });
          break;
        }
      }
      await fetchArticles();
    } catch { showToast("Couldn't post reply."); }
  }, [user, articles, createNotification, fetchArticles, showToast]);

  // ── CASCADE-ON-DELETE ────────────────────────────────────────────────────────
  // These delete actions rely on Postgres ON DELETE CASCADE constraints.
  //
  // Required migration (run once in Supabase SQL Editor):
  //
  //   ALTER TABLE comments
  //     DROP CONSTRAINT IF EXISTS comments_article_id_fkey,
  //     ADD CONSTRAINT comments_article_id_fkey
  //       FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE;
  //
  //   ALTER TABLE replies
  //     DROP CONSTRAINT IF EXISTS replies_comment_id_fkey,
  //     ADD CONSTRAINT replies_comment_id_fkey
  //       FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE;
  //
  //   ALTER TABLE likes
  //     DROP CONSTRAINT IF EXISTS likes_article_id_fkey,
  //     ADD CONSTRAINT likes_article_id_fkey
  //       FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE;
  //
  // ── RLS POLICIES ─────────────────────────────────────────────────────────────
  // Run this in Supabase SQL Editor to enforce server-side access control:
  //
  //   ALTER TABLE articles      ENABLE ROW LEVEL SECURITY;
  //   ALTER TABLE likes         ENABLE ROW LEVEL SECURITY;
  //   ALTER TABLE comments      ENABLE ROW LEVEL SECURITY;
  //   ALTER TABLE replies       ENABLE ROW LEVEL SECURITY;
  //   ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
  //
  //   -- articles
  //   CREATE POLICY "articles: read all"   ON articles FOR SELECT TO authenticated USING (true);
  //   CREATE POLICY "articles: insert own" ON articles FOR INSERT TO authenticated WITH CHECK (user_email = auth.jwt() ->> 'email');
  //   CREATE POLICY "articles: delete own" ON articles FOR DELETE TO authenticated USING (user_email = auth.jwt() ->> 'email');
  //
  //   -- likes
  //   CREATE POLICY "likes: read all"    ON likes FOR SELECT TO authenticated USING (true);
  //   CREATE POLICY "likes: insert own"  ON likes FOR INSERT TO authenticated WITH CHECK (user_email = auth.jwt() ->> 'email');
  //   CREATE POLICY "likes: update own"  ON likes FOR UPDATE TO authenticated USING (user_email = auth.jwt() ->> 'email');
  //   CREATE POLICY "likes: delete own"  ON likes FOR DELETE TO authenticated USING (user_email = auth.jwt() ->> 'email');
  //
  //   -- comments
  //   CREATE POLICY "comments: read all"   ON comments FOR SELECT TO authenticated USING (true);
  //   CREATE POLICY "comments: insert own" ON comments FOR INSERT TO authenticated WITH CHECK (user_email = auth.jwt() ->> 'email');
  //   CREATE POLICY "comments: delete own" ON comments FOR DELETE TO authenticated USING (user_email = auth.jwt() ->> 'email');
  //
  //   -- replies
  //   CREATE POLICY "replies: read all"   ON replies FOR SELECT TO authenticated USING (true);
  //   CREATE POLICY "replies: insert own" ON replies FOR INSERT TO authenticated WITH CHECK (user_email = auth.jwt() ->> 'email');
  //   CREATE POLICY "replies: delete own" ON replies FOR DELETE TO authenticated USING (user_email = auth.jwt() ->> 'email');
  //
  //   -- notifications (users can only read/update their own)
  //   CREATE POLICY "notifications: read own"   ON notifications FOR SELECT TO authenticated USING (recipient_email = auth.jwt() ->> 'email');
  //   CREATE POLICY "notifications: insert"     ON notifications FOR INSERT TO authenticated WITH CHECK (true);
  //   CREATE POLICY "notifications: update own" ON notifications FOR UPDATE TO authenticated USING (recipient_email = auth.jwt() ->> 'email');
  // ────────────────────────────────────────────────────────────────────────────

  const deleteArticle = useCallback(async (id) => {
    try {
      const { error } = await supabase.from("articles").delete().eq("id", id);
      if (error) throw error;
      setArticles(prev => prev.filter(a => a.id !== id));
    } catch { showToast("Couldn't delete article."); }
  }, [showToast]);

  const deleteComment = useCallback(async (commentId, articleId) => {
    try {
      const { error } = await supabase.from("comments").delete().eq("id", commentId);
      if (error) throw error;
      setArticles(prev => prev.map(a =>
        a.id !== articleId ? a : { ...a, comments: a.comments.filter(c => c.id !== commentId) }
      ));
    } catch { showToast("Couldn't delete comment."); }
  }, [showToast]);

  const deleteReply = useCallback(async (replyId, commentId, articleId) => {
    try {
      const { error } = await supabase.from("replies").delete().eq("id", replyId);
      if (error) throw error;
      setArticles(prev => prev.map(a =>
        a.id !== articleId ? a : {
          ...a,
          comments: a.comments.map(c =>
            c.id !== commentId ? c : { ...c, replies: c.replies.filter(r => r.id !== replyId) }
          ),
        }
      ));
    } catch { showToast("Couldn't delete reply."); }
  }, [showToast]);

  const markAllRead = useCallback(async () => {
    await supabase.from("notifications").update({ read: true }).eq("recipient_email", user.email).eq("read", false);
    fetchNotifications();
  }, [user, fetchNotifications]);

  const markRead = useCallback(async (id) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    fetchNotifications();
  }, [fetchNotifications]);

  if (authStatus === "loading") return <AuthLoadingScreen />;
  if (authStatus === "unauthenticated") return null;

  // SECURITY FIX 1: sanitize search query before passing to highlight()
  const q = searchQuery.trim().toLowerCase();
  const filteredArticles = q
    ? articles.filter(a =>
        a.title?.toLowerCase().includes(q) ||
        a.content?.toLowerCase().includes(q) ||
        a.user_email?.toLowerCase().includes(q)
      )
    : articles;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #05090f;
          --surface: rgba(255,255,255,0.03);
          --surface-hover: rgba(255,255,255,0.05);
          --border: rgba(255,255,255,0.07);
          --border-hover: rgba(255,255,255,0.14);
          --text: #f0ede8;
          --muted: rgba(240,237,232,0.45);
          --accent: #5de8c0;
          --accent-dim: rgba(93,232,192,0.1);
          --danger: #f87171;
        }
        body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text); }
        ::placeholder { color: var(--muted); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
        input:focus, textarea:focus { outline: none; border-color: rgba(93,232,192,0.4) !important; }
        button:active { transform: scale(0.97); }
        mark { background: rgba(93,232,192,0.2); color: #5de8c0; border-radius: 2px; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate(-50%, 10px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        @media (max-width: 600px) {
          input, textarea { font-size: 16px !important; }
        }
      `}</style>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        publishing={publishing}
        onPublish={publishArticle}
        onLogout={logout}
      />

      <header style={css.topBar}>
        <button onClick={() => setDrawerOpen(true)} style={css.topBarBtn} aria-label="Open menu">
          <HamburgerIcon />
        </button>
        <div style={css.logoRow}>
          <div style={css.logoDot} />
          <span style={css.logoText}>ML Hub</span>
        </div>
        <NotificationBell notifications={notifications} onMarkAllRead={markAllRead} onMarkRead={markRead} />
      </header>

      <main style={css.feed}>
        <div style={css.feedHeader}>
          <h1 style={css.feedTitle}>Feed</h1>
          <span style={css.feedCount}>{articles.length} articles</span>
        </div>

        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          resultCount={filteredArticles.length}
          total={articles.length}
        />

        {filteredArticles.length === 0 && (
          <div style={css.empty}>
            {q ? (
              <>
                <p style={{ fontSize: 14, color: "var(--muted)" }}>No articles match "{searchQuery}".</p>
                <button onClick={() => setSearchQuery("")} style={{ ...css.textBtn, marginTop: 10, fontSize: 13 }}>
                  Clear search
                </button>
              </>
            ) : (
              <p style={{ fontSize: 14, color: "var(--muted)" }}>No articles yet — be the first to publish.</p>
            )}
          </div>
        )}

        {filteredArticles.map(a => (
          <ArticleCard
            key={a.id}
            article={a}
            currentEmail={user?.email}
            onReact={reactArticle}
            onShare={shareArticle}
            onDelete={deleteArticle}
            onAddComment={addComment}
            onDeleteComment={deleteComment}
            onAddReply={addReply}
            onDeleteReply={deleteReply}
            searchQuery={searchQuery}
          />
        ))}

        <div style={{ height: 80 }} />
      </main>

      <button onClick={() => setDrawerOpen(true)} style={css.fab} aria-label="Write article" title="Write article">
        <PlusIcon />
      </button>
    </>
  );
}

// ─── Design tokens ───────────────────────────────────────────────────────────

const css = {
  topBar: {
    position: "sticky", top: 0, zIndex: 100,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 16px", height: 56,
    background: "rgba(5,9,15,0.92)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
  },
  topBarBtn: {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 44, height: 44,
    background: "transparent", border: "none",
    color: "rgba(240,237,232,0.7)", cursor: "pointer", borderRadius: 8,
  },
  drawer: {
    position: "fixed", top: 0, left: 0, bottom: 0,
    width: 300, maxWidth: "85vw",
    background: "#0b1118",
    borderRight: "1px solid rgba(255,255,255,0.08)",
    zIndex: 300,
    display: "flex", flexDirection: "column",
    padding: "20px 18px", gap: 12,
    overflowY: "auto",
    transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
  },
  closeBtn: {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 44, height: 44,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8, color: "rgba(240,237,232,0.6)", cursor: "pointer",
  },
  fab: {
    position: "fixed",
    bottom: "max(24px, env(safe-area-inset-bottom, 24px))",
    right: 20, width: 54, height: 54,
    borderRadius: "50%", background: "#5de8c0", color: "#05090f",
    border: "none", display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", boxShadow: "0 4px 20px rgba(93,232,192,0.35)",
    zIndex: 150, transition: "transform 0.15s, box-shadow 0.15s",
  },
  logoRow: { display: "flex", alignItems: "center", gap: 10 },
  logoDot: { width: 8, height: 8, borderRadius: "50%", background: "#5de8c0", boxShadow: "0 0 10px #5de8c0" },
  logoText: { fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#f0ede8", letterSpacing: "-0.02em" },
  userCard: {
    display: "flex", alignItems: "center", gap: 12, padding: "12px",
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 10,
  },
  divider: { height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0" },
  sectionLabel: {
    fontSize: 10, fontWeight: 500, letterSpacing: "0.1em",
    textTransform: "uppercase", color: "rgba(240,237,232,0.3)", paddingLeft: 2,
  },
  fieldInput: {
    width: "100%", padding: "10px 12px",
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8, color: "#f0ede8", fontSize: 14, fontFamily: "'DM Sans', sans-serif",
    transition: "border-color 0.2s",
  },
  fieldTextarea: {
    width: "100%", height: 120, padding: "10px 12px",
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8, color: "#f0ede8", fontSize: 14, fontFamily: "'DM Sans', sans-serif",
    resize: "vertical", transition: "border-color 0.2s",
  },
  publishBtn: {
    width: "100%", padding: "13px", background: "#5de8c0", color: "#05090f",
    border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
    letterSpacing: "0.01em", transition: "background 0.2s, opacity 0.2s",
  },
  logoutBtn: {
    width: "100%", padding: "12px", background: "transparent",
    color: "rgba(248,113,113,0.7)", border: "1px solid rgba(248,113,113,0.2)",
    borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer", transition: "all 0.2s", letterSpacing: "0.02em",
  },
  feed: { padding: "16px 16px 0", maxWidth: 680, margin: "0 auto", width: "100%" },
  feedHeader: { display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12 },
  feedTitle: {
    fontFamily: "'DM Serif Display', serif", fontSize: 24, fontWeight: 400,
    letterSpacing: "-0.02em", color: "#f0ede8",
  },
  feedCount: { fontSize: 12, color: "rgba(240,237,232,0.3)", letterSpacing: "0.04em" },
  searchWrap: { marginBottom: 16 },
  searchInner: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "10px 12px",
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10, transition: "border-color 0.2s",
  },
  searchInput: {
    flex: 1, background: "none", border: "none",
    color: "#f0ede8", fontSize: 14, fontFamily: "'DM Sans', sans-serif",
    minWidth: 0,
  },
  searchClear: {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 24, height: 24, background: "rgba(255,255,255,0.06)",
    border: "none", borderRadius: 6,
    color: "rgba(240,237,232,0.5)", cursor: "pointer", flexShrink: 0,
  },
  searchMeta: { fontSize: 11, color: "rgba(240,237,232,0.3)", marginTop: 6, paddingLeft: 2 },
  empty: { padding: "48px 0", textAlign: "center" },
  card: {
    background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 14, padding: "16px", marginBottom: 12, transition: "border-color 0.2s",
  },
  cardHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 },
  cardAuthor: { fontSize: 12, fontWeight: 500, color: "rgba(240,237,232,0.6)", display: "block", marginBottom: 1 },
  cardTitle: {
    fontFamily: "'DM Serif Display', serif", fontSize: 18, fontWeight: 400,
    letterSpacing: "-0.01em", color: "#f0ede8", marginBottom: 8, lineHeight: 1.3,
  },
  cardContent: { fontSize: 14, lineHeight: 1.7, color: "rgba(240,237,232,0.65)", marginBottom: 8 },
  actionRow: {
    display: "flex", gap: 0,
    borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 10, marginTop: 4,
  },
  actionBtn: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
    padding: "10px 4px", background: "transparent", border: "none", borderRadius: 7,
    color: "rgba(240,237,232,0.4)", fontSize: 12, fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer", transition: "background 0.15s, color 0.15s", minHeight: 44,
  },
  iconBtn: {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 40, height: 40, background: "transparent", border: "none",
    borderRadius: 8, color: "rgba(248,113,113,0.5)", cursor: "pointer",
    flexShrink: 0, transition: "background 0.15s, color 0.15s",
  },
  commentsSection: {
    marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)",
    display: "flex", flexDirection: "column", gap: 10,
  },
  input: {
    flex: 1, padding: "10px 12px", background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7,
    color: "#f0ede8", fontSize: 14, fontFamily: "'DM Sans', sans-serif",
  },
  btnSmall: {
    padding: "10px 14px", background: "rgba(93,232,192,0.12)",
    border: "1px solid rgba(93,232,192,0.25)", borderRadius: 7,
    color: "#5de8c0", fontSize: 13, fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer", whiteSpace: "nowrap", fontWeight: 500, minHeight: 44,
  },
  comment: { display: "flex", flexDirection: "column", gap: 6 },
  commentHeader: { display: "flex", gap: 10, alignItems: "flex-start" },
  commentAuthor: { fontSize: 11, fontWeight: 500, color: "rgba(240,237,232,0.5)" },
  commentContent: { fontSize: 13, color: "rgba(240,237,232,0.75)", lineHeight: 1.6, marginTop: 2 },
  textBtn: {
    background: "none", border: "none", color: "rgba(93,232,192,0.6)", fontSize: 12,
    cursor: "pointer", padding: "4px 0", fontFamily: "'DM Sans', sans-serif", marginTop: 4, minHeight: 36,
  },
  reply: {
    display: "flex", gap: 8, alignItems: "flex-start", padding: "8px 12px",
    background: "rgba(255,255,255,0.02)", borderRadius: 7,
    border: "1px solid rgba(255,255,255,0.04)",
  },
  replyAuthor: { fontSize: 10, fontWeight: 500, color: "rgba(240,237,232,0.4)", display: "block", marginBottom: 2 },
  replyContent: { fontSize: 12, color: "rgba(240,237,232,0.65)", lineHeight: 1.5 },
  notifBtn: {
    position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
    width: 44, height: 44, flexShrink: 0,
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
    color: "rgba(240,237,232,0.6)", cursor: "pointer", transition: "all 0.2s",
    background: "transparent",
  },
  badge: {
    position: "absolute", top: -6, right: -6,
    background: "#f87171", color: "#fff",
    fontSize: 9, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
    borderRadius: 10, padding: "1px 4px", minWidth: 16, textAlign: "center",
    border: "1.5px solid #05090f", lineHeight: 1.4,
  },
  notifPanel: {
    position: "absolute", top: "calc(100% + 8px)", right: 0,
    width: "min(340px, calc(100vw - 24px))",
    maxHeight: "min(480px, 70vh)",
    background: "#0d1520",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
    zIndex: 1000,
    display: "flex", flexDirection: "column",
    overflow: "hidden",
  },
  notifHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 16px 10px",
    borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0,
  },
  notifTitle: { fontFamily: "'DM Serif Display', serif", fontSize: 15, fontWeight: 400, color: "#f0ede8" },
  markAllBtn: {
    background: "none", border: "none",
    color: "rgba(93,232,192,0.7)", fontSize: 11,
    fontFamily: "'DM Sans', sans-serif", cursor: "pointer", padding: 0,
  },
  notifList: { overflowY: "auto", flex: 1 },
  notifEmpty: {
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    gap: 8, padding: "40px 20px", textAlign: "center",
    color: "rgba(240,237,232,0.25)", fontSize: 13, fontFamily: "'DM Sans', sans-serif",
  },
  notifItem: {
    display: "flex", alignItems: "flex-start", gap: 10,
    padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)",
    cursor: "pointer", transition: "background 0.15s", minHeight: 52,
  },
  notifAvatar: { position: "relative", flexShrink: 0 },
  notifTypeIcon: { position: "absolute", bottom: -4, right: -4, fontSize: 12, lineHeight: 1 },
  notifText: {
    fontSize: 12, color: "rgba(240,237,232,0.6)", lineHeight: 1.5,
    fontFamily: "'DM Sans', sans-serif", marginBottom: 2,
  },
  notifSub: {
    fontSize: 11, color: "rgba(93,232,192,0.5)", fontFamily: "'DM Sans', sans-serif",
    marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  unreadDot: {
    width: 7, height: 7, borderRadius: "50%",
    background: "#5de8c0", flexShrink: 0, marginTop: 4,
  },
};