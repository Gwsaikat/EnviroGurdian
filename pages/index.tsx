import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

// Import the LandingPage CSS
import '../../LandingPage/src/index.css';

// Dynamically import the LandingPage component with no SSR to avoid hydration issues
const LandingPage = dynamic(
  () => import('../../LandingPage/src/LandingPageWrapper').then((mod) => mod.default),
  { ssr: false }
);

export default function Home() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // This ensures the component only renders on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle navigation to the main app
  const handleGetStarted = () => {
    router.push('/app');
  };

  if (!isClient) {
    return null; // Return nothing during SSR
  }

  return <LandingPage onGetStarted={handleGetStarted} />;
}