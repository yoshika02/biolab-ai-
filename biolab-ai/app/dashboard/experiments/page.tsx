import { ModuleWorkspace } from "@/components/dashboard/ModuleWorkspace";
import { getWorkspaceConfig } from "@/lib/dashboard-workspaces";

export default function ExperimentsPage() {
    return <ModuleWorkspace config={getWorkspaceConfig("experiments")} />;
}

