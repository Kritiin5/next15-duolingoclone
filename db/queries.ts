import { cache } from "react";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

import db from "@/db/drizzle";
import { 
    challengeProgress,
    courses, 
    lessons, 
    units, 
    userProgress,
    userSubscription
} from "@/db/schema";


export const getUserProgress = cache(async () => {
    const { userId } = await auth();              // Gets the logged-in user's ID

    if(!userId){
        return null;
    }
    
   const data = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    with: {
        activeCourse: true,
    },
   });

   return data;
});

export const getUnits = cache(async () => {
    const { userId } = await auth();
    const userProgress = await getUserProgress();

    // no units to load if no progress yet
    if(!userId || !userProgress?.activeCourseId ){
        return [];
    }

    const data = await db.query.units.findMany({
        orderBy: (units, { asc }) => [asc(units.order)],
        where: eq(units.courseId, userProgress.activeCourseId),
        with: {
            lessons: {
                orderBy: (lessons, { asc }) => [asc(lessons.order)],
                with: {
                    challenges: {
                        orderBy: (challenges, { asc }) => [asc(challenges.order)],
                        with: {
                            challengeProgress: {
                                where: eq(
                                    challengeProgress.userId, 
                                    userId
                                ),
                            },
                        },
                    },
                },
            },
        },
    });

    // if every single challenge in this lesson has a matching challenge progress and is completed
    const normalizedData = data.map((unit) => {
        const lessonsWithCompletedStatus = unit.lessons.map((lesson) => {
            // If challenges(questions) in a lesson are 0 then return the whole lesson and completed status being false(and thus locked)
            if (
                lesson.challenges.length === 0
            ) {
                return { ...lesson, completed: false };
            }
            const allCompletedChallenges = lesson.challenges.every((challenge) => 
            {
                return challenge.challengeProgress
                 && challenge.challengeProgress.length > 0
                 && challenge.challengeProgress.every((progress) => progress.completed);
            });

            return { ...lesson, completed: allCompletedChallenges };
        })

        return { ...unit, lessons: lessonsWithCompletedStatus};
    });

    return normalizedData;

});



//caching it so that it doesnt call the db everytime
export const getCourses = cache(async () => {
    const data = await db.query.courses.findMany();

    return data;
});

export const getCourseById = cache(async (courseId: number) => {
    const data = await db.query.courses.findFirst({
        where: eq(courses.id, courseId),
        with: {
            units: {
                orderBy: (units, { asc }) => [asc(units.order)],
                with: {
                    lessons: {
                        orderBy: (lessons, { asc })=> [asc(lessons.order)],
                    },
                },
            },
        },
    });
    return data;
});

export const getCourseProgress = cache(async () => {
    const { userId } = await auth();
    const userProgress = await getUserProgress();

    if(!userId || !userProgress?.activeCourseId){
        return null;
    }

    const unitsInActiveCourse = await db.query.units.findMany({
        orderBy: (units, { asc }) =>[asc(units.order)],
        where: eq(units.courseId, userProgress.activeCourseId),
        with: {
            lessons: {
                orderBy: (lessons, { asc }) => [asc(lessons.order)],
                with: {
                    unit: true,
                    challenges: {
                        with: {
                            challengeProgress: {
                                where: eq(challengeProgress.userId, userId)
                            },
                        },
                    },
                },
            },
        },
    });

    const firstUncompletedLesson = unitsInActiveCourse
        .flatMap((unit) => unit.lessons)     // get individual unit and return unit.lessons
        .find((lesson) => {                  // find the lesson where some of its challenges are uncompleted
            return lesson.challenges.some((challenge) => {
                return !challenge.challengeProgress 
                || challenge.challengeProgress.length === 0  // never had any progress initiated
                || challenge.challengeProgress.some((progress) => progress.completed === false);    // have some progress but for some reason its false
            });
        });

    return {
        activeLesson: firstUncompletedLesson,
        activeLessonId: firstUncompletedLesson?.id,
    };
});

// We use this method when a user wants to practice
export const getLesson = cache(async (id?: number) => {
    const { userId } = await auth();

    if(!userId){
        return null;
    }
    const courseProgress = await getCourseProgress();

    const lessonId = id || courseProgress?.activeLessonId;

    if(!lessonId){
        return null;
    }

    const data = await db.query.lessons.findFirst({
        where: eq(lessons.id, lessonId),
        with: {
            challenges: {
                orderBy: (challenges, { asc }) => [asc(challenges.order)],
                with: {
                    challengeOptions: true,
                    challengeProgress: {
                        where: eq(challengeProgress.userId, userId),
                    },
                },
            },
        },
    });

    if(!data || !data.challenges){
        return null;
    }

    // Same as previous normalized data checks
    const normalizedChallenges = data.challenges.map((challenge) => {
        const completed = challenge.challengeProgress 
        && challenge.challengeProgress.length > 0
        && challenge.challengeProgress.every((progress) => progress.completed)

        return { ...challenge, completed };
    });

    return{ ...data, challenges: normalizedChallenges }
});

// This method should return a number
export const getLessonPercentage = cache(async() => {
    const courseProgress = await getCourseProgress();

    if(!courseProgress?.activeLessonId){
        return 0;
    }

    const lesson = await getLesson(courseProgress.activeLessonId);

    if(!lesson){
        return 0;
    }

    const completedChallenges = lesson.challenges.filter((challenge) => challenge.completed);
    // Basic percentage calculation
    const percentage = Math.round(
        (completedChallenges.length / lesson.challenges.length) * 100,
    );

    return percentage;
});

const DAY_IN_MS = 86_400_000;
export const getUserSubscription = cache(async() => {
    const { userId } = await auth();

    if(!userId) return null;

    const data = await db.query.userSubscription.findFirst({
        where: eq(userSubscription.userId, userId),
    });

    if (!data) return null;

    const isActive = 
    data.stripePriceId &&
    data.stripeCurrentPeriodEnd?.getTime()! + DAY_IN_MS > Date.now();           // If the subscription hasn’t expired yet 

    return {
        ...data,
        isActive: !!isActive,  // True or False
    }; 
});

export const getTopTenUsers = cache( async() => {
    const { userId } = await auth();

    if(!userId) {
        return [];
    }

    const data = await db.query.userProgress.findMany({
        orderBy: (userProgress, { desc }) => [desc(userProgress.points)],
        limit: 10,
        columns: {      // Columns is like SELECT in SQL
            userId: true,
            userName: true,
            userImageSrc: true,
            points: true,
        },
    });

    return data;
});