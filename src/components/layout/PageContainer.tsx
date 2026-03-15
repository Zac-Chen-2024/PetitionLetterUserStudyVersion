import type { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  wide?: boolean;
}

export default function PageContainer({ children, wide }: PageContainerProps) {
  return (
    <div className={`mx-auto px-6 py-8 ${wide ? 'max-w-7xl' : 'max-w-3xl'}`}>
      {children}
    </div>
  );
}
