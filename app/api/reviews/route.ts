import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createReview,
  findVerifiedOrderIdForProduct,
  getReviewsByProductId,
} from "@/lib/queries/reviews";
import { getProductById } from "@/lib/queries/products";
import {
  REVIEW_RATE_LIMIT,
  consumeReviewRateLimit,
  hashClientIp,
} from "@/lib/security/reviewRateLimit";

/**
 * Cheap, high-yield spam filter: review bodies have no legitimate reason to
 * contain a link. Catches scheme-prefixed URLs, bare `www.`, and bare domains
 * on the TLDs that turn up in link spam.
 */
const URL_PATTERN =
  /(https?:\/\/|www\.|\b[a-z0-9][a-z0-9-]*\.(com|net|org|io|ru|cn|xyz|top|shop|store|info|biz|link|click)\b)/i;

export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("product_id");
  if (!productId) {
    return NextResponse.json({ message: "product_id required" }, { status: 400 });
  }

  const reviews = await getReviewsByProductId(productId);
  return NextResponse.json(reviews);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const product_id = String(body.product_id ?? "").trim();
    const author_name = String(body.author_name ?? "").trim();
    const rating = Number(body.rating);
    const reviewBody = String(body.body ?? "").trim();

    if (!product_id) {
      return NextResponse.json({ message: "Product is required" }, { status: 400 });
    }
    if (!author_name || author_name.length < 2 || author_name.length > 80) {
      return NextResponse.json(
        { message: "Name must be 2–80 characters" },
        { status: 400 }
      );
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }
    if (!reviewBody || reviewBody.length < 10 || reviewBody.length > 2000) {
      return NextResponse.json(
        { message: "Review must be 10–2000 characters" },
        { status: 400 }
      );
    }
    if (URL_PATTERN.test(reviewBody) || URL_PATTERN.test(author_name)) {
      return NextResponse.json(
        { message: "Reviews cannot contain links" },
        { status: 400 }
      );
    }

    const ipHash = hashClientIp(request);
    if (!ipHash) {
      console.error("REVIEW_IP_SALT is not set; refusing review submissions.");
      return NextResponse.json(
        { message: "Reviews are temporarily unavailable" },
        { status: 503 }
      );
    }

    const withinLimit = await consumeReviewRateLimit(ipHash);
    if (!withinLimit) {
      return NextResponse.json(
        {
          message: `You can submit ${REVIEW_RATE_LIMIT} reviews per hour. Please try again later.`,
        },
        { status: 429 }
      );
    }

    const product = await getProductById(product_id);
    if (!product?.is_active) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let orderId: string | null = null;
    if (user) {
      orderId = await findVerifiedOrderIdForProduct(
        supabase,
        user.id,
        product_id
      );
    }

    const created = await createReview(
      {
        product_id,
        author_name,
        rating,
        body: reviewBody,
        ip_hash: ipHash,
        order_id: orderId,
      },
      supabase
    );

    if (created.status === "approved") {
      return NextResponse.json(
        {
          message: "Thanks — your verified review is now live.",
          verified: true,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { message: "Thanks — your review will appear once it's approved." },
      { status: 202 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to submit review";
    return NextResponse.json({ message }, { status: 500 });
  }
}
