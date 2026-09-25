import { EditPostEditor } from "./components/edit-post-editor";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditPostPage({ params }: Readonly<PageProps>) {
  return <EditPostEditor params={params} />;
}
