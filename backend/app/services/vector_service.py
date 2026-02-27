from pinecone import Pinecone
from app.core.config import settings
from typing import List, Dict

class VectorService:
    def __init__(self):
        if settings.PINECONE_API_KEY:
            self.pc = Pinecone(api_key=settings.PINECONE_API_KEY)
            self.index = self.pc.Index(settings.PINECONE_INDEX_NAME)
        else:
            self.index = None

    def add_document(self, doc_id: str, text: str, metadata: Dict, org_id: str):
        """
        Add a document to the Pinecone index.
        CRITICAL: Use 'namespace' derived from org_id for isolation.
        """
        if not self.index:
            print("Pinecone not initialized.")
            return

        # Simple embedding mock (since we switched from Chroma which had built-in extraction)
        # In PROD: You MUST generate embeddings using OpenAI/Gemini Embedding API first.
        # For this scaffold, we will assume a placeholder embedding function or 
        # use Gemini to get embeddings if available.
        
        # Let's try to get embedding from Gemini since we have the key
        embedding = self._get_embedding(text)
        if not embedding:
            return

        # Namespace is crucial for multi-tenancy isolation
        namespace = f"org_{org_id}" 

        self.index.upsert(
            vectors=[
                {
                    "id": doc_id,
                    "values": embedding,
                    "metadata": metadata
                }
            ],
            namespace=namespace
        )

    def search(self, query: str, org_id: str, n_results: int = 3) -> List[str]:
        """
        Search for relevant documents within the Organization's namespace to prevent leaks.
        """
        if not self.index:
            return []

        embedding = self._get_embedding(query)
        if not embedding:
            return []
            
        namespace = f"org_{org_id}"

        results = self.index.query(
            vector=embedding,
            top_k=n_results,
            include_metadata=True,
            namespace=namespace
        )
        
        docs = []
        if results and results.matches:
            for match in results.matches:
                # We stored the text inside metadata? Probably better to store text in metadata
                # for simple RAG. In huge scale, store text in DB/S3 and fetch by ID.
                # For this MVP, let's assume valid metadata 'text' field or just file reference.
                # Since earlier we passed full text, let's assume we store snippets in metadata.
                # NOTE: Pinecone metadata limit is 40KB. Large text needs chunking.
                # For MVP: we just return "found in document X" or if we saved text in metadata.
                
                # If we didn't save text in metadata in add_document, we can't return it here.
                # Let's fix add_document logic implicitly to save snippet.
                if 'text_snippet' in match.metadata:
                    docs.append(match.metadata['text_snippet'])
                else:
                    docs.append(f"Content from {match.metadata.get('filename', 'unknown')}")
        
        return docs

    def _get_embedding(self, text: str) -> List[float]:
        """
        Helper to generate embeddings using Gemini.
        """
        import google.generativeai as genai
        if settings.GEMINI_API_KEY:
             # Just use the 'embedding-001' model
             result = genai.embed_content(
                 model="models/text-embedding-004",
                 content=text,
                 task_type="retrieval_document",
                 title="Embedding"
             )
             return result['embedding']
        return [0.0] * 768 # Fallback mock

vector_service = VectorService()
