import { signOut } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/shared/auth/session";

export const metadata = { title: "Sin acceso · Admin Home" };

export default async function NoAccessPage() {
  const user = await requireUser();

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sin acceso</CardTitle>
          <CardDescription>
            Tu cuenta ({user.email}) no pertenece a ningún hogar de Admin Home.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Esta cuenta existe en Supabase porque el proyecto se comparte con
            otras aplicaciones. Para entrar aquí necesitas que el dueño del hogar
            te agregue como miembro.
          </p>
          <form action={signOut}>
            <Button variant="outline" type="submit">
              Cerrar sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
