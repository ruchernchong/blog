import { EditSeriesEditor } from "./components/edit-series-editor";

interface EditSeriesPageProps {
  params: Promise<{ id: string }>;
}

export default function EditSeriesPage({ params }: EditSeriesPageProps) {
  return <EditSeriesEditor params={params} />;
}
