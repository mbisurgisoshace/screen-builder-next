"use client";

import { createContext, useContext } from "react";
import { CardQuestions } from "@/lib/generated/prisma";

type Ctx = {
  segments: any[];
  questions: CardQuestions[];
};

const QuestionsContext = createContext<Ctx | null>(null);

type Props = {
  segments: any[];
  children: React.ReactNode;
  questions: CardQuestions[];
};

export const QuestionsProvider: React.FC<Props> = ({
  children,
  questions,
  segments,
}) => {
  return (
    <QuestionsContext.Provider value={{ segments, questions }}>
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
