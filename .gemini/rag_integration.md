# AI Assistant UI - RAG Integration Skill

This skill defines the requirements and behavior for the Retrieval-Augmented Generation (RAG) feature of the AI Assistant UI, specifically utilizing **Qdrant** as the vector database.

## Core Capabilities & Intelligence

1. **Qdrant Vector Database Integration**: 
   - Securely connects to a Qdrant instance to store, manage, and query high-dimensional vector embeddings.
   - Ensures fast and scalable similarity search capabilities.

2. **Intelligent Document Ingestion & Processing**:
   - Allows users to upload personal or organizational data (e.g., PDFs, text files, markdown).
   - Automatically parses and splits documents into semantic chunks.
   - Converts these chunks into vector embeddings using a designated embedding model before storing them in Qdrant.

3. **Semantic Search & Retrieval**:
   - When a user asks a question, the system converts the query into an embedding.
   - Performs an intelligent similarity search within Qdrant to instantly retrieve the most relevant pieces of context.

4. **Context-Aware Response Generation**:
   - Injects the retrieved, relevant context from Qdrant directly into the prompt for the generative AI model.
   - Ensures the AI's responses are accurate, highly relevant, and strictly grounded in the user's uploaded data rather than just general knowledge.

5. **Source Citations and Transparency**:
   - When generating an answer using RAG, the UI should display the source documents or snippets that the AI used to formulate its response.
   - Builds trust by allowing users to verify the information.

6. **Dynamic Knowledge Base Management**:
   - Provides users with an interface to easily add, view, or remove documents from their Qdrant collections, keeping the AI's knowledge base current and relevant to their evolving needs.
