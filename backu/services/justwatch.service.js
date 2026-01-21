import axios from "axios";

const JUSTWATCH_GRAPHQL = "https://apis.justwatch.com/graphql";

export const fetchJustWatchAvailability = async (title) => {
  if (!title || typeof title !== "string") {
    throw new Error("Invalid title passed to JustWatch");
  }

  const query = `
    query SearchTitles($search: String!) {
      searchTitles(
        search: $search
        country: "IN"
        language: "en"
        first: 5
      ) {
        edges {
          node {
            offers {
              monetizationType
              package {
                clearName
              }
            }
          }
        }
      }
    }
  `;

  const response = await axios.post(
    JUSTWATCH_GRAPHQL,
    {
      query,
      variables: { search: title },
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const offers =
    response.data?.data?.searchTitles?.edges?.[0]?.node?.offers || [];

  const availability = {
    netflix: false,
    prime: false,
    hotstar: false,
    zee5: false,
    sonyliv: false,
    jiocinema: false,
  };

  offers.forEach((offer) => {
    const name = offer.package.clearName.toLowerCase();

    if (name.includes("netflix")) availability.netflix = true;
    if (name.includes("amazon")) availability.prime = true;
    if (name.includes("hotstar") || name.includes("disney"))
      availability.hotstar = true;
    if (name.includes("zee")) availability.zee5 = true;
    if (name.includes("sony")) availability.sonyliv = true;
    if (name.includes("jio")) availability.jiocinema = true;
  });

  return availability;
};
