import axios from 'axios';
import dotenv from 'dotenv';
import https from 'https';
import crypto from 'crypto';

dotenv.config();

/**
 * Label Studio API Client
 * Handles all API calls to Label Studio
 */
class LabelStudioService {
    constructor() {
        this.baseURL = process.env.LABEL_STUDIO_URL?.replace(/\/$/, '') || '';
        this.apiKey = process.env.LABEL_STUDIO_API_KEY || '';
        this.headers = {
            'Authorization': `Token ${this.apiKey}`,
            'Content-Type': 'application/json'
        };

        // Create HTTPS agent with legacy provider enabled to fix EPROTO error
        this.httpsAgent = new https.Agent({
            secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
            rejectUnauthorized: false
        });
    }

    /**
     * Get all projects from Label Studio
     * Matches Python: get_all_projects() logic with added pagination support
     */
    async getAllProjects() {
        console.log('--- Fetching Projects List ---');
        const allProjects = [];
        let page = 1;
        const pageSize = 50;

        while (true) {
            try {
                const url = `${this.baseURL}/api/projects`;
                const params = { page, page_size: pageSize };

                console.log(`[Projects] Fetching page ${page}...`);

                const response = await axios.get(url, {
                    headers: this.headers,
                    params,
                    timeout: 30000,
                    httpsAgent: this.httpsAgent
                });

                let projects = [];
                let shouldStop = false;

                // Scenario 1: { results: [...] } (Standard API)
                if (response.data && typeof response.data === 'object' && 'results' in response.data) {
                    projects = response.data.results;
                    // Python Logic: if isinstance(data, dict) and not data.get('next'): break
                    if (!response.data.next) {
                        shouldStop = true;
                    }
                }
                // Scenario 2: Array Response [...]
                else if (Array.isArray(response.data)) {
                    projects = response.data;
                    // Python Logic: If it's a list, it continues (implicit loop)
                    // But we must stop if we received 0 items, otherwise infinite loop
                    if (projects.length === 0) {
                        shouldStop = true;
                    }
                }
                // Scenario 3: Single Object
                else if (response.data) {
                    projects = [response.data];
                    shouldStop = true;
                }

                if (!projects || projects.length === 0) {
                    console.log(`[Projects] Page ${page} returned empty. Stopping.`);
                    break;
                }

                console.log(`[Projects] Page ${page}: Found ${projects.length} projects`);
                allProjects.push(...projects);

                if (shouldStop) {
                    break;
                }

                page++;
            } catch (error) {
                // Handle 404 (End of pagination for some LS versions)
                if (page > 1 && error.response && error.response.status === 404) {
                    console.log(`[Projects] Page ${page} is 404 (End of list).`);
                    break;
                }
                console.error('Error fetching projects:', error.message);
                throw new Error(`Failed to fetch projects: ${error.message}`);
            }
        }
        console.log(`--- Total Projects Found: ${allProjects.length} ---`);
        return allProjects;
    }

    /**
     * Get all tasks for a specific project with pagination
     * Matches Python: get_project_tasks() exact logic
     */
    async getProjectTasks(projectId) {
        const allTasks = [];
        let page = 1;
        const pageSize = 100;

        while (true) {
            try {
                const url = `${this.baseURL}/api/projects/${projectId}/tasks`;
                const params = { page, page_size: pageSize };

                // Live Logging
                if (page % 5 === 0 || page === 1) {
                    console.log(`[Project ${projectId}] Fetching tasks page ${page}...`);
                }

                const response = await axios.get(url, {
                    headers: this.headers,
                    params,
                    timeout: 30000,
                    httpsAgent: this.httpsAgent
                });

                let tasks = [];
                let shouldStop = false;

                // Python Logic Implementation
                // if isinstance(data, dict) and 'results' in data: tasks = data['results']
                if (response.data && typeof response.data === 'object' && 'results' in response.data) {
                    tasks = response.data.results;
                    // if isinstance(data, dict) and not data.get('next'): break
                    if (!response.data.next) {
                        shouldStop = true;
                    }
                }
                // else: tasks = data (Array)
                else if (Array.isArray(response.data)) {
                    tasks = response.data;
                    // If Array, Python continues looping. 
                    // We only stop if the array is empty to prevent infinite loops on empty pages.
                    if (tasks.length === 0) {
                        shouldStop = true;
                    }
                }
                else {
                    // Fallback for weird responses
                    tasks = response.data ? [response.data] : [];
                    shouldStop = true;
                }

                // if not tasks: break
                if (!tasks || tasks.length === 0) {
                    break;
                }

                allTasks.push(...tasks);

                if (shouldStop) {
                    break;
                }

                page++;
            } catch (error) {
                if (page > 1 && error.response && error.response.status === 404) {
                    break; // End of pagination
                }
                console.error(`Error fetching tasks for project ${projectId} on page ${page}:`, error.message);
                throw error;
            }
        }

        console.log(`[Project ${projectId}] Completed. Total Tasks: ${allTasks.length}`);
        return allTasks;
    }
}

// Export singleton instance
const labelStudioService = new LabelStudioService();
export default labelStudioService;