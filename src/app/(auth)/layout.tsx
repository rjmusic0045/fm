/** Auth pages render their own full-screen scene (no marketing navbar/footer). */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="theme-dark relative bg-background text-foreground">
      {children}
    </main>
  );
}
