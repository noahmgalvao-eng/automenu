import { removeBackground, Config } from "@imgly/background-removal";

export interface BoundingBox {
    ymin: number; // 0-100
    xmin: number; // 0-100
    ymax: number; // 0-100
    xmax: number; // 0-100
}

/**
 * Helper to convert Blob to Base64 string for persistence
 */
async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Crops a specific region from a File based on percentage coordinates.
 * Returns a Base64 string.
 */
export async function cropImage(imageFile: File, box: BoundingBox): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(imageFile);
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const width = img.naturalWidth;
            const height = img.naturalHeight;

            // Calculate pixel dimensions from percentages (0-100)
            const cropX = (box.xmin / 100) * width;
            const cropY = (box.ymin / 100) * height;
            
            // Ensure width/height are positive
            const cropW = Math.max(1, ((box.xmax - box.xmin) / 100) * width);
            const cropH = Math.max(1, ((box.ymax - box.ymin) / 100) * height);

            canvas.width = cropW;
            canvas.height = cropH;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Source Image -> Destination Canvas
                ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
                
                canvas.toBlob(async (blob) => {
                    if (blob) {
                        try {
                            const base64 = await blobToBase64(blob);
                            resolve(base64);
                        } catch (e) {
                            reject(e);
                        }
                    } else {
                        reject(new Error("Canvas to Blob failed"));
                    }
                    // Clean up the original object URL to avoid leaks
                    URL.revokeObjectURL(objectUrl);
                }, 'image/png');
            } else {
                reject(new Error("Could not get canvas context"));
            }
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Failed to load image for cropping"));
        };

        img.src = objectUrl;
    });
}

export async function processDecoration(imageFile: File, box: BoundingBox): Promise<string> {
    
    // URL ABSOLUTA DO UNPKG
    // Aponta direto para a pasta 'dist' onde estão 'manifest.json' e 'isnet.wasm'
    const publicPath = '[https://unpkg.com/@imgly/background-removal-data@1.5.5/dist/](https://unpkg.com/@imgly/background-removal-data@1.5.5/dist/)';

    const config: Config = {
        publicPath: publicPath, 
        debug: true,
        model: 'isnet', // Obrigatório para versão 1.5.5
        device: 'cpu',  // Mais seguro para compatibilidade
        progress: (key, current, total) => console.log(`Downloading AI Model (${key}): ${Math.round(current/total * 100)}%`)
    };

    try {
        console.log(`Iniciando BG Removal via UNPKG: ${publicPath}`);
        
        // 1. Otimização: Cortar a imagem antes de enviar para a IA
        const croppedBase64 = await cropImage(imageFile, box);
        const response = await fetch(croppedBase64);
        const croppedBlob = await response.blob();
        
        // 2. Remover Fundo
        // A biblioteca vai baixar os assets (wasm/onnx) automaticamente do UNPKG
        const transparentBlob = await removeBackground(croppedBlob, config);
        
        // 3. Retornar
        return await blobToBase64(transparentBlob);
        
    } catch (error) {
        console.warn("CDN Background Removal failed:", error);
        // Fallback: Se o CDN falhar ou bloquear, retorna o recorte quadrado
        return cropImage(imageFile, box);
    }
}