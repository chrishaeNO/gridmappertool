export const firebaseConfig = {
  "projectId": process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "studio-4185501298-2cd1f",
  "appId": process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:817659998277:web:ecb942320212e56faf332c",
  "apiKey": process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  "authDomain": process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "studio-4185501298-2cd1f.firebaseapp.com",
  "measurementId": process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
  "messagingSenderId": process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "817659998277"
};

// Validate that required API key is present
if (!firebaseConfig.apiKey) {
  throw new Error('NEXT_PUBLIC_FIREBASE_API_KEY environment variable is required');
}
