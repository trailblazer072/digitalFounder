import google.generativeai as genai
from app.core.config import settings

class LLMService:
    def __init__(self):
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel('gemini-2.5-flash') # Using Flash for speed/cost, can be 'gemini-2.5-pro'
        else:
            self.model = None

    async def get_response(self, system_prompt: str, user_message: str, context: str = "") -> str:
        if not self.model:
            return "Gemini API Key not configured."

        # Gemini 1.5 doesn't strictly have a "system" role in the same way as GPT in the simplified chat history always
        # But we can pass system instructions during model instantiation, or prepend it.
        # For per-request system prompts, prepending is the most dynamic way without re-instantiating.
        
        full_prompt = f"""
        SYSTEM INSTRUCTIONS:
        {system_prompt}

        RELEVANT CONTEXT FROM DOCUMENTS:
        {context}

        USER MESSAGE:
        {user_message}
        """
        
        try:
            # We use generate_content for single turn, or start_chat for multi-turn.
            # Since the backend is stateless (passing history mostly via frontend or DB), 
            # single turn generation with context is often easier for RAG.
            response = await self.model.generate_content_async(full_prompt)
            
            return response.text
        except Exception as e:
            return f"Error contacting Gemini: {str(e)}"

llm_service = LLMService()
