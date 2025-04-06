import { getIsAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { ClientAppWrapper } from "./clientappwrapper";

const AdminPage = async () => {
  const isAdmin = await getIsAdmin();

  if (!isAdmin) {
    redirect("/");
  }

  return <ClientAppWrapper />;
};

export default AdminPage;
