#!/usr/bin/env python3
"""
LangFlow Replacement Server
A Python FastAPI server that replaces the LangFlow API functionality
for the Name My Baby application.

This server handles chat requests with memory and OpenAI integration.
"""

import os
import json
import sys
from typing import Optional, Dict, Any
from datetime import datetime
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from langchain.memory import ConversationBufferMemory

# Load environment variables from .env file
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Name My Baby LangFlow Replacement",
    description="A standalone Python FastAPI server that replaces LangFlow API functionality",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your Next.js app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session storage (for production, use Redis or database)
session_memories: Dict[str, ConversationBufferMemory] = {}

# System prompt based on the LangFlow template
SYSTEM_PROMPT_TEMPLATE = """Classify the given user question into one of the specified categories based on its nature, including all defined categories. 

- 'generate name suggestions': If the question is related to this product's functionalities AND the user wants to generate names suggestions
- 'create name report': If the question is related to this product's functionalities AND the user wants to understand meaning/etymology of the name
- 'generate ideas': If the question is related to this product's functionalities AND the user wants to generate ideas for cool creative names

If the question does not fit into any of these categories, return 'not related'.

# Steps

1. Analyze the user question.
2. Determine which category the question fits into based on its structure, keywords and relevancy to the {product_information}
3. Return the corresponding category or 'Not related' if none apply.

# Output Format

- Return only the category word: 'generate name suggestions' or 'create name report' or 'generate ideas' or 'not related'
- Do not include any extra text or quotes in the output.

# Examples

- **Example 1**  
  * Question: I'm looking to name my child. Will you be able to help me?
  * Response: generate name suggestions

- **Example 2**  
  * Question: Give me some ideas to call my child. 
  * Response: generate name suggestions

- **Example 3**  
  * Question: I'm looking for cool names
  * Response: generate name suggestions

- **Example 4**  
  * Question: I'm looking to understand the process of child birth
  * Response: not related

- **Example 5**  
  * Question: What is the purpose of life?
  * Response: not related

- **Example 6**  
  * Question: What is the first thing to do after giving birth to a child?
  * Response: not related

- **Example 7**  
 * Question: What is the meaning of the name - Maya?
 * Response: create name report

- **Example 8**  
 * Question: What is the origin of the name - John? 
 * Response: create name report

- **Example 9**
 * Question: Give me ideas to generate cool names for my kid
 * Response: generate ideas

- **Example 10** 
 * Question: Give me ideas to put into user preferences while generating ideas 
 * Response: generate ideas

Use information from the conversation history only if relevant to the above user query, otherwise ignore the history.
Conversation history with the user:
{history}

User question: {question}

Production functionalities: {product_information}
"""

PRODUCT_INFORMATION = """Name My Baby is a baby naming assistant application that helps parents find the perfect name for their child. The application provides:
1. AI-powered name suggestions based on user preferences
2. Detailed name reports with etymology, meaning, and cultural significance
3. Creative ideas for naming inspiration
4. Voice analysis to hear how names sound in different accents
5. Organization tools (shortlist, maybe, rejected buckets)

The application understands and responds to queries related to:
- Generating baby name suggestions
- Providing detailed reports about specific names (etymology, meaning, origin)
- Generating creative ideas for naming
- User preferences and customization"""

# Request/Response models
class ChatRequest(BaseModel):
    message: Optional[str] = None
    session_id: Optional[str] = None
    input_type: Optional[str] = "chat"
    output_type: Optional[str] = "chat"
    input_value: Optional[str] = None
    user_id: Optional[str] = None

class ChatResponse(BaseModel):
    message: str
    sessionId: str
    outputs: Optional[list] = None


def get_memory(session_id: str) -> ConversationBufferMemory:
    """Get or create memory for a session."""
    if session_id not in session_memories:
        session_memories[session_id] = ConversationBufferMemory(
            memory_key="history",
            return_messages=True
        )
    return session_memories[session_id]


def get_conversation_chain(session_id: str):
    """Get or create conversation chain for a session."""
    memory = get_memory(session_id)
    
    # Get OpenAI API key
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise ValueError("OPENAI_API_KEY environment variable is not set")
    
    # Initialize LLM (using gpt-4o-mini as per LangFlow config)
    llm = ChatOpenAI(
        model_name="gpt-4o-mini",
        temperature=0.1,
        openai_api_key=openai_api_key
    )
    
    return llm, memory


@app.post("/api/v1/run")
async def run_flow(request: ChatRequest):
    """
    Main endpoint that replaces LangFlow API.
    Handles chat requests with memory and OpenAI.
    """
    try:
        # Get message from request
        message = request.input_value or request.message
        if not message:
            raise HTTPException(status_code=400, detail="Message is required")
        
        # Get session ID
        session_id = request.session_id or f"session-{datetime.now().timestamp()}"
        
        # Get LLM and memory
        llm, memory = get_conversation_chain(session_id)
        
        # Get conversation history as text
        # Use the memory buffer directly which formats messages properly
        history_buffer = memory.buffer if hasattr(memory, 'buffer') else ""
        history_text = history_buffer if history_buffer else ""
        
        # Prepare input with product information
        formatted_input = message
        if request.user_id:
            formatted_input = f"{message} User ID: {request.user_id}"
        
        # Format the full prompt
        full_prompt = SYSTEM_PROMPT_TEMPLATE.format(
            history=history_text,
            question=formatted_input,
            product_information=PRODUCT_INFORMATION
        )
        
        # Get response from LLM
        response_obj = llm.invoke(full_prompt)
        response = response_obj.content if hasattr(response_obj, 'content') else str(response_obj)
        
        # Store the interaction in memory
        from langchain_core.messages import HumanMessage, AIMessage
        memory.chat_memory.add_user_message(HumanMessage(content=formatted_input))
        memory.chat_memory.add_ai_message(AIMessage(content=response))
        
        # Format response to match LangFlow structure exactly
        formatted_response = {
            "outputs": [{
                "outputs": [{
                    "outputs": {
                        "message": {
                            "message": response
                        }
                    }
                }]
            }],
            "session_id": session_id
        }
        
        return JSONResponse(content=formatted_response)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/chat")
async def chat_endpoint(request: ChatRequest):
    """Alternative chat endpoint for compatibility."""
    return await run_flow(request)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    print(f"Starting LangFlow Replacement Server on {host}:{port}")
    print("Make sure OPENAI_API_KEY environment variable is set")
    
    uvicorn.run(app, host=host, port=port)

