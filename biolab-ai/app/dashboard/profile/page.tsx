import { ModuleWorkspace } from "@/components/dashboard/ModuleWorkspace";
import { getWorkspaceConfig } from "@/lib/dashboard-workspaces";

export default function ProfilePage() {
    return <ModuleWorkspace config={getWorkspaceConfig("profile")} />;
}

