"use client"

import { useState } from "react"
import { Search, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PdfViewerProps {
  pdfUrl: string
  highlightText?: string | null
}

export function PdfViewer({ pdfUrl, highlightText }: PdfViewerProps) {
  const [copied, setCopied] = useState(false)

  const copyClause = async () => {
    if (!highlightText) return
    try {
      await navigator.clipboard.writeText(highlightText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const validClause = !!highlightText && highlightText !== 'NICHT_VERFUEGBAR'

  return (
    <div className="space-y-2">
      {validClause && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 border rounded-md px-3 py-2">
          <Search className="h-3.5 w-3.5 shrink-0"/>
          <span className="flex-1">Klausel im PDF finden: kopieren und Strg+F im PDF-Viewer einfügen</span>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={copyClause}>
            {copied ? <><Check className="h-3 w-3 mr-1"/>Kopiert</> : <><Copy className="h-3 w-3 mr-1"/>Klausel kopieren</>}
          </Button>
        </div>
      )}
      <div className="rounded-lg border bg-white overflow-hidden">
        <iframe
          src={pdfUrl}
          className="w-full h-[600px] border-0"
          title="Versicherungspolice"
        />
      </div>
    </div>
  )
}
