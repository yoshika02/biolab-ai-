import { ModuleWorkspace } from "@/components/dashboard/ModuleWorkspace";
import { getWorkspaceConfig } from "@/lib/dashboard-workspaces";

export default function AnalyticsPage() {
    return <ModuleWorkspace config={getWorkspaceConfig("analytics")} />;
}

