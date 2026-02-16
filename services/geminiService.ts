import { GoogleGenAI, Type } from "@google/genai";
import { Product, MenuStyle } from "../types";

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const getClient = () => {
    // Assumption: API Key is available in process.env.API_KEY
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const analyzeMenuImage = async (
  base64Data: string,
  mimeType: string
): Promise<{ products: Product[]; styleSuggestion: any }> => {
  const ai = getClient();
  const model = "gemini-2.5-flash"; 

  const prompt = `
  Act as a Senior UI/UX Designer & Computer Vision Expert.
  REVERSE ENGINEER this menu photo into a JSON structure compatible with our React rendering engine.

  ### 1. CRITICAL RULES FOR IMAGES (DECORATIONS)
  - **IGNORE BACKGROUNDS:** You are STRICTLY FORBIDDEN from selecting the full page background or large texture areas as a decoration image.
  - **IGNORE TEXT:** You are STRICTLY FORBIDDEN from creating bounding boxes around Title text, Category headers, or Prices. Text is Typography, NEVER a decoration image.
  - **TARGETS:** Only extract distinct visual assets: Food plates, Isolated Icons, Specific Illustrations, or Separator Lines.
  - **PRECISION:** Define bounding boxes [ymin, xmin, ymax, xmax] tightly around the object's visible pixels.

  ### 2. LAYOUT INTELLIGENCE
  - **Category Columns:** Look at the Category Headers. Are they arranged in a Grid/Multi-column layout?
    - 1 Column: Vertical list.
    - 2 Columns: Split left/right (Categories flow from top-left to bottom-left, then top-right to bottom-right).
    - 3 Columns: Grid layout.
    - **CRITICAL:** Count the number of columns of CATEGORIES, not products. Set \`style.layout.categoryColumnCount\` to 1, 2, or 3.
  - **Product Columns:** Within a category, are products side-by-side? Set \`style.layout.columnsProducts\`.

  ### 3. GEOMETRY & EXACT MARGINS (CRITICAL)
  You must act as a Ruler. Do not guess standard margins. Measure them relative to the image width (assumed 794px for A4).

  1. **Horizontal Margins (X-Axis Scan):**
     - **Left Margin:** Find the absolute left-most text element (Title, Category, or Product Name). What is its \`xmin\` percentage (0-100)? 
       -> Convert to pixels: \`paddingLeft = (xmin / 100) * 794\`.
     - **Right Margin:** Find the absolute right-most element (usually Price or Right Column Category). What is its \`xmax\` percentage?
       -> Calculate distance from right edge: \`paddingRight = ((100 - xmax) / 100) * 794\`.
     - **Result:** Return the average of these two as \`layout.contentPadding\`.

  2. **Vertical Margins (Y-Axis Scan):**
     - **Top Margin:** Find the bounding box of the Main Title. Its \`ymin\` is the Top Margin.
     - **Bottom Margin:** Find the visual footer text or last product. Its \`ymax\` defines the Bottom Margin.

  3. **Category Positioning:**
     - Identify exactly where the Category Headers start.
     - If \`layout.categoryColumnCount\` is 2, determine the X-split. Does Col 1 start at 10% and Col 2 start at 60%?
     - Use this to set precise \`spacing\` values.

  ### 4. DATA EXTRACTION
  - Extract exact text for Titles. Do not default to "Menu".
  - If a subtitle exists, extract it. If not, set exists: false.
  - **Font Sizes:** Calculate exact \`fontSize\` based on the 794px scale.
  - **Colors:** Act as a HEX Eyedropper. Pick the EXACT pixel color for Backgrounds and Texts.

  Return the JSON strictly matching the schema.
`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            products: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  category: { type: Type.STRING },
                },
                required: ["name", "price", "category"],
              },
            },
            styleSuggestion: {
              type: Type.OBJECT,
              properties: {
                globalColors: {
                    type: Type.OBJECT,
                    properties: {
                        background: { type: Type.STRING, description: "Exact Hex from pixel analysis" },
                        backgroundType: { type: Type.STRING, enum: ['solid', 'image/texture'] },
                        primary: { type: Type.STRING, description: "Exact Hex" },
                        secondary: { type: Type.STRING, description: "Exact Hex" },
                        text: { type: Type.STRING, description: "Exact Hex" },
                        borderColor: { type: Type.STRING }
                    }
                },
                layout: {
                    type: Type.OBJECT,
                    properties: {
                        contentPadding: { type: Type.NUMBER, description: "Calculated side margin in px relative to 794px width" },
                        globalRadius: { type: Type.NUMBER },
                        hasFrame: { type: Type.BOOLEAN },
                        categoryColumnCount: { type: Type.NUMBER, description: "1, 2, or 3 columns of categories" }
                    }
                },
                typography: {
                    type: Type.OBJECT,
                    properties: {
                        mainTitle: {
                            type: Type.OBJECT,
                            properties: {
                                text: { type: Type.STRING },
                                fontFamily: { type: Type.STRING, description: "Google Font Name" },
                                fontSize: { type: Type.NUMBER, description: "Pixel size relative to 794px width" },
                                color: { type: Type.STRING },
                                textTransform: { type: Type.STRING, enum: ['uppercase', 'lowercase', 'capitalize', 'none'] },
                                alignment: { type: Type.STRING, enum: ['left', 'center', 'right'] }
                            }
                        },
                        subtitle: {
                            type: Type.OBJECT,
                            properties: {
                                exists: { type: Type.BOOLEAN },
                                text: { type: Type.STRING },
                                fontFamily: { type: Type.STRING, description: "Google Font Name" },
                                fontSize: { type: Type.NUMBER },
                                color: { type: Type.STRING },
                                textTransform: { type: Type.STRING, enum: ['uppercase', 'lowercase', 'capitalize', 'none'] }
                            }
                        },
                        category: {
                             type: Type.OBJECT,
                             properties: {
                                fontFamily: { type: Type.STRING, description: "Google Font Name" },
                                fontSize: { type: Type.NUMBER },
                                color: { type: Type.STRING },
                                textTransform: { type: Type.STRING, enum: ['uppercase', 'lowercase', 'capitalize', 'none'] },
                                alignment: { type: Type.STRING, enum: ['left', 'center', 'right'] }
                             }
                        },
                        productName: {
                             type: Type.OBJECT,
                             properties: {
                                fontFamily: { type: Type.STRING, description: "Google Font Name" },
                                fontSize: { type: Type.NUMBER },
                                color: { type: Type.STRING },
                                fontWeight: { type: Type.STRING }
                             }
                        },
                        productDescription: {
                             type: Type.OBJECT,
                             properties: {
                                fontFamily: { type: Type.STRING, description: "Google Font Name" },
                                fontSize: { type: Type.NUMBER },
                                color: { type: Type.STRING },
                                fontStyle: { type: Type.STRING, enum: ['normal', 'italic'] }
                             }
                        },
                        productPrice: {
                             type: Type.OBJECT,
                             properties: {
                                fontFamily: { type: Type.STRING, description: "Google Font Name" },
                                fontSize: { type: Type.NUMBER },
                                color: { type: Type.STRING }
                             }
                        }
                    }
                },
                spacing: {
                    type: Type.OBJECT,
                    properties: {
                        titleToSubtitle: { type: Type.NUMBER },
                        categoryToFirstProduct: { type: Type.NUMBER },
                        betweenProducts: { type: Type.NUMBER }
                    }
                },
                decorations: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING, enum: ["image", "frame", "sticker"] },
                            description: { type: Type.STRING },
                            boundingBox: {
                                type: Type.OBJECT,
                                properties: {
                                    ymin: { type: Type.NUMBER, description: "Top % (0-100)" },
                                    xmin: { type: Type.NUMBER, description: "Left % (0-100)" },
                                    ymax: { type: Type.NUMBER, description: "Bottom % (0-100)" },
                                    xmax: { type: Type.NUMBER, description: "Right % (0-100)" }
                                },
                                required: ["ymin", "xmin", "ymax", "xmax"]
                            }
                        },
                        required: ["type", "boundingBox"]
                    }
                },
                freeTextElements: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            text: { type: Type.STRING },
                            fontSize: { type: Type.NUMBER },
                            color: { type: Type.STRING },
                            alignment: { type: Type.STRING },
                            fontFamily: { type: Type.STRING },
                            fontWeight: { type: Type.STRING },
                            textTransform: { type: Type.STRING }
                        }
                    }
                }
              }
            },
          },
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const data = JSON.parse(text);

    const mappedProducts: Product[] = data.products.map((p: any) => ({
      ...p,
      id: crypto.randomUUID(),
      image: '', 
      description: p.description || '',
    }));

    return {
      products: mappedProducts,
      styleSuggestion: data.styleSuggestion,
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};