import LearnScreen from "@/features/learning/LearnScreen";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// ?skill=<skill name> (from the top bar's search) opens that skill's lesson.
export default async function LearnPage({ searchParams }: Props) {
  const { skill } = await searchParams;
  return <LearnScreen skill={typeof skill === "string" ? skill : undefined} />;
}
