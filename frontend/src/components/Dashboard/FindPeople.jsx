// import React, { useEffect, useState } from "react";
// const API_BASE = "http://localhost:4000/api/v1";
// import { socket } from "../../socket";

// export default function FindPeople() {
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [pending, setPending] = useState(new Set());
//   const [sending, setSending] = useState(new Set());
//   const token = localStorage.getItem("token");

//   useEffect(() => {
//     let mounted = true;
//     setLoading(true);
//     fetch(`${API_BASE}/people`, {
//       credentials: "include",
//       headers: token ? { Authorization: `Bearer ${token}` } : {},
//     })
//       .then(async (r) => {
//         const json = await r.json().catch(() => ({}));
//         if (!r.ok) throw new Error(json.message || `Failed (${r.status})`);
//         return json;
//       })
//       .then((d) => {
//         if (!mounted) return;
//         setUsers(d.users || []);
//       })
//       .catch((err) => {
//         console.error("FindPeople fetch error:", err);
//         alert("Could not load people list: " + (err.message || err));
//       })
//       .finally(() => mounted && setLoading(false));
//     return () => {
//       mounted = false;
//     };
//   }, [token]);

//   const connect = async (id) => {
//     if (!id || sending.has(id) || pending.has(id)) return;
//     setSending((s) => new Set([...s, id]));
//     try {
//       const res = await fetch(`${API_BASE}/connections/request/${id}`, {
//         method: "POST",
//         credentials: "include",
//         headers: token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : {},
//       });
//       const data = await res.json().catch(() => ({}));
//       if (!res.ok) {
//         throw new Error(data.message || `Failed (${res.status})`);
//       }
//       // If existing connection returned as "exists" it may be success:false
//       if (data.connection && !data.success) {
//         const conn = data.connection;
//         if (conn.status === "pending") {
//           alert("A request is already pending");
//           setPending((p) => new Set([...Array.from(p), id]));
//         } else if (conn.status === "accepted") {
//           alert("You are already connected");
//         } else {
//           alert("Connection exists: " + conn.status);
//         }
//       } else {
//         alert(data.message || "Request sent");
//         setPending((p) => new Set([...Array.from(p), id]));
//         // join socket room to receive notifications
//         const meToken = localStorage.getItem("token");
//         if (meToken) {
//           socket.emit("register", meToken); // if socket expects userId change to userId
//         }
//       }
//     } catch (err) {
//       console.error("Failed to send connection request", err);
//       alert("Failed to send connection request: " + (err.message || err));
//     } finally {
//       setSending((s) => {
//         const copy = new Set(Array.from(s));
//         copy.delete(id);
//         return copy;
//       });
//     }
//   };

//   return (
//     <div className="p-4">
//       <h1 className="text-2xl font-bold mb-4">Find People</h1>
//       {loading ? <div>Loading people...</div> : (
//         <div className="grid md:grid-cols-3 gap-4">
//           {users.length === 0 ? <div>No users found.</div> : users.map((u) => {
//             const isPending = pending.has(u._id);
//             const isSending = sending.has(u._id);
//             return (
//               <div key={u._id} className="border rounded p-3 shadow">
//                 <div className="font-semibold">{u.name}</div>
//                 <div className="text-sm">{u.role}</div>
//                 <div className="text-sm">Skills: {(u.skills || []).join(", ")}</div>
//                 <div className="mt-2">
//                   <button className="border px-3 py-1" onClick={() => connect(u._id)} disabled={isPending || isSending}>
//                     {isSending ? "Sending..." : isPending ? "Pending" : "Connect"}
//                   </button>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// }
