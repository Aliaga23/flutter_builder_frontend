"use client"
import { useState } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { FileText, AlertCircle, ImageIcon, Wand2, Loader2, Sparkles, Mic } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AIImportModalProps {
  onImport: (jsonData: any) => void
}

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export function AIImportModal({ onImport }: AIImportModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("prompt")
  const [prompt, setPrompt] = useState("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isListening, setIsListening] = useState(false)
  const { toast } = useToast()

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePromptGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a description")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Call the real API endpoint for prompt analysis
      const response = await fetch("https://flutterbuilderbackend-production.up.railway.app/openai/analyze-ui-prompt", {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Get the JSON response
      const analysisResult = await response.json()

      console.log("✅ Prompt analysis result:", analysisResult)

      // Import the received JSON directly to the canvas
      onImport(analysisResult)
      setIsOpen(false)
      setPrompt("")
    } catch (err) {
      console.error("❌ Prompt analysis error:", err)
      setError(err instanceof Error ? err.message : "Failed to generate UI from prompt. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageGenerate = async () => {
    if (!selectedImage) {
      setError("Please select an image")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Create FormData to send the image
      const formData = new FormData()
      formData.append("image", selectedImage)

      // Call the real API endpoint
      const response = await fetch("https://flutterbuilderbackend-production.up.railway.app/openai/analyze-ui-image", {
        method: "POST",
        headers: {
          accept: "application/json",
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Get the JSON response
      const analysisResult = await response.json()

      console.log("✅ Image analysis result:", analysisResult)

      // Import the received JSON directly to the canvas
      onImport(analysisResult)
      setIsOpen(false)
      setSelectedImage(null)
      setImagePreview(null)
    } catch (err) {
      console.error("❌ Image analysis error:", err)
      setError(err instanceof Error ? err.message : "Failed to analyze image. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setPrompt("")
    setSelectedImage(null)
    setImagePreview(null)
    setError("")
    setIsLoading(false)
  }

  const handleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser. Try Chrome or Edge.",
        variant: "destructive",
      })
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.lang = "es-ES" // Spanish language
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setPrompt((prev) => prev + " " + transcript)
    }

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2 hover:bg-gray-50">
          <Sparkles className="h-4 w-4" />
          AI Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Import UI with AI
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="prompt" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              From Prompt
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              From Image
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prompt" className="space-y-4">
            <div>
              <Label htmlFor="prompt" className="flex justify-between items-center">
                <span>Describe the UI you want to create</span>
                <Button
                  type="button"
                  size="sm"
                  variant={isListening ? "default" : "outline"}
                  onClick={handleVoiceInput}
                  className={`${isListening ? "bg-red-500 hover:bg-red-600" : ""} flex items-center gap-1`}
                >
                  <Mic className={`h-4 w-4 ${isListening ? "animate-pulse" : ""}`} />
                  {isListening ? "Listening..." : "Voice Input"}
                </Button>
              </Label>
              <Textarea
                id="prompt"
                placeholder="Example: Create a login screen with email and password fields, or a dashboard with user stats and charts"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px] mt-2"
                disabled={isLoading || isListening}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handlePromptGenerate} disabled={isLoading || !prompt.trim()}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating UI...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate UI
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="image" className="space-y-4">
            <div>
              <Label htmlFor="image">Upload an image of the UI you want to recreate</Label>
              <div className="mt-2">
                <Input id="image" type="file" accept="image/*" onChange={handleImageSelect} disabled={isLoading} />
              </div>
            </div>

            {imagePreview && (
              <div className="border rounded-lg p-4">
                <Label className="text-sm font-medium">Preview:</Label>
                <div className="mt-2 max-h-[200px] overflow-hidden rounded border">
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    alt="Preview"
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleImageGenerate} disabled={isLoading || !selectedImage}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing Image...
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Analyze & Import
                  </>
                )}
              </Button>
            </div>

            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded border">
              <strong>Note:</strong> The AI will analyze your image and automatically recreate the UI layout and
              components on the canvas. Supported formats: JPG, PNG, GIF. Max size: 10MB.
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
