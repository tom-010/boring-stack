import { db } from '~/db/client';
import { todos } from '~/db/schema';
import { eq } from 'drizzle-orm';
import type { Route } from './+types/api.todos';

export const loader = async ({ request }: Route.LoaderArgs) => {
  if (request.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');

    let query = db.query.todos.findMany();
    if (projectId) {
      const id = parseInt(projectId);
      const allTodos = await db.query.todos.findMany({
        where: (todos, { eq }) => eq(todos.projectId, id),
      });
      return Response.json(allTodos);
    }

    const allTodos = await query;
    return Response.json(allTodos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    return Response.json({ error: 'Failed to fetch todos' }, { status: 500 });
  }
};

export const action = async ({ request }: Route.ActionArgs) => {
  try {
    if (request.method === 'POST') {
      const formData = await request.json();
      const { projectId, title, description, priority, dueDate } = formData;

      if (!projectId || typeof projectId !== 'number') {
        return Response.json({ error: 'Project ID is required' }, { status: 400 });
      }

      if (!title || typeof title !== 'string') {
        return Response.json({ error: 'Title is required' }, { status: 400 });
      }

      const newTodo = await db
        .insert(todos)
        .values({
          projectId,
          title,
          description: description || null,
          completed: false,
          priority: priority || 'medium',
          dueDate: dueDate || null,
        })
        .returning();

      return Response.json(newTodo[0], { status: 201 });
    }

    if (request.method === 'PUT') {
      const formData = await request.json();
      const { id, title, description, completed, priority, dueDate } = formData;

      if (!id || typeof id !== 'number') {
        return Response.json({ error: 'ID is required' }, { status: 400 });
      }

      const updatedTodo = await db
        .update(todos)
        .set({
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(completed !== undefined && { completed }),
          ...(priority !== undefined && { priority }),
          ...(dueDate !== undefined && { dueDate }),
        })
        .where(eq(todos.id, id))
        .returning();

      if (updatedTodo.length === 0) {
        return Response.json({ error: 'Todo not found' }, { status: 404 });
      }

      return Response.json(updatedTodo[0]);
    }

    if (request.method === 'DELETE') {
      const formData = await request.json();
      const { id } = formData;

      if (!id || typeof id !== 'number') {
        return Response.json({ error: 'ID is required' }, { status: 400 });
      }

      const deletedTodo = await db
        .delete(todos)
        .where(eq(todos.id, id))
        .returning();

      if (deletedTodo.length === 0) {
        return Response.json({ error: 'Todo not found' }, { status: 404 });
      }

      return Response.json(deletedTodo[0]);
    }

    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error('Action error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
};
