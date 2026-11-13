// Search Tab Screen [S22]
import React from 'react'
import { RouteSlot } from '../../components/navigation/RouteSlot'

export default function SearchTabScreen() {
  return (
    <RouteSlot
      id="S22"
      number="22"
      name="Search - Neural RAG & Audio Snippets"
      category="Main Tab"
      description="Truy vấn ngữ nghĩa 2 giai đoạn (BGE-M3 + BGE-Reranker-v2-m3) kèm trích đoạn âm thanh."
    />
  )
}
