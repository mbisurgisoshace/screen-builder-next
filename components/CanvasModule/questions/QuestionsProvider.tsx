"use client";

import { createContext, useContext } from "react";
import { CardQuestions } from "@/lib/generated/prisma";

type Ctx = {
  questions: CardQuestions[];
};

const QuestionsContext = createContext<Ctx | null>(null);

type Props = {
  children: React.ReactNode;
  questions: CardQuestions[];
};

export const QuestionsProvider: React.FC<Props> = ({ children, questions }) => {
  return (
    <QuestionsContext.Provider value={{ questions }}>
      {children}
    </QuestionsContext.Provider>
  );
};

export function useQuestions() {
  const ctx = useContext(QuestionsContext);
  if (!ctx)
    throw new Error("useQuestions must be used within <QuestionsProvider>");
  return ctx;
}
