/* eslint-disable */
export async function getTranslationSuggestions(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<string[]> {
    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`
      );
      
      const data = await response.json();
      
      if (data.responseStatus === 200) {
        return [
          data.responseData.translatedText,
          ...(data.matches || [])
            .filter((m: any) => m.translation !== data.responseData.translatedText)
            .map((m: any) => m.translation)
            .slice(0, 3)
        ].filter((t, i, a) => a.indexOf(t) === i);
      }
      return [];
    } catch (error) {
      console.error("Translation error:", error);
      return [];
    }
  }