import { getCurrentUser } from "@/app/actions";
import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/");

  return (
    <div className="p-6 pb-24 min-h-screen flex flex-col">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your profile and security.</p>
      </div>

      <ProfileClient currentUser={currentUser} />
    </div>
  );
}
