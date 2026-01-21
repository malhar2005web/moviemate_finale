import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { Check, X, Users } from "lucide-react";
import { useAuthStore } from "../store/authUser";

const FriendsPage = () => {
  const { user, setUser } = useAuthStore();

  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [username, setUsername] = useState("");
  const [sending, setSending] = useState(false);

  /* 🔄 FETCH FRIENDS + REQUESTS */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [friendsRes, requestsRes] = await Promise.all([
          axios.get("/api/v1/friends/list"),
          axios.get("/api/v1/friends/requests"),
        ]);

        setFriends(friendsRes.data.friends || []);
        setRequests(requestsRes.data.requests || []);
      } catch (err) {
        console.error("Friends fetch failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* 🔘 TOGGLE AUTO-ACCEPT (SINGLE SOURCE OF TRUTH) */
  const toggleAutoAccept = async () => {
    const newValue = !user?.autoAcceptFriends;

    try {
      const res = await axios.post("/api/v1/user/settings", {
        autoAcceptFriends: newValue,
      });

      setUser({
        ...user,
        autoAcceptFriends: res.data.autoAcceptFriends,
      });
    } catch (err) {
      console.error(err);
    }
  };

  /* ➕ SEND FRIEND REQUEST */
  const sendRequest = async () => {
    if (!username.trim()) return;

    try {
      setSending(true);
      await axios.post("/api/v1/friends/request", { username });
      alert("Friend request sent");
      setUsername("");
    } catch {
      alert("User not found or request already sent");
    } finally {
      setSending(false);
    }
  };

  /* ✅ ACCEPT REQUEST */
  const acceptRequest = async (id) => {
    try {
      await axios.post(`/api/v1/friends/accept/${id}`);
      setRequests((prev) => prev.filter((r) => r._id !== id));

      const res = await axios.get("/api/v1/friends/list");
      setFriends(res.data.friends || []);
    } catch {}
  };

  /* ❌ REJECT REQUEST */
  const rejectRequest = async (id) => {
    try {
      await axios.post(`/api/v1/friends/reject/${id}`);
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch {}
  };

  if (loading) {
    return (
      <div className="bg-black min-h-screen text-white">
        <Navbar />
        <div className="text-center mt-20 text-gray-400">
          Loading friends…
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-white">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* 🔘 AUTO-ACCEPT TOGGLE */}
        <div className="bg-zinc-900 p-5 rounded-2xl mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Auto-accept friend requests
            </h2>
            <p className="text-sm text-gray-400">
              Recommended for cinephiles & creators
            </p>
          </div>

          <button
            onClick={toggleAutoAccept}
            className={`w-14 h-8 rounded-full transition ${
              user?.autoAcceptFriends ? "bg-green-600" : "bg-gray-600"
            }`}
          >
            <div
              className={`h-6 w-6 bg-white rounded-full transition transform ${
                user?.autoAcceptFriends
                  ? "translate-x-6"
                  : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* ➕ SEND FRIEND REQUEST */}
        <div className="bg-zinc-900 p-5 rounded-2xl mb-12">
          <h3 className="text-lg font-semibold mb-3">Add a Friend</h3>

          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="flex-1 bg-black p-3 rounded-lg outline-none"
            />

            <button
              onClick={sendRequest}
              disabled={sending}
              className="bg-blue-600 px-5 rounded-lg font-semibold"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>

        {/* 📥 FRIEND REQUESTS */}
        <div className="mb-14">
          <h3 className="text-2xl font-bold mb-4">Friend Requests</h3>

          {requests.length === 0 ? (
            <p className="text-gray-400">No pending requests</p>
          ) : (
            <div className="space-y-4">
              {requests.map((r) => (
                <div
                  key={r._id}
                  className="bg-zinc-900 p-4 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={
                        r.fromUser?.avatar ||
                        "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                      }
                      className="h-10 w-10 rounded-full"
                    />
                    <p className="font-semibold">
                      {r.fromUser?.username}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => acceptRequest(r._id)}
                      className="bg-green-600 p-2 rounded-full"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => rejectRequest(r._id)}
                      className="bg-red-600 p-2 rounded-full"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 👥 FRIENDS LIST */}
        <div>
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Users size={22} /> Your Friends
          </h3>

          {friends.length === 0 ? (
            <p className="text-gray-400">You have no friends yet</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {friends.map((f) => (
                <div
                  key={f._id}
                  className="bg-zinc-900 p-4 rounded-xl flex items-center gap-4"
                >
                  <img
                    src={
                      f.avatar ||
                      "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                    }
                    className="h-12 w-12 rounded-full"
                  />
                  <p className="font-semibold">{f.username}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendsPage;
