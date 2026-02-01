"use client"

import * as React from "react"
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Eye,
  ExternalLink,
  MinusCircle,
  Search,
  SlidersHorizontal,
  Tag,
  Users,
} from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { SiteHeader } from "@/components/site-header"

import data from "../dashboard/data.json"

type ImpactLevel = "LOW" | "MEDIUM" | "HIGH"

type SearchItem = {
  id: number
  title: string
  summary: string
  documentType: string
  team: string
  criticality: "Critical" | "High" | "Medium" | "Low"
  lastUpdated: string
  metadataScore: number
  tags: string[]
  systemDependencies: string[]
}

function getImpactLevel(item: (typeof data)[number]): ImpactLevel {
  const limitValue = Number.parseInt(item.limit, 10)
  if (!Number.isFinite(limitValue)) {
    return "LOW"
  }
  if (limitValue <= 10) {
    return "LOW"
  }
  if (limitValue <= 20) {
    return "MEDIUM"
  }
  return "HIGH"
}

function getCriticality(impact: ImpactLevel): SearchItem["criticality"] {
  if (impact === "HIGH") return "High"
  if (impact === "MEDIUM") return "Medium"
  return "Low"
}

function getMetadataScore(item: (typeof data)[number]) {
  const limitValue = Number.parseInt(item.limit, 10)
  const normalized = Number.isFinite(limitValue) ? limitValue : 0
  return Math.min(100, Math.max(45, 50 + normalized * 1.5))
}

function getLastUpdated(item: (typeof data)[number]) {
  const base = new Date("2024-01-01T00:00:00Z")
  const offset = Number.parseInt(item.target, 10)
  if (Number.isFinite(offset)) {
    base.setDate(base.getDate() + offset)
  }
  return base.toISOString().slice(0, 10)
}

const dependencyMap: Record<string, string[]> = {
  Narrative: ["Notion", "Google Docs"],
  "Technical content": ["GitHub", "Postman"],
  Legal: ["Compliance Portal"],
  Research: ["Confluence", "Miro"],
  Planning: ["Jira", "Airtable"],
  Financial: ["Sheets", "QuickBooks"],
  Visual: ["Figma", "Illustrator"],
  "Plain language": ["Grammarly"],
}

export default function MetadataSearchPage() {
  const items = React.useMemo<SearchItem[]>(() => {
    return data.map((item) => {
      const impact = getImpactLevel(item)
      const type = item.type || "General"
      return {
        id: item.id,
        title: item.header,
        summary: `${item.type} document owned by ${item.reviewer}. Status: ${item.status}.`,
        documentType: type,
        team: item.reviewer === "Assign reviewer" ? "Unassigned" : item.reviewer,
        criticality: getCriticality(impact),
        lastUpdated: getLastUpdated(item),
        metadataScore: getMetadataScore(item),
        tags: [type, item.status].filter(Boolean),
        systemDependencies: dependencyMap[type] ?? ["SharePoint"],
      }
    })
  }, [])

  const [query, setQuery] = React.useState("")
  const [selectedDocument, setSelectedDocument] = React.useState<SearchItem | null>(
    items[0] ?? null
  )
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>([])
  const [selectedCriticality, setSelectedCriticality] = React.useState<string[]>([])
  const [selectedQuality, setSelectedQuality] = React.useState<string[]>([])
  const [teamFilter, setTeamFilter] = React.useState("all")
  const [lastUpdatedFilter, setLastUpdatedFilter] = React.useState("all")
  const [dependencyQuery, setDependencyQuery] = React.useState("")

  const typeOptions = React.useMemo(
    () => Array.from(new Set(items.map((item) => item.documentType))).sort(),
    [items]
  )

  const teamOptions = React.useMemo(
    () => Array.from(new Set(items.map((item) => item.team))).sort(),
    [items]
  )

  const filteredItems = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const normalizedDependency = dependencyQuery.trim().toLowerCase()
    const now = new Date()

    return items.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          item.title,
          item.summary,
          item.documentType,
          item.team,
          item.criticality,
          item.tags.join(" "),
          item.systemDependencies.join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)

      const matchesTypes =
        selectedTypes.length === 0 || selectedTypes.includes(item.documentType)

      const matchesTeam = teamFilter === "all" || item.team === teamFilter

      const matchesCriticality =
        selectedCriticality.length === 0 ||
        selectedCriticality.includes(item.criticality)

      const matchesQuality =
        selectedQuality.length === 0 ||
        selectedQuality.some((level) => {
          if (level === "high") return item.metadataScore >= 90
          if (level === "medium")
            return item.metadataScore >= 70 && item.metadataScore < 90
          return item.metadataScore < 70
        })

      const matchesDependencies =
        !normalizedDependency ||
        item.systemDependencies
          .join(" ")
          .toLowerCase()
          .includes(normalizedDependency)

      const matchesLastUpdated = (() => {
        if (lastUpdatedFilter === "all") return true
        const days = Number.parseInt(lastUpdatedFilter, 10)
        if (!Number.isFinite(days)) return true
        const updated = new Date(item.lastUpdated)
        const diffDays = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24)
        return diffDays <= days
      })()

      return (
        matchesQuery &&
        matchesTypes &&
        matchesTeam &&
        matchesCriticality &&
        matchesQuality &&
        matchesDependencies &&
        matchesLastUpdated
      )
    })
  }, [
    items,
    query,
    selectedTypes,
    teamFilter,
    selectedCriticality,
    selectedQuality,
    dependencyQuery,
    lastUpdatedFilter,
  ])

  React.useEffect(() => {
    if (!selectedDocument && filteredItems.length > 0) {
      setSelectedDocument(filteredItems[0])
    }
  }, [filteredItems, selectedDocument])

  const getMetadataColor = (score: number) => {
    if (score >= 90) return "text-emerald-700 bg-emerald-50 border-emerald-300"
    if (score >= 70) return "text-amber-700 bg-amber-50 border-amber-300"
    return "text-rose-700 bg-rose-50 border-rose-300"
  }

  const getMetadataIcon = (score: number) => {
    if (score >= 90) return <CheckCircle2 className="size-4" />
    if (score >= 70) return <AlertCircle className="size-4" />
    return <MinusCircle className="size-4" />
  }

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case "Critical":
        return "bg-rose-50 text-rose-700 border-rose-300"
      case "High":
        return "bg-amber-50 text-amber-700 border-amber-300"
      default:
        return "bg-slate-100 text-slate-700 border-slate-300"
    }
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col bg-slate-50">
          <div className="border-b bg-white">
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  IT Information Hub
                </h2>
                <p className="text-sm text-slate-500">
                  Metadata Search
                </p>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Metadata Completeness</p>
                  <p className="font-semibold text-slate-900">94.2%</p>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <p className="text-xs text-slate-500">Avg. Search Time</p>
                  <p className="font-semibold text-emerald-700">47ms</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col xl:flex-row">
            <aside className="w-full border-b bg-white p-6 xl:w-80 xl:border-b-0 xl:border-r">
              <div className="mb-6 flex items-center gap-2">
                <SlidersHorizontal className="size-5 text-slate-700" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Advanced Filters
                </h3>
              </div>

              <div className="mb-6">
                <Label className="mb-3 block text-sm">Document Type</Label>
                <div className="space-y-2">
                  {typeOptions.map((type) => (
                    <div key={type} className="flex items-center gap-2">
                      <Checkbox
                        id={`type-${type}`}
                        checked={selectedTypes.includes(type)}
                        onCheckedChange={(checked) => {
                          setSelectedTypes((prev) =>
                            checked
                              ? [...prev, type]
                              : prev.filter((value) => value !== type)
                          )
                        }}
                      />
                      <label
                        htmlFor={`type-${type}`}
                        className="cursor-pointer text-sm text-slate-700"
                      >
                        {type}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <Label className="mb-3 block text-sm">Team</Label>
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All teams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    {teamOptions.map((team) => (
                      <SelectItem key={team} value={team}>
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mb-6">
                <Label className="mb-3 block text-sm">Criticality</Label>
                <div className="space-y-2">
                  {["Critical", "High", "Medium", "Low"].map((level) => (
                    <div key={level} className="flex items-center gap-2">
                      <Checkbox
                        id={`critical-${level}`}
                        checked={selectedCriticality.includes(level)}
                        onCheckedChange={(checked) => {
                          setSelectedCriticality((prev) =>
                            checked
                              ? [...prev, level]
                              : prev.filter((value) => value !== level)
                          )
                        }}
                      />
                      <label
                        htmlFor={`critical-${level}`}
                        className="cursor-pointer text-sm text-slate-700"
                      >
                        {level}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <Label className="mb-3 block text-sm">Metadata Quality</Label>
                <div className="space-y-2">
                  {[
                    { id: "high", label: "High (90-100%)", icon: <CheckCircle2 className="size-4 text-emerald-600" /> },
                    { id: "medium", label: "Medium (70-89%)", icon: <AlertCircle className="size-4 text-amber-600" /> },
                    { id: "low", label: "Low (<70%)", icon: <MinusCircle className="size-4 text-rose-600" /> },
                  ].map((quality) => (
                    <div key={quality.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`quality-${quality.id}`}
                        checked={selectedQuality.includes(quality.id)}
                        onCheckedChange={(checked) => {
                          setSelectedQuality((prev) =>
                            checked
                              ? [...prev, quality.id]
                              : prev.filter((value) => value !== quality.id)
                          )
                        }}
                      />
                      <label
                        htmlFor={`quality-${quality.id}`}
                        className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
                      >
                        {quality.icon}
                        {quality.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <Label className="mb-3 block text-sm">Last Updated</Label>
                <Select
                  value={lastUpdatedFilter}
                  onValueChange={setLastUpdatedFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any time</SelectItem>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mb-6">
                <Label className="mb-3 block text-sm">System Dependencies</Label>
                <Input
                  placeholder="e.g., Jira, Confluence"
                  value={dependencyQuery}
                  onChange={(event) => setDependencyQuery(event.target.value)}
                />
              </div>

              <Button
                variant="outline"
                className="w-full"
                size="sm"
                onClick={() => {
                  setQuery("")
                  setSelectedTypes([])
                  setSelectedCriticality([])
                  setSelectedQuality([])
                  setTeamFilter("all")
                  setLastUpdatedFilter("all")
                  setDependencyQuery("")
                }}
              >
                Reset All Filters
              </Button>
            </aside>

            <div className="flex flex-1 flex-col">
              <div className="border-b bg-white p-6">
                <div className="mx-auto flex max-w-4xl flex-col gap-4">
                  <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[260px]">
                      <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                      <Input
                        placeholder="Search by keywords, tags, system dependencies, or document metadata..."
                        className="h-12 pl-10 text-base"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                      />
                    </div>
                    <Button className="h-12 px-8">Search</Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <small className="text-slate-500">Suggested:</small>
                    {["database backup procedures", "API authentication", "incident postmortem 2024"].map(
                      (suggestion) => (
                        <Badge
                          key={suggestion}
                          variant="outline"
                          className="cursor-pointer text-xs hover:border-slate-400 hover:bg-slate-50"
                          onClick={() => setQuery(suggestion)}
                        >
                          {suggestion}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="border-b bg-slate-50 px-6 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-700">
                  <p>
                    <strong>{filteredItems.length} results</strong> found in 
                    <strong>47ms</strong>
                  </p>
                  <div className="flex items-center gap-3">
                    <small className="text-slate-600">Sort by:</small>
                    <Select defaultValue="relevance">
                      <SelectTrigger className="h-8 w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="metadata">Metadata Score</SelectItem>
                        <SelectItem value="updated">Last Updated</SelectItem>
                        <SelectItem value="criticality">Criticality</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-6">
                <div className="mx-auto flex max-w-4xl flex-col gap-4">
                  {filteredItems.map((result) => (
                    <Card
                      key={result.id}
                      className={`cursor-pointer p-5 transition-shadow hover:shadow-md ${
                        selectedDocument?.id === result.id
                          ? "ring-2 ring-slate-400"
                          : ""
                      }`}
                      onClick={() => setSelectedDocument(result)}
                    >
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <div>
                          <div className="mb-2 flex flex-wrap items-center gap-3">
                            <h4 className="text-slate-900">{result.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {result.documentType}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600">
                            {result.summary}
                          </p>
                        </div>
                        <div
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${getMetadataColor(
                            result.metadataScore
                          )}`}
                        >
                          {getMetadataIcon(result.metadataScore)}
                          <div className="text-right">
                            <p className="text-xs">Quality</p>
                            <p className="text-sm font-semibold">
                              {Math.round(result.metadataScore)}%
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Users className="size-3.5" />
                          <span>{result.team}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3.5" />
                          <span>Updated {result.lastUpdated}</span>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getCriticalityColor(result.criticality)}`}
                        >
                          {result.criticality}
                        </Badge>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {result.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs bg-slate-50"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="mt-3 border-t border-slate-100 pt-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>Dependencies:</span>
                          {result.systemDependencies.map((dep) => (
                            <Badge
                              key={dep}
                              variant="outline"
                              className="text-xs bg-slate-50"
                            >
                              {dep}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            <aside className="w-full border-t bg-white xl:w-96 xl:border-l xl:border-t-0">
              <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900">
                    Document Preview
                  </h4>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <ExternalLink className="size-4" />
                    Open
                  </Button>
                </div>

                {selectedDocument ? (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {selectedDocument.title}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {selectedDocument.summary}
                      </p>
                    </div>

                    <Card className="bg-slate-50 p-4">
                      <h5 className="mb-3 text-sm font-semibold text-slate-900">
                        Metadata
                      </h5>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-slate-500">Document Type</p>
                          <p className="text-slate-900">
                            {selectedDocument.documentType}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Owner Team</p>
                          <p className="text-slate-900">
                            {selectedDocument.team}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Criticality</p>
                          <Badge
                            variant="outline"
                            className={getCriticalityColor(
                              selectedDocument.criticality
                            )}
                          >
                            {selectedDocument.criticality}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-slate-500">Last Updated</p>
                          <p className="text-slate-900">
                            {selectedDocument.lastUpdated}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Metadata Quality</p>
                          <div
                            className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 ${getMetadataColor(
                              selectedDocument.metadataScore
                            )}`}
                          >
                            {getMetadataIcon(selectedDocument.metadataScore)}
                            <span>
                              {Math.round(selectedDocument.metadataScore)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>

                    <div>
                      <h5 className="mb-3 text-sm font-semibold text-slate-900">
                        Tags
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedDocument.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            <Tag className="mr-1 size-3" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="mb-3 text-sm font-semibold text-slate-900">
                        System Dependencies
                      </h5>
                      <div className="space-y-2 text-sm text-slate-700">
                        {selectedDocument.systemDependencies.map((dep) => (
                          <div key={dep} className="flex items-center gap-2">
                            <div className="size-2 rounded-full bg-slate-400" />
                            {dep}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-slate-200 pt-4">
                      <Button className="w-full">
                        <Eye className="mr-2 size-4" />
                        View Full Document
                      </Button>
                      <Button variant="outline" className="w-full">
                        Request Update
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    Select a document to preview its metadata.
                  </p>
                )}
              </div>
            </aside>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
