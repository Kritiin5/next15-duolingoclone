import { getLesson, getUserProgress, getUserSubscription } from "@/db/queries";
import { redirect } from "next/navigation";
import { Quiz } from "../quiz";

type Props = {
    params: Promise<{ lessonId: string }>;
};

const LessonIdPage = async ({ params }: Props) => {
    const { lessonId } = await params;
    const lessonIdNumber = parseInt(lessonId, 10);

    const [lesson, userProgress, userSubscription] = await Promise.all([
        getLesson(lessonIdNumber),
        getUserProgress(),
        getUserSubscription(),
    ]);

    if (!lesson || !userProgress) {
        redirect("/learn");
    }

    const initialPercentage = (lesson.challenges.filter((challenge) => challenge.completed).length / lesson.challenges.length) * 100;

    return (
        <Quiz
            initialLessonId={lesson.id}
            initialLessonChallenges={lesson.challenges}
            initialHearts={userProgress.hearts}
            initialPercentage={initialPercentage}
            userSubscription={userSubscription}
        />
    );
};

export default LessonIdPage;
