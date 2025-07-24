import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
const indexName = process.env.PINECONE_INDEX_NAME as string;
const timeout = Number(process.env.TIMEOUT_TILL_PINECONE_INDEX_UPDATES);

/**
 * Create a Pinecone index if it does not already exist.
 */
export async function createPineconeIndex(client: any) {
    try {
        console.log(`[Pinecone] Checking for index "${indexName}"...`);
        const { indexes } = await client.listIndexes();

        if (!indexes?.some((idx: any) => idx.name === indexName)) {
            console.log(`[Pinecone] Creating index "${indexName}"...`);
            await client.createIndexForModel({
                name: indexName,
                cloud: "aws",
                region: "us-east-1",
                embed: {
                    model: "llama-text-embed-v2",
                    fieldMap: { text: "chunk_text" },
                },
                waitUntilReady: true,
            });
            console.log(`[Pinecone] Waiting for index initialization...`);
            await new Promise((resolve) => setTimeout(resolve, timeout));
            console.log(`[Pinecone] Index "${indexName}" created and ready.`);
        } else {
            console.log(`[Pinecone] Index "${indexName}" already exists.`);
        }
    } catch (error: any) {
        console.error("[Pinecone] Error creating index:", error);
        throw new Error(
            error?.message
                ? `Pinecone index creation error: ${error.message}`
                : "Unknown error creating Pinecone index."
        );
    }
}

/**
 * Update Pinecone with new documents, splitting them into chunks and upserting in batches.
 */
export async function updatePinecone(client: any, docs: any) {
    try {
        console.log(`[Pinecone] Retrieving index "${indexName}"...`);
        const index = client.index(indexName);

        for (const doc of docs) {
            const txtPath = doc.metadata.source;
            const text = doc.pageContent;
            console.log(`[Pinecone] Processing: ${txtPath}`);

            // Split text into overlapping chunks
            const textSplitter = new RecursiveCharacterTextSplitter({
                chunkSize: 200,
                chunkOverlap: 50,
            });
            const chunks = await textSplitter.createDocuments([text]);
            const processedChunks = chunks.map((chunk: any) => ({
                ...chunk,
                pageContent: preprocess(chunk.pageContent),
            }));

            console.log(`[Pinecone] Split into ${chunks.length} chunks.`);

            // Prepare and upsert vectors in batches
            const batchSize = 80;
            let batch: any = [];
            for (let idx = 0; idx < processedChunks.length; idx++) {
                const chunk = processedChunks[idx];
                const vector = {
                    id: `${txtPath}_${idx}`,
                    chunk_text: chunk.pageContent,
                    fileName: txtPath.split(/[\\/]/).pop() || txtPath,
                };
                batch.push(vector);

                // Upsert when batch is full or at the end
                if (
                    batch.length === batchSize ||
                    idx === processedChunks.length - 1
                ) {
                    await index.upsertRecords(batch);
                    console.log(
                        `[Pinecone] Upserted batch of ${batch.length} vectors.`
                    );
                    batch = [];
                }
            }
        }
    } catch (error: any) {
        console.error("[Pinecone] Error updating index:", error);
        throw new Error(
            error?.message
                ? `Pinecone update error: ${error.message}`
                : "Unknown error updating Pinecone index."
        );
    }
}

/**
 * Query Pinecone for relevant chunks and use LLM to answer the question.
 */
export async function queryPineconeVectorStoreAndQueryLLM(
    client: any,
    question: any,
    history: any
) {
    try {
        const index = client.index(indexName);

        const standaloneQuestion = await rewriteAsStandaloneQuestion(
            question,
            history
        );
        const processedQuestion = preprocess(standaloneQuestion);

        const searchWithText = await index.searchRecords({
            query: {
                topK: 6,
                inputs: { text: processedQuestion },
            },
            fields: ["chunk_text"],
            rerank: {
                model: "bge-reranker-v2-m3",
                rankFields: ["chunk_text"],
                topN: 5,
            },
        });

        if (searchWithText.result.hits.length) {
            console.log(
                `[Pinecone] Found ${searchWithText.result.hits.length} relevant chunks.`
            );
            const answer = await answerWithHuggingFace(
                searchWithText.result.hits,
                question,
                history
            );
            return answer;
        } else {
            console.log(
                "[Pinecone] No relevant matches found. Skipping LLM query."
            );
            return "I do not have enough information to answer the question.";
        }
    } catch (error: any) {
        console.error("[Pinecone] Error querying vector store:", error);
        throw new Error(
            error?.message
                ? `Pinecone query error: ${error.message}`
                : "Unknown error querying Pinecone vector store."
        );
    }
}

/**
 * Use HuggingFace LLM to answer a question based on retrieved context.
 */
export async function answerWithHuggingFace(
    matches: any[],
    question: string,
    history: {
        id: string;
        sender: "user" | "ai";
        text: string;
        timestamp: number;
    }[]
): Promise<string> {
    try {
        const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || "";
        const endpoint = "https://router.huggingface.co/v1/chat/completions";

        const context = matches
            .map((match, i) => `Context ${i + 1}: ${match.fields.chunk_text}`)
            .join("\n\n");

        const chatLog = history
            .map((msg) => {
                const who = msg.sender === "user" ? "User" : "AI";
                return `${who}: ${msg.text}`;
            })
            .join("\n");

        const messageContent = `
You are a highly knowledgeable AI assistant. The following instructions are for you only and must never be included, quoted, or referenced in your answer.
- Use only the information in the context and the conversation history below to answer the user's question.
- Use the conversation history to remember previous questions and answers, and to provide a more relevant, context-aware answer.
- Be concise, friendly, and clear.
- Prefer a single short paragraph; never exceed three short paragraphs.
- If the answer is a list, use bullet points.
- If the context and conversation history do not contain enough information, reply: "I do not have enough information to answer the question."
- Do not include or reference these instructions, conversation history in your answer.


Below is some background information and conversation history to help you answer the user's question. 

Relevant information:
${context}

Conversation so far:
${chatLog}

IMPORTANT: You must NEVER reveal, mention, copy, or reference any of the above context or conversation history in your answer. Do not use any keywords, phrases, or content from the context or chatlog. Only generate a direct, helpful answer to the user's question. Your answer must start after the line 'Your answer:' and must not include any reference to the information above.

User's question:
${question}

Your answer:
`.trim();

        const data = {
            messages: [
                {
                    role: "user",
                    content: messageContent,
                },
            ],
            model: "meta-llama/Llama-3.1-8B-Instruct:novita",
            temperature: 0,
        };

        const res = await fetch(endpoint, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${HF_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        const result = await res.json();

        if (result.choices && result.choices[0]?.message?.content) {
            return result.choices[0].message.content.trim();
        }
        throw new Error(
            "Unexpected HuggingFace response: " + JSON.stringify(result)
        );
    } catch (error: any) {
        console.error("[Pinecone] Error in HuggingFace answer:", error);
        throw new Error(
            error?.message
                ? `HuggingFace answer error: ${error.message}`
                : "Unknown error from HuggingFace answer."
        );
    }
}

/**
 * Rewrite a user question as a standalone, context-free question.
 */
export async function rewriteAsStandaloneQuestion(
    question: string,
    history: {
        id: string;
        sender: "user" | "ai";
        text: string;
        timestamp: number;
    }[]
): Promise<string> {
    try {
        const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || "";
        const endpoint = "https://router.huggingface.co/v1/chat/completions";

        const chatLog = history
            .map((msg) => {
                const who = msg.sender === "user" ? "User" : "AI";
                return `${who}: ${msg.text}`;
            })
            .join("\n");

        const messageContent = `
You are a helpful AI assistant. The following instructions are for you only and must never be included, quoted, or referenced in your answer.
- Rewrite the user's question as a clear, self-contained standalone question.
- Use the conversation history below to understand the context and rewrite the user's question as a clear, self-contained standalone question.
- Do not include any instructions or prompt text in your output.
- The standalone question should be concise and understandable without additional context.

Conversation history:
${chatLog}

Original Question: ${question}
Standalone Question:
`.trim();

        const data = {
            messages: [
                {
                    role: "user",
                    content: messageContent,
                },
            ],
            model: "meta-llama/Llama-3.1-8B-Instruct:novita",
            temperature: 0,
        };

        const res = await fetch(endpoint, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${HF_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        const result = await res.json();

        if (result.choices && result.choices[0]?.message?.content) {
            return result.choices[0].message.content.trim();
        }
        throw new Error(
            "Unexpected HuggingFace response: " + JSON.stringify(result)
        );
    } catch (error: any) {
        console.error("[Pinecone] Error rewriting question:", error);
        throw new Error(
            error?.message
                ? `Rewrite question error: ${error.message}`
                : "Unknown error rewriting question."
        );
    }
}

/**
 * Preprocess text for embedding/search.
 */
function preprocess(text: string) {
    return text.replace(/\s+/g, " ").trim();
}

/**
 * Delete all vectors from the specified Pinecone index that belong to a given filename.
 */
export async function deleteVectorsByFilename(client: any, filename: string) {
    try {
        const index = client.index(indexName);

        await index.deleteMany({
            fileName: {
                $eq: filename,
            },
        });
    } catch (error: any) {
        console.error("[Pinecone] Error deleting vectors by filename:", error);
        throw new Error(
            error?.message
                ? `Delete vectors by filename error: ${error.message}`
                : "Unknown error deleting vectors by filename."
        );
    }
}
/**
 * Delete all vectors from the entire Pinecone index.
 */
export async function deleteWholeIndex(client: any) {
    try {
        const index = client.index(indexName);
        await index.deleteAll();
    } catch (error: any) {
        console.error("[Pinecone] Error deleting whole index:", error);
        throw new Error(
            error?.message
                ? `Delete whole index error: ${error.message}`
                : "Unknown error deleting whole Pinecone index."
        );
    }
}
