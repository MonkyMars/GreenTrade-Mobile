export interface ChatMessage {
  id: string
  conversationId: string
  text: string
  senderId: string
  timestamp: Date | string
}

export interface Conversation {
  id: string
  listingId: string
  sellerId: string
  buyerId: string
  sellerName: string
  buyerName: string
  listingName: string
  lastMessage?: {
    text: string
    timestamp: Date | string
  }
}
