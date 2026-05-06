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
      >
        <BellIcon />
        {unread > 0 && (
          <span style={css.badge}>{unread > 99 ? "99+" : unread}</span>
        )}
      </button>

      {open && (
        <div style={css.notifPanel}>
          {/* Header */}
          <div style={css.notifHeader}>
            <span style={css.notifTitle}>Notifications</span>
            {unread > 0 && (
              <button onClick={onMarkAllRead} style={css.markAllBtn}>
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div style={css.notifList}>
            {notifications.length === 0 ? (
              <div style={css.notifEmpty}>
                <BellIcon />
                <p>No notifications yet</p>
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

// ─── Sub-components ──────────────────────────────────────────────────────────

function ReplyItem({ reply, currentEmail, onDelete }) {
  return (
    <div style={css.reply}>
      <Avatar email={reply.user_email} size={22} />
      <div style={{ flex: 1 }}>
        <span style={css.replyAuthor}>{reply.user_email}</span>
        <p style={css.replyContent}>{reply.content}</p>
      </div>
      {reply.user_email === currentEmail && (
        <button onClick={() => onDelete(reply.id)} style={css.iconBtn} title="Delete reply">
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
          <input
            style={css.input}
            placeholder="Write a reply…"
            value={replyVal}
            onChange={e => setReplyVal(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleReply()}
          />
          <button onClick={handleReply} style={css.btnSmall}>Post</button>
        </div>
      )}

      {comment.replies?.length > 0 && (
        <div style={{ paddingLeft: 36, marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
          {comment.replies.map(r => (
            <ReplyItem key={r.id} reply={r} currentEmail={currentEmail} onDelete={onDeleteReply} />
          ))}
        </div>
      )}
    </div>
  );
}

function ArticleCard({ article, currentEmail, onReact, onShare, onDelete, onAddComment, onDeleteComment, onAddReply, onDeleteReply }) {
  const [commentVal, setCommentVal] = useState("");
  const [showComments, setShowComments] = useState(false);

  const handleComment = () => {
    if (!commentVal.trim()) return;
    onAddComment(article.id, commentVal.trim());
    setCommentVal("");
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

      <h2 style={css.cardTitle}>{article.title}</h2>
      <p style={css.cardContent}>{article.content}</p>

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
            <input
              style={css.input}
              placeholder="Add a comment…"
              value={commentVal}
              onChange={e => setCommentVal(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleComment()}
            />
            <button onClick={handleComment} style={css.btnSmall}>Post</button>
          </div>

          {article.comments?.map(c => (
            <CommentItem
              key={c.id}
              comment={c}
              currentEmail={currentEmail}
              onDelete={onDeleteComment}
              onAddReply={onAddReply}
              onDeleteReply={onDeleteReply}
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

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [articles, setArticles] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [reactionLoading, setReactionLoading] = useState({});

  // ── Init ──
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    if (user) {
      fetchArticles();
      fetchNotifications();
    }
  }, [user]);

  // ── Poll for new notifications every 30s ──
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // ── Realtime subscription for notifications ──
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
  }, [user]);

  // ── Data ──
  const fetchArticles = useCallback(async () => {
    const [{ data: articlesData }, { data: reactionsData = [] }, { data: commentsData = [] }, { data: repliesData = [] }] =
      await Promise.all([
        supabase.from("articles").select("*").order("created_at", { ascending: false }),
        supabase.from("likes").select("*"),
        supabase.from("comments").select("*"),
        supabase.from("replies").select("*"),
      ]);

    setArticles(
      (articlesData ?? []).map(a => {
        const reactions = reactionsData.filter(r => r.article_id === String(a.id));
        return {
          ...a,
          likeCount: reactions.filter(r => r.type === "like").length,
          dislikeCount: reactions.filter(r => r.type === "dislike").length,
          userReaction: reactions.find(r => r.user_email === user?.email)?.type ?? null,
          comments: commentsData
            .filter(c => c.article_id === a.id)
            .map(c => ({ ...c, replies: repliesData.filter(r => r.comment_id === c.id) })),
        };
      })
    );
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_email", user.email)
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifications(data ?? []);
  }, [user]);

  // ── Actions ──
  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const publishArticle = async () => {
    if (!title.trim() || !content.trim()) return;
    setPublishing(true);
    await supabase.from("articles").insert([{ title, content, user_email: user.email }]);
    setTitle("");
    setContent("");
    setPublishing(false);
    fetchArticles();
  };

  // ── Helper: create notification ──
  const createNotification = async ({ recipientEmail, actorEmail, type, message, articleTitle }) => {
    if (recipientEmail === actorEmail) return; // Don't notify yourself
    await supabase.from("notifications").insert([{
      recipient_email: recipientEmail,
      actor_email: actorEmail,
      type,
      message,
      article_title: articleTitle,
      read: false,
    }]);
  };

  const reactArticle = async (articleId, type) => {
    if (!user || reactionLoading[articleId]) return;
    setReactionLoading(prev => ({ ...prev, [articleId]: true }));

    const article = articles.find(a => a.id === articleId);

    const { data: existing } = await supabase
      .from("likes").select("*")
      .eq("article_id", String(articleId))
      .eq("user_email", user.email)
      .maybeSingle();

    if (!existing) {
      await supabase.from("likes").insert([{ article_id: String(articleId), user_email: user.email, type }]);
      // Notify article author
      if (article) {
        await createNotification({
          recipientEmail: article.user_email,
          actorEmail: user.email,
          type,
          message: type === "like" ? "liked your article" : "disliked your article",
          articleTitle: article.title,
        });
      }
    } else if (existing.type === type) {
      await supabase.from("likes").delete().eq("id", existing.id);
    } else {
      await supabase.from("likes").update({ type }).eq("id", existing.id);
      // Notify article author of changed reaction
      if (article) {
        await createNotification({
          recipientEmail: article.user_email,
          actorEmail: user.email,
          type,
          message: type === "like" ? "liked your article" : "disliked your article",
          articleTitle: article.title,
        });
      }
    }

    await fetchArticles();
    setReactionLoading(prev => ({ ...prev, [articleId]: false }));
  };

  const shareArticle = async (articleId, title) => {
    const url = `${window.location.origin}/article/${articleId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: "Check out this article!", url });
        return;
      } catch (err) {}
    }
    await navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
  };

  const addComment = async (articleId, text) => {
    await supabase.from("comments").insert([{ article_id: articleId, user_email: user.email, content: text }]);

    const article = articles.find(a => a.id === articleId);
    if (article) {
      await createNotification({
        recipientEmail: article.user_email,
        actorEmail: user.email,
        type: "comment",
        message: "commented on your article",
        articleTitle: article.title,
      });
    }

    fetchArticles();
  };

  const addReply = async (commentId, text) => {
    await supabase.from("replies").insert([{ comment_id: commentId, user_email: user.email, content: text }]);

    // Find the comment author to notify
    for (const article of articles) {
      const comment = article.comments?.find(c => c.id === commentId);
      if (comment) {
        await createNotification({
          recipientEmail: comment.user_email,
          actorEmail: user.email,
          type: "reply",
          message: "replied to your comment",
          articleTitle: article.title,
        });
        break;
      }
    }

    fetchArticles();
  };

  const deleteArticle = async (id) => { await supabase.from("articles").delete().eq("id", id); fetchArticles(); };
  const deleteComment = async (id) => { await supabase.from("comments").delete().eq("id", id); fetchArticles(); };
  const deleteReply   = async (id) => { await supabase.from("replies").delete().eq("id", id);   fetchArticles(); };

  const markAllRead = async () => {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("recipient_email", user.email)
      .eq("read", false);
    fetchNotifications();
  };

  const markRead = async (id) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    fetchNotifications();
  };

  // ── Render ──
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
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
        input:focus, textarea:focus { outline: none; border-color: rgba(93,232,192,0.4) !important; }
        button:active { transform: scale(0.97); }
      `}</style>

      <div style={css.layout}>
        {/* ── Sidebar ── */}
        <aside style={css.sidebar}>
          <div style={css.logoRow}>
            <div style={css.logoDot} />
            <span style={css.logoText}>ML Hub</span>
          </div>

          <div style={css.userCard}>
            <Avatar email={user?.email} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>Signed in as</p>
              <p style={{ fontSize: 11, color: "var(--muted)", wordBreak: "break-all" }}>{user?.email}</p>
            </div>
            <NotificationBell
              notifications={notifications}
              onMarkAllRead={markAllRead}
              onMarkRead={markRead}
            />
          </div>

          <div style={css.divider} />

          <p style={css.sectionLabel}>New Article</p>

          <input
            style={css.fieldInput}
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />

          <textarea
            style={css.fieldTextarea}
            placeholder="Write your article…"
            value={content}
            onChange={e => setContent(e.target.value)}
          />

          <button onClick={publishArticle} style={css.publishBtn} disabled={publishing}>
            {publishing ? "Publishing…" : "Publish →"}
          </button>

          <div style={{ flex: 1 }} />

          <button onClick={logout} style={css.logoutBtn}>
            Sign out
          </button>
        </aside>

        {/* ── Feed ── */}
        <main style={css.feed}>
          <div style={css.feedHeader}>
            <h1 style={css.feedTitle}>Feed</h1>
            <span style={css.feedCount}>{articles.length} articles</span>
          </div>

          {articles.length === 0 && (
            <div style={css.empty}>
              <p style={{ fontSize: 14, color: "var(--muted)" }}>No articles yet — be the first to publish.</p>
            </div>
          )}

          {articles.map(a => (
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
            />
          ))}
        </main>
      </div>
    </>
  );
}

// ─── Design tokens ───────────────────────────────────────────────────────────

const css = {
  layout: { display: "flex", minHeight: "100vh" },

  sidebar: {
    width: 280, flexShrink: 0, padding: "28px 20px",
    borderRight: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.015)",
    display: "flex", flexDirection: "column", gap: 12,
    position: "sticky", top: 0, height: "100vh", overflowY: "auto",
  },

  logoRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },
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
    borderRadius: 8, color: "#f0ede8", fontSize: 13, fontFamily: "'DM Sans', sans-serif",
    transition: "border-color 0.2s",
  },

  fieldTextarea: {
    width: "100%", height: 120, padding: "10px 12px",
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8, color: "#f0ede8", fontSize: 13, fontFamily: "'DM Sans', sans-serif",
    resize: "vertical", transition: "border-color 0.2s",
  },

  publishBtn: {
    width: "100%", padding: "11px", background: "#5de8c0", color: "#05090f",
    border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
    letterSpacing: "0.01em", transition: "background 0.2s",
  },

  logoutBtn: {
    width: "100%", padding: "10px", background: "transparent",
    color: "rgba(248,113,113,0.7)", border: "1px solid rgba(248,113,113,0.2)",
    borderRadius: 8, fontSize: 12, fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer", transition: "all 0.2s", letterSpacing: "0.02em",
  },

  feed: { flex: 1, padding: "28px 32px", maxWidth: 720, margin: "0 auto", width: "100%" },

  feedHeader: { display: "flex", alignItems: "baseline", gap: 12, marginBottom: 24 },

  feedTitle: {
    fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400,
    letterSpacing: "-0.02em", color: "#f0ede8",
  },

  feedCount: { fontSize: 12, color: "rgba(240,237,232,0.3)", letterSpacing: "0.04em" },

  empty: { padding: "48px 0", textAlign: "center" },

  card: {
    background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 14, padding: "20px 24px", marginBottom: 16, transition: "border-color 0.2s",
  },

  cardHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 14 },
  cardAuthor: { fontSize: 12, fontWeight: 500, color: "rgba(240,237,232,0.6)", display: "block", marginBottom: 1 },

  cardTitle: {
    fontFamily: "'DM Serif Display', serif", fontSize: 20, fontWeight: 400,
    letterSpacing: "-0.01em", color: "#f0ede8", marginBottom: 8, lineHeight: 1.3,
  },

  cardContent: { fontSize: 14, lineHeight: 1.7, color: "rgba(240,237,232,0.65)", marginBottom: 16 },

  actionRow: { display: "flex", gap: 4, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 12 },

  actionBtn: {
    display: "flex", alignItems: "center", gap: 6, padding: "7px 12px",
    background: "transparent", border: "none", borderRadius: 7,
    color: "rgba(240,237,232,0.4)", fontSize: 12, fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer", transition: "background 0.15s, color 0.15s",
  },

  iconBtn: {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 28, height: 28, background: "transparent", border: "none",
    borderRadius: 6, color: "rgba(248,113,113,0.5)", cursor: "pointer",
    flexShrink: 0, transition: "background 0.15s, color 0.15s",
  },

  commentsSection: {
    marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.05)",
    display: "flex", flexDirection: "column", gap: 10,
  },

  input: {
    flex: 1, padding: "8px 12px", background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7,
    color: "#f0ede8", fontSize: 12, fontFamily: "'DM Sans', sans-serif",
  },

  btnSmall: {
    padding: "8px 14px", background: "rgba(93,232,192,0.12)",
    border: "1px solid rgba(93,232,192,0.25)", borderRadius: 7,
    color: "#5de8c0", fontSize: 12, fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer", whiteSpace: "nowrap", fontWeight: 500,
  },

  comment: { display: "flex", flexDirection: "column", gap: 6 },
  commentHeader: { display: "flex", gap: 10, alignItems: "flex-start" },
  commentAuthor: { fontSize: 11, fontWeight: 500, color: "rgba(240,237,232,0.5)" },
  commentContent: { fontSize: 13, color: "rgba(240,237,232,0.75)", lineHeight: 1.6, marginTop: 2 },

  textBtn: {
    background: "none", border: "none", color: "rgba(93,232,192,0.6)", fontSize: 11,
    cursor: "pointer", padding: 0, fontFamily: "'DM Sans', sans-serif", marginTop: 4,
  },

  reply: {
    display: "flex", gap: 8, alignItems: "flex-start", padding: "8px 12px",
    background: "rgba(255,255,255,0.02)", borderRadius: 7,
    border: "1px solid rgba(255,255,255,0.04)",
  },

  replyAuthor: { fontSize: 10, fontWeight: 500, color: "rgba(240,237,232,0.4)", display: "block", marginBottom: 2 },
  replyContent: { fontSize: 12, color: "rgba(240,237,232,0.65)", lineHeight: 1.5 },

  // ── Notification styles ──
  notifBtn: {
    position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
    width: 34, height: 34, flexShrink: 0,
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
    color: "rgba(240,237,232,0.6)", cursor: "pointer", transition: "all 0.2s",
  },

  badge: {
    position: "absolute", top: -6, right: -6,
    background: "#f87171", color: "#fff",
    fontSize: 9, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
    borderRadius: 10, padding: "1px 4px", minWidth: 16, textAlign: "center",
    border: "1.5px solid #05090f",
    lineHeight: 1.4,
  },

  notifPanel: {
    position: "absolute", top: "calc(100% + 8px)", right: 0,
    width: 340, maxHeight: 480,
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
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    flexShrink: 0,
  },

  notifTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 15, fontWeight: 400, color: "#f0ede8",
  },

  markAllBtn: {
    background: "none", border: "none",
    color: "rgba(93,232,192,0.7)", fontSize: 11,
    fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
    padding: 0,
  },

  notifList: { overflowY: "auto", flex: 1 },

  notifEmpty: {
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    gap: 10, padding: "40px 20px",
    color: "rgba(240,237,232,0.25)", fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
  },

  notifItem: {
    display: "flex", alignItems: "flex-start", gap: 10,
    padding: "12px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    cursor: "pointer", transition: "background 0.15s",
  },

  notifAvatar: { position: "relative", flexShrink: 0 },

  notifTypeIcon: {
    position: "absolute", bottom: -4, right: -4,
    fontSize: 12, lineHeight: 1,
  },

  notifText: {
    fontSize: 12, color: "rgba(240,237,232,0.6)", lineHeight: 1.5,
    fontFamily: "'DM Sans', sans-serif", marginBottom: 2,
  },

  notifSub: {
    fontSize: 11, color: "rgba(93,232,192,0.5)",
    fontFamily: "'DM Sans', sans-serif", marginBottom: 3,
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },

  unreadDot: {
    width: 7, height: 7, borderRadius: "50%",
    background: "#5de8c0", flexShrink: 0, marginTop: 4,
  },
};