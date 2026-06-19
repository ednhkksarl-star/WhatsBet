import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ConversationDetailRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/dashboard/conversations?id=${id}`);
}
