// src/types/env.d.ts
declare global {
    namespace NodeJS {
      interface ProcessEnv {
        FIREBASE_PROJECT_ID: string;
        FIREBASE_CLIENT_EMAIL: string;
        FIREBASE_PRIVATE_KEY: string;
        [key: string]: string | undefined; // For any other environment variables
      }
    }
  }
  
  export {};