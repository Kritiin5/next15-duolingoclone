"use client";
import dynamic from "next/dynamic";

// Dynamically import App only on the client
const App = dynamic(() => import("./app"), { ssr: false });

export const ClientAppWrapper = () => {
  return <App />;
};
