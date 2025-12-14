import type { Route } from "./+types/analytics";
import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import type { Project } from "~/db/schema";

interface AnalyticsData {
  totalProjects: number;
  totalTodos: number;
  completedTodos: number;
  projectsWithTodos: number;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Analytics" },
    { name: "description", content: "View project analytics" },
  ];
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalProjects: 0,
    totalTodos: 0,
    completedTodos: 0,
    projectsWithTodos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const projectsRes = await fetch("/api/projects");
      if (!projectsRes.ok) throw new Error("Failed to fetch projects");
      const projects: Project[] = await projectsRes.json();

      const todosRes = await fetch("/api/todos");
      if (!todosRes.ok) throw new Error("Failed to fetch todos");
      const todos: any[] = await todosRes.json();

      const projectsWithTodosList = new Set(todos.map((t) => t.projectId));

      setAnalytics({
        totalProjects: projects.length,
        totalTodos: todos.length,
        completedTodos: todos.filter((t) => t.completed).length,
        projectsWithTodos: projectsWithTodosList.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const completionRate =
    analytics.totalTodos > 0
      ? Math.round((analytics.completedTodos / analytics.totalTodos) * 100)
      : 0;

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Analytics</h1>
          <p className="text-gray-600">Overview of your projects and todos</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-600">Loading analytics...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">
                  Total Projects
                </h3>
                <BarChart3 className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-gray-800">
                {analytics.totalProjects}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">
                  Total Todos
                </h3>
                <BarChart3 className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-gray-800">
                {analytics.totalTodos}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">
                  Completed Todos
                </h3>
                <BarChart3 className="h-4 w-4 text-purple-500" />
              </div>
              <p className="text-3xl font-bold text-gray-800">
                {analytics.completedTodos}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">
                  Completion Rate
                </h3>
                <BarChart3 className="h-4 w-4 text-orange-500" />
              </div>
              <p className="text-3xl font-bold text-gray-800">
                {completionRate}%
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
