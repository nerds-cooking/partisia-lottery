import { useAuth } from "@/components/providers/auth/useAuth";
import { usePartisia } from "@/components/providers/partisia/usePartisia";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "lucide-react";

export function AuthPageWrapper({ children }: { children: React.ReactNode }) {
  const { sdk } = usePartisia();
  const { loading, login, isAuthenticated, authenticating, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg font-semibold">Loading...</p>
      </div>
    );
  }

  if (!sdk?.isConnected) {
    return (
      <div className="flex items-center justify-center flex-col">
        <p className="text-lg font-semibold">
          Connect your wallet to get started!
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center flex-col">
        <p className="text-lg font-semibold mb-6">Login to continue</p>
        <Button
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold text-lg py-6 rounded-full shadow-lg transition-transform hover:scale-105"
          disabled={authenticating}
          variant="outline"
          onClick={() => {
            login()
              .then(() => {
                console.log("Login successful");
              })
              .catch((err) => {
                console.error("Login error:", err);
              });
          }}
        >
          {authenticating && <Loader2 className="animate-spin" />}
          Login
        </Button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {children}
      {/* Floating Logout Button */}
      <Button
        variant="ghost"
        onClick={logout}
        className="absolute top-0 right-6 flex items-center space-x-2 mb-8"
      >
        <LogOut />
      </Button>
    </div>
  );
}
