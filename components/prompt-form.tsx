'use client'

import * as React from 'react'
import Textarea from 'react-textarea-autosize'

import { useActions, useUIState } from 'ai/rsc'
import axios from 'axios'
import { UserMessage } from './stocks/message'
import { type AI } from '@/lib/chat/actions'
import { Button } from '@/components/ui/button'
import {
  IconMicrophone,
  IconDisableMicrophone,
  IconArrowElbow,
  IconPlus
} from '@/components/ui/icons'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'
import { nanoid } from 'nanoid'
import { useRouter } from 'next/navigation'

export function PromptForm({
  input,
  setInput
}: {
  input: string
  setInput: (value: string) => void
}) {
  const router = useRouter()
  const { formRef, onKeyDown } = useEnterSubmit()
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const { submitUserMessage } = useActions()
  const [_, setMessages] = useUIState<typeof AI>()
  const chunks = React.useRef<Blob[]>([])
  const [mediaRecorder, setMediaRecorder] = React.useState<MediaRecorder>()
  const [isRecording, setIsRecording] = React.useState(false)

  const startRecording = () => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(initialMediaRecorder)
  }

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop()
      setIsRecording(false)
      setMediaRecorder(undefined)
    }
  }

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  React.useEffect(() => {
    if (mediaRecorder) {
      mediaRecorder.start()
      setIsRecording(true)
    }
  }, [mediaRecorder])

  // Function to initialize the media recorder with the provided stream
  const initialMediaRecorder = stream => {
    const mediaRecorder = new MediaRecorder(stream)
    console.log(mediaRecorder)
    // Event handler when recording starts
    mediaRecorder.onstart = () => {
      console.log('onstart')
      chunks.current = [] // Resetting chunks array
    }
    // Event handler when data becomes available during recording
    mediaRecorder.ondataavailable = ev => {
      console.log(ev.data)
      chunks.current.push(ev.data) // Storing data chunks
    }
    // Event handler when recording stops
    mediaRecorder.onstop = async () => {
      const mimeType = mediaRecorder.mimeType
      const audioBlob = new Blob(chunks.current, { type: mimeType })
      const tracks = stream.getTracks()
      tracks.forEach(track => {
        track.stop()
      })
      var formData = new FormData()
      formData.append('model', 'whisper-1')
      formData.append('file', new File([audioBlob], 'audio.mp3'))
      const res = await axios.post(
        'https://api.openai-next.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      )
      setMessages(currentMessages => [
        ...currentMessages,
        {
          id: nanoid(),
          display: <UserMessage>{res.data.text}</UserMessage>
        }
      ])
      const responseMessage = await submitUserMessage(res.data.text)
      setMessages(currentMessages => [...currentMessages, responseMessage])
    }
    setMediaRecorder(mediaRecorder)
  }

  const sendVoice = () => {
    console.log(isRecording)
    if (!isRecording) {
      startRecording()
    } else {
      stopRecording()
    }
    //   const SpeechRecognition =
    // window.SpeechRecognition || window.webkitSpeechRecognition;
    // const recognition = new SpeechRecognition();
    // recognition.start();
    // recognition.onresult = (event) => {
    //   console.log(event.results)
    //   const color = event.results[0][0].transcript;
    //   `Result received: ${color}.`;
    //   console.log(`Result received: ${color}.`);
    //   console.log(`Confidence: ${event.results[0][0].confidence}`);
    // };
  }

  return (
    <form
      ref={formRef}
      onSubmit={async (e: any) => {
        e.preventDefault()

        // Blur focus on mobile
        if (window.innerWidth < 600) {
          e.target['message']?.blur()
        }

        const value = input.trim()
        setInput('')
        if (!value) return

        // Optimistically add user message UI
        setMessages(currentMessages => [
          ...currentMessages,
          {
            id: nanoid(),
            display: <UserMessage>{value}</UserMessage>
          }
        ])

        // Submit and get response message
        const responseMessage = await submitUserMessage(value)
        setMessages(currentMessages => [...currentMessages, responseMessage])
      }}
    >
      <div className="relative flex max-h-60 w-full grow flex-col overflow-hidden bg-background px-8 sm:rounded-md sm:border sm:px-12">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-0 top-[14px] size-8 rounded-full bg-background p-0 sm:left-4"
              onClick={() => {
                router.push('/new')
              }}
            >
              <IconPlus />
              <span className="sr-only">New Chat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Chat</TooltipContent>
        </Tooltip>
        <Textarea
          ref={inputRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          placeholder="Send a message."
          className="min-h-[60px] w-full resize-none bg-transparent pl-4 pr-14 py-[1.3rem] focus-within:outline-none sm:text-sm"
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          name="message"
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <div className="absolute right-10 top-[13px] sm:right-14">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" size="icon" onClick={sendVoice}>
                {isRecording ? <IconDisableMicrophone /> : <IconMicrophone />}
                <span className="sr-only">Send voice</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Send voice</TooltipContent>
          </Tooltip>
        </div>
        <div className="absolute right-0 top-[13px] sm:right-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="submit" size="icon" disabled={input === ''}>
                <IconArrowElbow />
                <span className="sr-only">Send message</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Send message</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </form>
  )
}
