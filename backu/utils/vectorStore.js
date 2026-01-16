// utils/vectorStore.js
import crypto from "crypto";
import fetch from "node-fetch";

const cosine = (a, b) => {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
};

/** Simple in-memory vector store */
export class MemoryVectorStore {
  constructor() {
    this.store = []; // { id, vector, metadata }
  }

  async upsert(id, vector, metadata = {}) {
    const existing = this.store.find((s) => s.id === id);
    if (existing) {
      existing.vector = vector;
      existing.metadata = metadata;
    } else {
      this.store.push({ id, vector, metadata });
    }
  }

  async query(queryVector, topK = 5) {
    const scored = this.store.map((s) => ({
      id: s.id,
      score: cosine(queryVector, s.vector),
      metadata: s.metadata,
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }
}

/** Optional Pinecone adapter */
import { Pinecone } from "@pinecone-database/pinecone";

export class PineconeAdapter {
  constructor({ apiKey, indexName }) {
    this.indexName = indexName;
    this.pc = new Pinecone({ apiKey });
    this.index = this.pc.index(indexName);
  }

  async upsert(id, vector, metadata = {}) {
    try {
      await this.index.upsert([
        {
          id,
          values: vector,
          metadata,
        },
      ]);
      console.log("✅ Upserted to Pinecone:", id);
    } catch (err) {
      console.error("❌ Pinecone upsert error:", err);
      throw err;
    }
  }

  async query(vector, topK = 5) {
    try {
      const result = await this.index.query({
        vector,
        topK,
        includeMetadata: true,
      });
      return result.matches || [];
    } catch (err) {
      console.error("❌ Pinecone query error:", err);
      return [];
    }
  }
}
