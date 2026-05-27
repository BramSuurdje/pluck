import { AppShell } from "@/components/app-shell"
import { DownloaderForm } from "@/components/downloader-form"
import { getEnv } from "@/lib/env"

export default function Page() {
  const passwordRequired = Boolean(getEnv().APP_PASSWORD)

  return (
    <AppShell>
      <DownloaderForm passwordRequired={passwordRequired} />
    </AppShell>
  )
}
