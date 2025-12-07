import { AppProvider } from '@/context/AppContext';
import { PracticeApp } from '@/components';

export default function Home() {
  return (
    <AppProvider>
      <PracticeApp />
    </AppProvider>
  );
}
