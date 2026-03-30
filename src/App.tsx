import { NexisProjectProvider } from "@/app-state";
import { AppRoutes } from "@/presentation/app/AppRoutes";
import "@/index.css";

export function App() {
  return (
    <NexisProjectProvider>
      <AppRoutes />
    </NexisProjectProvider>
  );
}
