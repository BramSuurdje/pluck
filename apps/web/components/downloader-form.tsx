"use client"

import { useCallback, useEffect, useReducer, useRef, useState } from "react"
import { RiDownloadLine } from "@remixicon/react"
import { toast } from "sonner"

import { pluckFetch, setStoredPassword } from "@/lib/api-client"
import { PRESETS, type PresetId } from "@/lib/presets"
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { Card, CardContent, CardFooter } from "@workspace/ui/components/card"
import { Label } from "@workspace/ui/components/label"
import { Input } from "@workspace/ui/components/input"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import {
  UploadButton,
  type UploadButtonPhase,
} from "@workspace/ui/components/upload-button"

type PublicJob = {
  id: string
  status: string
  progress: number
  statusText: string
  title?: string
  fileName?: string
  downloadUrl?: string
  error?: string
}

const SUCCESS_HOLD_MS = 720

type DownloadUiState = {
  phase: UploadButtonPhase
  progress: number
  label: string
}

type DownloadUiAction =
  | { type: "start" }
  | { type: "progress"; progress: number; label: string }
  | { type: "success" }
  | { type: "reset" }

const initialDownloadUi: DownloadUiState = {
  phase: "idle",
  progress: 0,
  label: "",
}

function downloadUiReducer(
  state: DownloadUiState,
  action: DownloadUiAction
): DownloadUiState {
  switch (action.type) {
    case "start":
      return { phase: "uploading", progress: 0, label: "Preparing…" }
    case "progress":
      return {
        ...state,
        progress: action.progress,
        label: action.label,
      }
    case "success":
      return { ...state, phase: "success", progress: 100, label: "Done" }
    case "reset":
      return initialDownloadUi
    default:
      return state
  }
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function jobProgressLabel(job: PublicJob): string {
  if (job.status === "uploading") {
    return "Saving your file…"
  }

  const text = job.statusText?.trim()
  if (!text) {
    return "Downloading…"
  }

  return text.replace(/\s+\d+(?:\.\d+)?%$/, "")
}

export function DownloaderForm({
  passwordRequired = false,
}: {
  passwordRequired?: boolean
}) {
  const [url, setUrl] = useState("")
  const [preset, setPreset] = useState<PresetId>("720p")
  const [serverPassword, setServerPassword] = useState("")
  const [completedJob, setCompletedJob] = useState<PublicJob | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [downloadUi, dispatchDownloadUi] = useReducer(
    downloadUiReducer,
    initialDownloadUi
  )
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const activeJobIdRef = useRef<string | null>(null)
  const lastProgressRef = useRef(0)

  const isBusy = downloadUi.phase !== "idle"
  const showResult = completedJob?.status === "completed"

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => stopPolling()
  }, [stopPolling])

  const pollJob = useCallback(
    (jobId: string) => {
      stopPolling()
      activeJobIdRef.current = jobId

      const poll = async () => {
        const response = await pluckFetch(`/api/jobs/${jobId}`)
        if (!response.ok) return

        const data = (await response.json()) as { job: PublicJob }
        const { job } = data

        if (job.status === "failed") {
          stopPolling()
          activeJobIdRef.current = null
          lastProgressRef.current = 0
          dispatchDownloadUi({ type: "reset" })
          setFormError(
            job.error ??
              "This link may be private, region-locked, or unsupported."
          )
          return
        }

        if (job.status === "completed") {
          stopPolling()
          activeJobIdRef.current = null
          lastProgressRef.current = 0
          dispatchDownloadUi({
            type: "progress",
            progress: 100,
            label: "Done",
          })
          dispatchDownloadUi({ type: "success" })
          await wait(SUCCESS_HOLD_MS)
          setCompletedJob(job)
          dispatchDownloadUi({ type: "reset" })
          return
        }

        const serverProgress = Math.min(100, Math.round(job.progress ?? 0))
        const progress = Math.max(lastProgressRef.current, serverProgress)
        lastProgressRef.current = progress

        dispatchDownloadUi({
          type: "progress",
          progress,
          label: jobProgressLabel(job),
        })
      }

      void poll()
      pollRef.current = setInterval(() => {
        void poll()
      }, 250)
    },
    [stopPolling]
  )

  const onDownload = async () => {
    const trimmed = url.trim()
    if (!trimmed) {
      toast.error("Paste a link first")
      return
    }

    setFormError(null)
    setCompletedJob(null)

    if (passwordRequired && serverPassword.trim()) {
      setStoredPassword(serverPassword.trim())
    }

    dispatchDownloadUi({ type: "start" })

    try {
      const response = await pluckFetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed, preset }),
      })

      const data = (await response.json()) as {
        job?: PublicJob
        error?: string
      }

      if (response.status === 401) {
        dispatchDownloadUi({ type: "reset" })
        setFormError(
          "Wrong server password. Ask whoever runs Pluck for the correct one."
        )
        return
      }

      if (!response.ok || !data.job) {
        dispatchDownloadUi({ type: "reset" })
        setFormError(data.error ?? "Could not start. Check the link and try again.")
        return
      }

      lastProgressRef.current = 0
      pollJob(data.job.id)
    } catch {
      dispatchDownloadUi({ type: "reset" })
      setFormError("Could not reach the server. Try again.")
    }
  }

  const resetForm = () => {
    stopPolling()
    activeJobIdRef.current = null
    setCompletedJob(null)
    setUrl("")
    setFormError(null)
    dispatchDownloadUi({ type: "reset" })
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-6">
      <p className="text-center text-sm text-muted-foreground">
        Paste a link, pick a format, and save the file to your device.
      </p>

      <Card>
        <CardContent className="flex flex-col gap-6 pt-6">
          <div className="flex flex-col gap-3 text-sm">
            <Label htmlFor="url">Link</Label>
            <Input
              id="url"
              name="url"
              type="url"
              inputMode="url"
              autoComplete="off"
              placeholder="https://…"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              disabled={isBusy}
              className="h-10"
            />
          </div>

          <div className="flex flex-col gap-3 text-sm">
            <Label>Format</Label>
            <ToggleGroup
              value={[preset]}
              onValueChange={(values) => {
                const next = values[0]
                if (
                  next === "1080p" ||
                  next === "720p" ||
                  next === "480p" ||
                  next === "audio"
                ) {
                  setPreset(next)
                }
              }}
              variant="outline"
              spacing={2}
              className="grid w-full grid-cols-2 gap-2"
              disabled={isBusy}
            >
              {PRESETS.map((item) => (
                <ToggleGroupItem
                  key={item.id}
                  value={item.id}
                  className="h-auto min-h-14 w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left"
                  aria-label={`${item.label}, ${item.hint}`}
                >
                  <span className="font-medium">{item.label}</span>
                  <span className="text-muted-foreground text-xs font-normal">
                    {item.hint}
                  </span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {passwordRequired ? (
            <div className="flex flex-col gap-3 text-sm">
              <Label htmlFor="server-password">Server password</Label>
              <Input
                id="server-password"
                name="server-password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter the password for this server"
                value={serverPassword}
                onChange={(event) => setServerPassword(event.target.value)}
                disabled={isBusy}
              />
            </div>
          ) : null}

          {formError ? (
            <Alert variant="destructive">
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>

        <CardFooter className="flex w-full min-w-0 flex-col gap-3">
          {showResult && completedJob?.downloadUrl ? (
            <>
              <p className="text-muted-foreground w-full min-w-0 text-center text-sm">
                <span className="line-clamp-2 block break-words [overflow-wrap:anywhere]">
                  {completedJob.title ?? completedJob.fileName ?? "Your file"}
                </span>
              </p>
              <a
                href={completedJob.downloadUrl}
                download={completedJob.fileName}
                className={cn(buttonVariants({ size: "lg" }), "w-full")}
              >
                <RiDownloadLine data-icon="inline-start" />
                Save to my computer
              </a>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={resetForm}
              >
                Download another link
              </Button>
            </>
          ) : (
            <UploadButton
              className="w-full"
              disabled={!url.trim()}
              phase={downloadUi.phase}
              progress={downloadUi.progress}
              label={downloadUi.label}
              idleLabel="Download"
              onClick={() => void onDownload()}
            />
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
