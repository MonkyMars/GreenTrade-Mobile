import { useEffect, useRef, useCallback, useState } from 'react'
import { BASE_URL } from '../backend/api/axiosConfig'
import { ChatMessage } from '../types/chat'
import { safeParseDate } from '../utils/date/chatDateUtils'
import { sendMessage as sendMessageHttp } from '../functions/chat/sendMessage'

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
  const maxReconnectAttempts = 3
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pongIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pongTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastPingSentRef = useRef<number | null>(null)
  const pongReceivedRef = useRef(false)
  const isUnmounting = useRef(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isReconnecting = useRef(false)
  const hasActiveConnection = useRef(false)
  const connectionIdRef = useRef<string | null>(null)
  
  // Clean up all timers and intervals
  const cleanupTimers = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
    }
    
    if (pongIntervalRef.current) {
      clearInterval(pongIntervalRef.current)
      pongIntervalRef.current = null
    }
    
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current)
      connectionTimeoutRef.current = null
    }
    
    if (pongTimeoutRef.current) {
      clearTimeout(pongTimeoutRef.current)
      pongTimeoutRef.current = null
    }
  }, [])

  // Handle pong timeout - check if a pong was received
  const checkPongReceived = useCallback(() => {
    if (!pongReceivedRef.current && hasActiveConnection.current) {
      console.error('No pong response received within timeout, connection might be broken')
      // If no pong was received and we're not already reconnecting, close the connection to trigger reconnect
      if (ws.current && !isReconnecting.current) {
        isReconnecting.current = true
        hasActiveConnection.current = false
        ws.current.close(3000, 'No pong response received')
      }
    }
    
    // Reset for next ping cycle
    pongReceivedRef.current = false
  }, [])

  // Setup ping interval to keep connection alive
  const setupPingInterval = useCallback(() => {
    // Clear any existing ping interval first
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
    }
    
    // Clear any existing pong timeout
    if (pongTimeoutRef.current) {
      clearTimeout(pongTimeoutRef.current)
      pongTimeoutRef.current = null
    }
    
    pingIntervalRef.current = setInterval(() => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN && hasActiveConnection.current) {
        try {
          // Send ping and record the time
          ws.current.send(JSON.stringify({ type: 'ping' }))
          lastPingSentRef.current = Date.now()
          pongReceivedRef.current = false
          
          // Set a timeout to check if we receive a pong
          if (pongTimeoutRef.current) {
            clearTimeout(pongTimeoutRef.current)
          }
          
          pongTimeoutRef.current = setTimeout(() => {
            checkPongReceived()
          }, 5000) // Wait 5 seconds for pong response
          
        } catch (e) {
          console.error('Error sending ping:', e)
          // If ping fails and we're not already reconnecting, try to reconnect
          if (ws.current && !isReconnecting.current) {
            isReconnecting.current = true
            hasActiveConnection.current = false
            ws.current.close()
          }
        }
      } else if (ws.current && ws.current.readyState === WebSocket.CLOSED) {
        // If socket is closed, clear the interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current)
          pingIntervalRef.current = null
        }
        
        if (pongTimeoutRef.current) {
          clearTimeout(pongTimeoutRef.current)
          pongTimeoutRef.current = null
        }
      }
    }, 30000) // Send a ping every 30 seconds
  }, [checkPongReceived])
  
  // Setup regular pong sending to keep connection alive
  const setupPongInterval = useCallback(() => {
    // Clear any existing pong interval first
    if (pongIntervalRef.current) {
      clearInterval(pongIntervalRef.current)
      pongIntervalRef.current = null
    }
    
    pongIntervalRef.current = setInterval(() => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN && hasActiveConnection.current) {
        try {
          // Send pong to keep connection alive
          ws.current.send(JSON.stringify({ type: 'pong' }))
          // Avoid excessive logging
          // console.log('Sent proactive pong to keep connection alive')
        } catch (e) {
          console.error('Error sending proactive pong:', e)
          if (ws.current && !isReconnecting.current) {
            isReconnecting.current = true
            hasActiveConnection.current = false
            ws.current.close()
          }
        }
      } else if (ws.current && ws.current.readyState === WebSocket.CLOSED) {
        // If socket is closed, clear the interval
        if (pongIntervalRef.current) {
          clearInterval(pongIntervalRef.current)
          pongIntervalRef.current = null
        }
      }
    }, 5000) // Send a pong every 5 seconds to keep connection alive
  }, [])

  // Calculate exponential backoff delay with (n+1)^2 formula
  const calculateBackoffDelay = useCallback((attempt: number) => {
    // (n+1)^2 seconds, with a max of 30 seconds
    return Math.min(1000 * Math.pow(attempt + 1, 2), 30000)
  }, [])

  // WebSocket connection handling with reconnection logic
  const connectWebSocket = useCallback(() => {
    // Create a connection identifier to track the current connection attempt
    const connectionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    connectionIdRef.current = connectionId
    
    if (!conversationId || !userId) {
      console.log('No conversation ID or user found. Skipping WebSocket connection.')
      return
    }

    // Prevent multiple simultaneous connection attempts
    if (isConnecting || hasActiveConnection.current) {
      console.log('Already connected or attempting to connect. Skipping duplicate attempt.')
      return
    }
    
    // Set connecting state
    setIsConnecting(true)
    
    // Clean up any existing timers
    cleanupTimers()

    // Reset pong tracking state
    pongReceivedRef.current = false
    lastPingSentRef.current = null

    // Close existing connection if open
    if (
      ws.current &&
      (ws.current.readyState === WebSocket.OPEN ||
        ws.current.readyState === WebSocket.CONNECTING)
    ) {
      ws.current.close(1000, 'Starting new connection')
      ws.current = null
    }

    try {
      // Get the base URL with protocol
      let wsBaseUrl = BASE_URL.replace(/^https?:\/\//, '')
      // Remove any trailing slashes or paths
      wsBaseUrl = wsBaseUrl.split('/')[0]
      const wsProtocol = BASE_URL.startsWith('https') ? 'wss' : 'ws'
      const wsUrl = `${wsProtocol}://${wsBaseUrl}/ws/chat/${conversationId}/${userId}`
      console.log(`Attempting to connect to WebSocket: ${wsUrl}`)

      // Create a standard WebSocket connection
      ws.current = new WebSocket(wsUrl)

      // Set a connection timeout to handle when the WebSocket fails to connect
      connectionTimeoutRef.current = setTimeout(() => {
        // Only proceed if this is still the current connection attempt
        if (connectionIdRef.current !== connectionId) return
        
        if (ws.current && ws.current.readyState !== WebSocket.OPEN) {
          console.log('WebSocket connection timeout, closing and retrying')
          ws.current.close()
          setIsConnecting(false)
          
          // Only attempt reconnect if we haven't hit the max attempts
          if (reconnectAttempts.current < maxReconnectAttempts) {
            const delay = calculateBackoffDelay(reconnectAttempts.current)
            console.log(
              `Connection timed out. Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`,
            )
            
            reconnectTimeoutRef.current = setTimeout(() => {
              // Only proceed if this is still the current connection attempt
              if (connectionIdRef.current !== connectionId) return
              
              reconnectAttempts.current++
              isReconnecting.current = false
              connectWebSocket()
            }, delay)
          } else {
            isReconnecting.current = false
            onError(
              'Failed to connect to chat after multiple attempts. Please try again later.',
            )
          }
        }
      }, 10000) // 10 second connection timeout

      ws.current.onopen = () => {
        // Only proceed if this is still the current connection attempt
        if (connectionIdRef.current !== connectionId) {
          if (ws.current) {
            ws.current.close(1000, 'Superseded by newer connection')
            ws.current = null
          }
          return
        }
        
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current)
          connectionTimeoutRef.current = null
        }
        
        hasActiveConnection.current = true
        console.log(`WebSocket connected for conversation ${conversationId}`)
        // Reset reconnect attempts on successful connection
        reconnectAttempts.current = 0
        isReconnecting.current = false
        setIsConnecting(false)
        onError('')

        // Set up ping interval after successful connection
        setupPingInterval()
        
        // Set up pong interval to proactively keep connection alive
        setupPongInterval()

        // Send an initial ping message to verify the connection right away
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          try {
            ws.current.send(JSON.stringify({ type: 'ping' }))
            lastPingSentRef.current = Date.now()
            pongReceivedRef.current = false
            
            // Set timeout to verify initial pong response
            if (pongTimeoutRef.current) {
              clearTimeout(pongTimeoutRef.current)
            }
            
            pongTimeoutRef.current = setTimeout(() => {
              // Only proceed if this is still the current connection attempt
              if (connectionIdRef.current !== connectionId) return
              
              checkPongReceived()
            }, 5000) // Wait 5 seconds for initial pong
          } catch (e) {
            console.error('Error sending initial ping:', e)
          }
        }
      }

      ws.current.onclose = event => {
        // Only proceed if this is still the current connection attempt
        if (connectionIdRef.current !== connectionId) return
        
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current)
          connectionTimeoutRef.current = null
        }
        
        if (pongTimeoutRef.current) {
          clearTimeout(pongTimeoutRef.current)
          pongTimeoutRef.current = null
        }
        
        hasActiveConnection.current = false
        setIsConnecting(false)
        console.log(
          `WebSocket disconnected for conversation ${conversationId}`,
          event.code,
          event.reason,
        )

        // Don't attempt to reconnect if we closed intentionally, are unmounting, 
        // already reconnecting, or reached max attempts
        if (
          isUnmounting.current ||
          event.code === 1000 ||
          isReconnecting.current ||
          reconnectAttempts.current >= maxReconnectAttempts
        ) {
          console.log(
            'Not attempting to reconnect: clean close, unmounting, or max attempts reached',
          )
          if (reconnectAttempts.current >= maxReconnectAttempts) {
            onError(
              'Failed to connect to chat after multiple attempts. Please try again later.',
            )
          }
          return
        }

        // Implement exponential backoff for reconnection
        const delay = calculateBackoffDelay(reconnectAttempts.current)
        console.log(
          `Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`,
        )

        isReconnecting.current = true
        reconnectTimeoutRef.current = setTimeout(() => {
          // Only proceed if this is still the current connection attempt
          if (connectionIdRef.current !== connectionId) return
          
          if (
            !isUnmounting.current &&
            reconnectAttempts.current < maxReconnectAttempts
          ) {
            reconnectAttempts.current++
            isReconnecting.current = false
            connectWebSocket()
          } else {
            isReconnecting.current = false
            onError(
              'Failed to connect to chat after multiple attempts. Please try again later.',
            )
          }
        }, delay)
      }

      ws.current.onerror = event => {
        // Only proceed if this is still the current connection attempt
        if (connectionIdRef.current !== connectionId) return
        
        console.error('WebSocket error:', event)
        // Don't set error here as onclose will be called after error
      }

      ws.current.onmessage = event => {
        // Only proceed if this is still the current connection attempt
        if (connectionIdRef.current !== connectionId) return
        
        try {
          // Handle ping/pong messages for keeping the connection alive
          if (event.data === 'ping' || event.data === '{"type":"ping"}') {
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
              // Respond immediately with pong when we receive a ping
              ws.current.send(JSON.stringify({ type: 'pong' }))
            }
            return
          }

          // Handle pong responses - mark that we received one
          if (event.data === 'pong' || event.data === '{"type":"pong"}') {
            // Record successful pong response
            pongReceivedRef.current = true
            
            // Reduced logging to avoid console spam
            /*
            if (lastPingSentRef.current) {
              const latency = Date.now() - lastPingSentRef.current
              console.log(`Received pong response, latency: ${latency}ms`)
            }
            */
            return
          }

          try {
            const messageData = JSON.parse(event.data)
            
            // Handle different formats of pong responses
            if (messageData.type === 'pong') {
              // Record successful pong response
              pongReceivedRef.current = true
              
              // Reduced logging to avoid console spam
              /*
              if (lastPingSentRef.current) {
                const latency = Date.now() - lastPingSentRef.current
                console.log(`Received pong response (JSON), latency: ${latency}ms`)
              }
              */
              return
            }
            
            // Skip ping messages with different formats
            if (messageData.type === 'ping') {
              if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                // Respond immediately with pong
                ws.current.send(JSON.stringify({ type: 'pong' }))
              }
              return
            }
            
            // Process actual chat messages
            const newChatMessage: ChatMessage = {
              text: messageData.content,
              id: messageData.id,
              conversationId: messageData.conversation_id,
              senderId: messageData.sender_id,
              timestamp: safeParseDate(messageData.created_at),
            }

            // Notify the component about the new message
            onMessage(newChatMessage)
          } catch (parseError) {
            console.error('Failed to parse WebSocket message JSON:', parseError, event.data)
          }
        } catch (e) {
          console.error('Error handling WebSocket message:', e)
        }
      }
    } catch (error) {
      console.error('Error creating WebSocket connection:', error)
      setIsConnecting(false)
      isReconnecting.current = false
      onError('Failed to establish chat connection. Please try again.')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, userId, onMessage, onError, setupPingInterval, setupPongInterval, cleanupTimers, checkPongReceived, calculateBackoffDelay])

  // Set up the WebSocket connection
  useEffect(() => {
    // Close any existing connection before starting a new one
    if (ws.current) {
      ws.current.close(1000, 'Conversation or User ID changed')
      ws.current = null
      hasActiveConnection.current = false
    }
    
    // Clean up timers
    cleanupTimers()
    
    // Mark unmounting flag as false when the component mounts/updates
    isUnmounting.current = false
    isReconnecting.current = false
    
    // Reset reconnection attempts when conversation changes
    reconnectAttempts.current = 0
    
    // Only attempt connection if we have the required IDs
    if (conversationId && userId) {
      // Slight delay to avoid rapid reconnection when component re-renders
      const timeoutId = setTimeout(() => {
        connectWebSocket()
      }, 100)
      
      return () => {
        clearTimeout(timeoutId)
      }
    }

    // No cleanup needed when not connecting
    return undefined
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, userId, cleanupTimers])

  // Handle cleanup on unmount
  useEffect(() => {
    return () => {
      // Mark as unmounting to prevent reconnection attempts during cleanup
      isUnmounting.current = true
      hasActiveConnection.current = false
      cleanupTimers()

      if (ws.current) {
        // Use code 1000 to indicate normal closure
        ws.current.close(1000, 'Component unmounting')
        ws.current = null
      }
    }
  }, [cleanupTimers])

  return {
    sendMessage: (message: string) => {
      if (!conversationId || !userId) {
        console.error('Cannot send message: missing conversationId or userId')
        return false
      }
      
      // Use HTTP-based sendMessage function instead of WebSocket
      sendMessageHttp(conversationId, userId, message)
        .then(() => {
          return true
        })
        .catch((error) => {
          console.error('Error sending message via HTTP:', error)
          onError('Failed to send message. Please try again.')
          return false
        })
      
      return true // Return true immediately since we're handling this asynchronously
    },
  }
}