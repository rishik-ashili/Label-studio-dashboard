import { GoogleGenerativeAI } from '@google/generative-ai';
import * as chatFunctions from '../utils/chatFunctions.js';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Define function declarations for Gemini
const functionDeclarations = [
    {
        name: 'getProjectsList',
        description: 'Get a list of all projects with basic information including title, total images, annotated images, and progress percentage',
        parameters: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'getProjectDetails',
        description: 'Get detailed information about a specific project including annotations, class distribution, and last updated time',
        parameters: {
            type: 'object',
            properties: {
                projectId: { type: 'string', description: 'The ID of the project to get details for' }
            },
            required: ['projectId']
        }
    },
    {
        name: 'getOverallSummary',
        description: 'Get an overall summary of all annotation work including total projects, images, and progress',
        parameters: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'getTodayAnnotations',
        description: 'Get all annotations completed today across all projects',
        parameters: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'getTopPerformingProjects',
        description: 'Get the top N projects ranked by annotations or completion rate',
        parameters: {
            type: 'object',
            properties: {
                n: { type: 'number', description: 'Number of projects to return (default: 5)' },
                metric: { type: 'string', description: 'Metric to rank by: "annotations" or "completion" (default: "annotations")' }
            },
            required: []
        }
    },
    {
        name: 'getKaggleVsLabelStudio',
        description: 'Compare Kaggle pre-training dataset vs Label Studio annotations',
        parameters: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'getWeeklyGrowthByProject',
        description: 'Get projects ranked by annotation growth over the last N weeks',
        parameters: {
            type: 'object',
            properties: {
                weeks: { type: 'number', description: 'Number of weeks to look back (default: 1)' }
            },
            required: []
        }
    },
    {
        name: 'getRecentActivityProjects',
        description: 'Get projects with recent annotation activity in the last N days',
        parameters: {
            type: 'object',
            properties: {
                days: { type: 'number', description: 'Number of days to look back (default: 7)' }
            },
            required: []
        }
    },
    {
        name: 'getAnnotationVelocity',
        description: 'Get annotation rate per day and projected weekly/monthly growth',
        parameters: {
            type: 'object',
            properties: {
                days: { type: 'number', description: 'Number of days to calculate from (default: 7)' }
            },
            required: []
        }
    },
    {
        name: 'getProjectsNeedingAttention',
        description: 'Get projects below a progress threshold that need attention',
        parameters: {
            type: 'object',
            properties: {
                threshold: { type: 'number', description: 'Progress threshold percentage (default: 50)' }
            },
            required: []
        }
    },
    {
        name: 'searchProjectsByProgress',
        description: 'Find projects within a specific progress range',
        parameters: {
            type: 'object',
            properties: {
                minProgress: { type: 'number', description: 'Minimum progress percentage' },
                maxProgress: { type: 'number', description: 'Maximum progress percentage' }
            },
            required: ['minProgress', 'maxProgress']
        }
    },
    {
        name: 'getProjectsByClass',
        description: 'Find all projects containing a specific class/category - Use this for queries about specific conditions like "cavity", "caries", "pulp", etc.',
        parameters: {
            type: 'object',
            properties: {
                className: { type: 'string', description: 'The class name to search for (e.g., "cavity", "caries", "pulp", "bone", "filling")' }
            },
            required: ['className']
        }
    },
    {
        name: 'getClassDistributionSummary',
        description: 'Get summary of all classes across all projects with counts',
        parameters: { type: 'object', properties: {}, required: [] }
    }
];

// Function name to actual function mapping
const functionMap = {
    getProjectsList: chatFunctions.getProjectsList,
    getProjectDetails: chatFunctions.getProjectDetails,
    getOverallSummary: chatFunctions.getOverallSummary,
    getTodayAnnotations: chatFunctions.getTodayAnnotations,
    getTopPerformingProjects: chatFunctions.getTopPerformingProjects,
    getKaggleVsLabelStudio: chatFunctions.getKaggleVsLabelStudio,
    getWeeklyGrowthByProject: chatFunctions.getWeeklyGrowthByProject,
    getRecentActivityProjects: chatFunctions.getRecentActivityProjects,
    getAnnotationVelocity: chatFunctions.getAnnotationVelocity,
    getProjectsNeedingAttention: chatFunctions.getProjectsNeedingAttention,
    searchProjectsByProgress: chatFunctions.searchProjectsByProgress,
    getProjectsByClass: chatFunctions.getProjectsByClass,
    getClassDistributionSummary: chatFunctions.getClassDistributionSummary
};

/**
 * Process a chat message with Gemini using function calling
 */
export async function processMessage(userMessage, conversationHistory = []) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not configured');
    }

    const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',  // 1500 requests/day vs gemini-2.5-flash's 20 requests/day
        tools: [{ functionDeclarations }],
        systemInstruction: `You are a helpful AI assistant for analyzing Label Studio annotation data.

When answering questions:
- For class/category queries (cavity, caries, pulp, bone, etc.), use getProjectsByClass
- For "top performing" or "best" queries, use getTopPerformingProjects  
- For recent activity queries, use getWeeklyGrowthByProject or getRecentActivityProjects
- Always include project names/titles, not just IDs
- Use simple bullet points, avoid complex markdown tables
- Format numbers clearly (e.g., "1,234 images")

Available classes: cavity, caries, pulp, bone, filling, lesion, rootcanal`
    });

    // Build conversation history for Gemini
    const history = conversationHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
    }));

    console.log('[Gemini] Starting chat with history:', JSON.stringify(history).substring(0, 200) + '...');

    const chat = model.startChat({
        history,
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
        }
    });

    // Send user message
    let result = await chat.sendMessage(userMessage);
    const functionCalls = [];
    let finalResponse = '';

    // Function calling loop
    let maxIterations = 5;
    while (result.response.functionCalls() && maxIterations-- > 0) {
        const calls = result.response.functionCalls();

        // Execute all function calls
        const functionResponseParts = [];

        for (const call of calls) {
            const funcName = call.name;
            const funcArgs = call.args || {};

            functionCalls.push({ name: funcName, args: funcArgs });

            try {
                const func = functionMap[funcName];
                if (!func) {
                    functionResponseParts.push({
                        functionResponse: {
                            name: funcName,
                            response: { error: `Function ${funcName} not found` }
                        }
                    });
                    continue;
                }

                // Call the function with arguments
                let funcResult = await func(...Object.values(funcArgs));

                // Ensure result is a JSON object (Struct), not an Array or primitive
                if (Array.isArray(funcResult) || typeof funcResult !== 'object' || funcResult === null) {
                    funcResult = { result: funcResult };
                }

                console.log(`[Gemini] Function ${funcName} result:`, JSON.stringify(funcResult).substring(0, 100) + '...');

                functionResponseParts.push({
                    functionResponse: {
                        name: funcName,
                        response: funcResult
                    }
                });
            } catch (error) {
                functionResponseParts.push({
                    functionResponse: {
                        name: funcName,
                        response: { error: error.message }
                    }
                });
            }
        }

        // Send function results back to Gemini
        result = await chat.sendMessage(functionResponseParts);
    }

    // Get final text response
    finalResponse = result.response.text();

    return {
        response: finalResponse,
        functionCalls: functionCalls,
        conversationHistory: [
            ...conversationHistory,
            { role: 'user', content: userMessage },
            { role: 'model', content: finalResponse }
        ]
    };
}
