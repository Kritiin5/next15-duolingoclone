// Passing the props from ./page.tsx as initial data and then later
// will be modified through states thus a client component

"use client";

import { toast } from "sonner";
import Image from "next/image";
import Confetti from "react-confetti";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useAudio, useWindowSize, useMount } from "react-use";

import { reduceHearts } from "@/actions/user-progress";
import { useHeartsModal } from "@/store/use-hearts-modal";
import { usePracticeModal } from "@/store/use-practice-modal";
import { challengeOptions, challenges, userSubscription } from "@/db/schema";
import { upsertChallengeProgress } from "@/actions/challenge-progress";

import { Header } from "./header";
import { Footer } from "./footer";
import { Challenge } from "./challenge";
import { ResultCard } from "./result-card";
import { QuestionBubble } from "./question-bubble";

type Props = {
    initialPercentage: number;
    initialHearts: number;
    initialLessonId: number;
    initialLessonChallenges: (typeof challenges.$inferSelect & {
        completed: boolean,
        challengeOptions: typeof challengeOptions.$inferSelect[];
    })[];
    userSubscription: typeof userSubscription.$inferSelect & {
        isActive: boolean;

    } | null;

};

export const Quiz = ({
    initialPercentage,
    initialHearts,
    initialLessonId,
    initialLessonChallenges,
    userSubscription,
}: Props) => {

    const { open: openHeartsModal } = useHeartsModal();
    const { open: openPracticeModal } = usePracticeModal();

    // If already at 100 %, bring up the dialog
    useMount(() => {
        if(initialPercentage === 100) {
            openPracticeModal();
        }
    })

    const { width, height } = useWindowSize();

    const router = useRouter();

    const [finishAudio] = useAudio({src: "/finish.mp3", autoPlay: true});

    const [
        correctAudio,
        ,
        correctControls,
    ] = useAudio({ src: "/correct.wav" });
    const [
        incorrectAudio,
        ,
        incorrectControls,
    ] = useAudio({ src: "/incorrect.wav" });

    const [pending, startTransition] = useTransition();

    const [lessonId] = useState(initialLessonId);

    // Holding and synchronising hearts in the backend here using state
    const [hearts, setHearts] = useState(initialHearts);

    // If user already at 100 % meaning its a practice, pretend its at 0.
    const [percentage, setPercentage] = useState(() => {
        return initialPercentage === 100 ? 0 : initialPercentage
    });

    const [challenges] = useState(initialLessonChallenges); //Have to get current challenge to be able to get the title 'dynamically instead of hardcoding it'
    // Navigate to what challenge the user is currently on
    // activeIndex is loading the first in the array of challenges.
    const [activeIndex, setActiveIndex] = useState(() => {
        const uncompletedIndex  = challenges.findIndex((challenge) => !challenge.completed);
        return uncompletedIndex === -1 ? 0 : uncompletedIndex;   //load first challenge or uncompleted challenge
    });

    const [selectedOption, setSelectedOption] = useState<number>();

    const [status, setStatus] = useState<"correct" | "wrong" | "none">("none");    //by default none
    
    // To control which challenge is currently active
    // Same thing as being challenges[0] for beginning
    // CURRENT CHALLENGE:
    const challenge = challenges[activeIndex];
    const options = challenge?.challengeOptions ?? [];  

    const onNext = () => {
        setActiveIndex((current) => current + 1);
    };

    const onSelect = (id: number) => {
        // status none means the user has not submitted a choice. if status wrong or correct, it means it has been submitted. therefore need to retry. 
        // cant change their selection if status overall is correct.
        if(status != "none") return;

        setSelectedOption(id);
    }

    const onContinue = () => {
        if (!selectedOption) return;

        if (status == "wrong") {          // after giving "TRY AGAIN" the status will be set back to none.
            setStatus("none");
            setSelectedOption(undefined);
            return;
        }

        if (status == "correct") {          // after giving "NICELY DONE"
            onNext();                      // Load the next challenge
            setStatus("none");             // Set status back to none.
            setSelectedOption(undefined);
            return;
        }

        const correctOption = options.find((option) => option.correct);        // matches what we selected's id from the db to the correct option from the array's id.

        if (!correctOption) {      // if there is no correct option.
            return;
        }


        if (correctOption && correctOption.id === selectedOption){
            startTransition(() => {
                upsertChallengeProgress(challenge.id)
                    .then((response) => {
                    if (response?.error === "hearts") {
                        openHeartsModal();
                        return;
                    }

                    correctControls.play();
                    setStatus("correct");
                    setPercentage((prev) => prev + 100 / challenges.length);        // increment the per by one new completed challenge

                    // This is a practice
                    if (initialPercentage === 100) {
                        setHearts((prev) => Math.min(prev + 1, 5));
                    }
                })
                .catch(() => toast.error("Something went wrong. Please try again."))
            })
        } else {
            startTransition(() => {
                reduceHearts(challenge.id)
                    .then((response) => {
                        if(response?.error === "hearts"){       // HANDLING HEARTS ERROR HERE
                            openHeartsModal();
                            return;
                        }

                        incorrectControls.play();
                        setStatus("wrong")

                        if (!response?.error) {
                            // If error in subscrip or prac error no point reducing hearts in frontend.
                            // So only if I no longer get any errors in responses(userprogress.ts - 100, 108, 110 has been surpassed, and now in the backend -115, hearts are being reduced.)
                            // Thus have to reduce hearts in Front End too.
                            setHearts((prev) => Math.max(prev - 1, 0));
                        }
                    })
                     .catch(() => toast.error("Something went wrong. Please try again."))
            });
        }
    };

    if (!challenge) {
        return(
            <>
                {finishAudio}
                <Confetti
                    width={width}
                    height={height}
                    recycle={false}
                    numberOfPieces={500}
                    tweenDuration={5000}
                />
                <div className="flex flex-col gap-y-4 lg:gap-y-8 max-w-lg mx-auto text-center items-center justify-center h-full">
                    <Image
                        src= "/finish.svg"
                        alt= "Finish"
                        className="hidden lg:block"
                        height={100}
                        width={100}
                    />
                    <Image
                        src= "/finish.svg"
                        alt= "Finish"
                        className="block lg:hidden"
                        height={50}
                        width={50}
                    
                    />
                    <h1 className="text-xl lg:text-3xl font-bold text-neutral-700">
                        Great job! <br /> You&apos;ve completed the lesson.
                    </h1>
                    <div className="flex items-center gap-x-4 w-full">
                        <ResultCard
                            variant="points"
                            value={challenges.length * 10} 
    
                        />
                        <ResultCard
                            variant="hearts"
                            value={hearts} 
    
                        />
                    </div>

                </div>
                <Footer
                    lessonId={lessonId}
                    status="completed"
                    onCheck={() => router.push("/learn")}
                />
            </>
        );
    }
    const title = challenge.type === "ASSIST" 
    ? "Select the correct meaning"
    : challenge.question;

    return (
        <>
            {incorrectAudio}
            {correctAudio}

            <Header 
                hearts={hearts}
                percentage={percentage}
                hasActiveSubscription={!!userSubscription?.isActive}

            /> 
            {/* STUFF BELOW HEADER */}
            <div className="flex-1"> 
                <div className="h-full flex items-center justify-center">
                    <div className="lg:min-h-[350px] lg:w-[600px] w-full px-6 lg:px-0 flex flex-col gap-y-12">
                        <h1 className="text-lg lg:text-3xl text-center lg:text-start font-bold text-neutral-700">
                            {title}
                        </h1>
                        {/* CHALLENGE COMPONENT */}
                        <div>
                            {challenge.type === "ASSIST" && (
                                <QuestionBubble question={challenge.question}/>
                            )}
                            <Challenge 
                                options = {options}
                                onSelect={onSelect}
                                status = {status}
                                selectedOption = {selectedOption}
                                disabled = {pending}
                                type = {challenge.type}
                            
                            />

                        </div>

                    </div>

                </div>

            </div>
            <Footer
                disabled={pending || !selectedOption}
                status={status}
                onCheck={onContinue}
            
            />
        </>
    )

}