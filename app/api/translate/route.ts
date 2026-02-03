import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"

// Common translations dictionary for better quality
const commonTranslations: Record<string, Record<string, string>> = {
  "en-ru": {
    "hello": "Привет",
    "hi": "Привет",
    "hey": "Привет",
    "good morning": "Доброе утро",
    "good evening": "Добрый вечер",
    "good night": "Спокойной ночи",
    "how are you": "Как дела",
    "thank you": "Спасибо",
    "thanks": "Спасибо",
    "yes": "Да",
    "no": "Нет",
    "bye": "Пока",
    "goodbye": "До свидания",
  },
  "ru-en": {
    "привет": "Hello",
    "здравствуйте": "Hello",
    "доброе утро": "Good morning",
    "добрый вечер": "Good evening",
    "спокойной ночи": "Good night",
    "как дела": "How are you",
    "спасибо": "Thank you",
    "да": "Yes",
    "нет": "No",
    "пока": "Bye",
    "до свидания": "Goodbye",
  },
}

// Detect if text is mostly Cyrillic (Russian/Ukrainian) or Latin
function detectLanguage(text: string): string {
  const cyrillicPattern = /[\u0400-\u04FF]/g
  const latinPattern = /[a-zA-Z]/g

  const cyrillicCount = (text.match(cyrillicPattern) || []).length
  const latinCount = (text.match(latinPattern) || []).length

  if (cyrillicCount > latinCount) return "ru"
  return "en"
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { text, targetLang } = await request.json()

  if (!text || !targetLang) {
    return NextResponse.json(
      { error: "Text and targetLang are required" },
      { status: 400 }
    )
  }

  try {
    // Detect source language
    const sourceLang = detectLanguage(text)

    // Don't translate if source and target are the same
    if (sourceLang === targetLang) {
      return NextResponse.json({ translation: text })
    }

    // Check dictionary first for common phrases
    const dictKey = `${sourceLang}-${targetLang}`
    const lowerText = text.toLowerCase().trim()
    if (commonTranslations[dictKey]?.[lowerText]) {
      return NextResponse.json({ translation: commonTranslations[dictKey][lowerText] })
    }

    // Use MyMemory API for other text
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.responseData?.translatedText) {
      return NextResponse.json({ translation: data.responseData.translatedText })
    }

    return NextResponse.json({ translation: text })
  } catch (error) {
    console.error("Translation error:", error)
    return NextResponse.json({ translation: text })
  }
}
