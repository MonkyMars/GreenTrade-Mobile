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
  listingTitle?: string
  listingImage?: string
  participantName?: string
  participantId?: string
  lastMessage?: string
  lastMessageTime?: Date | string
  unreadCount?: number
  participantImage?: string | null
  isOnline?: boolean
  isVerified?: boolean
}
