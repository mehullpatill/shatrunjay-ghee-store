import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) {
    return NextResponse.json({
      configured: false,
      rating: 4.9,
      totalReviews: 0,
      reviews: [],
    });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
      placeId
    )}&fields=rating,user_ratings_total,reviews&key=${encodeURIComponent(apiKey)}`;

    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();

    if (data.status !== "OK" || !data.result) {
      return NextResponse.json({ configured: true, rating: 4.9, totalReviews: 0, reviews: [] });
    }

    return NextResponse.json({
      configured: true,
      rating: data.result.rating ?? 4.9,
      totalReviews: data.result.user_ratings_total ?? 0,
      reviews: (data.result.reviews || []).map((r: Record<string, unknown>) => ({
        authorName: r.author_name,
        rating: r.rating,
        text: r.text,
        relativeTime: r.relative_time_description,
        profilePhotoUrl: r.profile_photo_url,
      })),
    });
  } catch (err) {
    console.error("Google Reviews error:", err);
    return NextResponse.json({ configured: true, rating: 4.9, totalReviews: 0, reviews: [] });
  }
}
