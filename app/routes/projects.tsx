import type { Route } from "./+types/projects";
import { useEffect, useState } from "react";
import { Plus, Folder } from "lucide-react";
import { Button } from "~/components/ui/button";
import { ProjectsTable } from "~/components/projects-table";
import type { Project } from "~/db/schema";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Projects" },
    { name: "description", content: "Manage your projects" },
  ];
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const addProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjectName,
          color: ["blue", "red", "green", "purple", "yellow"][
            Math.floor(Math.random() * 5)
          ],
        }),
      });

      if (!response.ok) throw new Error("Failed to add project");
      const newProject = await response.json();
      setProjects([...projects, newProject]);
      setNewProjectName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add project");
    }
  };

  const deleteProject = async (id: number) => {
    try {
      const response = await fetch("/api/projects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) throw new Error("Failed to delete project");
      setProjects(projects.filter((p) => p.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete project"
      );
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Projects</h1>
          <p className="text-gray-600">Organize your todos into projects</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={addProject} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Create a new project..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Button type="submit" className="px-6">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </form>

        {loading ? (
          <div className="text-center text-gray-600">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="text-center text-gray-600 py-12">
            <Folder className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">No projects yet. Create one to get started!</p>
          </div>
        ) : (
          <ProjectsTable projects={projects} onDelete={deleteProject} />
        )}
      </div>
    </div>
  );
}
