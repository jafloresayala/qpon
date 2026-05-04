// The root navigator in _layout.tsx handles all auth-based redirects.
// This page just provides the entry-point redirect to avoid a blank screen
// on static hosting (e.g. Render, Vercel) while the JS bundle loads.
import { Redirect } from "expo-router";

export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
