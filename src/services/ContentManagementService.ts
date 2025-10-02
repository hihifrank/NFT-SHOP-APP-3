import fs from 'fs/promises';
import path from 'path';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '../config/i18n';

export interface ContentItem {
  id: string;
  namespace: string;
  key: string;
  translations: Record<SupportedLanguage, string>;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContentRequest {
  namespace: string;
  key: string;
  translations: Partial<Record<SupportedLanguage, string>>;
  description?: string;
}

export interface UpdateContentRequest {
  translations?: Partial<Record<SupportedLanguage, string>>;
  description?: string;
}

export class ContentManagementService {
  private static readonly LOCALES_DIR = path.join(__dirname, '../locales');

  /**
   * Get all content items for a namespace
   */
  static async getContentByNamespace(namespace: string): Promise<Record<string, ContentItem>> {
    const content: Record<string, ContentItem> = {};

    for (const language of Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[]) {
      try {
        const filePath = path.join(this.LOCALES_DIR, language, `${namespace}.json`);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const translations = JSON.parse(fileContent);

        this.flattenTranslations(translations, '', content, namespace, language);
      } catch (error) {
        console.warn(`Could not load translations for ${language}/${namespace}:`, error);
      }
    }

    return content;
  }

  /**
   * Create or update content item
   */
  static async upsertContent(
    namespace: string,
    key: string,
    request: CreateContentRequest | UpdateContentRequest
  ): Promise<ContentItem> {
    const existingContent = await this.getContentItem(namespace, key);
    
    const contentItem: ContentItem = {
      id: `${namespace}.${key}`,
      namespace,
      key,
      translations: existingContent?.translations || {} as Record<SupportedLanguage, string>,
      description: request.description || existingContent?.description,
      createdAt: existingContent?.createdAt || new Date(),
      updatedAt: new Date()
    };

    // Update translations
    if (request.translations) {
      for (const [lang, value] of Object.entries(request.translations)) {
        if (value !== undefined) {
          contentItem.translations[lang as SupportedLanguage] = value;
        }
      }
    }

    // Save to files
    await this.saveContentToFiles(contentItem);

    return contentItem;
  }

  /**
   * Get a specific content item
   */
  static async getContentItem(namespace: string, key: string): Promise<ContentItem | null> {
    const allContent = await this.getContentByNamespace(namespace);
    return allContent[key] || null;
  }

  /**
   * Delete content item
   */
  static async deleteContent(namespace: string, key: string): Promise<boolean> {
    try {
      for (const language of Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[]) {
        const filePath = path.join(this.LOCALES_DIR, language, `${namespace}.json`);
        
        try {
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const translations = JSON.parse(fileContent);
          
          // Remove the key from translations
          this.deleteNestedKey(translations, key);
          
          // Save updated file
          await fs.writeFile(filePath, JSON.stringify(translations, null, 2), 'utf-8');
        } catch (error) {
          console.warn(`Could not update ${language}/${namespace}.json:`, error);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting content:', error);
      return false;
    }
  }

  /**
   * Get all namespaces
   */
  static async getNamespaces(): Promise<string[]> {
    try {
      const defaultLangDir = path.join(this.LOCALES_DIR, 'zh-HK');
      const files = await fs.readdir(defaultLangDir);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
    } catch (error) {
      console.error('Error getting namespaces:', error);
      return [];
    }
  }

  /**
   * Create a new namespace
   */
  static async createNamespace(namespace: string): Promise<boolean> {
    try {
      for (const language of Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[]) {
        const filePath = path.join(this.LOCALES_DIR, language, `${namespace}.json`);
        
        // Check if file already exists
        try {
          await fs.access(filePath);
          continue; // File exists, skip
        } catch {
          // File doesn't exist, create it
          await fs.writeFile(filePath, '{}', 'utf-8');
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error creating namespace:', error);
      return false;
    }
  }

  /**
   * Export all translations for a language
   */
  static async exportLanguage(language: SupportedLanguage): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    
    try {
      const langDir = path.join(this.LOCALES_DIR, language);
      const files = await fs.readdir(langDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const namespace = file.replace('.json', '');
          const filePath = path.join(langDir, file);
          const content = await fs.readFile(filePath, 'utf-8');
          result[namespace] = JSON.parse(content);
        }
      }
    } catch (error) {
      console.error(`Error exporting language ${language}:`, error);
    }
    
    return result;
  }

  /**
   * Import translations for a language
   */
  static async importLanguage(
    language: SupportedLanguage, 
    translations: Record<string, any>
  ): Promise<boolean> {
    try {
      for (const [namespace, content] of Object.entries(translations)) {
        const filePath = path.join(this.LOCALES_DIR, language, `${namespace}.json`);
        await fs.writeFile(filePath, JSON.stringify(content, null, 2), 'utf-8');
      }
      
      return true;
    } catch (error) {
      console.error(`Error importing language ${language}:`, error);
      return false;
    }
  }

  /**
   * Helper method to flatten nested translations
   */
  private static flattenTranslations(
    obj: any,
    prefix: string,
    result: Record<string, ContentItem>,
    namespace: string,
    language: SupportedLanguage
  ): void {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'string') {
        if (!result[fullKey]) {
          result[fullKey] = {
            id: `${namespace}.${fullKey}`,
            namespace,
            key: fullKey,
            translations: {} as Record<SupportedLanguage, string>,
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }
        result[fullKey].translations[language] = value;
      } else if (typeof value === 'object' && value !== null) {
        this.flattenTranslations(value, fullKey, result, namespace, language);
      }
    }
  }

  /**
   * Helper method to save content item to translation files
   */
  private static async saveContentToFiles(contentItem: ContentItem): Promise<void> {
    for (const [language, translation] of Object.entries(contentItem.translations)) {
      if (!translation) continue;
      
      const filePath = path.join(this.LOCALES_DIR, language, `${contentItem.namespace}.json`);
      
      try {
        // Read existing file
        let existingContent = {};
        try {
          const fileContent = await fs.readFile(filePath, 'utf-8');
          existingContent = JSON.parse(fileContent);
        } catch {
          // File doesn't exist or is invalid, start with empty object
        }

        // Set nested key
        this.setNestedKey(existingContent, contentItem.key, translation);

        // Write back to file
        await fs.writeFile(filePath, JSON.stringify(existingContent, null, 2), 'utf-8');
      } catch (error) {
        console.error(`Error saving to ${filePath}:`, error);
      }
    }
  }

  /**
   * Helper method to set nested key in object
   */
  private static setNestedKey(obj: any, key: string, value: string): void {
    const keys = key.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current) || typeof current[keys[i]] !== 'object') {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  /**
   * Helper method to delete nested key from object
   */
  private static deleteNestedKey(obj: any, key: string): void {
    const keys = key.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current) || typeof current[keys[i]] !== 'object') {
        return; // Key doesn't exist
      }
      current = current[keys[i]];
    }
    
    delete current[keys[keys.length - 1]];
  }
}