// Mock mode detection utility
// Enable by setting NEXT_PUBLIC_USE_MOCK_DATA=true in .env.local

export const isMockMode = (): boolean => {
  return process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
};
