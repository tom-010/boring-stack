import { Form, useActionData, useNavigation } from "react-router"
import { Bug } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { helloHiGet, greetPersonGreetPost } from "~/lib/py/client"
import { requireAuth } from "~/lib/auth.server"
import type { Route } from "./+types/debug-py"

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request)
  return {}
}

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request)
  const formData = await request.formData()
  const intent = formData.get("intent")

  if (intent === "hi") {
    const res = await helloHiGet()
    return { intent: "hi", result: res }
  }

  if (intent === "greet") {
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const res = await greetPersonGreetPost({
      body: { first_name: firstName, last_name: lastName },
    })
    return { intent: "greet", result: res }
  }

  return { error: "Unknown intent" }
}

export default function DebugPyPage() {
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === "submitting"
  const currentIntent = navigation.formData?.get("intent")

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Bug className="size-6" />
        <h1 className="text-2xl font-bold">Python Bridge Debug</h1>
      </div>
      <p className="text-muted-foreground">
        Test page for the Python-TypeScript bridge. Calls are made server-side
        via actions.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>GET /hi</CardTitle>
          <CardDescription>Simple health check</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form method="post">
            <input type="hidden" name="intent" value="hi" />
            <Button type="submit" disabled={isSubmitting && currentIntent === "hi"}>
              {isSubmitting && currentIntent === "hi" ? "Loading..." : "Call /hi"}
            </Button>
          </Form>
          {actionData?.intent === "hi" && (
            <pre className="bg-muted p-4 rounded text-sm overflow-auto">
              {JSON.stringify(actionData.result, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>POST /greet</CardTitle>
          <CardDescription>Greet a person (typed RPC call)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form method="post" className="space-y-4">
            <input type="hidden" name="intent" value="greet" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" name="firstName" defaultValue="John" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" name="lastName" defaultValue="Doe" />
              </div>
            </div>
            <Button type="submit" disabled={isSubmitting && currentIntent === "greet"}>
              {isSubmitting && currentIntent === "greet" ? "Loading..." : "Call /greet"}
            </Button>
          </Form>
          {actionData?.intent === "greet" && (
            <pre className="bg-muted p-4 rounded text-sm overflow-auto">
              {JSON.stringify(actionData.result, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
