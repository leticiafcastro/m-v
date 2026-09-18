import express, { Request, Response } from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Safe __dirname and __filename resolution in both CommonJS (dist/server.cjs) and ESM (tsx dev)
const currentDir = typeof __dirname !== "undefined" ? __dirname : process.cwd();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy Gemini client initialization
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Generate quiz endpoint using Gemini 3.8 Flash
app.post("/api/generate-quiz", async (req: Request, res: Response) => {
  try {
    const { topic, gradeLevel, questionCount = 5, notes = "", difficulty = "médio" } = req.body;

    if (!topic && !notes) {
      return res.status(400).json({ error: "Informe o tema da aula ou notas do conteúdo." });
    }

    const ai = getGeminiClient();

    const count = Math.min(Math.max(Number(questionCount) || 5, 3), 15);

    const prompt = `Você é um professor experiente e especialista em gamificação e metodologias ativas pedagógicas (estilo Kahoot).
Crie um quiz interativo e engajante para os alunos responderem em grupos ao final da aula.

Detalhes da aula:
- Tema/Assunto: ${topic || "Conteúdo da aula"}
- Público-alvo / Nível de ensino: ${gradeLevel || "Ensino Geral"}
- Nível de Dificuldade: ${difficulty}
- Quantidade exata de perguntas: ${count}
${notes ? `- Resumo/Anotações da aula pelo professor: ${notes}` : ""}

Diretrizes pedagógicas essenciais:
1. Cada pergunta deve ter EXATAMENTE 4 opções de resposta alternativas (nem mais, nem menos).
2. As alternativas incorretas (distratores) devem ser plausíveis, evitando pegadinhas injustas ou alternativas bobas.
3. Forneça uma explicação didática clara e instrutiva para cada questão (por que aquela é a correta e o que os alunos aprendem).
4. O tom deve ser dinâmico, desafiador e educativo, ideal para debate rápido em equipes.
5. O tempo sugerido por questão deve ser de 20 a 30 segundos.
6. A resposta deve ser em Português do Brasil com excelente redação.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction: "Você é um gerador educacional de quizzes estilo Kahoot para dinâmicas de sala de aula em grupo.",
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "Título atrativo e claro para o quiz da aula.",
            },
            topic: {
              type: Type.STRING,
              description: "Tema principal coberto.",
            },
            description: {
              type: Type.STRING,
              description: "Breve descrição instrucional para os alunos antes de começar.",
            },
            questions: {
              type: Type.ARRAY,
              description: "Lista de perguntas do quiz.",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING, description: "O enunciado da pergunta." },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Quatro opções de resposta (A, B, C, D).",
                  },
                  correctIndex: {
                    type: Type.INTEGER,
                    description: "Índice da alternativa correta (0, 1, 2 ou 3).",
                  },
                  timeLimit: {
                    type: Type.INTEGER,
                    description: "Tempo limite em segundos (normalmente 20 ou 30).",
                  },
                  points: {
                    type: Type.INTEGER,
                    description: "Pontuação base da questão (ex: 1000).",
                  },
                  explanation: {
                    type: Type.STRING,
                    description: "Explicação pedagógica e feedback para exibição após o tempo esgotar.",
                  },
                },
                required: ["id", "question", "options", "correctIndex", "timeLimit", "points", "explanation"],
              },
            },
          },
          required: ["title", "topic", "description", "questions"],
        },
      },
    });

    const jsonText = response.text?.trim() || "";
    const parsedData = JSON.parse(jsonText);

    // Ensure IDs are unique
    if (Array.isArray(parsedData.questions)) {
      parsedData.questions = parsedData.questions.map((q: any, index: number) => ({
        ...q,
        id: q.id || `q-${index + 1}-${Date.now()}`,
        timeLimit: q.timeLimit || 25,
        points: q.points || 1000,
      }));
    }

    res.json({ quiz: parsedData });
  } catch (error: any) {
    console.error("Error generating quiz:", error);
    res.status(500).json({
      error: error?.message || "Falha ao gerar o quiz com inteligência artificial.",
    });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
