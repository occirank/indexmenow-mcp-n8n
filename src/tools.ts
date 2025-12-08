// tools.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import axios from "axios";
import { getApiKey } from "./sessionStore.js";

const BASE_URL = "https://tool.indexmenow.com/api/v1";

// Helper function to make API calls to IndexMeNow  
async function makeApiRequest(endpoint: string, params: Record<string, any> = {}, method: "GET" | "POST", apiKey: string): Promise<any> {
  if (!apiKey) {
    throw new Error("API_KEY is not set");
  }

  const url = `${BASE_URL}${endpoint}`;

  try {
    let response;
    
    // GET method
    if (method.toUpperCase() === "GET") {
      response = await axios.get(url, {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        params,
      });
    } 
    // POST method
    else if (method.toUpperCase() === "POST") {
      response = await axios.post(url, params, {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
      });
    } else {
      throw new Error(`Unsupported HTTP method: ${method}`);
    }

    return response.data;

  } catch (error) {
    console.error("Error making IndexMeNow api requests:", error);
    throw error;
  }
}


async function getApiKeyFromContext(context: any): Promise<string | null> {
  const sessionId = context?.sessionId;
  if (!sessionId) return null;
  return await getApiKey(sessionId);
}

// Tools params
const checkProjectNameExistsToolParams = z.object({
  project_name: z.string().describe("Project name."),
});

const addNewProjectToolParams = z.object({
  project_name: z.string().describe("The name of the project. It must be unique."),
  urls: z.array(z.string()).describe("An array of keywords to be processed within the project."),
});

const addNewUrlsToExistingProjectToolParams = z.object({
  project_id: z.number().int().describe("The unique identifier of the project."),
  urls: z.array(z.string()).describe("An array of urls."),
});

const getProjectUrlsStatusToolParams = z.object({
  project_id: z.number().int().describe("The unique identifier of the project."),
  urls: z.array(z.string()).describe("An array of urls.").optional(),
});



// Configuration function that adds all tools to IndexMeNow server
export function configureServer(server: McpServer) {

  // Tool to get user credits count available
  server.tool(
    "get_credits_count",
    "This tool allows you to retrieve the number of credits available in your account.",
    async (extra: any) => {
      const apiKey = await getApiKeyFromContext(extra);
      if (!apiKey) {
        return {
          isError: true,
          content: [{ type: "text", text: "IndexMeNow API key not found" }],
        };
      }
      try {
        const data = await makeApiRequest("/user/credits", {}, "GET", apiKey);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    });

  // Tool to list all the projects of the current user and provide theirs ids and global metrics
  server.tool(
    "get_all_projects",
    "This tool allows you to retrieve a list of all the projects created by the user.",
    async (extra: any) => {
      const apiKey = await getApiKeyFromContext(extra);
      if (!apiKey) {
        return {
          isError: true,
          content: [{ type: "text", text: "IndexMeNow API key not found" }],
        };
      }
      try {
        const data = await makeApiRequest("/project/list", {}, "GET", apiKey);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    });

  // Tool to check if the current user has project with specific name
  server.tool(
    "check_project_name_exists",
    "This tool checks if a project with the given name exists for the current user, and returns its ID if found.",
    checkProjectNameExistsToolParams.shape,
    async (params: z.infer<typeof checkProjectNameExistsToolParams>, extra: any) => {
      const apiKey = await getApiKeyFromContext(extra);
      if (!apiKey) {
        return {
          isError: true,
          content: [{ type: "text", text: "IndexMeNow API key not found" }],
        };
      }
      try {
        const data = await makeApiRequest("/project/exists", params, "POST", apiKey);
  
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    });

  // Tool to add a new project to IndexMeNow.com with urls
  server.tool(
    "add_new_project",
    "This tool allows you to add a new project to IndexMeNow.com with urls.",
    addNewProjectToolParams.shape,
    async (params: z.infer<typeof addNewProjectToolParams>, extra: any) => {
      const apiKey = await getApiKeyFromContext(extra);
      if (!apiKey) {
        return {
          isError: true,
          content: [{ type: "text", text: "IndexMeNow API key not found" }],
        };
      }
      try {
        const data = await makeApiRequest("/project/add", params, "POST", apiKey);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    });

  // Tool to add new urls to existing project or index again completed urls
  server.tool(
    "add_new_urls_to_existing_project",
    "This tool allows you to retrieve the status of keywords within a specific project.",
    addNewUrlsToExistingProjectToolParams.shape,
    async (params: z.infer<typeof addNewUrlsToExistingProjectToolParams>, extra: any) => {
      const apiKey = await getApiKeyFromContext(extra);
      if (!apiKey) {
        return {
          isError: true,
          content: [{ type: "text", text: "IndexMeNow API key not found" }],
        };
      }
      try {
        const { project_id, urls} = params;
        const endpoint = `/project/${project_id}/addurls`;

        const data = await makeApiRequest(endpoint, { urls: urls }, "POST", apiKey);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    });

  // Tool to get project urls status
  server.tool(
    "get_project_urls_status",
    "This tool allows you to get project urls status.",
    getProjectUrlsStatusToolParams.shape,
    async (params: z.infer<typeof getProjectUrlsStatusToolParams>, extra: any) => {
      const apiKey = await getApiKeyFromContext(extra);
      if (!apiKey) {
        return {
          isError: true,
          content: [{ type: "text", text: "IndexMeNow API key not found" }],
        };
      }
      try {
        const { project_id, urls } = params;
        const endpoint = `/project/${project_id}`;

        const data = await makeApiRequest(endpoint, { urls: urls}, "POST", apiKey);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    });
}