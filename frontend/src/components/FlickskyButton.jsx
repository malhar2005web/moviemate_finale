import { useState, useEffect, useRef } from "react";
import { Bot, Loader2, Send, X, Star } from "lucide-react"; // Added X and Star

// A list of common genres to suggest
const COMMON_GENRES = [
  "Action",
  "Comedy",
  "Sci-Fi",
  "Horror",
  "Romance",
  "Drama",
];

const FlickskyButton = () => {
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userInput, setUserInput] = useState("");
  // --- UPDATED: Messages state now holds structured data ---
  const [messages, setMessages] = useState([]);
  const [showGenreOptions, setShowGenreOptions] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🧠 Initial greeting
  useEffect(() => {
    if (showChat && messages.length === 0) {
      setMessages([
        {
          from: "bot",
          text: "👋 Hi! I'm <b>Flicksky</b> — your AI movie scout 🎬<br/>Ask me for any <b>movie</b>, <b>genre</b>, or <b>mood</b> and I’ll hook you up 🍿",
          suggestions: [], // Add suggestions array
        },
      ]);
      setShowGenreOptions(true);
    }
  }, [showChat]);

  // 💬 REFACTORED: Core function to handle sending any message
  const handleSendMessage = async (messageText) => {
    if (!messageText.trim() || loading) return;
    
    setLoading(true);
    setShowGenreOptions(false);

    setMessages((prev) => [...prev, { from: "user", text: messageText, suggestions: [] }]);

    try {
      const res = await fetch("http://localhost:5000/api/flicksky/run-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput: messageText }),
      });

      const data = await res.json();
      setLoading(false);

      if (!data.success) {
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text: "⚠️ Sorry, I couldn’t find any movies right now. Try another title or mood 🎥",
            suggestions: [],
          },
        ]);
        return;
      }

      // --- NEW: Add the bot's response with structured suggestions ---
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: data.agentResponse.explanation,
          suggestions: data.agentResponse.suggestions || [], // Pass the full array
        },
      ]);
      
      // If it was small talk, add a follow-up
      if (data.agentResponse.suggestions.length === 0 && data.agentResponse.explanation.includes("Hi")) {
         setShowGenreOptions(true);
      }

    } catch (error) {
      console.error("Flicksky Error:", error);
      setLoading(false);
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "🚨 Something went wrong on my end. Try again later.", suggestions: [] },
      ]);
    }
  };
  
  // Handler for the text input send button
  const handleTextSend = () => {
    handleSendMessage(userInput);
    setUserInput("");
  };
  
  // Handler for clicking a genre button
  const handleGenreClick = (genre) => {
    handleSendMessage(genre);
  };

  // --- NEW: Handler for clicking a movie title to show details ---
  const handleShowDetails = (movie) => {
    const year = movie.release_date ? ` (${movie.release_date.slice(0, 4)})` : "";
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";

    const detailText = `
      <b class="text-lg">${movie.title}${year}</b><br/>
      <span class="flex items-center gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="text-yellow-400">
          <path d="M12 17.27l4.15 2.51c.76.46 1.69-.22 1.49-1.08l-1.1-4.72 3.67-3.18c.67-.58.31-1.68-.57-1.75l-4.83-.41-1.89-4.46c-.34-.81-1.5-.81-1.84 0L9.19 8.63l-4.83.41c-.88.07-1.24 1.17-.57 1.75l3.67 3.18-1.1 4.72c-.2.86.73 1.54 1.49 1.08l4.15-2.51z"/>
        </svg>
        <b>${rating} / 10</b>
      </span>
      <br/>
      <b>Plot:</b> ${movie.overview || "No plot summary available."}
    `;

    // Add a new bot message containing the movie details
    setMessages((prev) => [
      ...prev,
      { from: "bot", text: detailText, suggestions: [] },
    ]);
  };

  return (
    <>
      <button
        onClick={() => setShowChat(true)}
        className="fixed bottom-6 right-6 w-14 h-14 flex items-center justify-center rounded-full bg-purple-600 text-white hover:bg-purple-700 transition shadow-lg"
        title="Chat with Flicksky"
      >
        <Bot size={28} />
      </button>

      {showChat && (
        <div className="fixed bottom-24 right-6 bg-gray-900 text-white w-[24rem] h-[36rem] rounded-2xl shadow-2xl flex flex-col border border-purple-700/50 overflow:hidden">
          
          <div className="flex-shrink-0 h-14 flex items-center justify-between px-4 bg-gray-800 border-b border-purple-700/50 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <Bot size={20} className="text-purple-400" />
              <h3 className="font-bold text-lg">Flicksky</h3>
            </div>
            <button
              onClick={() => setShowChat(false)}
              className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white"
              title="Close chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* --- MESSAGES AREA (REFACTORED) --- */}
          <div className="flex-1 overflow-y-auto space-y-4 p-4 scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-gray-800">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.from === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex gap-2 max-w-[85%] ${
                    msg.from === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {msg.from === "bot" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white">
                      <Bot size={18} />
                    </div>
                  )}
                  <div
                    className={`p-3 rounded-2xl text-sm leading-relaxed ${
                      msg.from === "user"
                        ? "bg-purple-700 rounded-br-lg"
                        : "bg-gray-800 rounded-bl-lg"
                    }`}
                  >
                    {/* 1. Render the main text */}
                    <div
                      dangerouslySetInnerHTML={{
                        __html: msg.text.replace(/\n/g, "<br/>"),
                      }}
                    />
                    
                    {/* 2. Render clickable suggestions if they exist */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {msg.suggestions.map((movie) => (
                          <div key={movie.id} className="border-t border-gray-700/50 pt-2">
                            {/* Clickable Title */}
                            <button
                              onClick={() => handleShowDetails(movie)}
                              className="font-bold text-base text-purple-300 hover:underline text-left"
                            >
                              🍿 {movie.title}
                              <span className="font-normal text-gray-400">
                                {movie.release_date ? ` (${movie.release_date.slice(0, 4)})` : ""}
                              </span>
                            </button>
                            
                            {/* Rating and Trailer */}
                            <div className="text-xs text-gray-300 ml-1 mt-1 flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <Star size={12} className="text-yellow-400" />
                                {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
                              </span>
                              <span>|</span>
                              <span>
                                🎞️ Trailer: {movie.trailer ? (
                                  <a 
                                    href={`https://www.youtube.com/watch?v=${movie.trailer}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-purple-300 hover:underline"
                                  >
                                    Watch here
                                  </a>
                                ) : (
                                  "Not available"
                                )}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {showGenreOptions && (
              <div className="flex flex-col items-center">
                <p className="text-xs text-gray-400 mb-2">Or pick a genre to start:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {COMMON_GENRES.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => handleGenreClick(genre)}
                      className="bg-gray-700 text-white text-xs rounded-full px-3 py-1.5 hover:bg-purple-600 transition-colors"
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {loading && (
             <div className="flex items-center gap-2 px-4 pb-2">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white">
                  <Bot size={18} />
                </div>
                <div className="p-3 rounded-2xl bg-gray-800">
                  <Loader2 className="animate-spin w-5 h-5 text-gray-400" />
                </div>
             </div>
          )}

          <div className="flex-shrink-0 p-4 bg-gray-800 border-t border-purple-700/50 rounded-b-2xl">
            <div className="flex items-center gap-2">
              <input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleTextSend()}
                placeholder="Type your movie vibe here..."
                className="flex-1 px-4 py-2 rounded-full bg-gray-700 text-sm outline-none border border-transparent focus:border-purple-500"
              />
              <button
                onClick={handleTextSend}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 rounded-full p-3 text-white disabled:bg-gray-600"
              >
                {loading ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FlickskyButton;