import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  const [articles, setArticles] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [loading, setLoading] = useState(false);

  const [commentText, setCommentText] = useState({});
  const [replyText, setReplyText] = useState({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    fetchArticles();
  }, []);

  // ================= FETCH + SORT BY LIKES =================
  const fetchArticles = async () => {
    const { data: articlesData } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: likesData } = await supabase.from("likes").select("*");
    const { data: commentsData } = await supabase.from("comments").select("*");
    const { data: repliesData } = await supabase.from("replies").select("*");

    const enriched = articlesData.map((a) => {
      const likes = likesData.filter((l) => l.article_id === a.id);

      return {
        ...a,
        likeCount: likes.length,
        likes,
        comments: commentsData
          .filter((c) => c.article_id === a.id)
          .map((c) => ({
            ...c,
            replies: repliesData.filter((r) => r.comment_id === c.id),
          })),
      };
    });

    const sorted = enriched.sort((a, b) => b.likeCount - a.likeCount);

    setArticles(sorted);
  };

  // ================= PUBLISH =================
  const publishArticle = async () => {
    if (!title.trim() || !content.trim()) {
      alert("Please fill in title and content");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("articles").insert([
      {
        title,
        content,
        user_email: user.email,
      },
    ]);

    setLoading(false);

    if (error) {
      alert("Failed to publish article");
      return;
    }

    setTitle("");
    setContent("");
    fetchArticles();
  };

  // ================= LIKE =================
  const likeArticle = async (articleId) => {
    await supabase.from("likes").insert([
      {
        article_id: articleId,
        user_email: user.email,
      },
    ]);

    fetchArticles();
  };

  // ================= SHARE =================
  const shareArticle = async (articleId, title) => {
    const url = `${window.location.origin}/article/${articleId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: "Check out this article!",
          url,
        });
        return;
      } catch (err) {}
    }

    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
  };

  // ================= COMMENT =================
  const addComment = async (articleId) => {
    if (!commentText[articleId]) return;

    await supabase.from("comments").insert([
      {
        article_id: articleId,
        user_email: user.email,
        content: commentText[articleId],
      },
    ]);

    setCommentText({ ...commentText, [articleId]: "" });
    fetchArticles();
  };

  // ================= REPLY =================
  const addReply = async (commentId) => {
    if (!replyText[commentId]) return;

    await supabase.from("replies").insert([
      {
        comment_id: commentId,
        user_email: user.email,
        content: replyText[commentId],
      },
    ]);

    setReplyText({ ...replyText, [commentId]: "" });
    fetchArticles();
  };

  // ================= LOGOUT (ADDED ONLY) =================
  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div style={styles.page}>
      {/* LEFT SIDE (Create Post) */}
      <div style={styles.leftPanel}>
        <h1>📚 Dashboard</h1>
        <p>{user?.email}</p>

        {/* ✅ LOGOUT BUTTON ADDED HERE */}
        <button onClick={logout} style={styles.logoutBtn}>
          🚪 Logout
        </button>

        <div style={styles.cardSticky}>
          <h2>Create Article</h2>

          <input
            style={styles.input}
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            style={styles.textarea}
            placeholder="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <div style={styles.buttonWrapper}>
            <button
              onClick={publishArticle}
              style={{
                ...styles.btn,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
              disabled={loading}
            >
              {loading ? "Publishing..." : "Publish"}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE (Feed) */}
      <div style={styles.rightPanel}>
        {articles.map((a) => (
          <div key={a.id} style={styles.postCard}>
            <h2>{a.title}</h2>
            <p>{a.content}</p>

            <div style={styles.actionRow}>
              <button onClick={() => likeArticle(a.id)} style={styles.likeBtn}>
                👍 {a.likeCount}
              </button>

              <button
                onClick={() => shareArticle(a.id, a.title)}
                style={styles.shareBtn}
              >
                🔗 Share
              </button>
            </div>

            <input
              style={styles.input}
              placeholder="Write comment..."
              value={commentText[a.id] || ""}
              onChange={(e) =>
                setCommentText({ ...commentText, [a.id]: e.target.value })
              }
            />

            <button onClick={() => addComment(a.id)} style={styles.btn}>
              Comment
            </button>

            {a.comments.map((c) => (
              <div key={c.id} style={styles.comment}>
                <p>💬 {c.user_email}: {c.content}</p>

                <input
                  style={styles.input}
                  placeholder="Reply..."
                  value={replyText[c.id] || ""}
                  onChange={(e) =>
                    setReplyText({ ...replyText, [c.id]: e.target.value })
                  }
                />

                <button
                  onClick={() => addReply(c.id)}
                  style={styles.smallBtn}
                >
                  Reply
                </button>

                {c.replies.map((r) => (
                  <p key={r.id} style={styles.reply}>
                    ↳ {r.user_email}: {r.content}
                  </p>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  page: {
    padding: "20px",
    background: "#0f172a",
    color: "white",
    minHeight: "100vh",
    fontFamily: "Arial",
  },

  card: {
    background: "#1e293b",
    padding: "15px",
    marginBottom: "15px",
    borderRadius: "10px",
  },

  input: {
    width: "100%",
    padding: "8px",
    margin: "5px 0",
  },

  textarea: {
    width: "100%",
    height: "80px",
    padding: "8px",
  },

  btn: {
    padding: "8px 12px",
    background: "#22c55e",
    border: "none",
    color: "white",
    cursor: "pointer",
    marginTop: "5px",
  },

  likeBtn: {
    padding: "5px 10px",
    background: "#3b82f6",
    border: "none",
    color: "white",
    cursor: "pointer",
    marginRight: "10px",
  },

  shareBtn: {
    padding: "5px 10px",
    background: "#10b981",
    border: "none",
    color: "white",
    cursor: "pointer",
  },

  smallBtn: {
    padding: "5px 8px",
    background: "#f59e0b",
    border: "none",
    color: "white",
    cursor: "pointer",
    fontSize: "12px",
  },

  comment: {
    marginTop: "10px",
    paddingLeft: "10px",
    borderLeft: "2px solid #334155",
  },

  reply: {
    marginLeft: "15px",
    fontSize: "13px",
    color: "#cbd5e1",
  },

  buttonWrapper: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "10px",
  },

  logoutBtn: {
    padding: "8px 12px",
    background: "#ef4444",
    border: "none",
    color: "white",
    cursor: "pointer",
    marginTop: "10px",
    borderRadius: "6px",
  },
};