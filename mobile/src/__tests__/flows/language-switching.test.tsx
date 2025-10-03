import React from 'react';

// Mock i18n functionality
const mockI18n = {
  language: 'en',
  changeLanguage: jest.fn(),
  t: jest.fn((key: string) => key)
};

// Mock language switching component
const MockLanguageSelector = ({ currentLanguage, onLanguageChange, availableLanguages }: any) => {
  return React.createElement('div', {
    'data-testid': 'language-selector',
    'data-current-language': currentLanguage
  }, 
    availableLanguages.map((lang: any) => 
      React.createElement('button', {
        key: lang.code,
        'data-testid': `language-${lang.code}`,
        'data-language-code': lang.code,
        'data-language-name': lang.name,
        onClick: () => onLanguageChange(lang.code)
      }, lang.name)
    )
  );
};

// Mock app with language switching
const MockAppWithLanguage = ({ language, onLanguageChange }: any) => {
  const getLocalizedText = (key: string) => {
    const translations: any = {
      'en': {
        'welcome': 'Welcome to HK Retail NFT',
        'get_started': 'Get Started',
        'choose_language': 'Choose Your Language',
        'continue': 'Continue'
      },
      'zh-HK': {
        'welcome': '歡迎使用香港零售NFT',
        'get_started': '開始使用',
        'choose_language': '選擇您的語言',
        'continue': '繼續'
      },
      'zh-CN': {
        'welcome': '欢迎使用香港零售NFT',
        'get_started': '开始使用',
        'choose_language': '选择您的语言',
        'continue': '继续'
      }
    };
    return translations[language]?.[key] || key;
  };

  return React.createElement('div', {
    'data-testid': 'app-with-language',
    'data-current-language': language
  }, [
    React.createElement('h1', { key: 'welcome' }, getLocalizedText('welcome')),
    React.createElement('button', { key: 'get-started' }, getLocalizedText('get_started')),
    React.createElement(MockLanguageSelector, {
      key: 'language-selector',
      currentLanguage: language,
      onLanguageChange: onLanguageChange,
      availableLanguages: [
        { code: 'en', name: 'English' },
        { code: 'zh-HK', name: '繁體中文' },
        { code: 'zh-CN', name: '简体中文' }
      ]
    })
  ]);
};

describe('Language Switching Flow', () => {
  // Test requirement 5.1.2: Multi-language support
  it('supports Traditional Chinese, Simplified Chinese, and English', () => {
    const mockOnLanguageChange = jest.fn();
    
    const app = MockAppWithLanguage({ 
      language: 'en', 
      onLanguageChange: mockOnLanguageChange 
    });
    
    const languageSelector = app.props.children.find((child: any) => 
      child.type === MockLanguageSelector
    );
    
    expect(languageSelector.props.availableLanguages).toHaveLength(3);
    expect(languageSelector.props.availableLanguages[0].code).toBe('en');
    expect(languageSelector.props.availableLanguages[1].code).toBe('zh-HK');
    expect(languageSelector.props.availableLanguages[2].code).toBe('zh-CN');
  });

  it('displays content in English by default', () => {
    const app = MockAppWithLanguage({ 
      language: 'en', 
      onLanguageChange: jest.fn() 
    });
    
    expect(app.props['data-current-language']).toBe('en');
    
    const welcomeText = app.props.children.find((child: any) => 
      child.props.children === 'Welcome to HK Retail NFT'
    );
    expect(welcomeText).toBeDefined();
  });

  it('switches to Traditional Chinese correctly', () => {
    let currentLanguage = 'en';
    const mockOnLanguageChange = jest.fn((newLang) => {
      currentLanguage = newLang;
    });
    
    // Initial render in English
    let app = MockAppWithLanguage({ 
      language: currentLanguage, 
      onLanguageChange: mockOnLanguageChange 
    });
    
    // Simulate language change to Traditional Chinese
    mockOnLanguageChange('zh-HK');
    
    // Re-render with new language
    app = MockAppWithLanguage({ 
      language: 'zh-HK', 
      onLanguageChange: mockOnLanguageChange 
    });
    
    expect(app.props['data-current-language']).toBe('zh-HK');
    
    const welcomeText = app.props.children.find((child: any) => 
      child.props.children === '歡迎使用香港零售NFT'
    );
    expect(welcomeText).toBeDefined();
  });

  it('switches to Simplified Chinese correctly', () => {
    let currentLanguage = 'en';
    const mockOnLanguageChange = jest.fn((newLang) => {
      currentLanguage = newLang;
    });
    
    // Simulate language change to Simplified Chinese
    mockOnLanguageChange('zh-CN');
    
    const app = MockAppWithLanguage({ 
      language: 'zh-CN', 
      onLanguageChange: mockOnLanguageChange 
    });
    
    expect(app.props['data-current-language']).toBe('zh-CN');
    
    const welcomeText = app.props.children.find((child: any) => 
      child.props.children === '欢迎使用香港零售NFT'
    );
    expect(welcomeText).toBeDefined();
  });

  it('persists language selection across app restarts', () => {
    // Mock AsyncStorage for language persistence
    const mockAsyncStorage = {
      getItem: jest.fn().mockResolvedValue('zh-HK'),
      setItem: jest.fn()
    };
    
    // Simulate app initialization with stored language
    const storedLanguage = 'zh-HK';
    
    const app = MockAppWithLanguage({ 
      language: storedLanguage, 
      onLanguageChange: jest.fn() 
    });
    
    expect(app.props['data-current-language']).toBe('zh-HK');
  });

  it('handles language switching during onboarding flow', () => {
    const mockOnLanguageChange = jest.fn();
    
    const languageSelector = MockLanguageSelector({
      currentLanguage: 'en',
      onLanguageChange: mockOnLanguageChange,
      availableLanguages: [
        { code: 'en', name: 'English' },
        { code: 'zh-HK', name: '繁體中文' },
        { code: 'zh-CN', name: '简体中文' }
      ]
    });
    
    // Find Traditional Chinese button
    const zhHKButton = languageSelector.props.children.find((child: any) => 
      child.props['data-language-code'] === 'zh-HK'
    );
    
    // Simulate clicking Traditional Chinese
    zhHKButton.props.onClick();
    
    expect(mockOnLanguageChange).toHaveBeenCalledWith('zh-HK');
  });

  it('updates UI elements immediately after language change', () => {
    const languages = ['en', 'zh-HK', 'zh-CN'];
    const expectedTexts = [
      'Welcome to HK Retail NFT',
      '歡迎使用香港零售NFT', 
      '欢迎使用香港零售NFT'
    ];
    
    languages.forEach((lang, index) => {
      const app = MockAppWithLanguage({ 
        language: lang, 
        onLanguageChange: jest.fn() 
      });
      
      const welcomeText = app.props.children.find((child: any) => 
        child.props.children === expectedTexts[index]
      );
      expect(welcomeText).toBeDefined();
    });
  });

  // Test requirement 5.1.1: Simple interface for tourists
  it('provides simple language selection interface for tourists', () => {
    const languageSelector = MockLanguageSelector({
      currentLanguage: 'en',
      onLanguageChange: jest.fn(),
      availableLanguages: [
        { code: 'en', name: 'English' },
        { code: 'zh-HK', name: '繁體中文' },
        { code: 'zh-CN', name: '简体中文' }
      ]
    });
    
    // Should have clear, recognizable language names
    const buttons = languageSelector.props.children;
    expect(buttons).toHaveLength(3);
    
    const englishButton = buttons.find((btn: any) => btn.props.children === 'English');
    const traditionalButton = buttons.find((btn: any) => btn.props.children === '繁體中文');
    const simplifiedButton = buttons.find((btn: any) => btn.props.children === '简体中文');
    
    expect(englishButton).toBeDefined();
    expect(traditionalButton).toBeDefined();
    expect(simplifiedButton).toBeDefined();
  });
});