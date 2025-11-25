'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import AIChatSidebar from '@/components/AIChatSidebar'
import AIChatMain from '@/components/AIChatMain'
import ModelSelector from '@/components/ModelSelector'
import LiquidGlass from '@/components/LiquidGlass'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  model?: string
}

export interface Project {
  id: string
  name: string
  chats: Chat[]
  color: string
}

export default function AIChatPage() {
  const router = useRouter()
  const [chats, setChats] = useState<Chat[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [currentChat, setCurrentChat] = useState<Chat | null>(null)
  const [selectedModel, setSelectedModel] = useState('llama-3.1-70b-versatile')
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Load chats from localStorage on mount
  useEffect(() => {
    const savedChats = localStorage.getItem('ai-chats')
    const savedProjects = localStorage.getItem('ai-projects')
    const savedCurrentChat = localStorage.getItem('current-chat-id')

    if (savedChats) {
      const parsed = JSON.parse(savedChats).map((chat: any) => ({
        ...chat,
        messages: chat.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
        createdAt: new Date(chat.createdAt),
        updatedAt: new Date(chat.updatedAt),
      }))
      setChats(parsed)
      
      if (savedCurrentChat) {
        const chat = parsed.find((c: Chat) => c.id === savedCurrentChat)
        if (chat) setCurrentChat(chat)
      }
    }

    if (savedProjects) {
      setProjects(JSON.parse(savedProjects))
    }
  }, [])

  // Save chats to localStorage whenever they change
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem('ai-chats', JSON.stringify(chats))
    }
  }, [chats])

  // Save projects to localStorage whenever they change
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('ai-projects', JSON.stringify(projects))
    }
  }, [projects])

  // Save current chat ID
  useEffect(() => {
    if (currentChat) {
      localStorage.setItem('current-chat-id', currentChat.id)
    }
  }, [currentChat])

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      model: selectedModel,
    }
    setChats((prev) => [newChat, ...prev])
    setCurrentChat(newChat)
    setIsModelSelectorOpen(false)
  }

  const selectChat = (chat: Chat) => {
    setCurrentChat(chat)
    if (chat.model) setSelectedModel(chat.model)
    setIsModelSelectorOpen(false)
  }

  const updateChat = (updatedChat: Chat) => {
    setChats((prev) =>
      prev.map((chat) => (chat.id === updatedChat.id ? updatedChat : chat))
    )
    if (currentChat?.id === updatedChat.id) {
      setCurrentChat(updatedChat)
    }
  }

  const deleteChat = (chatId: string) => {
    setChats((prev) => prev.filter((chat) => chat.id !== chatId))
    if (currentChat?.id === chatId) {
      setCurrentChat(null)
    }
  }

  const createProject = (name: string, color: string) => {
    const newProject: Project = {
      id: Date.now().toString(),
      name,
      chats: [],
      color,
    }
    setProjects((prev) => [...prev, newProject])
    return newProject
  }

  const addChatToProject = (chatId: string, projectId: string) => {
    const chat = chats.find((c) => c.id === chatId)
    if (!chat) return

    setProjects((prev) =>
      prev.map((project) => {
        if (project.id === projectId) {
          return {
            ...project,
            chats: [...project.chats.filter((c) => c.id !== chatId), chat],
          }
        }
        return project
      })
    )
  }

  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.messages.some((msg) =>
      msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  return (
    <main className="min-h-screen relative">
      <LiquidGlass />
      <ThemeSwitcher />
      <Navigation 
        activeSection="chat" 
        setActiveSection={(section) => {
          if (section !== 'chat') {
            router.push('/')
          }
        }} 
      />
      
      <div className="flex h-[calc(100vh-5rem)] mt-20">
        <AIChatSidebar
          chats={filteredChats}
          projects={projects}
          currentChat={currentChat}
          sidebarOpen={sidebarOpen}
          searchQuery={searchQuery}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onNewChat={createNewChat}
          onSelectChat={selectChat}
          onDeleteChat={deleteChat}
          onCreateProject={createProject}
          onAddChatToProject={addChatToProject}
          onSearchChange={setSearchQuery}
        />

        <AIChatMain
          chat={currentChat}
          selectedModel={selectedModel}
          isModelSelectorOpen={isModelSelectorOpen}
          onModelSelectorToggle={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
          onModelSelect={(model) => {
            setSelectedModel(model)
            if (currentChat) {
              updateChat({ ...currentChat, model })
            }
          }}
          onChatUpdate={updateChat}
          onCreateGroupChat={async (name) => {
            try {
              const res = await fetch('/api/chat/group', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
              })
              const data = await res.json()
              if (data.groupChat) {
                // Navigate to group chat
                router.push(`/ai-chat/group/${data.groupChat.id}`)
              }
            } catch (error) {
              console.error('Error creating group chat:', error)
            }
          }}
        />

        {isModelSelectorOpen && (
          <ModelSelector
            selectedModel={selectedModel}
            onSelect={(model) => {
              setSelectedModel(model)
              setIsModelSelectorOpen(false)
              if (currentChat) {
                updateChat({ ...currentChat, model })
              }
            }}
            onClose={() => setIsModelSelectorOpen(false)}
          />
        )}
      </div>
    </main>
  )
}

