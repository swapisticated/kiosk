
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* <SidebarDock /> */}
      <main className="flex-1  p-6 md:p-10 max-w-[1800px] w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
