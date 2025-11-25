'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Plus,
  Mic,
  User,
  Bot,
  Users,
  Link as LinkIcon,
  Copy,
  Check,
} from 'lucide-react'
import { Chat, Message } from '@/app/ai-chat/page'

interface AIChatMainProps {
  chat: Chat | null
  selectedModel: string
  isModelSelectorOpen: boolean
  onModelSelectorToggle: () => void
  onModelSelect: (model: string) => void
  onChatUpdate: (chat: Chat) => void
  onCreateGroupChat: (name: string) => Promise<void>
}

export default function AIChatMain({
  chat,
  selectedModel,
  isModelSelectorOpen,
  onModelSelectorToggle,
  onModelSelect,
  onChatUpdate,
  onCreateGroupChat,
}: AIChatMainProps) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showGroupChatDialog, setShowGroupChatDialog] = useState(false)
  const [groupChatName, setGroupChatName] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [chat?.messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading || !chat) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    const updatedMessages = [...chat.messages, userMessage]
    const updatedChat: Chat = {
      ...chat,
      messages: updatedMessages,
      title: chat.title === 'New Chat' ? input.trim().slice(0, 50) : chat.title,
      updatedAt: new Date(),
    }

    onChatUpdate(updatedChat)
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          model: selectedModel,
        }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      }

      const finalChat: Chat = {
        ...updatedChat,
        messages: [...updatedMessages, assistantMessage],
        updatedAt: new Date(),
      }

      onChatUpdate(finalChat)
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }
      const finalChat: Chat = {
        ...updatedChat,
        messages: [...updatedMessages, errorMessage],
        updatedAt: new Date(),
      }
      onChatUpdate(finalChat)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCreateGroupChat = async () => {
    if (groupChatName.trim()) {
      await onCreateGroupChat(groupChatName.trim())
      setShowGroupChatDialog(false)
      setGroupChatName('')
    }
  }

  const copyGroupLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Bot className="w-16 h-16 text-coral-red/30 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-coral-red-light mb-2">
            How can I help you today?
          </h2>
          <p className="text-coral-red/70 mb-6">
            Start a new conversation or select an existing chat from the sidebar.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onModelSelectorToggle}
              className="px-4 py-2 glass-strong rounded-lg text-coral-red hover:border-coral-red border-2 border-transparent transition-all"
            >
              Select Model
            </button>
            <button
              onClick={() => setShowGroupChatDialog(true)}
              className="px-4 py-2 glass-strong rounded-lg text-coral-red hover:border-coral-red border-2 border-transparent transition-all flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Create Group Chat
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col relative">
      {/* Header */}
      <div className="p-4 border-b border-coral-red/20 flex items-center justify-between glass-strong">
        <div className="flex items-center gap-3">
          <button
            onClick={onModelSelectorToggle}
            className="px-3 py-1.5 glass rounded-lg hover:glass-strong transition-all text-sm text-coral-red flex items-center gap-2"
          >
                    <span className="font-medium">ChatGPT</span>
                    <span className="text-xs text-coral-red/70">
                      {selectedModel === 'llama-3.1-70b-versatile' ? 'Groq (Llama 3.1 70B)' : selectedModel}
                    </span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGroupChatDialog(true)}
            className="p-2 glass rounded-lg hover:glass-strong transition-all"
            title="Create Group Chat"
          >
            <Users className="w-5 h-5 text-coral-red" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <AnimatePresence>
          {chat.messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full glass flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-coral-red" />
                </div>
              )}
              <div
                className={`max-w-[75%] glass-strong p-4 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-coral-red/20 border-coral-red/30'
                    : ''
                }`}
              >
                <p className="text-coral-red/90 leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
                <p className="text-xs text-coral-red/50 mt-2">
                  {message.timestamp.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full glass flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-coral-red" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4"
          >
            <div className="w-8 h-8 rounded-full glass flex items-center justify-center">
              <Bot className="w-5 h-5 text-coral-red" />
            </div>
            <div className="glass-strong p-4 rounded-2xl">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-coral-red rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-coral-red rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
                <div
                  className="w-2 h-2 bg-coral-red rounded-full animate-bounce"
                  style={{ animationDelay: '0.4s' }}
                />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-coral-red/20 glass-strong">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Send a message or @ChatGPT"
                className="w-full px-4 py-3 glass rounded-lg text-coral-red placeholder-coral-red/50 focus:outline-none focus:border-coral-red border-2 border-transparent transition-all resize-none max-h-32 overflow-y-auto"
                rows={1}
              />
              <button className="absolute left-3 top-1/2 transform -translate-y-1/2 p-1 hover:glass-strong rounded transition-all">
                <Plus className="w-4 h-4 text-coral-red/50" />
              </button>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-3 glass-strong rounded-lg text-coral-red-light hover:border-coral-red border-2 border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
          <p className="text-xs text-coral-red/50 mt-2 text-center">
            ChatGPT can make mistakes. Check important info.
          </p>
        </div>
      </div>

      {/* Group Chat Dialog */}
      <AnimatePresence>
        {showGroupChatDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 glass-strong backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowGroupChatDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong p-6 rounded-2xl max-w-md w-full mx-4 border-2 border-coral-red/30"
            >
              <h3 className="text-xl font-bold text-coral-red-light mb-4">
                Create Group Chat
              </h3>
              <input
                type="text"
                value={groupChatName}
                onChange={(e) => setGroupChatName(e.target.value)}
                placeholder="Group chat name"
                className="w-full mb-4 px-4 py-2 glass rounded-lg text-coral-red placeholder-coral-red/50 focus:outline-none focus:border-coral-red border-2 border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateGroupChat()}
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={handleCreateGroupChat}
                  className="flex-1 px-4 py-2 glass-strong rounded-lg text-coral-red hover:border-coral-red border-2 border-transparent transition-all"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowGroupChatDialog(false)
                    setGroupChatName('')
                  }}
                  className="px-4 py-2 glass rounded-lg text-coral-red"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

