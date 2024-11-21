export function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full overflow-auto">
      <div className="min-w-[800px]">
        {children}
      </div>
    </div>
  );
} 