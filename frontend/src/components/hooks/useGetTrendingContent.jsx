import { useEffect, useState } from "react";
import { useContentStore } from "../../store/content.js";
import axios from "axios";

const useGetTrendingContent = () => {
	const [trendingContent, setTrendingContent] = useState(null);
	const [error, setError] = useState(null);
	const { contentType } = useContentStore();

	useEffect(() => {
		const getTrendingContent = async () => {
			try {
				const res = await axios.get(`/api/v1/${contentType}/trending`);
				setTrendingContent(res.data.content);
			} catch (err) {
				console.error("Error fetching trending content:", err.message);
				setError(err.message);
			}
		};

		if (contentType) {
			getTrendingContent();
		}
	}, [contentType]);

	return { trendingContent, error };
};

export default useGetTrendingContent;
