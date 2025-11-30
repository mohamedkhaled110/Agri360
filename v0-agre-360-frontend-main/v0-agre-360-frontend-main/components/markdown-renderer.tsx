"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

interface MarkdownRendererProps {
  content: string
  className?: string
  dir?: "ltr" | "rtl"
}

export function MarkdownRenderer({ content, className, dir = "ltr" }: MarkdownRendererProps) {
  const renderedContent = useMemo(() => {
    if (!content) return null
    
    // Process markdown to HTML
    let html = content
    
    // Escape HTML first
    html = html.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    
    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2 text-primary">$1</h3>')
    html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-5 mb-3 text-primary border-b pb-2">$1</h2>')
    html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-4 text-primary">$1</h1>')
    
    // Bold and italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong class="font-bold"><em>$1</em></strong>')
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
    html = html.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    html = html.replace(/__(.+?)__/g, '<strong class="font-semibold">$1</strong>')
    html = html.replace(/_(.+?)_/g, '<em class="italic">$1</em>')
    
    // Horizontal rules
    html = html.replace(/^---+$/gm, '<hr class="my-4 border-t border-border" />')
    html = html.replace(/^\*\*\*+$/gm, '<hr class="my-4 border-t border-border" />')
    
    // Tables
    html = processMarkdownTables(html)
    
    // Bullet lists
    html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    html = html.replace(/^\* (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    
    // Numbered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    
    // Wrap consecutive li elements in ul/ol
    html = html.replace(/(<li class="ml-4 list-disc">.+<\/li>\n?)+/g, (match) => {
      return `<ul class="my-2 space-y-1">${match}</ul>`
    })
    html = html.replace(/(<li class="ml-4 list-decimal">.+<\/li>\n?)+/g, (match) => {
      return `<ol class="my-2 space-y-1">${match}</ol>`
    })
    
    // Code blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-muted p-3 rounded-lg my-3 overflow-x-auto text-sm font-mono"><code>$2</code></pre>')
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    
    // Blockquotes
    html = html.replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-primary pl-4 my-2 italic text-muted-foreground">$1</blockquote>')
    
    // Line breaks - preserve paragraph structure
    html = html.replace(/\n\n/g, '</p><p class="my-2">')
    html = html.replace(/\n/g, '<br />')
    
    // Wrap in paragraph
    html = `<p class="my-2">${html}</p>`
    
    // Clean up empty paragraphs
    html = html.replace(/<p class="my-2"><\/p>/g, '')
    html = html.replace(/<p class="my-2">(<h[123])/g, '$1')
    html = html.replace(/(<\/h[123]>)<\/p>/g, '$1')
    html = html.replace(/<p class="my-2">(<hr)/g, '$1')
    html = html.replace(/(<\/hr>|<hr[^>]*\/>)<\/p>/g, '$1')
    html = html.replace(/<p class="my-2">(<ul|<ol)/g, '$1')
    html = html.replace(/(<\/ul>|<\/ol>)<\/p>/g, '$1')
    html = html.replace(/<p class="my-2">(<table)/g, '$1')
    html = html.replace(/(<\/table>)<\/p>/g, '$1')
    html = html.replace(/<p class="my-2">(<pre)/g, '$1')
    html = html.replace(/(<\/pre>)<\/p>/g, '$1')
    html = html.replace(/<p class="my-2">(<blockquote)/g, '$1')
    html = html.replace(/(<\/blockquote>)<\/p>/g, '$1')
    
    return html
  }, [content])
  
  if (!content) return null
  
  return (
    <div 
      className={cn("prose prose-sm max-w-none dark:prose-invert", className)}
      dir={dir}
      dangerouslySetInnerHTML={{ __html: renderedContent || '' }}
    />
  )
}

function processMarkdownTables(html: string): string {
  // Match markdown tables
  const tableRegex = /\|(.+)\|\n\|[-:| ]+\|\n((?:\|.+\|\n?)+)/g
  
  return html.replace(tableRegex, (match, headerRow, bodyRows) => {
    // Parse header
    const headers = headerRow.split('|').filter((h: string) => h.trim())
    
    // Parse body rows
    const rows = bodyRows.trim().split('\n').map((row: string) => 
      row.split('|').filter((cell: string) => cell.trim())
    )
    
    // Build table HTML
    let tableHtml = '<div class="overflow-x-auto my-4"><table class="min-w-full border-collapse border border-border rounded-lg">'
    
    // Header
    tableHtml += '<thead class="bg-muted"><tr>'
    headers.forEach((h: string) => {
      tableHtml += `<th class="border border-border px-4 py-2 text-left font-semibold">${h.trim()}</th>`
    })
    tableHtml += '</tr></thead>'
    
    // Body
    tableHtml += '<tbody>'
    rows.forEach((row: string[], i: number) => {
      tableHtml += `<tr class="${i % 2 === 0 ? 'bg-background' : 'bg-muted/50'}">`
      row.forEach((cell: string) => {
        tableHtml += `<td class="border border-border px-4 py-2">${cell.trim()}</td>`
      })
      tableHtml += '</tr>'
    })
    tableHtml += '</tbody></table></div>'
    
    return tableHtml
  })
}
