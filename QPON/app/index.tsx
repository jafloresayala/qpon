import { Redirect } from "expo-router";
import { useAuth } from "@/hooks/useAuth";

export default function Index() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.role === "company") return <Redirect href="/(company)/dashboard" />;
  return <Redirect href="/(user)/scan" />;
}
