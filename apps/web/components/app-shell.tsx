import Link from "next/link"

import { BRAM_SUURD_URL, GITHUB_URL } from "@/lib/site"
import { Highlighter } from "@workspace/ui/components/highlighter"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"

export function AppShell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex min-h-svh flex-col lg:flex-row", className)}>
      <div className="flex min-h-svh flex-1 flex-col lg:w-1/2 lg:min-w-0">
        <header className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 pt-4 pb-2">
          <div aria-hidden className="size-8" />
          <Link
            href="/"
            className="justify-self-center text-lg font-semibold tracking-tight transition-opacity hover:opacity-80"
          >
            Pluck
          </Link>
          <div aria-hidden className="size-8" />
        </header>
        <main className="flex min-h-0 flex-1 flex-col justify-center">
          {children}
        </main>
        <footer className="flex shrink-0 justify-center gap-2 px-4 py-6 text-center text-xs text-muted-foreground">
          <div className="shrink-0">
            Made by{" "}
            <a
              href={BRAM_SUURD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 hover:underline"
            >
              Bram Suurd
            </a>{" "}
          </div>
          <Separator orientation="vertical" />
          <div>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 hover:underline"
            >
              Github
            </a>
          </div>
        </footer>
      </div>
      <aside
        aria-hidden
        className="relative hidden lg:block lg:h-svh lg:w-1/2 lg:shrink-0"
      >
        <img
          src="/background.webp"
          alt=""
          className="size-full object-cover object-bottom"
        />
        <div className="absolute top-45 right-4 left-4 text-center font-serif text-4xl font-bold text-black dark:text-black">
          Saving media has <br />
          <Highlighter
            action="underline"
            strokeWidth={2}
            color="oklch(0.505 0.213 27.518)"
            animationDuration={1250}
          >
            never been easier
          </Highlighter>
          .
        </div>
      </aside>
    </div>
  )
}
