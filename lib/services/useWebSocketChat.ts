import { useEffect, useRef, useCallback } from 'react'
import { BASE_URL } from '../backend/api/axiosConfig'
import { ChatMessage } from '../types/chat'
import { safeParseDate } from '../utils/date/chatDateUtils'

interface UseWebSocketProps {
  conversationId: string | null
  userId: string | null
  onMessage: (message: ChatMessage) => void
  onError: (errorMsg: string) => void
}

export const useWebSocketChat = ({
  conversationId,
  userId,
  onMessage,
  onError,
}: UseWebSocketProps) => {
  const ws = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isUnmounting = useRef(false)

  // WebSocket connection handling with reconnection logic
  const connectWebSocket = useCallback(() => {
    if (!conversationId || !userId) return

    // Clear any existing reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    // Close existing connection if open
    if (
      ws.current &&
      (ws.current.readyState === WebSocket.OPEN ||
        ws.current.readyState === WebSocket.CONNECTING)
    ) {
      ws.current.close()
    }

    try {
      // Get the base URL with protocol
      const wsBaseUrl = BASE_URL.replace(/^https?:\/\//, '')
      const wsProtocol = BASE_URL.startsWith('https') ? 'wss' : 'ws'
      const wsUrl = `${wsProtocol}://${wsBaseUrl}/ws/chat/${conversationId}/${userId}`
      console.log(`Attempting to connect to WebSocket: ${wsUrl}`)

      // Create a standard WebSocket connection
      ws.current = new WebSocket(wsUrl)

      // Set a connection timeout to handle when the WebSocket fails to connect
      const connectionTimeout = setTimeout(() => {
        if (ws.current && ws.current.readyState !== WebSocket.OPEN) {
          console.log('WebSocket connection timeout, closing and retrying')
          ws.current.close()
        }
      }, 5000)

      ws.current.onopen = () => {
        clearTimeout(connectionTimeout)
        console.log(`WebSocket connected for conversation ${conversationId}`)
        // Reset reconnect attempts on successful connection
        reconnectAttempts.current = 0
        onError('')

        // Send a small ping message to ensure the connection is fully established
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          try {
            ws.current.send(JSON.stringify({ type: 'ping' }))
          } catch (e) {
            console.error('Error sending initial ping:', e)
          }
        }
      }

      ws.current.onclose = event => {
        clearTimeout(connectionTimeout)
        console.log(
          `WebSocket disconnected for conversation ${conversationId}`,
          event.code,
          event.reason,
        )

        // Don't attempt to reconnect if we closed intentionally, are unmounting, or reached max attempts
        if (
          isUnmounting.current ||
          event.code === 1000 ||
          reconnectAttempts.current >= maxReconnectAttempts
        ) {
          console.log(
            'Not attempting to reconnect: clean close, unmounting, or max attempts reached',
          )
          return
        }

        // Implement exponential backoff for reconnection
        const delay = Math.min(
          1000 * Math.pow(2, reconnectAttempts.current),
          30000,
        )
        console.log(
          `Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`,
        )

        reconnectTimeoutRef.current = setTimeout(() => {
          if (
            !isUnmounting.current &&
            reconnectAttempts.current < maxReconnectAttempts
          ) {
            reconnectAttempts.current++
            connectWebSocket()
          } else {
            onError(
              'Failed to connect to chat after multiple attempts. Please try again later.',
            )
          }
        }, delay)
      }

      ws.current.onerror = event => {
        console.error('WebSocket error:', event)
        // Don't set error here as onclose will be called after error
      }

      ws.current.onmessage = event => {
        try {
          // Handle ping/pong messages for keeping the connection alive
          if (event.data === 'ping' || event.data === '{"type":"ping"}') {
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
              ws.current.send(JSON.stringify({ type: 'pong' }))
            }
            return
          }

          const messageData = JSON.parse(event.data)
          // Assuming the backend sends messages in the same structure as the Message struct
          const newChatMessage: ChatMessage = {
            text: messageData.content,
            id: messageData.id,
            conversationId: messageData.conversation_id,
            senderId: messageData.sender_id,
            timestamp: safeParseDate(messageData.created_at),
          }

          // Notify the component about the new message
          onMessage(newChatMessage)
        } catch (e) {
          console.error('Failed to parse incoming WebSocket message:', e)
        }
      }
    } catch (error) {
      console.error('Error creating WebSocket connection:', error)
      onError('Failed to establish chat connection. Please try again.')
    }
  }, [conversationId, userId, onMessage, onError])

  // Set up the WebSocket connection
  useEffect(() => {
    // Mark unmounting flag as false when the component mounts
    isUnmounting.current = false

    // Reset reconnection attempts when conversation changes
    reconnectAttempts.current = 0
    connectWebSocket()

    // Set up a ping interval to keep the connection alive
    let pingInterval: NodeJS.Timeout | null = null

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      pingInterval = setInterval(() => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          try {
            ws.current.send(JSON.stringify({ type: 'ping' }))
          } catch (e) {
            console.error('Error sending ping:', e)
            // If ping fails, try to reconnect
            if (ws.current) {
              ws.current.close()
            }
          }
        }
      }, 30000) // Send a ping every 30 seconds
    }

    // Cleanup: Close WebSocket connection when component unmounts or IDs change
    return () => {
      // Mark as unmounting to prevent reconnection attempts during cleanup
      isUnmounting.current = true

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }

      if (pingInterval) {
        clearInterval(pingInterval)
      }

      if (ws.current) {
        // Use code 1000 to indicate normal closure
        ws.current.close(1000, 'Component unmounting or conversation changed')
      }
    }
  }, [conversationId, userId, connectWebSocket])

  return {
    sendMessage: (message: string) => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        try {
          ws.current.send(message)
          return true
        } catch (e) {
          console.error('Error sending message:', e)
          return false
        }
      }
      return false
    },
  }
}
