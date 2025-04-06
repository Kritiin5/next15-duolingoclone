// is a client component, so no need to put it in 
// card.tsx too because it wont magically become a 
// server component

//fun fact: can pass server components inside client comps done through children props

// marked it use client because of some interactive onclicks here
"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { courses, userProgress } from "@/db/schema";
import { upsertUserProgress } from "@/actions/user-progress";

import { Card } from "./card";

type Props = {
    courses: typeof courses.$inferSelect[];
    //marking as an optional prop
    activeCourseId?: typeof userProgress.$inferSelect.activeCourseId;
};

export const List = ({ courses, activeCourseId }: Props) => {
    const router = useRouter();
    //help to use server action and its pending state
    const [pending, startTransition] = useTransition();

    const onClick = (id: number) => {
        if (pending) return;


        //if clicking on a course which is currently the active course id, no need to do db update
        if (id === activeCourseId) {
            return router.push("/learn");
        }

        //if user is selecting a new course
        startTransition(() => {
            upsertUserProgress(id)
                .catch(() => toast.error("Something went wrong"));
        });
    };

    return (
        <div className="pt-6 grid grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4">
            {courses.map((course) => (
                <Card 
                key={course.id}
                id={course.id}
                title={course.title}
                imageSrc={course.imageSrc}
                onClick={onClick}
                disabled={pending}
                active={course.id === activeCourseId}
                />
            ))}
        </div>
    );
}
