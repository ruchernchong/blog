import { EditPostForm } from "./_components/edit-post-form";

const EditPostPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  return <EditPostForm postId={id} />;
};

export default EditPostPage;
