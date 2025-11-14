import requests
import json
import os
import time
from collections import defaultdict
from functools import wraps
import numpy as np
from sklearn.neighbors import NearestNeighbors
import pandas as pd
from mlxtend.preprocessing import TransactionEncoder
from mlxtend.frequent_patterns import apriori, association_rules
from datetime import datetime, timezone

# Constants
TMDB_API_KEY = "bc6dddace4cdc07f1fc2f980d3e5d707"
DATA_FILE = "media_history.json"
BASE_URL = "https://api.themoviedb.org/3"
MAX_RETRIES = 3
RETRY_DELAY = 1  # seconds
KNN_NEIGHBORS = 5
MIN_SUPPORT = 0.1
MIN_CONFIDENCE = 0.5

# Initialize data structure
def initialize_data():
    data = {
        "movies": {},
        "tv_shows": {},
        "watch_history": [],
        "preferences": {
            "movie_genres": defaultdict(int),
            "tv_genres": defaultdict(int),
            "actors": defaultdict(int),
            "directors": defaultdict(int)
        },
        "genre_cache": {},
        "movie_features": {},
        "tv_features": {},
        "association_rules": [],
        "updated_at": datetime.now(timezone.utc)
    }
    return data

# Load or create media history
try:
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r") as file:
            history_data = json.load(file)
            # Convert back to defaultdicts
            history_data["preferences"]["movie_genres"] = defaultdict(int, history_data["preferences"].get("movie_genres", {}))
            history_data["preferences"]["tv_genres"] = defaultdict(int, history_data["preferences"].get("tv_genres", {}))
            history_data["preferences"]["actors"] = defaultdict(int, history_data["preferences"].get("actors", {}))
            history_data["preferences"]["directors"] = defaultdict(int, history_data["preferences"].get("directors", {}))
            history_data["genre_cache"] = history_data.get("genre_cache", {})
            history_data["movie_features"] = history_data.get("movie_features", {})
            history_data["tv_features"] = history_data.get("tv_features", {})
            history_data["association_rules"] = history_data.get("association_rules", [])
    else:
        history_data = initialize_data()
except (json.JSONDecodeError, KeyError, Exception) as e:
    print(f"Error loading data file: {str(e)}. Initializing new data structure.")
    history_data = initialize_data()

def save_data():
    """Save data to file with proper serialization"""
    try:
        data_to_save = {
            "movies": history_data["movies"],
            "tv_shows": history_data["tv_shows"],
            "watch_history": history_data["watch_history"],
            "preferences": {
                "movie_genres": dict(history_data["preferences"]["movie_genres"]),
                "tv_genres": dict(history_data["preferences"]["tv_genres"]),
                "actors": dict(history_data["preferences"]["actors"]),
                "directors": dict(history_data["preferences"]["directors"])
            },
            "genre_cache": history_data["genre_cache"],
            "movie_features": history_data["movie_features"],
            "tv_features": history_data["tv_features"],
            "association_rules": history_data["association_rules"],
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        with open(DATA_FILE, "w") as file:
            json.dump(data_to_save, file, indent=4)
    except Exception as e:
        print(f"Error saving data: {str(e)}")

def retry_on_failure(func):
    """Decorator to retry API calls on failure"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        for attempt in range(MAX_RETRIES):
            try:
                return func(*args, **kwargs)
            except (requests.exceptions.RequestException, ConnectionResetError, Exception) as e:
                print(f"Attempt {attempt + 1} failed: {str(e)}")
                if attempt < MAX_RETRIES - 1:
                    time.sleep(RETRY_DELAY * (attempt + 1))
                    continue
                print("Max retries reached. Using fallback data.")
                return None
    return wrapper

@retry_on_failure
def get_tmdb_data(endpoint, params=None):
    """Helper function to get data from TMDb API"""
    if params is None:
        params = {}
    params["api_key"] = TMDB_API_KEY
    url = f"{BASE_URL}{endpoint}"
    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()
    return response.json()

def cache_genres():
    """Cache all available genres from TMDB for both movies and TV"""
    try:
        if not history_data["genre_cache"]:
            # Movie genres
            movie_data = get_tmdb_data("/genre/movie/list")
            if movie_data and "genres" in movie_data:
                for g in movie_data["genres"]:
                    history_data["genre_cache"][f"movie_{g['id']}"] = g["name"]
            
            # TV genres
            tv_data = get_tmdb_data("/genre/tv/list")
            if tv_data and "genres" in tv_data:
                for g in tv_data["genres"]:
                    history_data["genre_cache"][f"tv_{g['id']}"] = g["name"]
            
            save_data()
    except Exception as e:
        print(f"Error caching genres: {str(e)}")

def get_genre_names(genre_ids, media_type="movie"):
    """Convert list of genre IDs to genre names"""
    if not genre_ids or not isinstance(genre_ids, list):
        return []
    prefix = "movie_" if media_type == "movie" else "tv_"
    return [history_data["genre_cache"].get(f"{prefix}{gid}", "") for gid in genre_ids 
            if f"{prefix}{gid}" in history_data["genre_cache"]]

def extract_movie_features(movie_details):
    """Extract features for KNN algorithm for movies"""
    try:
        features = {
            "popularity": movie_details.get("popularity", 0),
            "vote_average": movie_details.get("vote_average", 0),
            "vote_count": movie_details.get("vote_count", 0),
            "genres": [g["id"] for g in movie_details.get("genres", [])],
            "year": int(movie_details.get("release_date", "1970")[:4]) if movie_details.get("release_date") else 1970
        }
        return features
    except Exception as e:
        print(f"Error extracting movie features: {str(e)}")
        return None

def extract_tv_features(tv_details):
    """Extract features for KNN algorithm for TV shows"""
    try:
        features = {
            "popularity": tv_details.get("popularity", 0),
            "vote_average": tv_details.get("vote_average", 0),
            "vote_count": tv_details.get("vote_count", 0),
            "genres": [g["id"] for g in tv_details.get("genres", [])],
            "year": int(tv_details.get("first_air_date", "1970")[:4]) if tv_details.get("first_air_date") else 1970,
            "seasons": tv_details.get("number_of_seasons", 1)
        }
        return features
    except Exception as e:
        print(f"Error extracting TV features: {str(e)}")
        return None

def build_knn_model(media_type="movie"):
    """Build KNN model based on media features"""
    try:
        feature_key = "movie_features" if media_type == "movie" else "tv_features"
        if not history_data[feature_key] or len(history_data[feature_key]) < KNN_NEIGHBORS:
            return None
            
        # Prepare feature matrix
        titles = []
        features = []
        for title, feat in history_data[feature_key].items():
            titles.append(title)
            # Create feature vector: popularity, vote_avg, vote_count, year, and genre flags
            genre_flags = [0] * len(history_data["genre_cache"])
            for genre_id in feat["genres"]:
                cache_key = f"{media_type}_{genre_id}"
                if cache_key in history_data["genre_cache"]:
                    idx = list(history_data["genre_cache"].keys()).index(cache_key)
                    genre_flags[idx] = 1
            
            feature_vec = [
                feat["popularity"],
                feat["vote_average"],
                feat["vote_count"],
                feat["year"],
                *genre_flags
            ]
            
            # Add seasons for TV shows
            if media_type == "tv":
                feature_vec.append(feat["seasons"])
            
            features.append(feature_vec)
        
        # Normalize features
        features = np.array(features)
        features = (features - features.mean(axis=0)) / (features.std(axis=0) + 1e-10)
        
        # Build KNN model
        n_neighbors = min(KNN_NEIGHBORS, len(titles) - 1)
        model = NearestNeighbors(n_neighbors=n_neighbors, algorithm='auto').fit(features)
        return model, titles, features
    except Exception as e:
        print(f"Error building KNN model: {str(e)}")
        return None

def get_knn_recommendations(title, media_type="movie", n_recommendations=5):
    """Get recommendations using KNN algorithm"""
    try:
        feature_key = "movie_features" if media_type == "movie" else "tv_features"
        if title not in history_data[feature_key]:
            return []
            
        knn_data = build_knn_model(media_type)
        if not knn_data:
            return []
            
        model, titles, features = knn_data
        title_idx = titles.index(title)
        
        distances, indices = model.kneighbors([features[title_idx]])
        recommendations = []
        for idx in indices[0][1:n_recommendations+1]:  # Skip the first one (itself)
            rec_title = titles[idx]
            if media_type == "movie" and rec_title in history_data["movies"]:
                recommendations.append(format_movie_data_from_storage(rec_title))
            elif media_type == "tv" and rec_title in history_data["tv_shows"]:
                recommendations.append(format_tv_data_from_storage(rec_title))
        
        return recommendations
    except Exception as e:
        print(f"Error getting KNN recommendations: {str(e)}")
        return []

def update_association_rules():
    """Update association rules using Apriori algorithm"""
    try:
        if len(history_data["watch_history"]) < 5:
            return
            
        # Prepare transaction data (user's watching sessions)
        transactions = []
        watch_history = history_data["watch_history"]
        
        for i in range(len(watch_history) - 2):
            transactions.append(watch_history[i:i+3])
        
        if len(transactions) < 3:
            return
            
        # Convert to one-hot encoded format
        te = TransactionEncoder()
        te_ary = te.fit(transactions).transform(transactions)
        df = pd.DataFrame(te_ary, columns=te.columns_)
        
        # Run Apriori algorithm
        frequent_itemsets = apriori(df, min_support=MIN_SUPPORT, use_colnames=True)
        if len(frequent_itemsets) == 0:
            return
            
        rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=MIN_CONFIDENCE)
        if len(rules) == 0:
            return
            
        # Store the most relevant rules
        history_data["association_rules"] = rules.sort_values('lift', ascending=False).head(10).to_dict('records')
        save_data()
    except Exception as e:
        print(f"Error updating association rules: {str(e)}")

def get_association_recommendations():
    """Get recommendations based on association rules"""
    try:
        if not history_data["association_rules"] or not history_data["watch_history"]:
            return []
            
        last_watched = history_data["watch_history"][-1]
        recommendations = []
        
        for rule in history_data["association_rules"]:
            antecedents = list(rule['antecedents'])
            consequents = list(rule['consequents'])
            
            if last_watched in antecedents:
                for title in consequents:
                    if title != last_watched:
                        if title in history_data["movies"]:
                            recommendations.append(format_movie_data_from_storage(title))
                        elif title in history_data["tv_shows"]:
                            recommendations.append(format_tv_data_from_storage(title))
            
            if len(recommendations) >= 5:
                break
                
        return recommendations[:5]
    except Exception as e:
        print(f"Error getting association recommendations: {str(e)}")
        return []

def format_movie_data_from_storage(title):
    """Format movie data from our storage"""
    movie = history_data["movies"].get(title, {})
    return {
        "title": movie.get("title", title),
        "year": movie.get("year", "N/A"),
        "rating": movie.get("rating", "N/A"),
        "overview": movie.get("overview", "No description available."),
        "genres": movie.get("genres", ["N/A"]),
        "type": "movie"
    }

def format_tv_data_from_storage(title):
    """Format TV show data from our storage"""
    tv = history_data["tv_shows"].get(title, {})
    return {
        "title": tv.get("title", title),
        "year": tv.get("year", "N/A"),
        "rating": tv.get("rating", "N/A"),
        "overview": tv.get("overview", "No description available."),
        "genres": tv.get("genres", ["N/A"]),
        "seasons": tv.get("seasons", "N/A"),
        "type": "tv"
    }

def format_movie_data(movie):
    """Standardize movie data format"""
    return {
        "title": movie.get("title", "Unknown"),
        "year": movie.get("release_date", "")[:4] if movie.get("release_date") else "N/A",
        "rating": movie.get("vote_average", "N/A"),
        "overview": movie.get("overview", "No description available."),
        "genres": get_genre_names(movie.get("genre_ids", []), "movie"),
        "type": "movie"
    }

def format_tv_data(tv):
    """Standardize TV show data format"""
    return {
        "title": tv.get("name", "Unknown"),
        "year": tv.get("first_air_date", "")[:4] if tv.get("first_air_date") else "N/A",
        "rating": tv.get("vote_average", "N/A"),
        "overview": tv.get("overview", "No description available."),
        "genres": get_genre_names(tv.get("genre_ids", []), "tv"),
        "seasons": tv.get("number_of_seasons", "N/A"),
        "type": "tv"
    }

def get_fallback_media(media_type="movie"):
    """Return fallback media"""
    if media_type == "movie":
        return {
            "title": "The Shawshank Redemption",
            "year": "1994",
            "rating": 8.7,
            "overview": "Two imprisoned men bond over a number of years...",
            "genres": ["Drama"],
            "type": "movie"
        }
    else:
        return {
            "title": "Breaking Bad",
            "year": "2008",
            "rating": 8.9,
            "overview": "A high school chemistry teacher diagnosed with cancer...",
            "genres": ["Drama", "Crime"],
            "seasons": 5,
            "type": "tv"
        }

def search_movie(query):
    """Search for a movie and return its details"""
    try:
        normalized_query = query.lower().strip()
        for title, data in history_data["movies"].items():
            if title.lower().strip() == normalized_query:
                return data
        
        search_data = get_tmdb_data("/search/movie", {"query": query})
        if not search_data or not search_data.get("results"):
            print(f"No results found for movie: {query}")
            return get_fallback_media("movie")
        
        movie = search_data["results"][0]
        movie_id = movie["id"]
        
        details = get_tmdb_data(f"/movie/{movie_id}", {"append_to_response": "credits,recommendations"})
        if not details:
            print(f"Could not get details for movie ID: {movie_id}")
            return get_fallback_media("movie")
        
        movie_info = {
            "title": details.get("title", query),
            "year": details.get("release_date", "")[:4] if details.get("release_date") else "N/A",
            "rating": details.get("vote_average", "N/A"),
            "genres": [g["name"] for g in details.get("genres", [])],
            "actors": [cast["name"] for cast in details.get("credits", {}).get("cast", [])][:5],
            "director": next((crew["name"] for crew in details.get("credits", {}).get("crew", []) 
                         if crew.get("job") == "Director"), "Unknown"),
            "recommendations": get_recommendations(details, normalized_query, "movie"),
            "type": "movie"
        }
        
        # Store movie data and features
        history_data["movies"][movie_info["title"]] = movie_info
        features = extract_movie_features(details)
        if features:
            history_data["movie_features"][movie_info["title"]] = features
        
        history_data["watch_history"].append(movie_info["title"])
        update_preferences(movie_info, "movie")
        
        # Update recommendation models
        update_association_rules()
        save_data()
        
        return movie_info
    except Exception as e:
        print(f"Error in movie search: {str(e)}")
        return get_fallback_media("movie")

def search_tv_show(query):
    """Search for a TV show and return its details"""
    try:
        normalized_query = query.lower().strip()
        for title, data in history_data["tv_shows"].items():
            if title.lower().strip() == normalized_query:
                return data
        
        search_data = get_tmdb_data("/search/tv", {"query": query})
        if not search_data or not search_data.get("results"):
            print(f"No results found for TV show: {query}")
            return get_fallback_media("tv")
        
        tv = search_data["results"][0]
        tv_id = tv["id"]
        
        details = get_tmdb_data(f"/tv/{tv_id}", {"append_to_response": "credits,recommendations"})
        if not details:
            print(f"Could not get details for TV ID: {tv_id}")
            return get_fallback_media("tv")
        
        tv_info = {
            "title": details.get("name", query),
            "year": details.get("first_air_date", "")[:4] if details.get("first_air_date") else "N/A",
            "rating": details.get("vote_average", "N/A"),
            "genres": [g["name"] for g in details.get("genres", [])],
            "actors": [cast["name"] for cast in details.get("credits", {}).get("cast", [])][:5],
            "seasons": details.get("number_of_seasons", "N/A"),
            "recommendations": get_recommendations(details, normalized_query, "tv"),
            "type": "tv"
        }
        
        # Store TV data and features
        history_data["tv_shows"][tv_info["title"]] = tv_info
        features = extract_tv_features(details)
        if features:
            history_data["tv_features"][tv_info["title"]] = features
        
        history_data["watch_history"].append(tv_info["title"])
        update_preferences(tv_info, "tv")
        
        # Update recommendation models
        update_association_rules()
        save_data()
        
        return tv_info
    except Exception as e:
        print(f"Error in TV show search: {str(e)}")
        return get_fallback_media("tv")

def get_recommendations(details, original_title, media_type="movie"):
    """Get recommendations from multiple sources"""
    try:
        recommendations = []
        seen_titles = {original_title, details.get("title", "").lower(), details.get("name", "").lower()}
        
        # 1. Get KNN recommendations first
        title = details.get("title") if media_type == "movie" else details.get("name")
        knn_recs = get_knn_recommendations(title, media_type, 3)
        for rec in knn_recs:
            if rec["title"].lower() not in seen_titles:
                recommendations.append(rec)
                seen_titles.add(rec["title"].lower())
        
        # 2. Official recommendations
        if details.get("recommendations", {}).get("results"):
            for rec in details["recommendations"]["results"]:
                title = rec.get("title", rec.get("name", "")).strip()
                if title and title.lower() not in seen_titles:
                    if media_type == "movie":
                        recommendations.append(format_movie_data(rec))
                    else:
                        recommendations.append(format_tv_data(rec))
                    seen_titles.add(title.lower())
                    if len(recommendations) >= 5:
                        break
        
        # 3. Similar by genre if needed
        if len(recommendations) < 5 and details.get("genres"):
            genre_recs = get_media_by_genres(
                [g["name"] for g in details.get("genres", [])], 
                media_type,
                5 - len(recommendations), 
                exclude_titles=seen_titles
            )
            recommendations.extend(genre_recs)
            seen_titles.update([r["title"].lower() for r in genre_recs])
        
        # 4. Association rule recommendations
        if len(recommendations) < 5:
            assoc_recs = get_association_recommendations()
            for rec in assoc_recs:
                if rec["title"].lower() not in seen_titles:
                    recommendations.append(rec)
                    seen_titles.add(rec["title"].lower())
                    if len(recommendations) >= 5:
                        break
        
        # 5. Popular media as final fallback
        if len(recommendations) < 5:
            popular_recs = get_popular_media(media_type, 5 - len(recommendations), exclude_titles=seen_titles)
            recommendations.extend(popular_recs)
        
        return recommendations[:5]
    except Exception as e:
        print(f"Error generating recommendations: {str(e)}")
        return get_popular_media(media_type, 5)

def get_media_by_genres(genres, media_type="movie", count=5, exclude_titles=None):
    """Get media matching specific genres"""
    if not genres:
        return []
    
    exclude_titles = exclude_titles or set()
    genre_ids = []
    
    # Find genre IDs for the specified media type
    prefix = "movie_" if media_type == "movie" else "tv_"
    for gid, name in history_data["genre_cache"].items():
        if gid.startswith(prefix) and name in genres:
            genre_ids.append(gid.replace(prefix, ""))
    
    if not genre_ids:
        return []
    
    endpoint = "/discover/movie" if media_type == "movie" else "/discover/tv"
    discover_data = get_tmdb_data(endpoint, {
        "with_genres": ",".join(genre_ids),
        "sort_by": "popularity.desc"
    })
    
    if not discover_data or not discover_data.get("results"):
        return []
    
    recommendations = []
    for item in discover_data["results"]:
        title = item.get("title", item.get("name", "")).strip()
        if title and title.lower() not in exclude_titles:
            if media_type == "movie":
                recommendations.append(format_movie_data(item))
            else:
                recommendations.append(format_tv_data(item))
            if len(recommendations) >= count:
                break
    
    return recommendations

def get_popular_media(media_type="movie", count=5, exclude_titles=None):
    """Get currently popular media"""
    exclude_titles = exclude_titles or set()
    endpoint = "/movie/popular" if media_type == "movie" else "/tv/popular"
    popular_data = get_tmdb_data(endpoint)
    
    if not popular_data or not popular_data.get("results"):
        return [get_fallback_media(media_type) for _ in range(count)]
    
    recommendations = []
    for item in popular_data["results"]:
        title = item.get("title", item.get("name", "")).strip()
        if title and title.lower() not in exclude_titles:
            if media_type == "movie":
                recommendations.append(format_movie_data(item))
            else:
                recommendations.append(format_tv_data(item))
            if len(recommendations) >= count:
                break
    
    return recommendations

def search_people(query, role):
    """Search for actors or directors"""
    search_data = get_tmdb_data("/search/person", {"query": query})
    if not search_data or not search_data.get("results"):
        print(f"No results found for {role}: {query}")
        return None
    
    person = search_data["results"][0]
    person_id = person["id"]
    
    credits_data = get_tmdb_data(f"/person/{person_id}/movie_credits")
    if not credits_data:
        print(f"Could not get credits for {role} ID: {person_id}")
        return None
    
    movies = credits_data.get("cast", []) if role == "actor" else [
        m for m in credits_data.get("crew", []) 
        if m.get("job", "").lower() == "director"
    ]
    
    top_movies = sorted(movies, key=lambda x: x.get("popularity", 0), reverse=True)[:5]
    return {
        "name": person.get("name", query),
        "movies": [format_movie_data(m) for m in top_movies]
    }

def search_genre(query, media_type="movie"):
    """Search for media by genre"""
    prefix = "movie_" if media_type == "movie" else "tv_"
    genre_id = next((gid.replace(prefix, "") for gid, name in history_data["genre_cache"].items() 
                    if gid.startswith(prefix) and name.lower() == query.lower()), None)
    if not genre_id:
        print(f"Genre not found: {query}")
        return None
    
    endpoint = "/discover/movie" if media_type == "movie" else "/discover/tv"
    discover_data = get_tmdb_data(endpoint, {
        "with_genres": genre_id,
        "sort_by": "popularity.desc"
    })
    
    if not discover_data or not discover_data.get("results"):
        print(f"No {media_type} found for genre: {query}")
        return None
    
    format_func = format_movie_data if media_type == "movie" else format_tv_data
    return {
        "genre": query,
        "type": media_type,
        "items": [format_func(item) for item in discover_data["results"][:5]]
    }

def update_preferences(media_data, media_type="movie"):
    """Update user preferences based on watched media"""
    if not media_data:
        return
    
    genre_key = "movie_genres" if media_type == "movie" else "tv_genres"
    for genre in media_data.get("genres", []):
        history_data["preferences"][genre_key][genre] += 1
    
    for actor in media_data.get("actors", []):
        history_data["preferences"]["actors"][actor] += 1
    
    if media_type == "movie":
        director = media_data.get("director", "")
        if director and director != "Unknown":
            history_data["preferences"]["directors"][director] += 1

def get_personalized_recommendations():
    """Get recommendations based on user preferences"""
    try:
        if not history_data["watch_history"]:
            return []
        
        # Try association rules first
        assoc_recs = get_association_recommendations()
        if assoc_recs:
            return assoc_recs[:5]
        
        # Fall back to KNN if available
        last_watched = history_data["watch_history"][-1]
        knn_recs = []
        
        if last_watched in history_data["movies"]:
            knn_recs = get_knn_recommendations(last_watched, "movie", 3)
        elif last_watched in history_data["tv_shows"]:
            knn_recs = get_knn_recommendations(last_watched, "tv", 3)
        
        if knn_recs:
            return knn_recs[:5]
        
        # Fall back to genre-based if needed
        recommendations = []
        
        # Check movie preferences
        top_movie_genres = sorted(history_data["preferences"]["movie_genres"].items(), 
                               key=lambda x: x[1], reverse=True)[:3]
        preferred_movie_genres = [g[0] for g in top_movie_genres if g[1] > 0]
        
        if preferred_movie_genres:
            movie_recs = get_media_by_genres(preferred_movie_genres, "movie", 3)
            recommendations.extend(movie_recs)
        
        # Check TV preferences
        top_tv_genres = sorted(history_data["preferences"]["tv_genres"].items(), 
                             key=lambda x: x[1], reverse=True)[:3]
        preferred_tv_genres = [g[0] for g in top_tv_genres if g[1] > 0]
        
        if preferred_tv_genres and len(recommendations) < 5:
            tv_recs = get_media_by_genres(preferred_tv_genres, "tv", 5 - len(recommendations))
            recommendations.extend(tv_recs)
        
        # Fallback to popular if needed
        if len(recommendations) < 5:
            remaining = 5 - len(recommendations)
            movie_count = min(remaining, 3)
            tv_count = remaining - movie_count
            
            recommendations.extend(get_popular_media("movie", movie_count))
            if tv_count > 0:
                recommendations.extend(get_popular_media("tv", tv_count))
        
        return recommendations[:5]
    except Exception as e:
        print(f"Error getting personalized recommendations: {str(e)}")
        return get_popular_media("movie", 3) + get_popular_media("tv", 2)

def display_recommendations(recommendations, title="Recommended Media"):
    """Display recommendations in a nice format"""
    if not recommendations:
        print("No recommendations available.")
        return
    
    print(f"\n🎬 {title}")
    print("━" * 50)
    for i, item in enumerate(recommendations[:5], 1):
        media_type = "🎥" if item.get("type") == "movie" else "📺"
        print(f"{i}. {media_type} {item.get('title', 'Unknown')} ({item.get('year', 'N/A')}) ⭐ {item.get('rating', 'N/A')}")
        print(f"   Genres: {', '.join(item.get('genres', ['N/A']))}")
        if item.get("type") == "tv":
            print(f"   Seasons: {item.get('seasons', 'N/A')}")
        print(f"   {item.get('overview', 'No description available.')}\n")

def display_search_menu():
    """Display the search options menu"""
    print("\nWhat would you like to search for?")
    print("1. Movie")
    print("2. TV Show")
    print("3. Actor")
    print("4. Director")
    print("5. Genre")
    print("6. Exit")

def display_media_results(media_data, query, media_type="movie"):
    """Display results for media search"""
    if media_data:
        media_type_str = "Movie" if media_type == "movie" else "TV Show"
        print(f"\nFound {media_type_str}: {media_data['title']} ({media_data.get('year', 'N/A')}) ⭐ {media_data.get('rating', 'N/A')}")
        print(f"Genres: {', '.join(media_data.get('genres', ['N/A']))}")
        
        if media_type == "movie":
            print(f"Director: {media_data.get('director', 'Unknown')}")
        
        print(f"Stars: {', '.join(media_data.get('actors', ['Unknown'])[:3])}")
        
        if media_type == "tv":
            print(f"Seasons: {media_data.get('seasons', 'N/A')}")
        
        print(f"\n{media_data.get('overview', 'No description available.')}")
        
        if media_data.get("recommendations"):
            rec_title = f"Similar {media_type_str}s" if media_type == "movie" else "Similar TV Shows"
            display_recommendations(media_data["recommendations"], rec_title)
        else:
            print(f"\nNo similar {media_type_str}s found. Here are some popular recommendations:")
            display_recommendations(get_popular_media(media_type, 5))
    else:
        print("\nMedia not found. Here are some popular recommendations:")
        display_recommendations(get_popular_media(media_type, 5))

def display_people_results(data, query, prefix):
    """Display results for actor/director search"""
    if data and data.get("movies"):
        print(f"\n{prefix} {data.get('name', query)}:")
        display_recommendations(data["movies"])
    else:
        print(f"\nNo results found. Here are some popular movies:")
        display_recommendations(get_popular_media("movie", 5))

def display_genre_results(data, query):
    """Display results for genre search"""
    if data and data.get("items"):
        media_type = "Movies" if data["type"] == "movie" else "TV Shows"
        print(f"\nPopular {data.get('genre', query)} {media_type}:")
        display_recommendations(data["items"])
    else:
        print("\nGenre not found or no media available. Here are some popular recommendations:")
        display_recommendations(get_popular_media("movie", 3) + get_popular_media("tv", 2))

def main():
    """Main program loop"""
    try:
        print("🎥 Media Recommendation Engine (Movies & TV Shows)")
        print("Type 'exit' at any time to return to the menu\n")
        
        # Initialize genre cache
        cache_genres()
        
        while True:
            display_search_menu()
            choice = input("\nEnter your choice (1-6): ").strip()
            
            if choice == '6' or choice.lower() == 'exit':
                print("\nThanks for using the Media Recommendation Engine!")
                save_data()
                break
            
            if choice == '1':
                query = input("\nEnter movie name: ").strip()
                if query.lower() == 'exit':
                    continue
                
                movie_data = search_movie(query)
                display_media_results(movie_data, query, "movie")
            
            elif choice == '2':
                query = input("\nEnter TV show name: ").strip()
                if query.lower() == 'exit':
                    continue
                
                tv_data = search_tv_show(query)
                display_media_results(tv_data, query, "tv")
            
            elif choice == '3':
                query = input("\nEnter actor name: ").strip()
                if query.lower() == 'exit':
                    continue
                
                actor_data = search_people(query, "actor")
                display_people_results(actor_data, query, "Movies featuring")
            
            elif choice == '4':
                query = input("\nEnter director name: ").strip()
                if query.lower() == 'exit':
                    continue
                
                director_data = search_people(query, "director")
                display_people_results(director_data, query, "Movies directed by")
            
            elif choice == '5':
                query = input("\nEnter genre: ").strip()
                if query.lower() == 'exit':
                    continue
                
                # Ask for media type
                media_type = input("Search in Movies or TV shows? (m/t): ").strip().lower()
                if media_type not in ['m', 't']:
                    media_type = 'm'
                
                genre_data = search_genre(query, "movie" if media_type == 'm' else "tv")
                display_genre_results(genre_data, query)
            
            else:
                print("\nInvalid choice. Please enter a number between 1-6.")
                continue
            
            # Show personalized recommendations if available
            personalized_recs = get_personalized_recommendations()
            if personalized_recs:
                display_recommendations(personalized_recs, "Personalized Recommendations For You")
    except Exception as e:
        print(f"An unexpected error occurred: {str(e)}")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Fatal error: {str(e)}")