import type { Route } from "./+types/project-detail";
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { Plus, Check, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "~/components/ui/button";
import type { Project, Todo } from "~/db/schema";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Project` },
    { name: "description", content: "View and manage project todos" },
  ];
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjectAndTodos();
  }, [id]);

  const fetchProjectAndTodos = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch all projects and find the one with matching id
      const projectsRes = await fetch("/api/projects");
      if (!projectsRes.ok) throw new Error("Failed to fetch projects");
      const allProjects = await projectsRes.json();
      const currentProject = allProjects.find(
        (p: Project) => p.id === parseInt(id)
      );

      if (!currentProject) {
        throw new Error("Project not found");
      }

      setProject(currentProject);

      // Fetch todos for this project
      const todosRes = await fetch(`/api/todos?projectId=${id}`);
      if (!todosRes.ok) throw new Error("Failed to fetch todos");
      const projectTodos = await todosRes.json();
      setTodos(projectTodos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim() || !id) return;

    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: parseInt(id),
          title: newTodoTitle,
          priority: "medium",
        }),
      });

      if (!response.ok) throw new Error("Failed to add todo");
      const newTodo = await response.json();
      setTodos([...todos, newTodo]);
      setNewTodoTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add todo");
    }
  };

  const toggleTodo = async (todo: Todo) => {
    try {
      const response = await fetch("/api/todos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: todo.id,
          completed: !todo.completed,
        }),
      });

      if (!response.ok) throw new Error("Failed to update todo");
      const updatedTodo = await response.json();
      setTodos(todos.map((t) => (t.id === updatedTodo.id ? updatedTodo : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update todo");
    }
  };

  const deleteTodo = async (todoId: number) => {
    try {
      const response = await fetch("/api/todos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: todoId }),
      });

      if (!response.ok) throw new Error("Failed to delete todo");
      setTodos(todos.filter((t) => t.id !== todoId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete todo");
    }
  };

  const colorClasses: Record<string, string> = {
    blue: "bg-blue-100",
    red: "bg-red-100",
    green: "bg-green-100",
    purple: "bg-purple-100",
    yellow: "bg-yellow-100",
  };

  const priorityColors: Record<string, string> = {
    low: "bg-blue-100 text-blue-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800",
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="text-center text-gray-600">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 md:p-8">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Project not found</p>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-block mb-6">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>

        <div
          className={`rounded-lg p-6 mb-8 ${
            colorClasses[project.color as keyof typeof colorClasses] ||
            "bg-slate-100"
          }`}
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            {project.name}
          </h1>
          {project.description && (
            <p className="text-gray-600">{project.description}</p>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={addTodo} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              placeholder="Add a new todo..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Button type="submit">
              <Plus className="h-4 w-4 mr-2" />
              Add Todo
            </Button>
          </div>
        </form>

        {todos.length === 0 ? (
          <div className="text-center text-gray-600 py-12">
            <p className="text-lg">No todos yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 flex items-center gap-3"
              >
                <button
                  onClick={() => toggleTodo(todo)}
                  className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                    todo.completed
                      ? "bg-green-500 border-green-500"
                      : "border-gray-300 hover:border-green-500"
                  }`}
                >
                  {todo.completed && <Check size={16} className="text-white" />}
                </button>

                <div className="flex-1">
                  <span
                    className={`text-lg ${
                      todo.completed
                        ? "text-gray-400 line-through"
                        : "text-gray-800"
                    }`}
                  >
                    {todo.title}
                  </span>
                  {todo.description && (
                    <p className="text-sm text-gray-500">{todo.description}</p>
                  )}
                </div>

                {todo.priority && (
                  <span
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      priorityColors[
                        todo.priority as keyof typeof priorityColors
                      ]
                    }`}
                  >
                    {todo.priority}
                  </span>
                )}

                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="flex-shrink-0 p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 pt-6 border-t text-sm text-gray-600">
          <p>
            {todos.filter((t) => !t.completed).length} of {todos.length} tasks
            completed
          </p>
        </div>
      </div>
    </div>
  );
}
