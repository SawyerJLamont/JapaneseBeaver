"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Check, X } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { WritingSystem } from "@/lib/data"

type ConjugationType = "Present Affirmative" | "Present Negative" | "Past Affirmative" | "Past Negative" | "Te Form"
type AnswerMode = "type" | "reveal"

interface ConjugationItem {
  Word: {
    kanji: string
    hiragana: string
    romaji: string
  }
  "Present Affirmative": {
    kanji: string
    hiragana: string
    romaji: string
  }
  "Present Negative": {
    kanji: string
    hiragana: string
    romaji: string
  }
  "Past Affirmative": {
    kanji: string
    hiragana: string
    romaji: string
  }
  "Past Negative": {
    kanji: string
    hiragana: string
    romaji: string
  }
  "Te Form": {
    kanji: string
    hiragana: string
    romaji: string
  } | null
}

interface FlashCardAppProps {
  conjugationData: ConjugationItem[]
}

export default function FlashCardApp({ conjugationData }: FlashCardAppProps) {
  const [currentWord, setCurrentWord] = useState<ConjugationItem | null>(null)
  const [currentConjugationType, setCurrentConjugationType] = useState<ConjugationType | null>(null)
  const [userAnswer, setUserAnswer] = useState("")
  const [showAnswer, setShowAnswer] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [practiceMode, setPracticeMode] = useState<"all" | "specific">("all")
  const [selectedConjugationTypes, setSelectedConjugationTypes] = useState<ConjugationType[]>(["Present Affirmative"])
  const [open, setOpen] = useState(false)
  const [answerMode, setAnswerMode] = useState<AnswerMode>("type")
  const [writingSystem, setWritingSystem] = useState<WritingSystem>("kanji")

  const conjugationTypes: ConjugationType[] = [
    "Present Affirmative",
    "Present Negative",
    "Past Affirmative",
    "Past Negative",
    "Te Form",
  ]

  useEffect(() => {
    const savedWritingSystem = localStorage.getItem("writingSystem") as WritingSystem
    if (savedWritingSystem) {
      setWritingSystem(savedWritingSystem)
    }
  }, [])

  const getFilteredConjugationData = useCallback(() => {
    const selectedWords = new Set(JSON.parse(localStorage.getItem("selectedWords") || "[]"))
    if (selectedWords.size === 0) return conjugationData
    return conjugationData.filter((item) => selectedWords.has(item.Word.kanji))
  }, [conjugationData])

  const getRandomWord = useCallback(() => {
    const filteredData = getFilteredConjugationData()
    const validWords = filteredData.filter((item) => {
      if (practiceMode === "all") return true
      return selectedConjugationTypes.some((type) => item[type] !== null && item[type][writingSystem] !== "")
    })

    if (validWords.length === 0) return null
    return validWords[Math.floor(Math.random() * validWords.length)]
  }, [practiceMode, selectedConjugationTypes, getFilteredConjugationData, writingSystem])

  const getRandomConjugationType = useCallback(
    (word: ConjugationItem): ConjugationType | null => {
      if (practiceMode === "specific") {
        const availableTypes = selectedConjugationTypes.filter(
          (type) => word[type] !== null && word[type][writingSystem] !== "",
        )
        if (availableTypes.length === 0) return null
        return availableTypes[Math.floor(Math.random() * availableTypes.length)]
      }

      const availableTypes = conjugationTypes.filter((type) => word[type] !== null && word[type][writingSystem] !== "")

      if (availableTypes.length === 0) return null
      return availableTypes[Math.floor(Math.random() * availableTypes.length)]
    },
    [practiceMode, selectedConjugationTypes, writingSystem],
  )

  const nextCard = useCallback(() => {
    const word = getRandomWord()
    if (!word) return

    const conjugationType = getRandomConjugationType(word)
    if (!conjugationType) return

    setCurrentWord(word)
    setCurrentConjugationType(conjugationType)
    setUserAnswer("")
    setShowAnswer(false)
    setIsCorrect(null)
  }, [getRandomConjugationType, getRandomWord])

  const checkAnswer = () => {
    if (!currentWord || !currentConjugationType) return

    const correctAnswer = currentWord[currentConjugationType][writingSystem]
    const isAnswerCorrect = userAnswer.trim() === correctAnswer.trim()

    setIsCorrect(isAnswerCorrect)
    setShowAnswer(true)
  }

  // Call nextCard when practice mode or conjugation types change
  useEffect(() => {
    if (conjugationData.length > 0) {
      nextCard()
    }
  }, [conjugationData, nextCard])

  if (conjugationData.length === 0) {
    return <div className="text-center">Loading data...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex items-center space-x-2">
          <Button variant={practiceMode === "all" ? "default" : "outline"} onClick={() => setPracticeMode("all")}>
            Random Practice
          </Button>
          <Button
            variant={practiceMode === "specific" ? "default" : "outline"}
            onClick={() => setPracticeMode("specific")}
          >
            Specific Practice
          </Button>
        </div>

        {practiceMode === "specific" && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" aria-expanded={open} className="w-[250px] justify-between">
                {selectedConjugationTypes.length > 0
                  ? `${selectedConjugationTypes.length} selected`
                  : "Select conjugations..."}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0">
              <Command>
                <CommandInput placeholder="Search conjugations..." />
                <CommandList>
                  <CommandEmpty>No conjugation type found.</CommandEmpty>
                  <CommandGroup>
                    {conjugationTypes.map((type) => (
                      <CommandItem
                        key={type}
                        onSelect={() => {
                          setSelectedConjugationTypes((prev) => {
                            const newTypes = prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
                            return newTypes.length > 0 ? newTypes : [type] // Ensure at least one is selected
                          })
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            selectedConjugationTypes.includes(type) ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        {type}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {practiceMode === "specific" && (
        <div className="flex flex-wrap gap-2">
          {selectedConjugationTypes.map((type) => (
            <Badge key={type} variant="secondary" className="flex items-center gap-1">
              {type}
              <button
                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onClick={() =>
                  setSelectedConjugationTypes((prev) => {
                    const newTypes = prev.filter((t) => t !== type)
                    return newTypes.length > 0 ? newTypes : [prev[0]] // Ensure at least one is selected
                  })
                }
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {type}</span>
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex justify-center">
        <Tabs defaultValue="type" value={answerMode} onValueChange={(value) => setAnswerMode(value as AnswerMode)}>
          <TabsList>
            <TabsTrigger value="type">Type Answer</TabsTrigger>
            <TabsTrigger value="reveal">Reveal Answer</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            {currentWord?.Word[writingSystem] || ""}
            {writingSystem !== "kanji" && currentWord?.Word.kanji && (
              <div className="text-sm text-muted-foreground mt-1">({currentWord.Word.kanji})</div>
            )}
          </CardTitle>
          <p className="text-center text-muted-foreground">
            Conjugate to: <span className="font-medium">{currentConjugationType}</span>
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {answerMode === "type" ? (
              <div>
                <Label htmlFor="answer">Your Answer</Label>
                <Input
                  id="answer"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer here"
                  disabled={showAnswer}
                  className="text-lg"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !showAnswer) {
                      checkAnswer()
                    }
                  }}
                />
              </div>
            ) : null}

            {((answerMode === "type" && showAnswer) || (answerMode === "reveal" && showAnswer)) && (
              <div
                className={`p-4 rounded-md ${
                  answerMode === "reveal" || isCorrect
                    ? "bg-green-100 dark:bg-green-900/20"
                    : "bg-red-100 dark:bg-red-900/20"
                }`}
              >
                <p className="font-medium">
                  {answerMode === "reveal" ? "Answer:" : isCorrect ? "Correct!" : "Not quite right."}
                </p>
                <p>
                  {answerMode === "type" ? "The correct answer is: " : ""}
                  <span className="font-bold">
                    {currentWord?.[currentConjugationType || ""]?.[writingSystem] || ""}
                  </span>
                  {writingSystem !== "kanji" &&
                    currentConjugationType &&
                    currentWord?.[currentConjugationType]?.kanji && (
                      <span className="text-muted-foreground ml-2">({currentWord[currentConjugationType].kanji})</span>
                    )}
                </p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {answerMode === "type" ? (
            !showAnswer ? (
              <Button onClick={checkAnswer} className="w-full">
                Check Answer
              </Button>
            ) : (
              <Button onClick={nextCard} className="w-full">
                Next Card
              </Button>
            )
          ) : !showAnswer ? (
            <Button onClick={() => setShowAnswer(true)} className="w-full">
              Reveal Answer
            </Button>
          ) : (
            <Button onClick={nextCard} className="w-full">
              Next Card
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

