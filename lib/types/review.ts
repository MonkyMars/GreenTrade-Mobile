export interface Review {
  rating: number;
  userId: string;
  sellerId: string;
  title: string;
  content: string;
  helpfulCount: number;
  verifiedPurchase: boolean;
}

export interface FetchedReview extends Review {
  id: string;
  createdAt: string;
  updatedAt: string;
  userName: string;
}
