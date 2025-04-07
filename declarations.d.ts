declare module '*.json' {
  const value: any;
  export default value;
}

// Add proper types for i18next
declare module 'i18next' {
  export interface i18n {
    use(module: any): i18n;
    changeLanguage(lng: string): Promise<any>;
    language: string;
    dir(): string;
  }
  
  // Add use method to the default export
  const i18next: {
    use(module: any): typeof i18next;
  } & i18n;
  
  export default i18next;
} 