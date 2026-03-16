"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Building2, CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface OrgRow {
  id: string
  name: string
  created_at: string
  avv_accepted_at: string | null
  is_suspended: boolean
  admin_email: string
  admin_name: string
  unit_count: number
  tenant_count: number
  case_count: number
  open_case_count: number
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString("de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export default function AdminOrganizationsPage() {
  const [orgs, setOrgs] = useState<OrgRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadOrgs() {
      try {
        const res = await fetch("/api/admin/organizations")
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Fehler beim Laden")
        }
        const json = await res.json()
        setOrgs(json.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unbekannter Fehler")
      } finally {
        setIsLoading(false)
      }
    }

    loadOrgs()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kunden</h1>
        <p className="text-muted-foreground mt-1">
          Alle registrierten Hausverwaltungen ({orgs.length})
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hausverwaltungen</CardTitle>
          <CardDescription>Übersicht aller HV-Kunden auf der Plattform</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {orgs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Building2 className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">Noch keine Hausverwaltungen registriert</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>HV-Admin</TableHead>
                    <TableHead className="text-right">Einheiten</TableHead>
                    <TableHead className="text-right">Mieter</TableHead>
                    <TableHead className="text-right">Fälle ges. / offen</TableHead>
                    <TableHead className="text-center">AVV</TableHead>
                    <TableHead>Registriert</TableHead>
                    <TableHead className="text-right">Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orgs.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div className="font-medium">{org.name}</div>
                        {org.is_suspended && (
                          <Badge variant="destructive" className="text-xs mt-1">
                            Gesperrt
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {org.admin_name || <span className="text-muted-foreground">—</span>}
                        </div>
                        {org.admin_email && (
                          <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {org.admin_email}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {org.unit_count}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {org.tenant_count}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span>{org.case_count}</span>
                        <span className="text-muted-foreground"> / </span>
                        <span
                          className={
                            org.open_case_count > 0 ? "text-orange-600 font-medium" : ""
                          }
                        >
                          {org.open_case_count}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {org.avv_accepted_at ? (
                          <CheckCircle2
                            className="h-4 w-4 text-green-600 mx-auto"
                            aria-label={`AVV akzeptiert am ${formatDate(org.avv_accepted_at)}`}
                          />
                        ) : (
                          <XCircle
                            className="h-4 w-4 text-red-500 mx-auto"
                            aria-label="AVV nicht akzeptiert"
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(org.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/organizations/${org.id}`}>Details</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
