import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Navbar from "../components/Navbar";

const socket = io("http://localhost:5000");

const WatchParty = () => {
  const videoRef = useRef(null);
  const cameraRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [cameraStream, setCameraStream] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [movieURL, setMovieURL] = useState("");
  const [movieName, setMovieName] = useState("");
  const [videoProgress, setVideoProgress] = useState({ current: 0, duration: 0 });
  const [cameraError, setCameraError] = useState("");
  const [activeUsers] = useState(3);

  useEffect(() => {
    const demoMovie = {
      name: "Demo Clip - Action Scene",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    };
    setMovieURL(demoMovie.videoUrl);
    setMovieName(demoMovie.name);
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const toggleCamera = async () => {
    if (isCameraOn) {
      cameraStream?.getTracks().forEach((t) => t.stop());
      if (cameraRef.current) cameraRef.current.srcObject = null;
      setCameraStream(null);
      setIsCameraOn(false);
      setCameraError("");
    } else {
      try {
        setCameraError("");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: isMicOn,
        });
        setCameraStream(stream);
        setIsCameraOn(true);
        setTimeout(() => {
          if (cameraRef.current) cameraRef.current.srcObject = stream;
        }, 100);
      } catch (err) {
        setCameraError(err.name === "NotAllowedError"
          ? "Camera access denied. Please allow permissions."
          : err.name === "NotFoundError"
          ? "No camera found on this device."
          : `Error: ${err.message}`);
        setIsCameraOn(false);
      }
    }
  };

  const toggleMic = () => {
    if (cameraStream) {
      cameraStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
      setIsMicOn(!isMicOn);
    } else {
      setIsMicOn(!isMicOn);
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setVideoProgress({
        current: videoRef.current.currentTime,
        duration: videoRef.current.duration,
      });
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  useEffect(() => {
    socket.on("receiveMessage", (message) => setChatMessages((prev) => [...prev, message]));
    return () => socket.off("receiveMessage");
  }, []);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const msg = {
      user: "You",
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    socket.emit("sendMessage", msg);
    setChatMessages((prev) => [...prev, msg]);
    setNewMessage("");
  };

  const textToCopy = "http://localhost:5173/watchparty";

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0b0b10] to-gray-900 text-white font-['DM_Sans'] flex flex-col relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-pink-600/10 blur-3xl rounded-full"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-600/10 blur-3xl rounded-full"></div>
      </div>

      {/* Navbar */}
      <div className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-lg border-b border-red-500/10 shadow-[0_2px_20px_rgba(255,0,0,0.1)]">
        <div className="px-8 py-4">
          <Navbar />
        </div>
      </div>

      {/* Main Layout */}
      <main className="flex flex-1 pt-24 px-8 gap-8 max-w-[1600px] mx-auto w-full">
        {/* Video Section */}
        <section className="flex-1 flex flex-col">
          <div className="bg-[#0f0f12]/80 backdrop-blur-2xl rounded-2xl p-6 border border-red-500/10 shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-3xl font-['Poppins'] font-semibold tracking-tight text-white">
                  {movieName}
                </h2>
                <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  {activeUsers} people watching
                </p>
              </div>
              <div className="text-sm text-gray-400 font-medium px-4 py-2 rounded-xl bg-black/40 border border-red-500/20">
                {formatTime(videoProgress.current)} / {formatTime(videoProgress.duration)}
              </div>
            </div>

            {/* Video Player */}
            <div className="relative rounded-xl overflow-hidden border border-red-500/20 bg-black">
              {movieURL ? (
                <>
                  <video
                    ref={videoRef}
                    src={movieURL}
                    className="w-full h-[450px] object-cover"
                    controls
                    onTimeUpdate={handleVideoTimeUpdate}
                    onLoadedMetadata={handleVideoTimeUpdate}
                  />
                  <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gray-800">
                    <div
                      className="h-full bg-gradient-to-r from-pink-600 to-red-500 transition-all duration-200"
                      style={{
                        width: `${
                          videoProgress.duration
                            ? (videoProgress.current / videoProgress.duration) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-[450px] text-gray-400">
                  Select a movie to start watching 🎬
                </div>
              )}
            </div>
          </div>

          {/* Share Link */}
          <div className="mt-6 p-6 bg-[#0f0f12]/80 backdrop-blur-2xl border border-red-500/10 rounded-2xl flex justify-between items-center shadow-lg">
            <div>
              <h3 className="text-lg font-['Poppins'] font-semibold text-white">
                Party Link Ready 🎉
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                Share this link to invite your friends.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-black/40 border border-red-500/20 px-4 py-2 rounded-xl">
              <span className="text-sm text-pink-400 font-medium">{textToCopy}</span>
              <button
                onClick={() => navigator.clipboard.writeText(textToCopy)}
                className="bg-gradient-to-r from-pink-600 to-red-500 hover:from-pink-500 hover:to-red-400 p-2 rounded-lg transition-all"
              >
                📋
              </button>
            </div>
          </div>
        </section>

        {/* Camera + Chat */}
        <aside className="w-[420px] flex flex-col gap-6">
          {/* Camera */}
          <div className="bg-[#0f0f12]/80 backdrop-blur-2xl rounded-2xl p-6 border border-red-500/10 shadow-2xl">
            <h3 className="text-lg font-['Poppins'] font-semibold mb-3 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isCameraOn ? "bg-red-500" : "bg-gray-600"}`}></span>
              Your Camera
            </h3>
            <div className="relative rounded-xl overflow-hidden border border-red-500/10 bg-black aspect-video mb-4">
              {isCameraOn ? (
                <video ref={cameraRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Camera is offline
                </div>
              )}
            </div>
            {cameraError && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 p-2 rounded-lg mb-3">
                {cameraError}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={toggleCamera}
                className="flex-1 bg-gradient-to-r from-pink-600 to-red-500 hover:from-pink-500 hover:to-red-400 py-2.5 rounded-xl font-medium transition-all"
              >
                {isCameraOn ? "Stop Camera" : "Start Camera"}
              </button>
              <button
                onClick={toggleMic}
                className={`w-14 rounded-xl ${
                  isMicOn ? "bg-red-600 hover:bg-red-500" : "bg-gray-700 hover:bg-gray-600"
                } transition-all`}
              >
                🎤
              </button>
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 bg-[#0f0f12]/80 backdrop-blur-2xl rounded-2xl border border-red-500/10 shadow-2xl flex flex-col">
            <div className="p-5 border-b border-red-500/10 flex items-center justify-between">
              <h3 className="font-['Poppins'] font-semibold text-lg flex items-center gap-2">
                💬 Party Chat
              </h3>
              <span className="text-sm text-gray-400">{chatMessages.length} messages</span>
            </div>
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-red-500/30"
            >
              {chatMessages.length === 0 ? (
                <p className="text-center text-gray-500 mt-8">Start chatting 👋</p>
              ) : (
                chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border transition ${
                      msg.user === "You"
                        ? "bg-red-500/10 border-red-500/30 text-pink-200 self-end"
                        : "bg-gray-900/50 border-gray-700 text-gray-200"
                    }`}
                  >
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{msg.user}</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <p className="text-sm font-medium">{msg.text}</p>
                  </div>
                ))
              )}
            </div>
            <div className="p-5 border-t border-red-500/10 flex gap-3">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 bg-black/40 border border-red-500/20 rounded-xl px-4 py-3 outline-none text-white placeholder-gray-500 focus:border-red-500/50 transition"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="bg-gradient-to-r from-pink-600 to-red-500 hover:from-pink-500 hover:to-red-400 px-6 py-3 rounded-xl font-medium transition disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default WatchParty;

