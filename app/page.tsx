import { getChatGPTUser } from "./chatgpt-auth";
import CampusPortal from "./campus-portal";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();
  return <CampusPortal viewer={{ name: user?.fullName ?? "Pranav Iyer", email: user?.email ?? "pranav.iyer@university.edu", authenticated: Boolean(user) }} />;
}
