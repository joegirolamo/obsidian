/**
 * PDF Utilities
 * Functions for processing PDF files
 */

/**
 * Extract text from a PDF file
 * Uses pdf-parse library to extract text with structure preservation
 */
export async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  try {
    // Make sure we actually have a buffer
    if (!pdfBuffer || pdfBuffer.length === 0) {
      console.error('[ERROR] Empty PDF buffer provided to extractTextFromPdf');
      throw new Error('Empty PDF buffer provided');
    }

    console.log('[INFO] Processing PDF buffer of size:', pdfBuffer.length);
    
    // Try to use pdf-parse for proper text extraction
    try {
      console.log('[INFO] Attempting to use pdf-parse library');
      const pdfParse = await import('pdf-parse');
      
      // Apply PDF-parse options for better extraction
      const options = {
        // Prevent pdf.js from logging too much
        pagerender: function(pageData: any) {
          return pageData.getTextContent()
            .then(function(textContent: any) {
              let lastY, text = '';
              for (let item of textContent.items) {
                if (lastY == item.transform[5] || !lastY) {
                  text += item.str;
                } else {
                  text += '\n' + item.str;
                }
                lastY = item.transform[5];
              }
              return text;
            });
        }
      };
      
      const result = await pdfParse.default(pdfBuffer, options);
      
      console.log('[INFO] PDF parse successful');
      console.log('[INFO] PDF pages:', result.numpages);
      console.log('[INFO] PDF text length:', result.text.length);
      
      if (result.text.length < 100) {
        console.warn('[WARN] Extracted PDF text is very short, might indicate extraction issues');
      }
      
      // Process the extracted text to improve structure preservation
      const processedText = postProcessPdfText(result.text);
      console.log('[INFO] Successfully processed PDF text, final length:', processedText.length);
      
      // Return empty string if processed text is too short
      if (processedText.length < 50) {
        console.warn('[WARN] Processed PDF text is too short, falling back to empty string');
        return '';
      }
      
      return processedText;
    } catch (e) {
      // Log detailed error
      console.error('[ERROR] pdf-parse failed:', e);
      
      // If pdf-parse is not available or fails, try the buffer as a string directly
      console.warn('[WARN] pdf-parse package failed, attempting manual extraction');
      try {
        // Try to extract text directly from buffer
        const text = pdfBuffer.toString('utf8');
        
        // If we get readable text, use it
        if (text.length > 100 && /[a-zA-Z]{5,}/.test(text)) {
          console.log('[INFO] Manual extraction found usable text:', text.substring(0, 100) + '...');
          return postProcessPdfText(text);
        }
      } catch (stringError) {
        console.error('[ERROR] Manual extraction failed:', stringError);
      }
      
      // If everything fails, return an empty string so the caller can handle it
      console.error('[ERROR] All PDF extraction methods failed');
      return '';
    }
  } catch (error) {
    console.error('[ERROR] Unhandled error in extractTextFromPdf:', error);
    return '';
  }
}

/**
 * Post-process PDF text to improve structure preservation
 * This helps the AI better understand the document structure
 */
function postProcessPdfText(text: string): string {
  // Split text into lines
  const lines = text.split('\n');
  
  // Identify potential headers by looking for short lines with specific formatting
  const processedLines = lines.map(line => {
    const trimmedLine = line.trim();
    
    // Headers are typically short, often all caps or followed by numbers
    const isLikelyHeader = (
      (trimmedLine.length > 0 && trimmedLine.length < 60 && 
       /^[A-Z0-9\s.,:#-]+$/.test(trimmedLine) && 
       !trimmedLine.includes('  ')) || 
      /^\d+\.\s+[A-Z]/.test(trimmedLine)
    );
    
    if (isLikelyHeader) {
      // Add markup to help AI identify headers
      return `\n## ${trimmedLine} ##\n`;
    }
    
    // Identify potential bullet points and list items
    if (/^\s*[•\-\*\u2022\u2023\u25E6\u2043\u2219]\s+/.test(trimmedLine) || 
        /^\s*(\d+[\.\)]\s+)/.test(trimmedLine)) {
      return `\n* ${trimmedLine.replace(/^\s*[•\-\*\u2022\u2023\u25E6\u2043\u2219]\s+/, '').replace(/^\s*(\d+[\.\)]\s+)/, '')}\n`;
    }
    
    // Remove excessive whitespace but preserve paragraph breaks
    if (trimmedLine.length === 0) {
      return '\n';
    }
    
    return trimmedLine;
  });
  
  // Join the processed lines back together
  let processedText = processedLines.join(' ');
  
  // Remove redundant whitespace
  processedText = processedText.replace(/\s{3,}/g, '\n\n');
  processedText = processedText.replace(/\n{3,}/g, '\n\n');
  
  return processedText;
} 