"use server";

import { and, eq } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import db from "@/db/drizzle";
import { POINTS_TO_REFILL } from "@/constants";
import { getCourseById, getUserProgress, getUserSubscription } from "@/db/queries";
import { challengeProgress, challenges, userProgress } from "@/db/schema";


export const upsertUserProgress = async(courseId: number) => {
    const { userId } = await auth();
    const user = await currentUser();

    // whenever working w server actions, behave like its an api call, thats why we use throw new error
    if(!userId || !user){       // If id or user is missing
        throw new Error("Unauthorized");
    }

    const course = await getCourseById(courseId);

    // If it was an api, it would be a 404
    if(!course){
        throw new Error("Course not found");
    }

    // throw new Error("Test")

    if(!course.units.length || !course.units[0].lessons.length){
        throw new Error("Course is empty");
    }

    const existingUserProgress = await getUserProgress();

    // if user already in a lesson
    //proactive updating of their name/profile just in case they have changed it, so that it is reflected 
    // when they got to a different page too(ex: leaderboard)
    if(existingUserProgress){
        await db.update(userProgress).set({
            activeCourseId: courseId,
            userName: user.firstName || "User",
            userImageSrc: user.imageUrl || "/mascot.svg",
        });
    //if it hits this, it wont have to go to insert.
        revalidatePath("/courses");
        revalidatePath("/learn");
        redirect("/learn");
    }

    await  db.insert(userProgress).values({
        userId,
        activeCourseId: courseId,
        userName: user.firstName || "User",
        userImageSrc: user.imageUrl || "/mascot.svg",
    });

    revalidatePath("/courses");
    revalidatePath("/learn");
    redirect("/learn");
};


export const reduceHearts = async (challengeId: number) => {
    const { userId } = await auth();

    if(!userId) {
        throw new Error("Unauthorized");
    }

    const currentUserProgress = await getUserProgress();
    const userSubscription = await getUserSubscription();

    const challenge = await db.query.challenges.findFirst({
        where: eq(challenges.id, challengeId),
    });

    if(!challenge) {
        throw new Error("Challenge not found");
    }

    const lessonId = challenge.lessonId;

    const existingChallengeProgress = await db.query.challengeProgress.findFirst({
        where: and(
            eq(challengeProgress.userId, userId),
            eq(challengeProgress.challengeId, challengeId),
        ),
    });

    // Front End, we are using initial percentage 100 to derive whether something is a practice or not.
    // Back End, we are using existingChallengeProgress state.
    const isPractice = !!existingChallengeProgress;

    if (isPractice) {       // is like an API response
        return { error: "practice" };               // Will prevent reduction of hearts
    }

    if (!currentUserProgress) {
        throw new Error("User Progress not found");
    }

    if(userSubscription?.isActive) {
        return { error: "subscription" };           // Will prevent reduction of hearts
    }

    if(currentUserProgress.hearts === 0) {          // Hearts ALREADY AT ZERO
        return { error: "hearts" };
    }

    await db.update(userProgress).set({         // Basically if hearts is already at 0, it will choose 0.
        hearts: Math.max(currentUserProgress.hearts - 1, 0),
    }).where(eq(userProgress.userId, userId));

    revalidatePath("/shop");
    revalidatePath("/learn");
    revalidatePath("/quests");
    revalidatePath("/leaderboard");
    revalidatePath(`/lesson/${lessonId}`);
};

export const refillHearts = async() => {
    const currentUserProgress = await getUserProgress();

    if(!currentUserProgress) {
        throw new Error("User progress not found");
    }

    if(currentUserProgress.hearts === 5) {
        throw new Error("Hearts are already full ");
    }

    if(currentUserProgress.points < POINTS_TO_REFILL) {
        throw new Error("Not enough points");
    }

    await db.update(userProgress).set({     // Telling Drizzle which schema to update( in imports )
        hearts: 5,
        points: currentUserProgress.points - POINTS_TO_REFILL,

    }).where(eq(userProgress.userId, currentUserProgress.userId));

    revalidatePath("/shop");
    revalidatePath("/learn");
    revalidatePath("/quests");
    revalidatePath("/leaderboard");

};