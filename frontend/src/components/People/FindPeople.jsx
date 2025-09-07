// frontend/src/components/People/FindPeople.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./People.css";
import ChatDrawer from "./ChatDrawer";
import { socket } from "../../socket";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api/v1";

export default function FindPeople() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // connection status map: { [userId]: "none" | "pending" | "accepted" | "declined" }
  const [statusMap, setStatusMap] = useState({});

  // optimistic UI sets
  const [sending, setSending] = useState(new Set());

  // chat drawer state
  const [chatOpen, setChatOpen] = useState(false);
  const [activeUser, setActiveUser] = useState(null);

  // conversations for sidebar (best-effort)
  const [conversations, setConversations] = useState([]);
  const convLoadedRef = useRef(false);

  // unread map: { [userId]: true } => show red dot
  const [unreadMap, setUnreadMap] = useState({});

  const token = localStorage.getItem("token");

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const headers = token
      ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      : { "Content-Type": "application/json" };

    fetch(`${API_BASE}/people`, { method: "GET", headers, credentials: "include" })
      .then(async (r) => {
        const json = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(json.message || `Failed (${r.status})`);
        const list = json.users || json.usersList || json.data || [];
        if (!mounted) return;
        setUsers(Array.isArray(list) ? list : []);
        // fetch connection status in batches
        const ids = (Array.isArray(list) ? list : []).map((u) => u._id);
        fetchStatuses(ids, headers, mounted);
      })
      .catch((err) => {
        console.error("Failed to load people:", err);
        alert("Unable to fetch people: " + (err.message || err));
      })
      .finally(() => mounted && setLoading(false));

    // try to fetch "conversation list" if backend offers one
    fetchConversations(headers);

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Socket: listen for incoming messages and mark unread
  useEffect(() => {
    if (!socket) return;

    const handleReceive = (payload) => {
      // payload shape may vary: { from, message } or { from, content, createdAt }, or { from: id, content }
      try {
        const from = payload?.from || payload?.sender || null;
        if (!from) return;
        // If we currently have the chat open with this user, don't mark unread — instead optionally refresh chat.
        if (chatOpen && activeUser && String(activeUser._id) === String(from)) {
          // do nothing re: unread (user is viewing chat) — ChatDrawer will fetch on open
        } else {
          setUnreadMap((prev) => ({ ...prev, [from]: true }));
        }
        // update conversations list preview (best-effort)
        setConversations((prev) => {
          const copy = Array.isArray(prev) ? [...prev] : [];
          // try to find and bump the conversation's user to top
          const idx = copy.findIndex((c) => String((c.user?._id || c._id)) === String(from));
          if (idx >= 0) {
            const item = copy.splice(idx, 1)[0];
            // attach preview if provided
            item.preview = payload?.content || payload?.message || item.preview;
            item.updatedAt = payload?.createdAt || Date.now();
            return [item, ...copy];
          } else {
            // try find user object and add
            const u = users.find((x) => String(x._id) === String(from));
            if (u) {
              return [{ user: u, preview: payload?.content || payload?.message || "", updatedAt: payload?.createdAt || Date.now() }, ...copy];
            }
            return copy;
          }
        });
      } catch (e) {
        console.warn("socket receive handling error", e);
      }
    };

    // listen to both event names used across your project
    socket.on("receive-message", handleReceive);
    socket.on("message", handleReceive);

    return () => {
      socket.off("receive-message", handleReceive);
      socket.off("message", handleReceive);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatOpen, activeUser, users]);

  const fetchConversations = async (headers) => {
    try {
      const res = await axios.get(`${API_BASE}/messages/conversations`, { headers, withCredentials: true });
      if (res?.data?.conversations) {
        setConversations(res.data.conversations);
        convLoadedRef.current = true;
        return;
      }
    } catch (err) {
      // ignore if endpoint not present
    }
    // fallback: will be derived from statuses later
  };

  const fetchStatuses = async (ids, headers, mounted = true) => {
    if (!ids || ids.length === 0) return;
    const map = {};
    await Promise.all(
      ids.map(async (id) => {
        try {
          const r = await fetch(`${API_BASE}/connections/status/${id}`, {
            method: "GET",
            credentials: "include",
            headers,
          });
          const j = await r.json().catch(() => ({}));
          const conn = j.connection || null;
          let s = "none";
          if (conn) s = conn.status || "none";
          map[id] = s;
        } catch (err) {
          map[id] = "none";
        }
      })
    );
    if (mounted) setStatusMap((prev) => ({ ...prev, ...map }));

    if (!convLoadedRef.current) {
      const connectedIds = Object.entries(map)
        .filter(([, st]) => st === "accepted")
        .map(([id]) => id);
      const conv = connectedIds
        .map((id) => {
          const u = users.find((x) => String(x._id) === String(id));
          if (!u) return null;
          return { user: u, lastMessage: null, updatedAt: null };
        })
        .filter(Boolean);
      setConversations(conv);
    }
  };

  const connectTo = async (id) => {
    if (!id) return;
    if (sending.has(id) || statusMap[id] === "pending") return;
    setSending((s) => new Set([...s, id]));

    const headers = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };

    try {
      const res = await fetch(`${API_BASE}/connections/request/${id}`, {
        method: "POST",
        credentials: "include",
        headers,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Failed (${res.status})`);
      setStatusMap((prev) => ({ ...prev, [id]: "pending" }));
      alert(data.message || "Request sent");
    } catch (err) {
      console.error("connect failed", err);
      alert("Failed to send connection request: " + (err.message || err));
    } finally {
      setSending((s) => {
        const copy = new Set(Array.from(s));
        copy.delete(id);
        return copy;
      });
    }
  };

  const openChat = (user) => {
    setActiveUser(user);
    setChatOpen(true);
    // Clear unread mark when opening chat for this user
    if (user && user._id) {
      setUnreadMap((prev) => {
        const copy = { ...prev };
        delete copy[user._id];
        return copy;
      });
    }
  };

  const closeChat = () => {
    setChatOpen(false);
    setActiveUser(null);
  };

  const lastMessagePreview = (conv) => {
    if (!conv) return "";
    const lm = conv.lastMessage || conv.preview || "";
    if (!lm) return "";
    return lm.length > 60 ? lm.slice(0, 57) + "..." : lm;
  };

  return (
    <div className="people-page-wrapper">
      <div className="people-inner">
        <main className="people-main">
          <h1 className="page-title">Find People</h1>

          {loading ? (
            <div className="muted">Loading people...</div>
          ) : users.length === 0 ? (
            <div className="muted">No users found.</div>
          ) : (
            <div className="people-grid">
              {users.map((u) => {
                const st = statusMap[u._id] || "none";
                const isSending = sending.has(u._id);
                return (
                  <article key={u._id} className="person-card">
                    <div className="person-left">
                      <div className="person-avatar">
                        {u.profilePhotoPath ? (
                          <img src={u.profilePhotoPath} alt={u.name} />
                        ) : (
                          <div className="initial">{(u.name || "U").charAt(0).toUpperCase()}</div>
                        )}
                      </div>
                    </div>

                    <div className="person-body">
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div className="person-name">{u.name}</div>
                        {/* unread dot */}
                        {unreadMap[u._id] ? <span className="unread-dot" title="New message"></span> : null}
                      </div>

                      <div className="person-role">{u.role}</div>
                      <div className="person-skills">
                        <strong>Skills:</strong> {(u.skills || []).slice(0, 6).join(", ")}
                      </div>

                      <div className="person-actions">
                        {st === "accepted" ? (
                          <>
                            <button className="btn-primary small" onClick={() => openChat(u)}>
                              Message
                            </button>
                            <button className="btn-muted small" disabled>
                              Connected
                            </button>
                          </>
                        ) : st === "pending" ? (
                          <button className="btn-muted small" disabled>
                            Pending
                          </button>
                        ) : st === "declined" ? (
                          <button className="btn-muted small" disabled>
                            Request Declined
                          </button>
                        ) : (
                          <button className="btn-outline small" onClick={() => connectTo(u._id)} disabled={isSending}>
                            {isSending ? "Sending..." : "Connect"}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>

        <aside className="people-sidebar">
          <div className="sidebar-card">
            <h3>Messages</h3>
            <div className="sidebar-sub">Recent conversations</div>

            {conversations.length === 0 ? (
              <div className="muted small">No conversations yet. Connect and start chatting.</div>
            ) : (
              <ul className="conv-list">
                {conversations.map((c, i) => {
                  const u = c.user || c;
                  const unread = u && unreadMap[u._id];
                  return (
                    <li key={u._id || i} className="conv-item" onClick={() => openChat(u)}>
                      <div className="conv-left">
                        <div className="conv-avatar">
                          {u.profilePhotoPath ? <img src={u.profilePhotoPath} alt={u.name} /> : <div className="initial">{(u.name || "U").charAt(0).toUpperCase()}</div>}
                        </div>
                      </div>
                      <div className="conv-body">
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div className="conv-name">{u.name}</div>
                          {unread ? <span className="unread-dot" /> : null}
                        </div>
                        <div className="conv-preview">{lastMessagePreview(c)}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="sidebar-card">
            <h3>Pending requests</h3>
            <div className="muted small">People you already requested</div>
            <div style={{ marginTop: 8 }}>
              {Object.entries(statusMap)
                .filter(([, st]) => st === "pending")
                .map(([id]) => {
                  const u = users.find((x) => String(x._id) === String(id));
                  if (!u) return null;
                  return (
                    <div className="pending-row" key={id}>
                      <div className="pending-left">
                        <div className="small-avatar">{(u.name || "U").charAt(0).toUpperCase()}</div>
                        <div>
                          <div className="small-name">{u.name}</div>
                          <div className="muted small">{u.role}</div>
                        </div>
                      </div>
                      <div>
                        <button className="btn-muted small" disabled>
                          Pending
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </aside>
      </div>

      <ChatDrawer open={chatOpen} onClose={closeChat} otherUser={activeUser} apiBase={API_BASE} />
    </div>
  );
}
