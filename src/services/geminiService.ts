import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AnalysisResult {
  actionableItems: string[];
  externalWorries: string[];
}

export async function analyzeThoughts(thoughts: string): Promise<AnalysisResult> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: thoughts,
      config: {
        systemInstruction: `You are the "Student Success Studio Plus" mentor. Analyze the user's "mind dump" to identify paths to success.
        Categorize thoughts into two groups:
        1. "Actionable Items": Immediate tasks the user can control to build momentum ("Micro-Wins").
        2. "External Worries": Concerns that need a strategic pivot or long-term plan, rather than immediate worry.
        Return the result as a JSON object.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            actionableItems: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of things the user can take action on."
            },
            externalWorries: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of things outside the user's control."
            }
          },
          required: ["actionableItems", "externalWorries"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw error;
  }
}

export interface ZenithActionPlan {
  id: string;
  topic: string;
  category: 'Urgent' | 'Complex' | 'Creative';
  complexity: number; // 0 to 100
  decision: string;
  strategy: string;
  keyActions: string[];
  completedActions: boolean[]; // Added to track task state
  priorityMatrix: {
    urgent: boolean;
    important: boolean;
  };
  plusAdvice: string;
  roadblockWarning?: string;
  liveInsight: string;
  timestamp: number;
}

export interface CareerResumeTasks {
  fear: string;
  tasks: string[];
}

export async function solveChaos(stress: string): Promise<ZenithActionPlan> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: stress,
      config: {
        systemInstruction: `Role: You are the "Student Success Studio Plus" Sidebar Intelligence. You manage destinies, not just tasks.
 
        Core Pillars:
        1. Task Transformer: Extract hidden deadlines and priorities. Map them to a Priority Matrix (Urgent vs Important).
        2. Contextual Wisdom: Provide "The Advice of the Day" focused on current load.
        3. Roadblock Predictor: Anticipate what might go wrong (e.g., burnout, time conflicts).
        4. Dream Navigator: Remind the user of the "Big Picture" value of these tasks.

        Required Outputs:
        - Category: 'Urgent', 'Complex', or 'Creative'.
        - Complexity: 0-100.
        - Decision: An empowering 'Success Timeline' summary.
        - Strategy: Deep strategic 'Why'.
        - PriorityMatrix: { urgent: boolean, important: boolean }.
        - PlusAdvice: Ultra-concise, action-oriented tip.
        - RoadblockWarning: A short prediction of a potential obstacle.
        - KeyActions: Specific, bold 'Micro-Wins'. Use **bold** for key instructions.
        - LiveInsight: Empowering professional insight.

        Tone: Ultra-concise, glanceable, action-oriented, and visionary.

        Return as JSON.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, enum: ['Urgent', 'Complex', 'Creative'] },
            complexity: { type: Type.NUMBER },
            decision: { type: Type.STRING },
            strategy: { type: Type.STRING },
            priorityMatrix: {
              type: Type.OBJECT,
              properties: {
                urgent: { type: Type.BOOLEAN },
                important: { type: Type.BOOLEAN }
              },
              required: ["urgent", "important"]
            },
            plusAdvice: { type: Type.STRING },
            roadblockWarning: { type: Type.STRING },
            keyActions: { type: Type.ARRAY, items: { type: Type.STRING } },
            liveInsight: { type: Type.STRING }
          },
          required: ["category", "complexity", "decision", "strategy", "priorityMatrix", "plusAdvice", "keyActions", "liveInsight"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    const data = JSON.parse(text);
    return {
      id: Math.random().toString(36).substr(2, 9),
      topic: stress.slice(0, 50) + (stress.length > 50 ? '...' : ''),
      ...data,
      completedActions: new Array(data.keyActions.length).fill(false),
      timestamp: Date.now()
    };
  } catch (error) {
    console.error("Solve Chaos Error:", error);
    return {
      id: 'fallback-' + Date.now(),
      topic: stress,
      category: 'Complex',
      complexity: 65,
      decision: "Implement a deep work sprint to clear the backlog.",
      strategy: "Chosen to maximize output by eliminating fragmented efforts.",
      priorityMatrix: { urgent: true, important: true },
      plusAdvice: "Start now. Momentum is your best teacher.",
      roadblockWarning: "Watch out for mid-session fatigue.",
      keyActions: [
        "**Block 90 minutes** on your calendar for high-priority depth.",
        "**Silence all notifications** and digital distractions.",
        "**Start with the highest-leverage task** immediately."
      ],
      completedActions: [false, false, false],
      liveInsight: "Insight: Focus demand maximized through scheduled isolation.",
      timestamp: Date.now()
    };
  }
}

export async function generateResumeTasks(fear: string): Promise<CareerResumeTasks> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: fear,
      config: {
        systemInstruction: `You are the "Student Success Studio Plus" Career Navigator. Take a career fear and transform it into 5 tactical "Dream Foundation" tasks for an unstoppable resume.
        Return as JSON.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 5, maxItems: 5 }
          },
          required: ["tasks"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    return { fear, ...JSON.parse(text) };
  } catch (error) {
    console.error("Resume Tasks Error:", error);
    return {
      fear,
      tasks: [
        "Identify 3 core skills relevant to your target field.",
        "Complete one free online certification this week.",
        "Update your LinkedIn profile with a professional summary.",
        "Reach out to one person for an informational interview.",
        "Draft a project-based section for your resume."
      ]
    };
  }
}
