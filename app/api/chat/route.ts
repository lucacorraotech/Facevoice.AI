import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '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',
})

// Groq model mapping
const GROQ_MODELS: Record<string, string> = {
  'llama-3.1-70b-versatile': 'llama-3.1-70b-versatile',
  'llama-3.1-8b-instant': 'llama-3.1-8b-instant',
  'mixtral-8x7b-32768': 'mixtral-8x7b-32768',
}

export async function POST(req: NextRequest) {
  try {
    const { messages, model = 'llama-3.1-70b-versatile' } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    // Use Groq-compatible model name
    const groqModel = GROQ_MODELS[model] || 'llama-3.1-70b-versatile'

    const completion = await groq.chat.completions.create({
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      model: groqModel,
      temperature: 0.7,
      max_tokens: 4096,
    })

    const response = completion.choices[0]?.message?.content || ''

    return NextResponse.json({ 
      message: response,
      model: completion.model,
      usage: completion.usage,
    })
  } catch (error: any) {
    console.error('Groq API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get AI response' },
      { status: 500 }
    )
  }
}

