import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import axios from "axios";

const geminiUrl = process.env.GEMINI_API_URL!;

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { lastMessage, role } = await req.json();

    const prompt = `Vous êtes un assistant de chat IA qui aide les utilisateurs à répondre à leurs questions.

        Generate short and concise responses to the user's last message, which is: "${lastMessage}".
        The user's role is: "${role}".

        Please provide 3 relevant and helpful suggestions for the user based on their last message and role.
        Each suggestion should be clear and easy to understand.

        Rules:

         -Vous devez à répondre à 3 replique VS la question posée par l'utilisateur
         -Votre tâche est de fournir des réponses précises et utiles aux questions posées par les utilisateurs
         -Vous devez utiliser les informations fournies dans les messages précédents pour formuler votre réponse
         -Assurez-vous de répondre de manière claire et concise;
         -en utilisant un langage simple que les utilisateurs peuvent comprendre facilement
         -Si vous ne connaissez pas la réponse à une question, il est préférable de dire que vous ne savez pas plutôt que de fournir des informations incorrectes
         -Votre objectif est d'aider les utilisateurs à trouver les réponses dont ils ont besoin de manière efficace et agréable.

         output format:{
         "suggestions":[
          "Replique 1",
          "Replique 2",
          "Replique 3",
          
            ]
         ]}

         Input:
         ROLE:${role}
         RECENT_MESSAGE:${lastMessage}
         `;

    const geminiPayload = {
      contents: [{ parts: [{ text: prompt }] }],
    };

    let response;
    try {
      response = await axios.post(geminiUrl, geminiPayload);
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 503) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        response = await axios.post(geminiUrl, geminiPayload);
      } else {
        throw err;
      }
    }

    const rawText: string = response.data.candidates[0].content.parts[0].text;
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON found in Gemini response");
    const parsed = JSON.parse(match[0]);

    return NextResponse.json({ data: parsed.suggestions }, { status: 200 });
  } catch (error:unknown) {
    
    return NextResponse.json(
      { message: `Get AI suggestions error: ${error}` },
      { status: 500 },
    );
  }
}
