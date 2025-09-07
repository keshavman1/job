// frontend/src/components/People/PersonCard.jsx
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { Context } from "/src/context.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api/v1";

/**
 * Props:
 * - user: user object to render
 * - onOpenChat(user): callback to open chat dialog
 */
export default function PersonCard({ user, onOpenChat }) {
  const { user: currentUser } = useContext(Context);
  const [status, setStatus] = useState(null); // null | "no" | "pending" | "accepted" | "requester" | "recipient"
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchStatus = async () => {
      setLoadingStatus(true);
      try {
        const res = await axios.get(`${API_BASE}/connections/status/${user._id}`);
        if (!mounted) return;
        const conn = res.data?.connection || null;
        if (!conn) {
          setStatus("no");
        } else if (conn.status === "pending") {
          // determine who is requester / recipient
          if (String(conn.requester) === String(currentUser?._id)) setStatus("pending"); // I'm requester
          else setStatus("recipient"); // I'm recipient (incoming)
        } else if (conn.status === "accepted") {
          setStatus("accepted");
        } else if (conn.status === "declined") {
          setStatus("no");
        } else {
          setStatus("no");
        }
      } catch (err) {
        console.warn("status fetch", err);
        setStatus("no");
      } finally {
        if (mounted) setLoadingStatus(false);
      }
    };

    fetchStatus();
    return () => {
      mounted = false;
    };
  }, [user._id, currentUser?._id]);

  const sendRequest = async () => {
    if (sending) return;
    setSending(true);
    try {
      const res = await axios.post(`${API_BASE}/connections/request/${user._id}`, {}, { withCredentials: true });
      const conn = res.data?.connection;
      // optimistic: mark pending if connection created or existing pending and I'm requester
      if (conn) {
        if (String(conn.requester) === String(currentUser?._id)) setStatus("pending");
        else if (conn.status === "pending") setStatus("recipient");
      } else {
        setStatus("pending");
      }
    } catch (err) {
      console.error("send request error", err);
      alert(err?.response?.data?.message || "Failed to send request");
    } finally {
      setSending(false);
    }
  };

  const openChat = () => {
    if (status !== "accepted") return;
    onOpenChat && onOpenChat(user);
  };

  return (
    <div className="border rounded p-3 shadow flex flex-col">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg">
          {user.name?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <div>
          <div className="font-semibold">{user.name}</div>
          <div className="text-sm text-gray-600">{user.role}</div>
        </div>
      </div>

      <div className="mt-2 text-sm text-gray-700">Skills: {(user.skills || []).slice(0, 4).join(", ")}</div>

      <div className="mt-3 flex gap-2">
        {loadingStatus ? (
          <button className="border px-3 py-1" disabled>
            Checking...
          </button>
        ) : status === "accepted" ? (
          <>
            <button className="border px-3 py-1" onClick={openChat}>
              Message
            </button>
            <button className="border px-3 py-1 bg-white text-black" disabled>
              Connected
            </button>
          </>
        ) : status === "pending" ? (
          <button className="border px-3 py-1" disabled>
            Pending
          </button>
        ) : status === "recipient" ? (
          <button className="border px-3 py-1" disabled>
            Request Received
          </button>
        ) : (
          <button className="border px-3 py-1" onClick={sendRequest} disabled={sending}>
            {sending ? "Sending..." : "Connect"}
          </button>
        )}
      </div>
    </div>
  );
}
