import { getCourses, getUserProgress } from "@/db/queries";
import { List } from "./list";

//is a server component
const CoursesPage = async () => {
    const coursesData =  getCourses();
    const userProgressData =  getUserProgress();
// good practice in nextjs docs.. maybe to prevent the waterfall issue?
// the network tab is not being blocked
    const [
        courses,
        userProgress,
    ] = await Promise.all([
        coursesData,
        userProgressData
    ]);

    return (
        <div className= "h-full max-w-[912px] px-3 mx-auto">
            <h1 className="text-2xl font-bold text-neutral-700"> 
             Languages Courses 
            </h1>
            <List 
            courses ={courses}
            activeCourseId={userProgress?.activeCourseId}
            />
        </div>
    );
};

export default CoursesPage;