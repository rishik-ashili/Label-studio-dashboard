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
    }
];

// Function name to actual function mapping
const functionMap = {
    getProjectsList: chatFunctions.getProjectsList,
    getProjectDetails: chatFunctions.getProjectDetails,
    getOverallSummary: chatFunctions.getOverallSummary,
    getTodayAnnotations: chatFunctions.getTodayAnnotations,
    getTopPerformingProjects: chatFunctions.getTopPerformingProjects
};

/**
 * Process a chat message with Gemini using function calling
 */
export async function processMessage(userMessage, conversationHistory = []) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not configured');
    }

    const model = genAI.getGenerativeModel({
        model: 'gemini-flash-lite-latest',
        tools: [{ functionDeclarations }]
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
