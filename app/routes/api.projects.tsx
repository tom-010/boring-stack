import { db } from '~/db/client';
import { projects } from '~/db/schema';
import { eq } from 'drizzle-orm';
import type { Route } from './+types/api.projects';

export const loader = async ({ request }: Route.LoaderArgs) => {
  if (request.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const allProjects = await db.query.projects.findMany();
    return Response.json(allProjects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return Response.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
};

export const action = async ({ request }: Route.ActionArgs) => {
  try {
    if (request.method === 'POST') {
      const formData = await request.json();
      const { name, description, color } = formData;

      if (!name || typeof name !== 'string') {
        return Response.json({ error: 'Name is required' }, { status: 400 });
      }

      const newProject = await db
        .insert(projects)
        .values({
          name,
          description: description || null,
          color: color || 'blue',
        })
        .returning();

      return Response.json(newProject[0], { status: 201 });
    }

    if (request.method === 'PUT') {
      const formData = await request.json();
      const { id, name, description, color } = formData;

      if (!id || typeof id !== 'number') {
        return Response.json({ error: 'ID is required' }, { status: 400 });
      }

      const updatedProject = await db
        .update(projects)
        .set({
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(color !== undefined && { color }),
        })
        .where(eq(projects.id, id))
        .returning();

      if (updatedProject.length === 0) {
        return Response.json({ error: 'Project not found' }, { status: 404 });
      }

      return Response.json(updatedProject[0]);
    }

    if (request.method === 'DELETE') {
      const formData = await request.json();
      const { id } = formData;

      if (!id || typeof id !== 'number') {
        return Response.json({ error: 'ID is required' }, { status: 400 });
      }

      const deletedProject = await db
        .delete(projects)
        .where(eq(projects.id, id))
        .returning();

      if (deletedProject.length === 0) {
        return Response.json({ error: 'Project not found' }, { status: 404 });
      }

      return Response.json(deletedProject[0]);
    }

    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error('Action error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
};
