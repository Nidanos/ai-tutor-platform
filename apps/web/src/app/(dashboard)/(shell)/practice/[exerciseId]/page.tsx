import PracticeScreen from "@/features/learning/PracticeScreen";

type Props = { params: Promise<{ exerciseId: string }> };

export default async function ExercisePage({ params }: Props) {
  const { exerciseId } = await params;
  return <PracticeScreen exerciseId={exerciseId} />;
}
