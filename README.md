# IndexMeNow MCP Server – N8N Setup Documentation

This guide shows how to integrate **IndexMeNow MCP Server** into your **n8n workflows** using Claude, MCP tooling, and memory management for enabling efficient and automated management of large-scale indexing. 

---

## 1. Workflow Overview  

The basic n8n workflow requires **5 nodes**:  

1. **When Chat Message Received Node**  
2. **AI Agent Node**  
3. **Chat Model Node**  
4. **Simple Memory Node**  
5. **MCP Client Node**  

---

## 2. How the Workflow Works  

This n8n workflow enables an AI-powered system to intelligently process chat messages and execute tools dynamically using **MCP**.

1. **Chat Message Received**  
   - The workflow starts when a new chat message is captured by the **When Chat Message Received** node.  

2. **AI Agent Activation**  
   - The message is passed to an **AI Agent**, which interprets intent and coordinates next steps.  

3. **Language Understanding (Chat Model)**  
   - A **Chat Model** node (LLM) processes the message, using context and memory to understand user intent.  

4. **Context Management (Simple Memory)**  
   - The **Simple Memory** node stores/retrieves relevant context, ensuring smooth continuity across conversations.  

5. **MCP Client Node**  
   - Handles both listing available tools and executing them.  
   - The AI Agent first requests the available tools, then selects one with parameters for execution.  

---

## 3. Workflow Credentials Setup  

### 3.1 Chat Model Node  
- Recommended Model: **Claude Sonnet 3.5 (or higher)**.  
- Steps:  
  1. Open Chat Model configuration.  
  2. Credential to connect with: Click **+ Create a new credential**.  
  3. Choose a name for your model credential.  
  4. Paste your LLM API key in the **API Key** field.  
  5. Click **Save**.  

### 3.2 MCP Client Tool Node  
- Steps:  
  1. Open MCP Client Tool Node configuration.  
  2. Set **Server Transport** to **Server Sent Events**.
  3. Set **Authentication** to **Header Auth**.  
  4. Credential for Header Auth: Click **+ Create new credential**.  
  5. Use the following details:  
     - **Name**: `Authorization`  
     - **Value**: `Bearer your_indexmenow_api_key`  
  6. Click **Save**.  

- How to get your IndexMeNow API Key:
1. Create an Account <br>
  👉 [Sign up](https://tool.indexmenow.com/register) or [Log in](https://tool.indexmenow.com/login) to IndexMeNow.
2. Choose a Plan <br>
  💳 Purchase credits [here](https://tool.indexmenow.com/credits/buy).
3. Get Your API Key <br>
  🔑 Retrieve it from your [developer dashboard](https://tool.indexmenow.com/docapi).
4. Configure in N8N <br>
  Use the API key for the IndexMeNow MCP Server in N8N.
---

## 4. Workflow Nodes Setup  

### 4.1 When Chat Message Received Node  
- Click **+** in the top-right of the UI.  
- Search for **When Chat Message Received** node.  
- Add it to the workflow.  

### 4.2 AI Agent Node  
- Add the **AI Agent** node and connect it to the **Chat Message Received** node.  
- Configure as follows:  

| **Setting**                           | **Value**                                                   |
|---------------------------------------|-------------------------------------------------------------|
| Source for Prompt (User Message)      | Connected Chat Trigger Node                                 |
| Prompt (User Message)                 | {{ $json.chatInput }}                                       |
| Options                               | System Message                                              |

Paste the text available in this [page](https://gist.githubusercontent.com/occirank/e75e77c6c6f7698d6a68dd8903e1f245/raw/44c446086956e3b06539a75cde085a5d661a4aeb/index_me_now-n8n-agent.txt) in the `System Message` textarea

### 4.3 Chat Model Node  
- Add a **Chat Model** node (e.g., Anthropic Chat Model).  
- Connect it to the **AI Agent** node.  
- Configure as follows:  
 
| **Setting**                           | **Value**                                                   |
|---------------------------------------|-------------------------------------------------------------|
| Credential to connect with            | Select the one you created before                           |
| Model                                 | `Claude Sonnet 3.5` (or above)                              |

### 4.4 Simple Memory Node  
- Add a **Simple Memory** node.  
- Connect it to the **AI Agent** node.  

### 4.5 MCP Client Tool Node  
- Add an **MCP Client Tool** node to the workflow.  
- Connect it to the **AI Agent** node.  
- Configure as follows:  
 
| **Setting**                           | **Value**                                                   |
|---------------------------------------|-------------------------------------------------------------|
| Endpoint                              | https://indexmenow.occirank.fr/sse                           |
| Server Transport                      | Server Sent Events                                          |
| Authentication                        | Header Auth                                                 |
| Credential for Header Auth            | Select the MCP credential you created earlier               |
| Tools to Include                      | All                                                         |
---

## 5. IndexMeNow MCP Server Tools  

IndexMeNow MCP Server provides a list of tools to automate management of large-scale indexing:  

1. **Get credits count** - Retrieves the total number of remaining credits in your IndexMeNow account.
2. **Get all projects** - Lists all projects created under your account.
3. **Check if project name exists** - Verifies whether a project with a given name already exists.
4. **Add a new project** - Creates a new project with the specified URLs.
5. **Add new urls to existing project or index again completed urls** - Adds new URLs to an existing project or reindexes completed ones.
6. **Check project urls status** - Retrieves the indexing status of specific URLs in a project.
---

## 6. Workflow Test  

Once the workflow is fully set up and all nodes are configured:  
1. Click **Save** in the n8n editor.  
2. Trigger a message input to simulate chat.
3. Observe AI response + tool execution.
---

## 7. Troubleshooting & Debugging  

| Problem                             | Solution                                                                       |
|-------------------------------------|--------------------------------------------------------------------------------|
| - 401 Unauthorized                  | Ensure your API key is correct and starts with `Bearer`                        |
| - Claude does not execute tools     | Verify the AI Agent is connected to both Chat Model and MCP Tool nodes         |
| - Long delays or timeouts           | Increase timeout in n8n settings or test with reduced result pages             |

## 8. Support  

For assistance, open an issue or contact:  
📧 **dev.occirank@gmail.com**  


## 9. License  
MIT License.  

© 2025 **Occirank / IndexMeNow** 
