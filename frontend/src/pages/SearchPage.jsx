import { useState } from "react";
import { useContentStore } from "../store/content.js";
import Navbar from "../components/Navbar";
import { Search } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { ORIGINAL_IMG_BASE_URL } from "../utils/constants.js";
import { Link } from "react-router-dom";

const SearchPage = () => {
  const [activeTab, setActiveTab] = useState("movie");
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);

  const { setContentType } = useContentStore();

  /* 🔁 TAB SWITCH */
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === "movie" || tab === "tv") {
      setContentType(tab);
    }
    setResults([]);
  };

  /* 🔍 SEARCH (NO HISTORY HERE) */
  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchTerm.trim()) return;

    try {
      const res = await axios.get(
        `/api/v1/search/${activeTab}/${searchTerm}`
      );
      setResults(res.data.content || []);
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error(
          "Nothing found. Check category or spelling."
        );
      } else {
        toast.error("Something went wrong. Try again.");
      }
      setResults([]);
    }
  };

  /* 🧠 REAL ACTIVITY LOGGER */
  const logPosterClick = async (item) => {
    try {
      await axios.post("/api/v1/activity", {
        id: item.id,
        title: item.title || item.name,
        image: item.poster_path,
        type: activeTab, // movie | tv
        action: "poster_click",
      });
    } catch (err) {
      // silently fail – UX > logs
      console.log("Activity log failed");
    }
  };

  return (
    <div className="bg-black min-h-screen text-white">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* 🔘 TABS */}
        <div className="flex justify-center gap-3 mb-6">
          {["movie", "tv", "person"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              className={`py-2 px-4 rounded ${
                activeTab === tab
                  ? "bg-pink-600"
                  : "bg-gray-800"
              } hover:bg-pink-700 capitalize`}
            >
              {tab === "tv" ? "TV Shows" : tab}
            </button>
          ))}
        </div>

        {/* 🔍 SEARCH BAR */}
        <form
          onSubmit={handleSearch}
          className="flex gap-2 items-stretch mb-10 max-w-2xl mx-auto"
        >
          <input
            type="text"
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
            placeholder={`Search for a ${activeTab}`}
            className="w-full p-2 rounded bg-gray-800 text-white"
          />
          <button className="bg-pink-600 hover:bg-pink-700 text-white p-2 rounded">
            <Search className="size-6" />
          </button>
        </form>

        {/* 🧾 RESULTS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {results.map((result) => {
            if (
              !result.poster_path &&
              !result.profile_path
            )
              return null;

            /* 👤 PERSON RESULT */
            if (activeTab === "person") {
              return (
                <div
                  key={result.id}
                  className="bg-gray-800 p-4 rounded"
                >
                  <img
                    src={
                      ORIGINAL_IMG_BASE_URL +
                      result.profile_path
                    }
                    alt={result.name}
                    className="max-h-96 rounded mx-auto"
                  />
                  <h2 className="mt-2 text-xl font-bold text-center">
                    {result.name}
                  </h2>
                </div>
              );
            }

            /* 🎬 MOVIE / TV RESULT */
            return (
              <Link
                key={result.id}
                to={`/watch/${result.id}`}
                onClick={async () => {
                  await logPosterClick(result);
                  setContentType(activeTab);
                }}
                className="bg-gray-800 p-4 rounded hover:bg-gray-700 transition"
              >
                <img
                  src={
                    ORIGINAL_IMG_BASE_URL +
                    result.poster_path
                  }
                  alt={
                    result.title || result.name
                  }
                  className="w-full h-auto rounded"
                />
                <h2 className="mt-2 text-lg font-semibold">
                  {result.title || result.name}
                </h2>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
