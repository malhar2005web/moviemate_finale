import useWatchlist from "../components/hooks/useWatchlist";
import { ORIGINAL_IMG_BASE_URL } from "../utils/constants";
import { Link } from "react-router-dom";


const WatchlistPage = () => {
  const { watchlist, removeFromWatchlist } = useWatchlist();


  return (
    <div className="min-h-screen bg-black text-white px-8 md:px-16 lg:px-32 py-10">
      <h1 className="text-3xl font-bold mb-6">My Watchlist</h1>

      {watchlist.length === 0 ? (
        <p className="text-gray-400">
          Your watchlist is empty. Add some movies 🎬
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {watchlist.map((movie) => (
            <div key={movie.id} className="relative">
              <button
                onClick={() => removeFromWatchlist(movie.id)}
                className="absolute top-2 left-2 bg-black/70 px-2 py-1 text-xs rounded"
              >
                Remove
              </button>

              <Link to={`/watch/${movie.id}`}>
                <img
  src={
    movie.image
      ? ORIGINAL_IMG_BASE_URL + movie.image
      : "/fallback.jpg"
  }
  alt={movie.title}
  className="rounded-lg hover:scale-105 transition"
/>

              </Link>

              <p className="text-sm mt-2">{movie.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};



export default WatchlistPage;
