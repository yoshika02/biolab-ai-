import { ModuleWorkspace } from "@/components/dashboard/ModuleWorkspace";
import { getWorkspaceConfig } from "@/lib/dashboard-workspaces";

export default function PapersPage() {
    return <ModuleWorkspace config={getWorkspaceConfig("papers")} />;
}

