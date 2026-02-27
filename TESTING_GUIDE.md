# Axel Backend Testing Guide

 This guide walks you through the complete flow of the Axel application, from verifying the initial setup to chatting with specific AI agents. You can use **Postman**, **Insomnia**, or the built-in **Swagger UI** (`http://localhost:8000/docs`).

 ## Prerequisite: Running the Server

 1.  **Open Terminal**: Navigate to your `backend` directory.
     ```bash
     cd backend
     ```
 2.  **Activate Virtual Environment**:
     ```bash
     venv\Scripts\activate
     ```
 3.  **Run Server**:
     ```bash
     uvicorn app.main:app --reload
     ```
     *The server will start on `http://localhost:8000`.*

 ---

 ## Step 1: Verify Initial Seeding

 When you ran the server, the [init_db.py](file:///c:/Users/adars/Documents/GitHub/digitalFounder/backend/app/db/init_db.py) script automatically created:
 1.  A default **Organization**.
 2.  Three **Sections** (Agents): Finance, Marketing, Sales.

 Since we don't have a specific "List Sections" endpoint exposed in the scaffold yet, we will verify this by **starting a conversation**.

 ---

 ## Step 2: Organize Your Testing Data

 You need the `UUID`s of the seeded sections to start a chat. Since we didn't print them to the console, let's create a quick temporary endpoint or check the database. 
 
 **Easier Way:** I will add a temporary `GET /api/sections` endpoint for you to see the UUIDs. 
 *(See code update below guide)*.

 Assuming you have the UUIDs (Response from Step 2.1):
 *   **Finance ID**: `...`
 *   **Marketing ID**: `...`
 *   **Sales ID**: `...`

 ---

 ## Step 3: Start a Conversation

 **Goal**: Initialize a chat session with the **Finance** agent.

 *   **Endpoint**: `POST http://localhost:8000/api/chat/start`
 *   **Query Params**: 
     *   `section_id`: `<PASTE_FINANCE_SECTION_UUID_HERE>`
 *   **Method**: `POST`
 *   **Response**:
     ```json
     "3fa85f64-5717-4562-b3fc-2c963f66afa6" // This is your conversation_id
     ```

 ---

 ## Step 4: Chat with the Agent

 **Goal**: Ask the CFO a question.

 *   **Endpoint**: `POST http://localhost:8000/api/chat/`
 *   **Method**: `POST`
 *   **Body (JSON)**:
     ```json
     {
       "conversation_id": "<PASTE_CONVERSATION_ID_FROM_STEP_3>",
       "message": "We need to cut costs. What should we look at first?"
     }
     ```
 *   **Expected Response**:
     ```json
     {
       "response": "As your CFO, I recommend strictly analyzing our burn rate..."
     }
     ```
     *The response uses the "Finance" persona we defined.*

 ---

 ## Step 5: Upload Knowledge (RAG)

 **Goal**: Upload a legal or financial document so the agent knows about your specific startup context.

 *   **Endpoint**: `POST http://localhost:8000/api/documents/upload`
 *   **Method**: `POST`
 *   **Body**: `form-data`
     *   Key: `file`
     *   Type: `File`
     *   Value: *(Select a .txt or .md file from your computer)*
 *   **Response**:
     ```json
     {
       "status": "success",
       "document_id": "..."
     }
     ```

 ---

 ## Step 6: Chat with Context

 **Goal**: Verify the agent uses the uploaded document defined in Step 5.

 *   **Endpoint**: `POST http://localhost:8000/api/chat/`
 *   **Method**: `POST`
 *   **Body (JSON)**:
     ```json
     {
       "conversation_id": "<SAME_CONVERSATION_ID>",
       "message": "Based on the document I just uploaded, what is our runway?"
     }
     ```
 *   **Expected Response**: The AI will reference the content of the file you uploaded.

 ---

 ## Summary of URL Structure

 | Action | Method | URL |
 | :--- | :--- | :--- |
 | **API Docs** | GET | `http://localhost:8000/docs` |
 | **Start Chat** | POST | `http://localhost:8000/api/chat/start` |
 | **Send Message** | POST | `http://localhost:8000/api/chat/` |
 | **Upload Doc** | POST | `http://localhost:8000/api/documents/upload` |
