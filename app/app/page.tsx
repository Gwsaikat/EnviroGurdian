'use client';

// This file serves as the main app entry point at the /app route
import { useEffect } from 'react';
import { EnvironmentProvider } from '@/contexts/environment-context';
import HomeContent from '../page';

export default function AppPage() {
  // Add any app-specific initialization here
  useEffect(() => {
    // Log navigation to the main app
    console.log('Main app loaded at /app route');
  }, []);

  return (
    <EnvironmentProvider>
      <HomeContent />
    </EnvironmentProvider>
  );
}